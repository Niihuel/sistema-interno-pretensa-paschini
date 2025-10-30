export class Area {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  managerId?: number | null;
  status: string;
  color?: string | null;
  icon?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
