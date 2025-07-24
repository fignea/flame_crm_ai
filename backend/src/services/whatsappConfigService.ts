import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';

export interface WhatsAppConfig {
  // Configuraciones generales
  autoAcceptInvites: boolean;
  autoDeleteMessages: boolean;
  autoDeleteAfterDays: number;
  
  // Configuraciones de mensajes
  enableWelcomeMessage: boolean;
  welcomeMessage: string;
  enableAwayMessage: boolean;
  awayMessage: string;
  awayMessageDelay: number; // minutos
  
  // Configuraciones de horario
  enableBusinessHours: boolean;
  businessHours: {
    monday: { enabled: boolean; start: string; end: string };
    tuesday: { enabled: boolean; start: string; end: string };
    wednesday: { enabled: boolean; start: string; end: string };
    thursday: { enabled: boolean; start: string; end: string };
    friday: { enabled: boolean; start: string; end: string };
    saturday: { enabled: boolean; start: string; end: string };
    sunday: { enabled: boolean; start: string; end: string };
  };
  outOfHoursMessage: string;
  
  // Configuraciones de webhooks
  enableWebhooks: boolean;
  webhookUrl: string;
  webhookSecretKey: string;
  webhookEvents: string[];
  
  // Configuraciones de filtros
  enableSpamFilter: boolean;
  spamKeywords: string[];
  enableBlacklist: boolean;
  blacklistedNumbers: string[];
  enableWhitelist: boolean;
  whitelistedNumbers: string[];
  
  // Configuraciones de respuestas automáticas
  enableAutoResponder: boolean;
  autoResponderRules: AutoResponderRule[];
  
  // Configuraciones de medios
  enableMediaDownload: boolean;
  maxMediaSize: number; // MB
  allowedMediaTypes: string[];
  
  // Configuraciones de seguridad
  enableEncryption: boolean;
  enableTwoFactorAuth: boolean;
  allowedIPs: string[];
  
  // Configuraciones de logs
  enableLogging: boolean;
  logLevel: 'info' | 'debug' | 'error';
  logRetentionDays: number;
  
  // Configuraciones de notificaciones
  enableDesktopNotifications: boolean;
  enableEmailNotifications: boolean;
  emailNotificationRecipients: string[];
  
  // Configuraciones de backup
  enableAutoBackup: boolean;
  backupInterval: number; // horas
  backupRetentionDays: number;
}

export interface AutoResponderRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    type: 'keyword' | 'regex' | 'exact' | 'contains';
    value: string;
    caseSensitive: boolean;
  };
  conditions: {
    timeRange?: { start: string; end: string };
    daysOfWeek?: number[];
    groupsOnly?: boolean;
    privateOnly?: boolean;
    firstTimeOnly?: boolean;
  };
  response: {
    type: 'text' | 'media' | 'template';
    content: string;
    mediaUrl?: string;
    delay?: number; // segundos
  };
  actions: {
    addToGroup?: string;
    removeFromGroup?: string;
    tagContact?: string[];
    transferToAgent?: string;
    createTicket?: boolean;
  };
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  autoAcceptInvites: false,
  autoDeleteMessages: false,
  autoDeleteAfterDays: 30,
  
  enableWelcomeMessage: false,
  welcomeMessage: '¡Hola! Gracias por contactarnos. Te responderemos lo antes posible.',
  enableAwayMessage: false,
  awayMessage: 'Actualmente no estamos disponibles. Te responderemos en nuestro próximo horario de atención.',
  awayMessageDelay: 15,
  
  enableBusinessHours: false,
  businessHours: {
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: false, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '13:00' }
  },
  outOfHoursMessage: 'Gracias por contactarnos. Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00.',
  
  enableWebhooks: false,
  webhookUrl: '',
  webhookSecretKey: '',
  webhookEvents: ['message', 'status'],
  
  enableSpamFilter: false,
  spamKeywords: [],
  enableBlacklist: false,
  blacklistedNumbers: [],
  enableWhitelist: false,
  whitelistedNumbers: [],
  
  enableAutoResponder: false,
  autoResponderRules: [],
  
  enableMediaDownload: true,
  maxMediaSize: 10,
  allowedMediaTypes: ['image', 'video', 'audio', 'document'],
  
  enableEncryption: false,
  enableTwoFactorAuth: false,
  allowedIPs: [],
  
  enableLogging: true,
  logLevel: 'info',
  logRetentionDays: 30,
  
  enableDesktopNotifications: true,
  enableEmailNotifications: false,
  emailNotificationRecipients: [],
  
  enableAutoBackup: false,
  backupInterval: 24,
  backupRetentionDays: 7
};

