import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string | ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Renderizar el modal usando Portal para que aparezca fuera de la jerarquía del componente padre
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="relative glass-strong rounded-2xl shadow-2xl w-full max-w-md border border-white/10 p-4 sm:p-6 my-auto mx-auto overflow-x-hidden"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="flex items-start gap-4">
          {variant === 'danger' && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          )}

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <div className="text-white/70 text-sm">{message}</div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 w-full">
              <Button variant="glass" onClick={onClose} className="flex-1 w-full sm:w-auto">
                {cancelText}
              </Button>
              <Button
                variant={variant}
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className="flex-1 w-full sm:w-auto"
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
