import { InventoryItem as PrismaInventoryItem } from '@prisma/client';

export class InventoryItem implements PrismaInventoryItem {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  quantity: number;
  location: string | null;
  status: string;
  condition: string;
  notes: string | null;
  assignedToId: number | null;
  createdAt: Date;
  updatedAt: Date;
  isPersonalProperty: boolean;
}
