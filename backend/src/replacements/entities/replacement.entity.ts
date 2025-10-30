import { Replacement as PrismaReplacement } from '@prisma/client';

export class Replacement implements PrismaReplacement {
  id: number;
  printerId: number;
  consumableId: number | null;
  replacementDate: Date;
  completionDate: Date | null;
  rendimientoDays: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
