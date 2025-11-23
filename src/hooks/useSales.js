// src/hooks/useSales.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-client';
import * as salesApi from '../services/api/sales.api';
import toast from 'react-hot-toast';

/**
 * Hook para obtener ventas con filtros
 */
export const useSales = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.sales.list(filters),
    queryFn: () => salesApi.getSales(filters),
    select: (response) => response.data,
    keepPreviousData: true,
  });
};

/**
 * Hook para obtener una venta por ID
 */
export const useSale = (id) => {
  return useQuery({
    queryKey: queryKeys.sales.detail(id),
    queryFn: () => salesApi.getSaleById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
};

/**
 * Hook para obtener ventas del día
 */
export const useTodaySales = (branchId = null) => {
  return useQuery({
    queryKey: queryKeys.sales.today,
    queryFn: () => salesApi.getTodaySales(branchId),
    select: (response) => response.data,
    refetchInterval: 60000, // Actualizar cada minuto
  });
};

/**
 * Hook para estadísticas de ventas
 */
export const useSalesStats = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.sales.stats(filters),
    queryFn: () => salesApi.getSalesStats(filters),
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para resumen mensual
 */
export const useMonthlySummary = (year, month, branchId = null) => {
  return useQuery({
    queryKey: ['sales', 'monthly', year, month, branchId],
    queryFn: () => salesApi.getMonthlySummary(year, month, branchId),
    select: (response) => response.data,
    enabled: !!year && !!month,
  });
};

/**
 * Hook para crear venta
 */
export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (saleData) => salesApi.createSale(saleData),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.sales.today });
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.cash.session });
        toast.success('Venta registrada exitosamente');
      } else {
        toast.error(response.error || 'Error al registrar venta');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al registrar venta');
    },
  });
};

/**
 * Hook para anular venta
 */
export const useCancelSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason, userId }) => salesApi.cancelSale(id, reason, userId),
    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.sales.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        toast.success('Venta anulada correctamente');
      } else {
        toast.error(response.error || 'Error al anular venta');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al anular venta');
    },
  });
};

/**
 * Hook para buscar ventas
 */
export const useSearchSales = (query, enabled = true) => {
  return useQuery({
    queryKey: ['sales', 'search', query],
    queryFn: () => salesApi.searchSales(query),
    select: (response) => response.data,
    enabled: enabled && query.length >= 2,
    staleTime: 30000,
  });
};

/**
 * Hook para obtener siguiente número de factura
 */
export const useNextInvoiceNumber = (invoiceType, pointOfSale, branchId) => {
  return useQuery({
    queryKey: ['sales', 'nextNumber', invoiceType, pointOfSale, branchId],
    queryFn: () => salesApi.getNextInvoiceNumber(invoiceType, pointOfSale, branchId),
    select: (response) => response.data,
    enabled: !!invoiceType && !!branchId,
    staleTime: 0, // Siempre obtener el más reciente
  });
};

export default {
  useSales,
  useSale,
  useTodaySales,
  useSalesStats,
  useMonthlySummary,
  useCreateSale,
  useCancelSale,
  useSearchSales,
  useNextInvoiceNumber,
};