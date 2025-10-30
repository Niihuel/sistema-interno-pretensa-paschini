import { apiClient } from '../../../api/client'
import type { LockedUser } from '../types'

export const usersApi = {
  // Get all locked/blocked accounts
  getLockedAccounts: async (): Promise<LockedUser[]> => {
    const response = await apiClient.get('/users/locked')
    return response.data.data || []
  },

  // Unlock a user account
  unlockAccount: async (userId: number): Promise<void> => {
    await apiClient.post(`/users/${userId}/unlock`)
  },

  // Lock a user account
  lockAccount: async (userId: number): Promise<void> => {
    await apiClient.post(`/users/${userId}/lock`)
  },
}
