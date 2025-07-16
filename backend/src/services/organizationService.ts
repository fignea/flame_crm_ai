import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export const organizationService = {
  // Obtener todas las organizaciones con filtros y paginación
  async getAll(companyId: string, filters: OrganizationFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    // Filtro de búsqueda general
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { website: { contains: filters.search, mode: 'insensitive' } },
        { industry: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { state: { contains: filters.search, mode: 'insensitive' } },
        { country: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filtros específicos
    if (filters.industry) {
      where.industry = { contains: filters.industry, mode: 'insensitive' };
    }
    if (filters.companySize) {
      where.companySize = filters.companySize;
    }
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }
    if (filters.state) {
      where.state = { contains: filters.state, mode: 'insensitive' };
    }
    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              contacts: true,
            }
          }
        }
      }),
      prisma.organization.count({ where })
    ]);

    return {
      data: organizations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  },

  // Obtener una organización específica
  async getById(id: string, companyId: string) {
    return await prisma.organization.findFirst({
      where: { id, companyId },
      include: {
        contacts: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            contacts: true,
          }
        }
      }
    });
  },

  // Crear nueva organización
  async create(data: OrganizationCreateData, companyId: string) {
    // Validar datos requeridos
    if (!data.name?.trim()) {
      throw new Error('El nombre de la organización es requerido');
    }

    // Verificar si ya existe una organización con el mismo nombre
    const existingOrg = await prisma.organization.findFirst({
      where: {
        name: data.name,
        companyId
      }
    });

    if (existingOrg) {
      throw new Error('Ya existe una organización con este nombre');
    }

    // Validar email si se proporciona
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('El email no tiene un formato válido');
      }
    }

    // Validar website si se proporciona
    if (data.website) {
      if (!data.website.startsWith('http://') && !data.website.startsWith('https://')) {
        data.website = 'https://' + data.website;
      }
    }

    return await prisma.organization.create({
      data: {
        ...data,
        companyId,
        status: 'active'
      }
    });
  },

  // Actualizar organización
  async update(id: string, companyId: string, data: OrganizationUpdateData) {
    // Verificar que la organización existe y pertenece a la empresa
    const existingOrg = await prisma.organization.findFirst({
      where: { id, companyId }
    });

    if (!existingOrg) {
      throw new Error('Organización no encontrada');
    }

    // Validar email si se proporciona
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('El email no tiene un formato válido');
      }
    }

    // Validar website si se proporciona
    if (data.website) {
      if (!data.website.startsWith('http://') && !data.website.startsWith('https://')) {
        data.website = 'https://' + data.website;
      }
    }

    // Verificar nombre duplicado si se está cambiando
    if (data.name && data.name !== existingOrg.name) {
      const duplicateOrg = await prisma.organization.findFirst({
        where: {
          name: data.name,
          companyId,
          id: { not: id }
        }
      });

      if (duplicateOrg) {
        throw new Error('Ya existe una organización con este nombre');
      }
    }

    return await prisma.organization.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  },

  // Eliminar organización (soft delete)
  async delete(id: string, companyId: string) {
    // Verificar que la organización existe y pertenece a la empresa
    const existingOrg = await prisma.organization.findFirst({
      where: { id, companyId }
    });

    if (!existingOrg) {
      throw new Error('Organización no encontrada');
    }

    // Verificar si tiene contactos asociados
    const contactsCount = await prisma.contact.count({
      where: { organizationId: id }
    });

    if (contactsCount > 0) {
      throw new Error('No se puede eliminar la organización porque tiene contactos asociados');
    }

    // Soft delete cambiando el estado
    return await prisma.organization.update({
      where: { id },
      data: {
        status: 'inactive',
        updatedAt: new Date()
      }
    });
  },

  // Obtener estadísticas de una organización
  async getStats(id: string, companyId: string) {
    const organization = await prisma.organization.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: {
            contacts: true,
          }
        }
      }
    });

    if (!organization) {
      throw new Error('Organización no encontrada');
    }

    // Obtener estadísticas adicionales
    const [
      activeContacts,
      recentContacts,
      totalTickets
    ] = await Promise.all([
      prisma.contact.count({
        where: { organizationId: id, isBlocked: false }
      }),
      prisma.contact.count({
        where: {
          organizationId: id,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.ticket.count({
        where: { contact: { organizationId: id } }
      })
    ]);

    return {
      organization,
      stats: {
        totalContacts: organization._count.contacts,
        activeContacts,
        recentContacts,
        totalTickets
      }
    };
  },

  // Obtener todas las industrias únicas
  async getIndustries(companyId: string) {
    const industries = await prisma.organization.findMany({
      where: {
        companyId,
        industry: { not: null }
      },
      select: { industry: true },
      distinct: ['industry']
    });

    return industries.map(item => item.industry).filter(Boolean);
  },

  // Obtener tamaños de empresa únicos
  async getCompanySizes(companyId: string) {
    const sizes = await prisma.organization.findMany({
      where: {
        companyId,
        companySize: { not: null }
      },
      select: { companySize: true },
      distinct: ['companySize']
    });

    return sizes.map(item => item.companySize).filter(Boolean);
  }
}; 