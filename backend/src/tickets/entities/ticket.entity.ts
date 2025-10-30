import { Ticket as PrismaTicket } from '@prisma/client';

export class Ticket implements PrismaTicket {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  requestorId: number;
  technicianId: number | null;
  solution: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  area: string | null;
  category: string | null;
  ipAddress: string | null;
  resolutionTime: string | null;
}
