import { Printer as PrismaPrinter } from '@prisma/client';

export class Printer implements PrismaPrinter {
  id: number;
  model: string;
  serialNumber: string | null;
  area: string | null;
  location: string | null;
  ip: string | null;
  macAddress: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
