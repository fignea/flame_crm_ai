import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import compression from 'compression';

import { logger } from './utils/logger';
import { setupSocketIO } from './services/socketService';
import { restoreSessions } from './services/whatsappService';

// Middlewares de seguridad
import {
  securityMiddleware,
  rateLimitMiddleware,
  authRateLimitMiddleware,
  additionalSecurityHeaders,
  securityLogging,
  validateHeaders,
  sanitizeInput,
} from './middleware/security';

// Rutas
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import whatsappRoutes from './routes/whatsapp';
import connectionRoutes from './routes/connections';
import ticketRoutes from './routes/tickets';
import contactRoutes from './routes/contacts';
import organizationRoutes from './routes/organizations';
import queueRoutes from './routes/queues';
import tagRoutes from './routes/tags';
import campaignRoutes from './routes/campaigns';
import scheduleRoutes from './routes/schedules';
import autoMessageScheduleRoutes from './routes/autoMessageSchedules';
import botFlowRoutes from './routes/botFlows';
import dashboardRoutes from './routes/dashboard';
import conversationRoutes from './routes/conversations';

// Middlewares de manejo de errores
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { prisma } from './prisma/client';

const app = express();
const server = http.createServer(app);
const PORT = process.env['PORT'] || 8080;

// Configurar trust proxy para obtener IP real detrás de proxy
app.set('trust proxy', 1);

// Middlewares de seguridad - aplicar ANTES de otras configuraciones
app.use(securityMiddleware);
app.use(additionalSecurityHeaders);
app.use(securityLogging);
app.use(validateHeaders);

// Rate limiting general
app.use(rateLimitMiddleware);

// CORS configuración mejorada
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env['FRONTEND_URL'] || 'http://localhost:3000',
      'http://localhost:3000',
      'https://localhost:3000',
    ];
    
    // Permitir requests sin origin (móvil apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS: Origin no permitido', { origin });
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200,
}));

// Middlewares de parsing y compresión
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Servir archivos estáticos
app.use('/public', express.static('uploads'));

// Health check endpoint - sin autenticación
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '1.0.0',
    environment: process.env['NODE_ENV'] || 'development',
    uptime: process.uptime(),
  });
});

// Endpoint para métricas básicas - sin autenticación
app.get('/api/metrics', async (_req, res) => {
  try {
    const metrics = {
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform,
      },
      database: {
        connected: true, // Se puede mejorar con una verificación real
      },
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas',
    });
  }
});

// Rutas de autenticación - con rate limiting específico
app.use('/api/auth', authRateLimitMiddleware, authRoutes);

// Rutas de la API - con autenticación
app.use('/api/users', userRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/auto-message-schedules', autoMessageScheduleRoutes);
app.use('/api/bot-flows', botFlowRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/conversations', conversationRoutes);

// Middlewares de manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

// Inicializar Socket.IO
setupSocketIO(server);

// Función para inicializar servicios
const initializeServices = async () => {
  try {
    // Restaurar sesiones de WhatsApp
    await restoreSessions();
    logger.info('📱 Sesiones de WhatsApp restauradas');
    
    // Aquí se pueden agregar más inicializaciones de servicios
    
    return true;
  } catch (error) {
    logger.error('❌ Error al inicializar servicios:', error);
    return false;
  }
};

// Función para verificar dependencias
const checkDependencies = async () => {
  try {
    // Verificar conexión a base de datos
    await prisma.$connect();
    logger.info('✅ Conexión a base de datos establecida');
    
    // Verificar que existe al menos una empresa
    const companyCount = await prisma.company.count();
    if (companyCount === 0) {
      logger.warn('⚠️ No hay empresas registradas en la base de datos');
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Error al verificar dependencias:', error);
    return false;
  }
};

// Iniciar servidor
const startServer = async () => {
  try {
    // Verificar dependencias
    const depsOk = await checkDependencies();
    if (!depsOk) {
      process.exit(1);
    }
    
    // Iniciar servidor
    server.listen(PORT, async () => {
      logger.info(`🚀 Servidor iniciado en puerto ${PORT}`);
      logger.info(`📱 Ambiente: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info(`🌐 Frontend URL: ${process.env['FRONTEND_URL'] || 'http://localhost:3000'}`);
      logger.info(`🔒 Seguridad: Helmet, Rate Limiting, CORS configurados`);
      
      // Inicializar servicios
      const servicesOk = await initializeServices();
      if (!servicesOk) {
        logger.warn('⚠️ Algunos servicios no se pudieron inicializar correctamente');
      }
      
      logger.info('🎉 Servidor completamente iniciado y listo para recibir peticiones');
    });
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Función para cierre limpio del servidor
const shutdown = async (signal: string) => {
  logger.info(`${signal} recibido, cerrando servidor...`);
  
  try {
    // Cerrar servidor HTTP
    server.close(() => {
      logger.info('🔌 Servidor HTTP cerrado');
    });
    
    // Cerrar conexión a base de datos
    await prisma.$disconnect();
    logger.info('🗄️ Conexión a base de datos cerrada');
    
    // Aquí se pueden agregar más limpiezas de recursos
    
    logger.info('✅ Servidor cerrado limpiamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error durante el cierre del servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales de terminación
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

// Iniciar el servidor
startServer();

export default app; 