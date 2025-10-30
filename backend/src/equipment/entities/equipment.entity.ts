import { Equipment as PrismaEquipment } from '@prisma/client';

export class Equipment implements PrismaEquipment {
  id: number;
  name: string;
  type: string;
  status: string;
  location: string | null;
  serialNumber: string | null;
  assignedToId: number | null;
  createdAt: Date;
  updatedAt: Date;
  ip: string | null;
  macAddress: string | null;
  area: string | null;
  brand: string | null;
  cpuNumber: string | null;
  dvdUnit: boolean;
  ipAddress: string | null;
  model: string | null;
  motherboard: string | null;
  notes: string | null;
  operatingSystem: string | null;
  processor: string | null;
  purchaseDate: Date | null;
  ram: string | null;
  screenSize: string | null;
  storage: string | null;
  storageCapacity: string | null;
  storageType: string | null;
  isPersonalProperty: boolean;
}
