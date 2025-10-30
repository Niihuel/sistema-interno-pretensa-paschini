export interface Purchase {
  id: number
  purchaseRequestId?: number | null
  orderNumber: string
  supplier: string
  totalAmount: number
  status: 'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
  orderDate: string
  expectedDeliveryDate?: string | null
  actualDeliveryDate?: string | null
  notes?: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseFormData {
  purchaseRequestId?: number | null
  orderNumber: string
  supplier: string
  totalAmount: number
  status: string
  orderDate: string
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  notes?: string
}

export interface PurchasesResponse {
  items: Purchase[]
  total: number
  page: number
  limit: number
}

export interface PurchasesFilters {
  orderNumber?: string
  supplier?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}
