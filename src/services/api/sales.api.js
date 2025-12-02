// src/services/api/sales.api.js - VERSIÓN COMPLETA CORREGIDA

import supabase, { isSupabaseConfigured } from '../../lib/supabase';
import { useAuthStore } from '../../store/slices/authSlice';

/**
 * ===========================================
 * API DE VENTAS - MODO OFFLINE Y ONLINE
 * ===========================================
 */

// ========================================
// FUNCIONES DE STORAGE OFFLINE
// ========================================

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
    console.error('❌ Error guardando venta offline:', error);
    return false;
  }
};

// ========================================
// FUNCIÓN AUXILIAR: VALIDAR UUID
// ========================================
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return str && uuidRegex.test(str);
};

/**
 * Crear nueva venta - VERSIÓN CORREGIDA
 */
export const createSale = async (saleData) => {
  console.log('🚀 Iniciando creación de venta:', saleData);

  // ========================================
  // VALIDACIONES CRÍTICAS
  // ========================================
  
  // Validar userId
  let userId = saleData.userId;
  if (!isValidUUID(userId)) {
    console.warn('⚠️ user_id inválido, obteniendo del authStore');
    const authState = useAuthStore.getState();
    userId = authState.user?.id;
    
    if (!isValidUUID(userId)) {
      console.error('❌ ERROR: user_id no válido');
      return { 
        success: false, 
        error: 'Usuario no válido. Por favor, inicia sesión nuevamente.' 
      };
    }
  }

  // Validar branchId
  let branchId = saleData.branchId;
  if (!isValidUUID(branchId)) {
    console.warn('⚠️ branch_id inválido, obteniendo del authStore');
    const authState = useAuthStore.getState();
    branchId = authState.selectedBranch?.id;
    
    if (!isValidUUID(branchId)) {
      console.error('❌ ERROR: branch_id no válido');
      return { 
        success: false, 
        error: 'Sucursal no válida. Por favor, selecciona una sucursal.' 
      };
    }
  }

  // Validar clientId
  let clientId = saleData.clientId;
  if (clientId && !isValidUUID(clientId)) {
    console.warn('⚠️ client_id inválido, usando null');
    clientId = null;
  }

  console.log('✅ IDs validados:', { userId, branchId, clientId });

  const timestamp = Date.now();
  const saleNumber = `SALE-${timestamp}`;

  // ========================================
  // MODO OFFLINE
  // ========================================
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Modo offline - Guardando venta localmente');
    
    const offlineSale = {
      id: `offline-${timestamp}`,
      sale_number: saleNumber,
      invoice_type: saleData.invoiceType,
      invoice_number: saleData.invoiceNumber,
      point_of_sale: saleData.pointOfSale || 1,
      branch_id: branchId,
      user_id: userId,
      client_id: clientId,
      date: new Date().toISOString(),
      subtotal: saleData.subtotal,
      discount: saleData.discount || 0,
      tax: saleData.tax || 0,
      total: saleData.total,
      payment_methods: saleData.payments?.map(p => p.method) || [],
      status: 'completed',
      cae: saleData.cae || null,
      cae_expiration: saleData.caeExpiration || null,
      notes: saleData.notes || null,
      items: saleData.items || [],
      payments: saleData.payments || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const saved = saveOfflineSale(offlineSale);
    
    if (saved) {
      console.log('✅ Venta guardada offline exitosamente');
      return { success: true, data: offlineSale };
    } else {
      return { 
        success: false, 
        error: 'Error guardando venta en modo offline.' 
      };
    }
  }

  // ========================================
  // MODO ONLINE - SUPABASE
  // ========================================
  try {
    console.log('📡 Modo online - Guardando en Supabase');
    
    const saleToInsert = {
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

    console.log('📝 Objeto de venta preparado:', saleToInsert);

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(saleToInsert)
      .select()
      .single();

    if (saleError) {
      console.error('❌ Error al insertar venta:', saleError);
      
      if (saleError.code === 'PGRST301' || saleError.code === '42501') {
        console.warn('⚠️ Sin permisos en Supabase, guardando offline...');
        const offlineSale = {
          id: `offline-${timestamp}`,
          ...saleToInsert,
          items: saleData.items || [],
          payments: saleData.payments || [],
          created_at: new Date().toISOString(),
        };
        
        const saved = saveOfflineSale(offlineSale);
        if (saved) {
          return { success: true, data: offlineSale };
        }
      }
      
      throw new Error(`Error al guardar venta: ${saleError.message}`);
    }

    console.log('✅ Venta principal insertada con ID:', sale.id);

    // Insertar items
    if (saleData.items && saleData.items.length > 0) {
      console.log('📦 Insertando items de venta...');
      
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
        total: parseFloat(item.price) * parseFloat(item.quantity) * 
               (1 - (parseFloat(item.discount) || 0) / 100),
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.warn('⚠️ Error al insertar items:', itemsError.message);
      } else {
        console.log('✅ Items insertados correctamente');
      }
    }

    // Insertar pagos
    if (saleData.payments && saleData.payments.length > 0) {
      console.log('💳 Insertando pagos...');
      
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
        console.warn('⚠️ Error al insertar pagos:', paymentsError.message);
      } else {
        console.log('✅ Pagos insertados correctamente');
      }
    }

    console.log('🎉 ¡Venta completada exitosamente!');
    
    return { 
      success: true, 
      data: {
        ...sale,
        items: saleData.items || [],
        payments: saleData.payments || [],
      }
    };

  } catch (error) {
    console.error('❌ Error general al crear venta:', error);
    
    console.warn('⚠️ Intentando guardar offline como respaldo...');
    const offlineSale = {
      id: `offline-${timestamp}`,
      sale_number: saleNumber,
      invoice_type: saleData.invoiceType,
      invoice_number: saleData.invoiceNumber,
      point_of_sale: saleData.pointOfSale || 1,
      branch_id: branchId,
      user_id: userId,
      client_id: clientId,
      date: new Date().toISOString(),
      subtotal: saleData.subtotal,
      discount: saleData.discount || 0,
      tax: saleData.tax || 0,
      total: saleData.total,
      payment_methods: saleData.payments?.map(p => p.method) || [],
      status: 'completed',
      items: saleData.items || [],
      payments: saleData.payments || [],
      created_at: new Date().toISOString(),
    };
    
    const saved = saveOfflineSale(offlineSale);
    if (saved) {
      return { 
        success: true, 
        data: offlineSale,
        warning: 'Venta guardada offline debido a error de conexión'
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Error desconocido al guardar la venta' 
    };
  }
};

