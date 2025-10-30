import { apiClient } from './client'

export interface AssignableTechnician {
  id: number
  username: string
  firstName: string | null
  lastName: string | null
  email: string | null
  userRoles: Array<{
    role: {
      id: number
      name: string
      displayName: string
      color: string | null
    }
  }>
}

export interface AssignableTechniciansResponse {
  success: boolean
  data: AssignableTechnician[]
}

export interface AvailableRole {
  id: number
  name: string
  displayName: string
  description: string | null
  color: string | null
  icon: string | null
  level: number
}

export interface AvailableRolesResponse {
  success: boolean
  data: AvailableRole[]
}

export const usersApi = {
  getAssignableTechnicians: async (): Promise<AssignableTechnician[]> => {
    const { data } = await apiClient.get<AssignableTechniciansResponse>('/users/assignable-technicians')
    return data.data
  },

  getAvailableRoles: async (): Promise<AvailableRole[]> => {
    const { data } = await apiClient.get<AvailableRolesResponse>('/users/available-roles')
    return data.data
  }
}
