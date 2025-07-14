import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware } from '../middleware/auth';
import { getIO } from '../services/socketService';
import { sendMessage as sendWhatsAppMessage } from '../services/whatsappService';

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


// Obtener todas las conversaciones
router.get('/', async (req: any, res) => {
  try {
    const { page = 1, limit = 20, search = '', connectionId = 'all', status = 'all' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const companyId = req.user.companyId;

    const where: any = {
      connection: {
        companyId: companyId
      }
    };
    if (search) {
      where.OR = [
        { contact: { name: { contains: String(search), mode: 'insensitive' } } },
        { contact: { number: { contains: String(search) } } },
      ];
    }
    if (connectionId !== 'all') where.connectionId = connectionId;
    if (status === 'unread') where.unreadCount = { gt: 0 };
    if (status === 'read') where.unreadCount = 0;

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, number: true, avatar: true } },
        connection: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
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

    const conversationsWithTicket = conversations.map((c: any) => {
      const ticket = ticketMap.get(`${c.contactId}-${c.connectionId}`);
      return {
        ...c,
        lastMessage: lastMessageMap.get(c.id) || null,
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

    return res.json({
      conversations: conversationsWithTicket,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(Number(total) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
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
    const { content, mediaUrl, mediaType } = req.body;
    const io = getIO();

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true, connection: true },
    });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    let sentMessage;
    try {
      sentMessage = await sendWhatsAppMessage(conversation.connectionId, conversation.contact.number, content);
      console.log('🔍 [DEBUG] sentMessage completo:', JSON.stringify(sentMessage, null, 2));
      console.log('🔍 [DEBUG] sentMessage.key:', sentMessage?.key);
      console.log('🔍 [DEBUG] sentMessage.key.id:', sentMessage?.key?.id);
    } catch (error: any) {
      console.error('WhatsApp Service Error:', error.message);
      return res.status(400).json({ error: error.message });
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