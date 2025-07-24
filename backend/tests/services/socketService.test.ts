import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { SocketService } from '../../src/services/socketService';

// Mock de dependencias
vi.mock('../../src/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock de Socket.IO
const mockSocket = {
  id: 'socket123',
  userId: 'user123',
  companyId: 'company123',
  join: vi.fn(),
  leave: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  disconnect: vi.fn(),
  handshake: {
    auth: {
      token: 'valid-token'
    }
  }
};

const mockIo = {
  to: vi.fn(() => ({
    emit: vi.fn()
  })),
  in: vi.fn(() => ({
    emit: vi.fn()
  })),
  emit: vi.fn(),
  on: vi.fn(),
  use: vi.fn()
};

describe('SocketService', () => {
  let socketService: SocketService;
  let httpServer: any;
  let io: Server;

  beforeEach(() => {
    vi.clearAllMocks();
    httpServer = createServer();
    io = new Server(httpServer);
    socketService = new SocketService(io);
  });

  afterEach(() => {
    httpServer.close();
  });

  describe('handleConnection', () => {
    it('debería manejar una nueva conexión exitosamente', async () => {
      const mockUser = {
        id: 'user123',
        companyId: 'company123',
        name: 'Juan Pérez',
        isActive: true
      };

      // Mock del middleware de autenticación
      vi.spyOn(socketService as any, 'authenticateSocket').mockResolvedValue(mockUser);

      await socketService.handleConnection(mockSocket as any);

      expect(mockSocket.join).toHaveBeenCalledWith('company:company123');
      expect(mockSocket.join).toHaveBeenCalledWith('user:user123');
      expect(mockSocket.on).toHaveBeenCalledWith('join_conversation', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('leave_conversation', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('send_message', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('typing_start', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('typing_stop', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('debería rechazar conexiones no autenticadas', async () => {
      vi.spyOn(socketService as any, 'authenticateSocket').mockRejectedValue(new Error('Unauthorized'));

      await socketService.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleJoinConversation', () => {
    it('debería unir usuario a una conversación', async () => {
      const mockConversation = {
        id: 'conv123',
        connection: { companyId: 'company123' }
      };

      vi.spyOn(socketService as any, 'getConversation').mockResolvedValue(mockConversation);

      await socketService.handleJoinConversation(mockSocket as any, {
        conversationId: 'conv123'
      });

      expect(mockSocket.join).toHaveBeenCalledWith('conversation:conv123');
      expect(mockSocket.emit).toHaveBeenCalledWith('conversation_joined', {
        conversationId: 'conv123'
      });
    });

    it('debería rechazar unirse a conversación inexistente', async () => {
      vi.spyOn(socketService as any, 'getConversation').mockResolvedValue(null);

      await socketService.handleJoinConversation(mockSocket as any, {
        conversationId: 'nonexistent'
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Conversación no encontrada'
      });
    });

    it('debería rechazar acceso a conversación de otra empresa', async () => {
      const mockConversation = {
        id: 'conv123',
        connection: { companyId: 'other-company' }
      };

      vi.spyOn(socketService as any, 'getConversation').mockResolvedValue(mockConversation);

      await socketService.handleJoinConversation(mockSocket as any, {
        conversationId: 'conv123'
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Sin permisos para acceder a esta conversación'
      });
    });
  });

  describe('handleLeaveConversation', () => {
    it('debería remover usuario de una conversación', async () => {
      await socketService.handleLeaveConversation(mockSocket as any, {
        conversationId: 'conv123'
      });

      expect(mockSocket.leave).toHaveBeenCalledWith('conversation:conv123');
      expect(mockSocket.emit).toHaveBeenCalledWith('conversation_left', {
        conversationId: 'conv123'
      });
    });
  });

  describe('handleSendMessage', () => {
    it('debería enviar un mensaje exitosamente', async () => {
      const mockMessage = {
        id: 'msg123',
        conversationId: 'conv123',
        content: 'Hola mundo',
        fromMe: true,
        createdAt: new Date()
      };

      const mockConversation = {
        id: 'conv123',
        connection: { companyId: 'company123' }
      };

      vi.spyOn(socketService as any, 'getConversation').mockResolvedValue(mockConversation);
      vi.spyOn(socketService as any, 'createMessage').mockResolvedValue(mockMessage);

      await socketService.handleSendMessage(mockSocket as any, {
        conversationId: 'conv123',
        content: 'Hola mundo',
        mediaType: 'text'
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('message_sent', mockMessage);
    });

    it('debería manejar errores al enviar mensaje', async () => {
      vi.spyOn(socketService as any, 'getConversation').mockRejectedValue(new Error('Database error'));

      await socketService.handleSendMessage(mockSocket as any, {
        conversationId: 'conv123',
        content: 'Hola mundo'
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Error al enviar mensaje'
      });
    });
  });

  describe('handleTypingStart', () => {
    it('debería notificar que el usuario está escribiendo', async () => {
      const mockConversation = {
        id: 'conv123',
        connection: { companyId: 'company123' }
      };

      vi.spyOn(socketService as any, 'getConversation').mockResolvedValue(mockConversation);

      await socketService.handleTypingStart(mockSocket as any, {
        conversationId: 'conv123'
      });

      expect(mockIo.to).toHaveBeenCalledWith('conversation:conv123');
    });
  });

  describe('handleTypingStop', () => {
    it('debería notificar que el usuario dejó de escribir', async () => {
      const mockConversation = {
        id: 'conv123',
        connection: { companyId: 'company123' }
      };

      vi.spyOn(socketService as any, 'getConversation').mockResolvedValue(mockConversation);

      await socketService.handleTypingStop(mockSocket as any, {
        conversationId: 'conv123'
      });

      expect(mockIo.to).toHaveBeenCalledWith('conversation:conv123');
    });
  });

  describe('handleDisconnect', () => {
    it('debería manejar desconexión del usuario', async () => {
      await socketService.handleDisconnect(mockSocket as any);

      // Verificar que se actualiza el estado del usuario
      expect(mockSocket.leave).toHaveBeenCalledWith('company:company123');
      expect(mockSocket.leave).toHaveBeenCalledWith('user:user123');
    });
  });

  describe('broadcastNewMessage', () => {
    it('debería difundir un nuevo mensaje a todos los usuarios de la conversación', () => {
      const mockMessage = {
        id: 'msg123',
        conversationId: 'conv123',
        content: 'Nuevo mensaje',
        fromMe: false,
        createdAt: new Date()
      };

      socketService.broadcastNewMessage(mockMessage);

      expect(mockIo.to).toHaveBeenCalledWith('conversation:conv123');
    });
  });

  describe('broadcastConversationUpdate', () => {
    it('debería difundir actualización de conversación', () => {
      const mockConversation = {
        id: 'conv123',
        lastMessage: 'Mensaje actualizado',
        unreadCount: 2,
        connection: { companyId: 'company123' }
      };

      socketService.broadcastConversationUpdate(mockConversation);

      expect(mockIo.to).toHaveBeenCalledWith('company:company123');
    });
  });

  describe('broadcastUserStatusChange', () => {
    it('debería difundir cambio de estado de usuario', () => {
      const mockUser = {
        id: 'user123',
        companyId: 'company123',
        agentStatus: 'available',
        name: 'Juan Pérez'
      };

      socketService.broadcastUserStatusChange(mockUser);

      expect(mockIo.to).toHaveBeenCalledWith('company:company123');
    });
  });

  describe('sendNotification', () => {
    it('debería enviar notificación a usuario específico', () => {
      const notification = {
        type: 'info',
        title: 'Nuevo mensaje',
        message: 'Tienes un nuevo mensaje',
        data: { conversationId: 'conv123' }
      };

      socketService.sendNotification('user123', notification);

      expect(mockIo.to).toHaveBeenCalledWith('user:user123');
    });
  });

  describe('getConnectedUsers', () => {
    it('debería obtener lista de usuarios conectados', () => {
      const users = socketService.getConnectedUsers('company123');
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('isUserConnected', () => {
    it('debería verificar si un usuario está conectado', () => {
      const isConnected = socketService.isUserConnected('user123');
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('disconnectUser', () => {
    it('debería desconectar un usuario específico', () => {
      socketService.disconnectUser('user123');
      expect(mockIo.to).toHaveBeenCalledWith('user:user123');
    });
  });

  describe('middleware de autenticación', () => {
    it('debería autenticar usuario válido', async () => {
      const mockUser = {
        id: 'user123',
        companyId: 'company123',
        name: 'Juan Pérez',
        isActive: true
      };

      // Mock del proceso de autenticación
      vi.spyOn(socketService as any, 'verifyToken').mockResolvedValue(mockUser);

      const result = await (socketService as any).authenticateSocket(mockSocket);

      expect(result).toEqual(mockUser);
    });

    it('debería rechazar token inválido', async () => {
      vi.spyOn(socketService as any, 'verifyToken').mockRejectedValue(new Error('Invalid token'));

      await expect((socketService as any).authenticateSocket(mockSocket))
        .rejects.toThrow('Invalid token');
    });

    it('debería rechazar usuario inactivo', async () => {
      const mockUser = {
        id: 'user123',
        companyId: 'company123',
        name: 'Juan Pérez',
        isActive: false
      };

      vi.spyOn(socketService as any, 'verifyToken').mockResolvedValue(mockUser);

      await expect((socketService as any).authenticateSocket(mockSocket))
        .rejects.toThrow('Usuario inactivo');
    });
  });

  describe('manejo de errores', () => {
    it('debería manejar errores de conexión', async () => {
      vi.spyOn(socketService as any, 'authenticateSocket').mockRejectedValue(new Error('Connection error'));

      await socketService.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('debería manejar errores en eventos', async () => {
      const errorHandler = vi.fn();
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          errorHandler.mockImplementation(handler);
        }
      });

      await socketService.handleConnection(mockSocket as any);

      // Simular error
      const error = new Error('Test error');
      await errorHandler(error);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Error interno del servidor'
      });
    });
  });

  describe('límites de rate limiting', () => {
    it('debería aplicar rate limiting a mensajes', async () => {
      const mockConversation = {
        id: 'conv123',
        connection: { companyId: 'company123' }
      };

      vi.spyOn(socketService as any, 'getConversation').mockResolvedValue(mockConversation);
      vi.spyOn(socketService as any, 'checkRateLimit').mockReturnValue(false);

      await socketService.handleSendMessage(mockSocket as any, {
        conversationId: 'conv123',
        content: 'Mensaje con rate limit'
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Demasiados mensajes. Intenta más tarde.'
      });
    });
  });

  describe('validación de datos', () => {
    it('debería validar datos de mensaje', async () => {
      await socketService.handleSendMessage(mockSocket as any, {
        conversationId: '',
        content: ''
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Datos de mensaje inválidos'
      });
    });

    it('debería validar longitud de mensaje', async () => {
      const longMessage = 'a'.repeat(5001); // Asumiendo límite de 5000 caracteres

      await socketService.handleSendMessage(mockSocket as any, {
        conversationId: 'conv123',
        content: longMessage
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Mensaje demasiado largo'
      });
    });
  });
});

export default {}; 