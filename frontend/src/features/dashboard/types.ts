export interface DashboardSummary {
  openTickets: number
  totalEquipment: number
  activeEmployees: number
  equipmentByStatus?: ChartData[]
  printersByStatus?: ChartData[]
  purchasesByStatus?: ChartData[]
  ticketsByPriority?: ChartData[]
  employeesByArea?: ChartData[]
  inventoryByCategory?: ChartData[]
  backupsByStatus?: ChartData[]
}

export interface ChartData {
  name: string
  value: number
}
