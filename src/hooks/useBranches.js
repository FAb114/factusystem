// src/hooks/useBranches.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as branchesApi from '../services/api/branches.api';
import toast from 'react-hot-toast';

/**
 * Hook para obtener sucursales
 */
export const useBranches = (filters = {}) => {
  return useQuery({
    queryKey: ['branches', filters],
    queryFn: () => branchesApi.getBranches(filters),
    select: (response) => response.data,
  });
};

/**
 * Hook para obtener una sucursal por ID
 */
export const useBranch = (id) => {
  return useQuery({
    queryKey: ['branches', id],
    queryFn: () => branchesApi.getBranchById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
};

/**
 * Hook para crear sucursal
 */
export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branchData) => branchesApi.createBranch(branchData),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['branches'] });
        toast.success('Sucursal creada exitosamente');
      } else {
        toast.error(response.error || 'Error al crear sucursal');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear sucursal');
    },
  });
};

/**
 * Hook para actualizar sucursal
 */
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => branchesApi.updateBranch(id, updates),
    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['branches'] });
        queryClient.invalidateQueries({ queryKey: ['branches', variables.id] });
        toast.success('Sucursal actualizada exitosamente');
      } else {
        toast.error(response.error || 'Error al actualizar sucursal');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar sucursal');
    },
  });
};

/**
 * Hook para eliminar sucursal
 */
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => branchesApi.deleteBranch(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['branches'] });
        toast.success('Sucursal eliminada exitosamente');
      } else {
        toast.error(response.error || 'Error al eliminar sucursal');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar sucursal');
    },
  });
};

/**
 * Hook para obtener siguiente número de factura
 */
export const useNextInvoiceNumber = (branchId, invoiceType) => {
  return useQuery({
    queryKey: ['branches', 'nextInvoice', branchId, invoiceType],
    queryFn: () => branchesApi.getNextInvoiceNumber(branchId, invoiceType),
    select: (response) => response.data,
    enabled: !!branchId && !!invoiceType,
    staleTime: 0,
  });
};

/**
 * Hook para estadísticas de sucursales
 */
export const useBranchesStats = () => {
  return useQuery({
    queryKey: ['branches', 'stats'],
    queryFn: () => branchesApi.getBranchesStats(),
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para asignar usuario a sucursal
 */
export const useAssignUserToBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, branchId, isDefault }) =>
      branchesApi.assignUserToBranch(userId, branchId, isDefault),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['branches'] });
        toast.success('Usuario asignado a sucursal');
      } else {
        toast.error(response.error || 'Error al asignar usuario');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al asignar usuario');
    },
  });
};

export default {
  useBranches,
  useBranch,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  useNextInvoiceNumber,
  useBranchesStats,
  useAssignUserToBranch,
};