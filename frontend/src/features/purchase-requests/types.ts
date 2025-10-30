export interface PurchaseRequest {
  id: number
  requestNumber?: string | null
  requestorId?: number | null
  itemName: string
  category: string
  description?: string | null
  justification?: string | null
  quantity: number
  estimatedCost?: number | null
  priority: string
  status: string
  approvedBy?: string | null
  approvalDate?: string | null
  purchaseDate?: string | null
  receivedDate?: string | null
  vendor?: string | null
  actualCost?: number | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
  requestor?: {
    id: number
    firstName: string
    lastName: string
    area?: string | null
  }
}

export interface PurchaseRequestsResponse {
  items: PurchaseRequest[]
  total: number
  page: number
  limit: number
}

export interface PurchaseRequestFormData {
  requestorId?: number
  itemName: string
  category: string
  description?: string
  justification?: string
  quantity: number
  estimatedCost?: number
  priority: string
  status: string
  approvedBy?: string
  approvalDate?: string
  purchaseDate?: string
  receivedDate?: string
  vendor?: string
  actualCost?: number
  notes?: string
}

export interface PurchaseRequestFilters {
  search?: string
  status?: string
  priority?: string
  category?: string
}
