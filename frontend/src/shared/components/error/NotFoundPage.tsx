import { Home, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div
      className="safe-area-stack safe-area-inline flex items-center justify-center p-4 relative"
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
      }}
    >
      <div className="max-w-2xl w-full">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12">
          {/* 404 Number */}
          <div className="text-center mb-6">
            <h1 className="text-8xl md:text-9xl font-bold text-white/10 mb-4">
              404
            </h1>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Página no encontrada
          </h2>

          {/* Description */}
          <p className="text-white/70 text-center mb-8 text-lg">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="glass"
              className="flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver Atrás
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="default"
              className="flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ir al Inicio
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-white/50 text-sm text-center mt-8">
            Si crees que esto es un error, contacta al equipo de soporte.
          </p>
        </div>
      </div>

      {/* Subtle grid pattern overlay - igual que el splash screen y layout */}
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
