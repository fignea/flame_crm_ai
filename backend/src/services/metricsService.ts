import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';

export interface ChatMetrics {
  totalConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  avgConversationDuration: number;
  agentUtilization: number;
  customerSatisfaction: number;
  resolutionRate: number;
  firstResponseTime: number;
  avgResolutionTime: number;
  queueTime: number;
  peakHours: { hour: number; messageCount: number }[];
  dailyStats: { date: string; count: number }[];
}

export interface ConversationMetrics {
  totalConversations: number;
  activeConversations: number;
  averageDuration: number;
  resolutionRate: number;
  escalationRate: number;
  dailyConversations: DailyMetrics[];
}

export interface MessageMetrics {
  totalMessages: number;
  avgResponseTime: number;
  messagesByType: Record<string, number>;
  hourlyDistribution: HourlyMetrics[];
  dailyVolume: DailyMetrics[];
}

export interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  avgUtilization: number;
  topPerformers: AgentPerformance[];
  responseTimeByAgent: AgentResponseMetrics[];
}

export interface ResponseTimeMetrics {
  avgResponseTime: number;
  median: number;
  percentile95: number;
  firstResponseTime: number;
  byHour: HourlyResponseMetrics[];
  byAgent: AgentResponseMetrics[];
}

export interface DailyMetrics {
  date: string;
  count: number;
}

export interface HourlyMetrics {
  hour: number;
  count: number;
}

export interface HourlyResponseMetrics {
  hour: number;
  avgResponseTime: number;
  messageCount: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  conversationsHandled: number;
  avgResponseTime: number;
  satisfactionScore: number;
  resolutionRate: number;
}

export interface AgentResponseMetrics {
  agentId: string;
  agentName: string;
  avgResponseTime: number;
  firstResponseTime: number;
  totalResponses: number;
  slaCompliance: number;
}

export interface KeywordMetrics {
  word: string;
  count: number;
  percentage: number;
}

export interface SatisfactionMetrics {
  avgRating: number;
  totalRatings: number;
  distribution: Record<number, number>;
  trend: { date: string; rating: number }[];
}

export interface QueueMetrics {
  avgWaitTime: number;
  maxWaitTime: number;
  queueLength: number;
  abandonmentRate: number;
  peakTimes: { hour: number; avgWaitTime: number }[];
}

export interface ComprehensiveMetrics {
  overview: ChatMetrics;
  conversations: ConversationMetrics;
  messages: MessageMetrics;
  agents: AgentMetrics;
  responseTime: ResponseTimeMetrics;
  satisfaction: SatisfactionMetrics;
  queue: QueueMetrics;
  keywords: KeywordMetrics[];
  period: {
    startDate: string;
    endDate: string;
  };
}

export class MetricsService {
  
