import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export const CALENDAR_ATTACHMENT_TYPES = [
  'TICKET',
  'EQUIPMENT',
  'EMPLOYEE',
  'AREA',
  'PURCHASE',
  'OTHER',
] as const;

export class CalendarEventAttachmentDto {
  @IsString()
  @IsIn(CALENDAR_ATTACHMENT_TYPES as unknown as string[])
  entityType: (typeof CALENDAR_ATTACHMENT_TYPES)[number];

  @IsInt()
  entityId: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;
}

export class CreateCalendarEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsDateString()
  startTime!: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  participantIds?: number[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CalendarEventAttachmentDto)
  @ArrayMaxSize(10)
  attachments?: CalendarEventAttachmentDto[];

  @IsOptional()
  @IsBoolean()
  sendInitialNotification?: boolean;
}
