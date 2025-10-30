import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'bg-white/5 border-white/10',
  success: 'bg-green-500/5 border-green-500/20',
  warning: 'bg-yellow-500/5 border-yellow-500/20',
  danger: 'bg-red-500/5 border-red-500/20',
  info: 'bg-blue-500/5 border-blue-500/20',
};

const iconStyles = {
  default: 'text-white/40',
  success: 'text-green-400/60',
  warning: 'text-yellow-400/60',
  danger: 'text-red-400/60',
  info: 'text-blue-400/60',
};

const labelStyles = {
  default: 'text-white/60',
  success: 'text-green-400/80',
  warning: 'text-yellow-400/80',
  danger: 'text-red-400/80',
  info: 'text-blue-400/80',
};

/**
 * Tarjeta de estadística reutilizable
 * Usada en dashboards para mostrar métricas
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  variant = 'default',
  className = ''
}: StatCardProps) {
  return (
    <div className={`backdrop-blur-sm rounded-2xl border p-4 ${variantStyles[variant]} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`text-sm ${labelStyles[variant]}`}>{label}</div>
        {Icon && <Icon className={`w-5 h-5 ${iconStyles[variant]}`} />}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
