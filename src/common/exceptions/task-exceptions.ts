import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidCronExpressionException extends HttpException {
  constructor(expression: string) {
    super(
      `Invalid cron expression: "${expression}". Please check the format`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TaskExecutionException extends HttpException {
  constructor(
    taskId: string,
    message: string = 'An error occurred during task execution',
  ) {
    super(
      `Task execution failed for ID ${taskId}: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class TaskNotFoundException extends HttpException {
  constructor(taskId: string) {
    super(`Task with ID "${taskId}" not found`, HttpStatus.NOT_FOUND);
  }
}
