import api from './api';

export interface AssignmentMetrics {
  totalConversations: number;
  assignedConversations: number;
  unassignedConversations: number;
  averageAssignmentTime: number;
  assignmentsByAgent: AgentMetrics[];
  assignmentsByMethod: MethodMetrics[];
  responseTimeMetrics: ResponseTimeMetrics;
  workloadDistribution: WorkloadMetrics[];
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalAssigned: number;
  activeConversations: number;
  completedConversations: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  workloadPercentage: number;
  status: 'available' | 'busy' | 'away' | 'offline';
  lastActivity: Date;
}

export interface MethodMetrics {
  method: string;
  count: number;
  percentage: number;
  averageSuccessRate: number;
}

export interface ResponseTimeMetrics {
  overall: number;
  byHour: { hour: number; avgTime: number }[];
  byDay: { day: string; avgTime: number }[];
  byAgent: { agentId: string; agentName: string; avgTime: number }[];
}

export interface WorkloadMetrics {
  agentId: string;
  agentName: string;
  currentLoad: number;
  maxCapacity: number;
  utilizationPercentage: number;
  queuedConversations: number;
}

export interface RealTimeMetrics {
  activeAgents: number;
  onlineAgents: number;
  totalConversations: number;
  averageResponseTime: number;
  queueLength: number;
  timestamp: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class AssignmentMetricsService {
  // Obtener métricas generales de asignación
  async getAssignmentMetrics(dateFrom?: string, dateTo?: string): Promise<AssignmentMetrics> {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await api.get<ApiResponse<AssignmentMetrics>>(
        `/assignment-metrics?${params.toString()}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error obteniendo métricas');
      }
      
      return response.data.data!;
    } catch (error: any) {
      console.error('Error obteniendo métricas de asignación:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo métricas');
    }
  }

  // Obtener métricas en tiempo real
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      const response = await api.get<ApiResponse<RealTimeMetrics>>('/assignment-metrics/real-time');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error obteniendo métricas en tiempo real');
      }
      
      return response.data.data!;
    } catch (error: any) {
      console.error('Error obteniendo métricas en tiempo real:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo métricas en tiempo real');
    }
  }

  // Obtener métricas por agente
  async getAgentMetrics(dateFrom?: string, dateTo?: string): Promise<AgentMetrics[]> {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await api.get<ApiResponse<AgentMetrics[]>>(
        `/assignment-metrics/agents?${params.toString()}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error obteniendo métricas por agente');
      }
      
      return response.data.data!;
    } catch (error: any) {
      console.error('Error obteniendo métricas por agente:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo métricas por agente');
    }
  }

  // Obtener distribución de carga de trabajo
  async getWorkloadDistribution(): Promise<WorkloadMetrics[]> {
    try {
      const response = await api.get<ApiResponse<WorkloadMetrics[]>>('/assignment-metrics/workload');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error obteniendo distribución de carga');
      }
      
      return response.data.data!;
    } catch (error: any) {
      console.error('Error obteniendo distribución de carga:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo distribución de carga');
    }
  }

  // Obtener métricas de tiempo de respuesta
  async getResponseTimeMetrics(dateFrom?: string, dateTo?: string): Promise<ResponseTimeMetrics> {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await api.get<ApiResponse<ResponseTimeMetrics>>(
        `/assignment-metrics/response-times?${params.toString()}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error obteniendo métricas de tiempo de respuesta');
      }
      
      return response.data.data!;
    } catch (error: any) {
      console.error('Error obteniendo métricas de tiempo de respuesta:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo métricas de tiempo de respuesta');
    }
  }

  // Obtener métricas de un período específico
  async getMetricsByPeriod(period: 'today' | 'week' | 'month'): Promise<AssignmentMetrics> {
    const now = new Date();
    let dateFrom: string;
    
    switch (period) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        dateFrom = weekStart.toISOString();
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    }
    
    return this.getAssignmentMetrics(dateFrom, now.toISOString());
  }

  // Obtener tendencias de métricas
  async getMetricsTrends(days: number = 7): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const metrics = await this.getAssignmentMetrics(
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      // Calcular tendencias
      return {
        conversationsTrend: this.calculateTrend(),
        assignmentsTrend: this.calculateTrend(),
        responseTimeTrend: this.calculateTrend(),
        satisfactionTrend: this.calculateSatisfactionTrend(metrics.assignmentsByAgent)
      };
    } catch (error: any) {
      console.error('Error obteniendo tendencias:', error);
      throw new Error('Error obteniendo tendencias');
    }
  }

  // Calcular tendencia simple
  private calculateTrend(): { value: number; trend: 'up' | 'down' | 'stable' } {
    // Simulación de tendencia - en una implementación real esto vendría de datos históricos
    const randomChange = (Math.random() - 0.5) * 0.2; // -10% a +10%
    const trend = randomChange > 0.05 ? 'up' : randomChange < -0.05 ? 'down' : 'stable';
    
    return {
      value: Math.abs(randomChange * 100),
      trend
    };
  }

  // Calcular tendencia de satisfacción
  private calculateSatisfactionTrend(_agents: AgentMetrics[]): { value: number; trend: 'up' | 'down' | 'stable' } {
    return this.calculateTrend();
  }

  // Exportar métricas a CSV
  async exportMetricsToCSV(dateFrom?: string, dateTo?: string): Promise<string> {
    try {
      const metrics = await this.getAssignmentMetrics(dateFrom, dateTo);
      
      // Crear CSV de métricas por agente
      const headers = [
        'Agente',
        'Total Asignadas',
        'Conversaciones Activas',
        'Conversaciones Completadas',
        'Tiempo Promedio Respuesta (min)',
        'Satisfacción Cliente (%)',
        'Carga Trabajo (%)',
        'Estado'
      ];
      
      const rows = metrics.assignmentsByAgent.map(agent => [
        agent.agentName,
        agent.totalAssigned.toString(),
        agent.activeConversations.toString(),
        agent.completedConversations.toString(),
        agent.averageResponseTime.toString(),
        agent.customerSatisfaction.toString(),
        agent.workloadPercentage.toString(),
        agent.status
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      return csvContent;
    } catch (error: any) {
      console.error('Error exportando métricas:', error);
      throw new Error('Error exportando métricas');
    }
  }
}

export default new AssignmentMetricsService(); 