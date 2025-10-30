import type { ReactNode } from 'react'
import Header from './Header'
import RestoreScreen from '../RestoreScreen'
import { useRestoreStatus } from '../../../hooks/useRestoreStatus'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { isRestoring, restoreDetails } = useRestoreStatus()

  // Show restore screen when database is being restored
  if (isRestoring) {
    return (
      <RestoreScreen
        message={restoreDetails?.message || 'Restaurando base de datos...'}
        showProgress={true}
      />
    )
  }

  return (
    <div className="safe-area-stack relative min-h-screen">
      <Header />
      <main
        className="flex-1 safe-area-inline px-4 lg:px-6 pb-6 min-h-screen"
        style={{
          paddingTop: 'calc(var(--safe-area-top, env(safe-area-inset-top, 0px)) + 5rem)'
        }}
      >
        {children}
      </main>
    </div>
  )
}
