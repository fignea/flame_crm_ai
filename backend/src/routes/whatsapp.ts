import { Router } from 'express';
import { startWhatsAppSession, getQrCode, getSession } from '../services/whatsappService';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'WhatsApp endpoint' });
});

// Iniciar sesión y obtener QR
router.post('/:id/start', async (req, res) => {
  const { id } = req.params;
  try {
    let qrCode: string | undefined;
    await startWhatsAppSession(id, (qr) => {
      qrCode = qr;
    });
    // Esperar un poco para que el QR esté disponible
    setTimeout(() => {
      qrCode = getQrCode(id);
      if (qrCode) {
        res.json({ success: true, data: { qrcode: qrCode } });
      } else {
        res.status(202).json({ success: false, message: 'QR no disponible aún, reintenta en unos segundos.' });
      }
      // No es necesario retornar nada aquí
    }, 1500);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error iniciando sesión de WhatsApp' });
  }
});

// Obtener estado de la conexión
router.get('/:id/status', (req, res) => {
  const { id } = req.params;
  try {
    const session = getSession(id);
    const qrCode = getQrCode(id);
    
    if (!session) {
      return res.json({ success: true, data: { status: 'DISCONNECTED', qrcode: null } });
    }
    
    // Verificar si la sesión está conectada
    const isConnected = session.user && session.user.id;
    
    return res.json({ 
      success: true, 
      data: { 
        status: isConnected ? 'CONNECTED' : 'CONNECTING',
        qrcode: qrCode || null,
        user: isConnected && session.user ? {
          id: session.user.id,
          name: session.user.name,
          verifiedName: session.user.verifiedName
        } : null
      } 
    });
  } catch (error) {
    console.error('Error getting status:', error);
    return res.status(500).json({ success: false, message: 'Error getting status' });
  }
});

export default router; 