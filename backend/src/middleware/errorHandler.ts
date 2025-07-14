import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  // Log del error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: _req.url,
    method: _req.method,
    ip: _req.ip,
    userAgent: _req.get('User-Agent'),
  });

  // Respuesta de error
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`) as AppError;
  error.statusCode = 404;
  next(error);
}; 