export class WhatsAppConfigService {
  // Obtener configuración de WhatsApp
  static async getConfig(connectionId: string, companyId: string): Promise<WhatsAppConfig> {
    try {
      const connection = await prisma.connection.findFirst({
        where: { 
          id: connectionId, 
          companyId,
          type: { in: ['whatsapp_web', 'whatsapp_business'] }
        }
      });

      if (!connection) {
        throw new Error('Conexión de WhatsApp no encontrada');
      }

      // Si no hay configuración, devolver configuración por defecto
      if (!connection.settings || typeof connection.settings !== 'object' || !connection.settings) {
        return DEFAULT_WHATSAPP_CONFIG;
      }

      const settings = connection.settings as any;
      if (!settings.whatsappConfig) {
        return DEFAULT_WHATSAPP_CONFIG;
      }

      // Mergear configuración guardada con configuración por defecto
      return {
        ...DEFAULT_WHATSAPP_CONFIG,
        ...settings.whatsappConfig
      };
    } catch (error) {
      logger.error('Error getting WhatsApp config:', error);
      throw error;
    }
  }

  // Actualizar configuración de WhatsApp
  static async updateConfig(
    connectionId: string, 
    companyId: string, 
    config: Partial<WhatsAppConfig>
  ): Promise<WhatsAppConfig> {
    try {
      const connection = await prisma.connection.findFirst({
        where: { 
          id: connectionId, 
          companyId,
          type: { in: ['whatsapp_web', 'whatsapp_business'] }
        }
      });

      if (!connection) {
        throw new Error('Conexión de WhatsApp no encontrada');
      }

      // Obtener configuración actual
      const currentConfig = await this.getConfig(connectionId, companyId);
      
      // Mergear configuración
      const updatedConfig = {
        ...currentConfig,
        ...config
      };

      // Actualizar en la base de datos
      const currentSettings = (connection.settings && typeof connection.settings === 'object' && !Array.isArray(connection.settings)) 
        ? connection.settings 
        : {};
      
      await prisma.connection.update({
        where: { id: connectionId },
        data: {
          settings: {
            ...currentSettings,
            whatsappConfig: JSON.parse(JSON.stringify(updatedConfig))
          },
          ...(config.enableWebhooks && config.webhookUrl && {
            webhookUrl: config.webhookUrl,
            webhookByEvents: config.enableWebhooks
          })
        }
      });

      logger.info(`WhatsApp config updated for connection ${connectionId}`);

      return updatedConfig;
    } catch (error) {
      logger.error('Error updating WhatsApp config:', error);
      throw error;
    }
  }

