import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  cronExpression: string;

  @IsString()
  @IsNotEmpty()
  actionType: string;

  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
