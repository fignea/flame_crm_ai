import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { AssignmentMetricsService } from '../services/assignmentMetricsService';
import { logger } from '../utils/logger';

const router = Router();
router.use(authMiddleware);

// GET /api/assignment-metrics - Obtener métricas generales de asignación
router.get('/', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const { dateFrom, dateTo } = req.query;
    
    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;
    
    const metrics = await AssignmentMetricsService.getAssignmentMetrics(
      companyId,
      fromDate,
      toDate
    );
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error obteniendo métricas de asignación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/assignment-metrics/real-time - Obtener métricas en tiempo real
router.get('/real-time', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    
    const metrics = await AssignmentMetricsService.getRealTimeMetrics(companyId);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error obteniendo métricas en tiempo real:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/assignment-metrics/agents - Obtener métricas por agente
router.get('/agents', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const { dateFrom, dateTo } = req.query;
    
    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;
    
    const metrics = await AssignmentMetricsService.getAssignmentMetrics(
      companyId,
      fromDate,
      toDate
    );
    
    res.json({
      success: true,
      data: metrics.assignmentsByAgent
    });
  } catch (error) {
    logger.error('Error obteniendo métricas por agente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/assignment-metrics/workload - Obtener distribución de carga de trabajo
router.get('/workload', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    
    const metrics = await AssignmentMetricsService.getAssignmentMetrics(companyId);
    
    res.json({
      success: true,
      data: metrics.workloadDistribution
    });
  } catch (error) {
    logger.error('Error obteniendo distribución de carga:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/assignment-metrics/response-times - Obtener métricas de tiempo de respuesta
router.get('/response-times', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const { dateFrom, dateTo } = req.query;
    
    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;
    
    const metrics = await AssignmentMetricsService.getAssignmentMetrics(
      companyId,
      fromDate,
      toDate
    );
    
    res.json({
      success: true,
      data: metrics.responseTimeMetrics
    });
  } catch (error) {
    logger.error('Error obteniendo métricas de tiempo de respuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router; 