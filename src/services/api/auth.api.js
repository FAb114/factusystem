// src/services/api/auth.api.js

import supabase, { isSupabaseConfigured } from '../../lib/supabase';
import { get, post } from '../../lib/axios';

/**
 * ===========================================
 * API DE AUTENTICACIÓN
 * ===========================================
 */

/**
 * Iniciar sesión
 */
export const login = async (credentials) => {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Modo offline - Login local');
    return loginOffline(credentials);
  }

  try {
    const { username, password } = credentials;

    // Buscar usuario por username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        branches:user_branches(
          is_default,
          branch:branches(*)
        )
      `)
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña (aquí deberías usar bcrypt o similar)
    // Por ahora, comparación simple para desarrollo
    const { data: authData, error: authError } = await supabase.rpc(
      'verify_password',
      {
        p_user_id: user.id,
        p_password: password,
      }
    );

    if (authError || !authData) {
      throw new Error('Contraseña incorrecta');
    }

    // Actualizar último login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Formatear datos del usuario
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      permissions: user.permissions || [],
      isActive: user.is_active,
      avatarUrl: user.avatar_url,
      phone: user.phone,
      branches: user.branches.map(ub => ({
        ...ub.branch,
        isDefault: ub.is_default,
      })),
      token: generateToken(user), // Generar token JWT si es necesario
    };

    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error('Error en login:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Login offline (modo de desarrollo/emergencia)
 */
const loginOffline = (credentials) => {
  const { username, password } = credentials;

  // Validación simple para desarrollo
  if (username === 'admin' && password === 'admin') {
    return {
      success: true,
      data: {
        id: 'offline-user-1',
        username: 'admin',
        email: 'admin@factusystem.com',
        fullName: 'Administrador',
        role: 'admin',
        permissions: ['all'],
        isActive: true,
        branches: [
          {
            id: 'offline-branch-1',
            name: 'Sucursal Principal',
            code: 'SUC001',
            afip_pos_number: 1,
            isDefault: true,
          },
          {
            id: 'offline-branch-2',
            name: 'Sucursal Centro',
            code: 'SUC002',
            afip_pos_number: 2,
            isDefault: false,
          },
        ],
        token: 'offline-token-' + Date.now(),
      },
    };
  }

  return {
    success: false,
    error: 'Credenciales inválidas',
  };
};

/**
 * Cerrar sesión
 */
export const logout = async () => {
  try {
    // Limpiar token, sesión, etc.
    return { success: true };
  } catch (error) {
    console.error('Error en logout:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verificar sesión actual
 */
export const checkSession = async (userId) => {
  if (!isSupabaseConfigured()) {
    return { success: true, isValid: true };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, is_active')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { success: false, isValid: false };
    }

    return { success: true, isValid: true };
  } catch (error) {
    console.error('Error verificando sesión:', error);
    return { success: false, isValid: false };
  }
};

/**
 * Cambiar contraseña
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    // Verificar contraseña actual
    const { data: verified, error: verifyError } = await supabase.rpc(
      'verify_password',
      {
        p_user_id: userId,
        p_password: oldPassword,
      }
    );

    if (verifyError || !verified) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Cambiar contraseña (deberías hashearla primero)
    const { error: updateError } = await supabase.rpc('update_password', {
      p_user_id: userId,
      p_new_password: newPassword,
    });

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener perfil de usuario
 */
export const getUserProfile = async (userId) => {
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
      .eq('id', userId)
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
    console.error('Error obteniendo perfil:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar perfil de usuario
 */
export const updateUserProfile = async (userId, updates) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: updates.fullName,
        email: updates.email,
        phone: updates.phone,
        avatar_url: updates.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generar token JWT (placeholder)
 */
const generateToken = (user) => {
  // Aquí implementarías la generación de JWT real
  // Por ahora, un token simple
  return `token-${user.id}-${Date.now()}`;
};

export default {
  login,
  logout,
  checkSession,
  changePassword,
  getUserProfile,
  updateUserProfile,
};