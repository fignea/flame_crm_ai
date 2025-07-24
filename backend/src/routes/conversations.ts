import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware } from '../middleware/auth';
import { getIO } from '../services/socketService';
import { sendMessage as sendWhatsAppMessage, sendWhatsAppLocation } from '../services/whatsappService';

const router = Router();

// Middleware de autenticación para todas las rutas de conversaciones
router.use(authMiddleware);

// Marcar como leída
router.patch('/:conversationId/read', async (req: any, res) => {
  const { conversationId } = req.params;
  const { companyId } = req.user;

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, connection: { companyId } },
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversación no encontrada.' });
    }

    await prisma.message.updateMany({
      where: { conversationId, fromMe: false, status: { not: 'read' } },
      data: { status: 'read' },
    });
    
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });
    
    const io = getIO();
    io.to(`company-${companyId}`).emit('conversationUpdated', { 
      conversationId, 
      unreadCount: 0 
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Obtener todas las conversaciones con filtros avanzados
router.get('/', async (req: any, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      connectionId = 'all', 
      status = 'all',
      assignedTo = 'all',
      dateFrom,
      dateTo,
      tags,
      hasTicket,
      messageCount,
      responseTime,
      messageType,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const companyId = req.user.companyId;

    const where: any = {
      connection: {
        companyId: companyId
      }
    };

    // Filtro de búsqueda general mejorado
    if (search) {
      where.OR = [
        { contact: { name: { contains: String(search), mode: 'insensitive' } } },
        { contact: { number: { contains: String(search) } } },
        { contact: { email: { contains: String(search), mode: 'insensitive' } } },
        { contact: { companyName: { contains: String(search), mode: 'insensitive' } } },
        { messages: { some: { content: { contains: String(search), mode: 'insensitive' } } } }
      ];
    }

    // Filtro por conexión
    if (connectionId !== 'all') where.connectionId = connectionId;
    
    // Filtro por estado de lectura
    if (status === 'unread') where.unreadCount = { gt: 0 };
    if (status === 'read') where.unreadCount = 0;
    
    // Filtro por agente asignado
    if (assignedTo !== 'all') {
      if (assignedTo === 'unassigned') {
        where.userId = null;
      } else {
        where.userId = assignedTo;
      }
    }

    // Filtro por rango de fechas
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Filtro por etiquetas
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.contact = {
        ...where.contact,
        tags: {
          some: {
            OR: tagArray.map(tag => ({
              OR: [
                { attribute: { contains: tag, mode: 'insensitive' } },
                { value: { contains: tag, mode: 'insensitive' } }
              ]
            }))
          }
        }
      };
    }

    // Filtro por existencia de ticket
    if (hasTicket !== undefined) {
      if (!where.contact) {
        where.contact = {};
      }
      if (hasTicket === 'true') {
        where.contact.tickets = { some: {} };
      } else if (hasTicket === 'false') {
        where.contact.tickets = { none: {} };
      }
    }

    // Filtro por número de mensajes
    if (messageCount) {
      const countFilter: any = {};
      if (messageCount === 'none') {
        countFilter.messages = { none: {} };
      } else if (messageCount === 'few') {
        countFilter.messages = { some: {} };
      } else if (messageCount === 'many') {
        // Conversaciones con más de 10 mensajes
        countFilter.messages = { some: { take: 11 } };
      }
      where.contact = { ...where.contact, ...countFilter };
    }

    // Filtro por tipo de mensaje
    if (messageType) {
      where.messages = {
        some: {
          OR: [
            { mediaType: messageType },
            ...(messageType === 'text' ? [{ mediaType: null }] : [])
          ]
        }
      };
    }

    // Configurar ordenamiento
    const orderBy: any = {};
    if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'contactName') {
      orderBy.contact = { name: sortOrder };
    } else if (sortBy === 'unreadCount') {
      orderBy.unreadCount = sortOrder;
    } else {
      orderBy.updatedAt = 'desc';
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        contact: { 
          select: { 
            id: true, 
            name: true, 
            number: true, 
            avatar: true,
            email: true,
            companyName: true,
            tags: true
          } 
        },
        connection: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy,
      skip,
      take: Number(limit),
    });

    // Buscar tickets asociados a cada conversación
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: conversations.map((c: any) => ({ contactId: c.contactId, connectionId: c.connectionId }))
      },
      include: { tags: true },
    });

    // Mapear tickets por contactId-connectionId
    const ticketMap = new Map();
    tickets.forEach((t: any) => {
      ticketMap.set(`${t.contactId}-${t.connectionId}`, t);
    });

    const conversationIds = conversations.map((c: any) => c.id);
    const lastMessages = await prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      orderBy: { timestamp: 'desc' },
      distinct: ['conversationId'],
      select: {
        id: true,
        content: true,
        fromMe: true,
        timestamp: true,
        status: true,
        conversationId: true,
      },
    });

    const lastMessageMap = new Map(lastMessages.map((m: any) => [m.conversationId, m]));

    // Aplicar filtros adicionales post-query
    let filteredConversations = conversations;

    // Filtro por tiempo de respuesta (si se implementa)
    if (responseTime) {
      filteredConversations = filteredConversations.filter((c: any) => {
        const lastMessage = lastMessageMap.get(c.id);
        if (!lastMessage || lastMessage.fromMe) return true;
        
        const now = new Date();
        const messageTime = new Date(lastMessage.timestamp);
        const diffHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
        
        switch (responseTime) {
          case 'immediate': return diffHours <= 1;
          case 'recent': return diffHours <= 24;
          case 'overdue': return diffHours > 24;
          default: return true;
        }
      });
    }

    // Filtro por número de mensajes (refinamiento)
    if (messageCount) {
      filteredConversations = filteredConversations.filter((c: any) => {
        const count = c._count.messages;
        switch (messageCount) {
          case 'none': return count === 0;
          case 'few': return count >= 1 && count <= 10;
          case 'many': return count > 10;
          default: return true;
        }
      });
    }

    const conversationsWithTicket = filteredConversations.map((c: any) => {
      const ticket = ticketMap.get(`${c.contactId}-${c.connectionId}`);
      return {
        ...c,
        lastMessage: lastMessageMap.get(c.id) || null,
        messageCount: c._count.messages,
        ticket: ticket
          ? {
              id: ticket.id,
              status: ticket.status,
              subject: ticket.subject,
              tags: ticket.tags
            }
          : null,
      };
    });

    const total = await prisma.conversation.count({ where });

    // Obtener estadísticas adicionales para los filtros
    const stats = {
      unreadCount: await prisma.conversation.count({ 
        where: { 
          ...where, 
          unreadCount: { gt: 0 } 
        } 
      }),
      assignedCount: await prisma.conversation.count({ 
        where: { 
          ...where, 
          userId: { not: null } 
        } 
      }),
      unassignedCount: await prisma.conversation.count({ 
        where: { 
          ...where, 
          userId: null 
        } 
      }),
      withTicketCount: await prisma.conversation.count({
        where: {
          ...where,
          contact: {
            ...where.contact,
            tickets: { some: {} }
          }
        }
      })
    };

    return res.json({
      conversations: conversationsWithTicket,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(Number(total) / Number(limit)),
      },
      stats,
      filters: {
        applied: {
          search: search || null,
          connectionId: connectionId !== 'all' ? connectionId : null,
          status: status !== 'all' ? status : null,
          assignedTo: assignedTo !== 'all' ? assignedTo : null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          tags: tags || null,
          hasTicket: hasTicket || null,
          messageCount: messageCount || null,
          responseTime: responseTime || null,
          messageType: messageType || null
        },
        sort: {
          by: sortBy,
          order: sortOrder
        }
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener opciones disponibles para filtros
router.get('/filter-options', async (req: any, res) => {
  try {
    const companyId = req.user.companyId;

    // Obtener agentes disponibles
    const agents = await prisma.user.findMany({
      where: { 
        companyId,
        isActive: true,
        role: { name: { in: ['agent', 'admin', 'manager'] } }
      },
      select: { id: true, name: true, email: true }
    });

    // Obtener conexiones disponibles
    const connections = await prisma.connection.findMany({
      where: { companyId },
      select: { id: true, name: true, type: true }
    });

    // Obtener etiquetas más comunes
    const commonTags = await prisma.tag.groupBy({
      by: ['attribute', 'value'],
      where: { 
        contacts: { some: { companyId } },
        createdAt: { 
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Último mes
        }
      },
      _count: { attribute: true },
      orderBy: { _count: { attribute: 'desc' } },
      take: 20
    });

    // Obtener tipos de mensaje más comunes
    const messageTypes = await prisma.message.groupBy({
      by: ['mediaType'],
      where: { 
        connection: { companyId },
        mediaType: { not: null }
      },
      _count: { mediaType: true },
      orderBy: { _count: { mediaType: 'desc' } }
    });

    return res.json({
      agents,
      connections,
      commonTags: commonTags.map((tag: any) => ({
        label: `${tag.attribute}: ${tag.value}`,
        value: tag.value,
        attribute: tag.attribute,
        count: tag._count?.attribute || 0
      })),
      messageTypes: messageTypes.map((type: any) => ({
        label: type.mediaType,
        value: type.mediaType,
        count: type._count?.mediaType || 0
      })),
      dateRanges: [
        { label: 'Hoy', value: 'today' },
        { label: 'Ayer', value: 'yesterday' },
        { label: 'Esta semana', value: 'thisWeek' },
        { label: 'Semana pasada', value: 'lastWeek' },
        { label: 'Este mes', value: 'thisMonth' },
        { label: 'Mes pasado', value: 'lastMonth' },
        { label: 'Últimos 3 meses', value: 'last3Months' },
        { label: 'Personalizado', value: 'custom' }
      ],
      statusOptions: [
        { label: 'Todos', value: 'all' },
        { label: 'No leídos', value: 'unread' },
        { label: 'Leídos', value: 'read' }
      ],
      assignmentOptions: [
        { label: 'Todos', value: 'all' },
        { label: 'Sin asignar', value: 'unassigned' },
        ...agents.map(agent => ({
          label: agent.name,
          value: agent.id
        }))
      ],
      messageCountOptions: [
        { label: 'Cualquier cantidad', value: 'all' },
        { label: 'Sin mensajes', value: 'none' },
        { label: 'Pocos (1-10)', value: 'few' },
        { label: 'Muchos (10+)', value: 'many' }
      ],
      responseTimeOptions: [
        { label: 'Cualquier tiempo', value: 'all' },
        { label: 'Inmediato (< 1h)', value: 'immediate' },
        { label: 'Reciente (< 24h)', value: 'recent' },
        { label: 'Atrasado (> 24h)', value: 'overdue' }
      ],
      sortOptions: [
        { label: 'Última actualización', value: 'updatedAt' },
        { label: 'Fecha de creación', value: 'createdAt' },
        { label: 'Nombre del contacto', value: 'contactName' },
        { label: 'Mensajes no leídos', value: 'unreadCount' }
      ]
    });
  } catch (error) {
    console.error('Error getting filter options:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear una nueva conversación (o encontrar una existente)
router.post('/', async (req: any, res) => {
  try {
    const { contactId, connectionId } = req.body;
    const companyId = req.user.companyId;

    if (!contactId || !connectionId) {
      return res.status(400).json({ error: 'contactId y connectionId son requeridos' });
    }

    // Verificar que el contacto y la conexión pertenezcan a la empresa del usuario
    const contact = await prisma.contact.findFirst({ where: { id: contactId, companyId } });
    const connection = await prisma.connection.findFirst({ where: { id: connectionId, companyId } });

    if (!contact || !connection) {
      return res.status(404).json({ error: 'Contacto o conexión no encontrados' });
    }

    // Buscar si ya existe una conversación
    let conversation = await prisma.conversation.findFirst({
      where: { contactId, connectionId },
      include: {
        contact: { select: { id: true, name: true, number: true, avatar: true } },
        connection: { select: { id: true, name: true } },
      },
    });

    if (conversation) {
      // Si existe, devolverla
      return res.status(200).json(conversation);
    }

    // Si no existe, crearla
    conversation = await prisma.conversation.create({
      data: {
        contactId,
        connectionId,
        unreadCount: 0,
      },
      include: {
        contact: { select: { id: true, name: true, number: true, avatar: true } },
        connection: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener mensajes de una conversación
router.get('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
      skip,
      take: Number(limit),
    });

    const total = await prisma.message.count({ where: { conversationId } });

    /*
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });
    */

    return res.json({
      messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(Number(total) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Enviar mensaje
router.post('/:conversationId/messages', async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    const { 
      content, 
      mediaUrl, 
      mediaType,
      locationLatitude,
      locationLongitude,
      locationAddress,
      fileName,
      fileSize,
      fileMimeType,
      metadata
    } = req.body;
    const io = getIO();

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true, connection: true },
    });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    let sentMessage;
    
    // Solo enviar a WhatsApp si no es un mensaje de archivo local
    if (mediaType !== 'document' && mediaType !== 'image' && mediaType !== 'video' && mediaType !== 'audio') {
      try {
        if (mediaType === 'location') {
          // Enviar ubicación a WhatsApp
          sentMessage = await sendWhatsAppLocation(
            conversation.connectionId, 
            conversation.contact.number, 
            locationLatitude, 
            locationLongitude,
            locationAddress
          );
        } else {
          // Enviar mensaje normal
          sentMessage = await sendWhatsAppMessage(conversation.connectionId, conversation.contact.number, content);
        }
        console.log('🔍 [DEBUG] sentMessage completo:', JSON.stringify(sentMessage, null, 2));
      } catch (error: any) {
        console.error('WhatsApp Service Error:', error.message);
        return res.status(400).json({ error: error.message });
      }
    }

    const messageData: any = {
      content: content || '',
      fromMe: true,
      status: 'sent',
      conversationId,
      contactId: conversation.contactId,
      connectionId: conversation.connectionId,
      mediaUrl,
      mediaType,
      locationLatitude,
      locationLongitude,
      locationAddress,
      fileName,
      fileSize,
      fileMimeType,
      metadata,
      sentAt: new Date(),
    };

    // Solo agregar el ID si existe
    if (sentMessage?.key?.id) {
      messageData.id = sentMessage.key.id;
    }

    const message = await prisma.message.create({
      data: messageData,
      include: { contact: true, connection: true },
    });

    console.log('🔍 [DEBUG] Mensaje guardado en BD:', message);

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    io.to(req.user.companyId).emit('newMessage', message);
    return res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Subir archivo
router.post('/:conversationId/upload', async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    
    // Aquí implementarías la lógica de subida de archivos
    // Por ejemplo, usando multer o similar
    
    // Por ahora, retornamos un URL de prueba
    const fileUrl = `/uploads/${conversationId}/${Date.now()}_${req.file?.originalname || 'file'}`;
    
    return res.json({
      mediaUrl: fileUrl,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      fileMimeType: req.file?.mimetype
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Marcar mensaje como leído

// Convertir una conversación en un ticket
router.post('/:conversationId/to-ticket', async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    const { tagIds, subject } = req.body; // Recibir subject
    const companyId = req.user.companyId;

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, connection: { companyId } },
      include: { messages: true },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Opcional: Verificar si los mensajes ya pertenecen a un ticket
    const messagesInTicket = await prisma.message.count({
      where: { conversationId, ticketId: { not: null } },
    });
    if ((messagesInTicket as number) > 0) {
      return res.status(400).json({ error: 'Esta conversación ya ha sido convertida en un ticket.' });
    }

    const newTicket = await prisma.ticket.create({
      data: {
        contactId: conversation.contactId,
        connectionId: conversation.connectionId,
        userId: req.user.id, // Asignar al usuario actual
        status: 'open',
        subject: subject || null, // Guardar el subject
        lastMessage: conversation.messages[conversation.messages.length - 1]?.content.substring(0, 100) ?? null,
        // Conectar los tags directamente en la creación
        tags: {
          connect: tagIds ? tagIds.map((id: string) => ({ id })) : [],
        },
      },
    });

    // Asociar todos los mensajes de la conversación al nuevo ticket
    await prisma.message.updateMany({
      where: { conversationId },
      data: { ticketId: newTicket.id },
    });

    const ticketWithTags = await prisma.ticket.findUnique({
      where: { id: newTicket.id },
      include: { tags: true }, // La inclusión ahora es directa
    });

    return res.status(201).json(ticketWithTags);
  } catch (error) {
    console.error('Error converting conversation to ticket:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 