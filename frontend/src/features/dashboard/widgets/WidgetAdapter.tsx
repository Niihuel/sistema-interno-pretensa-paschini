/**
 * Adaptador temporal para widgets legacy
 * Convierte el nuevo tipo de Widget al formato antiguo
 */

import type { Widget } from '../store/dashboardStore';

export function adaptWidgetToLegacy(widget: Widget): any {
  return {
    ...widget,
    layout: {
      i: widget.id,
      x: widget.position.col - 1,
      y: widget.position.row - 1,
      w: widget.position.colSpan,
      h: widget.position.rowSpan,
    },
  };
}

// Wrapper simple para widgets legacy
export function LegacyWidgetWrapper({ 
  Widget: WidgetComponent, 
  widget 
}: { 
  Widget: React.ComponentType<any>; 
  widget: Widget;
}) {
  const legacyWidget = adaptWidgetToLegacy(widget);
  
  return (
    <WidgetComponent 
      widget={legacyWidget}
      onEdit={() => {}}
      onDelete={() => {}}
      onRefresh={() => {}}
      isEditing={false}
    />
  );
}
