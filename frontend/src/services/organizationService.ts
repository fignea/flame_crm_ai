import api from './api';
import { ApiResponse, PaginatedResponse } from '../types/api';

export interface Organization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  industry?: string;
  companySize?: string;
  vatNumber?: string;
  description?: string;
  notes?: string;
  logo?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    contacts: number;
  };
  contacts?: Array<{
    id: string;
    name: string;
    number: string;
    email?: string;
  }>;
}

export interface OrganizationCreateData {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  industry?: string;
  companySize?: string;
  vatNumber?: string;
  description?: string;
  notes?: string;
  logo?: string;
}

export interface OrganizationUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  industry?: string;
  companySize?: string;
  vatNumber?: string;
  description?: string;
  notes?: string;
  logo?: string;
}

export interface OrganizationFilters {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  companySize?: string;
  city?: string;
  state?: string;
  country?: string;
  status?: string;
}

export interface OrganizationStats {
  organization: Organization;
  stats: {
    totalContacts: number;
    activeContacts: number;
    recentContacts: number;
    totalTickets: number;
  };
}

export const organizationService = {
  // Obtener todas las organizaciones con filtros
  async getAll(filters: OrganizationFilters = {}): Promise<PaginatedResponse<Organization>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.companySize) params.append('companySize', filters.companySize);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.country) params.append('country', filters.country);
    if (filters.status) params.append('status', filters.status);

    const response = await api.get<ApiResponse<PaginatedResponse<Organization>>>(`/organizations?${params.toString()}`);
    if (!response.data.data) {
      throw new Error('Error obteniendo organizaciones');
    }
    return response.data.data;
  },

  // Obtener una organización por ID
  async getById(id: string): Promise<Organization> {
    const response = await api.get<ApiResponse<Organization>>(`/organizations/${id}`);
    if (!response.data.data) {
      throw new Error('Organización no encontrada');
    }
    return response.data.data;
  },

  // Crear nueva organización
  async create(data: OrganizationCreateData): Promise<Organization> {
    const response = await api.post<ApiResponse<Organization>>('/organizations', data);
    if (!response.data.data) {
      throw new Error('Error creando organización');
    }
    return response.data.data;
  },

  // Actualizar organización
  async update(id: string, data: OrganizationUpdateData): Promise<Organization> {
    const response = await api.put<ApiResponse<Organization>>(`/organizations/${id}`, data);
    if (!response.data.data) {
      throw new Error('Error actualizando organización');
    }
    return response.data.data;
  },

  // Eliminar organización
  async delete(id: string): Promise<void> {
    await api.delete(`/organizations/${id}`);
  },

  // Obtener estadísticas de una organización
  async getStats(id: string): Promise<OrganizationStats> {
    const response = await api.get<ApiResponse<OrganizationStats>>(`/organizations/${id}/stats`);
    if (!response.data.data) {
      throw new Error('Error obteniendo estadísticas');
    }
    return response.data.data;
  },

  // Obtener industrias únicas
  async getIndustries(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/organizations/filters/industries');
    if (!response.data.data) {
      throw new Error('Error obteniendo industrias');
    }
    return response.data.data;
  },

  // Obtener tamaños de empresa únicos
  async getCompanySizes(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/organizations/filters/sizes');
    if (!response.data.data) {
      throw new Error('Error obteniendo tamaños de empresa');
    }
    return response.data.data;
  },

  // Helpers para formateo
  getIndustryDisplayName(industry: string): string {
    const industryMap: { [key: string]: string } = {
      'technology': 'Tecnología',
      'healthcare': 'Salud',
      'finance': 'Finanzas',
      'education': 'Educación',
      'retail': 'Comercio',
      'manufacturing': 'Manufactura',
      'construction': 'Construcción',
      'consulting': 'Consultoría',
      'marketing': 'Marketing',
      'real_estate': 'Inmobiliario',
      'transportation': 'Transporte',
      'hospitality': 'Hospitalidad',
      'entertainment': 'Entretenimiento',
      'agriculture': 'Agricultura',
      'energy': 'Energía',
      'telecommunications': 'Telecomunicaciones',
      'insurance': 'Seguros',
      'legal': 'Legal',
      'nonprofit': 'Sin fines de lucro',
      'government': 'Gobierno',
      'other': 'Otro'
    };
    return industryMap[industry] || industry;
  },

  getCompanySizeDisplayName(size: string): string {
    const sizeMap: { [key: string]: string } = {
      'small': 'Pequeña (1-50)',
      'medium': 'Mediana (51-200)',
      'large': 'Grande (201-1000)',
      'enterprise': 'Empresa (1000+)'
    };
    return sizeMap[size] || size;
  },

  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Activa',
      'inactive': 'Inactiva',
      'pending': 'Pendiente',
      'suspended': 'Suspendida'
    };
    return statusMap[status] || status;
  },

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'suspended': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}; 