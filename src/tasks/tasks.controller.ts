import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Task } from 'src/database/tasks';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';
import { TaskLog } from 'src/database/tasks/schemas/task-log.schema';
import { TaskLogsService } from './task-logs.service';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskLogsService: TaskLogsService,
  ) {}

  @Post()
  crete(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksService.createTask(createTaskDto);
  }

  @Get()
  async findAll(): Promise<Task[]> {
    return this.tasksService.findAllTasks();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Task | null> {
    const task = await this.tasksService.findTaskById(id);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task | null> {
    const updatedTask = await this.tasksService.updateTask(id, updateTaskDto);
    if (!updatedTask) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return updatedTask;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<any> {
    const deletedTask = await this.tasksService.deleteTask(id);
    if (!deletedTask) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return { message: `Task with id ${id} deleted successfully` };
  }

  // Task Logs Endpoints
  @Get(':id/logs')
  async getTaskLogs(@Param('id') id: string): Promise<TaskLog[]> {
    const task = await this.tasksService.findTaskById(id);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return this.taskLogsService.findLogsForTask(id);
  }

  @Get('logs/all')
  async getAllTaskLogs(): Promise<TaskLog[]> {
    return this.taskLogsService.findAllLogs();
  }
}
