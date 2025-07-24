import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';
import { getIO } from './socketService';
import { normalizeNumber } from '../utils/phoneUtils';

export interface WhatsAppWebhookEvent {
  type: 'message' | 'status' | 'notification' | 'presence' | 'call' | 'business_info';
  connectionId: string;
  timestamp: number;
  data: any;
}

export interface MessageWebhookData {
  id: string;
  from: string;
  to: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'sticker';
  content: string;
  mediaUrl?: string;
  caption?: string;
  timestamp: number;
  context?: {
    quoted: boolean;
    quotedMessage?: string;
  };
}

export interface StatusWebhookData {
  id: string;
  recipient: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: number;
  error?: {
    code: number;
    message: string;
    details: string;
  };
}

export interface PresenceWebhookData {
  from: string;
  presence: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused';
  timestamp: number;
}

export interface CallWebhookData {
  from: string;
  to: string;
  callType: 'voice' | 'video';
  status: 'ringing' | 'answered' | 'ended' | 'missed' | 'rejected';
  timestamp: number;
  duration?: number;
}

export class WhatsAppWebhookService {
  // Procesar webhook entrante
  static async processWebhook(event: WhatsAppWebhookEvent): Promise<void> {
    try {
      logger.info(`Processing webhook: ${event.type} for connection ${event.connectionId}`);
      
      switch (event.type) {
        case 'message':
          await this.processMessageWebhook(event.connectionId, event.data);
          break;
        case 'status':
          await this.processStatusWebhook(event.connectionId, event.data);
          break;
        case 'notification':
          await this.processNotificationWebhook(event.connectionId, event.data);
          break;
        case 'presence':
          await this.processPresenceWebhook(event.connectionId, event.data);
          break;
        case 'call':
          await this.processCallWebhook(event.connectionId, event.data);
          break;
        case 'business_info':
          await this.processBusinessInfoWebhook(event.connectionId, event.data);
          break;
        default:
          logger.warn(`Unknown webhook type: ${event.type}`);
      }
    } catch (error) {
      logger.error(`Error processing webhook ${event.type}:`, error);
      throw error;
    }
  }

  // Procesar webhook de mensaje
  static async processMessageWebhook(connectionId: string, data: MessageWebhookData): Promise<void> {
    try {
      const connection = await prisma.connection.findUnique({
        where: { id: connectionId },
        include: { company: true }
      });

      if (!connection) {
        logger.error(`Connection ${connectionId} not found`);
        return;
      }

      const normalizedNumber = normalizeNumber(data.from);
      
      // Buscar o crear contacto
      let contact = await prisma.contact.findFirst({
        where: { number: normalizedNumber, companyId: connection.companyId }
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            name: normalizedNumber,
            number: normalizedNumber,
            companyId: connection.companyId
          }
        });
      }

