// src/services/api/branches.api.js

import supabase, { isSupabaseConfigured } from '../../lib/supabase';

/**
 * ===========================================
 * API DE SUCURSALES
 * ===========================================
 */

/**
 * Obtener todas las sucursales
 */
export const getBranches = async (filters = {}) => {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      data: getOfflineBranches(),
    };
  }

  const { isActive = true, search = '' } = filters;

  try {
    let query = supabase
      .from('branches')
      .select('*')
      .order('name', { ascending: true });

    if (isActive !== null) {
      query = query.eq('is_active', isActive);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo sucursales:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener sucursal por ID
 */
export const getBranchById = async (id) => {
  if (!isSupabaseConfigured()) {
    const branches = getOfflineBranches();
    const branch = branches.find(b => b.id === id);
    return branch
      ? { success: true, data: branch }
      : { success: false, error: 'Sucursal no encontrada' };
  }

  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo sucursal:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Crear nueva sucursal
 */
export const createBranch = async (branchData) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    // Obtener el siguiente número de punto de venta disponible
    const { data: maxPos } = await supabase
      .from('branches')
      .select('afip_pos_number')
      .order('afip_pos_number', { ascending: false })
      .limit(1)
      .single();

    const nextPosNumber = (maxPos?.afip_pos_number || 0) + 1;

    const { data, error } = await supabase
      .from('branches')
      .insert({
        name: branchData.name,
        code: branchData.code,
        address: branchData.address,
        city: branchData.city,
        province: branchData.province,
        zip_code: branchData.zipCode,
        phone: branchData.phone,
        email: branchData.email,
        afip_pos_number: branchData.afipPosNumber || nextPosNumber,
        is_principal: branchData.isPrincipal || false,
        is_active: true,
        settings: branchData.settings || {},
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creando sucursal:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar sucursal
 */
export const updateBranch = async (id, updates) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data, error } = await supabase
      .from('branches')
      .update({
        name: updates.name,
        address: updates.address,
        city: updates.city,
        province: updates.province,
        zip_code: updates.zipCode,
        phone: updates.phone,
        email: updates.email,
        afip_pos_number: updates.afipPosNumber,
        is_principal: updates.isPrincipal,
        is_active: updates.isActive,
        settings: updates.settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error actualizando sucursal:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar sucursal (soft delete)
 */
export const deleteBranch = async (id) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data, error } = await supabase
      .from('branches')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error eliminando sucursal:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener siguiente número de factura para una sucursal
 */
export const getNextInvoiceNumber = async (branchId, invoiceType) => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: { nextNumber: 1, posNumber: 1 } };
  }

  try {
    const { data, error } = await supabase.rpc('get_next_invoice_number', {
      p_branch_id: branchId,
      p_invoice_type: invoiceType,
    });

    if (error) throw error;

    // Obtener punto de venta de la sucursal
    const { data: branch } = await supabase
      .from('branches')
      .select('afip_pos_number')
      .eq('id', branchId)
      .single();

    return {
      success: true,
      data: {
        nextNumber: data,
        posNumber: branch?.afip_pos_number || 1,
      },
    };
  } catch (error) {
    console.error('Error obteniendo siguiente número:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener estadísticas de sucursales
 */
export const getBranchesStats = async () => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: [] };
  }

  try {
    const { data, error } = await supabase
      .from('v_branches_stats')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Asignar usuario a sucursal
 */
export const assignUserToBranch = async (userId, branchId, isDefault = false) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    // Si es sucursal por defecto, quitar el flag de otras
    if (isDefault) {
      await supabase
        .from('user_branches')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('user_branches')
      .insert({
        user_id: userId,
        branch_id: branchId,
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error asignando usuario a sucursal:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remover usuario de sucursal
 */
export const removeUserFromBranch = async (userId, branchId) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { error } = await supabase
      .from('user_branches')
      .delete()
      .eq('user_id', userId)
      .eq('branch_id', branchId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removiendo usuario de sucursal:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Datos offline de sucursales
 */
const getOfflineBranches = () => {
  return [
    {
      id: 'offline-branch-1',
      name: 'Sucursal Principal',
      code: 'SUC001',
      address: 'Av. Principal 1234',
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      afip_pos_number: 1,
      is_principal: true,
      is_active: true,
    },
    {
      id: 'offline-branch-2',
      name: 'Sucursal Centro',
      code: 'SUC002',
      address: 'Av. Corrientes 1500',
      city: 'CABA',
      province: 'Buenos Aires',
      afip_pos_number: 2,
      is_principal: false,
      is_active: true,
    },
  ];
};

export default {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getNextInvoiceNumber,
  getBranchesStats,
  assignUserToBranch,
  removeUserFromBranch,
};