import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Barra de progreso global estilo NProgress
 * Se muestra automáticamente durante la navegación
 *
 * IMPORTANTE: Este componente debe estar dentro de un Router context
 */
export default function LoadingBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar barra al cambiar de ruta
    setIsVisible(true);
    setProgress(0);

    // Simular progreso
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    // Completar después de un tiempo
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 400);
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 z-[10000] pointer-events-none"
      style={{
        background: 'transparent',
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 shadow-lg transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
        }}
      />
    </div>
  );
}
