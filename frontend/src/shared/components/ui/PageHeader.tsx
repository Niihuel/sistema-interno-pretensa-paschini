import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

/**
 * PageHeader - Componente reutilizable para encabezados de página
 * Proporciona un diseño consistente para títulos y descripciones
 */
export default function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-400" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">{title}</h1>
            {description && (
              <p className="text-white/60 text-sm">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
