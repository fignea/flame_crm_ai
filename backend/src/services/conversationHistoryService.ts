import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export interface ConversationHistoryFilters {
  dateFrom?: string;
  dateTo?: string;
  contactId?: string;
  connectionId?: string;
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
  contentSearch?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  fromMe?: boolean;
  hasMedia?: boolean;
  tags?: string[];
  minMessages?: number;
  maxMessages?: number;
  archived?: boolean;
}

export interface ConversationHistoryStats {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  messagesByType: Record<string, number>;
  messagesByStatus: Record<string, number>;
  conversationsByConnection: Record<string, number>;
  dailyMessageCounts: Array<{ date: string; count: number }>;
  topContacts: Array<{ contactId: string; name: string; messageCount: number }>;
  responseTimeStats: {
    averageResponseTime: number;
    medianResponseTime: number;
    responseTimeDistribution: Record<string, number>;
  };
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'excel';
  includeMedia?: boolean;
  includeMetadata?: boolean;
  includeStats?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  maxRecords?: number;
}

export class ConversationHistoryService {
  // Obtener historial completo con filtros avanzados
  static async getConversationHistory(
    companyId: string,
    filters: ConversationHistoryFilters,
    page: number = 1,
    limit: number = 50
  ) {
    try {
      const skip = (page - 1) * limit;
      
      // Construir filtros WHERE
      const whereConditions: any = {
        connection: {
          companyId: companyId
        }
      };

      if (filters.archived !== undefined) {
        whereConditions.archived = filters.archived;
      }

      if (filters.dateFrom || filters.dateTo) {
        whereConditions.createdAt = {};
        if (filters.dateFrom) whereConditions.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) whereConditions.createdAt.lte = new Date(filters.dateTo);
      }

      if (filters.contactId) {
        whereConditions.contactId = filters.contactId;
      }

      if (filters.connectionId) {
        whereConditions.connectionId = filters.connectionId;
      }

      if (filters.contentSearch) {
        whereConditions.messages = {
          some: {
            content: {
              contains: filters.contentSearch,
              mode: 'insensitive'
            }
          }
        };
      }

      if (filters.hasMedia) {
        whereConditions.messages = {
          some: {
            mediaType: {
              not: 'text'
            }
          }
        };
      }

      if (filters.minMessages || filters.maxMessages) {
        const messageCountFilter: any = {};
        if (filters.minMessages) messageCountFilter.gte = filters.minMessages;
        if (filters.maxMessages) messageCountFilter.lte = filters.maxMessages;
        
        whereConditions.messages = {
          ...whereConditions.messages,
          some: {},
          count: messageCountFilter
        };
      }

      const conversations = await prisma.conversation.findMany({
        where: whereConditions,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              number: true,
              email: true,
              avatar: true,
              companyName: true,
              tags: true
            }
          },
          connection: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          messages: {
            where: this.buildMessageFilters(filters),
            orderBy: {
              timestamp: 'desc'
            },
            take: 100, // Limitar mensajes por conversación
            include: {
              contact: {
                select: {
                  id: true,
                  name: true,
                  number: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: limit
      });

      const total = await prisma.conversation.count({
        where: whereConditions
      });

      return {
        conversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting conversation history:', error);
      throw new Error('Error al obtener el historial de conversaciones');
    }
  }

  // Construir filtros para mensajes
  private static buildMessageFilters(filters: ConversationHistoryFilters): any {
    const messageFilters: any = {};

    if (filters.messageType) {
      messageFilters.mediaType = filters.messageType;
    }

    if (filters.status) {
      messageFilters.status = filters.status;
    }

    if (filters.fromMe !== undefined) {
      messageFilters.fromMe = filters.fromMe;
    }

    if (filters.dateFrom || filters.dateTo) {
      messageFilters.timestamp = {};
      if (filters.dateFrom) messageFilters.timestamp.gte = new Date(filters.dateFrom);
      if (filters.dateTo) messageFilters.timestamp.lte = new Date(filters.dateTo);
    }

    return messageFilters;
  }

  // Obtener estadísticas del historial
  static async getHistoryStatistics(
    companyId: string,
    filters: ConversationHistoryFilters
  ): Promise<ConversationHistoryStats> {
    try {
      const whereConditions: any = {
        connection: {
          companyId: companyId
        }
      };

      if (filters.dateFrom || filters.dateTo) {
        whereConditions.createdAt = {};
        if (filters.dateFrom) whereConditions.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) whereConditions.createdAt.lte = new Date(filters.dateTo);
      }

      // Estadísticas básicas
      const totalConversations = await prisma.conversation.count({
        where: whereConditions
      });

      const totalMessages = await prisma.message.count({
        where: {
          conversation: whereConditions
        }
      });

      // Mensajes por tipo
      const messagesByType = await prisma.message.groupBy({
        by: ['mediaType'],
        where: {
          conversation: whereConditions
        },
        _count: {
          _all: true
        }
      });

      // Mensajes por estado
      const messagesByStatus = await prisma.message.groupBy({
        by: ['status'],
        where: {
          conversation: whereConditions
        },
        _count: {
          _all: true
        }
      });

      // Conversaciones por conexión
      const conversationsByConnection = await prisma.conversation.groupBy({
        by: ['connectionId'],
        where: whereConditions,
        _count: {
          _all: true
        }
      });

      // Conteo diario de mensajes (últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyMessageCounts = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM messages m
        INNER JOIN conversations c ON m.conversation_id = c.id
        INNER JOIN connections conn ON c.connection_id = conn.id
        WHERE conn.company_id = ${companyId}
        AND m.timestamp >= ${thirtyDaysAgo}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 30
      `;

      // Top contactos por número de mensajes
      const topContacts = await prisma.$queryRaw<Array<{ contactId: string; name: string; messageCount: number }>>`
        SELECT 
          c.id as "contactId",
          c.name,
          COUNT(m.id) as "messageCount"
        FROM contacts c
        INNER JOIN conversations conv ON c.id = conv.contact_id
        INNER JOIN messages m ON conv.id = m.conversation_id
        INNER JOIN connections conn ON conv.connection_id = conn.id
        WHERE conn.company_id = ${companyId}
        GROUP BY c.id, c.name
        ORDER BY "messageCount" DESC
        LIMIT 10
      `;

      // Estadísticas de tiempo de respuesta
      const responseTimeStats = await this.calculateResponseTimeStats(companyId, filters);

      return {
        totalConversations,
        totalMessages,
        averageMessagesPerConversation: totalMessages / totalConversations,
        messagesByType: messagesByType.reduce((acc, item) => {
          acc[item.mediaType || 'text'] = item._count._all;
          return acc;
        }, {} as Record<string, number>),
        messagesByStatus: messagesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count._all;
          return acc;
        }, {} as Record<string, number>),
        conversationsByConnection: conversationsByConnection.reduce((acc, item) => {
          acc[item.connectionId] = item._count._all;
          return acc;
        }, {} as Record<string, number>),
        dailyMessageCounts,
        topContacts,
        responseTimeStats
      };
    } catch (error) {
      logger.error('Error getting history statistics:', error);
      throw new Error('Error al obtener estadísticas del historial');
    }
  }

  // Calcular estadísticas de tiempo de respuesta
  private static async calculateResponseTimeStats(
    companyId: string,
    filters: ConversationHistoryFilters
  ): Promise<{
    averageResponseTime: number;
    medianResponseTime: number;
    responseTimeDistribution: Record<string, number>;
  }> {
    try {
      // Obtener conversaciones con mensajes ordenados por tiempo
      const conversations = await prisma.conversation.findMany({
        where: {
          connection: {
            companyId: companyId
          }
        },
        include: {
          messages: {
            orderBy: {
              timestamp: 'asc'
            },
            select: {
              id: true,
              fromMe: true,
              timestamp: true
            }
          }
        }
      });

      const responseTimes: number[] = [];

      conversations.forEach(conversation => {
        const messages = conversation.messages;
        for (let i = 0; i < messages.length - 1; i++) {
          const currentMessage = messages[i];
          const nextMessage = messages[i + 1];

          // Si el mensaje actual es del cliente y el siguiente es del agente
          if (currentMessage && nextMessage && !currentMessage.fromMe && nextMessage.fromMe) {
            const responseTime = new Date(nextMessage.timestamp).getTime() - new Date(currentMessage.timestamp).getTime();
            responseTimes.push(responseTime / 1000 / 60); // En minutos
          }
        }
      });

      if (responseTimes.length === 0) {
        return {
          averageResponseTime: 0,
          medianResponseTime: 0,
          responseTimeDistribution: {}
        };
      }

      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const medianResponseTime = sortedTimes[Math.floor(sortedTimes.length / 2)] || 0;

      // Distribución de tiempos de respuesta
      const responseTimeDistribution = {
        'immediate': responseTimes.filter(time => time <= 5).length,
        'fast': responseTimes.filter(time => time > 5 && time <= 30).length,
        'normal': responseTimes.filter(time => time > 30 && time <= 60).length,
        'slow': responseTimes.filter(time => time > 60 && time <= 240).length,
        'very_slow': responseTimes.filter(time => time > 240).length
      };

      return {
        averageResponseTime,
        medianResponseTime,
        responseTimeDistribution
      };
    } catch (error) {
      logger.error('Error calculating response time stats:', error);
      return {
        averageResponseTime: 0,
        medianResponseTime: 0,
        responseTimeDistribution: {}
      };
    }
  }

  // Exportar historial de conversaciones
  static async exportConversationHistory(
    companyId: string,
    filters: ConversationHistoryFilters,
    options: ExportOptions
  ) {
    try {
      const { conversations } = await this.getConversationHistory(
        companyId,
        filters,
        1,
        options.maxRecords || 10000
      );

      const exportData = {
        exportedAt: new Date().toISOString(),
        companyId,
        filters,
        options,
        conversations: conversations.map(conv => ({
          id: conv.id,
          contact: conv.contact,
          connection: conv.connection,
          user: conv.user,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          messageCount: conv._count?.messages || 0,
          messages: conv.messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            fromMe: msg.fromMe,
            status: msg.status,
            mediaType: msg.mediaType,
            mediaUrl: options.includeMedia ? msg.mediaUrl : undefined,
            timestamp: msg.timestamp,
            locationLatitude: msg.locationLatitude,
            locationLongitude: msg.locationLongitude,
            locationAddress: msg.locationAddress,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            fileMimeType: msg.fileMimeType,
            metadata: options.includeMetadata ? msg.metadata : undefined,
            sentAt: msg.sentAt,
            deliveredAt: msg.deliveredAt,
            readAt: msg.readAt,
            failedAt: msg.failedAt,
            contact: msg.contact
          }))
        }))
      };

      // Añadir estadísticas si se solicita
      if (options.includeStats) {
        const stats = await this.getHistoryStatistics(companyId, filters);
        (exportData as any).statistics = stats;
      }

      // Generar archivo según formato
      const exportId = `history_export_${Date.now()}`;
      const exportPath = path.join(process.cwd(), 'exports', `${exportId}.${options.format}`);

      // Crear directorio de exportaciones si no existe
      const exportDir = path.dirname(exportPath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      switch (options.format) {
        case 'json':
          fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
          break;
        case 'csv':
          const csvData = this.convertToCSV(exportData);
          fs.writeFileSync(exportPath, csvData);
          break;
        default:
          throw new Error(`Formato de exportación no soportado: ${options.format}`);
      }

      return {
        exportId,
        exportPath,
        recordCount: conversations.length,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error exporting conversation history:', error);
      throw new Error('Error al exportar historial de conversaciones');
    }
  }

  // Convertir datos a CSV
  private static convertToCSV(data: any): string {
    const headers = [
      'Conversation ID',
      'Contact Name',
      'Contact Number',
      'Connection',
      'Message ID',
      'Message Content',
      'From Me',
      'Status',
      'Media Type',
      'Timestamp',
      'Created At'
    ];

    const rows = [];
    rows.push(headers.join(','));

    data.conversations.forEach((conv: any) => {
      conv.messages.forEach((msg: any) => {
        const row = [
          conv.id,
          conv.contact.name,
          conv.contact.number,
          conv.connection.name,
          msg.id,
          `"${msg.content.replace(/"/g, '""')}"`,
          msg.fromMe,
          msg.status,
          msg.mediaType,
          msg.timestamp,
          conv.createdAt
        ];
        rows.push(row.join(','));
      });
    });

    return rows.join('\n');
  }

  // Archivar conversación
  static async archiveConversation(conversationId: string, companyId: string) {
    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          connection: {
            companyId: companyId
          }
        }
      });

      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      const updatedConversation = await prisma.conversation.update({
        where: {
          id: conversationId
        },
        data: {
          archived: true,
          archivedAt: new Date()
        }
      });

      return updatedConversation;
    } catch (error) {
      logger.error('Error archiving conversation:', error);
      throw new Error('Error al archivar conversación');
    }
  }

  // Desarchivar conversación
  static async unarchiveConversation(conversationId: string, companyId: string) {
    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          connection: {
            companyId: companyId
          }
        }
      });

      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      const updatedConversation = await prisma.conversation.update({
        where: {
          id: conversationId
        },
        data: {
          archived: false,
          archivedAt: null
        }
      });

      return updatedConversation;
    } catch (error) {
      logger.error('Error unarchiving conversation:', error);
      throw new Error('Error al desarchivar conversación');
    }
  }

  // Búsqueda avanzada en mensajes
  static async searchMessages(
    companyId: string,
    searchTerm: string,
    filters: ConversationHistoryFilters,
    page: number = 1,
    limit: number = 50
  ) {
    try {
      const skip = (page - 1) * limit;

      const whereConditions: any = {
        conversation: {
          connection: {
            companyId: companyId
          }
        },
        content: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      };

      // Aplicar filtros adicionales
      if (filters.messageType) {
        whereConditions.mediaType = filters.messageType;
      }

      if (filters.fromMe !== undefined) {
        whereConditions.fromMe = filters.fromMe;
      }

      if (filters.dateFrom || filters.dateTo) {
        whereConditions.timestamp = {};
        if (filters.dateFrom) whereConditions.timestamp.gte = new Date(filters.dateFrom);
        if (filters.dateTo) whereConditions.timestamp.lte = new Date(filters.dateTo);
      }

      const messages = await prisma.message.findMany({
        where: whereConditions,
        include: {
          conversation: {
            include: {
              contact: {
                select: {
                  id: true,
                  name: true,
                  number: true
                }
              },
              connection: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip,
        take: limit
      });

      const total = await prisma.message.count({
        where: whereConditions
      });

      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching messages:', error);
      throw new Error('Error al buscar mensajes');
    }
  }

  // Limpiar historial antiguo
  static async cleanupOldHistory(companyId: string, daysToKeep: number = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedMessages = await prisma.message.deleteMany({
        where: {
          conversation: {
            connection: {
              companyId: companyId
            }
          },
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      // Eliminar conversaciones sin mensajes
      const deletedConversations = await prisma.conversation.deleteMany({
        where: {
          connection: {
            companyId: companyId
          },
          messages: {
            none: {}
          }
        }
      });

      return {
        deletedMessages: deletedMessages.count,
        deletedConversations: deletedConversations.count
      };
    } catch (error) {
      logger.error('Error cleaning up old history:', error);
      throw new Error('Error al limpiar historial antiguo');
    }
  }
}

export default ConversationHistoryService; 