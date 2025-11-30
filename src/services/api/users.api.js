// src/services/api/users.api.js

import supabase, { isSupabaseConfigured } from '../../lib/supabase';

/**
 * ===========================================
 * API DE USUARIOS
 * ===========================================
 */

/**
 * Obtener todos los usuarios
 */
export const getUsers = async (filters = {}) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  const { search = '', role = '', isActive = true } = filters;

  try {
    let query = supabase
      .from('users')
      .select(`
        *,
        branches:user_branches(
          is_default,
          branch:branches(id, name, code, afip_pos_number)
        )
      `)
      .order('full_name', { ascending: true });

    if (search) {
      query = query.or(
        `username.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Formatear datos
    const formattedData = data.map(user => ({
      ...user,
      branches: user.branches.map(ub => ({
        ...ub.branch,
        isDefault: ub.is_default,
      })),
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener usuario por ID
 */
export const getUserById = async (id) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        branches:user_branches(
          is_default,
          branch:branches(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: {
        ...data,
        branches: data.branches.map(ub => ({
          ...ub.branch,
          isDefault: ub.is_default,
        })),
      },
    };
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Crear nuevo usuario
 */
export const createUser = async (userData) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    // Hashear contraseña (esto debería hacerse en el backend)
    const passwordHash = await hashPassword(userData.password);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        username: userData.username,
        email: userData.email,
        password_hash: passwordHash,
        full_name: userData.fullName,
        role: userData.role,
        phone: userData.phone,
        avatar_url: userData.avatarUrl,
        is_active: true,
        permissions: userData.permissions || [],
      })
      .select()
      .single();

    if (userError) throw userError;

    // Asignar sucursales si se proporcionan
    if (userData.branchIds && userData.branchIds.length > 0) {
      const branchAssignments = userData.branchIds.map((branchId, index) => ({
        user_id: user.id,
        branch_id: branchId,
        is_default: index === 0, // La primera es la por defecto
      }));

      const { error: assignError } = await supabase
        .from('user_branches')
        .insert(branchAssignments);

      if (assignError) {
        console.warn('Error asignando sucursales:', assignError);
      }
    }

    return { success: true, data: user };
  } catch (error) {
    console.error('Error creando usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar usuario
 */
export const updateUser = async (id, updates) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const updateData = {
      full_name: updates.fullName,
      email: updates.email,
      role: updates.role,
      phone: updates.phone,
      avatar_url: updates.avatarUrl,
      is_active: updates.isActive,
      permissions: updates.permissions,
      updated_at: new Date().toISOString(),
    };

    // Si se proporciona nueva contraseña
    if (updates.password) {
      updateData.password_hash = await hashPassword(updates.password);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Actualizar sucursales si se proporcionan
    if (updates.branchIds) {
      // Eliminar asignaciones existentes
      await supabase.from('user_branches').delete().eq('user_id', id);

      // Crear nuevas asignaciones
      const branchAssignments = updates.branchIds.map((branchId, index) => ({
        user_id: id,
        branch_id: branchId,
        is_default: index === 0,
      }));

      await supabase.from('user_branches').insert(branchAssignments);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar usuario (soft delete)
 */
export const deleteUser = async (id) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar permisos de usuario
 */
export const updateUserPermissions = async (userId, permissions) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        permissions: permissions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error actualizando permisos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verificar si un username ya existe
 */
export const checkUsernameExists = async (username, excludeUserId = null) => {
  if (!isSupabaseConfigured()) {
    return { success: true, exists: false };
  }

  try {
    let query = supabase
      .from('users')
      .select('id')
      .eq('username', username);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, exists: data.length > 0 };
  } catch (error) {
    console.error('Error verificando username:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verificar si un email ya existe
 */
export const checkEmailExists = async (email, excludeUserId = null) => {
  if (!isSupabaseConfigured()) {
    return { success: true, exists: false };
  }

  try {
    let query = supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, exists: data.length > 0 };
  } catch (error) {
    console.error('Error verificando email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener estadísticas de usuarios
 */
export const getUsersStats = async () => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: {} };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, is_active');

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(u => u.is_active).length,
      inactive: data.filter(u => !u.is_active).length,
      byRole: {},
    };

    data.forEach(user => {
      if (!stats.byRole[user.role]) {
        stats.byRole[user.role] = 0;
      }
      stats.byRole[user.role]++;
    });

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Hash de contraseña (placeholder - implementar con bcrypt en backend real)
 */
const hashPassword = async (password) => {
  // ADVERTENCIA: Esto es solo para desarrollo
  // En producción, debes usar bcrypt o similar en el backend
  return `hashed_${password}_${Date.now()}`;
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserPermissions,
  checkUsernameExists,
  checkEmailExists,
  getUsersStats,
};