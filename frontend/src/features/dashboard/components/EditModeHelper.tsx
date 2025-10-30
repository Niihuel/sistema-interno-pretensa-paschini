import { useEffect, useState } from 'react';
import { X, Move, Maximize2, Info } from 'lucide-react';

interface EditModeHelperProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export default function EditModeHelper({ isVisible, onDismiss }: EditModeHelperProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Pequeño delay para la animación
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9998] transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-semibold text-white">Modo Edición</span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tips */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Move className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Mover widget</p>
              <p className="text-xs text-white/60 mt-0.5">Arrastra desde el encabezado</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Maximize2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Redimensionar</p>
              <p className="text-xs text-white/60 mt-0.5">Arrastra desde las esquinas o bordes</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Tip</p>
              <p className="text-xs text-white/60 mt-0.5">Los controles se iluminan al pasar el mouse</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
