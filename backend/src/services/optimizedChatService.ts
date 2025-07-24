import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';

export class OptimizedChatService {
  static async getMessages(conversationId: string, page: number = 1, limit: number = 50) {
    try {
      const messages = await prisma.message.findMany({
        where: {
          conversationId
        },
        include: {
          user: true,
          conversation: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      });

      return {
        messages: messages.reverse(),
        hasMore: messages.length === limit,
        page,
        totalPages: Math.ceil(messages.length / limit)
      };
    } catch (error) {
      logger.error('Error getting messages:', error);
      throw error;
    }
  }

  static async getConversations(userId: string, page: number = 1, limit: number = 20) {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          userId
        },
        include: {
          contact: true,
          connection: true,
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      });

      return {
        conversations,
        hasMore: conversations.length === limit,
        page,
        totalPages: Math.ceil(conversations.length / limit)
      };
    } catch (error) {
      logger.error('Error getting conversations:', error);
      throw error;
    }
  }

  static async createMessage(data: {
    conversationId: string;
    content: string;
    fromMe: boolean;
    mediaType?: string;
    mediaUrl?: string;
    locationLatitude?: number;
    locationLongitude?: number;
    locationAddress?: string;
    fileName?: string;
    fileSize?: number;
    fileMimeType?: string;
    metadata?: any;
    userId?: string;
  }) {
    try {
      // Obtener información de la conversación
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: { contact: true, connection: true }
      });
      
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      const message = await prisma.message.create({
        data: {
          content: data.content,
          fromMe: data.fromMe,
          mediaType: data.mediaType || 'text',
          mediaUrl: data.mediaUrl,
          locationLatitude: data.locationLatitude,
          locationLongitude: data.locationLongitude,
          locationAddress: data.locationAddress,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileMimeType: data.fileMimeType,
          metadata: data.metadata,
          conversationId: data.conversationId,
          userId: data.userId,
          contactId: conversation.contactId,
          connectionId: conversation.connectionId,
          sentAt: new Date(),
        },
        include: {
          user: true,
          conversation: true,
          contact: true,
          connection: true
        }
      });

      return message;
    } catch (error) {
      logger.error('Error creating message:', error);
      throw error;
    }
  }
} 