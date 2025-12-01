// src/services/api/sales.api.js - VERSIÓN CORREGIDA CON STORAGE FIJO

import supabase, { isSupabaseConfigured } from '../../lib/supabase';

/**
 * ===========================================
 * API DE VENTAS - MODO OFFLINE Y ONLINE
 * ===========================================
 */

// ========================================
// FUNCIONES DE STORAGE OFFLINE - CORREGIDAS
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

/**
 * Crear nueva venta - VERSIÓN COMPLETAMENTE CORREGIDA
 */
export const createSale = async (saleData) => {
  console.log('🚀 Iniciando creación de venta:', saleData);

  // ========================================
  // VALIDACIONES CRÍTICAS
  // ========================================
  if (!saleData.userId) {
    console.error('❌ ERROR: userId es requerido');
    return { 
      success: false, 
      error: 'Usuario no identificado. Por favor, inicia sesión nuevamente.' 
    };
  }

  if (!saleData.branchId) {
    console.error('❌ ERROR: branchId es requerido');
    return { 
      success: false, 
      error: 'Sucursal no seleccionada. Por favor, selecciona una sucursal.' 
    };
  }

  // Generar número de venta único
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
      branch_id: saleData.branchId,
      user_id: saleData.userId,
      client_id: saleData.clientId || null,
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
        error: 'Error guardando venta en modo offline. Verifica el almacenamiento local.' 
      };
    }
  }

  // ========================================
  // MODO ONLINE - SUPABASE
  // ========================================
  try {
    console.log('📡 Modo online - Guardando en Supabase');
    
    // 1. PREPARAR OBJETO DE VENTA
    const saleToInsert = {
      sale_number: saleNumber,
      invoice_type: saleData.invoiceType || 'X',
      invoice_number: saleData.invoiceNumber?.toString() || null,
      point_of_sale: parseInt(saleData.pointOfSale) || 1,
      branch_id: saleData.branchId,
      user_id: saleData.userId,
      client_id: saleData.clientId || null,
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

    // 2. INSERTAR VENTA PRINCIPAL
    console.log('💾 Insertando venta en tabla sales...');
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(saleToInsert)
      .select()
      .single();

    if (saleError) {
      console.error('❌ Error al insertar venta:', saleError);
      
      // Si el error es de permisos, guardar offline
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

    // 3. INSERTAR ITEMS DE VENTA
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
        total: parseFloat(item.price) * parseFloat(item.quantity) * (1 - (parseFloat(item.discount) || 0) / 100),
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

    // 4. INSERTAR PAGOS
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
    
    // Intentar guardar offline como fallback
    console.warn('⚠️ Intentando guardar offline como respaldo...');
    const offlineSale = {
      id: `offline-${timestamp}`,
      sale_number: saleNumber,
      invoice_type: saleData.invoiceType,
      invoice_number: saleData.invoiceNumber,
      point_of_sale: saleData.pointOfSale || 1,
      branch_id: saleData.branchId,
      user_id: saleData.userId,
      client_id: saleData.clientId || null,
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
    
    // Fallback a ventas offline
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

// Exportar otras funciones sin cambios
export const getSaleById = async (id) => {
  // ... código existente ...
};

export const cancelSale = async (id, reason, userId) => {
  // ... código existente ...
};

export default {
  getSales,
  getSaleById,
  createSale,
  cancelSale,
  getSalesStats,
};