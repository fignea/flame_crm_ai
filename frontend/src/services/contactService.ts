import api from './api';
import { ApiResponse, PaginatedResponse } from '../types/api';

export interface Contact {
  id: string;
  name: string;
  number: string;
  email?: string;
  avatar?: string;
  isGroup: boolean;
  isBlocked: boolean;
  companyName?: string;
  position?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  birthday?: string;
  status?: string;
  customerType?: string;
  socials?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    x?: string;
  };
  notes?: string;
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
  };
  tags: Array<{
    id: string;
    attribute: string;
    value: string;
  }>;
  lastContact: string;
  ticketCount: number;
  lastTicket?: {
    id: string;
    status: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContactCreateData {
  name: string;
  number: string;
  email?: string;
  avatar?: string;
  isGroup?: boolean;
  isBlocked?: boolean;
  companyName?: string;
  position?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  birthday?: string;
  status?: string;
  customerType?: string;
  socials?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    x?: string;
  };
  notes?: string;
  organizationId?: string;
}

export interface ContactUpdateData {
  name?: string;
  number?: string;
  email?: string;
  avatar?: string;
  isGroup?: boolean;
  isBlocked?: boolean;
  companyName?: string;
  position?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  birthday?: string;
  status?: string;
  customerType?: string;
  socials?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    x?: string;
  };
  notes?: string;
}

export interface ContactFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  tag?: string;
  city?: string;
  state?: string;
  country?: string;
  companyName?: string;
  position?: string;
  customerType?: string;
  birthday?: string;
  notes?: string;
  socials?: string;
  organizationId?: string;
}

export interface ContactStats {
  totalContacts: number;
  activeContacts: number;
  blockedContacts: number;
  contactsThisMonth: number;
  contactsWithTickets: number;
  contactsWithoutTickets: number;
  topTags: Array<{
    name: string;
    count: number;
  }>;
}

export const contactService = {
  // Obtener todos los contactos con filtros avanzados
  async getAll(filters: ContactFilters = {}): Promise<PaginatedResponse<Contact>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.country) params.append('country', filters.country);
    if (filters.companyName) params.append('companyName', filters.companyName);
    if (filters.position) params.append('position', filters.position);
    if (filters.customerType) params.append('customerType', filters.customerType);
    if (filters.birthday) params.append('birthday', filters.birthday);
    if (filters.notes) params.append('notes', filters.notes);
    if (filters.socials) params.append('socials', filters.socials);
    if (filters.organizationId) params.append('organizationId', filters.organizationId);

    const response = await api.get<ApiResponse<PaginatedResponse<Contact>>>(`/contacts?${params.toString()}`);
    if (!response.data.data) {
      throw new Error('Error obteniendo contactos');
    }
    return response.data.data;
  },

  // Obtener un contacto por ID
  async getById(id: string): Promise<Contact> {
    const response = await api.get<ApiResponse<Contact>>(`/contacts/${id}`);
    if (!response.data.data) {
      throw new Error('Contacto no encontrado');
    }
    return response.data.data;
  },

  // Crear nuevo contacto
  async create(data: ContactCreateData): Promise<Contact> {
    const response = await api.post<ApiResponse<Contact>>('/contacts', data);
    if (!response.data.data) {
      throw new Error('Error al crear el contacto');
    }
    return response.data.data;
  },

  // Actualizar contacto
  async update(id: string, data: ContactUpdateData): Promise<Contact> {
    const response = await api.put<ApiResponse<Contact>>(`/contacts/${id}`, data);
    if (!response.data.data) {
      throw new Error('Error al actualizar el contacto');
    }
    return response.data.data;
  },

  // Eliminar contacto
  async delete(id: string): Promise<void> {
    await api.delete(`/contacts/${id}`);
  },

  // Obtener estadísticas
  async getStats(): Promise<ContactStats> {
    const response = await api.get<ApiResponse<ContactStats>>('/contacts/stats/overview');
    if (!response.data.data) {
      throw new Error('Error al obtener estadísticas');
    }
    return response.data.data;
  },

  // Agregar tags a un contacto
  async addTags(id: string, tags: string[]): Promise<Contact> {
    const response = await api.post<ApiResponse<Contact>>(`/contacts/${id}/tags`, { tags });
    if (!response.data.data) {
      throw new Error('Error al agregar tags');
    }
    return response.data.data;
  },

  // Remover tags de un contacto
  async removeTags(id: string, tags: string[]): Promise<Contact> {
    const response = await api.delete<ApiResponse<Contact>>(`/contacts/${id}/tags`, { data: { tags } });
    if (!response.data.data) {
      throw new Error('Error al remover tags');
    }
    return response.data.data;
  }
}; 