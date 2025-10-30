import { Menu, Download, Upload } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ToolbarMenuProps {
  onExport: () => void;
  onImport: () => void;
  onCustomizeTheme?: () => void;
}

/**
 * Menú hamburguesa consolidado para opciones secundarias del toolbar
 * Incluye: Export, Import
 */
export default function ToolbarMenu({
  onExport,
  onImport,
}: ToolbarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExport = () => {
    onExport();
    setIsOpen(false);
  };

  const handleImport = () => {
    onImport();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón Hamburguesa */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center p-2 rounded-lg transition-all ${
          isOpen
            ? 'bg-blue-500 text-white'
            : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white'
        }`}
        title="Más opciones"
        aria-label="Menú de opciones"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Menú Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-64 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Opciones</h3>
            <p className="text-xs text-white/60 mt-0.5">Configuración y utilidades</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Export */}
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-white/10 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <Download className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Exportar Dashboard</div>
                <div className="text-xs text-white/60">Descargar configuración</div>
              </div>
            </button>

            {/* Import */}
            <button
              onClick={handleImport}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-white/10 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <Upload className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Importar Dashboard</div>
                <div className="text-xs text-white/60">Cargar configuración</div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 bg-white/5">
            <p className="text-xs text-white/40 text-center">
              Configuración del Dashboard
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
