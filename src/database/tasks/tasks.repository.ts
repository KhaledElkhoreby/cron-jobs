import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Task } from './schemas/task.schema';

@Injectable()
export class TasksRepository {
  _model: Model<Task>;
  constructor(@InjectModel(Task.name) private model: Model<Task>) {
    this._model = model;
  }

  async findAll(filter: FilterQuery<Task> = {}): Promise<Task[]> {
    return this.model.find(filter).exec();
  }
}
