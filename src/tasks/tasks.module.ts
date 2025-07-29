import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { DatabaseModule } from 'src/database/database.module';
import { TasksController } from './tasks.controller';
import { TaskLogsService } from './task-logs.service';

@Module({
  imports: [DatabaseModule],
  providers: [TasksService, TaskLogsService],
  exports: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
