import { type ReactNode } from 'react';
import type { Widget } from '../types/widget.types';

interface WidgetThemeWrapperProps {
  widget: Widget;
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper simple para widgets
 */
export default function WidgetThemeWrapper({ widget, children, className = '' }: WidgetThemeWrapperProps) {
  return (
    <div
      className={`widget-themed ${className}`}
      data-widget-id={widget.id}
    >
      {children}
    </div>
  );
}
