import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Search, BarChart3, MessageSquare, Hash, Clock, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import messageTemplateService, { MessageTemplate, CreateMessageTemplateData } from '../services/messageTemplateService';

interface MessageTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessageTemplateManager: React.FC<MessageTemplateManagerProps> = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const [formData, setFormData] = useState<CreateMessageTemplateData>({
    name: '',
    content: '',
    category: '',
    shortcut: '',
    isShared: false
  });

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await messageTemplateService.getTemplates({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        limit: 100
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

  const loadStats = async () => {
    try {
      const statsData = await messageTemplateService.getUsageStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Error cargando estadísticas');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await messageTemplateService.createTemplate(formData);
      toast.success('Plantilla creada exitosamente');
      setShowCreateModal(false);
      setFormData({ name: '', content: '', category: '', shortcut: '', isShared: false });
      loadTemplates();
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'Error creando plantilla');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      await messageTemplateService.updateTemplate(selectedTemplate.id, formData);
      toast.success('Plantilla actualizada exitosamente');
      setShowEditModal(false);
      setSelectedTemplate(null);
      setFormData({ name: '', content: '', category: '', shortcut: '', isShared: false });
      loadTemplates();
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'Error actualizando plantilla');
    }
  };

  const handleDelete = async (template: MessageTemplate) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la plantilla "${template.name}"?`)) {
      return;
    }

    try {
      await messageTemplateService.deleteTemplate(template.id);
      toast.success('Plantilla eliminada exitosamente');
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Error eliminando plantilla');
    }
  };

  const handleEditClick = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category || '',
      shortcut: template.shortcut || '',
      isShared: template.isShared
    });
    setShowEditModal(true);
  };

  const handleCreateDefaults = async () => {
    try {
      await messageTemplateService.createDefaultTemplates();
      toast.success('Plantillas por defecto creadas exitosamente');
      loadTemplates();
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'Error creando plantillas por defecto');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'saludo': 'bg-green-100 text-green-800',
      'despedida': 'bg-red-100 text-red-800',
      'información': 'bg-blue-100 text-blue-800',
      'consulta': 'bg-yellow-100 text-yellow-800',
      'transferencia': 'bg-purple-100 text-purple-800',
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Gestión de Plantillas
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Administra tus plantillas de mensajes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadStats();
                setShowStats(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nueva Plantilla
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
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
            <button
              onClick={handleCreateDefaults}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Crear Plantillas por Defecto
            </button>
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-6">
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
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery || selectedCategory 
                  ? 'No se encontraron plantillas con los filtros aplicados'
                  : 'Aún no hay plantillas creadas'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Crear Primera Plantilla
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
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
                          <span className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                            <Share2 className="w-3 h-3" />
                            Compartida
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {template.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(template.createdAt)}
                        </span>
                        <span>por {template.createdBy.name}</span>
                        <span>{template.usageCount} usos</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditClick(template)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Nueva Plantilla
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contenido *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="general"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Atajo (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.shortcut}
                    onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="/hola"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isShared"
                    checked={formData.isShared}
                    onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isShared" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Compartir con todo el equipo
                  </label>
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Crear Plantilla
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ name: '', content: '', category: '', shortcut: '', isShared: false });
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Editar Plantilla
              </h3>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contenido *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="general"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Atajo (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.shortcut}
                    onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="/hola"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isSharedEdit"
                    checked={formData.isShared}
                    onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isSharedEdit" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Compartir con todo el equipo
                  </label>
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Actualizar Plantilla
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedTemplate(null);
                      setFormData({ name: '', content: '', category: '', shortcut: '', isShared: false });
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && stats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Estadísticas de Plantillas
                </h3>
                <button
                  onClick={() => setShowStats(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Total de Plantillas
                  </h4>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {stats.totalTemplates}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-700 dark:text-green-300">
                    Usos Totales
                  </h4>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {stats.totalUsage}
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Plantillas Más Usadas
                </h4>
                <div className="space-y-2">
                  {stats.topTemplates.map((template: any, index: number) => (
                    <div key={template.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {index + 1}. {template.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {template.usageCount} usos
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Categorías
                </h4>
                <div className="space-y-2">
                  {stats.categoriesStats.map((category: any) => (
                    <div key={category.category} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {category.category}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {category.count} plantillas
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageTemplateManager; 