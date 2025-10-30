import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Widget } from '../store/dashboardStore';
import { useDashboardStore } from '../store/dashboardStore';
import { apiClient } from '../../../api/client';
import Modal from '../../../shared/components/ui/Modal';
import Button from '../../../shared/components/ui/Button';
import Input from '../../../shared/components/ui/Input';
import Tabs, { type Tab } from '../../../shared/components/ui/Tabs';
import { Settings, Palette, Database, TrendingUp, CheckCircle, Loader2, BarChart3, Users, Package, Ticket, Monitor, Printer, ShoppingCart, Activity, Maximize2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

type TabType = 'data' | 'appearance' | 'config';

interface WidgetConfigModalProps {
  widget: Widget;
  onClose: () => void;
  defaultTab?: TabType;
}

interface Module {
  id: string;
  label: string;
  endpoint: string;
  fields: Field[];
}

interface Field {
  id: string;
  label: string;
  type: 'number' | 'chart' | 'list';
}

export default function WidgetConfigModal({ widget, onClose, defaultTab = 'data' }: WidgetConfigModalProps) {
  const { updateWidget } = useDashboardStore();
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [draft, setDraft] = useState<Widget>(widget);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');

  // Cargar metadata de módulos
  const { data: metadata } = useQuery({
    queryKey: ['widget-config-metadata'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/widget-config-metadata');
      return data as { modules: Module[] };
    },
  });

  const modules = metadata?.modules || [];
  const currentModule = modules.find(m => m.id === selectedModule);
  const fields = currentModule?.fields || [];

  // Preview de datos en tiempo real
  const { data: previewData, isLoading: loadingPreview } = useQuery({
    queryKey: ['widget-preview', currentModule?.endpoint, selectedField],
    queryFn: async () => {
      if (!currentModule?.endpoint) return null;
      const { data } = await apiClient.get(currentModule.endpoint);
      return data;
    },
    enabled: !!currentModule?.endpoint && !!selectedField,
    refetchInterval: 30000,
  });

  // Inicializar valores desde el widget existente
  useEffect(() => {
    if (draft.config?.dataSource) {
      setSelectedModule(draft.config.dataSource);
    }
    if (draft.config?.field) {
      setSelectedField(draft.config.field);
    }
  }, [draft.config]);

  const updateDraft = (updates: Partial<Widget>) => {
    setDraft(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateConfig = (configUpdates: Record<string, any>) => {
    setDraft(prev => ({
      ...prev,
      config: { ...prev.config, ...configUpdates },
    }));
    setHasChanges(true);
  };

  // Actualizar configuración cuando cambia módulo o campo
  const handleModuleChange = (moduleId: string) => {
    setSelectedModule(moduleId);
    setSelectedField(''); // Reset field
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      updateConfig({
        dataSource: moduleId,
        field: '',
      });
      updateDraft({
        dataSource: {
          endpoint: module.endpoint,
          refresh: draft.dataSource?.refresh || 60000,
        },
      });
    }
  };

  const handleFieldChange = (fieldId: string) => {
    setSelectedField(fieldId);
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      updateConfig({
        field: fieldId,
      });
    }
  };

  // Obtener valor del preview
  const getPreviewValue = () => {
    if (!previewData || !selectedField) return null;
    const value = previewData[selectedField];
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  const handleSave = () => {
    updateWidget(widget.id, draft);
    onClose();
  };

  const tabs: Tab[] = [
    { id: 'data', label: 'Datos', icon: Database },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Configurar Widget"
      className="max-w-3xl"
      footer={
        <div className="flex gap-3">
          <Button variant="default" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="glass"
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1"
          >
            Guardar cambios
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tabs */}
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={(id) => setActiveTab(id as TabType)} 
        />

        {/* Content */}
        <div className="space-y-4">
            {/* Data Tab - El más importante */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-400 mb-1">
                        Configura tu Widget
                      </div>
                      <div className="text-xs text-white/60">
                        Elige el módulo y el dato que quieres visualizar. El widget se actualizará automáticamente.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combobox de Módulo */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Módulo
                  </label>
                  <select
                    value={selectedModule}
                    onChange={(e) => handleModuleChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  >
                    <option value="" className="bg-gray-900">Selecciona un módulo...</option>
                    {modules.map(module => (
                      <option key={module.id} value={module.id} className="bg-gray-900">
                        {module.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Combobox de Campo */}
                {selectedModule && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Campo a Mostrar
                    </label>
                    <select
                      value={selectedField}
                      onChange={(e) => handleFieldChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    >
                      <option value="" className="bg-gray-900">Selecciona un campo...</option>
                      {fields.filter(f => f.type === 'number').map(field => (
                        <option key={field.id} value={field.id} className="bg-gray-900">
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Preview del Valor */}
                {selectedModule && selectedField && (
                  <div className="p-6 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
                    <div className="text-sm text-white/60 mb-2">Vista Previa</div>
                    {loadingPreview ? (
                      <div className="flex items-center gap-2 text-white/60">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Cargando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="text-4xl font-bold text-white">
                          {getPreviewValue() || '---'}
                        </div>
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                    )}
                    <div className="text-xs text-white/50 mt-2">
                      {currentModule?.label} › {fields.find(f => f.id === selectedField)?.label}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <Input
                  label="Título del Widget"
                  value={draft.title}
                  onChange={(e) => updateDraft({ title: e.target.value })}
                  placeholder="Ej: Total de Tickets"
                />

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Icono
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'TrendingUp', Icon: TrendingUp, label: 'Tendencia' },
                      { id: 'BarChart3', Icon: BarChart3, label: 'Gráfico' },
                      { id: 'Users', Icon: Users, label: 'Usuarios' },
                      { id: 'Package', Icon: Package, label: 'Paquete' },
                      { id: 'Ticket', Icon: Ticket, label: 'Ticket' },
                      { id: 'Monitor', Icon: Monitor, label: 'Monitor' },
                      { id: 'Printer', Icon: Printer, label: 'Impresora' },
                      { id: 'Activity', Icon: Activity, label: 'Actividad' },
                    ].map(({ id, Icon, label }) => (
                      <button
                        key={id}
                        onClick={() => updateConfig({ icon: id })}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          draft.config.icon === id
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-white/20 hover:border-white/40 bg-white/5'
                        }`}
                        title={label}
                      >
                        <Icon className="w-6 h-6 text-white" />
                        <span className="text-xs text-white/60">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { id: 'blue', class: 'from-blue-500 to-blue-600' },
                      { id: 'green', class: 'from-green-500 to-green-600' },
                      { id: 'purple', class: 'from-purple-500 to-purple-600' },
                      { id: 'orange', class: 'from-orange-500 to-orange-600' },
                      { id: 'red', class: 'from-red-500 to-red-600' },
                      { id: 'pink', class: 'from-pink-500 to-pink-600' },
                    ].map(({ id, class: colorClass }) => (
                      <button
                        key={id}
                        onClick={() => updateConfig({ color: id })}
                        className={`h-12 rounded-lg border-2 transition-all bg-gradient-to-br ${colorClass} ${
                          draft.config.color === id
                            ? 'border-white scale-110 ring-2 ring-white/50'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        title={id}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview Visual */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Vista Previa
                  </label>
                  <div className="p-6 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white/60 mb-1">{draft.title || 'Título del Widget'}</div>
                        <div className="text-3xl font-bold text-white">
                          {getPreviewValue() || '245'}
                        </div>
                      </div>
                      {(() => {
                        const IconComponent = (LucideIcons as any)[draft.config.icon || 'TrendingUp'];
                        return IconComponent ? <IconComponent className="w-8 h-8 text-white/40" /> : null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Config Tab */}
            {activeTab === 'config' && (
              <div className="space-y-4">
                <Input
                  label="Actualizar cada (segundos)"
                  type="number"
                  value={((draft.dataSource?.refresh || 60000) / 1000).toString()}
                  onChange={(e) =>
                    updateDraft({
                      dataSource: {
                        ...draft.dataSource,
                        endpoint: draft.dataSource?.endpoint || '',
                        refresh: parseInt(e.target.value) * 1000 || 60000,
                      },
                    })
                  }
                  placeholder="60"
                />

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Tamaño del Widget
                  </label>
                  <button
                    onClick={() => {
                      handleSave();
                      // El usuario podrá redimensionar directamente en el widget
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Maximize2 className="w-5 h-5" />
                    <span>Redimensionar en el Widget</span>
                  </button>
                  <p className="text-xs text-white/50 mt-2">
                    Guarda los cambios y arrastra desde la esquina inferior derecha del widget para redimensionarlo.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
}
