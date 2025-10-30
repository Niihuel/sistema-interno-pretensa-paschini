import { useEffect, useRef } from 'react';
import { useDashboardStore } from '../store/dashboardStore';

export function WidgetPlacementOverlay() {
  const { 
    isPlacingWidget, 
    previewWidget,
    setPreviewPosition, 
    confirmWidgetPlacement, 
    cancelWidgetPlacement 
  } = useDashboardStore();
  
  const gridRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isPlacingWidget) return;

    // Encontrar el grid container con reintentos
    const findGridContainer = () => {
      return document.querySelector('[data-grid-container]') as HTMLElement;
    };

    // Intentar encontrar el grid varias veces (puede no estar renderizado aún)
    let attempts = 0;
    const maxAttempts = 10;
    const intervalId = setInterval(() => {
      gridRef.current = findGridContainer();
      attempts++;
      
      if (gridRef.current || attempts >= maxAttempts) {
        clearInterval(intervalId);
        if (!gridRef.current) {
          console.warn('⚠️ Grid container no encontrado después de', maxAttempts, 'intentos');
        }
      }
    }, 100);
    
    // Cleanup del intervalo
    const cleanup = () => clearInterval(intervalId);

    const handleMouseMove = (e: MouseEvent) => {
      if (!gridRef.current || !previewWidget) return;

      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calcular posición en el grid (12 columnas)
      const gridCols = 12;
      const colWidth = rect.width / gridCols;
      const rowHeight = 100; // Altura aproximada de una fila en píxeles

      // Calcular columna y fila basado en la posición del cursor
      const col = Math.max(1, Math.min(gridCols - previewWidget.position.colSpan + 1, Math.floor(x / colWidth) + 1));
      const row = Math.max(1, Math.floor(y / rowHeight) + 1);

      setPreviewPosition({ col, row });
    };

    const handleClick = (e: MouseEvent) => {
      // Solo confirmar si hacemos click dentro del grid
      if (gridRef.current && gridRef.current.contains(e.target as Node)) {
        confirmWidgetPlacement();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelWidgetPlacement();
      }
    };

    // Añadir event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    // Cambiar cursor - más intuitivo
    document.body.style.cursor = 'copy'; // Mejor que crosshair para indicar "colocar"

    return () => {
      cleanup();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.cursor = '';
    };
  }, [isPlacingWidget, previewWidget, setPreviewPosition, confirmWidgetPlacement, cancelWidgetPlacement]);

  if (!isPlacingWidget) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Instrucciones mejoradas - Abajo para no tapar navbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 backdrop-blur-xl text-white px-6 py-3 rounded-2xl shadow-2xl border border-blue-400/30 pointer-events-none animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
          <span className="text-sm font-semibold">Mueve el cursor para posicionar</span>
        </div>
        <div className="w-px h-4 bg-white/30" />
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 text-xs bg-white/20 rounded border border-white/30 font-mono">Click</kbd>
          <span className="text-sm">Colocar</span>
        </div>
        <div className="w-px h-4 bg-white/30" />
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 text-xs bg-white/20 rounded border border-white/30 font-mono">ESC</kbd>
          <span className="text-sm">Cancelar</span>
        </div>
      </div>
    </div>
  );
}
