import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './providers/AuthProvider'
import { PermissionsProvider } from './providers/PermissionsProvider'
import { ToastProvider } from './shared/components/ui/ToastContainer'
import { queryClient } from './api/client'
import AppRoutes from './router'
import ErrorBoundary from './shared/components/error/ErrorBoundary'
import SplashScreen from './shared/components/ui/SplashScreen'
import PWAUpdatePrompt from './shared/components/PWAUpdatePrompt'

function App() {
  const [splashDone, setSplashDone] = useState(false)

  if (!splashDone) {
    return (
      <SplashScreen
        onComplete={() => setSplashDone(true)}
        duration={2500}
      />
    )
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PermissionsProvider>
            <ToastProvider>
              <AppRoutes />
              <PWAUpdatePrompt />
            </ToastProvider>
          </PermissionsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
