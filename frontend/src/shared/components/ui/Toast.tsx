/**
 * Toast Notification Component
 * 
 * Simple toast notification system for user feedback
 */

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: AlertCircle,
};

const TOAST_COLORS = {
  success: 'from-green-500 to-emerald-500',
  error: 'from-red-500 to-rose-500',
  warning: 'from-yellow-500 to-orange-500',
  info: 'from-blue-500 to-cyan-500',
};

export default function Toast({
  id,
  type,
  title,
  description,
  duration = 5000,
  onClose,
}: ToastProps) {
  const Icon = TOAST_ICONS[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg shadow-2xl',
        'bg-gray-900/95 backdrop-blur-xl border border-white/10',
        'animate-in slide-in-from-right-full duration-300',
        'min-w-[320px] max-w-md'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
          'bg-gradient-to-br',
          TOAST_COLORS[type]
        )}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white">{title}</div>
        {description && (
          <div className="text-sm text-white/70 mt-1">{description}</div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-white/60" />
      </button>
    </div>
  );
}
