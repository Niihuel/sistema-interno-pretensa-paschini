import { Employee as PrismaEmployee } from '@prisma/client';

export class Employee implements PrismaEmployee {
  id: number;
  firstName: string;
  lastName: string;
  area: string | null;
  areaId: number | null;
  zoneId: number | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
