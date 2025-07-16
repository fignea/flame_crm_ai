import { Router } from 'express';
import dashboardRouter from './dashboard';
import ticketsRouter from './tickets';
import tagsRouter from './tags';
import conversationsRouter from './conversations';
import contactsRouter from './contacts';
import organizationsRouter from './organizations';
import connectionsRouter from './connections';
import whatsappRouter from './whatsapp';
import authRouter from './auth';
import usersRouter from './users';
import schedulesRouter from './schedules';
import queuesRouter from './queues';
import campaignsRouter from './campaigns';
import autoMessageSchedulesRouter from './autoMessageSchedules';

const router = Router();

router.use('/dashboard', dashboardRouter);
router.use('/tickets', ticketsRouter);
router.use('/tags', tagsRouter);
router.use('/conversations', conversationsRouter);
router.use('/contacts', contactsRouter);
router.use('/organizations', organizationsRouter);
router.use('/connections', connectionsRouter);
router.use('/whatsapp', whatsappRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/schedules', schedulesRouter);
router.use('/queues', queuesRouter);
router.use('/campaigns', campaignsRouter);
router.use('/auto-message-schedules', autoMessageSchedulesRouter);

export default router; 