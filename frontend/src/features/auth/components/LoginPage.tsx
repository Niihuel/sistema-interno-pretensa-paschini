import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../../providers/AuthProvider'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import { logError } from '../../../utils/errorHelpers'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err: any) {
      logError('LoginPage:handleSubmit', err)

      // Detectar diferentes tipos de errores
      let errorMessage = 'Error al iniciar sesión'

      // Error de red / sin conexión
      if (!navigator.onLine || err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        errorMessage = 'Sin conexión a internet. Por favor, verifica tu conexión y vuelve a intentar.'
      }
      // Cuenta bloqueada
      else if (err.response?.data?.message?.includes('locked') ||
               err.response?.data?.message?.includes('bloqueada') ||
               err.response?.status === 423) {
        const retryAfter = err.response?.headers?.['retry-after']
        const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 5
        errorMessage = `Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intenta nuevamente en ${minutes} minuto(s).`
      }
      // Credenciales incorrectas
      else if (err.response?.status === 401 ||
               err.response?.data?.message?.includes('Invalid credentials') ||
               err.response?.data?.message?.includes('credenciales incorrectas')) {
        errorMessage = 'Usuario o contraseña incorrectos. Por favor, verifica tus datos.'
      }
      // Usuario no encontrado
      else if (err.response?.status === 404 ||
               err.response?.data?.message?.includes('not found')) {
        errorMessage = 'Usuario no encontrado. Verifica tu nombre de usuario.'
      }
      // Usuario inactivo
      else if (err.response?.data?.message?.includes('inactive') ||
               err.response?.data?.message?.includes('inactivo')) {
        errorMessage = 'Tu cuenta está inactiva. Contacta al administrador del sistema.'
      }
      // Error del servidor
      else if (err.response?.status >= 500) {
        errorMessage = 'Error del servidor. Por favor, intenta nuevamente más tarde.'
      }
      // Error genérico con mensaje del servidor
      else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative px-4"
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
      }}
    >
      <FadeInUp className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Título */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            Iniciar sesión
          </h1>
          <p className="text-white/60 text-sm">
            Sistema de Interno
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          {/* Usuario */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-normal text-white/70">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="Tu usuario"
              required
              autoComplete="username"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-normal text-white/70">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors pr-12"
                placeholder="Tu contraseña"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3.5 bg-white text-gray-900 rounded-lg font-medium hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </FadeInUp>

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
