import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { prisma } from '../prisma/client';

// Interfaces y tipos
export interface RoleResponse {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  color: string | null;
  isSystemRole: boolean;
  isActive: boolean;
  userCount: number;
  permissions: PermissionResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionResponse {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
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

export class RoleService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // Obtener todos los roles
  async getRoles(): Promise<RoleResponse[]> {
    try {
      const roles = await this.prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return roles.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        color: role.color,
        isSystemRole: role.isSystemRole,
        isActive: role.isActive,
        userCount: role._count.users,
        permissions: role.permissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          module: rp.permission.module,
          action: rp.permission.action,
          description: rp.permission.description,
        })),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));
    } catch (error) {
      logger.error('Error obteniendo roles:', error);
      throw error;
    }
  }

  // Obtener rol por ID
  async getRoleById(id: string): Promise<RoleResponse | null> {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!role) {
        return null;
      }

      return {
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        color: role.color,
        isSystemRole: role.isSystemRole,
        isActive: role.isActive,
        userCount: role._count.users,
        permissions: role.permissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          module: rp.permission.module,
          action: rp.permission.action,
          description: rp.permission.description,
        })),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      };
    } catch (error) {
      logger.error('Error obteniendo rol por ID:', error);
      throw error;
    }
  }

  // Crear rol personalizado
  async createRole(roleData: CreateRoleRequest): Promise<RoleResponse> {
    try {
      // Verificar que el nombre no existe
      const existingRole = await this.prisma.role.findUnique({
        where: { name: roleData.name },
      });

      if (existingRole) {
        throw new Error('Ya existe un rol con ese nombre');
      }

      // Verificar que todos los permisos existen
      const permissions = await this.prisma.permission.findMany({
        where: {
          id: { in: roleData.permissionIds },
        },
      });

      if (permissions.length !== roleData.permissionIds.length) {
        throw new Error('Algunos permisos especificados no existen');
      }

      // Crear rol
      const role = await this.prisma.role.create({
        data: {
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description || null,
          color: roleData.color || null,
          isSystemRole: false,
          isActive: true,
        },
      });

      // Asignar permisos
      const rolePermissions = roleData.permissionIds.map(permissionId => ({
        roleId: role.id,
        permissionId,
      }));

      await this.prisma.rolePermission.createMany({
        data: rolePermissions,
      });

      logger.info(`Rol creado: ${role.name}`, {
        roleId: role.id,
        permissions: roleData.permissionIds.length,
      });

      // Obtener rol completo
      const createdRole = await this.getRoleById(role.id);
      if (!createdRole) {
        throw new Error('Error obteniendo rol creado');
      }
      return createdRole;
    } catch (error) {
      logger.error('Error creando rol:', error);
      throw error;
    }
  }

  // Actualizar rol
  async updateRole(id: string, updateData: UpdateRoleRequest): Promise<RoleResponse> {
    try {
      // Verificar que el rol existe
      const existingRole = await this.prisma.role.findUnique({
        where: { id },
      });

      if (!existingRole) {
        throw new Error('Rol no encontrado');
      }

      // No permitir actualizar roles del sistema
      if (existingRole.isSystemRole) {
        throw new Error('No se pueden modificar roles del sistema');
      }

      // Preparar datos de actualización
      const dataToUpdate: any = {};

      if (updateData.displayName) dataToUpdate.displayName = updateData.displayName;
      if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
      if (updateData.color !== undefined) dataToUpdate.color = updateData.color;
      if (updateData.isActive !== undefined) dataToUpdate.isActive = updateData.isActive;

      // Actualizar rol
      await this.prisma.role.update({
        where: { id },
        data: dataToUpdate,
      });

      // Actualizar permisos si se proporcionaron
      if (updateData.permissionIds) {
        // Verificar que todos los permisos existen
        const permissions = await this.prisma.permission.findMany({
          where: {
            id: { in: updateData.permissionIds },
          },
        });

        if (permissions.length !== updateData.permissionIds.length) {
          throw new Error('Algunos permisos especificados no existen');
        }

        // Eliminar permisos actuales
        await this.prisma.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Agregar nuevos permisos
        const rolePermissions = updateData.permissionIds.map(permissionId => ({
          roleId: id,
          permissionId,
        }));

        await this.prisma.rolePermission.createMany({
          data: rolePermissions,
        });
      }

      logger.info(`Rol actualizado: ${existingRole.name}`, {
        roleId: id,
        changes: Object.keys(updateData),
      });

      // Obtener rol actualizado
      const updatedRole = await this.getRoleById(id);
      return updatedRole!;
    } catch (error) {
      logger.error('Error actualizando rol:', error);
      throw error;
    }
  }

  // Eliminar rol personalizado
  async deleteRole(id: string): Promise<void> {
    try {
      // Verificar que el rol existe
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!role) {
        throw new Error('Rol no encontrado');
      }

      // No permitir eliminar roles del sistema
      if (role.isSystemRole) {
        throw new Error('No se pueden eliminar roles del sistema');
      }

      // No permitir eliminar roles con usuarios asignados
      if (role._count.users > 0) {
        throw new Error('No se puede eliminar un rol que tiene usuarios asignados');
      }

      // Eliminar permisos del rol
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Eliminar rol
      await this.prisma.role.delete({
        where: { id },
      });

      logger.info(`Rol eliminado: ${role.name}`, {
        roleId: id,
      });
    } catch (error) {
      logger.error('Error eliminando rol:', error);
      throw error;
    }
  }

  // Obtener todos los permisos disponibles
  async getPermissions(): Promise<PermissionResponse[]> {
    try {
      const permissions = await this.prisma.permission.findMany({
        orderBy: [
          { module: 'asc' },
          { action: 'asc' },
        ],
      });

      return permissions.map(permission => ({
        id: permission.id,
        name: permission.name,
        module: permission.module,
        action: permission.action,
        description: permission.description,
      }));
    } catch (error) {
      logger.error('Error obteniendo permisos:', error);
      throw error;
    }
  }

  // Obtener permisos agrupados por módulo
  async getPermissionsByModule(): Promise<Record<string, PermissionResponse[]>> {
    try {
      const permissions = await this.getPermissions();
      const grouped: Record<string, PermissionResponse[]> = {};

      permissions.forEach(permission => {
        if (!grouped[permission.module]) {
          grouped[permission.module] = [];
        }
        grouped[permission.module]!.push(permission);
      });

      return grouped;
    } catch (error) {
      logger.error('Error obteniendo permisos por módulo:', error);
      throw error;
    }
  }

  // Verificar si un rol tiene un permiso específico
  async roleHasPermission(roleId: string, permissionName: string): Promise<boolean> {
    try {
      const rolePermission = await this.prisma.rolePermission.findFirst({
        where: {
          roleId,
          permission: {
            name: permissionName,
          },
        },
      });

      return !!rolePermission;
    } catch (error) {
      logger.error('Error verificando permiso de rol:', error);
      return false;
    }
  }

  // Obtener roles activos para selector
  async getActiveRoles(): Promise<{ id: string; name: string; displayName: string; color: string | null }[]> {
    try {
      const roles = await this.prisma.role.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          color: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return roles;
    } catch (error) {
      logger.error('Error obteniendo roles activos:', error);
      throw error;
    }
  }
}

export const roleService = new RoleService(); 