interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fullScreen?: boolean;
}

/**
 * Loading spinner circular que reemplaza el LoadingBar
 * Puede usarse inline o fullscreen
 */
export default function LoadingSpinner({
  size = 'md',
  className = '',
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4'
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-blue-500/30 border-t-blue-500 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Cargando"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className={`${sizeClasses[size]} border-blue-500/30 border-t-blue-500 rounded-full animate-spin`} />
          <p className="text-white/80 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return spinner;
}
