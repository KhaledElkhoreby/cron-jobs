import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { models } from './models';
import { TasksRepository } from './tasks/tasks.repository';

@Module({
  imports: [MongooseModule.forFeature(models)],
  providers: [TasksRepository],
  exports: [MongooseModule, TasksRepository],
})
export class DatabaseModule {}
