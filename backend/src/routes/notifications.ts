import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import NotificationService from '../services/notificationService';
import { logger } from '../utils/logger';

const router = Router();
const notificationService = NotificationService.getInstance();

// Aplicar middleware de autenticación
router.use(authMiddleware);

// GET /api/notifications - Obtener notificaciones del usuario
router.get('/', async (req: any, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;

    const notifications = await notificationService.getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: notifications
    });
  } catch (error: any) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener notificaciones'
    });
  }
});

// GET /api/notifications/stats - Obtener estadísticas de notificaciones
router.get('/stats', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const stats = await notificationService.getNotificationStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener estadísticas de notificaciones'
    });
  }
});

// POST /api/notifications/:id/read - Marcar notificación como leída
router.post('/:id/read', async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await notificationService.markAsRead(userId, id);

    return res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error: any) {
    logger.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al marcar notificación como leída'
    });
  }
});

// POST /api/notifications/read-all - Marcar todas las notificaciones como leídas
router.post('/read-all', async (req: any, res) => {
  try {
    const userId = req.user.id;

    await notificationService.markAllAsRead(userId);

    return res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error: any) {
    logger.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al marcar todas las notificaciones como leídas'
    });
  }
});

// GET /api/notifications/preferences - Obtener preferencias de notificación
router.get('/preferences', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const preferences = await notificationService.getUserPreferences(userId);

    return res.json({
      success: true,
      data: preferences
    });
  } catch (error: any) {
    logger.error('Error getting notification preferences:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener preferencias de notificación'
    });
  }
});

// PUT /api/notifications/preferences - Actualizar preferencias de notificación
router.put('/preferences', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    await notificationService.updateUserPreferences(userId, preferences);

    return res.json({
      success: true,
      message: 'Preferencias de notificación actualizadas'
    });
  } catch (error: any) {
    logger.error('Error updating notification preferences:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar preferencias de notificación'
    });
  }
});

// POST /api/notifications/push/subscribe - Suscribirse a notificaciones push
router.post('/push/subscribe', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { endpoint, keys, userAgent } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Datos de suscripción inválidos'
      });
    }

    await notificationService.addPushSubscription(userId, {
      endpoint,
      keys,
      userAgent
    });

    return res.json({
      success: true,
      message: 'Suscripción push agregada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error adding push subscription:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al agregar suscripción push'
    });
  }
});

// DELETE /api/notifications/push/unsubscribe - Desuscribirse de notificaciones push
router.delete('/push/unsubscribe', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint requerido'
      });
    }

    await notificationService.removePushSubscription(userId, endpoint);

    return res.json({
      success: true,
      message: 'Suscripción push removida exitosamente'
    });
  } catch (error: any) {
    logger.error('Error removing push subscription:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al remover suscripción push'
    });
  }
});

// POST /api/notifications/test - Enviar notificación de prueba
router.post('/test', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    const { type = 'system', title = 'Notificación de prueba', message = 'Esta es una notificación de prueba', priority = 'medium' } = req.body;

    await notificationService.sendNotification({
      type,
      title,
      message,
      userId,
      companyId,
      priority,
      persistent: false,
      channels: ['websocket', 'push', 'desktop']
    });

    return res.json({
      success: true,
      message: 'Notificación de prueba enviada'
    });
  } catch (error: any) {
    logger.error('Error sending test notification:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al enviar notificación de prueba'
    });
  }
});

// POST /api/notifications/cleanup - Limpiar notificaciones antiguas (admin)
router.post('/cleanup', async (req: any, res) => {
  try {
    const { daysToKeep = 30 } = req.body;

    // Verificar que el usuario es admin
    if (req.user.profile !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    await notificationService.cleanupOldNotifications(parseInt(daysToKeep));

    return res.json({
      success: true,
      message: 'Limpieza de notificaciones completada'
    });
  } catch (error: any) {
    logger.error('Error cleaning up notifications:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al limpiar notificaciones'
    });
  }
});

export default router; 