import { Component, type ReactNode } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Button from '../ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: error.message,
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || error.message,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="safe-area-stack safe-area-inline bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
          <div className="max-w-2xl w-full p-8 md:p-12">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Algo salió mal
            </h1>

            {/* Description */}
            <p className="text-white/70 text-center mb-8 text-lg">
              Lo sentimos, ha ocurrido un error inesperado. No te preocupes, tus datos están seguros.
            </p>

            {/* Error Details (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm font-medium mb-2">Detalles del error:</p>
                <p className="text-red-300/80 text-xs font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-red-400 text-xs cursor-pointer hover:text-red-300">
                      Ver stack trace
                    </summary>
                    <pre className="text-red-300/60 text-xs mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReload}
                variant="glass"
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recargar Página
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="default"
                className="flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Ir al Inicio
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-white/50 text-sm text-center mt-8">
              Si el problema persiste, contacta al equipo de soporte técnico.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
