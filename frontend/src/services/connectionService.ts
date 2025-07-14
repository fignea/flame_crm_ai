import api from './api';
import { ApiResponse, PaginatedResponse } from '../types/api';

export interface Connection {
  id: string;
  name: string;
  type: 'whatsapp_web' | 'whatsapp_business' | 'instagram' | 'facebook';
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  session?: string;
  qrcode?: string;
  accessToken?: string;
  retries: number;
  isDefault: boolean;
  isActive: boolean;
  webhookByEvents: boolean;
  webhookUrl?: string;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionCreateRequest {
  name: string;
  type: 'whatsapp_web' | 'whatsapp_business' | 'instagram' | 'facebook';
  isDefault?: boolean;
  webhookUrl?: string;
  settings?: any;
}

export interface ConnectionUpdateRequest {
  name?: string;
  isDefault?: boolean;
  isActive?: boolean;
  webhookByEvents?: boolean;
  webhookUrl?: string;
  settings?: any;
}

export interface QRCodeResponse {
  qrcode: string;
  sessionId: string;
}

export interface ConnectionStatus {
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  qrcode?: string;
  error?: string;
}

export const connectionService = {
  // Obtener todas las conexiones
  async getAll(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<PaginatedResponse<Connection>> {
    const response = await api.get<PaginatedResponse<Connection>>('/connections', { params });
    return response.data;
  },

  // Obtener conexión por ID
  async getById(id: string): Promise<Connection> {
    const response = await api.get<ApiResponse<Connection>>(`/connections/${id}`);
    if (!response.data.data) {
      throw new Error('Conexión no encontrada');
    }
    return response.data.data;
  },

  // Crear nueva conexión
  async create(data: ConnectionCreateRequest): Promise<Connection> {
    const response = await api.post<ApiResponse<Connection>>('/connections', data);
    if (!response.data.data) {
      throw new Error('Error al crear la conexión');
    }
    return response.data.data;
  },

  // Actualizar conexión
  async update(id: string, data: ConnectionUpdateRequest): Promise<Connection> {
    const response = await api.put<ApiResponse<Connection>>(`/connections/${id}`, data);
    if (!response.data.data) {
      throw new Error('Error al actualizar la conexión');
    }
    return response.data.data;
  },

  // Eliminar conexión
  async delete(id: string): Promise<void> {
    await api.delete(`/connections/${id}`);
  },

  // Iniciar sesión de WhatsApp
  async startSession(id: string): Promise<QRCodeResponse> {
    const response = await api.post<ApiResponse<QRCodeResponse>>(`/connections/${id}/start`);
    if (!response.data.data) {
      throw new Error('Error al iniciar la sesión');
    }
    return response.data.data;
  },

  // Detener sesión
  async stopSession(id: string): Promise<void> {
    await api.post(`/connections/${id}/stop`);
  },

  // Obtener estado de la conexión
  async getStatus(id: string): Promise<ConnectionStatus> {
    const response = await api.get<ApiResponse<ConnectionStatus>>(`/connections/${id}/status`);
    if (!response.data.data) {
      throw new Error('Error al obtener el estado');
    }
    return response.data.data;
  },

  // Reintentar conexión
  async retryConnection(id: string): Promise<void> {
    await api.post(`/connections/${id}/retry`);
  },

  // Limpiar sesión
  async clearSession(id: string): Promise<void> {
    await api.post(`/connections/${id}/clear`);
  },

  // Establecer como predeterminada
  async setDefault(id: string): Promise<void> {
    await api.post(`/connections/${id}/default`);
  },

  // Obtener conexión predeterminada
  async getDefault(): Promise<Connection | null> {
    try {
      const response = await api.get<ApiResponse<Connection>>('/connections/default');
      return response.data.data || null;
    } catch (error) {
      return null;
    }
  },

  // Obtener conexiones activas
  async getActive(): Promise<Connection[]> {
    const response = await api.get<ApiResponse<Connection[]>>('/connections/active');
    return response.data.data || [];
  },

  // Obtener estadísticas de conexión
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
    }>>(`/connections/${id}/stats`);
    
    if (!response.data.data) {
      throw new Error('Error al obtener estadísticas');
    }
    return response.data.data;
  },

  // Configurar webhook
  async setWebhook(id: string, webhookUrl: string): Promise<void> {
    await api.post(`/connections/${id}/webhook`, { webhookUrl });
  },

  // Enviar mensaje de prueba
  async sendTestMessage(id: string, number: string, message: string): Promise<void> {
    await api.post(`/connections/${id}/test-message`, { number, message });
  },

  // Obtener tipos de conexión disponibles
  async getAvailableTypes(): Promise<Array<{
    type: string;
    name: string;
    description: string;
    available: boolean;
    icon: string;
    color: string;
  }>> {
    const response = await api.get<ApiResponse<Array<{
      type: string;
      name: string;
      description: string;
      available: boolean;
      icon: string;
      color: string;
    }>>>('/connections/types');
    
    return response.data.data || [];
  },

  // Verificar conectividad
  async checkConnectivity(id: string): Promise<{
    connected: boolean;
    latency: number;
    error?: string;
  }> {
    const response = await api.get<ApiResponse<{
      connected: boolean;
      latency: number;
      error?: string;
    }>>(`/connections/${id}/connectivity`);
    
    if (!response.data.data) {
      throw new Error('Error al verificar conectividad');
    }
    return response.data.data;
  },

  // Obtener logs de conexión
  async getLogs(id: string, params?: {
    page?: number;
    limit?: number;
    level?: string;
  }): Promise<PaginatedResponse<{
    id: string;
    level: string;
    message: string;
    timestamp: string;
  }>> {
    const response = await api.get<PaginatedResponse<{
      id: string;
      level: string;
      message: string;
      timestamp: string;
    }>>(`/connections/${id}/logs`, { params });
    
    return response.data;
  },

  // Exportar configuración
  async exportConfig(id: string): Promise<{
    config: any;
    filename: string;
  }> {
    const response = await api.get<ApiResponse<{
      config: any;
      filename: string;
    }>>(`/connections/${id}/export`);
    
    if (!response.data.data) {
      throw new Error('Error al exportar configuración');
    }
    return response.data.data;
  },

  // Importar configuración
  async importConfig(config: any): Promise<Connection> {
    const response = await api.post<ApiResponse<Connection>>('/connections/import', { config });
    if (!response.data.data) {
      throw new Error('Error al importar configuración');
    }
    return response.data.data;
  },

  // Enviar mensaje por WhatsApp
  async sendMessage(id: string, number: string, message: string): Promise<{
    success: boolean;
    messageId: string;
    timestamp: string;
    to: string;
    message: string;
  }> {
    const response = await api.post<ApiResponse<{
      success: boolean;
      messageId: string;
      timestamp: string;
      to: string;
      message: string;
    }>>(`/connections/${id}/send-message`, { number, message });
    
    if (!response.data.data) {
      throw new Error('Error al enviar mensaje');
    }
    return response.data.data;
  }
}; 