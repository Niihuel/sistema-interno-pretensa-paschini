import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SplashScreenProps {
  onComplete: () => void
  duration?: number // Duración en milisegundos (default: 2500ms = 2.5s)
}

export default function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Ocultar el splash screen después de la duración especificada
    const timer = setTimeout(() => {
      setShow(false)
    }, duration - 500) // Restamos 500ms para la animación de fade out

    return () => clearTimeout(timer)
  }, [duration])

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(to bottom, #020617 0%, #0f172a 50%, #1e293b 100%)',
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          {/* Overlay removido - causaba línea azul */}

          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.8, 1.05, 1],
              opacity: [0, 1, 1]
            }}
            transition={{
              duration: 1,
              times: [0, 0.6, 1],
              ease: [0.43, 0.13, 0.23, 0.96]
            }}
            className="relative"
          >
            {/* Logo completamente limpio */}
            <motion.img
              src="/logo.png"
              alt="Estructuras Pretensa"
              className="w-64 h-auto"
              style={{
                filter: 'none',
                boxShadow: 'none',
                border: 'none',
                outline: 'none',
              }}
            />
          </motion.div>

          {/* Loading indicator - Spinner restaurado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)'
            }}
          >
            <motion.svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="url(#spinnerGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="90 150"
              />
              <defs>
                <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </motion.svg>
          </motion.div>

          {/* Grid pattern removido */}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
