import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos',
      });
    }

    const result = await authService.login({ email, password });
    
    return res.json({
      success: true,
      data: result,
      message: 'Login exitoso',
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Error en el login',
    });
  }
});

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, passwordConfirmation } = req.body;

    if (!name || !email || !password || !passwordConfirmation) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
      });
    }

    const result = await authService.register({ name, email, password, passwordConfirmation });
    
    return res.status(201).json({
      success: true,
      data: result,
      message: 'Usuario registrado exitosamente',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error en el registro',
    });
  }
});

// Logout
router.post('/logout', async (_req: Request, res: Response) => {
  try {
    // En una implementación real, aquí invalidarías el token
    return res.json({
      success: true,
      message: 'Logout exitoso',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error en el logout',
    });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token es requerido',
      });
    }

    const result = await authService.refreshToken(refreshToken);
    
    return res.json({
      success: true,
      data: result,
      message: 'Token refrescado exitosamente',
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Error al refrescar token',
    });
  }
});

// Verificar token
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autorización requerido',
      });
    }

    const token = authHeader.substring(7);
    const decoded = await authService.verifyToken(token);
    const user = await authService.getUserById(decoded.userId);
    
    return res.json({
      success: true,
      data: user,
      message: 'Usuario autenticado',
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token inválido',
    });
  }
});

export default router; 