import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  MinLength,
  MaxLength,
  Matches,
  IsPositive
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El nombre de usuario no puede exceder 50 caracteres' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'
  })
  username?: string;

  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'El apellido no puede exceder 50 caracteres' })
  lastName?: string;

  @IsArray({ message: 'Los roles deben ser un array' })
  @IsInt({ each: true, message: 'Cada rol debe ser un ID numérico válido' })
  @IsPositive({ each: true, message: 'Los IDs de roles deben ser positivos' })
  @IsOptional()
  roleIds?: number[];

  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  @IsOptional()
  isActive?: boolean;
}
