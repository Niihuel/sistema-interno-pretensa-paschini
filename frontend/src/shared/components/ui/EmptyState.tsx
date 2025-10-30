import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Estado vacío reutilizable
 * Usado cuando no hay datos para mostrar
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-white/40" />
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-white mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-white/60 text-sm mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
