import { Task, TaskSchema } from './tasks';
import { TaskLog, TaskLogSchema } from './tasks/schemas/task-log.schema';

export const models = [
  {
    name: Task.name,
    schema: TaskSchema,
  },
  {
    name: TaskLog.name,
    schema: TaskLogSchema,
  },
];
