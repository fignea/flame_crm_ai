import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';
import { getIO } from './socketService';

export enum AgentStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  AWAY = 'away',
  OFFLINE = 'offline'
}

export interface AgentStatusData {
  userId: string;
  agentStatus: AgentStatus;
  statusMessage?: string;
  autoAwayEnabled: boolean;
  autoAwayTimeout: number;
  isOnline: boolean;
  lastSeen: Date;
  statusUpdatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: {
      id: string;
      name: string;
      displayName: string;
    };
  };
}

export interface AgentStatusUpdate {
  agentStatus?: AgentStatus;
  statusMessage?: string;
  autoAwayEnabled?: boolean;
  autoAwayTimeout?: number;
}

export interface AgentStatusHistory {
  id: string;
  userId: string;
  previousStatus: AgentStatus;
  newStatus: AgentStatus;
  statusMessage?: string;
  changeReason: string; // manual, auto_away, system, login, logout
  changedAt: Date;
}

export class AgentStatusService {
  private static autoAwayTimers: Map<string, NodeJS.Timeout> = new Map();

  // Cambiar estado de agente
  static async updateAgentStatus(
    userId: string,
    companyId: string,
    update: AgentStatusUpdate,
    changeReason: string = 'manual'
  ): Promise<AgentStatusData> {
    try {
      // Verificar que el usuario existe y pertenece a la empresa
      const user = await prisma.user.findFirst({
        where: { 
          id: userId, 
          companyId,
          role: { name: { in: ['agent', 'admin', 'manager'] } }
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Usuario no encontrado o no es agente');
      }

      // Registrar cambio en historial
      if (update.agentStatus && update.agentStatus !== user.agentStatus) {
        await this.recordStatusChange(
          userId,
          user.agentStatus as AgentStatus,
          update.agentStatus,
          update.statusMessage,
          changeReason
        );
      }

      // Actualizar estado del usuario
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...update,
          statusUpdatedAt: new Date(),
          lastSeen: new Date()
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        }
      });

      const agentStatusData: AgentStatusData = {
        userId: updatedUser.id,
        agentStatus: updatedUser.agentStatus as AgentStatus,
        statusMessage: updatedUser.statusMessage || undefined,
        autoAwayEnabled: updatedUser.autoAwayEnabled,
        autoAwayTimeout: updatedUser.autoAwayTimeout,
        isOnline: updatedUser.isOnline,
        lastSeen: updatedUser.lastSeen,
        statusUpdatedAt: updatedUser.statusUpdatedAt,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar || undefined,
          role: updatedUser.role || undefined
        }
      };

      // Configurar timer de auto-ausente si es necesario
      if (update.agentStatus === AgentStatus.AVAILABLE && updatedUser.autoAwayEnabled) {
        this.setupAutoAwayTimer(userId, companyId, updatedUser.autoAwayTimeout);
      } else {
        this.clearAutoAwayTimer(userId);
      }

      // Notificar cambio en tiempo real
      await this.notifyStatusChange(companyId, agentStatusData);

      logger.info(`Estado de agente actualizado: ${updatedUser.name} -> ${update.agentStatus}`);

