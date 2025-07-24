import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';
import { getIO } from './socketService';

export interface AgentInfo {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  status: 'available' | 'busy' | 'away' | 'offline';
  activeConversations: number;
  maxConversations: number;
  lastActivity: Date;
  responseTime: number; // Tiempo promedio de respuesta en minutos
  availability: number; // Porcentaje de disponibilidad
  workload: number; // Carga de trabajo actual (0-100)
  skills: string[]; // Habilidades del agente
  timezone: string; // Zona horaria del agente
  workingHours: {
    start: string;
    end: string;
    days: number[]; // 0=domingo, 1=lunes, etc.
  };
}

export interface ConversationAssignment {
  conversationId: string;
  userId: string;
  assignedAt: Date;
  assignedBy: string; // 'auto' | userId
  status: 'active' | 'transferred' | 'completed';
  assignmentMethod: 'manual' | 'auto' | 'round_robin' | 'skill_based' | 'load_balanced' | 'priority_based';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AssignmentConfig {
  companyId: string;
  algorithm: 'load_balanced' | 'round_robin' | 'skill_based' | 'priority_based';
  maxConversationsPerAgent: number;
  autoAssignmentEnabled: boolean;
  skillBasedAssignment: boolean;
  respectWorkingHours: boolean;
  escalationRules: {
    enabled: boolean;
    timeoutMinutes: number;
    escalateTo: 'manager' | 'supervisor' | 'available_agent';
  };
  notificationSettings: {
    newAssignment: boolean;
    transfer: boolean;
    escalation: boolean;
  };
}

export class ConversationAssignmentService {
  private static readonly DEFAULT_MAX_CONVERSATIONS = 5;
  private static readonly DEFAULT_RESPONSE_TIME_MINUTES = 15;
  private static lastAssignedAgentIndex = 0; // Para round robin

  // Obtener configuración de asignación para una empresa
  static async getAssignmentConfig(companyId: string): Promise<AssignmentConfig> {
    try {
      // Por ahora retornamos configuración por defecto
      // En el futuro esto podría venir de la base de datos
      return {
        companyId,
        algorithm: 'load_balanced',
        maxConversationsPerAgent: this.DEFAULT_MAX_CONVERSATIONS,
        autoAssignmentEnabled: true,
        skillBasedAssignment: false,
        respectWorkingHours: true,
        escalationRules: {
          enabled: true,
          timeoutMinutes: 30,
          escalateTo: 'manager'
        },
        notificationSettings: {
          newAssignment: true,
          transfer: true,
          escalation: true
        }
      };
    } catch (error) {
      logger.error('Error obteniendo configuración de asignación:', error);
      throw error;
    }
  }

