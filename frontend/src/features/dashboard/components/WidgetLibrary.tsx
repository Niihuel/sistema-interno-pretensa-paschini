import { X, Move } from 'lucide-react';
import { widgetCatalog, createWidgetFromCatalog } from '../config/widgetCatalog';
import type { Widget, WidgetType } from '../types/widget.types';

interface WidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widget: Widget) => void;
  onStartPreview?: (widgetType: WidgetType) => void;
}

export default function WidgetLibrary({ isOpen, onClose, onAddWidget, onStartPreview }: WidgetLibraryProps) {
  if (!isOpen) return null;

  const handleAddWidget = (type: WidgetType) => {
    // Find the next available position (bottom of the layout)
    const newWidget = createWidgetFromCatalog(type);
    if (newWidget) {
      onAddWidget(newWidget);
      onClose();
    }
  };

  const handleStartDrag = (type: WidgetType) => {
    if (onStartPreview) {
      onStartPreview(type);
      onClose(); // Close modal when starting drag
    } else {
      handleAddWidget(type);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-4xl max-h-[80vh] bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Librería de Widgets</h2>
            <p className="text-sm text-white/60 mt-1">Selecciona un widget para añadir al dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Widget Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgetCatalog.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.type}
                  className="group relative p-5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:border-white/20 transition-all">
                    <IconComponent className="w-6 h-6 text-white/60 group-hover:text-white/80 transition-colors" />
                  </div>

                  {/* Info */}
                  <h3 className="text-white font-semibold mb-2">{item.name}</h3>
                  <p className="text-sm text-white/60 mb-3">{item.description}</p>

                  {/* Size info */}
                  <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                    <span>
                      Tamaño: {item.defaultSize.w}x{item.defaultSize.h}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddWidget(item.type)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-medium transition-all"
                      title="Agregar directamente"
                    >
                      Agregar
                    </button>
                    {onStartPreview && (
                      <button
                        onClick={() => handleStartDrag(item.type)}
                        className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all"
                        title="Arrastrar para posicionar"
                      >
                        <Move className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
