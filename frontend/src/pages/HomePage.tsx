import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // Usuario autenticado → redirigir al dashboard
        navigate('/dashboard', { replace: true })
      } else {
        // Usuario NO autenticado → redirigir al login
        navigate('/login', { replace: true })
      }
    }
  }, [isAuthenticated, loading, navigate])

  // Mostrar loading mientras se verifica el estado de autenticación
  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
      }}
    >
      <div className="text-center relative z-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirigiendo...</p>
      </div>

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
    </div>
  )
}
