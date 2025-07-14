import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import compression from 'compression';

import { logger } from './utils/logger';
import { setupSocketIO } from './services/socketService';
import { restoreSessions } from './services/whatsappService';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import whatsappRoutes from './routes/whatsapp';
import connectionRoutes from './routes/connections';
import ticketRoutes from './routes/tickets';
import contactRoutes from './routes/contacts';
import queueRoutes from './routes/queues';
import tagRoutes from './routes/tags';
import campaignRoutes from './routes/campaigns';
import scheduleRoutes from './routes/schedules';
import autoMessageScheduleRoutes from './routes/autoMessageSchedules';
import botFlowRoutes from './routes/botFlows';
import dashboardRoutes from './routes/dashboard';
import conversationRoutes from './routes/conversations';
// import quickMessageRoutes from './routes/quickMessage';

import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { prisma } from './prisma/client';

const app = express();
const server = http.createServer(app);
const PORT = process.env['PORT'] || 8080;

// Configuración de middlewares
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/auto-message-schedules', autoMessageScheduleRoutes);
app.use('/api/bot-flows', botFlowRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/conversations', conversationRoutes);
// app.use('/api/quick-messages', quickMessageRoutes);

// Middlewares de manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

// Inicializar Socket.IO
setupSocketIO(server);

// Iniciar servidor y servicios
const startServer = async () => {
  try {
    server.listen(PORT, async () => {
      logger.info(`🚀 Servidor iniciado en puerto ${PORT}`);
      logger.info(`📱 Ambiente: ${process.env['NODE_ENV']}`);
      
      await restoreSessions();
      logger.info('📱 Sesiones de WhatsApp restauradas');
      
      logger.info(`🌐 Frontend URL: ${process.env['FRONTEND_URL']}`);
    });
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  logger.info('SIGTERM/SIGINT recibido, cerrando servidor...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

export default app; 