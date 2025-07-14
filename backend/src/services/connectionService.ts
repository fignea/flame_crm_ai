import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ConnectionCreateData {
  name: string;
  type: 'whatsapp_web' | 'whatsapp_business' | 'instagram' | 'facebook';
  companyId: string;
  isDefault?: boolean;
  webhookUrl?: string;
  settings?: any;
}

export interface ConnectionUpdateData {
  name?: string;
  status?: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  qrcode?: string;
  accessToken?: string;
  retries?: number;
  isDefault?: boolean;
  isActive?: boolean;
  webhookByEvents?: boolean;
  webhookUrl?: string;
  settings?: any;
}

export const connectionService = {
  // Obtener todas las conexiones de una empresa
  async getAll(companyId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    
    if (params?.type) {
      where.type = params.type;
    }
    
    if (params?.status) {
      where.status = params.status;
    }

    const [connections, total] = await Promise.all([
      prisma.connection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.connection.count({ where })
    ]);

    return {
      data: connections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // Obtener una conexión por ID
  async getById(id: string, companyId: string) {
    return await prisma.connection.findFirst({
      where: { id, companyId }
    });
  },

  // Crear nueva conexión
  async create(data: ConnectionCreateData) {
    // Si es predeterminada, desactivar otras conexiones predeterminadas del mismo tipo
    if (data.isDefault) {
      await prisma.connection.updateMany({
        where: {
          companyId: data.companyId,
          type: data.type,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const prismaData: any = {
        name: data.name,
        type: data.type,
        companyId: data.companyId,
        status: 'DISCONNECTED',
        retries: 0,
        isDefault: data.isDefault || false,
        isActive: true,
        webhookByEvents: false,
      webhookUrl: data.webhookUrl || null
    };

    // Solo agregar settings si está definido y no es null
    if (data.settings !== undefined && data.settings !== null) {
      prismaData.settings = data.settings;
    }

    return await prisma.connection.create({
      data: prismaData
    });
  },

  // Actualizar conexión
  async update(id: string, companyId: string, data: ConnectionUpdateData) {
    // Si se está marcando como predeterminada, desactivar otras
    if (data.isDefault) {
      const connection = await prisma.connection.findFirst({
        where: { id, companyId }
      });
      
      if (connection) {
        await prisma.connection.updateMany({
          where: {
            companyId,
            type: connection.type,
            isDefault: true,
            id: { not: id }
          },
          data: { isDefault: false }
        });
      }
    }

    return await prisma.connection.update({
      where: { id },
      data
    });
  },

  // Eliminar conexión
  async delete(id: string, companyId: string) {
    // Primero verificar que la conexión pertenece a la empresa
    const connection = await prisma.connection.findFirst({
      where: { id, companyId }
    });

    if (!connection) {
      throw new Error('Conexión no encontrada o no autorizada');
    }

    return await prisma.connection.delete({
      where: { id }
    });
  },

  // Obtener conexión predeterminada por tipo
  async getDefault(companyId: string, type: string) {
    return await prisma.connection.findFirst({
      where: {
        companyId,
        type,
        isDefault: true,
        isActive: true
      }
    });
  },

  // Obtener conexiones activas
  async getActive(companyId: string) {
    return await prisma.connection.findMany({
      where: {
        companyId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  // Obtener conexiones por tipo
  async getByType(companyId: string, type: string) {
    return await prisma.connection.findMany({
      where: {
        companyId,
        type,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  // Actualizar estado de conexión
  async updateStatus(id: string, status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR', qrcode?: string) {
    return await prisma.connection.update({
      where: { id },
      data: { 
        status,
        qrcode: qrcode || null,
        updatedAt: new Date()
      }
    });
  },

  // Incrementar reintentos
  async incrementRetries(id: string) {
    return await prisma.connection.update({
      where: { id },
      data: {
        retries: { increment: 1 },
        updatedAt: new Date()
      }
    });
  },

  // Resetear reintentos
  async resetRetries(id: string) {
    return await prisma.connection.update({
      where: { id },
      data: {
        retries: 0,
        updatedAt: new Date()
      }
    });
  }
}; 