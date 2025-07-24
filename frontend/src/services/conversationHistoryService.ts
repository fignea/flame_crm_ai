import api from './api';

export interface ConversationHistoryFilters {
  dateFrom?: string;
  dateTo?: string;
  contactId?: string;
  connectionId?: string;
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
  contentSearch?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  fromMe?: boolean;
  hasMedia?: boolean;
  tags?: string[];
  minMessages?: number;
  maxMessages?: number;
  archived?: boolean;
}

export interface ConversationHistoryStats {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  messagesByType: Record<string, number>;
  messagesByStatus: Record<string, number>;
  conversationsByConnection: Record<string, number>;
  dailyMessageCounts: Array<{ date: string; count: number }>;
  topContacts: Array<{ contactId: string; name: string; messageCount: number }>;
  responseTimeStats: {
    averageResponseTime: number;
    medianResponseTime: number;
    responseTimeDistribution: Record<string, number>;
  };
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'excel';
  includeMedia?: boolean;
  includeMetadata?: boolean;
  includeStats?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  maxRecords?: number;
}

export interface ConversationHistoryResponse {
  conversations: Array<{
    id: string;
    contact: {
      id: string;
      name: string;
      number: string;
      email?: string;
      avatar?: string;
      companyName?: string;
      tags?: string[];
    };
    connection: {
      id: string;
      name: string;
      type: string;
    };
    user?: {
      id: string;
      name: string;
      email: string;
    };
    messages: Array<{
      id: string;
      content: string;
      fromMe: boolean;
      status: string;
      mediaType?: string;
      mediaUrl?: string;
      timestamp: string;
      locationLatitude?: number;
      locationLongitude?: number;
      locationAddress?: string;
      fileName?: string;
      fileSize?: number;
      fileMimeType?: string;
      metadata?: any;
      sentAt?: string;
      deliveredAt?: string;
      readAt?: string;
      failedAt?: string;
    }>;
    _count: {
      messages: number;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SearchMessagesResponse {
  messages: Array<{
    id: string;
    content: string;
    fromMe: boolean;
    status: string;
    mediaType?: string;
    timestamp: string;
    conversation: {
      id: string;
      contact: {
        id: string;
        name: string;
        number: string;
      };
      connection: {
        id: string;
        name: string;
      };
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ConversationHistoryService {
  // Obtener historial de conversaciones
  async getConversationHistory(
    filters: ConversationHistoryFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<ConversationHistoryResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null)
      )
    });

    const response = await api.get<{ success: boolean; data: ConversationHistoryResponse }>(
      `/conversation-history?${params}`
    );

    return response.data.data;
  }

  // Obtener estadísticas del historial
  async getHistoryStatistics(filters: ConversationHistoryFilters): Promise<ConversationHistoryStats> {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null)
      )
    );

    const response = await api.get<{ success: boolean; data: ConversationHistoryStats }>(
      `/conversation-history/statistics?${params}`
    );

    return response.data.data;
  }

  // Exportar historial
  async exportHistory(
    filters: ConversationHistoryFilters,
    options: ExportOptions
  ): Promise<{ exportId: string; exportPath: string; recordCount: number; exportedAt: string }> {
    const response = await api.post<{
      success: boolean;
      data: { exportId: string; exportPath: string; recordCount: number; exportedAt: string };
    }>('/conversation-history/export', {
      filters,
      options
    });

    return response.data.data;
  }

  // Descargar archivo exportado
  async downloadExport(exportId: string): Promise<Blob> {
    const response = await api.get(`/conversation-history/export/${exportId}/download`, {
      responseType: 'blob'
    });

    return response.data;
  }

  // Búsqueda avanzada en mensajes
  async searchMessages(
    searchTerm: string,
    filters: ConversationHistoryFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<SearchMessagesResponse> {
    const response = await api.post<{ success: boolean; data: SearchMessagesResponse }>(
      '/conversation-history/search',
      {
        searchTerm,
        filters,
        page,
        limit
      }
    );

    return response.data.data;
  }

  // Archivar conversación
  async archiveConversation(conversationId: string): Promise<void> {
    await api.post(`/conversation-history/${conversationId}/archive`);
  }

  // Desarchivar conversación
  async unarchiveConversation(conversationId: string): Promise<void> {
    await api.post(`/conversation-history/${conversationId}/unarchive`);
  }

  // Limpiar historial antiguo
  async cleanupOldHistory(daysToKeep: number = 90): Promise<{ deletedMessages: number; deletedConversations: number }> {
    const response = await api.post<{
      success: boolean;
      data: { deletedMessages: number; deletedConversations: number };
    }>('/conversation-history/cleanup', {
      daysToKeep
    });

    return response.data.data;
  }

  // Helpers para formatear datos
  formatDateRange(from: Date, to: Date): { dateFrom: string; dateTo: string } {
    return {
      dateFrom: from.toISOString().split('T')[0],
      dateTo: to.toISOString().split('T')[0]
    };
  }

  // Validar filtros
  validateFilters(filters: ConversationHistoryFilters): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (filters.dateFrom && filters.dateTo) {
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      
      if (fromDate > toDate) {
        errors.push('La fecha de inicio no puede ser mayor que la fecha de fin');
      }
    }

    if (filters.minMessages && filters.maxMessages) {
      if (filters.minMessages > filters.maxMessages) {
        errors.push('El número mínimo de mensajes no puede ser mayor que el máximo');
      }
    }

    if (filters.minMessages && filters.minMessages < 0) {
      errors.push('El número mínimo de mensajes no puede ser negativo');
    }

    if (filters.maxMessages && filters.maxMessages < 0) {
      errors.push('El número máximo de mensajes no puede ser negativo');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Obtener opciones de filtro predefinidas
  getFilterPresets(): Record<string, ConversationHistoryFilters> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    return {
      today: {
        dateFrom: today.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0]
      },
      yesterday: {
        dateFrom: yesterday.toISOString().split('T')[0],
        dateTo: yesterday.toISOString().split('T')[0]
      },
      lastWeek: {
        dateFrom: lastWeek.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0]
      },
      lastMonth: {
        dateFrom: lastMonth.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0]
      },
      lastYear: {
        dateFrom: lastYear.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0]
      },
      withMedia: {
        hasMedia: true
      },
      archived: {
        archived: true
      },
      unread: {
        status: 'sent'
      }
    };
  }

  // Formatear estadísticas para visualización
  formatStatsForChart(stats: ConversationHistoryStats) {
    return {
      messagesByType: Object.entries(stats.messagesByType).map(([type, count]) => ({
        name: type,
        value: count
      })),
      messagesByStatus: Object.entries(stats.messagesByStatus).map(([status, count]) => ({
        name: status,
        value: count
      })),
      dailyMessages: stats.dailyMessageCounts.map(item => ({
        date: item.date,
        messages: item.count
      })),
      responseTimeDistribution: Object.entries(stats.responseTimeStats.responseTimeDistribution).map(([range, count]) => ({
        range,
        count
      }))
    };
  }
}

export default new ConversationHistoryService(); 