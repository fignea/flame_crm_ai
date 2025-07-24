import api from './api';

export interface ConversationMetrics {
  totalConversations: number;
  activeConversations: number;
  newConversations: number;
  closedConversations: number;
  avgConversationDuration: number;
  conversationsByStatus: Record<string, number>;
  conversationsByAgent: AgentMetrics[];
  conversationsByHour: HourlyMetrics[];
  conversationsByDay: DailyMetrics[];
}

export interface ResponseTimeMetrics {
  avgResponseTime: number;
  medianResponseTime: number;
  firstResponseTime: number;
  avgResolutionTime: number;
  responseTimeByAgent: AgentResponseMetrics[];
  responseTimeByHour: HourlyResponseMetrics[];
  slaCompliance: {
    target: number;
    compliance: number;
    breaches: number;
  };
}

export interface MessageMetrics {
  totalMessages: number;
  incomingMessages: number;
  outgoingMessages: number;
  avgMessagesPerConversation: number;
  messagesByType: Record<string, number>;
  messagesByHour: HourlyMetrics[];
  messagesByDay: DailyMetrics[];
  topKeywords: KeywordMetrics[];
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalConversations: number;
  activeConversations: number;
  avgResponseTime: number;
  totalMessages: number;
  status: string;
  workingHours: number;
  productivityScore: number;
}

export interface AgentResponseMetrics {
  agentId: string;
  agentName: string;
  avgResponseTime: number;
  firstResponseTime: number;
  totalResponses: number;
  slaCompliance: number;
}

export interface HourlyMetrics {
  hour: number;
  count: number;
  avgResponseTime?: number;
}

export interface DailyMetrics {
  date: string;
  count: number;
  avgResponseTime?: number;
}

export interface HourlyResponseMetrics {
  hour: number;
  avgResponseTime: number;
  messageCount: number;
}

export interface KeywordMetrics {
  keyword: string;
  count: number;
  percentage: number;
}

export interface PerformanceMetrics {
  conversationMetrics: ConversationMetrics;
  responseTimeMetrics: ResponseTimeMetrics;
  messageMetrics: MessageMetrics;
  agentPerformance: AgentMetrics[];
  systemHealth: SystemHealthMetrics;
}

export interface SystemHealthMetrics {
  avgServerResponseTime: number;
  errorRate: number;
  uptime: number;
  memoryUsage: number;
  activeConnections: number;
}

export interface DashboardMetrics {
  summary: {
    totalConversations: number;
    activeConversations: number;
    avgResponseTime: number;
    totalMessages: number;
    activeAgents: number;
    systemUptime: number;
  };
  conversations: {
    total: number;
    active: number;
    new: number;
    byHour: HourlyMetrics[];
  };
  responseTime: {
    average: number;
    median: number;
    slaCompliance: number;
  };
  messages: {
    total: number;
    incoming: number;
    outgoing: number;
    byHour: HourlyMetrics[];
  };
  agents: {
    total: number;
    active: number;
    topPerformers: AgentMetrics[];
  };
  systemHealth: SystemHealthMetrics;
}

export interface RealTimeMetrics {
  timestamp: string;
  activeConversations: number;
  recentMessages: number;
  activeAgents: number;
  avgResponseTime: number;
}

export interface MetricsFilters {
  startDate?: string;
  endDate?: string;
  agentId?: string;
  connectionId?: string;
}

