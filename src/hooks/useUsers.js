// src/hooks/useUsers.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '../services/api/users.api';
import toast from 'react-hot-toast';

/**
 * Hook para obtener usuarios
 */
export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersApi.getUsers(filters),
    select: (response) => response.data,
  });
};

/**
 * Hook para obtener un usuario por ID
 */
export const useUser = (id) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getUserById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
};

/**
 * Hook para crear usuario
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => usersApi.createUser(userData),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        toast.success('Usuario creado exitosamente');
      } else {
        toast.error(response.error || 'Error al crear usuario');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear usuario');
    },
  });
};

/**
 * Hook para actualizar usuario
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => usersApi.updateUser(id, updates),
    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
        toast.success('Usuario actualizado exitosamente');
      } else {
        toast.error(response.error || 'Error al actualizar usuario');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar usuario');
    },
  });
};

/**
 * Hook para eliminar usuario
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => usersApi.deleteUser(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        toast.success('Usuario eliminado exitosamente');
      } else {
        toast.error(response.error || 'Error al eliminar usuario');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar usuario');
    },
  });
};

/**
 * Hook para actualizar permisos
 */
export const useUpdatePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, permissions }) =>
      usersApi.updateUserPermissions(userId, permissions),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        toast.success('Permisos actualizados');
      } else {
        toast.error(response.error || 'Error al actualizar permisos');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar permisos');
    },
  });
};

/**
 * Hook para estadísticas de usuarios
 */
export const useUsersStats = () => {
  return useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => usersApi.getUsersStats(),
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000,
  });
};

export default {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUpdatePermissions,
  useUsersStats,
};