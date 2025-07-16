import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    profile: string;
    companyId: string;
  };
}

interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  profile: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Acceso denegado: Token de autorización faltante', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.originalUrl}`,
      });
      
      res.status(401).json({
        success: false,
        message: 'Token de autorización requerido',
        error: 'UNAUTHORIZED',
      });
      return;
    }

    const token = authHeader.substring(7);
    
    // Verificar si el token está en la blacklist
    if (authService.isTokenBlacklisted(token)) {
      logger.warn('Acceso denegado: Token en blacklist', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.originalUrl}`,
      });
      
      res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        error: 'TOKEN_BLACKLISTED',
      });
      return;
    }

    // Verificar y decodificar el token
    const decoded = await authService.verifyToken(token) as JwtPayload;
    
    // Buscar usuario en la base de datos con validaciones multi-tenant
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        companyId: decoded.companyId, // Validación multi-tenant
      },
      select: {
        id: true,
        email: true,
        name: true,
        profile: true,
        companyId: true,
        isActive: true,
        company: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn('Acceso denegado: Usuario no encontrado', {
        userId: decoded.userId,
        companyId: decoded.companyId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.originalUrl}`,
      });
      
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND',
      });
      return;
    }

    if (!user.isActive) {
      logger.warn('Acceso denegado: Usuario desactivado', {
        userId: user.id,
        companyId: user.companyId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.originalUrl}`,
      });
      
      res.status(401).json({
        success: false,
        message: 'Usuario desactivado',
        error: 'USER_INACTIVE',
      });
      return;
    }

    if (user.company.status !== 'active') {
      logger.warn('Acceso denegado: Empresa desactivada', {
        userId: user.id,
        companyId: user.companyId,
        companyStatus: user.company.status,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.originalUrl}`,
      });
      
      res.status(401).json({
        success: false,
        message: 'Empresa desactivada',
        error: 'COMPANY_INACTIVE',
      });
      return;
    }

    // Agregar información del usuario a la request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      profile: user.profile,
      companyId: user.companyId,
    };

    // Actualizar última actividad del usuario (opcional, para sesiones activas)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });

    const processingTime = Date.now() - startTime;
    logger.info('Autenticación exitosa', {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      endpoint: `${req.method} ${req.originalUrl}`,
      processingTime: `${processingTime}ms`,
    });

    next();
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Error en autenticación', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: `${req.method} ${req.originalUrl}`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      processingTime: `${processingTime}ms`,
    });

    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: 'TOKEN_INVALID',
    });
  }
};

// Middleware para verificar roles específicos
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.profile)) {
      logger.warn('Acceso denegado: Rol insuficiente', {
        userId: req.user.id,
        userRole: req.user.profile,
        requiredRoles: allowedRoles,
        endpoint: `${req.method} ${req.originalUrl}`,
      });

      res.status(403).json({
        success: false,
        message: 'Permisos insuficientes',
        error: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};

// Middleware para verificar si el usuario pertenece a la misma empresa
export const requireSameCompany = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuario no autenticado',
      error: 'NOT_AUTHENTICATED',
    });
    return;
  }

  // Este middleware se puede usar en conjunto con validaciones específicas
  // Por ejemplo, verificar que un contactId pertenece a la misma compañía
  next();
}; 