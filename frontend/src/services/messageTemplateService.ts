import api from './api';

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category?: string;
  shortcut?: string;
  isActive: boolean;
  isShared: boolean;
  usageCount: number;
  companyId: string;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplateFilters {
  category?: string;
  search?: string;
  isActive?: boolean;
  isShared?: boolean;
  createdBy?: string;
  page?: number;
  limit?: number;
}

export interface CreateMessageTemplateData {
  name: string;
  content: string;
  category?: string;
  shortcut?: string;
  isShared?: boolean;
}

export interface UpdateMessageTemplateData {
  name?: string;
  content?: string;
  category?: string;
  shortcut?: string;
  isActive?: boolean;
  isShared?: boolean;
}

export interface TemplateUsageStats {
  totalTemplates: number;
  totalUsage: number;
  topTemplates: Array<{
    id: string;
    name: string;
    usageCount: number;
  }>;
  categoriesStats: Array<{
    category: string;
    count: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class MessageTemplateService {
  // Obtener plantillas con filtros
  async getTemplates(filters: MessageTemplateFilters = {}): Promise<{
    templates: MessageTemplate[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.isShared !== undefined) params.append('isShared', filters.isShared.toString());
      if (filters.createdBy) params.append('createdBy', filters.createdBy);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get<ApiResponse<MessageTemplate[]>>(`/message-templates?${params.toString()}`);
      
      return {
        templates: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }
      };
    } catch (error) {
      console.error('Error getting message templates:', error);
      throw new Error('No se pudieron obtener las plantillas de mensajes');
    }
  }

  // Obtener plantilla por ID
  async getTemplate(id: string): Promise<MessageTemplate> {
    try {
      const response = await api.get<ApiResponse<MessageTemplate>>(`/message-templates/${id}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Plantilla no encontrada');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting message template:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo plantilla');
    }
  }

  // Buscar plantilla por shortcut
  async getTemplateByShortcut(shortcut: string): Promise<MessageTemplate | null> {
    try {
      const response = await api.get<ApiResponse<MessageTemplate>>(`/message-templates/shortcut/${shortcut}`);
      
      if (!response.data.success || !response.data.data) {
        return null;
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error getting template by shortcut:', error);
      throw new Error(error.response?.data?.message || 'Error buscando plantilla');
    }
  }

  // Crear nueva plantilla
  async createTemplate(data: CreateMessageTemplateData): Promise<MessageTemplate> {
    try {
      const response = await api.post<ApiResponse<MessageTemplate>>('/message-templates', data);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error creando plantilla');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating message template:', error);
      throw new Error(error.response?.data?.message || 'Error creando plantilla');
    }
  }

  // Actualizar plantilla
  async updateTemplate(id: string, data: UpdateMessageTemplateData): Promise<MessageTemplate> {
    try {
      const response = await api.put<ApiResponse<MessageTemplate>>(`/message-templates/${id}`, data);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error actualizando plantilla');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating message template:', error);
      throw new Error(error.response?.data?.message || 'Error actualizando plantilla');
    }
  }

  // Eliminar plantilla
  async deleteTemplate(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<void>>(`/message-templates/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error eliminando plantilla');
      }
    } catch (error: any) {
      console.error('Error deleting message template:', error);
      throw new Error(error.response?.data?.message || 'Error eliminando plantilla');
    }
  }

  // Incrementar contador de uso
  async incrementUsage(id: string): Promise<void> {
    try {
      await api.post(`/message-templates/${id}/use`);
    } catch (error) {
      console.error('Error incrementing template usage:', error);
      // No lanzar error para no afectar el envío del mensaje
    }
  }

  // Obtener categorías disponibles
  async getCategories(): Promise<string[]> {
    try {
      const response = await api.get<ApiResponse<string[]>>('/message-templates/categories');
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('No se pudieron obtener las categorías');
    }
  }

  // Obtener estadísticas de uso
  async getUsageStats(): Promise<TemplateUsageStats> {
    try {
      const response = await api.get<ApiResponse<TemplateUsageStats>>('/message-templates/stats');
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Error obteniendo estadísticas');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw new Error('No se pudieron obtener las estadísticas');
    }
  }

  // Crear plantillas por defecto
  async createDefaultTemplates(): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>('/message-templates/create-defaults');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error creando plantillas por defecto');
      }
    } catch (error: any) {
      console.error('Error creating default templates:', error);
      throw new Error(error.response?.data?.message || 'Error creando plantillas por defecto');
    }
  }

  // Buscar plantillas por texto (para autocompletado)
  async searchTemplates(query: string): Promise<MessageTemplate[]> {
    try {
      const result = await this.getTemplates({
        search: query,
        isActive: true,
        limit: 10
      });
      
      return result.templates;
    } catch (error) {
      console.error('Error searching templates:', error);
      return [];
    }
  }

  // Obtener plantillas por categoría
  async getTemplatesByCategory(category: string): Promise<MessageTemplate[]> {
    try {
      const result = await this.getTemplates({
        category,
        isActive: true,
        limit: 100
      });
      
      return result.templates;
    } catch (error) {
      console.error('Error getting templates by category:', error);
      return [];
    }
  }

  // Verificar si un shortcut está disponible
  async isShortcutAvailable(shortcut: string): Promise<boolean> {
    try {
      const template = await this.getTemplateByShortcut(shortcut);
      return template === null;
    } catch (error) {
      return false;
    }
  }
}

export default new MessageTemplateService(); 