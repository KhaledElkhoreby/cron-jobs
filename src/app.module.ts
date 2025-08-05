import configuration from '@config/configuration';
import { winstonConfig } from '@config/winston.config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { SeederService } from './seeder/seeder.service';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.mongoDB'),
        onConnectionCreate() {
          console.log('Connected to MongoDB 🟩🟩');
        },
      }),
    }),
    DatabaseModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [SeederService, AppService],
})
export class AppModule {}
