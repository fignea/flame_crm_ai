import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';

export interface AssignmentMetrics {
  totalConversations: number;
  assignedConversations: number;
  unassignedConversations: number;
  averageAssignmentTime: number; // en segundos
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
  method: 'manual' | 'auto' | 'round_robin' | 'skill_based' | 'load_balanced';
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

export class AssignmentMetricsService {
  // Obtener métricas generales de asignación
  static async getAssignmentMetrics(
    companyId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<AssignmentMetrics> {
    try {
      const dateFilter = this.buildDateFilter(dateFrom, dateTo);
      
      const [
        totalConversations,
        assignedConversations,
        unassignedConversations,
        averageAssignmentTime,
        assignmentsByAgent,
        assignmentsByMethod,
        responseTimeMetrics,
        workloadDistribution
      ] = await Promise.all([
        this.getTotalConversations(companyId, dateFilter),
        this.getAssignedConversations(companyId, dateFilter),
        this.getUnassignedConversations(companyId, dateFilter),
        this.getAverageAssignmentTime(companyId, dateFilter),
        this.getAssignmentsByAgent(companyId, dateFilter),
        this.getAssignmentsByMethod(companyId, dateFilter),
        this.getResponseTimeMetrics(companyId, dateFilter),
        this.getWorkloadDistribution(companyId)
      ]);

      return {
        totalConversations,
        assignedConversations,
        unassignedConversations,
        averageAssignmentTime,
        assignmentsByAgent,
        assignmentsByMethod,
        responseTimeMetrics,
        workloadDistribution
      };
    } catch (error) {
      logger.error('Error obteniendo métricas de asignación:', error);
      throw error;
    }
  }

  // Construir filtro de fechas
  private static buildDateFilter(dateFrom?: Date, dateTo?: Date): any {
    const filter: any = {};
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.gte = dateFrom;
      if (dateTo) filter.createdAt.lte = dateTo;
    }
    return filter;
  }

  // Obtener total de conversaciones
  private static async getTotalConversations(companyId: string, dateFilter: any): Promise<number> {
    return await prisma.conversation.count({
      where: {
        connection: { companyId },
        ...dateFilter
      }
    });
  }

  // Obtener conversaciones asignadas
  private static async getAssignedConversations(companyId: string, dateFilter: any): Promise<number> {
    return await prisma.conversation.count({
      where: {
        connection: { companyId },
        userId: { not: null },
        ...dateFilter
      }
    });
  }

  // Obtener conversaciones sin asignar
  private static async getUnassignedConversations(companyId: string, dateFilter: any): Promise<number> {
    return await prisma.conversation.count({
      where: {
        connection: { companyId },
        userId: null,
        ...dateFilter
      }
    });
  }

  // Calcular tiempo promedio de asignación
  private static async getAverageAssignmentTime(companyId: string, dateFilter: any): Promise<number> {
    const conversations = await prisma.conversation.findMany({
      where: {
        connection: { companyId },
        userId: { not: null },
        ...dateFilter
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    if (conversations.length === 0) return 0;

    const totalTime = conversations.reduce((sum, conv) => {
      return sum + (conv.updatedAt.getTime() - conv.createdAt.getTime());
    }, 0);

    return Math.round(totalTime / conversations.length / 1000); // en segundos
  }

  // Obtener métricas por agente
  private static async getAssignmentsByAgent(companyId: string, dateFilter: any): Promise<AgentMetrics[]> {
    const agents = await prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        role: {
          name: { in: ['agent', 'admin', 'manager'] }
        }
      },
      include: {
        conversations: {
          where: {
            connection: { companyId },
            ...dateFilter
          },
          select: {
            id: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 50
            }
          }
        }
      }
    });

    return agents.map(agent => {
      const conversations = agent.conversations;
      const totalAssigned = conversations.length;
      const activeConversations = conversations.filter(c => c.userId === agent.id).length;
      const completedConversations = totalAssigned - activeConversations;

      // Calcular tiempo promedio de respuesta
      let totalResponseTime = 0;
      let responseCount = 0;

      conversations.forEach(conv => {
        const messages = conv.messages;
        for (let i = 0; i < messages.length - 1; i++) {
          const current = messages[i];
          const next = messages[i + 1];
          if (current && next && !current.fromMe && next.fromMe) {
            totalResponseTime += next.createdAt.getTime() - current.createdAt.getTime();
            responseCount++;
          }
        }
      });

      const averageResponseTime = responseCount > 0 ? 
        Math.round(totalResponseTime / responseCount / 1000 / 60) : 0;

      return {
        agentId: agent.id,
        agentName: agent.name,
        totalAssigned,
        activeConversations,
        completedConversations,
        averageResponseTime,
        customerSatisfaction: 85, // Placeholder - esto vendría de encuestas
        workloadPercentage: Math.round((activeConversations / 5) * 100), // Asumiendo máximo 5
        status: agent.agentStatus as 'available' | 'busy' | 'away' | 'offline',
        lastActivity: agent.lastSeen
      };
    });
  }

