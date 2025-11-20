import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * Configuración global de React Query
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos"
      staleTime: 5 * 60 * 1000, // 5 minutos

      // Tiempo que los datos se mantienen en caché
      cacheTime: 10 * 60 * 1000, // 10 minutos

      // Reintento automático en caso de error
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // No refetch automático al volver al foco
      refetchOnWindowFocus: false,

      // No refetch al reconectar
      refetchOnReconnect: false,

      // No refetch al montar
      refetchOnMount: false,

      // Manejo de errores global
      onError: (error) => {
        console.error('❌ Query Error:', error);
        
        // Mostrar toast de error si es apropiado
        const message = error?.message || 'Error al cargar datos';
        if (message !== 'canceled') {
          toast.error(message);
        }
      },
    },

    mutations: {
      // Reintento para mutaciones
      retry: 0, // No reintentar mutaciones por defecto

      // Manejo de errores global para mutaciones
      onError: (error) => {
        console.error('❌ Mutation Error:', error);
        
        const message = error?.message || 'Error al guardar datos';
        toast.error(message);
      },

      // Éxito en mutaciones
      onSuccess: (data) => {
        console.log('✅ Mutation Success:', data);
      },
    },
  },
});

/**
 * Invalidar queries por patrón
 */
export const invalidateQueries = (queryKey) => {
  return queryClient.invalidateQueries({ queryKey });
};

/**
 * Prefetch de datos
 */
export const prefetchQuery = (queryKey, queryFn, options = {}) => {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 * Establecer datos de query manualmente
 */
export const setQueryData = (queryKey, data) => {
  queryClient.setQueryData(queryKey, data);
};

/**
 * Obtener datos de query del caché
 */
export const getQueryData = (queryKey) => {
  return queryClient.getQueryData(queryKey);
};

/**
 * Limpiar caché completo
 */
export const clearCache = () => {
  queryClient.clear();
  toast.success('Caché limpiada');
};

/**
 * Limpiar caché específico
 */
export const removeQueries = (queryKey) => {
  queryClient.removeQueries({ queryKey });
};

/**
 * Cancelar queries en progreso
 */
export const cancelQueries = (queryKey) => {
  return queryClient.cancelQueries({ queryKey });
};

/**
 * Query Keys estandarizados para el sistema
 */
export const queryKeys = {
  // Autenticación
  auth: {
    user: ['auth', 'user'],
    session: ['auth', 'session'],
  },

  // Productos
  products: {
    all: ['products'],
    list: (filters) => ['products', 'list', filters],
    detail: (id) => ['products', 'detail', id],
    stock: (id) => ['products', 'stock', id],
    lowStock: ['products', 'lowStock'],
  },

  // Clientes
  clients: {
    all: ['clients'],
    list: (filters) => ['clients', 'list', filters],
    detail: (id) => ['clients', 'detail', id],
    history: (id) => ['clients', 'history', id],
  },

  // Ventas
  sales: {
    all: ['sales'],
    list: (filters) => ['sales', 'list', filters],
    detail: (id) => ['sales', 'detail', id],
    today: ['sales', 'today'],
    stats: (period) => ['sales', 'stats', period],
  },

  // Caja
  cash: {
    session: ['cash', 'session'],
    movements: (sessionId) => ['cash', 'movements', sessionId],
    balance: ['cash', 'balance'],
    history: (filters) => ['cash', 'history', filters],
  },

  // Compras
  purchases: {
    all: ['purchases'],
    list: (filters) => ['purchases', 'list', filters],
    detail: (id) => ['purchases', 'detail', id],
  },

  // Proveedores
  suppliers: {
    all: ['suppliers'],
    list: (filters) => ['suppliers', 'list', filters],
    detail: (id) => ['suppliers', 'detail', id],
  },

  // Usuarios
  users: {
    all: ['users'],
    list: (filters) => ['users', 'list', filters],
    detail: (id) => ['users', 'detail', id],
  },

  // Sucursales
  branches: {
    all: ['branches'],
    detail: (id) => ['branches', 'detail', id],
  },

  // Reportes
  reports: {
    sales: (period) => ['reports', 'sales', period],
    revenue: (period) => ['reports', 'revenue', period],
    products: (period) => ['reports', 'products', period],
    cash: (period) => ['reports', 'cash', period],
  },

  // Gift Cards
  giftCards: {
    all: ['giftCards'],
    list: (filters) => ['giftCards', 'list', filters],
    detail: (id) => ['giftCards', 'detail', id],
  },

  // Configuración
  settings: {
    company: ['settings', 'company'],
    integrations: ['settings', 'integrations'],
    permissions: ['settings', 'permissions'],
  },
};

/**
 * Helpers para invalidación común
 */
export const invalidateHelpers = {
  // Invalidar todos los productos
  invalidateProducts: () => invalidateQueries(queryKeys.products.all),

  // Invalidar todas las ventas
  invalidateSales: () => invalidateQueries(queryKeys.sales.all),

  // Invalidar clientes
  invalidateClients: () => invalidateQueries(queryKeys.clients.all),

  // Invalidar caja
  invalidateCash: () => invalidateQueries(queryKeys.cash.session),

  // Invalidar todo
  invalidateAll: () => queryClient.invalidateQueries(),
};

export default queryClient;