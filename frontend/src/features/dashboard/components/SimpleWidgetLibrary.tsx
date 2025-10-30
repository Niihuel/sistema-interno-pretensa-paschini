import { useState } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  BarChart3, 
  TrendingUp, 
  ClipboardList, 
  Zap,
  List,
  Bell,
  LayoutGrid
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { widgetTemplates, getCategories, type WidgetTemplate } from '../config/widgetTemplates';

interface SimpleWidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WidgetTemplate) => void;
}

// Helper para obtener componente de icono por nombre
const getIconComponent = (iconName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    BarChart3,
    TrendingUp,
    ClipboardList,
    Zap,
    List,
    Bell,
    LayoutGrid,
    Sparkles,
  };
  return iconMap[iconName] || Sparkles;
};

/**
 * Librería de widgets simplificada - Sin tecnicismos
 * El usuario ve "Qué quieres mostrar" en lugar de configurar endpoints
 */
export default function SimpleWidgetLibrary({
  isOpen,
  onClose,
  onSelectTemplate,
}: SimpleWidgetLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = getCategories();

  // Filtrar plantillas
  const filteredTemplates = widgetTemplates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-gray-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Agregar Widget</h2>
              <p className="text-sm text-white/60 mt-1">¿Qué información quieres mostrar en tu dashboard?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-white/10 bg-white/5">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              Todos
            </button>
            {categories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/60 mb-2">No se encontraron widgets</p>
              <p className="text-sm text-white/40">Intenta con otra búsqueda o categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const TemplateIcon = getIconComponent(template.icon);
                const categoryInfo = categories.find((c) => c.id === template.category);
                const CategoryIcon = categoryInfo ? getIconComponent(categoryInfo.icon) : Sparkles;
                
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      onSelectTemplate(template);
                      onClose();
                    }}
                    className="group relative p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all text-left"
                  >
                    {/* Icon Badge */}
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <TemplateIcon className="w-6 h-6 text-blue-400" />
                    </div>

                    {/* Name */}
                    <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-white/60 leading-relaxed">{template.description}</p>

                    {/* Category Badge */}
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 text-xs text-white/70">
                      <CategoryIcon className="w-3 h-3" />
                      <span>{categoryInfo?.label}</span>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all pointer-events-none" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <p className="text-xs text-white/40 text-center">
            Tip: Puedes personalizar el título y colores después de agregar el widget
          </p>
        </div>
      </div>
    </div>
  );
}
