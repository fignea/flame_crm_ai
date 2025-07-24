import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import WhatsAppConfigService from '../services/whatsappConfigService';
import { logger } from '../utils/logger';

const router = Router();
router.use(authMiddleware);

// GET /api/whatsapp-config/:connectionId - Obtener configuración
router.get('/:connectionId', async (req: any, res) => {
  try {
    const { connectionId } = req.params;
    const { companyId } = req.user;

    const config = await WhatsAppConfigService.getConfig(connectionId, companyId);

    return res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('Error getting WhatsApp config:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// PUT /api/whatsapp-config/:connectionId - Actualizar configuración
router.put('/:connectionId', async (req: any, res) => {
  try {
    const { connectionId } = req.params;
    const { companyId } = req.user;
    const configUpdate = req.body;

    // Validar configuración
    const validation = WhatsAppConfigService.validateConfig(configUpdate);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Configuración inválida',
        errors: validation.errors
      });
    }

    const updatedConfig = await WhatsAppConfigService.updateConfig(
      connectionId, 
      companyId, 
      configUpdate
    );

    return res.json({
      success: true,
      data: updatedConfig,
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error updating WhatsApp config:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/whatsapp-config/:connectionId/validate - Validar configuración
router.post('/:connectionId/validate', async (req: any, res) => {
  try {
    const config = req.body;
    const validation = WhatsAppConfigService.validateConfig(config);

    return res.json({
      success: true,
      data: validation
    });
  } catch (error: any) {
    logger.error('Error validating WhatsApp config:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/whatsapp-config/:connectionId/apply - Aplicar configuración
router.post('/:connectionId/apply', async (req: any, res) => {
  try {
    const { connectionId } = req.params;
    const { companyId } = req.user;

    await WhatsAppConfigService.applyConfig(connectionId, companyId);

    return res.json({
      success: true,
      message: 'Configuración aplicada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error applying WhatsApp config:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// GET /api/whatsapp-config/:connectionId/export - Exportar configuración
router.get('/:connectionId/export', async (req: any, res) => {
  try {
    const { connectionId } = req.params;
    const { companyId } = req.user;

    const config = await WhatsAppConfigService.exportConfig(connectionId, companyId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="whatsapp-config-${connectionId}.json"`);

    return res.json({
      success: true,
      data: config,
      exportedAt: new Date().toISOString(),
      connectionId
    });
  } catch (error: any) {
    logger.error('Error exporting WhatsApp config:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/whatsapp-config/:connectionId/import - Importar configuración
router.post('/:connectionId/import', async (req: any, res) => {
  try {
    const { connectionId } = req.params;
    const { companyId } = req.user;
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Configuración requerida'
      });
    }

    const importedConfig = await WhatsAppConfigService.importConfig(
      connectionId, 
      companyId, 
      config
    );

    return res.json({
      success: true,
      data: importedConfig,
      message: 'Configuración importada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error importing WhatsApp config:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error importando configuración'
    });
  }
});

// POST /api/whatsapp-config/:connectionId/reset - Resetear configuración
router.post('/:connectionId/reset', async (req: any, res) => {
  try {
    const { connectionId } = req.params;
    const { companyId } = req.user;

    const resetConfig = await WhatsAppConfigService.resetConfig(connectionId, companyId);

    return res.json({
      success: true,
      data: resetConfig,
      message: 'Configuración reseteada a valores por defecto'
    });
  } catch (error: any) {
    logger.error('Error resetting WhatsApp config:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/whatsapp-config/:connectionId/auto-responder - Agregar regla de auto-respuesta
router.post('/:connectionId/auto-responder', async (req: any, res) => {
  try {
    const { connectionId } = req.params;
    const { companyId } = req.user;
    const ruleData = req.body;

    // Generar nueva regla
    const newRule = WhatsAppConfigService.generateAutoResponderRule(ruleData);

    // Obtener configuración actual
    const currentConfig = await WhatsAppConfigService.getConfig(connectionId, companyId);

    // Agregar nueva regla
    const updatedRules = [...currentConfig.autoResponderRules, newRule];

    // Actualizar configuración
    await WhatsAppConfigService.updateConfig(
      connectionId, 
      companyId, 
      { autoResponderRules: updatedRules }
    );

    return res.json({
      success: true,
      data: newRule,
      message: 'Regla de auto-respuesta agregada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error adding auto-responder rule:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// PUT /api/whatsapp-config/:connectionId/auto-responder/:ruleId - Actualizar regla
router.put('/:connectionId/auto-responder/:ruleId', async (req: any, res) => {
  try {
    const { connectionId, ruleId } = req.params;
    const { companyId } = req.user;
    const ruleUpdate = req.body;

    // Obtener configuración actual
    const currentConfig = await WhatsAppConfigService.getConfig(connectionId, companyId);

    // Encontrar y actualizar la regla
    const ruleIndex = currentConfig.autoResponderRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Regla no encontrada'
      });
    }

    const updatedRules = [...currentConfig.autoResponderRules];
    updatedRules[ruleIndex] = { ...updatedRules[ruleIndex], ...ruleUpdate };

    // Actualizar configuración
    await WhatsAppConfigService.updateConfig(
      connectionId, 
      companyId, 
      { autoResponderRules: updatedRules }
    );

    return res.json({
      success: true,
      data: updatedRules[ruleIndex],
      message: 'Regla actualizada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error updating auto-responder rule:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// DELETE /api/whatsapp-config/:connectionId/auto-responder/:ruleId - Eliminar regla
router.delete('/:connectionId/auto-responder/:ruleId', async (req: any, res) => {
  try {
    const { connectionId, ruleId } = req.params;
    const { companyId } = req.user;

    // Obtener configuración actual
    const currentConfig = await WhatsAppConfigService.getConfig(connectionId, companyId);

    // Filtrar la regla a eliminar
    const updatedRules = currentConfig.autoResponderRules.filter(rule => rule.id !== ruleId);

    if (updatedRules.length === currentConfig.autoResponderRules.length) {
      return res.status(404).json({
        success: false,
        message: 'Regla no encontrada'
      });
    }

    // Actualizar configuración
    await WhatsAppConfigService.updateConfig(
      connectionId, 
      companyId, 
      { autoResponderRules: updatedRules }
    );

    return res.json({
      success: true,
      message: 'Regla eliminada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error deleting auto-responder rule:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// GET /api/whatsapp-config/:connectionId/templates - Obtener plantillas de configuración
router.get('/:connectionId/templates', async (req: any, res) => {
  try {
    const templates = [
      {
        id: 'basic',
        name: 'Configuración Básica',
        description: 'Configuración mínima para empezar',
        config: {
          enableWelcomeMessage: true,
          welcomeMessage: '¡Hola! Gracias por contactarnos.',
          enableBusinessHours: true,
          businessHours: {
            monday: { enabled: true, start: '09:00', end: '18:00' },
            tuesday: { enabled: true, start: '09:00', end: '18:00' },
            wednesday: { enabled: true, start: '09:00', end: '18:00' },
            thursday: { enabled: true, start: '09:00', end: '18:00' },
            friday: { enabled: true, start: '09:00', end: '18:00' },
            saturday: { enabled: false, start: '09:00', end: '13:00' },
            sunday: { enabled: false, start: '09:00', end: '13:00' }
          }
        }
      },
      {
        id: 'advanced',
        name: 'Configuración Avanzada',
        description: 'Configuración completa con auto-respuestas',
        config: {
          enableWelcomeMessage: true,
          welcomeMessage: '¡Hola! Gracias por contactarnos. Te responderemos lo antes posible.',
          enableAwayMessage: true,
          awayMessage: 'Actualmente no estamos disponibles. Te responderemos en nuestro próximo horario.',
          enableBusinessHours: true,
          enableAutoResponder: true,
          enableSpamFilter: true,
          spamKeywords: ['spam', 'promocion', 'oferta'],
          enableLogging: true,
          logLevel: 'info'
        }
      },
      {
        id: 'ecommerce',
        name: 'E-commerce',
        description: 'Configuración optimizada para tiendas online',
        config: {
          enableWelcomeMessage: true,
          welcomeMessage: '¡Bienvenido a nuestra tienda! ¿En qué podemos ayudarte?',
          enableAutoResponder: true,
          autoResponderRules: [
            {
              id: 'catalog',
              name: 'Catálogo',
              enabled: true,
              trigger: { type: 'keyword', value: 'catalogo', caseSensitive: false },
              response: { type: 'text', content: 'Aquí tienes nuestro catálogo: [enlace]' }
            }
          ],
          enableMediaDownload: true,
          maxMediaSize: 5,
          allowedMediaTypes: ['image', 'video']
        }
      }
    ];

    return res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    logger.error('Error getting config templates:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

export default router; 