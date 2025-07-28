import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from 'src/database/tasks';
import { CreateTaskDto } from './create-task.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