  // Obtener métricas por método de asignación
  private static async getAssignmentsByMethod(companyId: string, dateFilter: any): Promise<MethodMetrics[]> {
    // Como no tenemos tabla de assignments, simulamos los datos
    // En una implementación real, esto vendría de registros de asignación
    const totalAssigned = await this.getAssignedConversations(companyId, dateFilter);
    
    return [
      {
        method: 'auto',
        count: Math.round(totalAssigned * 0.6),
        percentage: 60,
        averageSuccessRate: 92
      },
      {
        method: 'manual',
        count: Math.round(totalAssigned * 0.25),
        percentage: 25,
        averageSuccessRate: 98
      },
      {
        method: 'load_balanced',
        count: Math.round(totalAssigned * 0.15),
        percentage: 15,
        averageSuccessRate: 95
      }
    ];
  }

  // Obtener métricas de tiempo de respuesta
  private static async getResponseTimeMetrics(companyId: string, dateFilter: any): Promise<ResponseTimeMetrics> {
    const conversations = await prisma.conversation.findMany({
      where: {
        connection: { companyId },
        userId: { not: null },
        ...dateFilter
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100
        },
        user: {
          select: { id: true, name: true }
        }
      }
    });

    const responseTimes: number[] = [];
    const byHour: { [key: number]: number[] } = {};
    const byDay: { [key: string]: number[] } = {};
    const byAgent: { [key: string]: { name: string; times: number[] } } = {};

    conversations.forEach(conv => {
      const messages = conv.messages;
      for (let i = 0; i < messages.length - 1; i++) {
        const current = messages[i];
        const next = messages[i + 1];
        
        if (current && next && !current.fromMe && next.fromMe) {
          const responseTime = next.createdAt.getTime() - current.createdAt.getTime();
          const responseTimeMinutes = Math.round(responseTime / 1000 / 60);
          
          responseTimes.push(responseTimeMinutes);
          
          // Por hora
          const hour = next.createdAt.getHours();
          if (!byHour[hour]) byHour[hour] = [];
          byHour[hour].push(responseTimeMinutes);
          
          // Por día
          const day = next.createdAt.toDateString();
          if (!byDay[day]) byDay[day] = [];
          byDay[day].push(responseTimeMinutes);
          
          // Por agente
          if (conv.user) {
            if (!byAgent[conv.user.id]) {
              byAgent[conv.user.id] = { name: conv.user.name, times: [] };
            }
            const agentData = byAgent[conv.user.id];
            if (agentData) {
              agentData.times.push(responseTimeMinutes);
            }
          }
        }
      }
    });

    const overall = responseTimes.length > 0 ? 
      Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;

    return {
      overall,
      byHour: Object.entries(byHour).map(([hour, times]) => ({
        hour: parseInt(hour),
        avgTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      })),
      byDay: Object.entries(byDay).map(([day, times]) => ({
        day,
        avgTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      })),
      byAgent: Object.entries(byAgent).map(([agentId, data]) => ({
        agentId,
        agentName: data.name,
        avgTime: Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length)
      }))
    };
  }

  // Obtener distribución de carga de trabajo
  private static async getWorkloadDistribution(companyId: string): Promise<WorkloadMetrics[]> {
    const agents = await prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        role: {
          name: { in: ['agent', 'admin', 'manager'] }
        }
      },
      include: {
        conversations: {
          where: {
            userId: { not: null },
            connection: { companyId }
          },
          select: { id: true }
        }
      }
    });

    return agents.map(agent => ({
      agentId: agent.id,
      agentName: agent.name,
      currentLoad: agent.conversations.length,
      maxCapacity: 5, // Configuración por defecto
      utilizationPercentage: Math.round((agent.conversations.length / 5) * 100),
      queuedConversations: 0 // Placeholder
    }));
  }

  // Obtener métricas en tiempo real
  static async getRealTimeMetrics(companyId: string): Promise<any> {
    try {
      const [
        activeAgents,
        onlineAgents,
        totalConversations,
        responseTime,
        queueLength
      ] = await Promise.all([
        this.getActiveAgentsCount(companyId),
        this.getOnlineAgentsCount(companyId),
        this.getTotalConversations(companyId, {}),
        this.getAverageResponseTime(companyId),
        this.getQueueLength(companyId)
      ]);

      return {
        activeAgents,
        onlineAgents,
        totalConversations,
        averageResponseTime: responseTime,
        queueLength,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error obteniendo métricas en tiempo real:', error);
      throw error;
    }
  }

  // Obtener conteo de agentes activos
  private static async getActiveAgentsCount(companyId: string): Promise<number> {
    return await prisma.user.count({
      where: {
        companyId,
        isActive: true,
        agentStatus: 'available',
        role: {
          name: { in: ['agent', 'admin', 'manager'] }
        }
      }
    });
  }

  // Obtener conteo de agentes online
  private static async getOnlineAgentsCount(companyId: string): Promise<number> {
    return await prisma.user.count({
      where: {
        companyId,
        isOnline: true,
        role: {
          name: { in: ['agent', 'admin', 'manager'] }
        }
      }
    });
  }

  // Obtener tiempo promedio de respuesta actual
  private static async getAverageResponseTime(companyId: string): Promise<number> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return await this.getAverageAssignmentTime(companyId, {
      createdAt: { gte: twentyFourHoursAgo }
    });
  }

  // Obtener longitud de cola
  private static async getQueueLength(companyId: string): Promise<number> {
    return await prisma.conversation.count({
      where: {
        connection: { companyId },
        userId: null
      }
    });
  }
} 