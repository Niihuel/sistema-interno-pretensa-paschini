import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateFileStatusDto {
  @IsInt()
  @Min(1)
  fileTypeId: number;

  @IsInt()
  @Min(1)
  statusId: number;
}
