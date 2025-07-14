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
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
}

function getJwtSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  return secret;
}

const getCompanyId = async () => {
  // Busca la primera empresa activa para asociar usuarios
  const company = await prisma.company.findFirst({ where: { status: 'active' } });
  if (!company) throw new Error('No hay empresa activa registrada');
  return company.id;
};

export const authService = {
  // Login de usuario
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new Error('Usuario desactivado');
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Generar tokens
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    // Actualizar lastSeen
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });

    logger.info(`Usuario ${user.email} inició sesión`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        isActive: user.isActive,
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

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
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

    // Obtener companyId
    const companyId = await getCompanyId();

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        profile: 'user',
        isActive: true,
        isOnline: false,
        companyId,
      },
    });

    // Generar tokens
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    logger.info(`Nuevo usuario registrado: ${user.email}`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        isActive: user.isActive,
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
      const decoded = jwt.verify(token, getJwtSecret());
      return decoded;
    } catch (error) {
      throw new Error('Token inválido');
    }
  },

  // Obtener usuario por ID
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profile: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    try {
      const decoded = jwt.verify(refreshToken, getJwtSecret()) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido');
      }

      const user = await this.getUserById(decoded.userId);
      if (!user.isActive) {
        throw new Error('Usuario desactivado');
      }

      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        getJwtSecret(),
        { expiresIn: '7d' }
      );

      return { token: newToken };
    } catch (error) {
      throw new Error('Token de refresh inválido');
    }
  },
}; 