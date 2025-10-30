import { Plus, FileText, Users, Package, Wrench, Calendar } from 'lucide-react';
import type { BaseWidgetProps, QuickActionsWidgetConfig } from '../types/widget.types';
import type { Widget } from '../store/dashboardStore';
import { Link } from 'react-router-dom';

// Icon mapping for quick actions
const iconMap: Record<string, any> = {
  plus: Plus,
  'file-text': FileText,
  users: Users,
  package: Package,
  wrench: Wrench,
  calendar: Calendar,
};

interface QuickActionsProps {
  widget: Widget;
  onEdit?: (widget: Widget) => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
}

export function QuickActionsWidget({ widget, onEdit: _onEdit, onDelete: _onDelete, isEditing: _isEditing }: QuickActionsProps) {
  const config = widget.config as any;
  
  // Determinar tamaño del widget para ajustar grid
  const { colSpan, rowSpan } = widget.position;
  const isSmall = colSpan <= 3;
  const isMedium = colSpan <= 6;
  
  // Calcular columnas según tamaño
  const gridCols = isSmall ? 1 : isMedium ? 2 : 3;
  // Calcular tamaño de iconos y padding
  const iconSize = isSmall ? 'w-10 h-10' : isMedium ? 'w-12 h-12' : 'w-14 h-14';
  const iconInnerSize = isSmall ? 'w-5 h-5' : isMedium ? 'w-6 h-6' : 'w-7 h-7';
  const padding = isSmall ? 'p-2' : isMedium ? 'p-4' : 'p-5';
  const textSize = isSmall ? 'text-[10px]' : 'text-xs';

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName?.toLowerCase()] || Plus;
    return IconComponent;
  };

  const actions = config.actions || [];

  return (
    <div
      className="h-full rounded-xl border border-white/10 p-4 flex flex-col relative backdrop-blur-sm"
      style={{
        backgroundColor: widget.theme?.backgroundColor || 'rgba(255, 255, 255, 0.05)',
        borderColor: widget.theme?.borderColor || 'rgba(255, 255, 255, 0.1)',
        color: widget.theme?.textColor || 'white',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Title */}
      <div className={`font-medium text-white/80 mb-3 ${isSmall ? 'text-xs' : 'text-sm'}`}>
        {widget.title || config.title}
      </div>

      {/* Actions Grid - Responsive */}
      <div 
        className={`flex-1 grid gap-${isSmall ? '2' : '3'} auto-rows-min content-start`}
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {actions.map((action: any, index: number) => {
          const IconComponent = getIconComponent(action.icon);
          const actionColor = action.color || widget.theme?.accentColor || '#3b82f6';

          return (
            <Link
              key={index}
              to={action.link}
              className={`flex flex-col items-center justify-center ${padding} rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group/action`}
              style={{
                background: `linear-gradient(135deg, ${actionColor}15, ${actionColor}05)`,
              }}
            >
              <div
                className={`${iconSize} rounded-xl flex items-center justify-center ${isSmall ? 'mb-1' : 'mb-2'} transition-transform group-hover/action:scale-110`}
                style={{
                  backgroundColor: `${actionColor}30`,
                }}
              >
                <IconComponent
                  className={iconInnerSize}
                  style={{ color: actionColor }}
                />
              </div>
              <span className={`${textSize} text-white/80 text-center font-medium line-clamp-2`}>
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {actions.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white/40 text-sm mb-1">Sin acciones configuradas</div>
            <div className="text-white/30 text-xs">Añade acciones rápidas desde la configuración</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickActionsWidget;
