import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import ConversationHistoryService from '../services/conversationHistoryService';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /api/conversation-history - Obtener historial de conversaciones
router.get('/', async (req: any, res) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      dateFrom,
      dateTo,
      contactId,
      connectionId,
      messageType,
      contentSearch,
      status,
      fromMe,
      hasMedia,
      tags,
      minMessages,
      maxMessages,
      archived = false
    } = req.query;

    const companyId = req.user.companyId;
    
    const filters = {
      dateFrom,
      dateTo,
      contactId,
      connectionId,
      messageType,
      contentSearch,
      status,
      fromMe: fromMe !== undefined ? fromMe === 'true' : undefined,
      hasMedia: hasMedia !== undefined ? hasMedia === 'true' : undefined,
      tags: tags ? tags.split(',') : undefined,
      minMessages: minMessages ? parseInt(minMessages) : undefined,
      maxMessages: maxMessages ? parseInt(maxMessages) : undefined,
      archived: archived === 'true'
    };

    const result = await ConversationHistoryService.getConversationHistory(
      companyId,
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener el historial de conversaciones'
    });
  }
});

// GET /api/conversation-history/statistics - Obtener estadísticas del historial
router.get('/statistics', async (req: any, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      contactId,
      connectionId,
      messageType,
      contentSearch,
      status,
      fromMe,
      hasMedia,
      tags,
      minMessages,
      maxMessages,
      archived = false
    } = req.query;

    const companyId = req.user.companyId;
    
    const filters = {
      dateFrom,
      dateTo,
      contactId,
      connectionId,
      messageType,
      contentSearch,
      status,
      fromMe: fromMe !== undefined ? fromMe === 'true' : undefined,
      hasMedia: hasMedia !== undefined ? hasMedia === 'true' : undefined,
      tags: tags ? tags.split(',') : undefined,
      minMessages: minMessages ? parseInt(minMessages) : undefined,
      maxMessages: maxMessages ? parseInt(maxMessages) : undefined,
      archived: archived === 'true'
    };

    const stats = await ConversationHistoryService.getHistoryStatistics(companyId, filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error getting history statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener estadísticas del historial'
    });
  }
});

// POST /api/conversation-history/export - Exportar historial
router.post('/export', async (req: any, res) => {
  try {
    const {
      filters = {},
      options = {}
    } = req.body;

    const companyId = req.user.companyId;
    
    const exportOptions = {
      format: options.format || 'json',
      includeMedia: options.includeMedia || false,
      includeMetadata: options.includeMetadata || false,
      includeStats: options.includeStats || false,
      maxRecords: options.maxRecords || 10000
    };

    const result = await ConversationHistoryService.exportConversationHistory(
      companyId,
      filters,
      exportOptions
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error exporting conversation history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al exportar historial de conversaciones'
    });
  }
});

// GET /api/conversation-history/export/:exportId/download - Descargar archivo exportado
router.get('/export/:exportId/download', async (req: any, res) => {
  try {
    const { exportId } = req.params;

    // Buscar archivo de exportación
    const exportDir = path.join(process.cwd(), 'exports');
    const files = fs.readdirSync(exportDir);
    const exportFile = files.find(file => file.startsWith(exportId));

    if (!exportFile) {
      return res.status(404).json({
        success: false,
        message: 'Archivo de exportación no encontrado'
      });
    }

    const filePath = path.join(exportDir, exportFile);
    const fileExtension = path.extname(exportFile);
    
    // Configurar headers para descarga
    res.setHeader('Content-Disposition', `attachment; filename="conversation_history_${Date.now()}${fileExtension}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Enviar archivo
    return res.sendFile(filePath, (err) => {
      if (err) {
        logger.error('Error sending export file:', err);
        res.status(500).json({
          success: false,
          message: 'Error al enviar archivo de exportación'
        });
      }
    });
  } catch (error: any) {
    logger.error('Error downloading export file:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al descargar archivo de exportación'
    });
  }
});

// POST /api/conversation-history/search - Búsqueda avanzada en mensajes
router.post('/search', async (req: any, res) => {
  try {
    const {
      searchTerm,
      filters = {},
      page = 1,
      limit = 50
    } = req.body;

    const companyId = req.user.companyId;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda requerido'
      });
    }

    const result = await ConversationHistoryService.searchMessages(
      companyId,
      searchTerm,
      filters,
      parseInt(page),
      parseInt(limit)
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error searching messages:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al buscar mensajes'
    });
  }
});

// POST /api/conversation-history/:conversationId/archive - Archivar conversación
router.post('/:conversationId/archive', async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    const companyId = req.user.companyId;

    const result = await ConversationHistoryService.archiveConversation(conversationId, companyId);

    res.json({
      success: true,
      data: result,
      message: 'Conversación archivada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error archiving conversation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al archivar conversación'
    });
  }
});

// POST /api/conversation-history/:conversationId/unarchive - Desarchivar conversación
router.post('/:conversationId/unarchive', async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    const companyId = req.user.companyId;

    const result = await ConversationHistoryService.unarchiveConversation(conversationId, companyId);

    res.json({
      success: true,
      data: result,
      message: 'Conversación desarchivada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error unarchiving conversation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al desarchivar conversación'
    });
  }
});

// POST /api/conversation-history/cleanup - Limpiar historial antiguo
router.post('/cleanup', async (req: any, res) => {
  try {
    const { daysToKeep = 90 } = req.body;
    const companyId = req.user.companyId;

    const result = await ConversationHistoryService.cleanupOldHistory(companyId, parseInt(daysToKeep));

    res.json({
      success: true,
      data: result,
      message: 'Historial limpiado exitosamente'
    });
  } catch (error: any) {
    logger.error('Error cleaning up history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al limpiar historial'
    });
  }
});

export default router; 