import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  cronExpression: string;

  @IsDateString()
  @IsOptional()
  executionTime?: string; // We will receive this as a string and convert to Date

  @IsString()
  @IsNotEmpty()
  actionType: string;

  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsNumber()
  @IsOptional()
  priority?: number;
}
