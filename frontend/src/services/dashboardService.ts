import api from './api';
import { DashboardStats, ChartData, ApiResponse } from '../types/api';

export const dashboardService = {
  // Obtener estadísticas generales del dashboard
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return response.data.data || {
        totalMessages: 0,
        resolvedTickets: 0,
        averageResponseTime: 0,
        activeAgents: 0,
        platformStats: {
          whatsapp: { connected: false, messagesToday: 0, responseTime: 0 },
          instagram: { connected: false, messagesToday: 0, responseTime: 0 },
          facebook: { connected: false, messagesToday: 0, responseTime: 0 }
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalMessages: 0,
        resolvedTickets: 0,
        averageResponseTime: 0,
        activeAgents: 0,
        platformStats: {
          whatsapp: { connected: false, messagesToday: 0, responseTime: 0 },
          instagram: { connected: false, messagesToday: 0, responseTime: 0 },
          facebook: { connected: false, messagesToday: 0, responseTime: 0 }
        }
      };
    }
  },

  // Obtener datos para gráficos
  async getChartData(): Promise<ChartData> {
    try {
      const response = await api.get<ApiResponse<ChartData>>('/dashboard/charts');
      return response.data.data || {
        dailyMessages: [],
        platformDistribution: [],
        responseTimeData: [],
        agentPerformance: []
      };
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return {
        dailyMessages: [],
        platformDistribution: [],
        responseTimeData: [],
        agentPerformance: []
      };
    }
  },

  // Obtener estadísticas de plataformas
  async getPlatformStats(): Promise<{
    whatsapp: {
      connected: boolean;
      messagesToday: number;
      responseTime: number;
      totalConnections: number;
    };
    instagram: {
      connected: boolean;
      messagesToday: number;
      responseTime: number;
      totalConnections: number;
    };
    facebook: {
      connected: boolean;
      messagesToday: number;
      responseTime: number;
      totalConnections: number;
    };
  }> {
    try {
      const response = await api.get<ApiResponse<{
        whatsapp: {
          connected: boolean;
          messagesToday: number;
          responseTime: number;
          totalConnections: number;
        };
        instagram: {
          connected: boolean;
          messagesToday: number;
          responseTime: number;
          totalConnections: number;
        };
        facebook: {
          connected: boolean;
          messagesToday: number;
          responseTime: number;
          totalConnections: number;
        };
      }>>('/dashboard/platforms');
      return response.data.data || {
        whatsapp: { connected: false, messagesToday: 0, responseTime: 0, totalConnections: 0 },
        instagram: { connected: false, messagesToday: 0, responseTime: 0, totalConnections: 0 },
        facebook: { connected: false, messagesToday: 0, responseTime: 0, totalConnections: 0 }
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return {
        whatsapp: { connected: false, messagesToday: 0, responseTime: 0, totalConnections: 0 },
        instagram: { connected: false, messagesToday: 0, responseTime: 0, totalConnections: 0 },
        facebook: { connected: false, messagesToday: 0, responseTime: 0, totalConnections: 0 }
      };
    }
  },

  // Obtener actividad reciente
  async getRecentActivity(): Promise<Array<{
    id: string;
    type: 'message' | 'ticket' | 'connection' | 'user';
    description: string;
    timestamp: string;
    userId?: string;
    userName?: string;
  }>> {
    const response = await api.get<ApiResponse<Array<{
      id: string;
      type: 'message' | 'ticket' | 'connection' | 'user';
      description: string;
      timestamp: string;
      userId?: string;
      userName?: string;
    }>>>('/dashboard/activity');
    return response.data.data!;
  },

  // Obtener métricas de rendimiento
  async getPerformanceMetrics(): Promise<{
    averageResponseTime: number;
    customerSatisfaction: number;
    ticketsResolvedToday: number;
    ticketsCreatedToday: number;
    averageResolutionTime: number;
  }> {
    const response = await api.get<ApiResponse<{
      averageResponseTime: number;
      customerSatisfaction: number;
      ticketsResolvedToday: number;
      ticketsCreatedToday: number;
      averageResolutionTime: number;
    }>>('/dashboard/performance');
    return response.data.data!;
  },

  // Obtener top agentes
  async getTopAgents(): Promise<Array<{
    id: string;
    name: string;
    avatar?: string;
    ticketsResolved: number;
    averageResponseTime: number;
    customerSatisfaction: number;
  }>> {
    const response = await api.get<ApiResponse<Array<{
      id: string;
      name: string;
      avatar?: string;
      ticketsResolved: number;
      averageResponseTime: number;
      customerSatisfaction: number;
    }>>>('/dashboard/top-agents');
    return response.data.data!;
  },

  // Obtener alertas y notificaciones
  async getAlerts(): Promise<Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>> {
    const response = await api.get<ApiResponse<Array<{
      id: string;
      type: 'warning' | 'error' | 'info' | 'success';
      title: string;
      message: string;
      timestamp: string;
      read: boolean;
    }>>>('/dashboard/alerts');
    return response.data.data!;
  },

  // Marcar alerta como leída
  async markAlertAsRead(alertId: string): Promise<void> {
    await api.post(`/dashboard/alerts/${alertId}/read`);
  },

  // Obtener resumen de la semana
  async getWeeklySummary(): Promise<{
    totalMessages: number;
    totalTickets: number;
    resolvedTickets: number;
    newContacts: number;
    averageResponseTime: number;
    customerSatisfaction: number;
  }> {
    const response = await api.get<ApiResponse<{
      totalMessages: number;
      totalTickets: number;
      resolvedTickets: number;
      newContacts: number;
      averageResponseTime: number;
      customerSatisfaction: number;
    }>>('/dashboard/weekly-summary');
    return response.data.data!;
  },

  // Obtener tendencias
  async getTrends(): Promise<{
    messagesTrend: Array<{ date: string; count: number }>;
    ticketsTrend: Array<{ date: string; count: number }>;
    responseTimeTrend: Array<{ date: string; time: number }>;
  }> {
    const response = await api.get<ApiResponse<{
      messagesTrend: Array<{ date: string; count: number }>;
      ticketsTrend: Array<{ date: string; count: number }>;
      responseTimeTrend: Array<{ date: string; time: number }>;
    }>>('/dashboard/trends');
    return response.data.data!;
  },
}; 