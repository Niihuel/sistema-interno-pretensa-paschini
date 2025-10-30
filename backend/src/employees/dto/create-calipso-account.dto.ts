import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateCalipsoAccountDto {
  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  profile?: string;

  @IsString()
  @IsOptional()
  permissions?: string;

  @IsString()
  @IsOptional()
  modules?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  lastLogin?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
