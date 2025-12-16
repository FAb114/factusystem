// src/services/api/sales.api.js - VERSIÓN CORREGIDA

import supabase, { isSupabaseConfigured } from '../../lib/supabase';
import { useAuthStore } from '../../store/slices/authSlice';

/**
 * ===========================================
 * STORAGE OFFLINE
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
    
    // 🔥 DISPARA EVENTO PERSONALIZADO
    window.dispatchEvent(new CustomEvent('offline-sale-created', { detail: sale }));
    
    return true;
  } catch (error) {
    console.error('❌ [sales.api] Error guardando offline:', error);
    return false;
  }
};

/**
 * ===========================================
 * VALIDAR UUID
 * ===========================================
 */
const isValidUUID = (uuid) => {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * ===========================================
 * CREAR VENTA - ROBUSTA
 * ===========================================
 */
export const createSale = async (saleData) => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 [sales.api] INICIANDO CREACIÓN DE VENTA');
  console.log('═══════════════════════════════════════');
  console.log('📤 [sales.api] Datos recibidos:', saleData);

  // Obtener IDs del store
  const authState = useAuthStore.getState();
  const userId = saleData.userId || authState.user?.id;
  const branchId = saleData.branchId || authState.selectedBranch?.id;
  const clientId = saleData.clientId === 'C0' ? null : saleData.clientId;

  console.log('🔍 [sales.api] IDs procesados:', { userId, branchId, clientId });

  // Preparar datos del cliente
  const clientData = saleData.client || {
    id: clientId || 'C0',
    name: saleData.clientName || 'CONSUMIDOR FINAL',
    document_number: saleData.clientDocument || '0',
    iva_condition: saleData.clientCondition || 'Final',
  };

  console.log('👤 [sales.api] Cliente:', clientData);

  // Verificar modo offline
  const isOnline = isSupabaseConfigured();
  console.log('🌐 [sales.api] Estado:', isOnline ? 'ONLINE' : 'OFFLINE');

  const timestamp = Date.now();
  const baseSale = {
    sale_number: `SALE-${timestamp}`,
    invoice_type: saleData.invoiceType || 'X',
    invoice_number: saleData.invoiceNumber?.toString() || String(timestamp).slice(-8),
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

  // MODO OFFLINE o IDs no válidos - Guardar localmente
  if (!isOnline || String(branchId).startsWith('offline-') || String(userId).startsWith('offline-')) {
    console.warn('⚠️ [sales.api] MODO OFFLINE - Guardando localmente');
    
    const offlineSale = {
      id: `offline-sale-${timestamp}`,
      ...baseSale,
      client: clientData,
      items: saleData.items || [],
      payments: saleData.payments || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _offlineMode: true,
    };
    
    console.log('💾 [sales.api] Venta offline preparada:', offlineSale);
    
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

  // MODO ONLINE - SUPABASE
  try {
    console.log('📡 [sales.api] Guardando en Supabase...');

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(baseSale)
      .select()
      .single();

    if (saleError) {
      console.error('❌ [sales.api] ERROR SUPABASE:', saleError);
      
      // Fallback offline
      const offlineSale = {
        id: `offline-sale-${timestamp}`,
        ...baseSale,
        client: clientData,
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

      await supabase.from('sale_items').insert(saleItems);
    }

    // Insertar pagos
    if (saleData.payments?.length > 0) {
      const salePayments = saleData.payments.map(p => ({
        sale_id: sale.id,
        method: p.method,
        amount: parseFloat(p.amount),
        status: 'approved',
      }));

      await supabase.from('sale_payments').insert(salePayments);
    }

    console.log('🎉 [sales.api] Venta completada exitosamente');
    console.log('═══════════════════════════════════════');
    
    return { 
      success: true, 
      data: {
        ...sale,
        client: clientData,
        items: saleData.items || [],
        payments: saleData.payments || [],
      }
    };

  } catch (error) {
    console.error('❌ [sales.api] ERROR CRÍTICO:', error);
    
    const offlineSale = {
      id: `offline-sale-${timestamp}`,
      ...baseSale,
      client: clientData,
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
 * OBTENER VENTAS - HÍBRIDO
 * ===========================================
 */
export const getSales = async (filters = {}) => {
  console.log('📋 [sales.api] Obteniendo ventas con filtros:', filters);
  
  // Leer ventas locales
  const localSales = getOfflineSales();

  // Si estamos offline, retornar solo locales
  if (!isSupabaseConfigured()) {
    console.log('📦 [sales.api] Retornando ventas offline:', localSales.length);
    return {
      success: true,
      data: {
        sales: localSales,
        total: localSales.length,
        page: 1,
        totalPages: 1,
      },
    };
  }

  // Si estamos ONLINE, mezclar con la nube
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

    const { data: remoteSales, error, count } = await query;

    if (error) throw error;

    // 🔥 FUSIÓN DE DATOS
    const allSales = [...(remoteSales || []), ...localSales];

    // Ordenar por fecha
    allSales.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

    console.log(`✅ [sales.api] Ventas combinadas: ${remoteSales?.length || 0} nube + ${localSales.length} locales`);

    return {
      success: true,
      data: {
        sales: allSales, 
        total: (count || 0) + localSales.length,
        page,
        totalPages: Math.ceil(((count || 0) + localSales.length) / limit),
      },
    };

  } catch (error) {
    console.error('[sales.api] Error obteniendo ventas de nube:', error);
    return {
      success: true,
      data: { sales: localSales, total: localSales.length, page: 1, totalPages: 1 },
      warning: 'Mostrando solo ventas offline',
    };
  }
};

/**
 * ===========================================
 * OTRAS FUNCIONES
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

export const searchSales = async (query) => {
  return getSales({ search: query, limit: 20 });
};

export const getNextInvoiceNumber = async (invoiceType, pointOfSale, branchId) => {
  // Implementación simplificada para modo offline
  const sales = getOfflineSales();
  const filtered = sales.filter(s => 
    s.invoice_type === invoiceType && 
    s.point_of_sale === pointOfSale
  );
  
  const maxNumber = filtered.reduce((max, s) => {
    const num = parseInt(s.invoice_number) || 0;
    return num > max ? num : max;
  }, 0);

  return { success: true, data: maxNumber + 1 };
};

export const getMonthlySummary = async (year, month, branchId = null) => {
  // Implementación simplificada
  return { success: true, data: {} };
};

export default {
  getSales,
  getSaleById,
  createSale,
  cancelSale,
  getSalesStats,
  getTodaySales,
  searchSales,
  getNextInvoiceNumber,
  getMonthlySummary,
};