  // Validar configuración
  static validateConfig(config: Partial<WhatsAppConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar configuración de webhook
    if (config.enableWebhooks && !config.webhookUrl) {
      errors.push('URL de webhook requerida cuando los webhooks están habilitados');
    }

    if (config.webhookUrl && !this.isValidUrl(config.webhookUrl)) {
      errors.push('URL de webhook inválida');
    }

    // Validar horarios de negocio
    if (config.enableBusinessHours && config.businessHours) {
      for (const [day, hours] of Object.entries(config.businessHours)) {
        if (hours.enabled) {
          if (!this.isValidTime(hours.start) || !this.isValidTime(hours.end)) {
            errors.push(`Horario inválido para ${day}`);
          }
          if (hours.start >= hours.end) {
            errors.push(`Hora de inicio debe ser menor que hora de fin para ${day}`);
          }
        }
      }
    }

    // Validar configuración de medios
    if (config.maxMediaSize && (config.maxMediaSize < 1 || config.maxMediaSize > 100)) {
      errors.push('Tamaño máximo de medios debe estar entre 1 y 100 MB');
    }

    // Validar configuración de backup
    if (config.enableAutoBackup) {
      if (config.backupInterval && config.backupInterval < 1) {
        errors.push('Intervalo de backup debe ser mayor a 0');
      }
      if (config.backupRetentionDays && config.backupRetentionDays < 1) {
        errors.push('Días de retención de backup debe ser mayor a 0');
      }
    }

    // Validar números de teléfono
    if (config.blacklistedNumbers) {
      for (const number of config.blacklistedNumbers) {
        if (!this.isValidPhoneNumber(number)) {
          errors.push(`Número de teléfono inválido en lista negra: ${number}`);
        }
      }
    }

    if (config.whitelistedNumbers) {
      for (const number of config.whitelistedNumbers) {
        if (!this.isValidPhoneNumber(number)) {
          errors.push(`Número de teléfono inválido en lista blanca: ${number}`);
        }
      }
    }

    // Validar emails
    if (config.emailNotificationRecipients) {
      for (const email of config.emailNotificationRecipients) {
        if (!this.isValidEmail(email)) {
          errors.push(`Email inválido: ${email}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Generar regla de auto-respuesta
  static generateAutoResponderRule(data: Partial<AutoResponderRule>): AutoResponderRule {
    return {
      id: data.id || this.generateId(),
      name: data.name || 'Nueva regla',
      enabled: data.enabled || true,
      trigger: {
        type: data.trigger?.type || 'keyword',
        value: data.trigger?.value || '',
        caseSensitive: data.trigger?.caseSensitive || false
      },
      conditions: {
        timeRange: data.conditions?.timeRange,
        daysOfWeek: data.conditions?.daysOfWeek,
        groupsOnly: data.conditions?.groupsOnly || false,
        privateOnly: data.conditions?.privateOnly || false,
        firstTimeOnly: data.conditions?.firstTimeOnly || false
      },
      response: {
        type: data.response?.type || 'text',
        content: data.response?.content || '',
        mediaUrl: data.response?.mediaUrl,
        delay: data.response?.delay || 0
      },
      actions: {
        addToGroup: data.actions?.addToGroup,
        removeFromGroup: data.actions?.removeFromGroup,
        tagContact: data.actions?.tagContact,
        transferToAgent: data.actions?.transferToAgent,
        createTicket: data.actions?.createTicket || false
      }
    };
  }

  // Métodos de validación privados
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  private static isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private static isValidPhoneNumber(phone: string): boolean {
    // Validación básica de número de teléfono
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Aplicar configuración en tiempo real
  static async applyConfig(connectionId: string, companyId: string): Promise<void> {
    try {
      await this.getConfig(connectionId, companyId);
      
      // Aquí se puede integrar con el servicio de WhatsApp para aplicar configuraciones
      // Por ejemplo, configurar webhooks, filtros, etc.
      
      logger.info(`Configuration applied for connection ${connectionId}`);
    } catch (error) {
      logger.error('Error applying WhatsApp config:', error);
      throw error;
    }
  }

  // Exportar configuración
  static async exportConfig(connectionId: string, companyId: string): Promise<WhatsAppConfig> {
    return await this.getConfig(connectionId, companyId);
  }

  // Importar configuración
  static async importConfig(
    connectionId: string, 
    companyId: string, 
    config: WhatsAppConfig
  ): Promise<WhatsAppConfig> {
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Configuración inválida: ${validation.errors.join(', ')}`);
    }

    return await this.updateConfig(connectionId, companyId, config);
  }

  // Resetear configuración a valores por defecto
  static async resetConfig(connectionId: string, companyId: string): Promise<WhatsAppConfig> {
    return await this.updateConfig(connectionId, companyId, DEFAULT_WHATSAPP_CONFIG);
  }
}

export default WhatsAppConfigService; 