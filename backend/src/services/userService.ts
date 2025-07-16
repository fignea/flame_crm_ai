import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { prisma } from '../prisma/client';

// Interfaces y tipos
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roleId?: string;
  companyId: string;
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

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
  companyId?: string;
}

export interface UserResponse {
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

export interface UserPermission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string;
}

export interface InviteUserRequest {
  email: string;
  roleId: string;
  companyId: string;
  message?: string;
  expiresInDays?: number;
}

export interface UserActivityLogEntry {
  id: string;
  action: string;
  module: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // Crear usuario
  async createUser(userData: CreateUserRequest, createdBy: string, ipAddress?: string): Promise<UserResponse> {
    try {
      // Validar que el email no existe
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: userData.email.toLowerCase(),
          companyId: userData.companyId,
        },
      });

      if (existingUser) {
        throw new Error('El email ya está registrado en esta organización');
      }

      // Validar que el rol existe
      if (userData.roleId) {
        const role = await this.prisma.role.findUnique({
          where: { id: userData.roleId },
        });
        if (!role) {
          throw new Error('El rol especificado no existe');
        }
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Crear usuario
      const user = await this.prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          roleId: userData.roleId || null,
          companyId: userData.companyId,
          isActive: userData.isActive ?? true,
          avatar: userData.avatar || null,
          // Mantener profile para compatibilidad
          profile: userData.roleId ? 'user' : 'user',
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
              color: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Registrar actividad
      await this.logActivity(
        createdBy,
        'create_user',
        'users',
        { userId: user.id, userEmail: user.email },
        ipAddress
      );

      logger.info(`Usuario creado: ${user.email}`, {
        userId: user.id,
        createdBy,
        companyId: userData.companyId,
      });

      return this.formatUserResponse(user);
    } catch (error) {
      logger.error('Error creando usuario:', error);
      throw error;
    }
  }

  // Obtener usuarios con filtros
  async getUsers(filters: UserFilters): Promise<{ users: UserResponse[]; total: number; page: number; limit: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.companyId) {
        where.companyId = filters.companyId;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.roleId) {
        where.roleId = filters.roleId;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                color: true,
              },
            },
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        users: users.map(this.formatUserResponse),
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  // Obtener usuario por ID
  async getUserById(id: string, companyId?: string): Promise<UserResponse | null> {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const user = await this.prisma.user.findUnique({
        where,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
              color: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return user ? this.formatUserResponse(user) : null;
    } catch (error) {
      logger.error('Error obteniendo usuario por ID:', error);
      throw error;
    }
  }

  // Actualizar usuario
  async updateUser(
    id: string,
    updateData: UpdateUserRequest,
    updatedBy: string,
    companyId?: string,
    ipAddress?: string
  ): Promise<UserResponse> {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      // Verificar que el usuario existe
      const existingUser = await this.prisma.user.findUnique({ where });
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // Preparar datos de actualización
      const dataToUpdate: any = {};

      if (updateData.name) dataToUpdate.name = updateData.name;
      if (updateData.email) {
        // Verificar que el email no esté en uso
        const emailExists = await this.prisma.user.findFirst({
          where: {
            email: updateData.email.toLowerCase(),
            companyId: existingUser.companyId,
            NOT: { id },
          },
        });
        if (emailExists) {
          throw new Error('El email ya está en uso');
        }
        dataToUpdate.email = updateData.email.toLowerCase();
      }
      if (updateData.password) {
        dataToUpdate.password = await bcrypt.hash(updateData.password, 12);
      }
      if (updateData.roleId !== undefined) {
        if (updateData.roleId) {
          const role = await this.prisma.role.findUnique({
            where: { id: updateData.roleId },
          });
          if (!role) {
            throw new Error('El rol especificado no existe');
          }
        }
        dataToUpdate.roleId = updateData.roleId;
      }
      if (updateData.isActive !== undefined) {
        dataToUpdate.isActive = updateData.isActive;
      }
      if (updateData.avatar !== undefined) {
        dataToUpdate.avatar = updateData.avatar;
      }

      // Actualizar usuario
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
              color: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Registrar actividad
      await this.logActivity(
        updatedBy,
        'update_user',
        'users',
        { userId: id, changes: updateData },
        ipAddress
      );

      logger.info(`Usuario actualizado: ${updatedUser.email}`, {
        userId: id,
        updatedBy,
        changes: Object.keys(updateData),
      });

      return this.formatUserResponse(updatedUser);
    } catch (error) {
      logger.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  // Eliminar (desactivar) usuario
  async deleteUser(id: string, deletedBy: string, companyId?: string, ipAddress?: string): Promise<void> {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const user = await this.prisma.user.findUnique({ where });
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Desactivar usuario en lugar de eliminar
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      // Registrar actividad
      await this.logActivity(
        deletedBy,
        'delete_user',
        'users',
        { userId: id, userEmail: user.email },
        ipAddress
      );

      logger.info(`Usuario desactivado: ${user.email}`, {
        userId: id,
        deletedBy,
      });
    } catch (error) {
      logger.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  // Obtener permisos de usuario
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!user || !user.role) {
        return [];
      }

      return user.role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        module: rp.permission.module,
        action: rp.permission.action,
        description: rp.permission.description || '',
      }));
    } catch (error) {
      logger.error('Error obteniendo permisos de usuario:', error);
      throw error;
    }
  }

  // Verificar si usuario tiene permiso
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.some(p => p.name === permissionName);
    } catch (error) {
      logger.error('Error verificando permiso:', error);
      return false;
    }
  }

  // Obtener logs de actividad de usuario
  async getUserActivityLogs(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: UserActivityLogEntry[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        this.prisma.userActivityLog.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.userActivityLog.count({ where: { userId } }),
      ]);

      return {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          module: log.module,
          details: log.details,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
        })),
        total,
      };
    } catch (error) {
      logger.error('Error obteniendo logs de actividad:', error);
      throw error;
    }
  }

  // Invitar usuario
  async inviteUser(
    inviteData: InviteUserRequest,
    invitedBy: string,
    ipAddress?: string
  ): Promise<{ token: string; expiresAt: Date }> {
    try {
      // Verificar que el email no existe
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: inviteData.email.toLowerCase(),
          companyId: inviteData.companyId,
        },
      });

      if (existingUser) {
        throw new Error('El email ya está registrado en esta organización');
      }

      // Verificar que el rol existe
      const role = await this.prisma.role.findUnique({
        where: { id: inviteData.roleId },
      });
      if (!role) {
        throw new Error('El rol especificado no existe');
      }

      // Generar token único
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (inviteData.expiresInDays || 7));

      // Crear invitación
      await this.prisma.userInvitation.create({
        data: {
          email: inviteData.email.toLowerCase(),
          roleId: inviteData.roleId,
          companyId: inviteData.companyId,
          invitedById: invitedBy,
          token,
          message: inviteData.message || null,
          expiresAt,
        },
      });

      // Registrar actividad
      await this.logActivity(
        invitedBy,
        'invite_user',
        'users',
        { email: inviteData.email, roleId: inviteData.roleId },
        ipAddress
      );

      logger.info(`Invitación enviada a: ${inviteData.email}`, {
        invitedBy,
        companyId: inviteData.companyId,
      });

      return { token, expiresAt };
    } catch (error) {
      logger.error('Error invitando usuario:', error);
      throw error;
    }
  }

  // Registrar actividad de usuario
  private async logActivity(
    userId: string,
    action: string,
    module: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.prisma.userActivityLog.create({
        data: {
          userId,
          action,
          module,
          details: details || {},
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });
    } catch (error) {
      logger.error('Error registrando actividad:', error);
    }
  }

  // Formatear respuesta de usuario
  private formatUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      isActive: user.isActive,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      companyId: user.companyId,
      roleId: user.roleId,
      role: user.role,
      company: user.company,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const userService = new UserService(); 