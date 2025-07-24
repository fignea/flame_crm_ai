import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prismaMock } from '../setup';
import { ConversationService } from '../../src/services/conversationService';

// Mock de dependencias
vi.mock('../../src/prisma/client', () => ({
  prisma: prismaMock
}));

describe('ConversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createConversation', () => {
    it('debería crear una nueva conversación exitosamente', async () => {
      const mockConversation = {
        id: 'conv1',
        connectionId: 'conn1',
        contactPhone: '+1234567890',
        contactName: 'Juan Pérez',
        lastMessage: 'Hola!',
        lastMessageAt: new Date(),
        unreadCount: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.conversation.create.mockResolvedValue(mockConversation);

      const result = await ConversationService.createConversation({
        connectionId: 'conn1',
        contactPhone: '+1234567890',
        contactName: 'Juan Pérez',
        lastMessage: 'Hola!'
      });

      expect(result).toEqual(mockConversation);
      expect(prismaMock.conversation.create).toHaveBeenCalledWith({
        data: {
          connectionId: 'conn1',
          contactPhone: '+1234567890',
          contactName: 'Juan Pérez',
          lastMessage: 'Hola!',
          lastMessageAt: expect.any(Date),
          unreadCount: 1,
          isActive: true
        }
      });
    });

    it('debería manejar errores al crear conversación', async () => {
      prismaMock.conversation.create.mockRejectedValue(new Error('Database error'));

      await expect(ConversationService.createConversation({
        connectionId: 'conn1',
        contactPhone: '+1234567890',
        contactName: 'Juan Pérez',
        lastMessage: 'Hola!'
      })).rejects.toThrow('Database error');
    });
  });

  describe('getConversations', () => {
    it('debería obtener conversaciones con filtros', async () => {
      const mockConversations = [
        {
          id: 'conv1',
          connectionId: 'conn1',
          contactPhone: '+1234567890',
          contactName: 'Juan Pérez',
          lastMessage: 'Hola!',
          lastMessageAt: new Date(),
          unreadCount: 1,
          isActive: true
        },
        {
          id: 'conv2',
          connectionId: 'conn1',
          contactPhone: '+0987654321',
          contactName: 'Ana García',
          lastMessage: 'Gracias!',
          lastMessageAt: new Date(),
          unreadCount: 0,
          isActive: true
        }
      ];

      prismaMock.conversation.findMany.mockResolvedValue(mockConversations);

      const result = await ConversationService.getConversations({
        connectionId: 'conn1',
        search: '',
        page: 1,
        limit: 10
      });

      expect(result).toEqual(mockConversations);
      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith({
        where: {
          connectionId: 'conn1',
          isActive: true
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          lastMessageAt: 'desc'
        },
        skip: 0,
        take: 10
      });
    });

    it('debería filtrar conversaciones por búsqueda', async () => {
      const mockConversations = [
        {
          id: 'conv1',
          contactName: 'Juan Pérez',
          contactPhone: '+1234567890'
        }
      ];

      prismaMock.conversation.findMany.mockResolvedValue(mockConversations);

      await ConversationService.getConversations({
        connectionId: 'conn1',
        search: 'Juan',
        page: 1,
        limit: 10
      });

      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith({
        where: {
          connectionId: 'conn1',
          isActive: true,
          OR: [
            { contactName: { contains: 'Juan', mode: 'insensitive' } },
            { contactPhone: { contains: 'Juan' } },
            { lastMessage: { contains: 'Juan', mode: 'insensitive' } }
          ]
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          lastMessageAt: 'desc'
        },
        skip: 0,
        take: 10
      });
    });
  });

  describe('getConversationById', () => {
    it('debería obtener una conversación por ID', async () => {
      const mockConversation = {
        id: 'conv1',
        connectionId: 'conn1',
        contactPhone: '+1234567890',
        contactName: 'Juan Pérez',
        messages: [
          {
            id: 'msg1',
            content: 'Hola!',
            fromMe: false,
            createdAt: new Date()
          }
        ]
      };

      prismaMock.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await ConversationService.getConversationById('conv1');

      expect(result).toEqual(mockConversation);
      expect(prismaMock.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: 'conv1' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              mediaFiles: true,
              reactions: true
            }
          },
          connection: true
        }
      });
    });

    it('debería devolver null si no encuentra la conversación', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(null);

      const result = await ConversationService.getConversationById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateConversation', () => {
    it('debería actualizar una conversación exitosamente', async () => {
      const mockUpdatedConversation = {
        id: 'conv1',
        contactName: 'Juan Pérez Actualizado',
        lastMessage: 'Mensaje actualizado',
        updatedAt: new Date()
      };

      prismaMock.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await ConversationService.updateConversation('conv1', {
        contactName: 'Juan Pérez Actualizado',
        lastMessage: 'Mensaje actualizado'
      });

      expect(result).toEqual(mockUpdatedConversation);
      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv1' },
        data: {
          contactName: 'Juan Pérez Actualizado',
          lastMessage: 'Mensaje actualizado',
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('deleteConversation', () => {
    it('debería eliminar una conversación (soft delete)', async () => {
      const mockUpdatedConversation = {
        id: 'conv1',
        isActive: false,
        updatedAt: new Date()
      };

      prismaMock.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await ConversationService.deleteConversation('conv1');

      expect(result).toEqual(mockUpdatedConversation);
      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv1' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('markAsRead', () => {
    it('debería marcar una conversación como leída', async () => {
      const mockUpdatedConversation = {
        id: 'conv1',
        unreadCount: 0,
        updatedAt: new Date()
      };

      prismaMock.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await ConversationService.markAsRead('conv1');

      expect(result).toEqual(mockUpdatedConversation);
      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv1' },
        data: {
          unreadCount: 0,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('assignToUser', () => {
    it('debería asignar una conversación a un usuario', async () => {
      const mockUpdatedConversation = {
        id: 'conv1',
        userId: 'user1',
        updatedAt: new Date()
      };

      prismaMock.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await ConversationService.assignToUser('conv1', 'user1');

      expect(result).toEqual(mockUpdatedConversation);
      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv1' },
        data: {
          userId: 'user1',
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('getConversationStats', () => {
    it('debería obtener estadísticas de conversaciones', async () => {
      const mockStats = {
        total: 100,
        active: 25,
        unread: 5,
        assigned: 80
      };

      prismaMock.conversation.count.mockResolvedValueOnce(100); // total
      prismaMock.conversation.count.mockResolvedValueOnce(25);  // active
      prismaMock.conversation.count.mockResolvedValueOnce(5);   // unread
      prismaMock.conversation.count.mockResolvedValueOnce(80);  // assigned

      const result = await ConversationService.getConversationStats('conn1');

      expect(result).toEqual(mockStats);
      expect(prismaMock.conversation.count).toHaveBeenCalledTimes(4);
    });
  });

  describe('searchConversations', () => {
    it('debería buscar conversaciones por texto', async () => {
      const mockConversations = [
        {
          id: 'conv1',
          contactName: 'Juan Pérez',
          lastMessage: 'Hola mundo'
        }
      ];

      prismaMock.conversation.findMany.mockResolvedValue(mockConversations);

      const result = await ConversationService.searchConversations('conn1', 'mundo');

      expect(result).toEqual(mockConversations);
      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith({
        where: {
          connectionId: 'conn1',
          isActive: true,
          OR: [
            { contactName: { contains: 'mundo', mode: 'insensitive' } },
            { contactPhone: { contains: 'mundo' } },
            { lastMessage: { contains: 'mundo', mode: 'insensitive' } }
          ]
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: {
          lastMessageAt: 'desc'
        }
      });
    });
  });

  describe('getConversationsByStatus', () => {
    it('debería obtener conversaciones por estado', async () => {
      const mockConversations = [
        {
          id: 'conv1',
          unreadCount: 5
        }
      ];

      prismaMock.conversation.findMany.mockResolvedValue(mockConversations);

      const result = await ConversationService.getConversationsByStatus('conn1', 'unread');

      expect(result).toEqual(mockConversations);
      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith({
        where: {
          connectionId: 'conn1',
          isActive: true,
          unreadCount: { gt: 0 }
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: {
          lastMessageAt: 'desc'
        }
      });
    });

    it('debería obtener conversaciones asignadas', async () => {
      const mockConversations = [
        {
          id: 'conv1',
          userId: 'user1'
        }
      ];

      prismaMock.conversation.findMany.mockResolvedValue(mockConversations);

      const result = await ConversationService.getConversationsByStatus('conn1', 'assigned');

      expect(result).toEqual(mockConversations);
      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith({
        where: {
          connectionId: 'conn1',
          isActive: true,
          userId: { not: null }
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: {
          lastMessageAt: 'desc'
        }
      });
    });
  });

  describe('incrementUnreadCount', () => {
    it('debería incrementar el contador de mensajes no leídos', async () => {
      const mockUpdatedConversation = {
        id: 'conv1',
        unreadCount: 3,
        updatedAt: new Date()
      };

      prismaMock.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await ConversationService.incrementUnreadCount('conv1');

      expect(result).toEqual(mockUpdatedConversation);
      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv1' },
        data: {
          unreadCount: { increment: 1 },
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('updateLastMessage', () => {
    it('debería actualizar el último mensaje de la conversación', async () => {
      const mockUpdatedConversation = {
        id: 'conv1',
        lastMessage: 'Nuevo mensaje',
        lastMessageAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.conversation.update.mockResolvedValue(mockUpdatedConversation);

      const result = await ConversationService.updateLastMessage('conv1', 'Nuevo mensaje');

      expect(result).toEqual(mockUpdatedConversation);
      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv1' },
        data: {
          lastMessage: 'Nuevo mensaje',
          lastMessageAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });
  });
});

export default {}; 