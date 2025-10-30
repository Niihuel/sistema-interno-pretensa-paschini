import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface RestoreScreenProps {
  message?: string
  showProgress?: boolean
}

// Pasos simulados de restauración para mostrar progreso realista
const RESTORE_STEPS = [
  { progress: 10, message: 'Inicializando proceso de restauración' },
  { progress: 20, message: 'Desconectando usuarios activos' },
  { progress: 30, message: 'Creando backup de seguridad' },
  { progress: 40, message: 'Eliminando base de datos temporal' },
  { progress: 50, message: 'Extrayendo datos del backup' },
  { progress: 60, message: 'Restaurando esquema de base de datos' },
  { progress: 70, message: 'Importando tablas y datos' },
  { progress: 80, message: 'Reconstruyendo índices' },
  { progress: 90, message: 'Validando integridad de datos' },
  { progress: 95, message: 'Aplicando configuraciones finales' },
  { progress: 100, message: 'Restauración completada' },
]

export default function RestoreScreen({
  showProgress = true
}: RestoreScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simular progreso de restauración
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= RESTORE_STEPS.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 3000) // Cambiar de paso cada 3 segundos

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Animar el progreso suavemente al cambiar de paso
    if (currentStep < RESTORE_STEPS.length) {
      setProgress(RESTORE_STEPS[currentStep].progress)
    }
  }, [currentStep])

  const currentMessage = currentStep < RESTORE_STEPS.length
    ? RESTORE_STEPS[currentStep].message
    : 'Restauración completada'

  return (
    <div className="safe-area-stack safe-area-inline fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)' }}>

      <div className="flex flex-col items-center space-y-8 px-4 max-w-2xl w-full relative z-10">
        {/* Logo Container - Estilo igual al splash simple */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          transition={{
            duration: 0.8,
            ease: [0.43, 0.13, 0.23, 0.96]
          }}
          className="relative"
        >
          {/* Glow effect behind logo */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute inset-0 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
            }}
          />

          {/* Logo */}
          <img
            src="/logo.png"
            alt="Estructuras Pretensa"
            className="relative w-48 h-auto drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.3))',
            }}
          />
        </motion.div>

        {/* Título */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">
            Restaurando Base de Datos
          </h2>
          <p className="text-white/60 text-sm">
            Por favor espera, no cierres esta ventana
          </p>
        </div>

        {/* Progress bar con estilo del splash */}
        {showProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-md space-y-3"
          >
            {/* Mensaje del paso actual */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* 3 puntos animados */}
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: index * 0.2,
                      ease: 'easeInOut',
                    }}
                    className="w-2 h-2 rounded-full bg-blue-400"
                  />
                ))}
                <span className="text-white/80 text-sm font-medium ml-2">
                  {currentMessage}
                </span>
              </div>
              <span className="text-blue-400 font-mono font-semibold text-sm">
                {progress}%
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              {/* Actual progress */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                style={{
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                }}
              />
            </div>

            {/* Pasos completados */}
            <p className="text-white/40 text-xs text-center">
              Paso {currentStep + 1} de {RESTORE_STEPS.length}
            </p>
          </motion.div>
        )}

        {/* Advertencia */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 max-w-md"
        >
          <p className="text-yellow-200/80 text-xs text-center">
            Este proceso puede tardar varios minutos. El sistema se reiniciará automáticamente al finalizar.
          </p>
        </motion.div>

        {/* Company info */}
        <div className="text-center mt-8">
          <p className="text-white/40 text-xs">
            Sistema de Gestión Interno
          </p>
          <p className="text-white/30 text-xs mt-1">
            Estructuras Pretensa
          </p>
        </div>
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}
