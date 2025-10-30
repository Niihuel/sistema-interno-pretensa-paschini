import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBackupLogDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  backupName: string;

  @IsString()
  @MinLength(1)
  backupType: string;

  @IsString()
  @MinLength(1)
  source: string;

  @IsString()
  @MinLength(1)
  destination: string;

  @IsString()
  @MinLength(1)
  status: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  duration?: number;

  @IsOptional()
  sizeBytes?: bigint;

  @IsString()
  @IsOptional()
  errorMessage?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
