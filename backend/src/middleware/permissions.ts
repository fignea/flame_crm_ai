import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
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

// Middleware para verificar permisos granulares
export const requirePermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NOT_AUTHENTICATED',
        });
        return;
      }

      // Verificar si el usuario tiene el permiso específico
      const hasPermission = await userService.hasPermission(req.user.id, permission);

      if (!hasPermission) {
        logger.warn('Acceso denegado: Permiso insuficiente', {
          userId: req.user.id,
          userEmail: req.user.email,
          requiredPermission: permission,
          endpoint: `${req.method} ${req.originalUrl}`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.status(403).json({
          success: false,
          message: 'No tienes permisos para realizar esta acción',
          error: 'INSUFFICIENT_PERMISSIONS',
          requiredPermission: permission,
        });
        return;
      }

      logger.info('Acceso autorizado', {
        userId: req.user.id,
        permission,
        endpoint: `${req.method} ${req.originalUrl}`,
      });

      next();
    } catch (error) {
      logger.error('Error verificando permisos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'PERMISSION_CHECK_ERROR',
      });
    }
  };
};

// Middleware para verificar múltiples permisos (usuario debe tener AL MENOS uno)
export const requireAnyPermission = (permissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NOT_AUTHENTICATED',
        });
        return;
      }

      // Verificar si el usuario tiene al menos uno de los permisos
      const userPermissions = await userService.getUserPermissions(req.user.id);
      const userPermissionNames = userPermissions.map(p => p.name);
      
      const hasAnyPermission = permissions.some(permission => 
        userPermissionNames.includes(permission)
      );

      if (!hasAnyPermission) {
        logger.warn('Acceso denegado: Ningún permiso suficiente', {
          userId: req.user.id,
          userEmail: req.user.email,
          requiredPermissions: permissions,
          userPermissions: userPermissionNames,
          endpoint: `${req.method} ${req.originalUrl}`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.status(403).json({
          success: false,
          message: 'No tienes permisos para realizar esta acción',
          error: 'INSUFFICIENT_PERMISSIONS',
          requiredPermissions: permissions,
        });
        return;
      }

      logger.info('Acceso autorizado con permiso alternativo', {
        userId: req.user.id,
        matchedPermissions: permissions.filter(p => userPermissionNames.includes(p)),
        endpoint: `${req.method} ${req.originalUrl}`,
      });

      next();
    } catch (error) {
      logger.error('Error verificando permisos múltiples:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'PERMISSION_CHECK_ERROR',
      });
    }
  };
};

// Middleware para verificar múltiples permisos (usuario debe tener TODOS)
export const requireAllPermissions = (permissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NOT_AUTHENTICATED',
        });
        return;
      }

      // Verificar si el usuario tiene todos los permisos
      const userPermissions = await userService.getUserPermissions(req.user.id);
      const userPermissionNames = userPermissions.map(p => p.name);
      
      const hasAllPermissions = permissions.every(permission => 
        userPermissionNames.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = permissions.filter(p => !userPermissionNames.includes(p));
        
        logger.warn('Acceso denegado: Permisos faltantes', {
          userId: req.user.id,
          userEmail: req.user.email,
          requiredPermissions: permissions,
          missingPermissions,
          endpoint: `${req.method} ${req.originalUrl}`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.status(403).json({
          success: false,
          message: 'No tienes todos los permisos necesarios para realizar esta acción',
          error: 'INSUFFICIENT_PERMISSIONS',
          requiredPermissions: permissions,
          missingPermissions,
        });
        return;
      }

      logger.info('Acceso autorizado con todos los permisos', {
        userId: req.user.id,
        permissions,
        endpoint: `${req.method} ${req.originalUrl}`,
      });

      next();
    } catch (error) {
      logger.error('Error verificando todos los permisos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'PERMISSION_CHECK_ERROR',
      });
    }
  };
};

// Middleware para verificar permisos basados en módulo y acción
export const requireModulePermission = (module: string, action: string) => {
  const permission = `${module}.${action}`;
  return requirePermission(permission);
};

