import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';

export enum NotificationType {
  BACKUP = 'BACKUP',
  TICKET = 'TICKET',
  INVENTORY = 'INVENTORY',
  SYSTEM = 'SYSTEM',
  CALENDAR = 'CALENDAR',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateNotificationDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsString()
  data?: string;
}
