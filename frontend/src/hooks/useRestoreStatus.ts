import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'

interface RestoreStatus {
  restoring: boolean
  details?: {
    startedAt: string
    backupId: number
    backupName: string
    status: string
    message: string
  }
}

export function useRestoreStatus(pollInterval: number = 5000) {
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreDetails, setRestoreDetails] = useState<RestoreStatus['details'] | null>(null)

  const checkRestoreStatus = useCallback(async () => {
    try {
      const response = await apiClient.get('/backups/restore-status')
      const status: RestoreStatus = response.data.data

      setIsRestoring(status.restoring)
      setRestoreDetails(status.details || null)

      // If restore just finished, reload the page after a short delay
      if (!status.restoring && isRestoring) {
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      // If we can't check status (maybe server is down during restore), keep showing restore screen
    }
  }, [isRestoring])

  useEffect(() => {
    // Check immediately on mount
    checkRestoreStatus()

    // Then poll at regular intervals
    const interval = setInterval(checkRestoreStatus, pollInterval)

    return () => clearInterval(interval)
  }, [checkRestoreStatus, pollInterval])

  return {
    isRestoring,
    restoreDetails
  }
}
