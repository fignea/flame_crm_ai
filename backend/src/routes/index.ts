import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import contactRoutes from './contacts';
import connectionRoutes from './connections';
import conversationRoutes from './conversations';
import conversationAssignmentRoutes from './conversationAssignment';
import conversationHistoryRoutes from './conversationHistory';
import assignmentMetricsRoutes from './assignmentMetrics';
import tagRoutes from './tags';
import ticketRoutes from './tickets';
import campaignRoutes from './campaigns';
import scheduleRoutes from './schedules';
import organizationRoutes from './organizations';
import dashboardRoutes from './dashboard';
import botFlowRoutes from './botFlows';
import autoMessageScheduleRoutes from './autoMessageSchedules';
import whatsappRoutes from './whatsapp';
import queueRoutes from './queues';
import advancedSearchRoutes from './advancedSearch';

const router = Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de usuarios
router.use('/users', userRoutes);

// Rutas de contactos
router.use('/contacts', contactRoutes);

// Rutas de organizaciones
router.use('/organizations', organizationRoutes);

// Rutas de conexiones
router.use('/connections', connectionRoutes);

// Rutas de conversaciones
router.use('/conversations', conversationRoutes);

// Rutas de asignación de conversaciones
router.use('/conversation-assignment', conversationAssignmentRoutes);

// Rutas de historial de conversaciones
router.use('/conversation-history', conversationHistoryRoutes);

// Rutas de métricas de asignación
router.use('/assignment-metrics', assignmentMetricsRoutes);

// Rutas de tags
router.use('/tags', tagRoutes);

// Rutas de tickets
router.use('/tickets', ticketRoutes);

// Rutas de campañas
router.use('/campaigns', campaignRoutes);

// Rutas de horarios
router.use('/schedules', scheduleRoutes);

// Rutas de bot flows
router.use('/bot-flows', botFlowRoutes);

// Rutas de auto message schedules
router.use('/auto-message-schedules', autoMessageScheduleRoutes);

// Rutas de WhatsApp
router.use('/whatsapp', whatsappRoutes);

// Rutas de colas
router.use('/queues', queueRoutes);

// Rutas de dashboard
router.use('/dashboard', dashboardRoutes);

// Rutas de búsqueda avanzada
router.use('/advanced-search', advancedSearchRoutes);

export default router; 