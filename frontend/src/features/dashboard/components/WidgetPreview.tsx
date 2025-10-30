import { motion } from 'framer-motion';
import type { Widget } from '../store/dashboardStore';
import { cn } from '../../../shared/utils/cn';
import { 
  Activity,
  BarChart3,
  TrendingUp,
  ClipboardList,
  Zap,
  Ticket,
  Clock,
  Monitor,
  Server,
  Printer,
  ShoppingCart,
  PieChart,
  LineChart,
  BarChart,
  Users,
  Package,
  DollarSign,
  Laptop,
  Briefcase
} from 'lucide-react';

interface WidgetPreviewProps {
  widget: Omit<Widget, 'id'>;
  position: { col: number; row: number };
}

// Helper para obtener componente de icono
const getIconComponent = (iconName?: string) => {
  const iconMap: Record<string, any> = {
    Activity,
    BarChart3,
    TrendingUp,
    ClipboardList,
    Zap,
    Ticket,
    Clock,
    Monitor,
    Server,
    Printer,
    ShoppingCart,
    PieChart,
    LineChart,
    BarChart,
    Users,
    Package,
    DollarSign,
    Laptop,
    Briefcase,
  };
  return iconMap[iconName || ''] || Activity;
};

export function WidgetPreview({ widget, position }: WidgetPreviewProps) {
  const style = {
    gridColumn: `${position.col} / span ${widget.position.colSpan}`,
    gridRow: `${position.row} / span ${widget.position.rowSpan}`,
  };

  const IconComponent = getIconComponent(widget.config?.icon);

  return (
    <motion.div
      style={style}
      className={cn(
        'relative',
        'rounded-xl border-2 border-blue-400',
        'bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl',
        'pointer-events-none z-30',
        'shadow-2xl shadow-blue-500/50'
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Grid pattern de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(59, 130, 246, 0.3) 0px, rgba(59, 130, 246, 0.3) 1px, transparent 1px, transparent 12px),
            repeating-linear-gradient(90deg, rgba(59, 130, 246, 0.3) 0px, rgba(59, 130, 246, 0.3) 1px, transparent 1px, transparent 12px)
          `,
          backgroundSize: '12px 12px'
        }} />
      </div>

      {/* Contenido */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-xl bg-blue-500/30 border-2 border-blue-400/50 flex items-center justify-center mb-3">
          <IconComponent className="w-7 h-7 text-blue-300" />
        </div>
        <div className="text-lg font-bold text-white mb-1">{widget.title}</div>
        <div className="text-xs text-blue-300 font-medium mb-2">
          {widget.position.colSpan} × {widget.position.rowSpan} celdas
        </div>
        <div className="mt-2 text-xs text-blue-200 bg-blue-500/30 px-3 py-1.5 rounded-full font-medium">
          Click para colocar aquí
        </div>
      </div>

      {/* Efecto de brillo pulsante */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-blue-400/20"
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Bordes animados */}
      <motion.div
        className="absolute inset-0 rounded-xl border-2 border-blue-300"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}