  static async getChatMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<ChatMetrics> {
    try {
      const whereClause = {
        connection: {
          companyId
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        ...(userId && { userId })
      };

      const [conversations, messages, agents] = await Promise.all([
        prisma.conversation.findMany({
          where: whereClause,
          include: {
            messages: {
              include: {
                user: true
              }
            }
          }
        }),
        prisma.message.findMany({
          where: {
            conversation: {
              connection: {
                companyId
              },
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          },
          include: {
            user: true,
            conversation: true
          }
        }),
        prisma.user.findMany({
          where: {
            companyId,
            role: {
              name: 'agent'
            }
          }
        })
      ]);

      const totalConversations = conversations.length;
      const totalMessages = messages.length;
      const responseTimes = this.calculateResponseTimes(messages);
      const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
      const avgConversationDuration = this.calculateAvgConversationDuration(conversations);
      const agentUtilization = this.calculateAgentUtilization(agents, conversations);
      const customerSatisfaction = await this.calculateCustomerSatisfaction(companyId, startDate, endDate);
      const resolutionRate = this.calculateResolutionRate(conversations);
      const firstResponseTime = this.calculateFirstResponseTime(messages);
      const avgResolutionTime = this.calculateAvgResolutionTime(messages);
      const queueTime = this.calculateQueueTime(messages);
      const peakHours = this.getMessagesByHour(messages).map(h => ({ hour: h.hour, messageCount: h.count }));
      const dailyStats = this.getDailyConversations(conversations);

      return {
        totalConversations,
        totalMessages,
        avgResponseTime,
        avgConversationDuration,
        agentUtilization,
        customerSatisfaction,
        resolutionRate,
        firstResponseTime,
        avgResolutionTime,
        queueTime,
        peakHours,
        dailyStats
      };
    } catch (error) {
      logger.error('Error calculating chat metrics:', error);
      throw new Error('Failed to calculate chat metrics');
    }
  }

  static async getConversationMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ConversationMetrics> {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          connection: {
            companyId
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          messages: true
        }
      });

      const totalConversations = conversations.length;
      const activeConversations = conversations.filter(c => c.unreadCount > 0).length;
      const averageDuration = this.calculateAvgConversationDuration(conversations);
      const resolutionRate = this.calculateResolutionRate(conversations);
      const escalationRate = this.calculateEscalationRate(conversations);
      const dailyConversations = this.getDailyConversations(conversations);

      return {
        totalConversations,
        activeConversations,
        averageDuration,
        resolutionRate,
        escalationRate,
        dailyConversations
      };
    } catch (error) {
      logger.error('Error calculating conversation metrics:', error);
      throw new Error('Failed to calculate conversation metrics');
    }
  }

  static async getMessageMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MessageMetrics> {
    try {
      const messages = await prisma.message.findMany({
        where: {
          conversation: {
            connection: {
              companyId
            },
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        include: {
          user: true,
          conversation: true
        }
      });

      const totalMessages = messages.length;
      const responseTimes = this.calculateResponseTimes(messages);
      const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
      const messagesByType = this.getMessagesByType(messages);
      const hourlyDistribution = this.getMessagesByHour(messages);
      const dailyVolume = this.getMessagesByDay(messages);

      return {
        totalMessages,
        avgResponseTime,
        messagesByType,
        hourlyDistribution,
        dailyVolume
      };
    } catch (error) {
      logger.error('Error calculating message metrics:', error);
      throw new Error('Failed to calculate message metrics');
    }
  }

  static async getAgentMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AgentMetrics> {
    try {
      const [agents, conversations, messages] = await Promise.all([
        prisma.user.findMany({
          where: {
            companyId,
            role: {
              name: 'agent'
            }
          }
        }),
        prisma.conversation.findMany({
          where: {
            connection: {
              companyId
            },
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            user: true,
            messages: {
              include: {
                user: true
              }
            }
          }
        }),
        prisma.message.findMany({
          where: {
            conversation: {
              connection: {
                companyId
              },
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          },
          include: {
            user: true,
            conversation: true
          }
        })
      ]);

      const totalAgents = agents.length;
      const activeAgents = agents.filter(a => a.isOnline).length;
      const avgUtilization = this.calculateAgentUtilization(agents, conversations);
      const topPerformers = await this.getTopPerformers(agents, conversations, messages);
      const responseTimeByAgent = await this.getResponseTimeByAgent(messages);

      return {
        totalAgents,
        activeAgents,
        avgUtilization,
        topPerformers,
        responseTimeByAgent
      };
    } catch (error) {
      logger.error('Error calculating agent metrics:', error);
      throw new Error('Failed to calculate agent metrics');
    }
  }

  static async getResponseTimeMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ResponseTimeMetrics> {
    try {
      const messages = await prisma.message.findMany({
        where: {
          conversation: {
            connection: {
              companyId
            },
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        include: {
          user: true,
          conversation: true
        }
      });

      const responseTimes = this.calculateResponseTimes(messages);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length || 0;
      const median = this.calculateMedian(responseTimes);
      const percentile95 = this.calculatePercentile(responseTimes, 95);
      const firstResponseTime = this.calculateFirstResponseTime(messages);
      const byHour = this.getResponseTimeByHour(messages);
      const byAgent = await this.getResponseTimeByAgent(messages);

      return {
        avgResponseTime,
        median,
        percentile95,
        firstResponseTime,
        byHour,
        byAgent
      };
    } catch (error) {
      logger.error('Error calculating response time metrics:', error);
      throw new Error('Failed to calculate response time metrics');
    }
  }

  static async getSatisfactionMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SatisfactionMetrics> {
    try {
      // Esta función requiere una tabla de ratings/feedback que no existe en el esquema actual
      // Por ahora retornamos datos simulados
      return {
        avgRating: 4.2,
        totalRatings: 150,
        distribution: {
          5: 60,
          4: 45,
          3: 30,
          2: 10,
          1: 5
        },
        trend: [
          { date: '2024-01-01', rating: 4.1 },
          { date: '2024-01-02', rating: 4.2 },
          { date: '2024-01-03', rating: 4.3 },
        ]
      };
    } catch (error) {
      logger.error('Error calculating satisfaction metrics:', error);
      throw new Error('Failed to calculate satisfaction metrics');
    }
  }

  static async getQueueMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<QueueMetrics> {
    try {
      // Esta función requiere datos de cola que no existen en el esquema actual
      // Por ahora retornamos datos simulados
      return {
        avgWaitTime: 2.5,
        maxWaitTime: 15.0,
        queueLength: 5,
        abandonmentRate: 0.08,
        peakTimes: [
          { hour: 9, avgWaitTime: 3.2 },
          { hour: 14, avgWaitTime: 4.1 },
          { hour: 16, avgWaitTime: 2.8 }
        ]
      };
    } catch (error) {
      logger.error('Error calculating queue metrics:', error);
      throw new Error('Failed to calculate queue metrics');
    }
  }

  static async getComprehensiveMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<ComprehensiveMetrics> {
    try {
      const [overview, conversations, messages, agents, responseTime, satisfaction, queue, keywords] = await Promise.all([
        this.getChatMetrics(companyId, startDate, endDate, userId),
        this.getConversationMetrics(companyId, startDate, endDate),
        this.getMessageMetrics(companyId, startDate, endDate),
        this.getAgentMetrics(companyId, startDate, endDate),
        this.getResponseTimeMetrics(companyId, startDate, endDate),
        this.getSatisfactionMetrics(companyId, startDate, endDate),
        this.getQueueMetrics(companyId, startDate, endDate),
        this.getKeywordAnalysis(companyId, startDate, endDate)
      ]);

      return {
        overview,
        conversations,
        messages,
        agents,
        responseTime,
        satisfaction,
        queue,
        keywords,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };
    } catch (error) {
      logger.error('Error calculating comprehensive metrics:', error);
      throw new Error('Failed to calculate comprehensive metrics');
    }
  }

  static async getKeywordAnalysis(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<KeywordMetrics[]> {
    try {
      const messages = await prisma.message.findMany({
        where: {
          conversation: {
            connection: {
              companyId
            },
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      });

      return this.getTopKeywords(messages);
    } catch (error) {
      logger.error('Error calculating keyword analysis:', error);
      throw new Error('Failed to calculate keyword analysis');
    }
  }

  // Helper methods

  private static calculateAvgConversationDuration(conversations: any[]): number {
    if (conversations.length === 0) return 0;
    
    const durations = conversations.map(conversation => {
      const messages = conversation.messages || [];
      if (messages.length === 0) return 0;
      
      const sortedMessages = messages.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      if (sortedMessages.length < 2) return 0;
      
      const firstMessage = sortedMessages[0];
      const lastMessage = sortedMessages[sortedMessages.length - 1];
      
      return (new Date(lastMessage.createdAt).getTime() - new Date(firstMessage.createdAt).getTime()) / (1000 * 60);
    });

    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  private static calculateResponseTimes(messages: any[]): number[] {
    const responseTimes: number[] = [];
    
    // Agrupar mensajes por conversación
    const messagesByConversation = messages.reduce((acc, message) => {
      if (!acc[message.conversationId]) {
        acc[message.conversationId] = [];
      }
      acc[message.conversationId].push(message);
      return acc;
    }, {} as Record<string, any[]>);

    // Calcular tiempos de respuesta por conversación
    Object.keys(messagesByConversation).forEach((conversationId: string) => {
      const conversationMessages = messagesByConversation[conversationId];
      const sortedMessages = conversationMessages.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (let i = 0; i < sortedMessages.length - 1; i++) {
        const currentMessage = sortedMessages[i];
        const nextMessage = sortedMessages[i + 1];

        // Si el mensaje actual es del cliente y el siguiente es del agente
        if (!currentMessage.fromMe && nextMessage.fromMe) {
          const responseTime = (new Date(nextMessage.createdAt).getTime() - new Date(currentMessage.createdAt).getTime()) / (1000 * 60);
          responseTimes.push(responseTime);
        }
      }
    });

    return responseTimes;
  }

  private static calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const sorted = numbers.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 !== 0 
      ? sorted[mid] || 0
      : ((sorted[mid - 1] || 0) + (sorted[mid] || 0)) / 2;
  }

  private static calculateFirstResponseTime(messages: any[]): number {
    const messagesByConversation = messages.reduce((acc, message) => {
      if (!acc[message.conversationId]) {
        acc[message.conversationId] = [];
      }
      acc[message.conversationId].push(message);
      return acc;
    }, {} as Record<string, any[]>);

    const firstResponseTimes: number[] = [];

    Object.keys(messagesByConversation).forEach((conversationId: string) => {
      const conversationMessages = messagesByConversation[conversationId];
      const sortedMessages = conversationMessages.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const firstCustomerMessage = sortedMessages.find((m: any) => !m.fromMe);
      const firstAgentMessage = sortedMessages.find((m: any) => m.fromMe);

      if (firstCustomerMessage && firstAgentMessage) {
        const responseTime = (new Date(firstAgentMessage.createdAt).getTime() - new Date(firstCustomerMessage.createdAt).getTime()) / (1000 * 60);
        firstResponseTimes.push(responseTime);
      }
    });

    return firstResponseTimes.length > 0 
      ? firstResponseTimes.reduce((sum, time) => sum + time, 0) / firstResponseTimes.length 
      : 0;
  }

  private static calculateAvgResolutionTime(messages: any[]): number {
    // Simplificado: tiempo desde primer mensaje hasta último mensaje de la conversación
    const messagesByConversation = messages.reduce((acc, message) => {
      if (!acc[message.conversationId]) {
        acc[message.conversationId] = [];
      }
      acc[message.conversationId].push(message);
      return acc;
    }, {} as Record<string, any[]>);

    const resolutionTimes: number[] = [];

    Object.keys(messagesByConversation).forEach((conversationId: string) => {
      const conversationMessages = messagesByConversation[conversationId];
      if (conversationMessages.length < 2) return;

      const sortedMessages = conversationMessages.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const firstMessage = sortedMessages[0];
      const lastMessage = sortedMessages[sortedMessages.length - 1];

      const resolutionTime = (new Date(lastMessage.createdAt).getTime() - new Date(firstMessage.createdAt).getTime()) / (1000 * 60);
      resolutionTimes.push(resolutionTime);
    });

    return resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length 
      : 0;
  }

  private static calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0;
    
    const sorted = numbers.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[index] || 0;
  }

  private static calculateAgentUtilization(agents: any[], conversations: any[]): number {
    if (agents.length === 0) return 0;
    
    const agentConversationCount: Record<string, number> = {};
    
    conversations.forEach(conversation => {
      if (conversation.userId) {
        agentConversationCount[conversation.userId] = (agentConversationCount[conversation.userId] || 0) + 1;
      }
    });

    const totalConversations = conversations.length;
    const activeAgents = Object.keys(agentConversationCount).length;
    
    return activeAgents > 0 ? (totalConversations / activeAgents) / 10 : 0; // Normalizamos a 10 conversaciones como 100%
  }

  private static async calculateCustomerSatisfaction(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Placeholder - requiere implementación de sistema de ratings
    return 4.2;
  }

  private static calculateResolutionRate(conversations: any[]): number {
    if (conversations.length === 0) return 0;
    
    // Simplificado: conversaciones con al menos un mensaje del agente
    const resolvedConversations = conversations.filter(c => 
      c.messages && c.messages.some((m: any) => m.fromMe)
    ).length;
    
    return (resolvedConversations / conversations.length) * 100;
  }

  private static calculateEscalationRate(conversations: any[]): number {
    if (conversations.length === 0) return 0;
    
    // Placeholder - requiere implementación de sistema de escalación
    return 5; // 5% por defecto
  }

  private static calculateQueueTime(messages: any[]): number {
    // Placeholder - requiere implementación de sistema de cola
    return 2.5;
  }

  private static async getTopPerformers(agents: any[], conversations: any[], messages: any[]): Promise<AgentPerformance[]> {
    const agentPerformance: Record<string, AgentPerformance> = {};

    agents.forEach(agent => {
      const agentConversations = conversations.filter(c => c.userId === agent.id);

      agentPerformance[agent.id] = {
        agentId: agent.id,
        agentName: agent.name,
        conversationsHandled: agentConversations.length,
        avgResponseTime: Math.random() * 5, // Placeholder
        satisfactionScore: 4.0 + Math.random() * 1, // Placeholder
        resolutionRate: 85 + Math.random() * 15 // Placeholder
      };
    });

    return Object.values(agentPerformance)
      .sort((a, b) => b.satisfactionScore - a.satisfactionScore)
      .slice(0, 5);
  }

  private static getDailyConversations(conversations: any[]): DailyMetrics[] {
    const dailyStats: Record<string, number> = {};

    conversations.forEach(conversation => {
      if (conversation.createdAt) {
        const date = new Date(conversation.createdAt).toISOString().split('T')[0];
        if (date) {
          dailyStats[date] = (dailyStats[date] || 0) + 1;
        }
      }
    });

    return Object.entries(dailyStats).map(([date, count]) => ({
      date,
      count
    }));
  }

  private static async getResponseTimeByAgent(messages: any[]): Promise<AgentResponseMetrics[]> {
    const agentResponseTimes: Record<string, number[]> = {};

    messages.forEach(message => {
      if (message.fromMe && message.user && message.user.id) {
        const agentId = message.user.id;
        if (!agentResponseTimes[agentId]) {
          agentResponseTimes[agentId] = [];
        }
        // Aquí se calcularían los tiempos de respuesta reales
        // Por simplicidad, usamos un valor simulado
        agentResponseTimes[agentId].push(Math.random() * 10);
      }
    });

    return Object.entries(agentResponseTimes).map(([agentId, times]) => {
      const agent = messages.find((m: any) => m.user?.id === agentId)?.user;
      const avgResponseTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      return {
        agentId: agentId || 'unknown',
        agentName: agent?.name || 'Unknown',
        avgResponseTime,
        firstResponseTime: times[0] || 0,
        totalResponses: times.length,
        slaCompliance: (times.filter(time => time <= 5).length / times.length) * 100
      };
    });
  }

  private static getResponseTimeByHour(messages: any[]): HourlyResponseMetrics[] {
    const hourlyStats: Record<number, { times: number[]; count: number }> = {};

    messages.forEach(message => {
      if (message.fromMe) {
        const hour = new Date(message.createdAt).getHours();
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { times: [], count: 0 };
        }
        hourlyStats[hour].times.push(Math.random() * 10); // Simulado
        hourlyStats[hour].count++;
      }
    });

    return Array.from({ length: 24 }, (_, hour) => {
      const stats = hourlyStats[hour];
      return {
        hour,
        avgResponseTime: stats ? stats.times.reduce((sum, time) => sum + time, 0) / stats.times.length : 0,
        messageCount: stats ? stats.count : 0
      };
    });
  }

  private static getMessagesByType(messages: any[]): Record<string, number> {
    const typeStats: Record<string, number> = {};

    messages.forEach(message => {
      const type = message.mediaType || 'text';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    return typeStats;
  }

  private static getMessagesByHour(messages: any[]): HourlyMetrics[] {
    const hourlyStats: Record<number, number> = {};

    messages.forEach(message => {
      const hour = new Date(message.createdAt).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyStats[hour] || 0
    }));
  }

  private static getMessagesByDay(messages: any[]): DailyMetrics[] {
    const dailyStats: Record<string, number> = {};

    messages.forEach(message => {
      if (message.createdAt) {
        const date = new Date(message.createdAt).toISOString().split('T')[0];
        if (date) {
          dailyStats[date] = (dailyStats[date] || 0) + 1;
        }
      }
    });

    return Object.entries(dailyStats).map(([date, count]) => ({
      date,
      count
    }));
  }

  private static getTopKeywords(messages: any[]): KeywordMetrics[] {
    const keywordCounts: Record<string, number> = {};
    const totalMessages = messages.length;

    messages.forEach(message => {
      if (!message.fromMe && message.content) {
        const words = message.content.toLowerCase()
          .split(/\s+/)
          .filter((word: string) => word.length > 3)
          .filter((word: string) => !['hola', 'gracias', 'bien', 'bueno', 'favor'].includes(word));

        words.forEach((word: string) => {
          keywordCounts[word] = (keywordCounts[word] || 0) + 1;
        });
      }
    });

    return Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({
        word,
        count,
        percentage: (count / totalMessages) * 100
      }));
  }
} 