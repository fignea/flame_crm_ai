import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import app from '../src/index';
import { authService } from '../src/services/authService';

const prisma = new PrismaClient();

// Datos de prueba
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPass123!',
  passwordConfirmation: 'TestPass123!',
};

const testCompany = {
  name: 'Test Company',
  status: 'active',
  plan: 'basic',
};

describe('Authentication Tests', () => {
  let companyId: string;
  let userId: string;

  beforeEach(async () => {
    // Crear empresa de prueba
    const company = await prisma.company.create({
      data: testCompany,
    });
    companyId = company.id;

    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    const user = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        password: hashedPassword,
        companyId,
      },
    });
    userId = user.id;
  });

  afterEach(async () => {
    // Limpiar base de datos
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  });

  describe('POST /api/auth/login', () => {
    test('debe permitir login con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    test('debe rechazar login con email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: testUser.password,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    test('debe rechazar login con contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    test('debe rechazar login de usuario desactivado', async () => {
      // Desactivar usuario
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Usuario desactivado');
    });
  });

  describe('POST /api/auth/register', () => {
    test('debe permitir registro con datos válidos', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'NewPass123!',
        passwordConfirmation: 'NewPass123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    test('debe rechazar registro con email duplicado', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('El email ya está registrado');
    });

    test('debe rechazar registro con contraseñas que no coinciden', async () => {
      const invalidUser = {
        name: 'Invalid User',
        email: 'invalid@example.com',
        password: 'TestPass123!',
        passwordConfirmation: 'DifferentPass123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Las contraseñas no coinciden');
    });

    test('debe rechazar registro con contraseña débil', async () => {
      const weakPasswordUser = {
        name: 'Weak Password User',
        email: 'weak@example.com',
        password: '123456',
        passwordConfirmation: '123456',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('La contraseña debe tener al menos 8 caracteres');
    });
  });

  describe('Token Management', () => {
    let token: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Obtener tokens válidos
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      token = response.body.token;
      refreshToken = response.body.refreshToken;
    });

    test('debe permitir acceso con token válido', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
    });

    test('debe rechazar acceso sin token', async () => {
      const response = await request(app)
        .get('/api/users/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    test('debe rechazar acceso con token inválido', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('TOKEN_INVALID');
    });

    test('debe renovar token con refresh token válido', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.token).not.toBe(token);
    });

    test('debe manejar logout correctamente', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sesión cerrada correctamente');
    });
  });

  describe('Auth Service Tests', () => {
    test('debe verificar token válido', async () => {
      const loginResponse = await authService.login({
        email: testUser.email,
        password: testUser.password,
      });

      const decoded = await authService.verifyToken(loginResponse.token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(loginResponse.user.id);
    });

    test('debe rechazar token inválido', async () => {
      await expect(authService.verifyToken('invalid-token')).rejects.toThrow('Token inválido');
    });

    test('debe manejar blacklist de tokens', () => {
      const testToken = 'test-token';
      
      expect(authService.isTokenBlacklisted(testToken)).toBe(false);
      
      authService.blacklistToken(testToken);
      expect(authService.isTokenBlacklisted(testToken)).toBe(true);
    });

    test('debe obtener usuario por ID', async () => {
      const user = await authService.getUserById(userId);
      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
      expect(user.email).toBe(testUser.email);
    });

    test('debe fallar al obtener usuario inexistente', async () => {
      await expect(authService.getUserById('non-existent-id')).rejects.toThrow('Usuario no encontrado');
    });
  });
});

describe('Rate Limiting Tests', () => {
  test('debe aplicar rate limiting en login', async () => {
    const requests = [];
    
    // Hacer 10 requests rápidos
    for (let i = 0; i < 10; i++) {
      requests.push(
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});

describe('Security Headers Tests', () => {
  test('debe incluir headers de seguridad', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-application']).toBe('Flame-AI-CRM');
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBeDefined();
  });
}); 