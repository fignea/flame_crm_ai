import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import MessageTemplateService from '../services/messageTemplateService';
import { logger } from '../utils/logger';

const router = Router();
router.use(authMiddleware);

// GET /api/message-templates - Obtener plantillas con filtros
router.get('/', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const {
      category,
      search,
      isActive,
      isShared,
      createdBy,
      page = 1,
      limit = 20
    } = req.query;

    const result = await MessageTemplateService.getTemplates(
      companyId,
      userId,
      {
        category,
        search,
        isActive: isActive === 'true',
        isShared: isShared === 'true',
        createdBy,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    );

    return res.json({
      success: true,
      data: result.templates,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Error getting message templates:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/message-templates/categories - Obtener categorías disponibles
router.get('/categories', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const categories = await MessageTemplateService.getCategories(companyId, userId);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/message-templates/stats - Obtener estadísticas de uso
router.get('/stats', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const stats = await MessageTemplateService.getUsageStats(companyId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting usage stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/message-templates/shortcut/:shortcut - Buscar plantilla por shortcut
router.get('/shortcut/:shortcut', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const { shortcut } = req.params;

    const template = await MessageTemplateService.getTemplateByShortcut(
      shortcut,
      companyId,
      userId
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    return res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Error getting template by shortcut:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/message-templates/:id - Obtener plantilla por ID
router.get('/:id', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const { id } = req.params;

    const template = await MessageTemplateService.getTemplate(id, companyId, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    return res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Error getting message template:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/message-templates - Crear nueva plantilla
router.post('/', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const { name, content, category, shortcut, isShared } = req.body;

    if (!name || !content) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y contenido son requeridos'
      });
    }

    const template = await MessageTemplateService.createTemplate(
      { name, content, category, shortcut, isShared },
      companyId,
      userId
    );

    return res.status(201).json({
      success: true,
      data: template,
      message: 'Plantilla creada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error creating message template:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// PUT /api/message-templates/:id - Actualizar plantilla
router.put('/:id', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const { id } = req.params;
    const { name, content, category, shortcut, isActive, isShared } = req.body;

    const template = await MessageTemplateService.updateTemplate(
      id,
      { name, content, category, shortcut, isActive, isShared },
      companyId,
      userId
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    return res.json({
      success: true,
      data: template,
      message: 'Plantilla actualizada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error updating message template:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// DELETE /api/message-templates/:id - Eliminar plantilla
router.delete('/:id', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const { id } = req.params;

    const success = await MessageTemplateService.deleteTemplate(id, companyId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    return res.json({
      success: true,
      message: 'Plantilla eliminada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error deleting message template:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/message-templates/:id/use - Incrementar contador de uso
router.post('/:id/use', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const { id } = req.params;

    await MessageTemplateService.incrementUsage(id, companyId, userId);

    res.json({
      success: true,
      message: 'Uso registrado exitosamente'
    });
  } catch (error) {
    logger.error('Error incrementing template usage:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/message-templates/create-defaults - Crear plantillas por defecto
router.post('/create-defaults', async (req: any, res) => {
  try {
    const { companyId, id: userId } = req.user;

    await MessageTemplateService.createDefaultTemplates(companyId, userId);

    res.json({
      success: true,
      message: 'Plantillas por defecto creadas exitosamente'
    });
  } catch (error) {
    logger.error('Error creating default templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router; 