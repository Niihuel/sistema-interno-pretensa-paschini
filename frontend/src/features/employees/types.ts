export interface WindowsAccount {
  id: number;
  username: string;
  domain: string;
  notes: string;
  isActive: boolean;
  lastLogin: string;
  password?: string;
}

export interface QnapAccount {
  id: number;
  username: string;
  userGroup: string;
  folderPermissions: string;
  quotaLimit: string;
  notes: string;
  isActive: boolean;
  lastAccess: string;
  password?: string;
}

export interface CalipsoAccount {
  id: number;
  username: string;
  permissions: string;
  notes: string;
  isActive: boolean;
  lastLogin: string;
  password?: string;
}

export interface EmailAccount {
  id: number;
  email: string;
  accountType: string;
  notes: string;
  isActive: boolean;
  lastSync: string;
  password?: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  areaId: number | null;
  zoneId: number | null;
  status: string;
  area?: {
    id: number;
    name: string;
    code: string | null;
  };
  zone?: {
    id: number;
    name: string;
    code: string | null;
  };
}

export interface EmployeesResponse {
  items: Employee[];
  total: number;
  page: number;
  limit: number;
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  areaId?: number;
  zoneId?: number;
  status?: string;
}

export interface EmployeeFilters {
  search?: string;
  status?: string;
  areaId?: number;
  zoneId?: number;
  page?: number;
  limit?: number;
}

export interface EmployeeDetailed extends Employee {
  windowsAccounts: WindowsAccount[];
  qnapAccounts: QnapAccount[];
  calipsoAccounts: CalipsoAccount[];
  emailAccounts: EmailAccount[];
  equipmentAssigned: EquipmentAssignment[];
  inventoryAssigned: InventoryAssignment[];
  ticketsRequested: TicketSummary[];
  purchaseRequests: PurchaseRequestSummary[];
}

export type WindowsAccountPayload = Omit<WindowsAccount, 'id' | 'lastLogin'>;
export type UpdateWindowsAccountPayload = Partial<WindowsAccountPayload>;

export type QnapAccountPayload = Omit<QnapAccount, 'id' | 'lastAccess'>;
export type UpdateQnapAccountPayload = Partial<QnapAccountPayload>;

export type CalipsoAccountPayload = Omit<CalipsoAccount, 'id' | 'lastLogin'>;
export type UpdateCalipsoAccountPayload = Partial<CalipsoAccountPayload>;

export type EmailAccountPayload = Omit<EmailAccount, 'id' | 'lastSync'>;
export type UpdateEmailAccountPayload = Partial<EmailAccountPayload>;

export type EmployeeAccount = WindowsAccount | QnapAccount | CalipsoAccount | EmailAccount;

export interface EquipmentAssignment {
  id: number;
  name: string;
  type: string;
  status: string;
  location?: string | null;
  area?: string | null;
  serialNumber?: string | null;
  ip?: string | null;
  macAddress?: string | null;
  cpuNumber?: string | null;
  motherboard?: string | null;
  processor?: string | null;
  ram?: string | null;
  storage?: string | null;
  operatingSystem?: string | null;
  brand?: string | null;
  model?: string | null;
  assignedToId?: number | null;
  storageType?: string | null;
  storageCapacity?: string | null;
  ipAddress?: string | null;
  screenSize?: string | null;
  dvdUnit?: boolean;
  purchaseDate?: string | null;
  notes?: string | null;
  isPersonalProperty?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryAssignment {
  id: number;
  name: string;
  category?: string | null;
  quantity: number;
}

export interface TicketSummary {
  id: number;
  title: string;
  status: string;
  priority: string;
  description?: string | null;
  createdAt?: string | null;
}

export interface PurchaseRequestSummary {
  id: number;
  description: string;
  status: string;
  createdAt?: string | null;
}
