import 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    profile: string;
    isActive: boolean;
    companyId: string;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
}

// Blacklist de tokens en memoria (en producción usar Redis)
const tokenBlacklist = new Set<string>();

function getJwtSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  return secret;
}

function getRefreshTokenSecret(): string {
  const secret = process.env['JWT_REFRESH_SECRET'] || process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET no está definido en las variables de entorno');
  }
  return secret;
}

const getDefaultCompanyId = async () => {
  // Busca la primera empresa activa para asociar usuarios
  const company = await prisma.company.findFirst({ where: { status: 'active' } });
  if (!company) {
    throw new Error('No hay empresa activa registrada');
  }
  return company.id;
};

export const authService = {
  // Verificar si un token está en la blacklist
  isTokenBlacklisted(token: string): boolean {
    return tokenBlacklist.has(token);
  },

  // Agregar token a la blacklist
  blacklistToken(token: string): void {
    tokenBlacklist.add(token);
    logger.info('Token agregado a blacklist');
  },

  // Login de usuario
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
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
      throw new Error('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new Error('Usuario desactivado');
    }

    if (user.company.status !== 'active') {
      throw new Error('Empresa desactivada');
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Generar tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      profile: user.profile,
    };

    const token = jwt.sign(tokenPayload, getJwtSecret(), {
      expiresIn: '7d',
      issuer: 'flame-ai-crm',
      audience: 'flame-ai-client',
    });

    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        type: 'refresh',
        companyId: user.companyId,
      },
      getRefreshTokenSecret(),
      {
        expiresIn: '30d',
        issuer: 'flame-ai-crm',
        audience: 'flame-ai-client',
      }
    );

    // Actualizar lastSeen y isOnline
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastSeen: new Date(),
        isOnline: true,
      },
    });

    logger.info(`Usuario ${user.email} inició sesión`, {
      userId: user.id,
      companyId: user.companyId,
      ip: 'N/A', // Se puede pasar desde el controlador
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        isActive: user.isActive,
        companyId: user.companyId,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      token,
      refreshToken,
    };
  },

  // Registro de usuario
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const { name, email, password, passwordConfirmation } = userData;

    // Validaciones
    if (password !== passwordConfirmation) {
      throw new Error('Las contraseñas no coinciden');
    }

    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // Validar complejidad de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      throw new Error('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un caracter especial');
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Obtener companyId por defecto
    const companyId = await getDefaultCompanyId();

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        profile: 'user',
        isActive: true,
        isOnline: true,
        companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    // Generar tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      profile: user.profile,
    };

    const token = jwt.sign(tokenPayload, getJwtSecret(), {
      expiresIn: '7d',
      issuer: 'flame-ai-crm',
      audience: 'flame-ai-client',
    });

    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        type: 'refresh',
        companyId: user.companyId,
      },
      getRefreshTokenSecret(),
      {
        expiresIn: '30d',
        issuer: 'flame-ai-crm',
        audience: 'flame-ai-client',
      }
    );

    logger.info(`Nuevo usuario registrado: ${user.email}`, {
      userId: user.id,
      companyId: user.companyId,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        isActive: user.isActive,
        companyId: user.companyId,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      token,
      refreshToken,
    };
  },

  // Verificar token
  async verifyToken(token: string): Promise<any> {
    try {
      // Verificar si el token está en la blacklist
      if (this.isTokenBlacklisted(token)) {
        throw new Error('Token inválido');
      }

      const decoded = jwt.verify(token, getJwtSecret(), {
        issuer: 'flame-ai-crm',
        audience: 'flame-ai-client',
      });

      return decoded;
    } catch (error) {
      throw new Error('Token inválido');
    }
  },

  // Obtener usuario por ID con compañía
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
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
      throw new Error('Usuario no encontrado');
    }

    if (user.company.status !== 'active') {
      throw new Error('Empresa desactivada');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      isActive: user.isActive,
      companyId: user.companyId,
      company: user.company,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, getRefreshTokenSecret(), {
        issuer: 'flame-ai-crm',
        audience: 'flame-ai-client',
      }) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido');
      }

      const user = await this.getUserById(decoded.userId);
      if (!user.isActive) {
        throw new Error('Usuario desactivado');
      }

      // Generar nuevo token
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
        profile: user.profile,
      };

      const newToken = jwt.sign(tokenPayload, getJwtSecret(), {
        expiresIn: '7d',
        issuer: 'flame-ai-crm',
        audience: 'flame-ai-client',
      });

      // Generar nuevo refresh token
      const newRefreshToken = jwt.sign(
        { 
          userId: user.id, 
          type: 'refresh',
          companyId: user.companyId,
        },
        getRefreshTokenSecret(),
        {
          expiresIn: '30d',
          issuer: 'flame-ai-crm',
          audience: 'flame-ai-client',
        }
      );

      logger.info(`Token renovado para usuario ${user.email}`, {
        userId: user.id,
        companyId: user.companyId,
      });

      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Token de refresh inválido');
    }
  },

  // Logout
  async logout(token: string): Promise<void> {
    try {
      // Agregar token a blacklist
      this.blacklistToken(token);
      
      // Decodificar token para obtener userId
      const decoded = jwt.decode(token) as any;
      if (decoded?.userId) {
        // Actualizar estado online del usuario
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { isOnline: false },
        });
      }

      logger.info('Usuario desconectado', {
        userId: decoded?.userId,
      });
    } catch (error) {
      logger.error('Error en logout:', error);
      throw new Error('Error al cerrar sesión');
    }
  },
}; 