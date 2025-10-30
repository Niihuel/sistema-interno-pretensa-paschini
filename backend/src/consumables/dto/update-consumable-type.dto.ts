import { PartialType } from '@nestjs/mapped-types';
import { CreateConsumableTypeDto } from './create-consumable-type.dto';

export class UpdateConsumableTypeDto extends PartialType(CreateConsumableTypeDto) {}
