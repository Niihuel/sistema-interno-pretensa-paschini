import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateNotificationSettingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  sendHour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(59)
  sendMinute?: number;

  @IsOptional()
  @IsString()
  daysOfWeek?: string;
}
