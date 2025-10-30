import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateBackupDiskDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  sequence: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
