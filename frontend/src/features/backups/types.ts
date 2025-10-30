export interface Backup {
  id: number
  backupName: string
  backupType: string
  source: string
  destination: string
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS'
  startTime: string | null
  endTime: string | null
  duration: number | null
  sizeBytes: number
  errorMessage: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface BackupsResponse {
  items: Backup[]
  total: number
  page: number
  limit: number
}

export interface BackupsFilters {
  backupType?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}
