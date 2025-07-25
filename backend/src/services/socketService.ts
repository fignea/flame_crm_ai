import { Server, Socket } from 'socket.io';
import { authService } from './authService';
import { logger } from '../utils/logger';
import { prisma } from '../prisma/client';
import AgentStatusService from './agentStatusService';

let io: Server | null = null;

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO no ha sido inicializado.');
  }
  return io;
};
// Extender la interfaz del Socket para incluir el userId
interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSocketIO = (server: any): void => {
  io = new Server(server, {
    cors: {
      origin: '*', // Ajusta esto en producción
    },
  });
  // Middleware de autenticación para Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth['token']?.split(' ')[1];

    if (!token) {
      logger.warn('Socket sin token de autenticación. Desconectando.');
      return next(new Error('Authentication error: Token not provided'));
    }

    try {
      const decoded: any = await authService.verifyToken(token);
      socket.userId = decoded.userId;

      if (socket.userId) {
        // Obtener el usuario y su companyId
        const user = await prisma.user.findUnique({ where: { id: socket.userId } });
        if (user && user.companyId) {
          const companyRoom = `company-${user.companyId}`;
          socket.join(companyRoom);
          logger.info(`Socket para usuario ${socket.userId} unido a la sala ${companyRoom}`);
        }
      }

      logger.info(`Socket autenticado para usuario ${socket.userId}`);
      next();
    } catch (error) {
      logger.error('Error de autenticación de socket:', error);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    logger.info(`Usuario conectado: ${socket.id}, userId: ${socket.userId}`);

    // La unión a la sala ahora se hace en el middleware
    // Ya no es necesario unir al usuario a una sala con su ID aquí,
    // a menos que se necesiten notificaciones directas y privadas.
    if (socket.userId) {
      socket.join(socket.userId);
      
      // Actualizar estado del agente a online cuando se conecta
      try {
        const user = await prisma.user.findUnique({ where: { id: socket.userId } });
        if (user && user.companyId) {
          await AgentStatusService.setUserOnlineStatus(socket.userId, user.companyId, true);
        }
      } catch (error) {
        logger.error('Error actualizando estado online:', error);
      }
    }

    // Escuchar eventos de actividad para resetear timer de auto-ausente
    socket.on('user_activity', async () => {
      if (socket.userId) {
        try {
          const user = await prisma.user.findUnique({ where: { id: socket.userId } });
          if (user && user.companyId) {
            await AgentStatusService.resetActivityTimer(socket.userId, user.companyId);
          }
        } catch (error) {
          logger.error('Error reseteando timer de actividad:', error);
        }
      }
    });

    socket.on('disconnect', async () => {
      logger.info(`Usuario desconectado: ${socket.id}, userId: ${socket.userId}`);
      
      // Actualizar estado del agente a offline cuando se desconecta
      if (socket.userId) {
        try {
          const user = await prisma.user.findUnique({ where: { id: socket.userId } });
          if (user && user.companyId) {
            await AgentStatusService.setUserOnlineStatus(socket.userId, user.companyId, false);
          }
        } catch (error) {
          logger.error('Error actualizando estado offline:', error);
        }
      }
    });
  });
}; 