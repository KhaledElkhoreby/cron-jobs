import {
  utilities as nestWinstonModuleUtilities,
  WinstonModuleOptions,
} from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: `logs/application-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m', // 20MB
  maxFiles: '14d', // Keep logs for 14 days
  level: 'debug', // log level for file
});

const consoleTransport = new winston.transports.Console({
  level: 'debug', // log level for console
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike('AutomatedTaskManager', {
      colors: true,
      prettyPrint: true,
    }),
  ),
});

export const winstonConfig: WinstonModuleOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [consoleTransport, dailyRotateFileTransport],
  exceptionHandlers: [dailyRotateFileTransport], // Log unhandled exceptions to file
  rejectionHandlers: [dailyRotateFileTransport], // Log unhandled rejections to file
};
