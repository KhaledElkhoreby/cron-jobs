import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { TaskLog } from './schemas/task-log.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TaskLogsRepository {
  _model: Model<TaskLog>;

  constructor(@InjectModel(TaskLog.name) private model: Model<TaskLog>) {
    this._model = model;
  }
}
