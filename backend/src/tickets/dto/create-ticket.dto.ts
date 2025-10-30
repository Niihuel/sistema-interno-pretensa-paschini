import {
  IsString,
  IsInt,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsIn,
  IsIP,
  IsPositive
} from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'La descripción no puede exceder 2000 caracteres' })
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Abierto', 'En Progreso', 'Resuelto', 'Cerrado', 'Pendiente'], {
    message: 'Estado inválido'
  })
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Baja', 'Media', 'Alta', 'Urgente'], {
    message: 'Prioridad inválida'
  })
  priority?: string;

  @IsInt({ message: 'El ID del solicitante debe ser un número entero' })
  @IsPositive({ message: 'El ID del solicitante debe ser positivo' })
  @IsNotEmpty({ message: 'El solicitante es obligatorio' })
  requestorId: number;

  @IsInt({ message: 'El ID del técnico debe ser un número entero' })
  @IsPositive({ message: 'El ID del técnico debe ser positivo' })
  @IsOptional()
  technicianId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'La categoría no puede exceder 100 caracteres' })
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'El área no puede exceder 100 caracteres' })
  area?: string;

  @IsString()
  @IsOptional()
  @IsIP('4', { message: 'La dirección IP debe ser válida (IPv4)' })
  ipAddress?: string;
}
