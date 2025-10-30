import { Purchase as PrismaPurchase } from '@prisma/client';

export class Purchase implements PrismaPurchase {
  id: number;
  requestId: string | null;
  itemName: string;
  requestedQty: number;
  requestedDate: Date | null;
  receivedQty: number;
  receivedDate: Date | null;
  pendingQty: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
