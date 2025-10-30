import { IsString, IsOptional, IsBoolean, IsDateString, IsEmail } from 'class-validator';

export class CreateEmailAccountDto {
  @IsEmail()
  email: string;

  @IsString()
  accountType: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  forwardingTo?: string;

  @IsString()
  @IsOptional()
  aliases?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  lastSync?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