export class MetricsService {
  // Obtener métricas completas de rendimiento
  static async getPerformanceMetrics(filters: MetricsFilters = {}): Promise<PerformanceMetrics> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.connectionId) params.append('connectionId', filters.connectionId);

    const response = await api.get(`/metrics/performance?${params.toString()}`);
    return response.data.data;
  }

  // Obtener métricas de conversaciones
  static async getConversationMetrics(filters: MetricsFilters = {}): Promise<ConversationMetrics> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.connectionId) params.append('connectionId', filters.connectionId);

    const response = await api.get(`/metrics/conversations?${params.toString()}`);
    return response.data.data;
  }

  // Obtener métricas de tiempo de respuesta
  static async getResponseTimeMetrics(filters: MetricsFilters = {}): Promise<ResponseTimeMetrics> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.connectionId) params.append('connectionId', filters.connectionId);

    const response = await api.get(`/metrics/response-time?${params.toString()}`);
    return response.data.data;
  }

  // Obtener métricas de mensajes
  static async getMessageMetrics(filters: MetricsFilters = {}): Promise<MessageMetrics> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.connectionId) params.append('connectionId', filters.connectionId);

    const response = await api.get(`/metrics/messages?${params.toString()}`);
    return response.data.data;
  }

  // Obtener métricas de rendimiento de agentes
  static async getAgentPerformance(filters: MetricsFilters = {}): Promise<AgentMetrics[]> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.connectionId) params.append('connectionId', filters.connectionId);

    const response = await api.get(`/metrics/agents?${params.toString()}`);
    return response.data.data;
  }

  // Obtener métricas de salud del sistema
  static async getSystemHealthMetrics(filters: MetricsFilters = {}): Promise<SystemHealthMetrics> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/metrics/system-health?${params.toString()}`);
    return response.data.data;
  }

  // Obtener métricas para dashboard
  static async getDashboardMetrics(filters: MetricsFilters = {}): Promise<DashboardMetrics> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/metrics/dashboard?${params.toString()}`);
    return response.data.data;
  }

  // Obtener métricas en tiempo real
  static async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const response = await api.get('/metrics/real-time');
    return response.data.data;
  }

  // Exportar métricas
  static async exportMetrics(
    type: 'performance' | 'conversations' | 'response-time' | 'agents' = 'performance',
    format: 'csv' | 'json' = 'csv',
    filters: MetricsFilters = {}
  ): Promise<Blob> {
    const params = new URLSearchParams();
    
    params.append('type', type);
    params.append('format', format);
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.connectionId) params.append('connectionId', filters.connectionId);

    const response = await api.get(`/metrics/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Obtener métricas por período
  static async getMetricsByPeriod(
    period: 'hour' | 'day' | 'week' | 'month',
    type: 'conversations' | 'messages' | 'response-time' = 'conversations'
  ): Promise<any[]> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const filters = {
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };

    switch (type) {
      case 'conversations':
        const convMetrics = await this.getConversationMetrics(filters);
        return period === 'hour' || period === 'day' 
          ? convMetrics.conversationsByHour 
          : convMetrics.conversationsByDay;
      
      case 'messages':
        const msgMetrics = await this.getMessageMetrics(filters);
        return period === 'hour' || period === 'day' 
          ? msgMetrics.messagesByHour 
          : msgMetrics.messagesByDay;
      
      case 'response-time':
        const rtMetrics = await this.getResponseTimeMetrics(filters);
        return rtMetrics.responseTimeByHour;
      
      default:
        return [];
    }
  }

  // Obtener comparación de períodos
  static async getPerformanceComparison(
    currentPeriod: MetricsFilters,
    previousPeriod: MetricsFilters
  ): Promise<{
    current: PerformanceMetrics;
    previous: PerformanceMetrics;
    changes: {
      totalConversations: number;
      avgResponseTime: number;
      totalMessages: number;
      activeAgents: number;
      slaCompliance: number;
    };
  }> {
    const [current, previous] = await Promise.all([
      this.getPerformanceMetrics(currentPeriod),
      this.getPerformanceMetrics(previousPeriod)
    ]);

    const changes = {
      totalConversations: this.calculatePercentageChange(
        current.conversationMetrics.totalConversations,
        previous.conversationMetrics.totalConversations
      ),
      avgResponseTime: this.calculatePercentageChange(
        current.responseTimeMetrics.avgResponseTime,
        previous.responseTimeMetrics.avgResponseTime
      ),
      totalMessages: this.calculatePercentageChange(
        current.messageMetrics.totalMessages,
        previous.messageMetrics.totalMessages
      ),
      activeAgents: this.calculatePercentageChange(
        current.agentPerformance.filter(a => a.status === 'available').length,
        previous.agentPerformance.filter(a => a.status === 'available').length
      ),
      slaCompliance: this.calculatePercentageChange(
        current.responseTimeMetrics.slaCompliance.compliance,
        previous.responseTimeMetrics.slaCompliance.compliance
      )
    };

    return { current, previous, changes };
  }

  // Obtener alertas basadas en métricas
  static async getMetricsAlerts(): Promise<{
    level: 'info' | 'warning' | 'error';
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }[]> {
    const realTimeMetrics = await this.getRealTimeMetrics();
    const systemHealth = await this.getSystemHealthMetrics();
    const alerts = [];

    // Alerta por tiempo de respuesta alto
    if (realTimeMetrics.avgResponseTime > 5) {
      alerts.push({
        level: 'warning' as const,
        message: 'Tiempo de respuesta promedio alto',
        metric: 'avgResponseTime',
        value: realTimeMetrics.avgResponseTime,
        threshold: 5
      });
    }

    // Alerta por pocos agentes activos
    if (realTimeMetrics.activeAgents < 2) {
      alerts.push({
        level: 'error' as const,
        message: 'Pocos agentes activos',
        metric: 'activeAgents',
        value: realTimeMetrics.activeAgents,
        threshold: 2
      });
    }

    // Alerta por uso de memoria alto
    if (systemHealth.memoryUsage > 80) {
      alerts.push({
        level: 'warning' as const,
        message: 'Uso de memoria alto',
        metric: 'memoryUsage',
        value: systemHealth.memoryUsage,
        threshold: 80
      });
    }

    // Alerta por tasa de error alta
    if (systemHealth.errorRate > 1) {
      alerts.push({
        level: 'error' as const,
        message: 'Tasa de error alta',
        metric: 'errorRate',
        value: systemHealth.errorRate,
        threshold: 1
      });
    }

    return alerts;
  }

  // Método auxiliar para calcular porcentaje de cambio
  private static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Formatear tiempo en formato legible
  static formatTime(minutes: number): string {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}s`;
    } else if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  // Formatear números grandes
  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Formatear porcentajes
  static formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  // Obtener color según el valor de la métrica
  static getMetricColor(value: number, thresholds: { good: number; warning: number }): string {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  }
}

export default MetricsService; 