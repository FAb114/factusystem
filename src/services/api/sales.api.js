// src/services/api/sales.api.js - VERSIÓN ULTRA-ROBUSTA CON LOGGING MEJORADO

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
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('❌ Error leyendo ventas offline:', error);
    return [];
  }
};

const saveOfflineSale = (sale) => {
  try {
    const sales = getOfflineSales();
    sales.push(sale);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(sales));
    console.log('✅ Venta guardada offline correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error guardando offline:', error);
    return false;
  }
};

/**
 * ===========================================
 * VALIDAR UUID - MEJORADO
 * ===========================================
 */
const isValidUUID = (str) => {
  if (!str) return false;
  
  // Aceptar formato offline-
  if (str.toString().startsWith('offline-')) return true;
  
  // Aceptar UUIDs reales
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * ===========================================
 * CREAR VENTA - ULTRA-ROBUSTA CON LOGGING
 * ===========================================
 */
export const createSale = async (saleData) => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 INICIANDO CREACIÓN DE VENTA');
  console.log('═══════════════════════════════════════');
  console.log('📦 Datos recibidos:', saleData);

  // ========================================
  // PASO 1: VALIDAR Y OBTENER IDS
  // ========================================
  const authState = useAuthStore.getState();
  console.log('🔐 Estado de autenticación:', {
    user: authState.user,
    branch: authState.selectedBranch,
  });
  
  let userId = saleData.userId;
  if (!isValidUUID(userId)) {
    userId = authState.user?.id;
    console.log('📝 Usando userId del store:', userId);
  }

  let branchId = saleData.branchId;
  if (!isValidUUID(branchId)) {
    branchId = authState.selectedBranch?.id;
    console.log('📝 Usando branchId del store:', branchId);
  }

  let clientId = saleData.clientId;
  if (clientId && !isValidUUID(clientId)) {
    clientId = null;
    console.log('⚠️ ClientId inválido, usando null');
  }

  // Validación final
  console.log('🔍 Validando IDs finales:', { userId, branchId, clientId });
  
  if (!isValidUUID(userId) || !isValidUUID(branchId)) {
    console.error('❌ VALIDACIÓN FALLIDA - IDs inválidos:', { userId, branchId });
    return { 
      success: false, 
      error: 'Error de autenticación. Por favor, vuelve a iniciar sesión.' 
    };
  }

  console.log('✅ IDs validados correctamente');

  const timestamp = Date.now();
  const saleNumber = `SALE-${timestamp}`;

  // ========================================
  // PASO 2: PREPARAR OBJETO DE VENTA
  // ========================================
  const baseSale = {
    sale_number: saleNumber,
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

  console.log('📄 Objeto de venta preparado:', baseSale);

  // ========================================
  // VERIFICAR MODO OFFLINE
  // ========================================
  const isOnline = isSupabaseConfigured();
  console.log('🌐 Estado de conexión:', isOnline ? 'ONLINE' : 'OFFLINE');

  if (!isOnline) {
    console.warn('⚠️ MODO OFFLINE ACTIVADO - Guardando localmente');
    
    const offlineSale = {
      id: `offline-${timestamp}`,
      ...baseSale,
      items: saleData.items || [],
      payments: saleData.payments || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('💾 Guardando venta offline:', offlineSale);
    
    if (saveOfflineSale(offlineSale)) {
      console.log('✅ Venta guardada offline exitosamente');
      console.log('═══════════════════════════════════════');
      return { success: true, data: offlineSale };
    } else {
      console.error('❌ Error guardando venta offline');
      console.log('═══════════════════════════════════════');
      return { success: false, error: 'Error guardando venta offline' };
    }
  }

  // ========================================
  // MODO ONLINE - SUPABASE
  // ========================================
  try {
    console.log('📡 MODO ONLINE - Intentando guardar en Supabase...');
    console.log('📤 Datos a insertar:', baseSale);

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(baseSale)
      .select()
      .single();

    if (saleError) {
      console.error('❌ ERROR DE SUPABASE:', {
        code: saleError.code,
        message: saleError.message,
        details: saleError.details,
        hint: saleError.hint,
      });
      
      // Si falla por permisos o autenticación, guardar offline
      if (saleError.code === 'PGRST301' || 
          saleError.code === '42501' || 
          saleError.code === 'PGRST116' ||
          saleError.message?.includes('JWT') ||
          saleError.message?.includes('expired')) {
        
        console.warn('⚠️ Error de autenticación/permisos - Guardando offline como respaldo...');
        
        const offlineSale = {
          id: `offline-${timestamp}`,
          ...baseSale,
          items: saleData.items || [],
          payments: saleData.payments || [],
          created_at: new Date().toISOString(),
          sync_pending: true, // Marcar para sincronizar después
        };
        
        if (saveOfflineSale(offlineSale)) {
          console.log('✅ Venta guardada offline (pendiente sincronización)');
          console.log('═══════════════════════════════════════');
          return { 
            success: true, 
            data: offlineSale, 
            warning: 'Venta guardada localmente. Se sincronizará cuando haya conexión.' 
          };
        }
      }
      
      throw new Error(saleError.message);
    }

    console.log('✅ VENTA PRINCIPAL GUARDADA EN SUPABASE');
    console.log('🆔 ID de venta:', sale.id);

    // ========================================
    // INSERTAR ITEMS
    // ========================================
    if (saleData.items && saleData.items.length > 0) {
      console.log('📦 Insertando', saleData.items.length, 'items...');
      
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
        console.warn('⚠️ Error insertando items:', itemsError.message);
      } else {
        console.log('✅ Items insertados correctamente');
      }
    }

    // ========================================
    // INSERTAR PAGOS
    // ========================================
    if (saleData.payments && saleData.payments.length > 0) {
      console.log('💳 Insertando', saleData.payments.length, 'pagos...');
      
      const salePayments = saleData.payments.map(payment => ({
        sale_id: sale.id,
        method: payment.method,
        amount: parseFloat(payment.amount),
        reference: payment.reference || null,
        status: payment.status || 'approved',
        transaction_id: payment.transactionId || null,
      }));

      const { error: paymentsError } = await supabase
        .from('sale_payments')
        .insert(salePayments);

      if (paymentsError) {
        console.warn('⚠️ Error insertando pagos:', paymentsError.message);
      } else {
        console.log('✅ Pagos insertados correctamente');
      }
    }

    console.log('🎉 ¡VENTA COMPLETADA EXITOSAMENTE EN SUPABASE!');
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
    console.error('❌ ERROR CRÍTICO AL CREAR VENTA:', error);
    console.error('Stack trace:', error.stack);
    
    // Último intento: guardar offline
    console.warn('⚠️ Intentando respaldo offline como última opción...');
    const offlineSale = {
      id: `offline-${timestamp}`,
      ...baseSale,
      items: saleData.items || [],
      payments: saleData.payments || [],
      created_at: new Date().toISOString(),
      sync_pending: true,
    };
    
    if (saveOfflineSale(offlineSale)) {
      console.log('✅ Venta guardada offline (respaldo de emergencia)');
      console.log('═══════════════════════════════════════');
      return { 
        success: true, 
        data: offlineSale, 
        warning: 'Venta guardada localmente por error de conexión. Se sincronizará después.' 
      };
    }
    
    console.log('═══════════════════════════════════════');
    return { 
      success: false, 
      error: error.message || 'Error al guardar venta' 
    };
  }
};

/**
 * ===========================================
 * OBTENER VENTAS CON FILTROS
 * ===========================================
 */
export const getSales = async (filters = {}) => {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Modo offline - Cargando ventas locales');
    const offlineSales = getOfflineSales();
    
    return {
      success: true,
      data: {
        sales: offlineSales,
        total: offlineSales.length,
        page: 1,
        totalPages: 1,
      },
    };
  }

  const {
    search = '',
    invoiceType = '',
    status = '',
    startDate = null,
    endDate = null,
    page = 1,
    limit = 50,
  } = filters;

  try {
    let query = supabase
      .from('sales')
      .select(`
        *,
        client:clients(id, name, document_number),
        items:sale_items(
          id,
          product_name,
          product_code,
          quantity,
          unit_price,
          total
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`sale_number.ilike.%${search}%,invoice_number.ilike.%${search}%`);
    }

    if (invoiceType) query = query.eq('invoice_type', invoiceType);
    if (status) query = query.eq('status', status);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    query = query.order('date', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

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
    console.error('❌ Error obteniendo ventas:', error);
    
    // Fallback a offline
    const offlineSales = getOfflineSales();
    return {
      success: true,
      data: {
        sales: offlineSales,
        total: offlineSales.length,
        page: 1,
        totalPages: 1,
      },
      warning: 'Mostrando solo ventas offline',
    };
  }
};

/**
 * ===========================================
 * OBTENER ESTADÍSTICAS
 * ===========================================
 */
export const getSalesStats = async (filters = {}) => {
  const { startDate, endDate } = filters;

  if (!isSupabaseConfigured()) {
    const offlineSales = getOfflineSales();
    
    const stats = {
      totalSales: offlineSales.length,
      totalRevenue: offlineSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0),
      averageTicket: 0,
      byInvoiceType: {},
    };

    stats.averageTicket = stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0;

    offlineSales.forEach(sale => {
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
  } catch (error) {
    console.error('❌ Error obteniendo stats:', error);
    return { success: false, error: error.message };
  }
};

// Exportar otras funciones (sin cambios)
export const getSaleById = async (id) => {
  if (!isSupabaseConfigured()) {
    const sales = getOfflineSales();
    const sale = sales.find(s => s.id === id);
    return sale ? { success: true, data: sale } : { success: false, error: 'No encontrada' };
  }

  try {
    const { data, error } = await supabase
      .from('sales')
      .select(`*, client:clients(*), items:sale_items(*), payments:sale_payments(*)`)
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