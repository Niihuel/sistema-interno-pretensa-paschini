import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  footer?: ReactNode
  fullscreen?: boolean
}

export default function Modal({ isOpen, onClose, title, children, className, footer, fullscreen = false }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Prevenir scroll del body
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollBarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen])

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        padding: '1rem',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        overscrollBehavior: 'contain',
      }}
    >
      {/* Overlay - Backdrop oscuro */}
      <div
        className="fixed inset-0 backdrop-blur-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(2, 6, 23, 0.95) 100%)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container - Fijo, solo el contenido scrollea */}
      <div
        ref={modalRef}
        className={cn(
          'relative flex flex-col',
          fullscreen ? 'w-full h-full' : 'w-full max-w-md sm:max-w-lg md:max-w-xl',
          fullscreen ? 'rounded-none' : 'rounded-lg sm:rounded-xl',
          'shadow-2xl',
          'backdrop-blur-2xl',
          'border border-white/10',
          'overflow-hidden',
          className
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 50%, rgba(2, 6, 23, 0.9) 100%)',
          WebkitBackdropFilter: 'blur(32px)',
          maxHeight: fullscreen ? '100vh' : '75vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Header - Fixed */}
        <div className="relative flex-shrink-0 flex items-center justify-between gap-3 p-3 sm:p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-base sm:text-lg font-semibold text-white flex-1 min-w-0 truncate">{title}</h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          className="relative flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-5"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>

        {/* Footer - Fixed at bottom */}
        {footer && (
          <div className="relative flex-shrink-0 p-3 sm:p-4 border-t border-white/10 bg-white/5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
