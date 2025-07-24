import api from './api';

export interface AgentStatus {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  status: 'available' | 'busy' | 'away' | 'offline';
  activeConversations: number;
  maxConversations: number;
  lastActivity: string;
}

export interface ConversationAssignment {
  conversationId: string;
  userId: string;
  assignedAt: string;
  assignedBy: string;
  status: 'active' | 'transferred' | 'completed';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class ConversationAssignmentService {
  // Obtener agentes disponibles
  async getAvailableAgents(): Promise<AgentStatus[]> {
    try {
      const response = await api.get<ApiResponse<AgentStatus[]>>('/conversation-assignments/agents');
      return response.data.data || [];
    } catch (error) {
      console.error('Error obteniendo agentes disponibles:', error);
      throw new Error('No se pudieron obtener los agentes disponibles');
    }
  }

  // Asignar conversación a un agente específico
  async assignConversationToAgent(
    conversationId: string,
    userId: string
  ): Promise<ConversationAssignment> {
    try {
      const response = await api.post<ApiResponse<ConversationAssignment>>('/conversation-assignments/assign', {
        conversationId,
        userId
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error asignando conversación');
      }
      
      return response.data.data!;
    } catch (error: any) {
      console.error('Error asignando conversación:', error);
      throw new Error(error.response?.data?.message || 'Error asignando conversación');
    }
  }

  // Asignación automática de conversación
  async assignConversationAutomatically(conversationId: string): Promise<ConversationAssignment> {
    try {
      const response = await api.post<ApiResponse<ConversationAssignment>>('/conversation-assignments/assign-auto', {
        conversationId
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error en asignación automática');
      }
      
      return response.data.data!;
    } catch (error: any) {
      console.error('Error en asignación automática:', error);
      throw new Error(error.response?.data?.message || 'Error en asignación automática');
    }
  }

  // Transferir conversación a otro agente
  async transferConversation(
    conversationId: string,
    toUserId: string,
    reason?: string
  ): Promise<ConversationAssignment> {
    try {
      const response = await api.post<ApiResponse<ConversationAssignment>>('/conversation-assignments/transfer', {
        conversationId,
        toUserId,
        reason
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error transfiriendo conversación');
      }
      
      return response.data.data!;
    } catch (error: any) {
      console.error('Error transfiriendo conversación:', error);
      throw new Error(error.response?.data?.message || 'Error transfiriendo conversación');
    }
  }

  // Liberar conversación
  async releaseConversation(conversationId: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>('/conversation-assignments/release', {
        conversationId
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error liberando conversación');
      }
    } catch (error: any) {
      console.error('Error liberando conversación:', error);
      throw new Error(error.response?.data?.message || 'Error liberando conversación');
    }
  }

  // Obtener conversaciones asignadas al agente actual
  async getMyConversations(status?: 'unread' | 'all'): Promise<any[]> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get<ApiResponse<any[]>>(`/conversation-assignments/my-conversations${params}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error obteniendo mis conversaciones:', error);
      throw new Error('No se pudieron obtener las conversaciones asignadas');
    }
  }

  // Actualizar estado del agente
  async updateAgentStatus(status: 'available' | 'busy' | 'away'): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>('/conversation-assignments/status', {
        status
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error actualizando estado');
      }
    } catch (error: any) {
      console.error('Error actualizando estado del agente:', error);
      throw new Error(error.response?.data?.message || 'Error actualizando estado');
    }
  }
}

export default new ConversationAssignmentService(); 