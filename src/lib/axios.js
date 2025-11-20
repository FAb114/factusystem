import axios from 'axios';
import { useAuthStore } from '../store/slices/authSlice';

// Crear instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request - Agregar token de autenticación
axiosInstance.interceptors.request.use(
  (config) => {
    const { user } = useAuthStore.getState();
    
    // Agregar token si existe
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }

    // Agregar sucursal actual si existe
    const { selectedBranch } = useAuthStore.getState();
    if (selectedBranch?.id) {
      config.headers['X-Branch-ID'] = selectedBranch.id;
    }

    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.log('🔵 API Request:', config.method?.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor de Response - Manejo de errores global
axiosInstance.interceptors.response.use(
  (response) => {
    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.log('🟢 API Response:', response.config.url, response.status);
    }

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Manejar errores específicos
    switch (status) {
      case 401:
        // Token inválido o expirado
        console.error('🔴 Error 401: No autorizado');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        break;

      case 403:
        // Sin permisos
        console.error('🔴 Error 403: Sin permisos');
        break;

      case 404:
        // Recurso no encontrado
        console.error('🔴 Error 404: Recurso no encontrado');
        break;

      case 422:
        // Validación fallida
        console.error('🔴 Error 422: Datos inválidos');
        break;

      case 500:
        // Error del servidor
        console.error('🔴 Error 500: Error interno del servidor');
        break;

      default:
        console.error('🔴 Error de API:', status, message);
    }

    // Retornar error formateado
    return Promise.reject({
      status,
      message,
      data: error.response?.data,
      originalError: error,
    });
  }
);

// Funciones auxiliares para requests comunes

/**
 * GET request
 */
export const get = async (url, config = {}) => {
  try {
    const response = await axiosInstance.get(url, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * POST request
 */
export const post = async (url, data, config = {}) => {
  try {
    const response = await axiosInstance.post(url, data, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * PUT request
 */
export const put = async (url, data, config = {}) => {
  try {
    const response = await axiosInstance.put(url, data, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * PATCH request
 */
export const patch = async (url, data, config = {}) => {
  try {
    const response = await axiosInstance.patch(url, data, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * DELETE request
 */
export const del = async (url, config = {}) => {
  try {
    const response = await axiosInstance.delete(url, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Upload de archivos
 */
export const upload = async (url, file, onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }

    const response = await axiosInstance.post(url, formData, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error };
  }
};

export default axiosInstance;