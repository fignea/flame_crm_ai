import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import AgentStatusService, { AgentStatus } from '../services/agentStatusService';
import { logger } from '../utils/logger';

const router = Router();
router.use(authMiddleware);

// GET /api/agent-status - Obtener estado del agente actual
router.get('/', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    
    const agentStatus = await AgentStatusService.getAgentStatus(userId, companyId);
    
    return res.json({
      success: true,
      data: agentStatus
    });
  } catch (error: any) {
    logger.error('Error getting agent status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// PUT /api/agent-status - Actualizar estado del agente
router.put('/', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const { agentStatus, statusMessage, autoAwayEnabled, autoAwayTimeout } = req.body;

    // Validar estado de agente
    const validStatuses = Object.values(AgentStatus);
    if (agentStatus && !validStatuses.includes(agentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de agente inválido'
      });
    }

    // Validar timeout de auto-ausente
    if (autoAwayTimeout && (autoAwayTimeout < 5 || autoAwayTimeout > 120)) {
      return res.status(400).json({
        success: false,
        message: 'El timeout de auto-ausente debe estar entre 5 y 120 minutos'
      });
    }

    const updatedStatus = await AgentStatusService.updateAgentStatus(
      userId,
      companyId,
      {
        agentStatus,
        statusMessage,
        autoAwayEnabled,
        autoAwayTimeout
      }
    );

    return res.json({
      success: true,
      data: updatedStatus,
      message: 'Estado actualizado exitosamente'
    });
  } catch (error: any) {
    logger.error('Error updating agent status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// GET /api/agent-status/company - Obtener estados de todos los agentes de la empresa
router.get('/company', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    
    const agentStatuses = await AgentStatusService.getCompanyAgentStatuses(companyId);
    
    res.json({
      success: true,
      data: agentStatuses
    });
  } catch (error: any) {
    logger.error('Error getting company agent statuses:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// GET /api/agent-status/available - Obtener agentes disponibles
router.get('/available', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    
    const availableAgents = await AgentStatusService.getAvailableAgents(companyId);
    
    res.json({
      success: true,
      data: availableAgents
    });
  } catch (error: any) {
    logger.error('Error getting available agents:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// GET /api/agent-status/stats - Obtener estadísticas de estados de agentes
router.get('/stats', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    
    const stats = await AgentStatusService.getAgentStatusStats(companyId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error getting agent status stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// GET /api/agent-status/history - Obtener historial de cambios de estado
router.get('/history', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const { limit = 50 } = req.query;
    
    const history = await AgentStatusService.getStatusHistory(
      userId,
      companyId,
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    logger.error('Error getting status history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/agent-status/reset-activity - Resetear timer de actividad
router.post('/reset-activity', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    
    await AgentStatusService.resetActivityTimer(userId, companyId);
    
    res.json({
      success: true,
      message: 'Timer de actividad reseteado'
    });
  } catch (error: any) {
    logger.error('Error resetting activity timer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// PUT /api/agent-status/bulk - Actualizar estados de múltiples agentes (admin)
router.put('/bulk', async (req: any, res) => {
  try {
    const { companyId, role } = req.user;
    const { updates } = req.body;

    // Verificar permisos de admin
    if (!role || !['admin', 'super_admin'].includes(role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Sin permisos para actualizar estados de otros agentes'
      });
    }

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de actualizaciones'
      });
    }

    const results = [];
    for (const update of updates) {
      try {
        const { targetUserId, ...statusUpdate } = update;
        const result = await AgentStatusService.updateAgentStatus(
          targetUserId,
          companyId,
          statusUpdate,
          'admin_update'
        );
        results.push({ userId: targetUserId, success: true, data: result });
      } catch (error: any) {
        results.push({ 
          userId: update.targetUserId, 
          success: false, 
          message: error.message 
        });
      }
    }

    return res.json({
      success: true,
      data: results,
      message: 'Actualizaciones procesadas'
    });
  } catch (error: any) {
    logger.error('Error bulk updating agent statuses:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// GET /api/agent-status/options - Obtener opciones de configuración
router.get('/options', async (req: any, res) => {
  try {
    const statusOptions = [
      { value: AgentStatus.AVAILABLE, label: 'Disponible', color: '#22c55e' },
      { value: AgentStatus.BUSY, label: 'Ocupado', color: '#eab308' },
      { value: AgentStatus.AWAY, label: 'Ausente', color: '#f97316' },
      { value: AgentStatus.OFFLINE, label: 'Desconectado', color: '#6b7280' }
    ];

    const timeoutOptions = [
      { value: 5, label: '5 minutos' },
      { value: 10, label: '10 minutos' },
      { value: 15, label: '15 minutos' },
      { value: 30, label: '30 minutos' },
      { value: 60, label: '1 hora' },
      { value: 120, label: '2 horas' }
    ];

    res.json({
      success: true,
      data: {
        statusOptions,
        timeoutOptions
      }
    });
  } catch (error: any) {
    logger.error('Error getting agent status options:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

export default router; 