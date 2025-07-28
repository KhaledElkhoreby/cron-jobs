import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum TaskStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  cronExpression: string;

  @Prop({ required: true })
  actionType: string;

  @Prop({ type: Object })
  payload: Record<string, any>;

  @Prop({ default: TaskStatus.PENDING })
  status: TaskStatus;

  @Prop()
  lastRunAt: Date;

  @Prop()
  lastRunStatus: string;

  @Prop()
  nextRunAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
