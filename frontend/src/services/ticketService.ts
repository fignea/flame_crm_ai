import api from './api';
import { 
  Ticket, 
  TicketCreateRequest, 
  TicketUpdateRequest, 
  Message, 
  MessageCreateRequest,
  ApiResponse, 
  PaginatedResponse 
} from '../types/api';

export const ticketService = {
  // Obtener todos los tickets
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    userId?: string;
    contactId?: string;
    whatsappId?: string;
    search?: string;
  }): Promise<PaginatedResponse<Ticket>> {
    const response = await api.get<PaginatedResponse<Ticket>>('/tickets', { params });
    return response.data;
  },

  // Obtener un ticket específico
  async getById(id: string): Promise<Ticket> {
    const response = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return response.data.data!;
  },

  // Crear nuevo ticket
  async create(data: TicketCreateRequest): Promise<Ticket> {
    const response = await api.post<ApiResponse<Ticket>>('/tickets', data);
    return response.data.data!;
  },

  // Actualizar ticket
  async update(id: string, data: TicketUpdateRequest): Promise<Ticket> {
    const response = await api.put<ApiResponse<Ticket>>(`/tickets/${id}`, data);
    return response.data.data!;
  },

  // Eliminar ticket
  async delete(id: string): Promise<void> {
    await api.delete(`/tickets/${id}`);
  },

  // Obtener tickets por estado (para Kanban)
  async getByStatus(status: string): Promise<Ticket[]> {
    const response = await api.get<ApiResponse<Ticket[]>>(`/tickets/status/${status}`);
    return response.data.data!;
  },

  // Obtener todos los tickets para Kanban
  async getForKanban(): Promise<{
    pending: Ticket[];
    open: Ticket[];
    waiting: Ticket[];
    closed: Ticket[];
  }> {
    const response = await api.get<ApiResponse<{
      pending: Ticket[];
      open: Ticket[];
      waiting: Ticket[];
      closed: Ticket[];
    }>>('/api/tickets/kanban');
    return response.data.data!;
  },

  // Actualizar posición en Kanban
  async updateKanbanPosition(id: string, column: string, order: number): Promise<void> {
    await api.patch(`/api/tickets/${id}/kanban`, { column, order });
  },

  // Transferir ticket a otro usuario
  async transfer(id: string, userId: string): Promise<Ticket> {
    const response = await api.post<ApiResponse<Ticket>>(`/api/tickets/${id}/transfer`, { userId });
    return response.data.data!;
  },

  // Cerrar ticket
  async close(id: string): Promise<Ticket> {
    const response = await api.post<ApiResponse<Ticket>>(`/api/tickets/${id}/close`);
    return response.data.data!;
  },

  // Reabrir ticket
  async reopen(id: string): Promise<Ticket> {
    const response = await api.post<ApiResponse<Ticket>>(`/api/tickets/${id}/reopen`);
    return response.data.data!;
  },

  // Marcar como leído
  async markAsRead(id: string): Promise<void> {
    await api.post(`/api/tickets/${id}/read`);
  },

  // Obtener mensajes de un ticket
  async getMessages(ticketId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Message>> {
    const response = await api.get<PaginatedResponse<Message>>(`/tickets/${ticketId}/messages`, { params });
    return response.data;
  },

  // Enviar mensaje
  async sendMessage(ticketId: string, data: MessageCreateRequest): Promise<Message> {
    const response = await api.post<ApiResponse<Message>>(`/tickets/${ticketId}/messages`, data);
    return response.data.data!;
  },

  // Marcar mensaje como leído
  async markMessageAsRead(ticketId: string, messageId: string): Promise<void> {
    await api.post(`/api/tickets/${ticketId}/messages/${messageId}/read`);
  },

  // Obtener estadísticas de tickets
  async getStats(): Promise<{
    total: number;
    open: number;
    pending: number;
    waiting: number;
    closed: number;
    averageResolutionTime: number;
  }> {
    const response = await api.get<ApiResponse<{
      total: number;
      open: number;
      pending: number;
      waiting: number;
      closed: number;
      averageResolutionTime: number;
    }>>('/api/tickets/stats');
    return response.data.data!;
  },

  // Obtener tickets urgentes
  async getUrgent(): Promise<Ticket[]> {
    const response = await api.get<ApiResponse<Ticket[]>>('/api/tickets/urgent');
    return response.data.data!;
  },

  // Obtener tickets asignados al usuario actual
  async getMyTickets(): Promise<Ticket[]> {
    const response = await api.get<ApiResponse<Ticket[]>>('/tickets/my-tickets');
    return response.data.data!;
  },

  // Obtener tickets no asignados
  async getUnassigned(): Promise<Ticket[]> {
    const response = await api.get<ApiResponse<Ticket[]>>('/api/tickets/unassigned');
    return response.data.data!;
  },

  // Asignar ticket a usuario
  async assign(id: string, userId: string): Promise<Ticket> {
    const response = await api.post<ApiResponse<Ticket>>(`/tickets/${id}/assign`, { userId });
    return response.data.data!;
  },

  // Obtener historial de cambios
  async getHistory(id: string): Promise<Array<{
    id: string;
    action: string;
    description: string;
    userId: string;
    userName: string;
    createdAt: string;
  }>> {
    const response = await api.get<ApiResponse<Array<{
      id: string;
      action: string;
      description: string;
      userId: string;
      userName: string;
      createdAt: string;
    }>>>(`/api/tickets/${id}/history`);
    return response.data.data!;
  },
}; 