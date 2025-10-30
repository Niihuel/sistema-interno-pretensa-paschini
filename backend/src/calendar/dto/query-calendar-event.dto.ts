import { IsBooleanString, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

enum CalendarViewMode {
  MONTH = 'month',
  LIST = 'list',
  CANVAS = 'canvas',
}

export class QueryCalendarEventDto {
  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsInt()
  participantId?: number;

  @IsOptional()
  @IsBooleanString()
  onlyUpcoming?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CalendarViewMode)
  view?: CalendarViewMode;
}

export type CalendarViewModeLiteral = 'month' | 'list' | 'canvas';