      // Buscar o crear conversación
      let conversation = await prisma.conversation.findFirst({
        where: { contactId: contact.id, connectionId: connection.id }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            contactId: contact.id,
            connectionId: connection.id,
            unreadCount: 0
          }
        });
      }

      // Crear mensaje
      const message = await prisma.message.create({
        data: {
          id: data.id,
          content: data.content,
          fromMe: false,
          status: 'received',
          mediaType: data.type,
          mediaUrl: data.mediaUrl,
          timestamp: new Date(data.timestamp * 1000),
          conversationId: conversation.id,
          contactId: contact.id,
          connectionId: connection.id
        },
        include: {
          contact: true,
          connection: true
        }
      });

      // Incrementar contador de mensajes no leídos
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          unreadCount: { increment: 1 },
          updatedAt: new Date()
        }
      });

      // Emitir evento en tiempo real
      const io = getIO();
      const companyRoom = `company-${connection.companyId}`;
      io.to(companyRoom).emit('newMessage', message);

      logger.info(`Message webhook processed for ${normalizedNumber}`);
    } catch (error) {
      logger.error('Error processing message webhook:', error);
      throw error;
    }
  }

  // Procesar webhook de estado
  static async processStatusWebhook(connectionId: string, data: StatusWebhookData): Promise<void> {
    try {
      const message = await prisma.message.findUnique({
        where: { id: data.id },
        include: { conversation: true }
      });

      if (!message) {
        logger.warn(`Message ${data.id} not found for status update`);
        return;
      }

      // Actualizar estado del mensaje
      await prisma.message.update({
        where: { id: data.id },
        data: {
          status: data.status,
          ...(data.status === 'sent' && { sentAt: new Date() }),
          ...(data.status === 'delivered' && { deliveredAt: new Date() }),
          ...(data.status === 'read' && { readAt: new Date() }),
          ...(data.status === 'failed' && { failedAt: new Date() })
        },
        include: {
          contact: true,
          connection: true
        }
      });

      // Emitir actualización de estado
      const io = getIO();
      const companyRoom = `company-${message.conversation.connectionId}`;
      io.to(companyRoom).emit('messageStatusUpdate', {
        messageId: data.id,
        status: data.status,
        timestamp: new Date(data.timestamp * 1000)
      });

      logger.info(`Status webhook processed for message ${data.id}: ${data.status}`);
    } catch (error) {
      logger.error('Error processing status webhook:', error);
      throw error;
    }
  }

  // Procesar webhook de notificación
  static async processNotificationWebhook(connectionId: string, data: any): Promise<void> {
    try {
      const connection = await prisma.connection.findUnique({
        where: { id: connectionId },
        include: { company: true }
      });

      if (!connection) {
        logger.error(`Connection ${connectionId} not found`);
        return;
      }

      // Procesar diferentes tipos de notificaciones
      switch (data.type) {
        case 'account_update':
          await this.processAccountUpdate(connection, data);
          break;
        case 'phone_number_update':
          await this.processPhoneNumberUpdate(connection, data);
          break;
        case 'business_profile_update':
          await this.processBusinessProfileUpdate(connection, data);
          break;
        case 'template_update':
          await this.processTemplateUpdate(connection, data);
          break;
        default:
          logger.info(`Notification webhook: ${data.type}`, data);
      }
    } catch (error) {
      logger.error('Error processing notification webhook:', error);
      throw error;
    }
  }

  // Procesar webhook de presencia
  static async processPresenceWebhook(connectionId: string, data: PresenceWebhookData): Promise<void> {
    try {
      const connection = await prisma.connection.findUnique({
        where: { id: connectionId },
        include: { company: true }
      });

      if (!connection) {
        logger.error(`Connection ${connectionId} not found`);
        return;
      }

      const normalizedNumber = normalizeNumber(data.from);
      
      // Buscar contacto
      const contact = await prisma.contact.findFirst({
        where: { number: normalizedNumber, companyId: connection.companyId }
      });

      if (!contact) {
        logger.warn(`Contact ${normalizedNumber} not found for presence update`);
        return;
      }

      // Emitir evento de presencia
      const io = getIO();
      const companyRoom = `company-${connection.companyId}`;
      io.to(companyRoom).emit('presenceUpdate', {
        contactId: contact.id,
        presence: data.presence,
        timestamp: new Date(data.timestamp * 1000)
      });

      logger.info(`Presence webhook processed for ${normalizedNumber}: ${data.presence}`);
    } catch (error) {
      logger.error('Error processing presence webhook:', error);
      throw error;
    }
  }

  // Procesar webhook de llamada
  static async processCallWebhook(connectionId: string, data: CallWebhookData): Promise<void> {
    try {
      const connection = await prisma.connection.findUnique({
        where: { id: connectionId },
        include: { company: true }
      });

      if (!connection) {
        logger.error(`Connection ${connectionId} not found`);
        return;
      }

      const normalizedNumber = normalizeNumber(data.from);
      
      // Buscar contacto
      const contact = await prisma.contact.findFirst({
        where: { number: normalizedNumber, companyId: connection.companyId }
      });

      if (!contact) {
        logger.warn(`Contact ${normalizedNumber} not found for call event`);
        return;
      }

      // Crear registro de llamada (si existe tabla para ello)
      // Por ahora, solo emitir evento
      const io = getIO();
      const companyRoom = `company-${connection.companyId}`;
      io.to(companyRoom).emit('callEvent', {
        contactId: contact.id,
        callType: data.callType,
        status: data.status,
        duration: data.duration,
        timestamp: new Date(data.timestamp * 1000)
      });

      logger.info(`Call webhook processed for ${normalizedNumber}: ${data.status}`);
    } catch (error) {
      logger.error('Error processing call webhook:', error);
      throw error;
    }
  }

  // Procesar webhook de información de negocio
  static async processBusinessInfoWebhook(connectionId: string, data: any): Promise<void> {
    try {
      const connection = await prisma.connection.findUnique({
        where: { id: connectionId }
      });

      if (!connection) {
        logger.error(`Connection ${connectionId} not found`);
        return;
      }

      // Actualizar información de negocio en la conexión
      await prisma.connection.update({
        where: { id: connectionId },
        data: {
          settings: {
            ...(connection.settings as any || {}),
            businessInfo: data
          }
        }
      });

      logger.info(`Business info webhook processed for connection ${connectionId}`);
    } catch (error) {
      logger.error('Error processing business info webhook:', error);
      throw error;
    }
  }

  // Procesar actualización de cuenta
  private static async processAccountUpdate(connection: any, data: any): Promise<void> {
    try {
      // Actualizar información de la cuenta
      await prisma.connection.update({
        where: { id: connection.id },
        data: {
          settings: {
            ...(connection.settings as any || {}),
            accountInfo: data
          }
        }
      });

      logger.info(`Account update processed for connection ${connection.id}`);
    } catch (error) {
      logger.error('Error processing account update:', error);
      throw error;
    }
  }

  // Procesar actualización de número de teléfono
  private static async processPhoneNumberUpdate(connection: any, data: any): Promise<void> {
    try {
      // Actualizar número de teléfono
      await prisma.connection.update({
        where: { id: connection.id },
        data: {
          settings: {
            ...(connection.settings as any || {}),
            phoneNumber: data.phoneNumber
          }
        }
      });

      logger.info(`Phone number update processed for connection ${connection.id}`);
    } catch (error) {
      logger.error('Error processing phone number update:', error);
      throw error;
    }
  }

  // Procesar actualización de perfil de negocio
  private static async processBusinessProfileUpdate(connection: any, data: any): Promise<void> {
    try {
      // Actualizar perfil de negocio
      await prisma.connection.update({
        where: { id: connection.id },
        data: {
          settings: {
            ...(connection.settings as any || {}),
            businessProfile: data
          }
        }
      });

      logger.info(`Business profile update processed for connection ${connection.id}`);
    } catch (error) {
      logger.error('Error processing business profile update:', error);
      throw error;
    }
  }

  // Procesar actualización de plantilla
  private static async processTemplateUpdate(connection: any, data: any): Promise<void> {
    try {
      // Actualizar plantillas
      await prisma.connection.update({
        where: { id: connection.id },
        data: {
          settings: {
            ...(connection.settings as any || {}),
            templates: data
          }
        }
      });

      logger.info(`Template update processed for connection ${connection.id}`);
    } catch (error) {
      logger.error('Error processing template update:', error);
      throw error;
    }
  }

  // Registrar webhook endpoint
  static async registerWebhook(connectionId: string, webhookUrl: string): Promise<void> {
    try {
      const connection = await prisma.connection.findUnique({
        where: { id: connectionId }
      });

      if (!connection) {
        throw new Error(`Connection ${connectionId} not found`);
      }

      // Actualizar URL del webhook
      await prisma.connection.update({
        where: { id: connectionId },
        data: {
          webhookUrl,
          webhookByEvents: true
        }
      });

      logger.info(`Webhook registered for connection ${connectionId}: ${webhookUrl}`);
    } catch (error) {
      logger.error('Error registering webhook:', error);
      throw error;
    }
  }

  // Desregistrar webhook endpoint
  static async unregisterWebhook(connectionId: string): Promise<void> {
    try {
      await prisma.connection.update({
        where: { id: connectionId },
        data: {
          webhookUrl: null,
          webhookByEvents: false
        }
      });

      logger.info(`Webhook unregistered for connection ${connectionId}`);
    } catch (error) {
      logger.error('Error unregistering webhook:', error);
      throw error;
    }
  }

  // Validar webhook signature
  static validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return signature === `sha256=${expectedSignature}`;
    } catch (error) {
      logger.error('Error validating webhook signature:', error);
      return false;
    }
  }
} 