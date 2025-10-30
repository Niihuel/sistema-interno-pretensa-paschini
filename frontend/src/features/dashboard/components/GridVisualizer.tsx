import { useGridSystem, type GridConfig } from '../hooks/useGridSystem';

type GridVisualizerMode = 'idle' | 'resize' | 'move' | 'preview';

interface GridVisualizerProps {
  config: GridConfig;
  isResizing?: boolean;
  activeArea?: { x: number; y: number; w: number; h: number };
  mode?: GridVisualizerMode;
}

const MODE_STROKE: Record<GridVisualizerMode, string> = {
  idle: 'rgba(148, 163, 184, 0.28)',
  resize: 'rgba(99, 102, 241, 0.6)',
  move: 'rgba(16, 185, 129, 0.55)',
  preview: 'rgba(168, 85, 247, 0.55)',
};

export default function GridVisualizer({
  config,
  isResizing = false,
  activeArea,
  mode,
}: GridVisualizerProps) {
  if (!activeArea) {
    return null;
  }

  const resolvedMode: GridVisualizerMode = mode ?? (isResizing ? 'resize' : 'idle');
  const grid = useGridSystem(config);
  const activeBounds = grid.getWidgetPixelBounds(activeArea);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="absolute inset-0 h-full w-full">
        <rect
          x={activeBounds.x}
          y={activeBounds.y}
          width={activeBounds.width}
          height={activeBounds.height}
          stroke={MODE_STROKE[resolvedMode]}
          strokeWidth={2}
          strokeDasharray={resolvedMode === 'move' ? '10,6' : '6,6'}
          fill="rgba(15, 23, 42, 0.08)"
          rx={8}
          ry={8}
        />

        <rect
          x={activeBounds.x}
          y={0}
          width={activeBounds.width}
          height="100%"
          fill="rgba(148, 163, 184, 0.055)"
        />

        <rect
          x={0}
          y={activeBounds.y}
          width="100%"
          height={activeBounds.height}
          fill="rgba(148, 163, 184, 0.04)"
        />

        <text
          x={activeBounds.x + activeBounds.width - 8}
          y={activeBounds.y + activeBounds.height - 10}
          fill="rgba(226, 232, 240, 0.85)"
          fontSize="11"
          fontWeight="600"
          textAnchor="end"
          className="tabular-nums"
        >
          {activeArea.w} × {activeArea.h}
        </text>
      </svg>
    </div>
  );
}
