import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCalendarEventDto } from './create-calendar-event.dto';

export class UpdateCalendarEventDto extends PartialType(CreateCalendarEventDto) {
  @IsOptional()
  @IsBoolean()
  regenerateReminders?: boolean;
}
