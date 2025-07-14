import api from './api';
import { Whatsapp, WhatsappCreateRequest, ApiResponse, PaginatedResponse } from '../types/api';

export const whatsappService = {
  // Obtener todas las conexiones de WhatsApp
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Whatsapp>> {
    const response = await api.get<PaginatedResponse<Whatsapp>>('/whatsapp', { params });
    return response.data;
  },

  // Obtener una conexión específica
  async getById(id: string): Promise<Whatsapp> {
    const response = await api.get<ApiResponse<Whatsapp>>(`/whatsapp/${id}`);
    return response.data.data!;
  },

  // Crear nueva conexión
  async create(data: WhatsappCreateRequest): Promise<Whatsapp> {
    const response = await api.post<ApiResponse<Whatsapp>>('/whatsapp', data);
    return response.data.data!;
  },

  // Actualizar conexión
  async update(id: string, data: Partial<WhatsappCreateRequest>): Promise<Whatsapp> {
    const response = await api.put<ApiResponse<Whatsapp>>(`/whatsapp/${id}`, data);
    return response.data.data!;
  },

  // Eliminar conexión
  async delete(id: string): Promise<void> {
    await api.delete(`/whatsapp/${id}`);
  },

  // Iniciar conexión (generar QR)
  async startSession(id: string): Promise<{ qrcode: string }> {
    const response = await api.post<ApiResponse<{ qrcode: string }>>(`/whatsapp/${id}/start`);
    return response.data.data!;
  },

  // Detener conexión
  async stopSession(id: string): Promise<void> {
    await api.post(`/whatsapp/${id}/stop`);
  },

  // Obtener estado de conexión
  async getStatus(id: string): Promise<{ status: string; qrcode?: string }> {
    const response = await api.get<ApiResponse<{ status: string; qrcode?: string }>>(`/whatsapp/${id}/status`);
    return response.data.data!;
  },

  // Enviar mensaje de prueba
  async sendTestMessage(id: string, number: string, message: string): Promise<void> {
    await api.post(`/whatsapp/${id}/test-message`, { number, message });
  },

  // Configurar webhook
  async setWebhook(id: string, webhookUrl: string): Promise<void> {
    await api.post(`/whatsapp/${id}/webhook`, { webhookUrl });
  },

  // Obtener estadísticas de la conexión
  async getStats(id: string): Promise<{
    totalMessages: number;
    messagesToday: number;
    averageResponseTime: number;
    uptime: number;
  }> {
    const response = await api.get<ApiResponse<{
      totalMessages: number;
      messagesToday: number;
      averageResponseTime: number;
      uptime: number;
    }>>(`/whatsapp/${id}/stats`);
    return response.data.data!;
  },

  // Obtener conexión por defecto
  async getDefault(): Promise<Whatsapp | null> {
    try {
      const response = await api.get<ApiResponse<Whatsapp>>('/whatsapp/default');
      return response.data.data!;
    } catch (error) {
      return null;
    }
  },

  // Establecer conexión por defecto
  async setDefault(id: string): Promise<void> {
    await api.post(`/whatsapp/${id}/set-default`);
  },

  // Obtener todas las conexiones activas
  async getActive(): Promise<Whatsapp[]> {
    const response = await api.get<ApiResponse<Whatsapp[]>>('/whatsapp/active');
    return response.data.data!;
  },

  // Reintentar conexión
  async retryConnection(id: string): Promise<void> {
    await api.post(`/whatsapp/${id}/retry`);
  },

  // Limpiar sesión
  async clearSession(id: string): Promise<void> {
    await api.post(`/whatsapp/${id}/clear-session`);
  },
}; 