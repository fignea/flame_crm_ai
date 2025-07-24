import api from './api';

export interface Message {
  id: string;
  conversationId: string; // Añadido para el manejo de sockets
  content: string;
  fromMe: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
  mediaUrl?: string;
  timestamp: string;
  reaction?: string; // Campo para reacciones
  
  // Nuevos campos para mensajes avanzados
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  metadata?: any; // JSON metadata flexible
  
  // Timestamps de estados
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  
  contact: {
    id: string;
    name: string;
    number: string;
    avatar?: string;
  };
  connection: {
    id: string;
    name: string;
  };
}

export interface Conversation {
  id: string;
  contact: {
    id: string;
    name: string;
    number: string;
    avatar?: string;
    companyName?: string;
  };
  connection: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  lastMessage?: Message; // Hacer opcional
  unreadCount: number;
  updatedAt: string;
  ticket?: {
    id: string;
    status: string;
    subject?: string;
    tags: Array<{ id: string; attribute: string; value: string; color?: string }>;
  } | null;
}

export interface ConversationFilters {
  page?: number;
  limit?: number;
  search?: string;
  connectionId?: string;
  status?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string | string[];
  hasTicket?: boolean;
  messageCount?: 'all' | 'none' | 'few' | 'many';
  responseTime?: 'all' | 'immediate' | 'recent' | 'overdue';
  messageType?: string;
  sortBy?: 'updatedAt' | 'createdAt' | 'contactName' | 'unreadCount';
  sortOrder?: 'asc' | 'desc';
}

export interface ConversationStats {
  totalConversations: number;
  unreadConversations: number;
  totalMessages: number;
  todayMessages: number;
  messagesByDay: Array<{
    date: string;
    count: number;
  }>;
  // Nuevas estadísticas para filtros
  unreadCount: number;
  assignedCount: number;
  unassignedCount: number;
  withTicketCount: number;
}

export interface FilterOptions {
  agents: Array<{ id: string; name: string; email: string }>;
  connections: Array<{ id: string; name: string; type: string }>;
  commonTags: Array<{ 
    label: string; 
    value: string; 
    attribute: string; 
    count: number 
  }>;
  messageTypes: Array<{ 
    label: string; 
    value: string; 
    count: number 
  }>;
  dateRanges: Array<{ label: string; value: string }>;
  statusOptions: Array<{ label: string; value: string }>;
  assignmentOptions: Array<{ label: string; value: string }>;
  messageCountOptions: Array<{ label: string; value: string }>;
  responseTimeOptions: Array<{ label: string; value: string }>;
  sortOptions: Array<{ label: string; value: string }>;
}

class ConversationService {
  // Obtener conversaciones con filtros avanzados
  async getConversations(filters: ConversationFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.connectionId) params.append('connectionId', filters.connectionId);
    if (filters.status) params.append('status', filters.status);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.tags) {
      const tagsArray = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
      tagsArray.forEach(tag => params.append('tags', tag));
    }
    if (filters.hasTicket !== undefined) params.append('hasTicket', filters.hasTicket.toString());
    if (filters.messageCount) params.append('messageCount', filters.messageCount);
    if (filters.responseTime) params.append('responseTime', filters.responseTime);
    if (filters.messageType) params.append('messageType', filters.messageType);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/conversations?${params.toString()}`);
    return response.data;
  }

  // Obtener opciones para filtros
  async getFilterOptions(): Promise<FilterOptions> {
    const response = await api.get('/conversations/filter-options');
    return response.data;
  }

  // Crear o encontrar una conversación
  async createConversation(contactId: string, connectionId: string) {
    const response = await api.post('/conversations', { contactId, connectionId });
    return response.data as Conversation;
  }

  // Convertir una conversación en un ticket
  async convertToTicket(conversationId: string, tagIds: string[], subject?: string) {
    const response = await api.post(`/conversations/${conversationId}/to-ticket`, { tagIds, subject });
    return response.data;
  }

  // Obtener mensajes de una conversación
  async getMessages(conversationId: string, page: number = 1, limit: number = 50) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await api.get(`/conversations/${conversationId}/messages?${params.toString()}`);
    return response.data;
  }

  // Enviar mensaje
  async sendMessage(conversationId: string, content: string, mediaUrl?: string, mediaType?: string) {
    const response = await api.post(`/conversations/${conversationId}/messages`, {
      content,
      mediaUrl,
      mediaType
    });
    return response.data;
  }
  
  // Enviar mensaje de ubicación
  async sendLocationMessage(conversationId: string, latitude: number, longitude: number, address?: string) {
    const response = await api.post(`/conversations/${conversationId}/messages`, {
      content: address || `Ubicación: ${latitude}, ${longitude}`,
      mediaType: 'location',
      locationLatitude: latitude,
      locationLongitude: longitude,
      locationAddress: address
    });
    return response.data;
  }
  
  // Subir archivo
  async uploadFile(conversationId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    
    const response = await api.post(`/conversations/${conversationId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
  
  // Enviar archivo
  async sendFileMessage(conversationId: string, file: File, mediaUrl: string) {
    const response = await api.post(`/conversations/${conversationId}/messages`, {
      content: file.name,
      mediaType: this.getFileType(file.type),
      mediaUrl: mediaUrl,
      fileName: file.name,
      fileSize: file.size,
      fileMimeType: file.type
    });
    return response.data;
  }
  
  // Determinar tipo de archivo
  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  // Marcar conversación como leída
  async markAsRead(conversationId: string): Promise<void> {
    await api.patch(`/conversations/${conversationId}/read`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Actualizar estado de mensaje
  async updateMessageStatus(messageId: string, status: string) {
    const response = await api.patch(`/conversations/messages/${messageId}/status`, {
      status
    });
    return response.data;
  }

  // Obtener estadísticas
  async getStats(): Promise<ConversationStats> {
    const response = await api.get('/conversations/stats/overview');
    return response.data;
  }
}

export default new ConversationService(); 