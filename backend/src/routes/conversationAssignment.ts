import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import ConversationAssignmentService from '../services/conversationAssignmentService';
import { logger } from '../utils/logger';

const router = Router();
router.use(authMiddleware);

// GET /api/conversation-assignments/agents - Obtener agentes disponibles
router.get('/agents', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const agents = await ConversationAssignmentService.getAvailableAgents(companyId);
    
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    logger.error('Error obteniendo agentes disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/conversation-assignments/assign - Asignar conversación a agente específico
router.post('/assign', async (req: any, res) => {
  try {
    const { conversationId, userId } = req.body;
    const { id: assignedBy } = req.user;

    if (!conversationId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId y userId son requeridos'
      });
    }

    const assignment = await ConversationAssignmentService.assignConversationToAgent(
      conversationId,
      userId,
      assignedBy
    );

    if (!assignment) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo asignar la conversación'
      });
    }

    return res.json({
      success: true,
      data: assignment,
      message: 'Conversación asignada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error asignando conversación:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/conversation-assignments/assign-auto - Asignación automática
router.post('/assign-auto', async (req: any, res) => {
  try {
    const { conversationId } = req.body;
    const { companyId } = req.user;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId es requerido'
      });
    }

    const assignment = await ConversationAssignmentService.assignConversationAutomatically(
      conversationId,
      companyId
    );

    if (!assignment) {
      return res.status(409).json({
        success: false,
        message: 'No hay agentes disponibles para asignar la conversación'
      });
    }

    return res.json({
      success: true,
      data: assignment,
      message: 'Conversación asignada automáticamente'
    });
  } catch (error: any) {
    logger.error('Error en asignación automática:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/conversation-assignments/transfer - Transferir conversación
router.post('/transfer', async (req: any, res) => {
  try {
    const { conversationId, toUserId, reason } = req.body;
    const { id: fromUserId } = req.user;

    if (!conversationId || !toUserId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId y toUserId son requeridos'
      });
    }

    const assignment = await ConversationAssignmentService.transferConversation(
      conversationId,
      fromUserId,
      toUserId,
      reason
    );

    if (!assignment) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo transferir la conversación'
      });
    }

    return res.json({
      success: true,
      data: assignment,
      message: 'Conversación transferida exitosamente'
    });
  } catch (error: any) {
    logger.error('Error transfiriendo conversación:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/conversation-assignments/release - Liberar conversación
router.post('/release', async (req: any, res) => {
  try {
    const { conversationId } = req.body;
    const { id: userId } = req.user;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId es requerido'
      });
    }

    const success = await ConversationAssignmentService.releaseConversation(
      conversationId,
      userId
    );

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo liberar la conversación'
      });
    }

    return res.json({
      success: true,
      message: 'Conversación liberada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error liberando conversación:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// GET /api/conversation-assignments/my-conversations - Obtener conversaciones asignadas al agente
router.get('/my-conversations', async (req: any, res) => {
  try {
    const { id: userId, companyId } = req.user;
    const { status } = req.query;

    const conversations = await ConversationAssignmentService.getAgentConversations(
      userId,
      companyId,
      { status }
    );

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    logger.error('Error obteniendo conversaciones del agente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/conversation-assignments/status - Actualizar estado del agente
router.post('/status', async (req: any, res) => {
  try {
    const { status } = req.body;
    const { id: userId, companyId } = req.user;

    if (!status || !['available', 'busy', 'away'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser: available, busy, away'
      });
    }

    const success = await ConversationAssignmentService.updateAgentStatus(
      userId,
      status,
      companyId
    );

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo actualizar el estado del agente'
      });
    }

    return res.json({
      success: true,
      message: `Estado actualizado a ${status}`
    });
  } catch (error: any) {
    logger.error('Error actualizando estado del agente:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

export default router; 