/**
 * Obtener ventas con filtros
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
    clientId = '',
    userId = '',
    branchId = '',
    status = '',
    paymentMethod = '',
    startDate = null,
    endDate = null,
    hasCAE = null,
    page = 1,
    limit = 50,
    sortBy = 'date',
    sortOrder = 'desc',
  } = filters;

  try {
    let query = supabase
      .from('sales')
      .select(`
        *,
        client:clients(id, name, document_number, cuit, iva_condition),
        user:users(id, full_name, username),
        branch:branches(id, name, code),
        items:sale_items(
          id,
          product_id,
          product_name,
          product_code,
          quantity,
          unit_price,
          discount,
          iva_rate,
          subtotal,
          total,
          product:products(id, name, code, barcode)
        ),
        payments:sale_payments(
          id,
          method,
          amount,
          status,
          reference,
          transaction_id
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`
        sale_number.ilike.%${search}%,
        invoice_number.ilike.%${search}%,
        cae.ilike.%${search}%
      `);
    }

    if (invoiceType) query = query.eq('invoice_type', invoiceType);
    if (clientId) query = query.eq('client_id', clientId);
    if (userId) query = query.eq('user_id', userId);
    if (branchId) query = query.eq('branch_id', branchId);
    if (status) query = query.eq('status', status);
    if (paymentMethod) query = query.contains('payment_methods', [paymentMethod]);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (hasCAE === true) query = query.not('cae', 'is', null);
    else if (hasCAE === false) query = query.is('cae', null);

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

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
    console.error('Error obteniendo ventas:', error);
    
    const offlineSales = getOfflineSales();
    return {
      success: true,
      data: {
        sales: offlineSales,
        total: offlineSales.length,
        page: 1,
        totalPages: 1,
      },
      warning: 'Mostrando solo ventas guardadas offline',
    };
  }
};

/**
 * Obtener venta por ID con todos sus detalles
 */
