export interface LockedUser {
  id: number
  username: string
  email: string | null
  firstName: string | null
  lastName: string | null
  failedLoginAttempts: number
  lockedUntil: string | null
  lastLoginAt: string | null
  isActive: boolean
  createdAt: string
  userRoles: {
    role: {
      id: number
      name: string
      displayName: string
      color: string | null
    }
  }[]
}
