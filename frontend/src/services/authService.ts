import api from './api';
import { LoginRequest, LoginResponse, User, ApiResponse } from '../types/api';

export const authService = {
  // Login de usuario
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    if (!response.data.data) {
      throw new Error('Respuesta inválida del servidor');
    }
    return response.data.data;
  },

  // Registro de usuario
  async register(userData: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/register', userData);
    return response.data.data!;
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignorar errores en logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },

  // Refresh token
  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh', {
      refreshToken,
    });
    return response.data.data!;
  },

  // Obtener perfil del usuario actual
  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    if (!response.data.data) {
      throw new Error('No se pudo obtener el perfil del usuario');
    }
    return response.data.data;
  },

  // Verificar si el token es válido
  async verifyToken(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      await api.get('/auth/me');
      return true;
    } catch (error) {
      return false;
    }
  },

  // Cambiar contraseña
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
  }): Promise<void> {
    await api.post('/auth/change-password', data);
  },

  // Solicitar reset de contraseña
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  // Reset de contraseña
  async resetPassword(data: {
    token: string;
    password: string;
    passwordConfirmation: string;
  }): Promise<void> {
    await api.post('/auth/reset-password', data);
  },
}; 