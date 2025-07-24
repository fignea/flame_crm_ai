import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import { prisma } from '../prisma/client';

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  thumbnail?: string;
  duration?: number; // Para audio/video
  dimensions?: { width: number; height: number }; // Para imágenes
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
  optimize?: boolean;
  quality?: number;
}

export class MediaService {
  private static readonly UPLOAD_DIR = 'uploads';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/avi',
    'video/mov',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/mpeg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  private static readonly THUMBNAIL_SIZE = 200;
  private static readonly IMAGE_QUALITY = 85;

  static async initialize(): Promise<void> {
    try {
      // Crear directorios necesarios
      const dirs = [
        this.UPLOAD_DIR,
        path.join(this.UPLOAD_DIR, 'images'),
        path.join(this.UPLOAD_DIR, 'videos'),
        path.join(this.UPLOAD_DIR, 'audio'),
        path.join(this.UPLOAD_DIR, 'documents'),
        path.join(this.UPLOAD_DIR, 'thumbnails')
      ];

      for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      logger.info('Media service initialized successfully');
    } catch (error) {
      logger.error('Error initializing media service:', error);
      throw error;
    }
  }

  static getMulterStorage(companyId: string): multer.StorageEngine {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const mediaType = this.getMediaType(file.mimetype);
        const dir = path.join(this.UPLOAD_DIR, mediaType);
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });
  }

  static getMulterFileFilter() {
    return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (this.ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
      }
    };
  }

  static createUploader(companyId: string, options: MediaUploadOptions = {}) {
    return multer({
      storage: this.getMulterStorage(companyId),
      fileFilter: this.getMulterFileFilter(),
      limits: {
        fileSize: options.maxSize || this.MAX_FILE_SIZE
      }
    });
  }

  private static getMediaType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'documents';
  }

  static async processUploadedFile(
    file: Express.Multer.File,
    companyId: string,
    options: MediaUploadOptions = {}
  ): Promise<MediaFile> {
    try {
      const mediaType = this.getMediaType(file.mimetype);
      const fileUrl = `/uploads/${mediaType}/${file.filename}`;
      
      let thumbnail: string | undefined;
      let dimensions: { width: number; height: number } | undefined;
      let duration: number | undefined;

      // Procesar imágenes
      if (mediaType === 'images') {
        const imageInfo = await sharp(file.path).metadata();
        dimensions = { width: imageInfo.width || 0, height: imageInfo.height || 0 };

        // Optimizar imagen si se requiere
        if (options.optimize) {
          await this.optimizeImage(file.path, options.quality || this.IMAGE_QUALITY);
        }

        // Generar thumbnail
        if (options.generateThumbnail !== false) {
          thumbnail = await this.generateImageThumbnail(file.path, file.filename);
        }
      }

      // Procesar videos
      if (mediaType === 'videos') {
        duration = await this.getVideoDuration(file.path);
        
        if (options.generateThumbnail !== false) {
          thumbnail = await this.generateVideoThumbnail(file.path, file.filename);
        }
      }

      // Procesar audio
      if (mediaType === 'audio') {
        duration = await this.getAudioDuration(file.path);
      }

      // Guardar en base de datos
      const mediaFile = await prisma.mediaFile.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: fileUrl,
          thumbnail,
          duration,
          dimensions: dimensions ? JSON.stringify(dimensions) : null,
          companyId
        }
      });

      logger.info(`File uploaded successfully: ${file.filename}`);

      return {
        id: mediaFile.id,
        filename: mediaFile.filename,
        originalName: mediaFile.originalName,
        mimetype: mediaFile.mimetype,
        size: mediaFile.size,
        path: mediaFile.path,
        url: mediaFile.url,
        thumbnail: mediaFile.thumbnail || undefined,
        duration: mediaFile.duration || undefined,
        dimensions: mediaFile.dimensions ? JSON.parse(mediaFile.dimensions) : undefined,
        companyId: mediaFile.companyId,
        createdAt: mediaFile.createdAt,
        updatedAt: mediaFile.updatedAt
      };
    } catch (error) {
      logger.error('Error processing uploaded file:', error);
      // Limpiar archivo en caso de error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  private static async optimizeImage(imagePath: string, quality: number): Promise<void> {
    try {
      const tempPath = `${imagePath}.tmp`;
      
      await sharp(imagePath)
        .jpeg({ quality, progressive: true })
        .toFile(tempPath);

      // Reemplazar archivo original con versión optimizada
      fs.renameSync(tempPath, imagePath);
    } catch (error) {
      logger.error('Error optimizing image:', error);
      throw error;
    }
  }

  private static async generateImageThumbnail(imagePath: string, filename: string): Promise<string> {
    try {
      const thumbnailDir = path.join(this.UPLOAD_DIR, 'thumbnails');
      const thumbnailName = `thumb_${filename}`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailName);

      await sharp(imagePath)
        .resize(this.THUMBNAIL_SIZE, this.THUMBNAIL_SIZE, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      return `/uploads/thumbnails/${thumbnailName}`;
    } catch (error) {
      logger.error('Error generating image thumbnail:', error);
      throw error;
    }
  }

  private static async generateVideoThumbnail(videoPath: string, filename: string): Promise<string> {
    try {
      // Nota: Aquí se necesitaría ffmpeg para generar thumbnails de video
      // Por simplicidad, retornamos un placeholder
      return '/assets/video-placeholder.jpg';
    } catch (error) {
      logger.error('Error generating video thumbnail:', error);
      throw error;
    }
  }

  private static async getVideoDuration(videoPath: string): Promise<number> {
    try {
      // Nota: Aquí se necesitaría ffmpeg para obtener la duración
      // Por simplicidad, retornamos 0
      return 0;
    } catch (error) {
      logger.error('Error getting video duration:', error);
      return 0;
    }
  }

  private static async getAudioDuration(audioPath: string): Promise<number> {
    try {
      // Nota: Aquí se necesitaría una librería para obtener la duración
      // Por simplicidad, retornamos 0
      return 0;
    } catch (error) {
      logger.error('Error getting audio duration:', error);
      return 0;
    }
  }

  static async getMediaFile(id: string, companyId: string): Promise<MediaFile | null> {
    try {
      const mediaFile = await prisma.mediaFile.findFirst({
        where: { id, companyId }
      });

      if (!mediaFile) return null;

      return {
        id: mediaFile.id,
        filename: mediaFile.filename,
        originalName: mediaFile.originalName,
        mimetype: mediaFile.mimetype,
        size: mediaFile.size,
        path: mediaFile.path,
        url: mediaFile.url,
        thumbnail: mediaFile.thumbnail || undefined,
        duration: mediaFile.duration || undefined,
        dimensions: mediaFile.dimensions ? JSON.parse(mediaFile.dimensions) : undefined,
        companyId: mediaFile.companyId,
        createdAt: mediaFile.createdAt,
        updatedAt: mediaFile.updatedAt
      };
    } catch (error) {
      logger.error('Error getting media file:', error);
      throw error;
    }
  }

  static async deleteMediaFile(id: string, companyId: string): Promise<boolean> {
    try {
      const mediaFile = await prisma.mediaFile.findFirst({
        where: { id, companyId }
      });

      if (!mediaFile) return false;

      // Eliminar archivo físico
      if (fs.existsSync(mediaFile.path)) {
        fs.unlinkSync(mediaFile.path);
      }

      // Eliminar thumbnail si existe
      if (mediaFile.thumbnail) {
        const thumbnailPath = path.join(process.cwd(), mediaFile.thumbnail);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }

      // Eliminar registro de base de datos
      await prisma.mediaFile.delete({
        where: { id }
      });

      logger.info(`Media file deleted: ${mediaFile.filename}`);
      return true;
    } catch (error) {
      logger.error('Error deleting media file:', error);
      throw error;
    }
  }

  static async getMediaFiles(companyId: string, filters: {
    type?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ files: MediaFile[]; total: number }> {
    try {
      const { type, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      const where: any = { companyId };
      if (type) {
        where.mimetype = { startsWith: type };
      }

      const [files, total] = await Promise.all([
        prisma.mediaFile.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.mediaFile.count({ where })
      ]);

             return {
         files: files.map((file: any) => ({
          id: file.id,
          filename: file.filename,
          originalName: file.originalName,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: file.url,
          thumbnail: file.thumbnail,
          duration: file.duration,
          dimensions: file.dimensions ? JSON.parse(file.dimensions) : undefined,
          companyId: file.companyId,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        })),
        total
      };
    } catch (error) {
      logger.error('Error getting media files:', error);
      throw error;
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  static isVideoFile(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  }

  static isAudioFile(mimetype: string): boolean {
    return mimetype.startsWith('audio/');
  }

  static isDocumentFile(mimetype: string): boolean {
    return mimetype.startsWith('application/') || mimetype.startsWith('text/');
  }
}

export default MediaService; 