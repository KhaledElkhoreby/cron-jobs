import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Task, TaskStatus } from 'src/database/tasks';
import { TasksRepository } from 'src/database/tasks/tasks.repository';
import { TaskLogsService } from './task-logs.service';

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);
  private readonly dynamicJobs = new Map<string, CronJob>();

  constructor(
    private tasksRepository: TasksRepository,
    private schedulerRegister: SchedulerRegistry,
    private taskLogsService: TaskLogsService,
  ) {}

  async onModuleInit() {
    await this.initializeDynamicTasks();
  }

  // --- Mongoose CRUD Operations for Tasks ---

  async createTask(task: Partial<Task>): Promise<Task> {
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

  async updateTask(id: string, update: Partial<Task>): Promise<Task | null> {
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
      this.dynamicJobs.delete(taskId);
      this.logger.log(`Stopped and deleted dynamic task: ${jobName}`);
    } else {
      this.logger.warn(`No dynamic task found with name: ${jobName} to stop.`);
    }
  }

  private executeTaskAction(task: Task) {
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
      case 'DB_CLEANUP':
        this.logger.log(
          `Task Action: Performing database cleanup for collection ${task.payload?.collectionName}`,
        );
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
      const currentTask = this.dynamicJobs.get(taskId);
      if (currentTask) {
        update.nextRunAt = currentTask.nextDates(1)[0]?.toJSDate();
      }
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

    const job = new CronJob(
      task.cronExpression,
      async () => {
        const startTime = process.hrtime.bigint(); // Start timer for duration

        this.logger.log(`Executing dynamic task "${task.name}" (${jobName})`);
        try {
          this.executeTaskAction(task);
          await this.updateTaskStatus(taskId, TaskStatus.COMPLETED);

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
        }
      },
      null,
      true,
      'Africa/Cairo',
    );

    this.schedulerRegister.addCronJob(jobName, job);
    this.dynamicJobs.set(taskId, job);
    this.logger.log(
      `Scheduled dynamic task "${task.name}" (${jobName}) for "${task.cronExpression}"`,
    );
  }

  async initializeDynamicTasks() {
    this.logger.log('Initializing dynamic tasks from database...');
    const activeTasks = await this.tasksRepository.findAll({ isActive: true });

    for (const task of activeTasks) {
      this.scheduleDynamicTask(task);
    }

    this.logger.log(`Initialized ${activeTasks.length} dynamic tasks.`);
  }
}