export const getSaleById = async (id) => {
  if (!isSupabaseConfigured()) {
    const offlineSales = getOfflineSales();
    const sale = offlineSales.find(s => s.id === id);
    return sale 
      ? { success: true, data: sale }
      : { success: false, error: 'Venta no encontrada' };
  }

  try {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        client:clients(id, name, document_number, cuit, iva_condition, address, city, province),
        user:users(id, full_name, username, email),
        branch:branches(id, name, code, address, phone, afip_pos_number),
        items:sale_items(
          id,
          product_id,
          product_name,
          product_code,
          quantity,
          unit_price,
          discount,
          iva_rate,
          subtotal,
          total
        ),
        payments:sale_payments(
          id,
          method,
          amount,
          status,
          reference,
          transaction_id,
          authorization_code,
          card_last_digits,
          card_brand,
          installments
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo venta:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener estadísticas de ventas
 */
export const getSalesStats = async (filters = {}) => {
  if (!isSupabaseConfigured()) {
    const offlineSales = getOfflineSales();
    
    const stats = {
      totalSales: offlineSales.length,
      totalRevenue: offlineSales.reduce((sum, s) => sum + (s.total || 0), 0),
      averageTicket: offlineSales.length > 0 
        ? offlineSales.reduce((sum, s) => sum + (s.total || 0), 0) / offlineSales.length 
        : 0,
      byInvoiceType: {},
      byPaymentMethod: {},
    };

    return { success: true, data: stats };
  }

  const {
    branchId = null,
    startDate = null,
    endDate = null,
  } = filters;

  try {
    let query = supabase
      .from('sales')
      .select('*')
      .eq('status', 'completed');

    if (branchId) query = query.eq('branch_id', branchId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data: sales, error } = await query;

    if (error) throw error;

    const stats = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + (s.total || 0), 0),
      averageTicket: sales.length > 0 
        ? sales.reduce((sum, s) => sum + (s.total || 0), 0) / sales.length 
        : 0,
      byInvoiceType: {},
      byPaymentMethod: {},
    };

    sales.forEach(sale => {
      const type = sale.invoice_type || 'X';
      if (!stats.byInvoiceType[type]) {
        stats.byInvoiceType[type] = { count: 0, total: 0 };
      }
      stats.byInvoiceType[type].count++;
      stats.byInvoiceType[type].total += sale.total || 0;

      (sale.payment_methods || []).forEach(method => {
        if (!stats.byPaymentMethod[method]) {
          stats.byPaymentMethod[method] = { count: 0 };
        }
        stats.byPaymentMethod[method].count++;
      });
    });

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener ventas del día
 */
export const getTodaySales = async (branchId = null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return getSales({
    startDate: today.toISOString(),
    branchId,
    status: 'completed',
  });
};

/**
 * Anular venta
 */
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
    console.error('Error anulando venta:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar ventas (autocompletado)
 */
export const searchSales = async (query, limit = 10) => {
  if (!isSupabaseConfigured()) {
    const offlineSales = getOfflineSales();
    const filtered = offlineSales.filter(s => 
      s.sale_number?.includes(query) || 
      s.invoice_number?.includes(query)
    ).slice(0, limit);
    return { success: true, data: filtered };
  }

  try {
    const { data, error } = await supabase
      .from('sales')
      .select('id, sale_number, invoice_type, invoice_number, total, date, status')
      .or(`sale_number.ilike.%${query}%,invoice_number.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error buscando ventas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener siguiente número de factura
 */
export const getNextInvoiceNumber = async (invoiceType, pointOfSale, branchId) => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: { nextNumber: 1, posNumber: 1 } };
  }

  try {
    const { data, error } = await supabase.rpc('get_next_invoice_number', {
      p_branch_id: branchId,
      p_invoice_type: invoiceType,
    });

    if (error) throw error;

    return {
      success: true,
      data: {
        nextNumber: data || 1,
        posNumber: pointOfSale || 1,
      },
    };
  } catch (error) {
    console.error('Error obteniendo siguiente número:', error);
    return { 
      success: true, 
      data: { nextNumber: 1, posNumber: pointOfSale || 1 }
    };
  }
};

/**
 * Obtener resumen mensual
 */
export const getMonthlySummary = async (year, month, branchId = null) => {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
  
  return getSalesStats({ startDate, endDate, branchId });
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