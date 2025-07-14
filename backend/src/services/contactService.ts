import { PrismaClient } from '@prisma/client';
import { normalizeNumber } from '../utils/phoneUtils';

const prisma = new PrismaClient();

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
  birthday?: Date | string;
  status?: string;
  customerType?: string;
  socials?: any;
  notes?: string;
  companyId: string;
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
  birthday?: Date | string;
  status?: string;
  customerType?: string;
  socials?: any;
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
  birthday?: string; // formato YYYY-MM-DD
  notes?: string;
  socials?: string; // búsqueda parcial en cualquier red social
}

export const contactService = {
  // Obtener todos los contactos con paginación y filtros
  async getAll(companyId: string, filters: ContactFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    
    // Filtro de búsqueda general
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { number: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { position: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { state: { contains: filters.search, mode: 'insensitive' } },
        { country: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filtros avanzados por campo
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }
    if (filters.state) {
      where.state = { contains: filters.state, mode: 'insensitive' };
    }
    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }
    if (filters.companyName) {
      where.companyName = { contains: filters.companyName, mode: 'insensitive' };
    }
    if (filters.position) {
      where.position = { contains: filters.position, mode: 'insensitive' };
    }
    if (filters.customerType) {
      where.customerType = { contains: filters.customerType, mode: 'insensitive' };
    }
    if (filters.notes) {
      where.notes = { contains: filters.notes, mode: 'insensitive' };
    }
    if (filters.birthday) {
      // Buscar por cumpleaños exacto (YYYY-MM-DD)
      where.birthday = { equals: new Date(filters.birthday) };
    }

    // Filtro por estado (bloqueado/no bloqueado)
    if (filters.status === 'blocked') {
      where.isBlocked = true;
    } else if (filters.status === 'active') {
      where.isBlocked = false;
    }

    // Filtro por tags actualizado
    if (filters.tag) {
      where.tags = {
        some: {
          OR: [
            { attribute: { contains: filters.tag, mode: 'insensitive' } },
            { value: { contains: filters.tag, mode: 'insensitive' } }
          ]
        }
      };
    }

    // Filtro por redes sociales (JSON)
    if (filters.socials) {
      where.OR = where.OR || [];
      where.OR.push(
        { socials: { path: ['linkedin'], string_contains: filters.socials, mode: 'insensitive' } },
        { socials: { path: ['facebook'], string_contains: filters.socials, mode: 'insensitive' } },
        { socials: { path: ['instagram'], string_contains: filters.socials, mode: 'insensitive' } },
        { socials: { path: ['x'], string_contains: filters.socials, mode: 'insensitive' } }
      );
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          tags: true,
          messages: { select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
          tickets: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.contact.count({ where })
    ]);

    const transformedContacts = contacts.map((contact: any) => ({
      ...contact,
      lastContact: contact.messages[0]?.createdAt || contact.createdAt,
      ticketCount: contact.tickets.length,
      lastTicket: contact.tickets[0],
    }));

    return {
      data: transformedContacts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  },

  // Obtener un contacto por ID
  async getById(id: string, companyId: string) {
    const contact = await prisma.contact.findFirst({
      where: { id, companyId },
      include: {
        tags: true, // Inclusión directa
        tickets: { include: { messages: { orderBy: { createdAt: 'desc' }, take: 5 } }, orderBy: { createdAt: 'desc' }, take: 10 },
        messages: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    });

    if (!contact) return null;
    return contact; // Devolver el objeto completo
  },

  // Crear nuevo contacto
  async create(data: ContactCreateData) {
    const normalizedNumber = normalizeNumber(data.number);

    // Verificar si ya existe un contacto con el mismo número en la empresa
    const existingContact = await prisma.contact.findFirst({
      where: {
        number: normalizedNumber,
        companyId: data.companyId
      }
    });

    if (existingContact) {
      throw new Error('Ya existe un contacto con este número');
    }

    return await prisma.contact.create({
      data: {
        name: data.name,
        number: normalizedNumber,
        email: data.email || null,
        avatar: data.avatar || null,
        isGroup: data.isGroup || false,
        isBlocked: data.isBlocked || false,
        companyName: data.companyName || null,
        position: data.position || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
        birthday: data.birthday ? new Date(data.birthday) : null,
        status: data.status || null,
        customerType: data.customerType || null,
        socials: data.socials || null,
        notes: data.notes || null,
        companyId: data.companyId
      }
    });
  },

  // Actualizar contacto
  async update(id: string, companyId: string, data: ContactUpdateData) {
    // Si se está actualizando el número, verificar que no exista otro contacto con el mismo número
    if (data.number) {
      const normalizedNumber = normalizeNumber(data.number);
      const existingContact = await prisma.contact.findFirst({
        where: {
          number: normalizedNumber,
          companyId,
          id: { not: id }
        }
      });

      if (existingContact) {
        throw new Error('Ya existe otro contacto con este número');
      }
      data.number = normalizedNumber;
    }

    // Si viene birthday como string, convertir a Date
    if (data.birthday && typeof data.birthday === 'string') {
      data.birthday = new Date(data.birthday);
    }

    return await prisma.contact.update({
      where: { id },
      data
    });
  },

  // Eliminar un contacto
  async delete(id: string, companyId: string) {
    const contact = await prisma.contact.findFirst({ where: { id, companyId }});
    if (!contact) {
      throw new Error('Contacto no encontrado o no pertenece a la empresa.');
    }
    return await prisma.contact.delete({ where: { id } });
  },

  // Obtener estadísticas de contactos
  async getStats(companyId: string) {
    const total = await prisma.contact.count({ where: { companyId } });
    const blocked = await prisma.contact.count({ where: { companyId, isBlocked: true } });
    const withTickets = await prisma.contact.count({ where: { companyId, tickets: { some: {} } } });

    // Top tags (ahora un poco más complejo, contamos instancias de tags en contactos)
    const topTagsData = await prisma.tag.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
      orderBy: {
        contacts: { _count: 'desc' },
      },
      take: 5,
    });
    
    const topTags = topTagsData.map((t: any) => ({
      id: t.id,
      attribute: t.attribute,
      value: t.value,
      count: t._count.contacts
    }));

    return {
      total,
      active: Number(total) - Number(blocked),
      blocked,
      withTickets,
      topTags,
    };
  },
  
  // Añadir tags a un contacto
  async addTags(contactId: string, companyId: string, tagIds: string[]) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, companyId } });
    if (!contact) throw new Error('Contacto no encontrado');

    return await prisma.contact.update({
      where: { id: contactId },
      data: {
        tags: {
          connect: tagIds.map(id => ({ id })),
        },
      },
      include: { tags: true },
    });
  },

  // Quitar tags de un contacto
  async removeTags(contactId: string, companyId: string, tagIds: string[]) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, companyId } });
    if (!contact) throw new Error('Contacto no encontrado');

    return await prisma.contact.update({
      where: { id: contactId },
      data: {
        tags: {
          disconnect: tagIds.map(id => ({ id })),
        },
      },
      include: { tags: true },
    });
  }
}; 