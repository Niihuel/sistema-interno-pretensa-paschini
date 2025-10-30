import { useState } from 'react';
import { X, Search, LayoutGrid, BarChart3, TrendingUp, List, Bell, Zap, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { widgetTemplates, getCategories, type WidgetTemplate } from '../config/widgetTemplates';

const categories = getCategories();

// Helper para obtener componente de icono
const getIconComponent = (iconName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    BarChart3,
    TrendingUp,
    List,
    Bell,
    Zap,
    LayoutGrid,
    Activity,
  };
  return iconMap[iconName] || Activity;
};

interface WidgetPickerNewProps {
  onClose: () => void;
}

export function WidgetPickerNew({ onClose }: WidgetPickerNewProps) {
  const { startWidgetPlacement } = useDashboardStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectTemplate = (template: WidgetTemplate) => {
    // Crear widget base desde el template genérico
    const newWidget = {
      type: template.type,
      title: template.name,
      position: { col: 1, row: 1, colSpan: 3, rowSpan: 2 },
      config: {
        title: template.name,
        icon: template.icon,
      },
    };
    
    // Iniciar modo de colocación con el widget seleccionado
    startWidgetPlacement(newWidget as any);
    
    // Cerrar el modal
    onClose();
  };

  // Filtrar templates
  const filteredTemplates = widgetTemplates.filter((template) => {
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex max-h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-500/30">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Librería de Widgets</h2>
              <p className="mt-1 text-sm text-white/60">Selecciona un template pre-configurado</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

          {/* Search & Filters */}
          <div className="border-b border-white/10 bg-white/5 p-4">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Buscar widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

        {/* Templates Grid */}
        <div className="min-h-[320px] flex-1 overflow-y-auto px-6 py-6">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Search className="h-8 w-8 text-white/20" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-white">No se encontraron widgets</h3>
              <p className="text-sm text-white/60">Intenta con otra búsqueda o categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const IconComponent = getIconComponent(template.icon);
                const categoryInfo = categories.find(c => c.id === template.category);
                
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="group relative rounded-xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-white/20 hover:bg-white/10 hover:border-blue-400/40"
                  >
                    {/* Icon */}
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-500/30 transition-transform group-hover:scale-110">
                      <IconComponent className="h-7 w-7 text-blue-400" />
                    </div>

                    {/* Content */}
                    <div className="mb-3">
                      <h3 className="mb-1 font-semibold text-white">{template.name}</h3>
                      <p className="line-clamp-2 text-xs text-white/50">{template.description}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded bg-white/10 px-2 py-1 text-white/60">
                        {categoryInfo?.label || 'Widget'}
                      </span>
                      <span className="text-white/40">
                        3x2
                      </span>
                    </div>

                    {/* Hover Glow */}
                    <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 to-blue-500/0 transition-all group-hover:from-blue-500/10 group-hover:to-blue-500/10" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-white/10 px-6 py-5">
          <div className="text-xs text-white/50">
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'widget' : 'widgets'} disponibles
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
