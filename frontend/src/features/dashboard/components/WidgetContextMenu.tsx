import { useEffect, useRef, useState } from 'react';
import { Edit2, Trash2, Copy, RefreshCw } from 'lucide-react';
import type { Widget } from '../types/widget.types';

interface WidgetContextMenuProps {
  widget: Widget;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRefresh: () => void;
}

export default function WidgetContextMenu({
  widget,
  position,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onRefresh,
}: WidgetContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Adjust position if menu would go off-screen
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const newPosition = { ...position };

      if (position.x + rect.width > window.innerWidth) {
        newPosition.x = window.innerWidth - rect.width - 10;
      }

      if (position.y + rect.height > window.innerHeight) {
        newPosition.y = window.innerHeight - rect.height - 10;
      }

      setAdjustedPosition(newPosition);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, position]);

  const menuItems = [
    {
      icon: Edit2,
      label: 'Configurar Widget',
      shortcut: 'Ctrl+E',
      onClick: onEdit,
      color: 'text-blue-400 hover:text-blue-300',
    },
    {
      icon: RefreshCw,
      label: 'Actualizar Datos',
      shortcut: 'F5',
      onClick: onRefresh,
      color: 'text-green-400 hover:text-green-300',
    },
    {
      icon: Copy,
      label: 'Duplicar Widget',
      shortcut: 'Ctrl+D',
      onClick: onDuplicate,
      color: 'text-cyan-400 hover:text-cyan-300',
    },
    {
      icon: Trash2,
      label: 'Eliminar Widget',
      shortcut: 'Del',
      onClick: onDelete,
      color: 'text-red-400 hover:text-red-300',
      separator: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[240px] rounded-lg shadow-2xl border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        background: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="text-xs font-medium text-white/60">Widget: {widget.type.toUpperCase()}</div>
        <div className="text-xs text-white/40 truncate mt-0.5">
          {(widget.config as any)?.title || 'Sin título'}
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index}>
              {item.separator && <div className="my-1 h-px bg-white/10" />}
              <button
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className={`
                  w-full px-3 py-2 flex items-center gap-3
                  transition-all duration-150
                  hover:bg-white/10
                  ${item.color}
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-white/30 font-mono">{item.shortcut}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-white/10">
        <div className="text-xs text-white/40">
          Tamaño: {widget.layout.w}x{widget.layout.h} • Pos: {widget.layout.x},{widget.layout.y}
        </div>
      </div>
    </div>
  );
}
