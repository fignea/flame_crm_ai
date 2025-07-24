import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';
import { getIO } from './socketService';
import webPush from 'web-push';

export interface NotificationPayload {
  id: string;
  type: 'message' | 'ticket' | 'assignment' | 'system' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  userId: string;
  companyId: string;
  entityId?: string; // ID de la entidad relacionada (conversación, ticket, etc.)
  entityType?: string; // Tipo de entidad (conversation, ticket, etc.)
  priority: 'low' | 'medium' | 'high' | 'urgent';
  persistent?: boolean; // Si la notificación debe persistir
  actionUrl?: string; // URL a la que redirigir al hacer clic
  data?: any; // Datos adicionales
  createdAt: Date;
  read: boolean;
  channels: NotificationChannel[];
}

export type NotificationChannel = 'websocket' | 'push' | 'email' | 'sms' | 'desktop';

export interface NotificationPreferences {
  userId: string;
  channels: {
    websocket: boolean;
    push: boolean;
    email: boolean;
    sms: boolean;
    desktop: boolean;
  };
  types: {
    message: boolean;
    ticket: boolean;
    assignment: boolean;
    system: boolean;
    warning: boolean;
    success: boolean;
    error: boolean;
  };
  priority: {
    low: boolean;
    medium: boolean;
    high: boolean;
    urgent: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  groupNotifications: boolean;
}

export interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  createdAt: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: Map<string, NotificationPayload[]> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private pushSubscriptions: Map<string, PushSubscription[]> = new Map();

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Configurar web push
  static configureWebPush() {
    webPush.setVapidDetails(
      'mailto:support@flameai.com',
      process.env['VAPID_PUBLIC_KEY'] || '',
      process.env['VAPID_PRIVATE_KEY'] || ''
    );
  }

  // Enviar notificación
  async sendNotification(notification: Omit<NotificationPayload, 'id' | 'createdAt' | 'read'>): Promise<void> {
    try {
      const notificationWithId: NotificationPayload = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        read: false
      };

      // Obtener preferencias del usuario
      const preferences = await this.getUserPreferences(notification.userId);
      
      // Verificar si el usuario acepta este tipo de notificación
      if (!this.shouldSendNotification(notificationWithId, preferences)) {
        return;
      }

      // Guardar notificación en base de datos si es persistente
      if (notification.persistent) {
        await this.saveNotificationToDB(notificationWithId);
      }

      // Guardar en memoria
      const userNotifications = this.notifications.get(notification.userId) || [];
      userNotifications.push(notificationWithId);
      this.notifications.set(notification.userId, userNotifications);

      // Enviar por los canales configurados
      await Promise.all(
        notification.channels.map(channel => 
          this.sendByChannel(channel, notificationWithId, preferences)
        )
      );

      logger.info(`Notification sent to user ${notification.userId}: ${notification.title}`);
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  // Verificar si se debe enviar la notificación
  private shouldSendNotification(notification: NotificationPayload, preferences: NotificationPreferences): boolean {
    // Verificar tipo de notificación
    if (!preferences.types[notification.type]) {
      return false;
    }

    // Verificar prioridad
    if (!preferences.priority[notification.priority]) {
      return false;
    }

    // Verificar horarios silenciosos
    if (preferences.quietHours.enabled && this.isInQuietHours(preferences.quietHours)) {
      // Solo notificaciones urgentes durante horarios silenciosos
      return notification.priority === 'urgent';
    }

    return true;
  }

  // Verificar horarios silenciosos
  private isInQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= quietHours.start && currentTime <= quietHours.end;
  }

