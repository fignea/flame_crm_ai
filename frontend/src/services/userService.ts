import api from './api';

// Interfaces para el frontend
export interface User {
  id: string;
  name: string;
  email: string;
  profile: string;
  isActive: boolean;
  isOnline: boolean;
  lastSeen: Date;
  companyId: string;
  roleId: string | null;
  role: {
    id: string;
    name: string;
    displayName: string;
    color: string;
  } | null;
  company: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  color: string | null;
  isSystemRole: boolean;
  isActive: boolean;
  userCount: number;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roleId?: string;
  isActive?: boolean;
  avatar?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
  isActive?: boolean;
  avatar?: string;
}

export interface InviteUserRequest {
  email: string;
  roleId: string;
  message?: string;
  expiresInDays?: number;
}

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  displayName?: string;
  description?: string;
  color?: string;
  permissionIds?: string[];
  isActive?: boolean;
}

export interface UserActivityLog {
  id: string;
  action: string;
  module: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  users: T[];
  total: number;
  page: number;
  limit: number;
}

export class UserService {
  // ========================
  // GESTIÓN DE USUARIOS
  // ========================

  async getUsers(filters: UserFilters = {}): Promise<ApiResponse<PaginatedResponse<User>>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.roleId) params.append('roleId', filters.roleId);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    const response = await api.post('/users', userData);
    return response.data;
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }

  async getUserPermissions(id: string): Promise<ApiResponse<Permission[]>> {
    const response = await api.get(`/users/${id}/permissions`);
    return response.data;
  }

  async getUserActivity(
    id: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<ApiResponse<{ logs: UserActivityLog[]; total: number }>> {
    const response = await api.get(`/users/${id}/activity?page=${page}&limit=${limit}`);
    return response.data;
  }

  async inviteUser(inviteData: InviteUserRequest): Promise<ApiResponse<{ token: string; expiresAt: Date }>> {
    const response = await api.post('/users/invite', inviteData);
    return response.data;
  }

  // ========================
  // GESTIÓN DE ROLES
  // ========================

  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await api.get('/users/roles/all');
    return response.data;
  }

  async getActiveRoles(): Promise<ApiResponse<{ id: string; name: string; displayName: string; color: string | null }[]>> {
    const response = await api.get('/users/roles/active');
    return response.data;
  }

  async getRoleById(id: string): Promise<ApiResponse<Role>> {
    const response = await api.get(`/users/roles/${id}`);
    return response.data;
  }

  async createRole(roleData: CreateRoleRequest): Promise<ApiResponse<Role>> {
    const response = await api.post('/users/roles', roleData);
    return response.data;
  }

  async updateRole(id: string, roleData: UpdateRoleRequest): Promise<ApiResponse<Role>> {
    const response = await api.put(`/users/roles/${id}`, roleData);
    return response.data;
  }

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/users/roles/${id}`);
    return response.data;
  }

  // ========================
  // GESTIÓN DE PERMISOS
  // ========================

  async getPermissions(): Promise<ApiResponse<Permission[]>> {
    const response = await api.get('/users/permissions/all');
    return response.data;
  }

  async getPermissionsByModule(): Promise<ApiResponse<Record<string, Permission[]>>> {
    const response = await api.get('/users/permissions/by-module');
    return response.data;
  }

  // ========================
  // HELPERS
  // ========================

  getRoleColor(role: Role | null): string {
    if (!role) return '#6b7280';
    return role.color || '#6b7280';
  }

  getRoleDisplayName(role: Role | null): string {
    if (!role) return 'Sin rol';
    return role.displayName;
  }

  formatUserStatus(user: User): string {
    if (!user.isActive) return 'Inactivo';
    return user.isOnline ? 'En línea' : 'Desconectado';
  }

  formatLastSeen(lastSeen: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} minutos`;
    if (hours < 24) return `Hace ${hours} horas`;
    if (days < 7) return `Hace ${days} días`;
    return new Date(lastSeen).toLocaleDateString();
  }

  groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
    const grouped: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });

    return grouped;
  }

  getModuleDisplayName(module: string): string {
    const moduleNames: Record<string, string> = {
      users: 'Usuarios',
      contacts: 'Contactos',
      conversations: 'Conversaciones',
      tickets: 'Tickets',
      campaigns: 'Campañas',
      bot_flows: 'Flujos de Bot',
      settings: 'Configuración',
      reports: 'Reportes',
      connections: 'Conexiones',
      tags: 'Etiquetas',
    };

    return moduleNames[module] || module;
  }

  getActionDisplayName(action: string): string {
    const actionNames: Record<string, string> = {
      create: 'Crear',
      read: 'Ver',
      update: 'Actualizar',
      delete: 'Eliminar',
      export: 'Exportar',
      import: 'Importar',
      send: 'Enviar',
      assign: 'Asignar',
      close: 'Cerrar',
      activate: 'Activar',
      invite: 'Invitar',
      manage_roles: 'Gestionar Roles',
      view_activity: 'Ver Actividad',
      integrations: 'Integraciones',
      advanced: 'Avanzado',
    };

    return actionNames[action] || action;
  }
}

export const userService = new UserService(); 