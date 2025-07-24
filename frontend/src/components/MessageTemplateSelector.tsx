import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Hash, Clock, X, Eye, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import messageTemplateService, { MessageTemplate } from '../services/messageTemplateService';

interface MessageTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: MessageTemplate) => void;
  currentMessage?: string;
  position?: { top: number; left: number };
}

const MessageTemplateSelector: React.FC<MessageTemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  position
}) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadCategories();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [selectedCategory, searchQuery]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await messageTemplateService.getTemplates({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        isActive: true,
        limit: 50
      });
      setTemplates(result.templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error cargando plantillas');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await messageTemplateService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSelectTemplate = async (template: MessageTemplate) => {
    try {
      // Incrementar contador de uso
      await messageTemplateService.incrementUsage(template.id);
      
      // Llamar callback
      onSelectTemplate(template);
      
      // Cerrar modal
      onClose();
    } catch (error) {
      console.error('Error selecting template:', error);
      // Aún así permitir el uso de la plantilla
      onSelectTemplate(template);
      onClose();
    }
  };

  const handlePreview = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'greeting': 'bg-green-100 text-green-800',
      'closing': 'bg-blue-100 text-blue-800',
      'FAQ': 'bg-purple-100 text-purple-800',
      'support': 'bg-yellow-100 text-yellow-800',
      'sales': 'bg-orange-100 text-orange-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  const modalStyle = position ? {
    position: 'absolute' as const,
    top: position.top,
    left: position.left,
    transform: 'translate(-50%, -100%)',
    zIndex: 1000,
  } : {};

  return (
    <>
      {/* Overlay */}
      {!position && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      )}
      
      {/* Modal */}
      <div 
        className={`${position ? 'absolute' : 'fixed inset-0 flex items-center justify-center z-50'}`}
        style={modalStyle}
      >
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${position ? 'w-96' : 'w-full max-w-4xl mx-4'} max-h-[80vh] flex flex-col`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Plantillas de Mensajes
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {templates.length} plantillas disponibles
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar plantillas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay plantillas
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || selectedCategory 
                    ? 'No se encontraron plantillas con los filtros aplicados'
                    : 'Aún no hay plantillas creadas'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {template.name}
                          </h4>
                          {template.category && (
                            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                          )}
                          {template.shortcut && (
                            <span className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                              <Hash className="w-3 h-3" />
                              {template.shortcut}
                            </span>
                          )}
                          {template.isShared && (
                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                              Compartida
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {template.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(template.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {template.usageCount} usos
                          </span>
                          <span>por {template.createdBy.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(template);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          title="Vista previa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 Tip: Usa atajos como /hola para insertar plantillas rápidamente
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vista Previa
                </h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {selectedTemplate.name}
                </h4>
                <div className="flex items-center gap-2 mb-4">
                  {selectedTemplate.category && (
                    <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(selectedTemplate.category)}`}>
                      {selectedTemplate.category}
                    </span>
                  )}
                  {selectedTemplate.shortcut && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                      <Hash className="w-3 h-3" />
                      {selectedTemplate.shortcut}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {selectedTemplate.content}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Creado por: {selectedTemplate.createdBy.name}</p>
                  <p>Usado: {selectedTemplate.usageCount} veces</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      handleSelectTemplate(selectedTemplate);
                      setShowPreview(false);
                    }}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Usar Plantilla
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageTemplateSelector; 