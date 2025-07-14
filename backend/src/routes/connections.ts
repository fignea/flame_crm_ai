import { Router } from 'express';
import { connectionService } from '../services/connectionService';
import { startWhatsAppSession, getQrCode, getSession, sendMessage } from '../services/whatsappService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);



// GET /api/connections
router.get('/', async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const params = {
      page: parseInt(req.query.page || '1'),
      limit: parseInt(req.query.limit || '10'),
      type: req.query.type,
      status: req.query.status
    };

    const result = await connectionService.getAll(companyId, params);
    
    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error fetching connections:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error interno del servidor' 
    });
  }
});

// POST /api/connections/:id/start
router.post('/:id/start', async (req: any, res) => {
  console.log('POST /:id/start endpoint hit');
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const connection = await connectionService.getById(id, companyId);
    
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Conexión no encontrada' });
    }

    if (connection.type !== 'whatsapp_web') {
      return res.status(400).json({ 
        success: false, 
        message: 'Solo se puede iniciar sesión en conexiones de WhatsApp Web' 
      });
    }

    // Actualizar estado a CONNECTING
    await connectionService.updateStatus(id, 'CONNECTING');

    // Crear una promesa que se resuelve cuando el QR esté disponible
    const qrPromise = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando QR code'));
      }, 30000); // 30 segundos timeout

      startWhatsAppSession(id, (qr) => {
        clearTimeout(timeout);
        resolve(qr);
      }).catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    try {
      const qrCode = await qrPromise;
      
      // Actualizar QR en la base de datos
      await connectionService.updateStatus(id, 'CONNECTING', qrCode);

      return res.json({ 
        success: true, 
        data: { 
          qrcode: qrCode,
          sessionId: id
        } 
      });
    } catch (qrError) {
      console.error('Error generating QR:', qrError);
      
      // Actualizar estado a ERROR
      await connectionService.updateStatus(id, 'ERROR');
      
      return res.status(500).json({ 
        success: false, 
        message: 'Error generando código QR. Intenta nuevamente.' 
      });
    }
  } catch (error: any) {
    console.error('Error starting session:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error iniciando sesión de WhatsApp' 
    });
  }
});

// GET /api/connections/:id/status
router.get('/:id/status', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const connection = await connectionService.getById(id, companyId);
    
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Conexión no encontrada' });
    }

    // Si es WhatsApp, obtener estado en tiempo real
    if (connection.type === 'whatsapp_web') {
      const session = getSession(id);
      const qrCode = getQrCode(id);
      
      let status = connection.status;
      let user = null;
      
      if (session && session.user && session.user.id) {
        status = 'CONNECTED';
        user = {
          id: session.user.id,
          name: session.user.name,
          verifiedName: session.user.verifiedName
        };
        
        // Actualizar estado en la base de datos si cambió
        if (connection.status !== 'CONNECTED') {
          await connectionService.updateStatus(id, 'CONNECTED');
        }
      } else if (qrCode) {
        status = 'CONNECTING';
        // Actualizar QR en la base de datos
        await connectionService.updateStatus(id, 'CONNECTING', qrCode);
      }

      return res.json({ 
        success: true, 
        data: { 
          status,
          qrcode: qrCode || null,
          user
        } 
      });
    }

    return res.json({ 
      success: true, 
      data: { 
        status: connection.status,
        qrcode: connection.qrcode || null,
        user: null
      } 
    });
  } catch (error: any) {
    console.error('Error getting status:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error getting status' 
    });
  }
});



// POST /api/connections
router.post('/', async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { name, type, isDefault, webhookUrl, settings } = req.body;

    if (!name || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre y tipo son requeridos' 
      });
    }

    // Preparar los datos de la conexión, excluyendo settings si es null o undefined
    const connectionData: any = {
      name,
      type,
      companyId,
      isDefault,
      webhookUrl
    };
    
    // Solo incluir settings si está definido y no es null
    if (settings !== undefined && settings !== null) {
      connectionData.settings = settings;
    }

    const connection = await connectionService.create(connectionData);

    return res.status(201).json({ success: true, data: connection });
  } catch (error: any) {
    console.error('Error creating connection:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error interno del servidor' 
    });
  }
});

// PUT /api/connections/:id
router.put('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const updateData = req.body;
    const connection = await connectionService.update(id, companyId, updateData);

    return res.json({ success: true, data: connection });
  } catch (error: any) {
    console.error('Error updating connection:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error interno del servidor' 
    });
  }
});

// DELETE /api/connections/:id
router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    await connectionService.delete(id, companyId);

    return res.json({ success: true, message: 'Conexión eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error deleting connection:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error interno del servidor' 
    });
  }
});

// POST /api/connections/:id/send-message
router.post('/:id/send-message', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { number, message } = req.body;
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    // Validar datos de entrada
    if (!number || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número y mensaje son requeridos' 
      });
    }

    const connection = await connectionService.getById(id, companyId);
    
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Conexión no encontrada' });
    }

    if (connection.type !== 'whatsapp_web') {
      return res.status(400).json({ 
        success: false, 
        message: 'Solo se puede enviar mensajes desde conexiones de WhatsApp Web' 
      });
    }

    if (connection.status !== 'CONNECTED') {
      return res.status(400).json({ 
        success: false, 
        message: 'La conexión no está activa' 
      });
    }

    // Enviar el mensaje
    const result = await sendMessage(id, number, message);
    
    return res.json({ 
      success: true, 
      data: result,
      message: 'Mensaje enviado exitosamente' 
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error enviando mensaje' 
    });
  }
});

// GET /api/connections/:id (debe ir al final para no interferir con rutas más específicas)
router.get('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const connection = await connectionService.getById(id, companyId);
    
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Conexión no encontrada' });
    }

    return res.json({ success: true, data: connection });
  } catch (error: any) {
    console.error('Error fetching connection:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error interno del servidor' 
    });
  }
});

export default router; 