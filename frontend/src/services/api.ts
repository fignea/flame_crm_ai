import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// Extender la interfaz de axios para agregar metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: Date;
  };
  _retry?: boolean;
}

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Variable para controlar si se está renovando el token
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Función para agregar suscriptores a la cola de refresh
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Función para notificar a todos los suscriptores
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Función para renovar el token
const refreshToken = async (): Promise<string> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No hay refresh token disponible');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { token, refreshToken: newRefreshToken } = response.data;
    
    // Actualizar tokens en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    console.log('✅ Token renovado exitosamente');
    return token;
  } catch (error) {
    console.error('❌ Error al renovar token:', error);
    
    // Limpiar tokens inválidos
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Redirigir al login
    window.location.href = '/login';
    
    throw error;
  }
};

// Interceptor de request
api.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Agregar timestamp para debugging
    config.metadata = { startTime: new Date() };
    
    // Log de request en desarrollo
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor de response
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calcular tiempo de respuesta
    const endTime = new Date();
    const config = response.config as ExtendedAxiosRequestConfig;
    const startTime = config.metadata?.startTime;
    const duration = startTime ? endTime.getTime() - startTime.getTime() : 0;
    
    // Log de response en desarrollo
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.status} ${response.config.url} (${duration}ms)`);
    }
    
    // Manejo de respuestas exitosas con mensajes
    if (response.data?.message && response.status >= 200 && response.status < 300) {
      // No mostrar toast para GET requests o para endpoints específicos
      const skipToast = response.config.method === 'get' || 
                      response.config.url?.includes('/health') ||
                      response.config.url?.includes('/metrics');
      
      if (!skipToast) {
        toast.success(response.data.message);
      }
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    
    // Calcular tiempo de respuesta para errores
    const endTime = new Date();
    const startTime = originalRequest?.metadata?.startTime;
    const duration = startTime ? endTime.getTime() - startTime.getTime() : 0;
    
    console.error(`❌ ${error.response?.status} ${originalRequest?.url} (${duration}ms):`, error.response?.data);
    
    // Manejo de errores 401 (No autorizado)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya se está renovando el token, agregar a la cola
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await refreshToken();
        onRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Error al renovar token:', refreshError);
        
        // Mostrar error al usuario
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        
        // Limpiar estado de autenticación
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Redirigir al login
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Manejo de errores específicos
    const errorData = error.response?.data as any;
    const errorMessage = errorData?.message || 'Error desconocido';
    
    switch (error.response?.status) {
      case 400:
        toast.error(`Error de validación: ${errorMessage}`);
        break;
      case 403:
        toast.error('No tienes permisos para realizar esta acción');
        break;
      case 404:
        toast.error('Recurso no encontrado');
        break;
      case 429:
        toast.error('Demasiadas peticiones. Intenta nuevamente más tarde.');
        break;
      case 500:
        toast.error('Error interno del servidor. Contacta con soporte.');
        break;
      default:
        if (error.code === 'ECONNABORTED') {
          toast.error('Tiempo de espera agotado. Verifica tu conexión.');
        } else if (error.code === 'ERR_NETWORK') {
          toast.error('Error de red. Verifica tu conexión a internet.');
        } else if (error.response?.status !== undefined && error.response.status >= 500) {
          toast.error('Error del servidor. Intenta nuevamente más tarde.');
        } else {
          toast.error(errorMessage);
        }
    }
    
    return Promise.reject(error);
  }
);

// Función para realizar peticiones con retry automático
export const apiWithRetry = async (
  requestFn: () => Promise<AxiosResponse>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<AxiosResponse> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await requestFn();
      return response;
    } catch (error) {
      lastError = error;
      
             // No reintentar para errores 4xx (excepto 401 que ya se maneja)
       if (error instanceof AxiosError && error.response?.status !== undefined && error.response.status >= 400 && error.response.status < 500) {
         break;
       }
      
      // Si no es el último intento, esperar antes de reintentar
      if (i < maxRetries) {
        console.log(`⏳ Reintentando petición en ${delayMs}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Backoff exponencial
      }
    }
  }
  
  throw lastError;
};

// Función para verificar el estado de la conexión
export const checkConnection = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('❌ Error al verificar conexión:', error);
    return false;
  }
};

// Función para obtener métricas del servidor
export const getServerMetrics = async () => {
  try {
    const response = await api.get('/metrics');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener métricas:', error);
    return null;
  }
};

// Función para cancelar peticiones
export const cancelTokenSource = () => axios.CancelToken.source();

// Función para configurar headers globales
export const setGlobalHeader = (key: string, value: string) => {
  api.defaults.headers.common[key] = value;
};

// Función para remover headers globales
export const removeGlobalHeader = (key: string) => {
  delete api.defaults.headers.common[key];
};

// Función para obtener información de debugging
export const getApiInfo = () => {
  return {
    baseURL: API_BASE_URL,
    timeout: api.defaults.timeout,
    headers: api.defaults.headers,
    isRefreshing,
    refreshSubscribers: refreshSubscribers.length,
  };
};

// Placeholder para autoMessageScheduleApi - implementar según sea necesario
export const autoMessageScheduleApi = {
  // Métodos placeholder - implementar según API backend
  list: () => Promise.resolve([]),
  create: (data: any) => Promise.resolve(data),
  update: (_id: string, data: any) => Promise.resolve(data),
  delete: (_id: string) => Promise.resolve(),
  remove: (_id: string) => Promise.resolve(),
  setActive: (_id: string, isActive: boolean) => Promise.resolve({ _id, isActive }),
};

export default api; 