      return agentStatusData;
    } catch (error) {
      logger.error('Error updating agent status:', error);
      throw error;
    }
  }

  // Obtener estado actual del agente
  static async getAgentStatus(userId: string, companyId: string): Promise<AgentStatusData> {
    try {
      const user = await prisma.user.findFirst({
        where: { 
          id: userId, 
          companyId,
          role: { name: { in: ['agent', 'admin', 'manager', 'super_admin'] } }
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Usuario no encontrado o no es agente');
      }

      return {
        userId: user.id,
        agentStatus: user.agentStatus as AgentStatus,
        statusMessage: user.statusMessage || undefined,
        autoAwayEnabled: user.autoAwayEnabled,
        autoAwayTimeout: user.autoAwayTimeout,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        statusUpdatedAt: user.statusUpdatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || undefined,
          role: user.role || undefined
        }
      };
    } catch (error) {
      logger.error('Error getting agent status:', error);
      throw error;
    }
  }

  // Obtener estados de todos los agentes de una empresa
  static async getCompanyAgentStatuses(companyId: string): Promise<AgentStatusData[]> {
    try {
      const users = await prisma.user.findMany({
        where: { 
          companyId,
          isActive: true,
          role: { name: { in: ['agent', 'admin', 'manager'] } }
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return users.map(user => ({
        userId: user.id,
        agentStatus: user.agentStatus as AgentStatus,
        statusMessage: user.statusMessage || undefined,
        autoAwayEnabled: user.autoAwayEnabled,
        autoAwayTimeout: user.autoAwayTimeout,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        statusUpdatedAt: user.statusUpdatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || undefined,
          role: user.role || undefined
        }
      }));
    } catch (error) {
      logger.error('Error getting company agent statuses:', error);
      throw error;
    }
  }

  // Configurar timer de auto-ausente
  static setupAutoAwayTimer(userId: string, companyId: string, timeoutMinutes: number): void {
    // Limpiar timer existente
    this.clearAutoAwayTimer(userId);

    // Crear nuevo timer
    const timer = setTimeout(async () => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (user && user.agentStatus === AgentStatus.AVAILABLE && user.autoAwayEnabled) {
          await this.updateAgentStatus(
            userId,
            companyId,
            { agentStatus: AgentStatus.AWAY },
            'auto_away'
          );
          logger.info(`Auto-away activado para usuario: ${user.name}`);
        }
      } catch (error) {
        logger.error('Error in auto-away timer:', error);
      }
    }, timeoutMinutes * 60 * 1000);

    this.autoAwayTimers.set(userId, timer);
  }

  // Limpiar timer de auto-ausente
  static clearAutoAwayTimer(userId: string): void {
    const timer = this.autoAwayTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.autoAwayTimers.delete(userId);
    }
  }

  // Marcar usuario como online/offline
  static async setUserOnlineStatus(userId: string, companyId: string, isOnline: boolean): Promise<void> {
    try {
      const user = await prisma.user.findFirst({
        where: { 
          id: userId, 
          companyId,
          role: { name: { in: ['agent', 'admin', 'manager'] } }
        }
      });

      if (!user) return;

      let statusUpdate: AgentStatusUpdate = {
        autoAwayEnabled: user.autoAwayEnabled,
        autoAwayTimeout: user.autoAwayTimeout
      };

      if (isOnline) {
        // Usuario se conectó
        if (user.agentStatus === AgentStatus.OFFLINE) {
          statusUpdate.agentStatus = AgentStatus.AVAILABLE;
        }
        // Configurar auto-away si está habilitado
        if (user.autoAwayEnabled && user.agentStatus === AgentStatus.AVAILABLE) {
          this.setupAutoAwayTimer(userId, companyId, user.autoAwayTimeout);
        }
      } else {
        // Usuario se desconectó
        statusUpdate.agentStatus = AgentStatus.OFFLINE;
        this.clearAutoAwayTimer(userId);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnline,
          lastSeen: new Date(),
          ...(statusUpdate.agentStatus && { 
            agentStatus: statusUpdate.agentStatus,
            statusUpdatedAt: new Date()
          })
        }
      });

      // Notificar cambio si cambió el estado
      if (statusUpdate.agentStatus) {
        const agentStatus = await this.getAgentStatus(userId, companyId);
        await this.notifyStatusChange(companyId, agentStatus);
      }

      logger.info(`Usuario ${user.name} marcado como ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      logger.error('Error setting user online status:', error);
    }
  }

  // Registrar cambio en historial
  static async recordStatusChange(
    userId: string,
    previousStatus: AgentStatus,
    newStatus: AgentStatus,
    statusMessage?: string,
    changeReason: string = 'manual'
  ): Promise<void> {
    try {
      // Crear tabla de historial si no existe (esto se podría hacer en una migración)
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS agent_status_history (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL,
          previous_status VARCHAR NOT NULL,
          new_status VARCHAR NOT NULL,
          status_message TEXT,
          change_reason VARCHAR NOT NULL,
          changed_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;

      // Insertar registro en historial
      await prisma.$executeRaw`
        INSERT INTO agent_status_history (user_id, previous_status, new_status, status_message, change_reason)
        VALUES (${userId}, ${previousStatus}, ${newStatus}, ${statusMessage || null}, ${changeReason});
      `;
    } catch (error) {
      logger.error('Error recording status change:', error);
      // No lanzar error para no afectar la funcionalidad principal
    }
  }

  // Obtener historial de cambios de estado
  static async getStatusHistory(userId: string, companyId: string, limit: number = 50): Promise<AgentStatusHistory[]> {
    try {
      const history = await prisma.$queryRaw<AgentStatusHistory[]>`
        SELECT 
          h.id,
          h.user_id as "userId",
          h.previous_status as "previousStatus",
          h.new_status as "newStatus",
          h.status_message as "statusMessage",
          h.change_reason as "changeReason",
          h.changed_at as "changedAt"
        FROM agent_status_history h
        INNER JOIN users u ON h.user_id = u.id
        WHERE u.id = ${userId} AND u.company_id = ${companyId}
        ORDER BY h.changed_at DESC
        LIMIT ${limit};
      `;

      return history;
    } catch (error) {
      logger.error('Error getting status history:', error);
      return [];
    }
  }

  // Notificar cambio de estado en tiempo real
  static async notifyStatusChange(companyId: string, agentStatus: AgentStatusData): Promise<void> {
    try {
      const io = getIO();
      io.to(`company-${companyId}`).emit('agentStatusChanged', {
        userId: agentStatus.userId,
        agentStatus: agentStatus.agentStatus,
        statusMessage: agentStatus.statusMessage,
        isOnline: agentStatus.isOnline,
        user: agentStatus.user,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error notifying status change:', error);
    }
  }

  // Resetear activity timer cuando el usuario realiza una acción
  static async resetActivityTimer(userId: string, companyId: string): Promise<void> {
    try {
      const user = await prisma.user.findFirst({
        where: { 
          id: userId, 
          companyId,
          role: { name: { in: ['agent', 'admin', 'manager'] } }
        }
      });

      if (!user) return;

      // Actualizar lastSeen
      await prisma.user.update({
        where: { id: userId },
        data: { lastSeen: new Date() }
      });

      // Si el usuario está ausente por inactividad, volver a disponible
      if (user.agentStatus === AgentStatus.AWAY && user.autoAwayEnabled) {
        await this.updateAgentStatus(
          userId,
          companyId,
          { agentStatus: AgentStatus.AVAILABLE },
          'activity_detected'
        );
      }

      // Reiniciar timer de auto-ausente
      if (user.agentStatus === AgentStatus.AVAILABLE && user.autoAwayEnabled) {
        this.setupAutoAwayTimer(userId, companyId, user.autoAwayTimeout);
      }
    } catch (error) {
      logger.error('Error resetting activity timer:', error);
    }
  }

  // Obtener agentes disponibles para asignación
  static async getAvailableAgents(companyId: string): Promise<AgentStatusData[]> {
    try {
      const agents = await this.getCompanyAgentStatuses(companyId);
      return agents.filter(agent => 
        agent.agentStatus === AgentStatus.AVAILABLE && 
        agent.isOnline
      );
    } catch (error) {
      logger.error('Error getting available agents:', error);
      return [];
    }
  }

  // Obtener estadísticas de estados de agentes
  static async getAgentStatusStats(companyId: string): Promise<{
    total: number;
    available: number;
    busy: number;
    away: number;
    offline: number;
    online: number;
  }> {
    try {
      const agents = await this.getCompanyAgentStatuses(companyId);
      
      const stats = {
        total: agents.length,
        available: agents.filter(a => a.agentStatus === AgentStatus.AVAILABLE).length,
        busy: agents.filter(a => a.agentStatus === AgentStatus.BUSY).length,
        away: agents.filter(a => a.agentStatus === AgentStatus.AWAY).length,
        offline: agents.filter(a => a.agentStatus === AgentStatus.OFFLINE).length,
        online: agents.filter(a => a.isOnline).length
      };

      return stats;
    } catch (error) {
      logger.error('Error getting agent status stats:', error);
      return {
        total: 0,
        available: 0,
        busy: 0,
        away: 0,
        offline: 0,
        online: 0
      };
    }
  }

  // Limpiar todos los timers (útil para shutdown)
  static clearAllTimers(): void {
    this.autoAwayTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.autoAwayTimers.clear();
  }
}

export default AgentStatusService; 