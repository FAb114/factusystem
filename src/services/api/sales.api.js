// src/services/api/sales.api.js - VERSIÓN CORREGIDA MODO OFFLINE

import supabase, { isSupabaseConfigured } from '../../lib/supabase';
import { useAuthStore } from '../../store/slices/authSlice';

/**
 * ===========================================
 * STORAGE OFFLINE - MEJORADO
 * ===========================================
 */
const OFFLINE_STORAGE_KEY = 'factusystem_offline_sales';

const getOfflineSales = () => {
  try {
    const data = localStorage.getItem(OFFLINE_STORAGE_KEY);
    const sales = data ? JSON.parse(data) : [];
    console.log('📦 [sales.api] Ventas offline cargadas:', sales.length);
    return sales;
  } catch (error) {
    console.error('❌ [sales.api] Error leyendo ventas offline:', error);
    return [];
  }
};

const saveOfflineSale = (sale) => {
  try {
    const sales = getOfflineSales();
    sales.push(sale);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(sales));
    console.log('✅ [sales.api] Venta guardada offline correctamente');
    console.log('📊 [sales.api] Total de ventas offline:', sales.length);
    return true;
  } catch (error) {
    console.error('❌ [sales.api] Error guardando offline:', error);
    return false;
  }
};

/**
 * ===========================================
 * VALIDAR UUID - CRÍTICO PARA SUPABASE
 * ===========================================
 */
