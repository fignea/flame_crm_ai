import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { MetricsService } from '../services/metricsService';
import { logger } from '../utils/logger';

const router = Router();
router.use(authMiddleware);

// GET /api/metrics/chat - Obtener métricas básicas de chat
router.get('/chat', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días por defecto
      endDate = new Date(),
      userId
    } = req.query;

    const metrics = await MetricsService.getChatMetrics(
      companyId,
      new Date(startDate),
      new Date(endDate),
      userId
    );

    res.json(metrics);
  } catch (error) {
    logger.error('Error getting chat metrics:', error);
    res.status(500).json({ error: 'Error getting chat metrics' });
  }
});

// GET /api/metrics/conversations - Obtener métricas de conversaciones
router.get('/conversations', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate = new Date()
    } = req.query;

    const metrics = await MetricsService.getConversationMetrics(
      companyId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json(metrics);
  } catch (error) {
    logger.error('Error getting conversation metrics:', error);
    res.status(500).json({ error: 'Error getting conversation metrics' });
  }
});

// GET /api/metrics/messages - Obtener métricas de mensajes
router.get('/messages', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate = new Date()
    } = req.query;

    const metrics = await MetricsService.getMessageMetrics(
      companyId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json(metrics);
  } catch (error) {
    logger.error('Error getting message metrics:', error);
    res.status(500).json({ error: 'Error getting message metrics' });
  }
});

// GET /api/metrics/agents - Obtener métricas de agentes
router.get('/agents', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate = new Date()
    } = req.query;

    const metrics = await MetricsService.getAgentMetrics(
      companyId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json(metrics);
  } catch (error) {
    logger.error('Error getting agent metrics:', error);
    res.status(500).json({ error: 'Error getting agent metrics' });
  }
});

// GET /api/metrics/comprehensive - Obtener métricas completas
router.get('/comprehensive', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      userId
    } = req.query;

    const metrics = await MetricsService.getComprehensiveMetrics(
      companyId,
      new Date(startDate),
      new Date(endDate),
      userId
    );

    res.json(metrics);
  } catch (error) {
    logger.error('Error getting comprehensive metrics:', error);
    res.status(500).json({ error: 'Error getting comprehensive metrics' });
  }
});

export default router; 