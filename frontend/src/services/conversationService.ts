import api from './api';

export interface Message {
  id: string;
  conversationId: string; // Añadido para el manejo de sockets
  content: string;
  fromMe: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  reaction?: string; // Campo para reacciones
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
}

class ConversationService {
  // Obtener conversaciones con filtros
  async getConversations(filters: ConversationFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.connectionId) params.append('connectionId', filters.connectionId);
    if (filters.status) params.append('status', filters.status);

    const response = await api.get(`/conversations?${params.toString()}`);
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

  // Marcar conversación como leída
  async markAsRead(conversationId: string): Promise<void> {
    await api.patch(`/conversations/${conversationId}/read`);
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