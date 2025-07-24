import api from './api';

export interface Notification {
  id: string;
  type: 'message' | 'ticket' | 'assignment' | 'system' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  entityId?: string;
  entityType?: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

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
    start: string;
    end: string;
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  groupNotifications: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private publicKey: string = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

  // Inicializar servicio
  async initialize(): Promise<void> {
    try {
      // Registrar service worker
      if ('serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      }

      // Configurar notificaciones push
      await this.setupPushNotifications();
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  // Configurar notificaciones push
  private async setupPushNotifications(): Promise<void> {
    if (!this.swRegistration) return;

    try {
      // Verificar si ya tenemos una suscripción
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!existingSubscription) {
        // Crear nueva suscripción
        await this.subscribeToPush();
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  }

  // Suscribirse a notificaciones push
  async subscribeToPush(): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service Worker not registered');
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicKey)
      });

      // Enviar suscripción al servidor
      await api.post('/notifications/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth'))
        },
        userAgent: navigator.userAgent
      });

      console.log('Push subscription successful');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  // Desuscribirse de notificaciones push
  async unsubscribeFromPush(): Promise<void> {
    if (!this.swRegistration) return;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notificar al servidor
        await api.delete('/notifications/push/unsubscribe', {
          data: { endpoint: subscription.endpoint }
        });

        console.log('Push unsubscription successful');
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }

  // Obtener notificaciones
  async getNotifications(limit: number = 50, offset: number = 0): Promise<Notification[]> {
    try {
      const response = await api.get<{ success: boolean; data: Notification[] }>('/notifications', {
        params: { limit, offset }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await api.get<{ success: boolean; data: NotificationStats }>('/notifications/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  // Marcar como leída
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.post(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Marcar todas como leídas
  async markAllAsRead(): Promise<void> {
    try {
      await api.post('/notifications/read-all');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Obtener preferencias
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await api.get<{ success: boolean; data: NotificationPreferences }>('/notifications/preferences');
      return response.data.data;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  // Actualizar preferencias
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      await api.put('/notifications/preferences', preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Enviar notificación de prueba
  async sendTestNotification(type: string = 'system'): Promise<void> {
    try {
      await api.post('/notifications/test', { type });
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  // Enviar notificación
  async sendNotification(notification: {
    type: 'message' | 'ticket' | 'assignment' | 'system' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    userId: string;
    companyId: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    persistent?: boolean;
    channels: string[];
    entityId?: string;
    entityType?: string;
  }): Promise<void> {
    try {
      await api.post('/notifications', notification);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Solicitar permiso para notificaciones
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Las notificaciones no están soportadas en este navegador');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  // Mostrar notificación local
  showLocalNotification(title: string, options: NotificationOptions = {}): void {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  // Verificar soporte para notificaciones
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Verificar si las notificaciones están habilitadas
  isEnabled(): boolean {
    return Notification.permission === 'granted';
  }

  // Configurar manejo de eventos del service worker
  setupServiceWorkerEvents(): void {
    if (!this.swRegistration) return;

    // Manejar mensajes del service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        // Manejar clic en notificación
        const { notificationId, actionUrl } = event.data;
        
        if (actionUrl) {
          window.location.href = actionUrl;
        }

        // Marcar como leída
        this.markAsRead(notificationId).catch(console.error);
      }
    });
  }

  // Utilidades
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  }

  // Helpers para formatear datos
  formatNotificationTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  }

  getNotificationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      message: 'Mensaje',
      ticket: 'Ticket',
      assignment: 'Asignación',
      system: 'Sistema',
      warning: 'Advertencia',
      success: 'Éxito',
      error: 'Error'
    };
    
    return labels[type] || type;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente'
    };
    
    return labels[priority] || priority;
  }

  // Configuración por defecto
  getDefaultPreferences(): NotificationPreferences {
    return {
      userId: '',
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
}

export default new NotificationService(); 