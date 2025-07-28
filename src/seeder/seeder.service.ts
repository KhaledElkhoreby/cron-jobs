import { Injectable, OnModuleInit } from '@nestjs/common';
import { TasksRepository } from 'src/database/tasks/tasks.repository';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(private tasksRepository: TasksRepository) {}
  async onModuleInit() {
    // console.log('SeederService: Initializing seeder...');
    // await this.tasksRepository._model.deleteMany({});
    // const count = await this.tasksRepository._model.countDocuments();
    // if (count === 0) {
    //   await this.tasksRepository._model.insertMany([
    //     {
    //       title: 'Submit project report',
    //       dueDate: new Date(Date.now() + 60 * 1000), // 1 minute from now
    //     },
    //     {
    //       title: 'Prepare for team meeting',
    //       dueDate: new Date(Date.now() + 120 * 1000), // 2 minutes from now
    //     },
    //     {
    //       title: 'Review pull requests',
    //       dueDate: new Date(Date.now() + 180 * 1000), // 3 minutes from now
    //     },
    //   ]);
    //   console.log('Seeder: Initial tasks created successfully.');
    // } else {
    //   console.log('Seeder: Tasks already exist, skipping seeding.');
    // }
  }
}
