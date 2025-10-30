import { PurchaseRequest as PrismaPurchaseRequest } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class PurchaseRequest implements PrismaPurchaseRequest {
  id: number;
  requestNumber: string | null;
  requestorId: number | null;
  itemName: string;
  category: string;
  description: string | null;
  justification: string | null;
  quantity: number;
  estimatedCost: Decimal | null;
  priority: string;
  status: string;
  approvedBy: string | null;
  approvalDate: Date | null;
  purchaseDate: Date | null;
  receivedDate: Date | null;
  vendor: string | null;
  actualCost: Decimal | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
