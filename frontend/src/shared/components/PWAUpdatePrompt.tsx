import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import Button from './ui/Button'
import { RefreshCw, X } from 'lucide-react'

export default function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
    },
    onRegisterError() {
    },
  })

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true)
    }
  }, [needRefresh])

  const handleUpdate = () => {
    updateServiceWorker(true)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setNeedRefresh(false)
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div
      className="fixed z-50 max-w-sm"
      style={{
        bottom: 'calc(var(--safe-area-bottom) + 1rem)',
        right: 'calc(var(--safe-area-right) + 1rem)'
      }}
    >
      <div className="glass rounded-xl border border-white/10 p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-400" />
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">
              Nueva versión disponible
            </h3>
            <p className="text-white/70 text-sm mb-3">
              Hay una actualización del sistema. Recarga la página para obtener la última versión.
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
              <Button
                onClick={handleDismiss}
                variant="glass"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