const isValidUUID = (uuid) => {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * ===========================================
 * CREAR VENTA - ULTRA-ROBUSTA
 * ===========================================
 */
export const createSale = async (saleData) => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 [sales.api] INICIANDO CREACIÓN DE VENTA');
  console.log('═══════════════════════════════════════');

  // Obtener IDs del store
  const authState = useAuthStore.getState();
  const userId = saleData.userId || authState.user?.id;
  const branchId = saleData.branchId || authState.selectedBranch?.id;
  const clientId = saleData.clientId === 'C0' ? null : saleData.clientId;

  console.log('🔍 [sales.api] IDs recibidos:', { userId, branchId, clientId });

  // ========================================
  // VERIFICAR MODO OFFLINE PRIMERO
  // ========================================
  const isOnline = isSupabaseConfigured();
  console.log('🌐 [sales.api] Estado:', isOnline ? 'ONLINE' : 'OFFLINE');

  // Preparar venta base
  const timestamp = Date.now();
  const baseSale = {
    sale_number: `SALE-${timestamp}`,
    invoice_type: saleData.invoiceType || 'X',
    invoice_number: saleData.invoiceNumber?.toString() || null,
    point_of_sale: parseInt(saleData.pointOfSale) || 1,
    branch_id: branchId,
    user_id: userId,
    client_id: clientId,
    date: new Date().toISOString(),
    subtotal: parseFloat(saleData.subtotal) || 0,
    discount: parseFloat(saleData.discount) || 0,
    tax: parseFloat(saleData.tax) || 0,
    total: parseFloat(saleData.total),
    payment_methods: saleData.payments?.map(p => p.method) || [],
    status: 'completed',
    cae: saleData.cae || null,
    cae_expiration: saleData.caeExpiration || null,
    notes: saleData.notes || null,
  };

  // ========================================
  // MODO OFFLINE - GUARDAR LOCALMENTE
  // ========================================
  if (!isOnline) {
    console.warn('⚠️ [sales.api] MODO OFFLINE - Guardando localmente');
    
    const offlineSale = {
      id: `offline-sale-${timestamp}`,
      ...baseSale,
      items: saleData.items || [],
      payments: saleData.payments || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _offlineMode: true,
    };
    
    if (saveOfflineSale(offlineSale)) {
      console.log('✅ [sales.api] Venta guardada offline exitosamente');
      console.log('═══════════════════════════════════════');
      return { 
        success: true, 
        data: offlineSale,
        message: 'Venta guardada localmente (modo offline)'
      };
    } else {
      console.error('❌ [sales.api] Error guardando venta offline');
      return { 
        success: false, 
        error: 'No se pudo guardar la venta offline' 
      };
    }
  }

  // ========================================
  // MODO ONLINE - VALIDAR UUIDS ANTES DE SUPABASE
  // ========================================
  console.log('📡 [sales.api] Modo ONLINE - Validando UUIDs...');
  
  // Validar UUIDs
  if (!isValidUUID(branchId)) {
    console.error('❌ [sales.api] branch_id inválido:', branchId);
    console.warn('⚠️ [sales.api] Fallback a modo offline por UUID inválido');
    
    // FALLBACK: Guardar offline si los IDs no son válidos para Supabase
    const offlineSale = {
      id: `offline-sale-${timestamp}`,
      ...baseSale,
      items: saleData.items || [],
      payments: saleData.payments || [],
      created_at: new Date().toISOString(),
      sync_pending: true,
      _offlineMode: true,
      _reason: 'Invalid UUID - waiting for Supabase configuration',
    };
    
    if (saveOfflineSale(offlineSale)) {
      return { 
        success: true, 
        data: offlineSale, 
        warning: 'Venta guardada offline (IDs de prueba detectados). Configura Supabase para sincronizar.' 
      };
    }
    
    return { 
      success: false, 
      error: 'IDs inválidos para Supabase y fallo guardando offline' 
    };
  }

  if (userId && !isValidUUID(userId)) {
    console.error('❌ [sales.api] user_id inválido:', userId);
    console.warn('⚠️ [sales.api] Fallback a modo offline por UUID inválido');
    
    const offlineSale = {
      id: `offline-sale-${timestamp}`,
      ...baseSale,
      items: saleData.items || [],
      payments: saleData.payments || [],
      created_at: new Date().toISOString(),
      sync_pending: true,
      _offlineMode: true,
      _reason: 'Invalid UUID - waiting for Supabase configuration',
    };
    
    if (saveOfflineSale(offlineSale)) {
      return { 
        success: true, 
        data: offlineSale, 
        warning: 'Venta guardada offline (IDs de prueba detectados). Configura Supabase para sincronizar.' 
      };
    }
    
    return { 
      success: false, 
      error: 'IDs inválidos para Supabase y fallo guardando offline' 
    };
  }

  // ========================================
  // SUPABASE - GUARDAR EN BASE DE DATOS
  // ========================================
  try {
    console.log('📡 [sales.api] Guardando en Supabase con UUIDs válidos...');
    console.log('📤 [sales.api] Datos:', baseSale);

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(baseSale)
      .select()
      .single();

    if (saleError) {
      console.error('❌ [sales.api] ERROR SUPABASE:', saleError);
      
      // FALLBACK: Guardar offline si falla Supabase
      console.warn('⚠️ [sales.api] Fallback a modo offline por error de Supabase...');
      const offlineSale = {
        id: `offline-sale-${timestamp}`,
        ...baseSale,
        items: saleData.items || [],
        payments: saleData.payments || [],
        created_at: new Date().toISOString(),
        sync_pending: true,
        _offlineMode: true,
        _supabaseError: saleError.message,
      };
      
      if (saveOfflineSale(offlineSale)) {
        return { 
          success: true, 
          data: offlineSale, 
          warning: 'Venta guardada offline. Se sincronizará después.' 
        };
      }
      
      throw new Error(saleError.message);
    }

    console.log('✅ [sales.api] Venta guardada en Supabase:', sale.id);

    // Insertar items
    if (saleData.items?.length > 0) {
      console.log('📦 [sales.api] Insertando items...');
      
      const saleItems = saleData.items.map(item => ({
        sale_id: sale.id,
        product_id: item.id?.startsWith('gen-') ? null : item.id,
        product_name: item.name,
        product_code: item.code || null,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.price),
        discount: parseFloat(item.discount) || 0,
        iva_rate: parseFloat(item.iva) || 21,
        subtotal: parseFloat(item.price) * parseFloat(item.quantity),
        total: parseFloat(item.price) * parseFloat(item.quantity) * (1 - (parseFloat(item.discount) || 0) / 100),
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.warn('⚠️ [sales.api] Error insertando items:', itemsError);
      }
    }

    // Insertar pagos
    if (saleData.payments?.length > 0) {
      console.log('💳 [sales.api] Insertando pagos...');
      
      const salePayments = saleData.payments.map(p => ({
        sale_id: sale.id,
        method: p.method,
        amount: parseFloat(p.amount),
        status: 'approved',
      }));

      const { error: paymentsError } = await supabase
        .from('sale_payments')
        .insert(salePayments);

      if (paymentsError) {
        console.warn('⚠️ [sales.api] Error insertando pagos:', paymentsError);
      }
    }

    console.log('🎉 [sales.api] Venta completada exitosamente');
    console.log('═══════════════════════════════════════');
    
    return { 
      success: true, 
      data: {
        ...sale,
        items: saleData.items || [],
        payments: saleData.payments || [],
      }
    };

  } catch (error) {
    console.error('❌ [sales.api] ERROR CRÍTICO:', error);
    
    // ÚLTIMO FALLBACK: Guardar offline
    const offlineSale = {
      id: `offline-sale-${timestamp}`,
      ...baseSale,
      items: saleData.items || [],
      payments: saleData.payments || [],
      created_at: new Date().toISOString(),
      sync_pending: true,
      _offlineMode: true,
      _error: error.message,
    };
    
    if (saveOfflineSale(offlineSale)) {
      return { 
        success: true, 
        data: offlineSale, 
        warning: 'Venta guardada offline (error de conexión)' 
      };
    }
    
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * ===========================================
 * OBTENER VENTAS
 * ===========================================
 */
export const getSales = async (filters = {}) => {
  if (!isSupabaseConfigured()) {
    const sales = getOfflineSales();
    return {
      success: true,
      data: {
        sales: sales,
        total: sales.length,
        page: 1,
        totalPages: 1,
      },
    };
  }

  try {
    let query = supabase
      .from('sales')
      .select(`
        *,
        client:clients(id, name, document_number),
        items:sale_items(*)
      `, { count: 'exact' });

    const { search, invoiceType, status, startDate, endDate, page = 1, limit = 50 } = filters;

    if (search) query = query.or(`sale_number.ilike.%${search}%,invoice_number.ilike.%${search}%`);
    if (invoiceType) query = query.eq('invoice_type', invoiceType);
    if (status) query = query.eq('status', status);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    query = query.order('date', { ascending: false });

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      data: {
        sales: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    console.error('[sales.api] Error obteniendo ventas:', error);
    const sales = getOfflineSales();
    return {
      success: true,
      data: { sales, total: sales.length, page: 1, totalPages: 1 },
      warning: 'Mostrando solo ventas offline',
    };
  }
};

/**
 * ===========================================
 * ESTADÍSTICAS
 * ===========================================
 */
export const getSalesStats = async (filters = {}) => {
  const { startDate, endDate } = filters;

  if (!isSupabaseConfigured()) {
    const sales = getOfflineSales();
    
    const stats = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0),
      averageTicket: 0,
      byInvoiceType: {},
    };

    stats.averageTicket = stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0;

    sales.forEach(sale => {
      const type = sale.invoice_type || 'X';
      if (!stats.byInvoiceType[type]) {
        stats.byInvoiceType[type] = { count: 0, total: 0 };
      }
      stats.byInvoiceType[type].count++;
      stats.byInvoiceType[type].total += parseFloat(sale.total) || 0;
    });

    return { success: true, data: stats };
  }

  try {
    let query = supabase
      .from('sales')
      .select('*')
      .eq('status', 'completed');

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data: sales, error } = await query;
    if (error) throw error;

    const stats = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + parseFloat(s.total), 0),
      averageTicket: 0,
      byInvoiceType: {},
    };

    stats.averageTicket = stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0;

    sales.forEach(sale => {
      const type = sale.invoice_type;
      if (!stats.byInvoiceType[type]) {
        stats.byInvoiceType[type] = { count: 0, total: 0 };
      }
      stats.byInvoiceType[type].count++;
      stats.byInvoiceType[type].total += parseFloat(sale.total);
    });

    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSaleById = async (id) => {
  if (!isSupabaseConfigured()) {
    const sales = getOfflineSales();
    const sale = sales.find(s => s.id === id);
    return sale ? { success: true, data: sale } : { success: false, error: 'No encontrada' };
  }

  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*, client:clients(*), items:sale_items(*), payments:sale_payments(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getTodaySales = async (branchId = null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getSales({ startDate: today.toISOString(), branchId, status: 'completed' });
};

export const cancelSale = async (id, reason, userId) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data, error } = await supabase
      .from('sales')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        cancellation_reason: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  getSales,
  getSaleById,
  createSale,
  cancelSale,
  getSalesStats,
  getTodaySales,
};