import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-client';
import * as productsApi from '../services/api/products.api';
import toast from 'react-hot-toast';

/**
 * Hook para obtener productos con filtros
 */
export const useProducts = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => productsApi.getProducts(filters),
    select: (response) => response.data,
    enabled: true,
  });
};

/**
 * Hook para obtener un producto por ID
 */
export const useProduct = (id) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApi.getProductById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
};

/**
 * Hook para buscar productos (autocompletado)
 */
export const useSearchProducts = (query, enabled = true) => {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => productsApi.searchProducts(query),
    select: (response) => response.data,
    enabled: enabled && query.length >= 2,
    staleTime: 30000, // 30 segundos
  });
};

/**
 * Hook para obtener productos con stock bajo
 */
export const useLowStockProducts = () => {
  return useQuery({
    queryKey: queryKeys.products.lowStock,
    queryFn: () => productsApi.getLowStockProducts(),
    select: (response) => response.data,
    refetchInterval: 60000, // Actualizar cada minuto
  });
};

/**
 * Hook para obtener categorías
 */
export const useProductCategories = () => {
  return useQuery({
    queryKey: ['products', 'categories'],
    queryFn: () => productsApi.getProductCategories(),
    select: (response) => response.data,
    staleTime: 3600000, // 1 hora
  });
};

/**
 * Hook para crear producto
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData) => productsApi.createProduct(productData),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        toast.success('Producto creado exitosamente');
      } else {
        toast.error(response.error || 'Error al crear producto');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear producto');
    },
  });
};

/**
 * Hook para actualizar producto
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => productsApi.updateProduct(id, updates),
    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(variables.id),
        });
        toast.success('Producto actualizado exitosamente');
      } else {
        toast.error(response.error || 'Error al actualizar producto');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar producto');
    },
  });
};

/**
 * Hook para eliminar producto
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => productsApi.deleteProduct(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        toast.success('Producto eliminado exitosamente');
      } else {
        toast.error(response.error || 'Error al eliminar producto');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar producto');
    },
  });
};

/**
 * Hook para actualizar stock
 */
export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantity, operation }) =>
      productsApi.updateProductStock(id, quantity, operation),
    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(variables.id),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.products.lowStock });
        toast.success('Stock actualizado exitosamente');
      } else {
        toast.error(response.error || 'Error al actualizar stock');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar stock');
    },
  });
};

/**
 * Hook para obtener producto por código de barras
 */
export const useProductByBarcode = (barcode, enabled = false) => {
  return useQuery({
    queryKey: ['products', 'barcode', barcode],
    queryFn: () => productsApi.getProductByBarcode(barcode),
    select: (response) => response.data,
    enabled: enabled && !!barcode,
    retry: false, // No reintentar si no se encuentra
  });
};

export default {
  useProducts,
  useProduct,
  useSearchProducts,
  useLowStockProducts,
  useProductCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateStock,
  useProductByBarcode,
};