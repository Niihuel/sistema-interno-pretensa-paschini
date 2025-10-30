import { useState, useEffect, useCallback } from 'react';
import type { Widget, DashboardLayout } from '../types/widget.types';
import { exportDashboardConfig, downloadDashboardConfig, importDashboardConfig, readFileAsText } from '../utils/exportImport';

interface UseDashboardWidgetsOptions {
  layoutId?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

// Validate and fix widget layout - defined outside to avoid recreation
const validateWidget = (widget: Widget): Widget | null => {
  // Return null if widget is invalid
  if (!widget || !widget.id || !widget.type) {
    console.warn('Invalid widget structure:', widget);
    return null;
  }

  // Ensure layout has all required properties with valid numbers
  const layout = {
    x: typeof widget.layout?.x === 'number' && !isNaN(widget.layout.x) ? widget.layout.x : 0,
    y: typeof widget.layout?.y === 'number' && !isNaN(widget.layout.y) ? widget.layout.y : 0,
    w: typeof widget.layout?.w === 'number' && !isNaN(widget.layout.w) ? widget.layout.w : 4,
    h: typeof widget.layout?.h === 'number' && !isNaN(widget.layout.h) ? widget.layout.h : 4,
    minW: typeof widget.layout?.minW === 'number' ? widget.layout.minW : 2,
    minH: typeof widget.layout?.minH === 'number' ? widget.layout.minH : 2,
    maxW: widget.layout?.maxW,
    maxH: widget.layout?.maxH,
  };

  return {
    ...widget,
    layout,
  };
};

export function useDashboardWidgets(options: UseDashboardWidgetsOptions = {}) {
  const { layoutId, autoSave = false, autoSaveDelay = 2000 } = options;

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(null);

  // Load dashboard from localStorage or API
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      // Define storageKey outside try-catch so it's accessible in catch block
      const storageKey = layoutId ? `dashboard-layout-${layoutId}` : 'dashboard-layout-default';

      try {
        // Try to load from localStorage first
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          const layout: DashboardLayout = JSON.parse(stored);
          // Validate all widgets to ensure they have valid layout properties
          // Filter out any null widgets (validation failures)
          const validatedWidgets = (layout.widgets || [])
            .map(validateWidget)
            .filter((w): w is Widget => w !== null);
          
          // If some widgets were invalid, save the cleaned version
          if (validatedWidgets.length < (layout.widgets || []).length) {
            console.warn('Removed invalid widgets from dashboard');
            layout.widgets = validatedWidgets;
            localStorage.setItem(storageKey, JSON.stringify(layout));
          }
          
          setWidgets(validatedWidgets);
          setCurrentLayout(layout);
        } else {
          // Load default empty layout
          setWidgets([]);
        }
      } catch (err: any) {
        console.error('Error parsing stored dashboard:', err);
        // If JSON parse fails, clear the corrupted data
        try {
          localStorage.removeItem(storageKey);
          console.warn('Cleared corrupted dashboard data from localStorage');
        } catch (e) {
          console.error('Failed to clear corrupted data:', e);
        }
        setError('Dashboard corrupto. Se creará uno nuevo.');
        setWidgets([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [layoutId]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      saveDashboard();
    }, autoSaveDelay);

    return () => clearTimeout(timer);
  }, [autoSave, hasUnsavedChanges, widgets, autoSaveDelay]);

  // Save dashboard to localStorage or API
  const saveDashboard = useCallback(async () => {
    try {
      const storageKey = layoutId ? `dashboard-layout-${layoutId}` : 'dashboard-layout-default';

      const layout: DashboardLayout = {
        id: layoutId || 'default',
        name: currentLayout?.name || 'Mi Dashboard',
        description: currentLayout?.description,
        userId: 0, // TODO: Get from auth context
        widgets,
        theme: currentLayout?.theme || 'zinc',
        isDefault: currentLayout?.isDefault || false,
        isPublic: currentLayout?.isPublic || false,
        createdAt: currentLayout?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      localStorage.setItem(storageKey, JSON.stringify(layout));
      setCurrentLayout(layout);
      setHasUnsavedChanges(false);

      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Error guardando dashboard');
      return { success: false, error: err.message };
    }
  }, [widgets, layoutId, currentLayout]);

  // Add widget
  const addWidget = useCallback((widget: Widget) => {
    setWidgets((prev) => {
      // Find the maximum Y position to place the new widget at the bottom
      const maxY = prev.reduce((max, w) => Math.max(max, w.layout.y + w.layout.h), 0);

      const validatedWidget = validateWidget({
        ...widget,
        layout: {
          ...widget.layout,
          y: maxY, // Place at the bottom
        },
      });

      // Only add if validation succeeded
      if (!validatedWidget) {
        console.error('Failed to add widget - validation failed:', widget);
        return prev;
      }

      return [...prev, validatedWidget];
    });
    setHasUnsavedChanges(true);
  }, []);

  // Update widget
  const updateWidget = useCallback((widgetId: string, updates: Partial<Widget>) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === widgetId
          ? { ...widget, ...updates }
          : widget
      )
    );
    setHasUnsavedChanges(true);
  }, []);

  // Delete widget
  const deleteWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    setHasUnsavedChanges(true);
  }, []);

  // Update layout (from drag/resize)
  const updateLayout = useCallback((updatedWidgets: Widget[]) => {
    const validatedWidgets = updatedWidgets
      .map(validateWidget)
      .filter((w): w is Widget => w !== null);
    setWidgets(validatedWidgets);
    setHasUnsavedChanges(true);
  }, []);

  // Refresh widget data
  const refreshWidget = useCallback((widgetId: string) => {
    // This will trigger a re-render of the widget component
    // The widget component will handle the data refresh
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === widgetId
          ? { ...widget, layout: { ...widget.layout } } // Force update
          : widget
      )
    );
  }, []);

  // Export dashboard
  const exportDashboard = useCallback(() => {
    const config = exportDashboardConfig(
      currentLayout?.name || 'Mi Dashboard',
      currentLayout?.description,
      currentLayout?.theme || 'zinc',
      widgets
    );
    downloadDashboardConfig(config);
  }, [widgets, currentLayout]);

  // Import dashboard
  const importDashboard = useCallback(async (file: File) => {
    try {
      const text = await readFileAsText(file);
      const result = importDashboardConfig(text);

      if (!result.success || !result.config) {
        setError(result.error || 'Error importando configuración');
        return { success: false, error: result.error };
      }

      // Replace current widgets with imported ones, validating each widget
      const validatedWidgets = result.config.widgets
        .map(validateWidget)
        .filter((w): w is Widget => w !== null);
      setWidgets(validatedWidgets);
      setHasUnsavedChanges(true);

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Error importando dashboard';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Edit mode helpers
  const setEditMode = useCallback((value: boolean) => {
    setIsEditing(value);
  }, []);

  const enterEditMode = useCallback(() => {
    setIsEditing(true);
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditing(false);
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    widgets,
    isEditing,
    hasUnsavedChanges,
    loading,
    error,
    currentLayout,

    // Actions
    addWidget,
    updateWidget,
    deleteWidget,
    updateLayout,
    refreshWidget,
    saveDashboard,
    exportDashboard,
    importDashboard,
    toggleEditMode,
    setEditMode,
    enterEditMode,
    exitEditMode,
    clearError,
  };
}
