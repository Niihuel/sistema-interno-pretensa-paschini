import { useMemo } from 'react';
import type { Widget } from '../types/widget.types';

interface ResizeOverlayProps {
  widget: Widget;
  currentSize: { w: number; h: number };
  gridPosition: { x: number; y: number };
  isAtMinLimit?: boolean;
  isAtMaxLimit?: boolean;
  position?: { x: number; y: number };
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function ResizeOverlay({
  currentSize,
  gridPosition,
  isAtMinLimit = false,
  isAtMaxLimit = false,
  position,
}: ResizeOverlayProps) {
  const { w, h } = currentSize;
  const statusLabel = isAtMaxLimit ? 'Tamaño máximo' : isAtMinLimit ? 'Tamaño mínimo' : null;

  const overlayStyle = useMemo(() => {
    if (typeof window === 'undefined') {
      return { left: '24px', top: '24px' };
    }

    const desiredLeft = (position?.x ?? 0) + 12;
    const desiredTop = (position?.y ?? 0) + 12;

    const left = clamp(desiredLeft, 12, window.innerWidth - 168);
    const top = clamp(desiredTop, 12, window.innerHeight - 120);

    return { left: `${left}px`, top: `${top}px` };
  }, [position]);

  return (
    <div className="pointer-events-none fixed z-[9999]" style={overlayStyle}>
      <div className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 shadow-lg backdrop-blur-sm">
        <div className="flex items-baseline gap-1 text-white">
          <span className="text-xl font-semibold tabular-nums">{w}</span>
          <span className="text-base text-slate-500">×</span>
          <span className="text-xl font-semibold tabular-nums">{h}</span>
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
          Col {gridPosition.x + 1} · Fila {gridPosition.y + 1}
        </div>
        {statusLabel && (
          <div className="mt-1 inline-flex rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-200">
            {statusLabel}
          </div>
        )}
      </div>
    </div>
  );
}
