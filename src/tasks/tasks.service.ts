import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import mongoose from 'mongoose';
import { Task, TaskStatus } from 'src/database/tasks';
import { TasksRepository } from 'src/database/tasks/tasks.repository';
import { TaskLogsService } from './task-logs.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private tasksRepository: TasksRepository,
    private schedulerRegister: SchedulerRegistry,
    private taskLogsService: TaskLogsService,
  ) {}

  async onModuleInit() {
    await this.initializeDynamicTasks();
  }

  // --- Mongoose CRUD Operations for Tasks ---

  async createTask(task: CreateTaskDto): Promise<Task> {
    const newTask = await this.tasksRepository._model.create(task);
    this.logger.log(`Created new task: ${newTask.name}`);
    this.scheduleDynamicTask(newTask);
    return newTask;
  }

  async findAllTasks(): Promise<Task[]> {
    return this.tasksRepository._model.find().exec();
  }

  async findTaskById(taskId: string): Promise<Task | null> {
    return this.tasksRepository._model.findById(taskId).exec();
  }

  async updateTask(id: string, update: UpdateTaskDto): Promise<Task | null> {
    const updatedTask = await this.tasksRepository._model
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (updatedTask) {
      this.logger.log(`Updated task: ${updatedTask.name}`);
      this.stopDynamicTask(updatedTask?._id?.toString() as string);
      if (updatedTask.isActive) {
        this.scheduleDynamicTask(updatedTask);
      }
    }
    return updatedTask;
  }

  async deleteTask(id: string): Promise<Task | null> {
    const deletedTask = await this.tasksRepository._model
      .findByIdAndDelete(id)
      .exec();

    if (deletedTask) {
      this.logger.log(`Deleted task: ${deletedTask.name}`);
      this.stopDynamicTask(deletedTask._id?.toString() as string);
    }
    return deletedTask;
  }

  // --- Dynamic Cron Jobs Management ---

  private stopDynamicTask(taskId: string) {
    const jobName = `dynamic-task-${taskId}`;
    if (this.schedulerRegister.doesExist('cron', jobName)) {
      this.schedulerRegister.deleteCronJob(jobName);
      this.logger.log(`Stopped and deleted dynamic task: ${jobName}`);
    } else if (this.schedulerRegister.doesExist('timeout', jobName)) {
      this.schedulerRegister.deleteTimeout(jobName);
      this.logger.log(
        `Dynamic one-time task "${jobName}" stopped and removed.`,
      );
    } else {
      this.logger.warn(`No dynamic task found with name: ${jobName} to stop.`);
    }
  }

  private async executeTaskAction(task: Task) {
    switch (task.actionType) {
      case 'LOG_MESSAGE':
        this.logger.log(
          `Task Action: ${task.payload?.message || 'No message provided'}`,
        );
        break;
      case 'SEND_EMAIL':
        this.logger.log(
          `Task Action: Sending email to ${task.payload?.recipient} with message: ${task.payload?.message}`,
        );
        break;
      case 'WEBHOOK_CALL':
        this.logger.log(`Task Action: Calling webhook ${task.payload?.url}`);
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const response = await fetch(task.payload.url, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            method: task.payload.method || 'POST',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            headers: task.payload.headers || {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(task.payload.body || {}),
          });
          if (!response.ok) {
            throw new Error(
              `Webhook call failed with status: ${response.status}`,
            );
          }
          this.logger.log(
            `Webhook call successful: ${response.status} ${response.statusText}`,
          );
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          this.logger.error(`Webhook call failed: ${error.message}`);
          throw error;
        }
        break;
      default:
        this.logger.warn(
          `Unknown action type "${task.actionType}" for task "${task.name}"`,
        );
        throw new Error(`Unknown action type "${task.actionType}"`);
    }
  }

  private async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    errorMessage?: string,
  ) {
    const update: Partial<Task> = { status, lastRunAt: new Date() };

    if (errorMessage) {
      update.lastRunStatus = errorMessage;
    } else {
      update.lastRunStatus =
        status === TaskStatus.CANCELLED ? 'Success' : 'Failed';
    }

    try {
      //
    } catch (error: any) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Could not calculate next run time for task ${taskId}: ${error?.message as unknown as string}`,
      );
    }

    await this.tasksRepository._model.findByIdAndUpdate(taskId, update).exec();
  }

  private scheduleDynamicTask(task: Task) {
    const taskId = task?._id?.toString() as string;
    const jobName = `dynamic-task-${taskId}`;

    if (this.schedulerRegister.doesExist('cron', jobName)) {
      this.stopDynamicTask(taskId);
    }

    const taskCallback = async () => {
      const startTime = process.hrtime.bigint(); // Start timer for duration

      this.logger.log(`Executing dynamic task "${task.name}" (${jobName})`);
      try {
        this.executeTaskAction(task);
        await this.updateTaskStatus(taskId, TaskStatus.COMPLETED);

        // For one-time task, deactivate after completion
        if (task.executionTime) {
          await this.tasksRepository._model
            .findByIdAndUpdate(new mongoose.Types.ObjectId(taskId), {
              isActive: false,
              status: TaskStatus.COMPLETED,
            })
            .exec();
          this.stopDynamicTask(taskId);
        } else {
          await this.updateTaskStatus(taskId, TaskStatus.COMPLETED);
        }

        const endTime = process.hrtime.bigint(); // End timer for duration
        const durationMs = Number(endTime - startTime) / 1_000_000;

        await this.taskLogsService.createLog(
          taskId,
          task.name,
          TaskStatus.COMPLETED,
          undefined,
          durationMs,
        );
      } catch (error) {
        const endTime = process.hrtime.bigint(); // End timer for duration
        const durationMs = Number(endTime - startTime) / 1_000_000;

        this.logger.error(
          `Error executing task "${task.name}" (${jobName}):`,
          error,
        );
        await this.updateTaskStatus(
          taskId,
          TaskStatus.FAILED,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          error?.message as unknown as string,
        );

        await this.taskLogsService.createLog(
          taskId,
          task.name,
          TaskStatus.FAILED,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          error?.message as unknown as string,
          durationMs,
        );

        // For one-time task, deactivate after failure
        if (task.executionTime) {
          await this.tasksRepository._model
            .findOneAndUpdate(new mongoose.Types.ObjectId(taskId), {
              isActive: false,
            })
            .exec();
        }
      }
    };

    // Check if it's a cron job or a one-time task
    if (task.cronExpression) {
      const job = new CronJob(
        task.cronExpression,
        taskCallback,
        null,
        true,
        task.timezone,
      );
      this.schedulerRegister.addCronJob(jobName, job);
      this.logger.log(
        `Scheduled dynamic task "${task.name}" (${jobName}) for "${task.cronExpression}"`,
      );
    } else if (task.executionTime) {
      // Calculate delay in milliseconds
      const delay =
        new Date(task.executionTime).getTime() - new Date().getTime();
      if (delay > 0) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const timeout = setTimeout(taskCallback, delay);
        this.schedulerRegister.addTimeout(jobName, timeout);
        this.logger.log(
          `Dynamic one-time task "${jobName}" scheduled to run at ${task.executionTime.toISOString()}`,
        );
      } else {
        // If the time is in the past, execute immediately and deactivate
        this.logger.warn(
          `One-time task "${jobName}" execution time is in the past. Executing now.`,
        );
        void taskCallback();
      }
    }

    // this.dynamicJobs.set(taskId, job);
  }

  async initializeDynamicTasks() {
    this.logger.log('Initializing dynamic tasks from database...');
    const activeTasks = await this.tasksRepository._model
      .find({ isActive: true })
      .sort({ priority: -1 })
      .exec();

    for (const task of activeTasks) {
      this.scheduleDynamicTask(task);
    }

    this.logger.log(`Initialized ${activeTasks.length} dynamic tasks.`);
  }
}
