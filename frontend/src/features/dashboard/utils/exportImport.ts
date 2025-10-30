import type { Widget, ExportableDashboardConfig } from '../types/widget.types';

const EXPORT_VERSION = '1.0.0';

/**
 * Export dashboard configuration to JSON
 */
export const exportDashboardConfig = (
  name: string,
  description: string | undefined,
  theme: string,
  widgets: Widget[]
): ExportableDashboardConfig => {
  return {
    version: EXPORT_VERSION,
    name,
    description,
    theme,
    widgets,
    exportedAt: new Date().toISOString(),
  };
};

/**
 * Download dashboard configuration as JSON file
 */
export const downloadDashboardConfig = (config: ExportableDashboardConfig) => {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `dashboard-${config.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Validate imported dashboard configuration
 */
export const validateDashboardConfig = (config: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config) {
    errors.push('Configuración vacía o inválida');
    return { valid: false, errors };
  }

  if (!config.version) {
    errors.push('Versión no especificada');
  }

  if (!config.name || typeof config.name !== 'string') {
    errors.push('Nombre inválido o faltante');
  }

  if (!config.theme || typeof config.theme !== 'string') {
    errors.push('Tema inválido o faltante');
  }

  if (!Array.isArray(config.widgets)) {
    errors.push('Lista de widgets inválida o faltante');
  } else {
    // Validate each widget
    config.widgets.forEach((widget: any, index: number) => {
      if (!widget.id) {
        errors.push(`Widget ${index + 1}: ID faltante`);
      }
      if (!widget.type) {
        errors.push(`Widget ${index + 1}: Tipo faltante`);
      }
      if (!widget.config) {
        errors.push(`Widget ${index + 1}: Configuración faltante`);
      }
      if (!widget.layout) {
        errors.push(`Widget ${index + 1}: Layout faltante`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Import dashboard configuration from JSON
 */
export const importDashboardConfig = (json: string): { success: boolean; config?: ExportableDashboardConfig; error?: string } => {
  try {
    const config = JSON.parse(json);
    const validation = validateDashboardConfig(config);

    if (!validation.valid) {
      return {
        success: false,
        error: `Configuración inválida:\n${validation.errors.join('\n')}`,
      };
    }

    // Generate new IDs for widgets to avoid conflicts
    const configWithNewIds: ExportableDashboardConfig = {
      ...config,
      widgets: config.widgets.map((widget: Widget) => ({
        ...widget,
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
    };

    return {
      success: true,
      config: configWithNewIds,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Error al parsear JSON: ${error.message}`,
    };
  }
};

/**
 * Read file as text
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsText(file);
  });
};

/**
 * Trigger file input for import
 */
export const triggerImportFile = (onFileSelected: (file: File) => void) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };
  input.click();
};
