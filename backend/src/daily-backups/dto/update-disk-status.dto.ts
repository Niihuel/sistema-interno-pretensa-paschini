import { IsBoolean } from 'class-validator';

export class UpdateDiskStatusDto {
  @IsBoolean()
  status: boolean;
}
