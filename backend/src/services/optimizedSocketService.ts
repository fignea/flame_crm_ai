import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger';
import { OptimizedChatService } from './optimizedChatService';

export class OptimizedSocketService {
  private static io: SocketServer;

  static initialize(io: SocketServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private static setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.id}`);

      socket.on('join_conversation', (conversationId: string) => {
        socket.join(conversationId);
        logger.info(`User ${socket.id} joined conversation ${conversationId}`);
      });

      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(conversationId);
        logger.info(`User ${socket.id} left conversation ${conversationId}`);
      });

      socket.on('send_message', async (data: {
        conversationId: string;
        content: string;
        mediaType?: string;
        mediaUrl?: string;
        locationLatitude?: number;
        locationLongitude?: number;
        locationAddress?: string;
        fileName?: string;
        fileSize?: number;
        fileMimeType?: string;
        metadata?: any;
      }) => {
        try {
          const message = await OptimizedChatService.createMessage({
            conversationId: data.conversationId,
            content: data.content,
            fromMe: true,
            mediaType: data.mediaType,
            mediaUrl: data.mediaUrl,
            locationLatitude: data.locationLatitude,
            locationLongitude: data.locationLongitude,
            locationAddress: data.locationAddress,
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileMimeType: data.fileMimeType,
            metadata: data.metadata
          });

          // Enviar mensaje a todos los usuarios en la conversación
          socket.to(data.conversationId).emit('new_message', message);
          socket.emit('message_sent', message);
        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('message_error', { error: 'Failed to send message' });
        }
      });

      socket.on('send_file', async (data: {
        conversationId: string;
        fileName: string;
        fileSize: number;
        fileMimeType: string;
        fileType: string;
      }) => {
        try {
          // Aquí implementarías la lógica de manejo de archivos
          logger.info(`File upload requested: ${data.fileName} (${data.fileSize} bytes)`);
          
          socket.emit('file_upload_ready', {
            conversationId: data.conversationId,
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileMimeType: data.fileMimeType
          });
        } catch (error) {
          logger.error('Error handling file upload:', error);
          socket.emit('file_error', { error: 'Failed to handle file upload' });
        }
      });

      socket.on('typing_start', (data: { conversationId: string }) => {
        socket.to(data.conversationId).emit('user_typing', { userId: socket.id });
      });

      socket.on('typing_stop', (data: { conversationId: string }) => {
        socket.to(data.conversationId).emit('user_stopped_typing', { userId: socket.id });
      });

      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
      });
    });
  }

  static emitToConversation(conversationId: string, event: string, data: any) {
    this.io.to(conversationId).emit(event, data);
  }

  static emitToAll(event: string, data: any) {
    this.io.emit(event, data);
  }
} 