import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Configuración de Helmet para seguridad
export const securityMiddleware = helmet({
  // Configurar Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  
  // Configurar HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true,
  },
  
  // Configurar X-Frame-Options
  frameguard: {
    action: 'deny',
  },
  
  // Configurar X-Content-Type-Options
  noSniff: true,
  
  // Configurar X-XSS-Protection
  xssFilter: true,
  
  // Configurar Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  // Configurar X-Powered-By
  hidePoweredBy: true,
});

// Rate limiting general
export const rateLimitMiddleware = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW'] || '1') * 60 * 1000, // 1 minuto por defecto
  max: parseInt(process.env['RATE_LIMIT_REQUESTS'] || '100'), // 100 requests por minuto
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP. Intente nuevamente más tarde.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Retorna rate limit info en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  skip: (req: Request) => {
    // Saltar rate limiting para health checks
    return req.originalUrl === '/api/health';
  },
});

// Rate limiting específico para auth
export const authRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por 15 minutos
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intente nuevamente en 15 minutos.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware adicional para headers de seguridad personalizados
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Configurar cache control para datos sensibles
  if (req.originalUrl.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Header personalizado para identificar la aplicación
  res.setHeader('X-Application', 'Flame-AI-CRM');
  
  // Configurar headers para CORS avanzado
  const allowedOrigins = [
    process.env['FRONTEND_URL'] || 'http://localhost:3000',
    'http://localhost:3000',
    'https://localhost:3000',
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  
  next();
};

// Middleware para logging de seguridad
export const securityLogging = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log de requests sospechosos
  const suspiciousPatterns = [
    /\/\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection attempts
    /javascript:/i, // JavaScript protocol
    /onload=/i, // Event handlers
    /onerror=/i, // Error handlers
  ];
  
  const fullUrl = req.originalUrl;
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(fullUrl));
  
  if (isSuspicious) {
    logger.warn('Request sospechoso detectado', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: fullUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Log de todos los requests en desarrollo
  if (process.env['NODE_ENV'] === 'development') {
    logger.info('Security middleware', {
      method: req.method,
      url: fullUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  }
  
  // Interceptar respuestas de error
  const originalJson = res.json;
  res.json = function(data: any) {
    const processingTime = Date.now() - startTime;
    
    // Log de respuestas de error
    if (res.statusCode >= 400) {
      logger.warn('Error response', {
        method: req.method,
        url: fullUrl,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        processingTime: `${processingTime}ms`,
        responseData: data,
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Middleware para validar headers requeridos
export const validateHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Validar Content-Type para requests POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.headers['content-type']) {
    res.status(400).json({
      success: false,
      message: 'Content-Type header es requerido',
      error: 'MISSING_CONTENT_TYPE',
    });
    return;
  }
  
  // Validar User-Agent
  if (!req.headers['user-agent']) {
    logger.warn('Request sin User-Agent', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });
  }
  
  next();
};

// Middleware para limpiar datos de entrada
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // Sanitizar query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).trim();
      }
    }
  }
  
  // Sanitizar body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  
  next();
}; 