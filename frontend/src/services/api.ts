import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// Configuración base de la API
// Usa variables de entorno en tiempo de ejecución (inyectadas por Docker) o de build (Vite)
const API_BASE_URL = window.ENV?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expirado o inválido
          localStorage.removeItem('token');
          window.location.href = '/login';
          toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
          break;
        case 403:
          toast.error('No tienes permisos para realizar esta acción.');
          break;
        case 404:
          toast.error('Recurso no encontrado.');
          break;
        case 422:
          // Errores de validación
          if (data && typeof data === 'object' && 'errors' in data) {
            const errors = (data as any).errors;
            Object.values(errors).forEach((error: any) => {
              toast.error(Array.isArray(error) ? error[0] : error);
            });
          } else {
            toast.error('Datos inválidos.');
          }
          break;
        case 500:
          toast.error('Error interno del servidor.');
          break;
        default:
          toast.error('Ha ocurrido un error inesperado.');
      }
    } else if (error.request) {
      toast.error('No se pudo conectar con el servidor.');
    } else {
      toast.error('Error de configuración.');
    }
    
    return Promise.reject(error);
  }
);

// --- AutoMessageSchedules API ---
import { AutoMessageSchedule, AutoMessageScheduleCreateRequest } from '../types/api';

export const autoMessageScheduleApi = {
  async list(connectionId?: string): Promise<AutoMessageSchedule[]> {
    const params = connectionId ? { connectionId } : {};
    const response = await api.get('/auto-message-schedules', { params });
    return response.data;
  },
  async get(id: string): Promise<AutoMessageSchedule> {
    const response = await api.get(`/auto-message-schedules/${id}`);
    return response.data;
  },
  async create(data: AutoMessageScheduleCreateRequest): Promise<AutoMessageSchedule> {
    const response = await api.post('/auto-message-schedules', data);
    return response.data;
  },
  async update(id: string, data: Partial<AutoMessageSchedule>): Promise<AutoMessageSchedule> {
    const response = await api.put(`/auto-message-schedules/${id}`, data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/auto-message-schedules/${id}`);
  },
  async setActive(id: string, isActive: boolean): Promise<AutoMessageSchedule> {
    const response = await api.patch(`/auto-message-schedules/${id}/activate`, { isActive });
    return response.data;
  },
};

export default api; 