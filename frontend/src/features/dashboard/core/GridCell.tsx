import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Widget } from '../store/dashboardStore';
import { useDashboardStore } from '../store/dashboardStore';
import { useWidgetResize } from '../hooks/useWidgetResize';
import WidgetConfigModal from '../components/WidgetConfigModal';
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog';
import { KPIWidget } from '../widgets/KPIWidget';
import { LegacyWidgetWrapper } from '../widgets/WidgetAdapter';
import ChartWidgetLegacy from '../widgets/ChartWidget';
import ListWidgetLegacy from '../widgets/ListWidget';
import QuickActionsWidgetLegacy from '../widgets/QuickActionsWidget';
import AlertsWidgetLegacy from '../widgets/AlertsWidget';
import ModuleStatsWidgetLegacy from '../widgets/ModuleStatsWidget';
import { 
  Settings, 
  Trash2, 
  GripVertical
} from 'lucide-react';
import { cn } from '../../../shared/utils/cn';

interface GridCellProps {
  widget: Widget;
  isEditing: boolean;
  isDragging?: boolean;
}

export function GridCell({ widget, isEditing, isDragging }: GridCellProps) {
  const { removeWidget, isPlacingWidget, adjustedWidgetPositions, draggedWidgetId } = useDashboardStore();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { isResizing, handleResizeStart } = useWidgetResize({ widgetId: widget.id });
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: widget.id, disabled: !isEditing });

  // Usar posición ajustada si está en modo placement O si otro widget está siendo arrastrado
  const isDraggingMode = draggedWidgetId !== null && draggedWidgetId !== widget.id;
  const shouldUseAdjusted = (isPlacingWidget || isDraggingMode) && adjustedWidgetPositions;
  
  const adjustedPosition = shouldUseAdjusted 
    ? adjustedWidgetPositions.get(widget.id) 
    : null;
  
  const currentPosition = adjustedPosition || widget.position;
  
  // Solo reducir opacidad si está siendo arrastrado y draggedWidgetId coincide
  // Cuando draggedWidgetId es null, el drag terminó así que opacity debe ser 1
  const isThisWidgetBeingDragged = draggedWidgetId === widget.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: (isPlacingWidget || isDraggingMode) ? 'all 0.3s ease-out' : transition,
    gridColumn: `${currentPosition.col} / span ${currentPosition.colSpan}`,
    gridRow: `${currentPosition.row} / span ${currentPosition.rowSpan}`,
    opacity: isThisWidgetBeingDragged ? 0 : 1, // Controlar opacity en style, no en className
  };

  // Renderizar widget según tipo
  const renderWidget = () => {
    switch (widget.type) {
      case 'kpi':
        return <KPIWidget widget={widget} />;
      case 'chart':
        return <LegacyWidgetWrapper Widget={ChartWidgetLegacy} widget={widget} />;
      case 'list':
        return <LegacyWidgetWrapper Widget={ListWidgetLegacy} widget={widget} />;
      case 'quick_actions':
        return <LegacyWidgetWrapper Widget={QuickActionsWidgetLegacy} widget={widget} />;
      case 'alerts':
        return <LegacyWidgetWrapper Widget={AlertsWidgetLegacy} widget={widget} />;
      case 'module_stats':
        return <LegacyWidgetWrapper Widget={ModuleStatsWidgetLegacy} widget={widget} />;
      default:
        return <div className="text-white/40 p-6">Widget tipo "{widget.type}" no disponible</div>;
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      style={style}
      className={cn(
        'group relative',
        'rounded-xl border border-white/10',
        'bg-white/5 backdrop-blur-xl',
        'transition-all duration-200',
        isEditing && 'hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-100',
        !isEditing && 'hover:border-white/20',
        // NO usar clase opacity-0, dejar que framer-motion controle la opacidad
        isResizing && 'ring-2 ring-blue-500 overflow-hidden'
      )}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {/* Edit Mode Controls */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            className="absolute top-2 right-2 z-10 flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Drag Handle */}
            <motion.button
              {...listeners}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-grab active:cursor-grabbing"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <GripVertical className="w-4 h-4" />
            </motion.button>
            
            {/* Config Button */}
            <motion.button
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              onClick={() => setShowConfigModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-4 h-4" />
            </motion.button>

            {/* Delete Button */}
            <motion.button
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
              onClick={() => setShowDeleteDialog(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Content */}
      <div className="h-full w-full overflow-auto">
        {renderWidget()}
      </div>

      {/* Resize Handles - Líneas Minimalistas */}
      {isEditing && (
        <>
          {/* Esquina superior izquierda - Línea curva */}
          <div
            className="absolute -top-0.5 -left-0.5 w-4 h-4 cursor-nw-resize opacity-0 group-hover:opacity-100 transition-all z-20"
            onMouseDown={(e) => handleResizeStart(e)}
            data-resize-direction="nw"
          >
            <svg className={cn(
              "w-full h-full stroke-white/60 stroke-[2]",
              isResizing && "stroke-blue-400"
            )} viewBox="0 0 16 16" fill="none">
              <path d="M 0 4 Q 0 0 4 0" />
            </svg>
          </div>

          {/* Lado superior - Línea horizontal */}
          <div
            className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 cursor-n-resize opacity-0 group-hover:opacity-100 transition-all z-20"
            onMouseDown={(e) => handleResizeStart(e)}
            data-resize-direction="n"
          >
            <div className={cn(
              "w-full h-full rounded-full bg-white/60",
              isResizing && "bg-blue-400"
            )} />
          </div>

          {/* Esquina superior derecha - Línea curva */}
          <div
            className="absolute -top-0.5 -right-0.5 w-4 h-4 cursor-ne-resize opacity-0 group-hover:opacity-100 transition-all z-20"
            onMouseDown={(e) => handleResizeStart(e)}
            data-resize-direction="ne"
          >
            <svg className={cn(
              "w-full h-full stroke-white/60 stroke-[2]",
              isResizing && "stroke-blue-400"
            )} viewBox="0 0 16 16" fill="none">
              <path d="M 12 0 Q 16 0 16 4" />
            </svg>
          </div>

          {/* Lado derecho - Línea vertical */}
          <div
            className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-8 cursor-e-resize opacity-0 group-hover:opacity-100 transition-all z-20"
            onMouseDown={(e) => handleResizeStart(e)}
            data-resize-direction="e"
          >
            <div className={cn(
              "w-full h-full rounded-full bg-white/60",
              isResizing && "bg-blue-400"
            )} />
          </div>

          {/* Esquina inferior derecha - Línea curva */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-all z-20"
            onMouseDown={(e) => handleResizeStart(e)}
            data-resize-direction="se"
          >
            <svg className={cn(
              "w-full h-full stroke-white/60 stroke-[2]",
              isResizing && "stroke-blue-400"
            )} viewBox="0 0 16 16" fill="none">
              <path d="M 16 12 Q 16 16 12 16" />
            </svg>
          </div>

          {/* Lado inferior - Línea horizontal */}
          <div
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 cursor-s-resize opacity-0 group-hover:opacity-100 transition-all z-20"
            onMouseDown={(e) => handleResizeStart(e)}
            data-resize-direction="s"
          >
            <div className={cn(
              "w-full h-full rounded-full bg-white/60",
              isResizing && "bg-blue-400"
            )} />
          </div>

          {/* Esquina inferior izquierda - Línea curva */}
          <div
            className="absolute -bottom-0.5 -left-0.5 w-4 h-4 cursor-sw-resize opacity-0 group-hover:opacity-100 transition-all z-20"
            onMouseDown={(e) => handleResizeStart(e)}
            data-resize-direction="sw"
          >
            <svg className={cn(
              "w-full h-full stroke-white/60 stroke-[2]",
              isResizing && "stroke-blue-400"
            )} viewBox="0 0 16 16" fill="none">
              <path d="M 0 12 Q 0 16 4 16" />
            </svg>
          </div>

          {/* Lado izquierdo - Línea vertical */}
          <div
            className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-8 cursor-w-resize opacity-0 group-hover:opacity-100 transition-all z-20"
            onMouseDown={(e) => handleResizeStart(e)}
            data-resize-direction="w"
          >
            <div className={cn(
              "w-full h-full rounded-full bg-white/60",
              isResizing && "bg-blue-400"
            )} />
          </div>
        </>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <WidgetConfigModal widget={widget} onClose={() => setShowConfigModal(false)} defaultTab="appearance" />
      )}

      {/* Dialog de Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => removeWidget(widget.id)}
        title="Eliminar Widget"
        message={`¿Estás seguro de que deseas eliminar el widget "${widget.title}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </motion.div>
  );
}
