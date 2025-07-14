import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    companyId: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log(`Auth middleware - ${req.method} ${req.originalUrl}`);
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token de autorización requerido',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env['JWT_SECRET'] || 'flame-ai-super-secret-key-2024') as any;
    
    // Buscar usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Usuario desactivado',
      });
      return;
    }

    // Agregar información del usuario a la request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
  }
}; 