  // Obtener agentes disponibles con métricas mejoradas
  static async getAvailableAgents(companyId: string): Promise<AgentInfo[]> {
    try {
      const config = await this.getAssignmentConfig(companyId);
      
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
              userId: { not: null }
            },
            select: { id: true, updatedAt: true }
          },
          messages: {
            where: {
              fromMe: true,
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Último día
            },
            select: { createdAt: true }
          }
        }
      });

      return Promise.all(agents.map(async (agent) => {
        const activeConversations = agent.conversations.length;
        const responseTime = await this.calculateResponseTime(agent.id);
        const availability = this.calculateAvailability(agent);
        const workload = this.calculateWorkload(activeConversations, config.maxConversationsPerAgent);
        const skills = await this.getAgentSkills(agent.id);
        const workingHours = await this.getAgentWorkingHours(agent.id);

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          isOnline: agent.isOnline,
          status: agent.agentStatus as ('available' | 'busy' | 'away' | 'offline'),
          activeConversations,
          maxConversations: config.maxConversationsPerAgent,
          lastActivity: agent.lastSeen,
          responseTime,
          availability,
          workload,
          skills,
          timezone: 'UTC', // Por defecto, esto debería venir de la configuración del usuario
          workingHours
        };
      }));
    } catch (error) {
      logger.error('Error obteniendo agentes disponibles:', error);
      return [];
    }
  }

  // Calcular tiempo promedio de respuesta
  static async calculateResponseTime(agentId: string): Promise<number> {
    try {
      const conversations = await prisma.conversation.findMany({
        where: { userId: agentId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 100 // Limitar para performance
          }
        }
      });

      let totalResponseTime = 0;
      let responseCount = 0;

      conversations.forEach(conversation => {
        const messages = conversation.messages;
        for (let i = 0; i < messages.length - 1; i++) {
          const currentMessage = messages[i];
          const nextMessage = messages[i + 1];
          
          // Si el mensaje actual es del cliente y el siguiente es del agente
          if (currentMessage && nextMessage && !currentMessage.fromMe && nextMessage.fromMe) {
            const responseTime = nextMessage.createdAt.getTime() - currentMessage.createdAt.getTime();
            totalResponseTime += responseTime;
            responseCount++;
          }
        }
      });

      return responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : this.DEFAULT_RESPONSE_TIME_MINUTES;
    } catch (error) {
      logger.error('Error calculando tiempo de respuesta:', error);
      return this.DEFAULT_RESPONSE_TIME_MINUTES;
    }
  }

  // Calcular disponibilidad del agente
  static calculateAvailability(agent: any): number {
    const now = new Date();
    const lastSeen = new Date(agent.lastSeen);
    const minutesOffline = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    if (agent.agentStatus === 'available' && minutesOffline < 5) {
      return 100;
    } else if (agent.agentStatus === 'busy' && minutesOffline < 15) {
      return 75;
    } else if (agent.agentStatus === 'away' && minutesOffline < 30) {
      return 50;
    } else {
      return 0;
    }
  }

  // Calcular carga de trabajo
  static calculateWorkload(activeConversations: number, maxConversations: number): number {
    return Math.round((activeConversations / maxConversations) * 100);
  }

  // Obtener habilidades del agente
  static async getAgentSkills(agentId: string): Promise<string[]> {
    try {
      // Por ahora retornamos habilidades por defecto
      // En el futuro esto podría venir de una tabla de habilidades
      return ['general', 'support', 'sales'];
    } catch (error) {
      logger.error('Error obteniendo habilidades del agente:', error);
      return [];
    }
  }

  // Obtener horarios de trabajo del agente
  static async getAgentWorkingHours(agentId: string): Promise<any> {
    try {
      // Por ahora retornamos horarios por defecto
      // En el futuro esto podría venir de la configuración del usuario
      return {
        start: '09:00',
        end: '18:00',
        days: [1, 2, 3, 4, 5] // Lunes a viernes
      };
    } catch (error) {
      logger.error('Error obteniendo horarios de trabajo:', error);
      return {
        start: '00:00',
        end: '23:59',
        days: [0, 1, 2, 3, 4, 5, 6] // Todos los días
      };
    }
  }

  // Verificar si un agente está en horario de trabajo
  static isAgentInWorkingHours(agent: AgentInfo): boolean {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().substr(0, 5);
    
    return agent.workingHours.days.includes(currentDay) &&
           currentTime >= agent.workingHours.start &&
           currentTime <= agent.workingHours.end;
  }

  // Asignación automática mejorada con múltiples algoritmos
  static async assignConversationAutomatically(
    conversationId: string,
    companyId: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<ConversationAssignment | null> {
    try {
      const config = await this.getAssignmentConfig(companyId);
      
      if (!config.autoAssignmentEnabled) {
        logger.info('Auto-asignación está deshabilitada');
        return null;
      }

      const availableAgents = await this.getAvailableAgents(companyId);
      let eligibleAgents = availableAgents.filter(agent => 
        agent.status === 'available' && 
        agent.workload < 100 &&
        (!config.respectWorkingHours || this.isAgentInWorkingHours(agent))
      );

      if (eligibleAgents.length === 0) {
        logger.warn(`No hay agentes disponibles para la conversación ${conversationId}`);
        return null;
      }

      let selectedAgent: AgentInfo | null;

      switch (config.algorithm) {
        case 'round_robin':
          selectedAgent = this.selectAgentRoundRobin(eligibleAgents);
          break;
        case 'skill_based':
          selectedAgent = this.selectAgentBySkills(eligibleAgents, conversationId);
          break;
        case 'priority_based':
          selectedAgent = this.selectAgentByPriority(eligibleAgents, priority);
          break;
        case 'load_balanced':
        default:
          selectedAgent = this.selectAgentByLoadBalance(eligibleAgents);
          break;
      }

      if (!selectedAgent) {
        logger.warn(`No se pudo seleccionar un agente para la conversación ${conversationId}`);
        return null;
      }

      return await this.assignConversationToAgent(
        conversationId, 
        selectedAgent.id, 
        'auto',
        config.algorithm,
        priority
      );
    } catch (error) {
      logger.error('Error en asignación automática:', error);
      return null;
    }
  }

  // Selección por round robin
  static selectAgentRoundRobin(agents: AgentInfo[]): AgentInfo | null {
    if (agents.length === 0) return null;
    const agent = agents[this.lastAssignedAgentIndex % agents.length];
    this.lastAssignedAgentIndex++;
    return agent || null;
  }

  // Selección por balanceo de carga
  static selectAgentByLoadBalance(agents: AgentInfo[]): AgentInfo | null {
    if (agents.length === 0) return null;
    const selectedAgent = agents.reduce((prev, current) => 
      current.workload < prev.workload ? current : prev
    );
    return selectedAgent || null;
  }

  // Selección por habilidades
  static selectAgentBySkills(agents: AgentInfo[], conversationId: string): AgentInfo | null {
    // Por ahora retornamos el agente con menos carga
    // En el futuro podríamos analizar el tipo de conversación y habilidades requeridas
    return this.selectAgentByLoadBalance(agents);
  }

  // Selección por prioridad
  static selectAgentByPriority(agents: AgentInfo[], priority: string): AgentInfo | null {
    if (agents.length === 0) return null;
    
    if (priority === 'urgent') {
      // Para urgente, seleccionar el agente más disponible
      return agents.reduce((prev, current) => 
        current.availability > prev.availability ? current : prev
      );
    }
    return this.selectAgentByLoadBalance(agents);
  }

  // Asignar conversación a un agente específico
  static async assignConversationToAgent(
    conversationId: string,
    userId: string,
    assignedBy: string = 'auto',
    assignmentMethod: 'manual' | 'auto' | 'round_robin' | 'skill_based' | 'load_balanced' | 'priority_based' = 'auto',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<ConversationAssignment | null> {
    try {
      // Verificar que la conversación existe
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { contact: true, connection: true }
      });

      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      // Verificar que el usuario es válido y está activo
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          isActive: true,
          companyId: conversation.connection.companyId
        }
      });

      if (!user) {
        throw new Error('Usuario no encontrado o inactivo');
      }

      // Actualizar la conversación con el agente asignado
      const updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          userId: userId,
          updatedAt: new Date()
        },
        include: {
          contact: { select: { id: true, name: true, number: true, avatar: true } },
          connection: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } }
        }
      });

      // Crear registro de asignación
      const assignment: ConversationAssignment = {
        conversationId,
        userId,
        assignedAt: new Date(),
        assignedBy,
        status: 'active',
        assignmentMethod,
        priority
      };

      // Emitir evento de asignación via WebSocket
      const io = getIO();
      const companyRoom = `company-${conversation.connection.companyId}`;
      
      io.to(companyRoom).emit('conversationAssigned', {
        conversation: updatedConversation,
        assignment,
        agent: user
      });

      // Notificar al agente específico
      io.to(userId).emit('newConversationAssigned', {
        conversation: updatedConversation,
        message: `Se te ha asignado una nueva conversación con ${conversation.contact.name}`
      });

      logger.info(`Conversación ${conversationId} asignada a ${user.name} por ${assignedBy}`);

      return assignment;
    } catch (error) {
      logger.error('Error asignando conversación:', error);
      throw error;
    }
  }

  // Transferir conversación a otro agente
  static async transferConversation(
    conversationId: string,
    fromUserId: string,
    toUserId: string,
    reason?: string
  ): Promise<ConversationAssignment | null> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { contact: true, connection: true, user: true }
      });

      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      if (conversation.userId !== fromUserId) {
        throw new Error('No tienes permisos para transferir esta conversación');
      }

      // Verificar que el usuario destino existe y está activo
      const toUser = await prisma.user.findFirst({
        where: {
          id: toUserId,
          isActive: true,
          companyId: conversation.connection.companyId
        }
      });

      if (!toUser) {
        throw new Error('Usuario destino no encontrado o inactivo');
      }

      // Actualizar la conversación
      const updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          userId: toUserId,
          updatedAt: new Date()
        },
        include: {
          contact: { select: { id: true, name: true, number: true, avatar: true } },
          connection: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } }
        }
      });

      // Crear mensaje de sistema sobre la transferencia
      await prisma.message.create({
        data: {
          content: `[SISTEMA] Conversación transferida de ${conversation.user?.name} a ${toUser.name}${reason ? ` - Motivo: ${reason}` : ''}`,
          fromMe: true,
          status: 'sent',
          conversationId,
          contactId: conversation.contactId,
          connectionId: conversation.connectionId,
          userId: fromUserId
        }
      });

      // Emitir eventos
      const io = getIO();
      const companyRoom = `company-${conversation.connection.companyId}`;
      
      io.to(companyRoom).emit('conversationTransferred', {
        conversation: updatedConversation,
        from: { id: fromUserId, name: conversation.user?.name },
        to: { id: toUserId, name: toUser.name },
        reason
      });

      // Notificar al agente anterior
      io.to(fromUserId).emit('conversationTransferredOut', {
        conversationId,
        message: `Has transferido la conversación con ${conversation.contact.name} a ${toUser.name}`
      });

      // Notificar al agente nuevo
      io.to(toUserId).emit('conversationTransferredIn', {
        conversation: updatedConversation,
        message: `Se te ha transferido una conversación con ${conversation.contact.name} desde ${conversation.user?.name}`
      });

      logger.info(`Conversación ${conversationId} transferida de ${fromUserId} a ${toUserId}`);

      return {
        conversationId,
        userId: toUserId,
        assignedAt: new Date(),
        assignedBy: fromUserId,
        status: 'active' as const,
        assignmentMethod: 'manual' as const,
        priority: 'medium' as const
      };
    } catch (error) {
      logger.error('Error transfiriendo conversación:', error);
      throw error;
    }
  }

  // Obtener conversaciones asignadas a un agente
  static async getAgentConversations(
    userId: string,
    companyId: string,
    filters: any = {}
  ) {
    try {
      const where: any = {
        userId,
        connection: { companyId }
      };

      if (filters.status === 'unread') {
        where.unreadCount = { gt: 0 };
      }

      const conversations = await prisma.conversation.findMany({
        where,
        include: {
          contact: { select: { id: true, name: true, number: true, avatar: true } },
          connection: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });

      return conversations;
    } catch (error) {
      logger.error('Error obteniendo conversaciones del agente:', error);
      return [];
    }
  }

  // Liberar conversación (marcar como completada)
  static async releaseConversation(conversationId: string, userId: string) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { contact: true, connection: true }
      });

      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      if (conversation.userId !== userId) {
        throw new Error('No tienes permisos para liberar esta conversación');
      }

      // Desasignar la conversación
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          userId: null,
          updatedAt: new Date()
        }
      });

      // Crear mensaje de sistema
      await prisma.message.create({
        data: {
          content: '[SISTEMA] Conversación liberada y disponible para reasignación',
          fromMe: true,
          status: 'sent',
          conversationId,
          contactId: conversation.contactId,
          connectionId: conversation.connectionId,
          userId
        }
      });

      // Emitir evento
      const io = getIO();
      const companyRoom = `company-${conversation.connection.companyId}`;
      
      io.to(companyRoom).emit('conversationReleased', {
        conversationId,
        message: `Conversación con ${conversation.contact.name} liberada`
      });

      logger.info(`Conversación ${conversationId} liberada por ${userId}`);

      return true;
    } catch (error) {
      logger.error('Error liberando conversación:', error);
      throw error;
    }
  }

  // Actualizar estado de agente
  static async updateAgentStatus(
    userId: string,
    status: 'available' | 'busy' | 'away',
    companyId: string
  ) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastSeen: new Date(),
          isOnline: status !== 'away'
        }
      });

      // Emitir evento de cambio de estado
      const io = getIO();
      const companyRoom = `company-${companyId}`;
      
      io.to(companyRoom).emit('agentStatusChanged', {
        userId,
        status,
        timestamp: new Date()
      });

      logger.info(`Estado del agente ${userId} actualizado a ${status}`);

      return true;
    } catch (error) {
      logger.error('Error actualizando estado del agente:', error);
      throw error;
    }
  }
}

export default ConversationAssignmentService; 