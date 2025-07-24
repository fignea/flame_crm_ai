import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';

// Helper para convertir datos de la BD al tipo TypeScript
const convertToMessageTemplate = (data: any): MessageTemplate => ({
  ...data,
  category: data.category || undefined,
  shortcut: data.shortcut || undefined
});

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category?: string;
  shortcut?: string;
  isActive: boolean;
  isShared: boolean;
  usageCount: number;
  companyId: string;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplateFilters {
  category?: string;
  search?: string;
  isActive?: boolean;
  isShared?: boolean;
  createdBy?: string;
  page?: number;
  limit?: number;
}

export interface CreateMessageTemplateData {
  name: string;
  content: string;
  category?: string;
  shortcut?: string;
  isShared?: boolean;
}

export interface UpdateMessageTemplateData {
  name?: string;
  content?: string;
  category?: string;
  shortcut?: string;
  isActive?: boolean;
  isShared?: boolean;
}

export class MessageTemplateService {
  // Crear plantilla de mensaje
  static async createTemplate(
    data: CreateMessageTemplateData,
    companyId: string,
    createdById: string
  ): Promise<MessageTemplate> {
    try {
      // Validar que el shortcut no esté en uso si se proporciona
      if (data.shortcut) {
        const existingTemplate = await prisma.messageTemplate.findFirst({
          where: {
            companyId,
            shortcut: data.shortcut,
            isActive: true
          }
        });

        if (existingTemplate) {
          throw new Error(`El atajo "${data.shortcut}" ya está en uso`);
        }
      }

      const template = await prisma.messageTemplate.create({
        data: {
          name: data.name,
          content: data.content,
          category: data.category || 'general',
          shortcut: data.shortcut,
          isShared: data.isShared || false,
          companyId,
          createdById
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      logger.info(`Plantilla de mensaje creada: ${template.name} por ${createdById}`);

      return convertToMessageTemplate(template);
    } catch (error) {
      logger.error('Error creating message template:', error);
      throw error;
    }
  }

  // Obtener plantillas con filtros
  static async getTemplates(
    companyId: string,
    userId: string,
    filters: MessageTemplateFilters = {}
  ): Promise<{ templates: MessageTemplate[]; total: number }> {
    try {
      const {
        category,
        search,
        isActive = true,
        isShared,
        createdBy,
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        companyId,
        isActive,
        OR: [
          { isShared: true },
          { createdById: userId }
        ]
      };

      if (category) {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (isShared !== undefined) {
        where.isShared = isShared;
      }

      if (createdBy) {
        where.createdById = createdBy;
      }

      const [templates, total] = await Promise.all([
        prisma.messageTemplate.findMany({
          where,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: [
            { usageCount: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limit
        }),
        prisma.messageTemplate.count({ where })
      ]);

      return { templates: templates.map(convertToMessageTemplate), total };
    } catch (error) {
      logger.error('Error getting message templates:', error);
      throw error;
    }
  }

  // Obtener plantilla por ID
  static async getTemplate(
    id: string,
    companyId: string,
    userId: string
  ): Promise<MessageTemplate | null> {
    try {
      const template = await prisma.messageTemplate.findFirst({
        where: {
          id,
          companyId,
          OR: [
            { isShared: true },
            { createdById: userId }
          ]
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return template ? convertToMessageTemplate(template) : null;
    } catch (error) {
      logger.error('Error getting message template:', error);
      throw error;
    }
  }

  // Buscar plantilla por shortcut
  static async getTemplateByShortcut(
    shortcut: string,
    companyId: string,
    userId: string
  ): Promise<MessageTemplate | null> {
    try {
      const template = await prisma.messageTemplate.findFirst({
        where: {
          shortcut,
          companyId,
          isActive: true,
          OR: [
            { isShared: true },
            { createdById: userId }
          ]
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return template ? convertToMessageTemplate(template) : null;
    } catch (error) {
      logger.error('Error getting template by shortcut:', error);
      throw error;
    }
  }

  // Actualizar plantilla
  static async updateTemplate(
    id: string,
    data: UpdateMessageTemplateData,
    companyId: string,
    userId: string
  ): Promise<MessageTemplate | null> {
    try {
      // Verificar que el usuario puede editar esta plantilla
      const existingTemplate = await prisma.messageTemplate.findFirst({
        where: {
          id,
          companyId,
          OR: [
            { createdById: userId },
            { isShared: true } // Solo si es admin/manager
          ]
        }
      });

      if (!existingTemplate) {
        throw new Error('Plantilla no encontrada o sin permisos para editar');
      }

      // Validar shortcut si se está actualizando
      if (data.shortcut && data.shortcut !== existingTemplate.shortcut) {
        const conflictingTemplate = await prisma.messageTemplate.findFirst({
          where: {
            companyId,
            shortcut: data.shortcut,
            isActive: true,
            id: { not: id }
          }
        });

        if (conflictingTemplate) {
          throw new Error(`El atajo "${data.shortcut}" ya está en uso`);
        }
      }

      const template = await prisma.messageTemplate.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      logger.info(`Plantilla actualizada: ${template.name} por ${userId}`);

      return convertToMessageTemplate(template);
    } catch (error) {
      logger.error('Error updating message template:', error);
      throw error;
    }
  }

  // Eliminar plantilla
  static async deleteTemplate(
    id: string,
    companyId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const template = await prisma.messageTemplate.findFirst({
        where: {
          id,
          companyId,
          createdById: userId // Solo el creador puede eliminar
        }
      });

      if (!template) {
        throw new Error('Plantilla no encontrada o sin permisos para eliminar');
      }

      await prisma.messageTemplate.delete({
        where: { id }
      });

      logger.info(`Plantilla eliminada: ${template.name} por ${userId}`);

      return true;
    } catch (error) {
      logger.error('Error deleting message template:', error);
      throw error;
    }
  }

  // Incrementar contador de uso
  static async incrementUsage(
    id: string,
    companyId: string,
    userId: string
  ): Promise<void> {
    try {
      await prisma.messageTemplate.updateMany({
        where: {
          id,
          companyId,
          OR: [
            { isShared: true },
            { createdById: userId }
          ]
        },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });
    } catch (error) {
      logger.error('Error incrementing template usage:', error);
      // No lanzar error para no afectar el envío del mensaje
    }
  }

  // Obtener categorías disponibles
  static async getCategories(companyId: string, userId: string): Promise<string[]> {
    try {
      const categories = await prisma.messageTemplate.findMany({
        where: {
          companyId,
          isActive: true,
          OR: [
            { isShared: true },
            { createdById: userId }
          ]
        },
        select: {
          category: true
        },
        distinct: ['category']
      });

      return categories
        .map(c => c.category)
        .filter(Boolean) as string[];
    } catch (error) {
      logger.error('Error getting categories:', error);
      throw error;
    }
  }

  // Obtener estadísticas de uso
  static async getUsageStats(companyId: string): Promise<{
    totalTemplates: number;
    totalUsage: number;
    topTemplates: Array<{
      id: string;
      name: string;
      usageCount: number;
    }>;
    categoriesStats: Array<{
      category: string;
      count: number;
    }>;
  }> {
    try {
      const [totalTemplates, totalUsage, topTemplates, categoriesStats] = await Promise.all([
        prisma.messageTemplate.count({
          where: { companyId, isActive: true }
        }),
        prisma.messageTemplate.aggregate({
          where: { companyId, isActive: true },
          _sum: { usageCount: true }
        }),
        prisma.messageTemplate.findMany({
          where: { companyId, isActive: true },
          select: {
            id: true,
            name: true,
            usageCount: true
          },
          orderBy: { usageCount: 'desc' },
          take: 5
        }),
        prisma.messageTemplate.groupBy({
          by: ['category'],
          where: { companyId, isActive: true },
          _count: { category: true }
        })
      ]);

      return {
        totalTemplates,
        totalUsage: totalUsage._sum.usageCount || 0,
        topTemplates,
        categoriesStats: categoriesStats.map(stat => ({
          category: stat.category || 'Sin categoría',
          count: stat._count.category
        }))
      };
    } catch (error) {
      logger.error('Error getting usage stats:', error);
      throw error;
    }
  }

  // Crear plantillas por defecto para una empresa
  static async createDefaultTemplates(companyId: string, userId: string): Promise<void> {
    try {
      const defaultTemplates = [
        {
          name: 'Saludo inicial',
          content: '¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?',
          category: 'saludo',
          shortcut: '/hola',
          isShared: true
        },
        {
          name: 'Despedida',
          content: 'Gracias por contactarnos. ¡Que tengas un excelente día!',
          category: 'despedida',
          shortcut: '/adios',
          isShared: true
        },
        {
          name: 'Información de horarios',
          content: 'Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 horas.',
          category: 'información',
          shortcut: '/horario',
          isShared: true
        },
        {
          name: 'Solicitar información',
          content: 'Para poder ayudarte mejor, ¿podrías proporcionarnos más información sobre tu consulta?',
          category: 'consulta',
          shortcut: '/info',
          isShared: true
        },
        {
          name: 'Transferir a especialista',
          content: 'Te voy a transferir con un especialista que podrá ayudarte mejor. Un momento por favor.',
          category: 'transferencia',
          shortcut: '/transferir',
          isShared: true
        }
      ];

      for (const template of defaultTemplates) {
        await this.createTemplate(template, companyId, userId);
      }

      logger.info(`Plantillas por defecto creadas para empresa ${companyId}`);
    } catch (error) {
      logger.error('Error creating default templates:', error);
      throw error;
    }
  }
}

export default MessageTemplateService; 