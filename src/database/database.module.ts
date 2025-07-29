import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { models } from './models';
import { TasksRepository } from './tasks/tasks.repository';
import { TaskLogsRepository } from './tasks/task-logs.repository';

@Module({
  imports: [MongooseModule.forFeature(models)],
  providers: [TasksRepository, TaskLogsRepository],
  exports: [MongooseModule, TasksRepository, TaskLogsRepository],
})
export class DatabaseModule {}