// Middleware para verificar si el usuario puede acceder a recursos de la misma empresa
export const requireSameCompanyAccess = (getCompanyIdFromRequest: (req: AuthenticatedRequest) => string | undefined) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
          error: 'NOT_AUTHENTICATED',
        });
        return;
      }

      const resourceCompanyId = getCompanyIdFromRequest(req);
      
      if (!resourceCompanyId) {
        res.status(400).json({
          success: false,
          message: 'No se pudo determinar la empresa del recurso',
          error: 'COMPANY_ID_REQUIRED',
        });
        return;
      }

      if (req.user.companyId !== resourceCompanyId) {
        logger.warn('Acceso denegado: Empresa diferente', {
          userId: req.user.id,
          userCompanyId: req.user.companyId,
          resourceCompanyId,
          endpoint: `${req.method} ${req.originalUrl}`,
          ip: req.ip,
        });

        res.status(403).json({
          success: false,
          message: 'No tienes acceso a recursos de otra empresa',
          error: 'DIFFERENT_COMPANY_ACCESS',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error verificando acceso a empresa:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'COMPANY_ACCESS_CHECK_ERROR',
      });
    }
  };
};

// Middleware para verificar si el usuario es super admin
export const requireSuperAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED',
      });
      return;
    }

    // Verificar si el usuario tiene el rol de super admin
    const userPermissions = await userService.getUserPermissions(req.user.id);
    const hasAllPermissions = userPermissions.length >= 40; // Super admin tiene todos los permisos

    if (!hasAllPermissions && req.user.profile !== 'super_admin') {
      logger.warn('Acceso denegado: No es super admin', {
        userId: req.user.id,
        userProfile: req.user.profile,
        endpoint: `${req.method} ${req.originalUrl}`,
        ip: req.ip,
      });

      res.status(403).json({
        success: false,
        message: 'Se requieren permisos de super administrador',
        error: 'SUPER_ADMIN_REQUIRED',
      });
      return;
    }

    logger.info('Acceso autorizado como super admin', {
      userId: req.user.id,
      endpoint: `${req.method} ${req.originalUrl}`,
    });

    next();
  } catch (error) {
    logger.error('Error verificando super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'SUPER_ADMIN_CHECK_ERROR',
    });
  }
};

// Funciones helper para permisos específicos
export const permissions = {
  // Permisos de usuarios
  users: {
    create: requirePermission('users.create'),
    read: requirePermission('users.read'),
    update: requirePermission('users.update'),
    delete: requirePermission('users.delete'),
    invite: requirePermission('users.invite'),
    manageRoles: requirePermission('users.manage_roles'),
    viewActivity: requirePermission('users.view_activity'),
  },
  
  // Permisos de contactos
  contacts: {
    create: requirePermission('contacts.create'),
    read: requirePermission('contacts.read'),
    update: requirePermission('contacts.update'),
    delete: requirePermission('contacts.delete'),
    export: requirePermission('contacts.export'),
    import: requirePermission('contacts.import'),
  },
  
  // Permisos de conversaciones
  conversations: {
    read: requirePermission('conversations.read'),
    send: requirePermission('conversations.send'),
    assign: requirePermission('conversations.assign'),
    close: requirePermission('conversations.close'),
  },
  
  // Permisos de tickets
  tickets: {
    create: requirePermission('tickets.create'),
    read: requirePermission('tickets.read'),
    update: requirePermission('tickets.update'),
    delete: requirePermission('tickets.delete'),
    assign: requirePermission('tickets.assign'),
    close: requirePermission('tickets.close'),
  },
  
  // Permisos de configuración
  settings: {
    read: requirePermission('settings.read'),
    update: requirePermission('settings.update'),
    integrations: requirePermission('settings.integrations'),
  },
  
  // Permisos de reportes
  reports: {
    read: requirePermission('reports.read'),
    export: requirePermission('reports.export'),
    advanced: requirePermission('reports.advanced'),
  },
}; 