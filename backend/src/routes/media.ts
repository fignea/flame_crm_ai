import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import MediaService from '../services/mediaService';
import { logger } from '../utils/logger';
import path from 'path';

const router = Router();
router.use(authMiddleware);

// Inicializar servicio de medios
MediaService.initialize().catch(console.error);

// POST /api/media/upload - Subir archivo
router.post('/upload', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const uploader = MediaService.createUploader(companyId, {
      maxSize: 10 * 1024 * 1024, // 10MB
      generateThumbnail: true,
      optimize: true,
      quality: 85
    });

    // Usar multer como middleware
    return uploader.single('file')(req, res, async (err) => {
      if (err) {
        logger.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha proporcionado ningún archivo'
        });
      }

      try {
        const mediaFile = await MediaService.processUploadedFile(
          req.file,
          companyId,
          {
            generateThumbnail: true,
            optimize: true,
            quality: 85
          }
        );

        return res.json({
          success: true,
          data: mediaFile,
          message: 'Archivo subido exitosamente'
        });
      } catch (processingError) {
        logger.error('Error processing uploaded file:', processingError);
        return res.status(500).json({
          success: false,
          message: 'Error procesando el archivo'
        });
      }
    });
  } catch (error) {
    logger.error('Error in upload endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/media - Obtener lista de archivos
router.get('/', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const { type, page = 1, limit = 20 } = req.query;

    const result = await MediaService.getMediaFiles(companyId, {
      type: type as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: result.files,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Error getting media files:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/media/:id - Obtener archivo específico
router.get('/:id', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const mediaFile = await MediaService.getMediaFile(id, companyId);

    if (!mediaFile) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    return res.json({
      success: true,
      data: mediaFile
    });
  } catch (error) {
    logger.error('Error getting media file:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/media/:id/download - Descargar archivo
router.get('/:id/download', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const mediaFile = await MediaService.getMediaFile(id, companyId);

    if (!mediaFile) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    // Verificar que el archivo existe físicamente
    const fs = require('fs');
    if (!fs.existsSync(mediaFile.path)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el sistema'
      });
    }

    // Configurar headers para descarga
    res.setHeader('Content-Disposition', `attachment; filename="${mediaFile.originalName}"`);
    res.setHeader('Content-Type', mediaFile.mimetype);
    res.setHeader('Content-Length', mediaFile.size);

    // Enviar archivo
    return res.sendFile(path.resolve(mediaFile.path));
  } catch (error) {
    logger.error('Error downloading media file:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/media/:id - Eliminar archivo
router.delete('/:id', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const success = await MediaService.deleteMediaFile(id, companyId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    return res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error deleting media file:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/media/stats - Obtener estadísticas de archivos
router.get('/stats', async (req: any, res) => {
  try {
    const { companyId } = req.user;

    const [images, videos, audio, documents] = await Promise.all([
      MediaService.getMediaFiles(companyId, { type: 'image' }),
      MediaService.getMediaFiles(companyId, { type: 'video' }),
      MediaService.getMediaFiles(companyId, { type: 'audio' }),
      MediaService.getMediaFiles(companyId, { type: 'application' })
    ]);

    const totalSize = [
      ...images.files,
      ...videos.files,
      ...audio.files,
      ...documents.files
    ].reduce((sum, file) => sum + file.size, 0);

    res.json({
      success: true,
      data: {
        total: images.total + videos.total + audio.total + documents.total,
        images: images.total,
        videos: videos.total,
        audio: audio.total,
        documents: documents.total,
        totalSize: totalSize,
        formattedSize: MediaService.formatFileSize(totalSize)
      }
    });
  } catch (error) {
    logger.error('Error getting media stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router; 