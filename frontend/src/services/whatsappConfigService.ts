import api from './api';

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
  awayMessageDelay: number;
  
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
  maxMediaSize: number;
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
  backupInterval: number;
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
    delay?: number;
  };
  actions: {
    addToGroup?: string;
    removeFromGroup?: string;
    tagContact?: string[];
    transferToAgent?: string;
    createTicket?: boolean;
  };
}

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  config: Partial<WhatsAppConfig>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

class WhatsAppConfigService {
  // Obtener configuración
  async getConfig(connectionId: string): Promise<WhatsAppConfig> {
    try {
      const response = await api.get<ApiResponse<WhatsAppConfig>>(`/whatsapp-config/${connectionId}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Error obteniendo configuración');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting WhatsApp config:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo configuración');
    }
  }

  // Actualizar configuración
  async updateConfig(connectionId: string, config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    try {
      const response = await api.put<ApiResponse<WhatsAppConfig>>(`/whatsapp-config/${connectionId}`, config);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error actualizando configuración');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating WhatsApp config:', error);
      throw new Error(error.response?.data?.message || 'Error actualizando configuración');
    }
  }

  // Validar configuración
  async validateConfig(connectionId: string, config: Partial<WhatsAppConfig>): Promise<ValidationResult> {
    try {
      const response = await api.post<ApiResponse<ValidationResult>>(`/whatsapp-config/${connectionId}/validate`, config);
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Error validando configuración');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error validating WhatsApp config:', error);
      throw new Error(error.response?.data?.message || 'Error validando configuración');
    }
  }

  // Aplicar configuración
  async applyConfig(connectionId: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>(`/whatsapp-config/${connectionId}/apply`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error aplicando configuración');
      }
    } catch (error: any) {
      console.error('Error applying WhatsApp config:', error);
      throw new Error(error.response?.data?.message || 'Error aplicando configuración');
    }
  }

  // Exportar configuración
  async exportConfig(connectionId: string): Promise<{ config: WhatsAppConfig; exportedAt: string }> {
    try {
      const response = await api.get<ApiResponse<{ config: WhatsAppConfig; exportedAt: string }>>(`/whatsapp-config/${connectionId}/export`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Error exportando configuración');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error exporting WhatsApp config:', error);
      throw new Error(error.response?.data?.message || 'Error exportando configuración');
    }
  }

  // Importar configuración
  async importConfig(connectionId: string, config: WhatsAppConfig): Promise<WhatsAppConfig> {
    try {
      const response = await api.post<ApiResponse<WhatsAppConfig>>(`/whatsapp-config/${connectionId}/import`, { config });
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error importando configuración');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error importing WhatsApp config:', error);
      throw new Error(error.response?.data?.message || 'Error importando configuración');
    }
  }

  // Resetear configuración
  async resetConfig(connectionId: string): Promise<WhatsAppConfig> {
    try {
      const response = await api.post<ApiResponse<WhatsAppConfig>>(`/whatsapp-config/${connectionId}/reset`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error reseteando configuración');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error resetting WhatsApp config:', error);
      throw new Error(error.response?.data?.message || 'Error reseteando configuración');
    }
  }

  // Agregar regla de auto-respuesta
  async addAutoResponderRule(connectionId: string, rule: Partial<AutoResponderRule>): Promise<AutoResponderRule> {
    try {
      const response = await api.post<ApiResponse<AutoResponderRule>>(`/whatsapp-config/${connectionId}/auto-responder`, rule);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error agregando regla');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error adding auto-responder rule:', error);
      throw new Error(error.response?.data?.message || 'Error agregando regla');
    }
  }

  // Actualizar regla de auto-respuesta
  async updateAutoResponderRule(connectionId: string, ruleId: string, rule: Partial<AutoResponderRule>): Promise<AutoResponderRule> {
    try {
      const response = await api.put<ApiResponse<AutoResponderRule>>(`/whatsapp-config/${connectionId}/auto-responder/${ruleId}`, rule);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error actualizando regla');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating auto-responder rule:', error);
      throw new Error(error.response?.data?.message || 'Error actualizando regla');
    }
  }

  // Eliminar regla de auto-respuesta
  async deleteAutoResponderRule(connectionId: string, ruleId: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<void>>(`/whatsapp-config/${connectionId}/auto-responder/${ruleId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error eliminando regla');
      }
    } catch (error: any) {
      console.error('Error deleting auto-responder rule:', error);
      throw new Error(error.response?.data?.message || 'Error eliminando regla');
    }
  }

  // Obtener plantillas de configuración
  async getConfigTemplates(connectionId: string): Promise<ConfigTemplate[]> {
    try {
      const response = await api.get<ApiResponse<ConfigTemplate[]>>(`/whatsapp-config/${connectionId}/templates`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Error obteniendo plantillas');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting config templates:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo plantillas');
    }
  }

  // Descargar configuración como JSON
  downloadConfig(config: WhatsAppConfig, filename: string = 'whatsapp-config.json'): void {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Leer archivo de configuración
  async readConfigFile(file: File): Promise<WhatsAppConfig> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const config = JSON.parse(result);
            resolve(config);
          } else {
            reject(new Error('Error leyendo archivo'));
          }
        } catch (error) {
          reject(new Error('Archivo de configuración inválido'));
        }
      };
      
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  }

  // Obtener configuración por defecto
  getDefaultConfig(): WhatsAppConfig {
    return {
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
  }

  // Validar configuración localmente
  validateConfigLocally(config: Partial<WhatsAppConfig>): ValidationResult {
    const errors: string[] = [];

    // Validar URL de webhook
    if (config.enableWebhooks && config.webhookUrl && !this.isValidUrl(config.webhookUrl)) {
      errors.push('URL de webhook inválida');
    }

    // Validar horarios
    if (config.enableBusinessHours && config.businessHours) {
      Object.entries(config.businessHours).forEach(([day, hours]) => {
        if (hours.enabled && hours.start >= hours.end) {
          errors.push(`Horario inválido para ${day}: hora de inicio debe ser menor que hora de fin`);
        }
      });
    }

    // Validar tamaño de medios
    if (config.maxMediaSize && (config.maxMediaSize < 1 || config.maxMediaSize > 100)) {
      errors.push('Tamaño máximo de medios debe estar entre 1 y 100 MB');
    }

    // Validar emails
    if (config.emailNotificationRecipients) {
      config.emailNotificationRecipients.forEach(email => {
        if (!this.isValidEmail(email)) {
          errors.push(`Email inválido: ${email}`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  // Utilities
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Formatear configuración para mostrar
  formatConfigForDisplay(config: WhatsAppConfig): Record<string, any> {
    return {
      'Configuración General': {
        'Auto-aceptar invitaciones': config.autoAcceptInvites ? 'Sí' : 'No',
        'Auto-eliminar mensajes': config.autoDeleteMessages ? `Sí (${config.autoDeleteAfterDays} días)` : 'No'
      },
      'Mensajes Automáticos': {
        'Mensaje de bienvenida': config.enableWelcomeMessage ? 'Habilitado' : 'Deshabilitado',
        'Mensaje de ausencia': config.enableAwayMessage ? `Habilitado (${config.awayMessageDelay} min)` : 'Deshabilitado'
      },
      'Horarios de Negocio': {
        'Horarios habilitados': config.enableBusinessHours ? 'Sí' : 'No',
        'Días activos': config.enableBusinessHours ? 
          Object.entries(config.businessHours)
            .filter(([_, hours]) => hours.enabled)
            .map(([day]) => day)
            .join(', ') : 'N/A'
      },
      'Webhooks': {
        'Webhooks habilitados': config.enableWebhooks ? 'Sí' : 'No',
        'URL': config.webhookUrl || 'No configurada'
      },
      'Auto-respuestas': {
        'Auto-respuestas habilitadas': config.enableAutoResponder ? 'Sí' : 'No',
        'Reglas configuradas': config.autoResponderRules.length
      }
    };
  }
}

export default new WhatsAppConfigService(); 