import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../api/users.api'

export const useLockedAccounts = () => {
  return useQuery({
    queryKey: ['users', 'locked'],
    queryFn: () => usersApi.getLockedAccounts(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export const useUnlockAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => usersApi.unlockAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'locked'] })
    },
  })
}

export const useLockAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => usersApi.lockAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'locked'] })
    },
  })
}
