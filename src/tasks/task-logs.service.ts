import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { TaskStatus } from 'src/database/tasks';
import { TaskLog } from 'src/database/tasks/schemas/task-log.schema';
import { TaskLogsRepository } from 'src/database/tasks/task-logs.repository';

@Injectable()
export class TaskLogsService {
  private readonly logger = new Logger(TaskLogsService.name);

  constructor(private readonly taskLogsRepository: TaskLogsRepository) {}

  async createLog(
    taskId: string,
    taskName: string,
    status: TaskStatus,
    errorMessage?: string,
    durationMs?: number,
  ): Promise<TaskLog> {
    const newLog = await this.taskLogsRepository._model.create({
      taskId,
      taskName,
      status,
      errorMessage,
      durationMs,
      executedAt: new Date(),
    });

    this.logger.log(`Created log for task: ${taskName} with status: ${status}`);
    return newLog;
  }

  async findLogsForTask(taskId: string): Promise<TaskLog[]> {
    return this.taskLogsRepository._model
      .find({
        taskId: new Types.ObjectId(taskId),
      })
      .sort({ executedAt: -1 })
      .exec();
  }

  async findAllLogs(): Promise<TaskLog[]> {
    return this.taskLogsRepository._model
      .find()
      .sort({ executedAt: -1 })
      .exec();
  }
}
