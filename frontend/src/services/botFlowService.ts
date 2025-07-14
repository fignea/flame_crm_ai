import api from './api';

const API_BASE_URL = '/bot-flows';

export interface BotFlow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  connectionId: string;
  connection?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBotFlowData {
  name: string;
  description: string;
  connectionId: string;
  isActive?: boolean;
}

export interface UpdateBotFlowData {
  name?: string;
  description?: string;
  connectionId?: string;
  isActive?: boolean;
}

export interface BotCondition {
  id: string;
  botFlowId: string;
  parentConditionId?: string;
  field: string;
  operator: string;
  value: string;
  order: number;
  responses: BotResponse[];
}

export interface BotResponse {
  id: string;
  botConditionId: string;
  message: string;
  order: number;
}

class BotFlowService {
  async getFlows(): Promise<{ data: BotFlow[] }> {
    const response = await api.get(API_BASE_URL);
    return { data: response.data };
  }

  async getFlow(id: string): Promise<{ data: BotFlow & { conditions: BotCondition[] } }> {
    const response = await api.get(`${API_BASE_URL}/${id}`);
    return response.data;
  }

  async createFlow(data: CreateBotFlowData): Promise<{ data: BotFlow }> {
    const response = await api.post(API_BASE_URL, data);
    return response.data;
  }

  async updateFlow(id: string, data: UpdateBotFlowData): Promise<{ data: BotFlow }> {
    const response = await api.put(`${API_BASE_URL}/${id}`, data);
    return response.data;
  }

  async deleteFlow(id: string): Promise<void> {
    await api.delete(`${API_BASE_URL}/${id}`);
  }

  async createCondition(botFlowId: string, data: {
    parentConditionId?: string;
    field: string;
    operator: string;
    value: string;
    order: number;
  }): Promise<{ data: BotCondition }> {
    const response = await api.post(`${API_BASE_URL}/${botFlowId}/conditions`, data);
    return response.data;
  }

  async updateCondition(conditionId: string, data: {
    field?: string;
    operator?: string;
    value?: string;
    order?: number;
  }): Promise<{ data: BotCondition }> {
    const response = await api.put(`${API_BASE_URL}/conditions/${conditionId}`, data);
    return response.data;
  }

  async deleteCondition(conditionId: string): Promise<void> {
    await api.delete(`${API_BASE_URL}/conditions/${conditionId}`);
  }

  async createResponse(conditionId: string, data: {
    message: string;
    order: number;
  }): Promise<{ data: BotResponse }> {
    const response = await api.post(`${API_BASE_URL}/conditions/${conditionId}/responses`, data);
    return response.data;
  }

  async updateResponse(responseId: string, data: {
    message?: string;
    order?: number;
  }): Promise<{ data: BotResponse }> {
    const response = await api.put(`${API_BASE_URL}/responses/${responseId}`, data);
    return response.data;
  }

  async deleteResponse(responseId: string): Promise<void> {
    await api.delete(`${API_BASE_URL}/responses/${responseId}`);
  }
}

export const botFlowService = new BotFlowService(); 