  // Enviar por canal específico
  private async sendByChannel(
    channel: NotificationChannel,
    notification: NotificationPayload,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      switch (channel) {
        case 'websocket':
          await this.sendWebSocketNotification(notification);
          break;
        case 'push':
          await this.sendPushNotification(notification);
          break;
        case 'email':
          await this.sendEmailNotification(notification);
          break;
        case 'desktop':
          await this.sendDesktopNotification(notification);
          break;
        default:
          logger.warn(`Unknown notification channel: ${channel}`);
      }
    } catch (error) {
      logger.error(`Error sending notification via ${channel}:`, error);
    }
  }

  // Enviar notificación WebSocket
  private async sendWebSocketNotification(notification: NotificationPayload): Promise<void> {
    const io = getIO();
    
    // Enviar a usuario específico
    io.to(`user_${notification.userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });

    // Enviar a toda la empresa si es una notificación del sistema
    if (notification.type === 'system') {
      io.to(`company_${notification.companyId}`).emit('system_notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Enviar notificación Push
  private async sendPushNotification(notification: NotificationPayload): Promise<void> {
    const subscriptions = this.pushSubscriptions.get(notification.userId) || [];
    
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        notificationId: notification.id,
        actionUrl: notification.actionUrl,
        entityId: notification.entityId,
        entityType: notification.entityType,
        ...notification.data
      },
      actions: [
        {
          action: 'view',
          title: 'Ver'
        },
        {
          action: 'dismiss',
          title: 'Descartar'
        }
      ]
    });

    const options = {
      vapidDetails: {
        subject: 'mailto:support@flameai.com',
        publicKey: process.env['VAPID_PUBLIC_KEY'] || '',
        privateKey: process.env['VAPID_PRIVATE_KEY'] || ''
      },
      TTL: 3600
    };

    await Promise.all(
      subscriptions.map(async subscription => {
        try {
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys
            },
            payload,
            options
          );
        } catch (error: any) {
          logger.error(`Error sending push notification to ${subscription.userId}:`, error);
          
          // Remover suscripción si falló
          if (error.statusCode === 404 || error.statusCode === 410) {
            await this.removePushSubscription(subscription.userId, subscription.endpoint);
          }
        }
      })
    );
  }

  // Enviar notificación de escritorio
  private async sendDesktopNotification(notification: NotificationPayload): Promise<void> {
    const io = getIO();
    
    io.to(`user_${notification.userId}`).emit('desktop_notification', {
      title: notification.title,
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
      silent: false,
      data: {
        notificationId: notification.id,
        actionUrl: notification.actionUrl,
        ...notification.data
      }
    });
  }

  // Enviar notificación por email (placeholder)
  private async sendEmailNotification(notification: NotificationPayload): Promise<void> {
    // Implementar integración con servicio de email
    logger.info(`Email notification would be sent to user ${notification.userId}: ${notification.title}`);
  }

  // Obtener preferencias del usuario
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Verificar caché
      const cached = this.userPreferences.get(userId);
      if (cached) {
        return cached;
      }

      // Cargar desde base de datos
      const userPrefs = await prisma.userNotificationPreferences.findUnique({
        where: { userId }
      });

      const preferences: NotificationPreferences = userPrefs ? {
        userId,
        channels: userPrefs.channels as any,
        types: userPrefs.types as any,
        priority: userPrefs.priority as any,
        quietHours: userPrefs.quietHours as any,
        soundEnabled: userPrefs.soundEnabled,
        vibrationEnabled: userPrefs.vibrationEnabled,
        groupNotifications: userPrefs.groupNotifications
      } : this.getDefaultPreferences(userId);

      // Guardar en caché
      this.userPreferences.set(userId, preferences);
      return preferences;
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  // Obtener preferencias por defecto
  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      channels: {
        websocket: true,
        push: true,
        email: false,
        sms: false,
        desktop: true
      },
      types: {
        message: true,
        ticket: true,
        assignment: true,
        system: true,
        warning: true,
        success: true,
        error: true
      },
      priority: {
        low: true,
        medium: true,
        high: true,
        urgent: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      soundEnabled: true,
      vibrationEnabled: true,
      groupNotifications: true
    };
  }

  // Actualizar preferencias del usuario
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const currentPrefs = await this.getUserPreferences(userId);
      const updatedPrefs = { ...currentPrefs, ...preferences };

      // Actualizar en base de datos
      await prisma.userNotificationPreferences.upsert({
        where: { userId },
        update: {
          channels: updatedPrefs.channels,
          types: updatedPrefs.types,
          priority: updatedPrefs.priority,
          quietHours: updatedPrefs.quietHours,
          soundEnabled: updatedPrefs.soundEnabled,
          vibrationEnabled: updatedPrefs.vibrationEnabled,
          groupNotifications: updatedPrefs.groupNotifications
        },
        create: {
          userId,
          channels: updatedPrefs.channels,
          types: updatedPrefs.types,
          priority: updatedPrefs.priority,
          quietHours: updatedPrefs.quietHours,
          soundEnabled: updatedPrefs.soundEnabled,
          vibrationEnabled: updatedPrefs.vibrationEnabled,
          groupNotifications: updatedPrefs.groupNotifications
        }
      });

      // Actualizar caché
      this.userPreferences.set(userId, updatedPrefs);
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // Agregar suscripción push
  async addPushSubscription(userId: string, subscription: Omit<PushSubscription, 'userId' | 'createdAt'>): Promise<void> {
    try {
      const pushSubscription: PushSubscription = {
        ...subscription,
        userId,
        createdAt: new Date()
      };

      // Guardar en base de datos
      await prisma.pushSubscription.create({
        data: pushSubscription
      });

      // Actualizar caché
      const userSubscriptions = this.pushSubscriptions.get(userId) || [];
      userSubscriptions.push(pushSubscription);
      this.pushSubscriptions.set(userId, userSubscriptions);

      logger.info(`Push subscription added for user ${userId}`);
    } catch (error) {
      logger.error('Error adding push subscription:', error);
      throw error;
    }
  }

  // Remover suscripción push
  async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    try {
      // Remover de base de datos
      await prisma.pushSubscription.deleteMany({
        where: { userId, endpoint }
      });

      // Actualizar caché
      const userSubscriptions = this.pushSubscriptions.get(userId) || [];
      const filteredSubscriptions = userSubscriptions.filter(sub => sub.endpoint !== endpoint);
      this.pushSubscriptions.set(userId, filteredSubscriptions);

      logger.info(`Push subscription removed for user ${userId}`);
    } catch (error) {
      logger.error('Error removing push subscription:', error);
      throw error;
    }
  }

  // Obtener notificaciones del usuario
  async getUserNotifications(userId: string, limit: number = 50, offset: number = 0): Promise<NotificationPayload[]> {
    try {
      // Combinar notificaciones en memoria y persistentes
      const memoryNotifications = this.notifications.get(userId) || [];
      
      const persistentNotifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      // Convertir notificaciones persistentes al formato esperado
      const convertedPersistent: NotificationPayload[] = persistentNotifications.map((n: any) => ({
        id: n.id,
        type: n.type as any,
        title: n.title,
        message: n.message,
        userId: n.userId,
        companyId: n.companyId,
        entityId: n.entityId || undefined,
        entityType: n.entityType || undefined,
        priority: n.priority as any,
        persistent: true,
        actionUrl: n.actionUrl || undefined,
        data: n.data,
        createdAt: n.createdAt,
        read: n.read,
        channels: n.channels as any
      }));

      // Combinar y ordenar por fecha
      const allNotifications = [...memoryNotifications, ...convertedPersistent]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(offset, offset + limit);

      return allNotifications;
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Marcar notificación como leída
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      // Actualizar en memoria
      const userNotifications = this.notifications.get(userId) || [];
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }

      // Actualizar en base de datos si es persistente
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { read: true }
      });

      // Notificar cambio via WebSocket
      const io = getIO();
      io.to(`user_${userId}`).emit('notification_read', { notificationId });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Marcar todas las notificaciones como leídas
  async markAllAsRead(userId: string): Promise<void> {
    try {
      // Actualizar en memoria
      const userNotifications = this.notifications.get(userId) || [];
      userNotifications.forEach(n => n.read = true);

      // Actualizar en base de datos
      await prisma.notification.updateMany({
        where: { userId },
        data: { read: true }
      });

      // Notificar cambio via WebSocket
      const io = getIO();
      io.to(`user_${userId}`).emit('all_notifications_read');
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Guardar notificación en base de datos
  private async saveNotificationToDB(notification: NotificationPayload): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          userId: notification.userId,
          companyId: notification.companyId,
          entityId: notification.entityId,
          entityType: notification.entityType,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          data: notification.data,
          channels: notification.channels,
          read: false,
          createdAt: notification.createdAt
        }
      });
    } catch (error) {
      logger.error('Error saving notification to database:', error);
      throw error;
    }
  }

  // Limpiar notificaciones antiguas
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Limpiar base de datos
      await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      });

      // Limpiar memoria
      this.notifications.forEach((notifications, userId) => {
        const filteredNotifications = notifications.filter(
          n => n.createdAt > cutoffDate
        );
        this.notifications.set(userId, filteredNotifications);
      });

      logger.info(`Cleaned up notifications older than ${daysToKeep} days`);
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  // Obtener estadísticas de notificaciones
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    try {
      const notifications = await this.getUserNotifications(userId, 1000);
      
      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<string, number>
      };

      notifications.forEach(notification => {
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw error;
    }
  }

  // Métodos de conveniencia para tipos específicos de notificaciones
  
  async notifyNewMessage(userId: string, companyId: string, conversationId: string, message: any): Promise<void> {
    await this.sendNotification({
      type: 'message',
      title: 'Nuevo mensaje',
      message: `${message.contact.name}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
      userId,
      companyId,
      entityId: conversationId,
      entityType: 'conversation',
      priority: 'medium',
      persistent: false,
      actionUrl: `/conversations/${conversationId}`,
      channels: ['websocket', 'push', 'desktop'],
      data: { message }
    });
  }

  async notifyTicketAssigned(userId: string, companyId: string, ticketId: string, ticket: any): Promise<void> {
    await this.sendNotification({
      type: 'assignment',
      title: 'Ticket asignado',
      message: `Te han asignado un nuevo ticket: ${ticket.subject}`,
      userId,
      companyId,
      entityId: ticketId,
      entityType: 'ticket',
      priority: 'high',
      persistent: true,
      actionUrl: `/tickets/${ticketId}`,
      channels: ['websocket', 'push', 'desktop'],
      data: { ticket }
    });
  }

  async notifySystemAlert(companyId: string, title: string, message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): Promise<void> {
    // Obtener todos los usuarios de la empresa
    const users = await prisma.user.findMany({
      where: { companyId },
      select: { id: true }
    });

    // Enviar notificación a todos los usuarios
    await Promise.all(
      users.map(user => 
        this.sendNotification({
          type: 'system',
          title,
          message,
          userId: user.id,
          companyId,
          priority,
          persistent: true,
          channels: ['websocket', 'push', 'desktop']
        })
      )
    );
  }
}

export default NotificationService; 