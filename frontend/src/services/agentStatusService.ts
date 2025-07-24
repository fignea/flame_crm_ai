import api from './api';

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
  lastSeen: string;
  statusUpdatedAt: string;
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
  changeReason: string;
  changedAt: string;
}

export interface AgentStatusStats {
  total: number;
  available: number;
  busy: number;
  away: number;
  offline: number;
  online: number;
}

export interface StatusOption {
  value: AgentStatus;
  label: string;
  color: string;
}

export interface TimeoutOption {
  value: number;
  label: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class AgentStatusService {
  private activityTimer: number | null = null;
  private readonly ACTIVITY_INTERVAL = 3000; //30segundos

  // Obtener estado actual del agente
  async getMyStatus(): Promise<AgentStatusData> {
    try {
      const response = await api.get<ApiResponse<AgentStatusData>>('/agent-status');
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Error obteniendo estado del agente');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting agent status:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo estado del agente');
    }
  }

  // Actualizar estado del agente
  async updateStatus(update: AgentStatusUpdate): Promise<AgentStatusData> {
    try {
      const response = await api.put<ApiResponse<AgentStatusData>>('/agent-status', update);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error actualizando estado');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating agent status:', error);
      throw new Error(error.response?.data?.message || 'Error actualizando estado');
    }
  }

  // Obtener estados de todos los agentes de la empresa
  async getCompanyStatuses(): Promise<AgentStatusData[]> {
    try {
      const response = await api.get<ApiResponse<AgentStatusData[]>>('/agent-status/company');
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Error obteniendo estados de agentes');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting company agent statuses:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo estados de agentes');
    }
  }

  // Obtener agentes disponibles
  async getAvailableAgents(): Promise<AgentStatusData[]> {
    try {
      const response = await api.get<ApiResponse<AgentStatusData[]>>('/agent-status/available');
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Error obteniendo agentes disponibles');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting available agents:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo agentes disponibles');
    }
  }

  // Obtener estadísticas de estados
  async getStatusStats(): Promise<AgentStatusStats> {
    try {
      const response = await api.get<ApiResponse<AgentStatusStats>>('/agent-status/stats');
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Error obteniendo estadísticas');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting status stats:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo estadísticas');
    }
  }

  // Obtener historial de cambios
  async getStatusHistory(limit: number = 50): Promise<AgentStatusHistory[]> {
    try {
      const response = await api.get<ApiResponse<AgentStatusHistory[]>>(`/agent-status/history?limit=${limit}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Error obteniendo historial');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting status history:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo historial');
    }
  }

  // Resetear timer de actividad
  async resetActivityTimer(): Promise<void> {
    try {
      await api.post('/agent-status/reset-activity');
    } catch (error: any) {
      console.error('Error resetting activity timer:', error);
      // No lanzar error para no afectar la UX
    }
  }

  // Obtener opciones de configuración
  async getOptions(): Promise<{
    statusOptions: StatusOption[];
    timeoutOptions: TimeoutOption[];
  }> {
    try {
      const response = await api.get<ApiResponse<{
        statusOptions: StatusOption[];
        timeoutOptions: TimeoutOption[];
      }>>('/agent-status/options');
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Error obteniendo opciones');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting options:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo opciones');
    }
  }

  // Cambiar estado rápidamente
  async setStatus(status: AgentStatus, message?: string): Promise<AgentStatusData> {
    return this.updateStatus({
      agentStatus: status,
      statusMessage: message
    });
  }

  // Configurar auto-ausente
  async setAutoAway(enabled: boolean, timeout: number = 15): Promise<AgentStatusData> {
    return this.updateStatus({
      autoAwayEnabled: enabled,
      autoAwayTimeout: timeout
    });
  }

  // Obtener color del estado
  getStatusColor(status: AgentStatus): string {
    const colors = {
      [AgentStatus.AVAILABLE]: '#22c55e',
      [AgentStatus.BUSY]: '#eab308',
      [AgentStatus.AWAY]: '#f97316',
      [AgentStatus.OFFLINE]: '#6b7280'
    };
    return colors[status] || colors[AgentStatus.OFFLINE];
  }

  // Obtener label del estado
  getStatusLabel(status: AgentStatus): string {
    const labels = {
      [AgentStatus.AVAILABLE]: 'Disponible',
      [AgentStatus.BUSY]: 'Ocupado',
      [AgentStatus.AWAY]: 'Ausente',
      [AgentStatus.OFFLINE]: 'Desconectado'
    };
    return labels[status] || labels[AgentStatus.OFFLINE];
  }

  // Obtener icono del estado
  getStatusIcon(status: AgentStatus): string {
    const icons = {
      [AgentStatus.AVAILABLE]: '🟢',
      [AgentStatus.BUSY]: '🟡',
      [AgentStatus.AWAY]: '🟠',
      [AgentStatus.OFFLINE]: '⚫'
    };
    return icons[status] || icons[AgentStatus.OFFLINE];
  }

  // Formatear tiempo relativo
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'hace un momento';
  }

  // Iniciar seguimiento de actividad
  startActivityTracking(socket: any): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }

    // Eventos de actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (socket) {
        socket.emit('user_activity');
      }
    };

    // Agregar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Timer periódico para reportar actividad
    this.activityTimer = setInterval(() => {
      if (socket) {
        socket.emit('user_activity');
      }
    }, this.ACTIVITY_INTERVAL) as any;
  }

  // Detener seguimiento de actividad
  stopActivityTracking(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }

    // Remover listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {}; // Dummy function
    
    events.forEach(event => {
      document.removeEventListener(event, handleActivity, true);
    });
  }

  // Verificar si un estado es válido
  isValidStatus(status: string): status is AgentStatus {
    return Object.values(AgentStatus).includes(status as AgentStatus);
  }

  // Obtener siguiente estado disponible
  getNextAvailableStatus(currentStatus: AgentStatus): AgentStatus {
    const statusFlow = {
      [AgentStatus.AVAILABLE]: AgentStatus.BUSY,
      [AgentStatus.BUSY]: AgentStatus.AWAY,
      [AgentStatus.AWAY]: AgentStatus.AVAILABLE,
      [AgentStatus.OFFLINE]: AgentStatus.AVAILABLE
    };
    
    return statusFlow[currentStatus] || AgentStatus.AVAILABLE;
  }

  // Verificar si el agente puede recibir conversaciones
  canReceiveConversations(status: AgentStatus): boolean {
    return status === AgentStatus.AVAILABLE;
  }

  // Obtener prioridad del estado (para ordenamiento)
  getStatusPriority(status: AgentStatus): number {
    const priorities = {
      [AgentStatus.AVAILABLE]: 1,
      [AgentStatus.BUSY]: 2,
      [AgentStatus.AWAY]: 3,
      [AgentStatus.OFFLINE]: 4
    };
    return priorities[status] || 4;
  }
}

export default new AgentStatusService(); 