import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Interfaces para requests
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    profile: string;
    companyId: string;
  };
}

// ========================
// RUTAS DE USUARIOS
// ========================

// Obtener todos los usuarios (con filtros)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const {
      page = 1,
      limit = 20,
      search = '',
      roleId = '',
      isActive = undefined,
    } = req.query;

    const filters = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      roleId: roleId as string,
      companyId: req.user.companyId,
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    };

    const result = await userService.getUsers(filters);

    return res.json({
      success: true,
      data: result,
      message: 'Usuarios obtenidos exitosamente',
    });
  } catch (error: any) {
    logger.error('Error obteniendo usuarios:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
    });
  }
});

// Obtener usuario por ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido',
      });
    }
    const user = await userService.getUserById(id, req.user.companyId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    return res.json({
      success: true,
      data: user,
      message: 'Usuario obtenido exitosamente',
    });
  } catch (error: any) {
    logger.error('Error obteniendo usuario:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
    });
  }
});

// Crear usuario
router.post('/', requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const { name, email, password, roleId, isActive, avatar } = req.body;

    // Validaciones
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son requeridos',
      });
    }

    const userData = {
      name,
      email,
      password,
      roleId,
      companyId: req.user.companyId,
      isActive,
      avatar,
    };

    const user = await userService.createUser(
      userData,
      req.user.id,
      req.ip
    );

    return res.status(201).json({
      success: true,
      data: user,
      message: 'Usuario creado exitosamente',
    });
  } catch (error: any) {
    logger.error('Error creando usuario:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error creando usuario',
    });
  }
});

// Actualizar usuario
router.put('/:id', requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido',
      });
    }
    
    const { name, email, password, roleId, isActive, avatar } = req.body;

    const updateData = {
      name,
      email,
      password,
      roleId,
      isActive,
      avatar,
    };

    const user = await userService.updateUser(
      id,
      updateData,
      req.user.id,
      req.user.companyId,
      req.ip
    );

    return res.json({
      success: true,
      data: user,
      message: 'Usuario actualizado exitosamente',
    });
  } catch (error: any) {
    logger.error('Error actualizando usuario:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error actualizando usuario',
    });
  }
});

// Eliminar (desactivar) usuario
router.delete('/:id', requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido',
      });
    }

    await userService.deleteUser(
      id,
      req.user.id,
      req.user.companyId,
      req.ip
    );

    return res.json({
      success: true,
      message: 'Usuario desactivado exitosamente',
    });
  } catch (error: any) {
    logger.error('Error eliminando usuario:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error eliminando usuario',
    });
  }
});

// Obtener permisos de un usuario
router.get('/:id/permissions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido',
      });
    }
    const permissions = await userService.getUserPermissions(id);

    return res.json({
      success: true,
      data: permissions,
      message: 'Permisos obtenidos exitosamente',
    });
  } catch (error: any) {
    logger.error('Error obteniendo permisos:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
    });
  }
});

// Obtener logs de actividad de un usuario
router.get('/:id/activity', requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido',
      });
    }
    const { page = 1, limit = 50 } = req.query;

    const result = await userService.getUserActivityLogs(
      id,
      parseInt(page as string),
      parseInt(limit as string)
    );

    return res.json({
      success: true,
      data: result,
      message: 'Logs de actividad obtenidos exitosamente',
    });
  } catch (error: any) {
    logger.error('Error obteniendo logs de actividad:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
    });
  }
});

// Invitar usuario
router.post('/invite', requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const { email, roleId, message, expiresInDays } = req.body;

    if (!email || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'Email y rol son requeridos',
      });
    }

    const inviteData = {
      email,
      roleId,
      companyId: req.user.companyId,
      message,
      expiresInDays,
    };

    const result = await userService.inviteUser(
      inviteData,
      req.user.id,
      req.ip
    );

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Invitación enviada exitosamente',
    });
  } catch (error: any) {
    logger.error('Error enviando invitación:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error enviando invitación',
    });
  }
});

// ========================
// RUTAS DE ROLES
// ========================

// Obtener todos los roles
router.get('/roles/all', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = await roleService.getRoles();

    return res.json({
      success: true,
      data: roles,
      message: 'Roles obtenidos exitosamente',
    });
  } catch (error: any) {
    logger.error('Error obteniendo roles:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
    });
  }
});

// Obtener roles activos para selector
router.get('/roles/active', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = await roleService.getActiveRoles();

    return res.json({
      success: true,
      data: roles,
      message: 'Roles activos obtenidos exitosamente',
    });
  } catch (error: any) {
    logger.error('Error obteniendo roles activos:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
    });
  }
});

// Obtener rol por ID
router.get('/roles/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de rol requerido',
      });
    }
    const role = await roleService.getRoleById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado',
      });
    }

    return res.json({
      success: true,
      data: role,
      message: 'Rol obtenido exitosamente',
    });
  } catch (error: any) {
    logger.error('Error obteniendo rol:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
    });
  }
});

// Crear rol personalizado
router.post('/roles', requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, displayName, description, color, permissionIds } = req.body;

    if (!name || !displayName || !permissionIds) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, nombre para mostrar y permisos son requeridos',
      });
    }

    const roleData = {
      name,
      displayName,
      description,
      color,
      permissionIds,
    };

    const role = await roleService.createRole(roleData);

    return res.status(201).json({
      success: true,
      data: role,
      message: 'Rol creado exitosamente',
    });
  } catch (error: any) {
    logger.error('Error creando rol:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error creando rol',
    });
  }
});

// Actualizar rol
router.put('/roles/:id', requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de rol requerido',
      });
    }
    const { displayName, description, color, permissionIds, isActive } = req.body;

    const updateData = {
      displayName,
      description,
      color,
      permissionIds,
      isActive,
    };

    const role = await roleService.updateRole(id, updateData);

    return res.json({
      success: true,
      data: role,
      message: 'Rol actualizado exitosamente',
    });
  } catch (error: any) {
    logger.error('Error actualizando rol:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error actualizando rol',
    });
  }
});

// Eliminar rol
router.delete('/roles/:id', requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de rol requerido',
      });
    }

    await roleService.deleteRole(id);

    return res.json({
      success: true,
      message: 'Rol eliminado exitosamente',
    });
  } catch (error: any) {
    logger.error('Error eliminando rol:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error eliminando rol',
    });
  }
});

// ========================
// RUTAS DE PERMISOS
// ========================

// Obtener todos los permisos
router.get('/permissions/all', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const permissions = await roleService.getPermissions();

    return res.json({
      success: true,
      data: permissions,
      message: 'Permisos obtenidos exitosamente',
    });
  } catch (error: any) {
    logger.error('Error obteniendo permisos:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
    });
  }
});

// Obtener permisos agrupados por módulo
router.get('/permissions/by-module', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const permissions = await roleService.getPermissionsByModule();

    return res.json({
      success: true,
      data: permissions,
      message: 'Permisos por módulo obtenidos exitosamente',
    });
  } catch (error: any) {
    logger.error('Error obteniendo permisos por módulo:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
    });
  }
});

export default router; 