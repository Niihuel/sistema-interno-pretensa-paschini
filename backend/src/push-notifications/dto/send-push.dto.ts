import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum } from 'class-validator';

export enum PushNotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class SendPushDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsEnum(PushNotificationPriority)
  @IsOptional()
  priority?: PushNotificationPriority;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
