import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Task, TaskStatus } from './task.schema';

@Schema()
export class TaskLog extends Document {
  @Prop({ type: Types.ObjectId, ref: Task.name, required: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ required: true })
  taskName: string;

  @Prop({ required: true, enum: TaskStatus })
  status: TaskStatus;

  @Prop()
  errorMessage?: string;

  @Prop()
  durationMs?: number;

  @Prop({ default: Date.now })
  executedAt: Date;
}

export const TaskLogSchema = SchemaFactory.createForClass(TaskLog);
