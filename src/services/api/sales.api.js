// src/services/api/sales.api.js - CON SOPORTE OFFLINE

import supabase, { isSupabaseConfigured } from '../../lib/supabase';

/**
 * ===========================================
 * API DE VENTAS - CON MODO OFFLINE
 * ===========================================
 */

// Storage local para modo offline
const OFFLINE_STORAGE_KEY = 'factusystem_offline_sales';

const getOfflineSales = () => {
  try {
    const data = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error leyendo ventas offline:', error);
    return [];
  }
};

const saveOfflineSale = (sale) => {
  try {
    const sales = getOfflineSales();
    sales.push(sale);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(sales));
    return true;
  } catch (error) {
    console.error('Error guardando venta offline:', error);
    return false;
  }
};

/**
 * Obtener ventas con filtros avanzados
 */
export const getSales = async (filters = {}) => {
  // Modo offline
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

  // Modo online
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
    return { success: false, error: error.message };
  }
};

/**
 * Obtener una venta por ID
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
        client:clients(*),
        user:users(id, full_name, username, email),
        branch:branches(*),
        items:sale_items(
          *,
          product:products(id, name, code, barcode, image_url)
        ),
        payments:sale_payments(*)
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
 * Crear nueva venta
 */
export const createSale = async (saleData) => {
  // Generar número de venta único
  const saleNumber = `${saleData.branchId?.slice(0, 4) || 'MAIN'}-${Date.now()}`;

  const saleToSave = {
    id: `sale-${Date.now()}`,
    sale_number: saleNumber,
    invoice_type: saleData.invoiceType,
    invoice_number: saleData.invoiceNumber,
    point_of_sale: saleData.pointOfSale,
    branch_id: saleData.branchId,
    user_id: saleData.userId,
    client_id: saleData.clientId,
    date: new Date().toISOString(),
    subtotal: saleData.subtotal,
    discount: saleData.discount || 0,
    tax: saleData.tax || 0,
    total: saleData.total,
    payment_methods: saleData.payments.map(p => p.method),
    status: 'completed',
    cae: saleData.cae || null,
    cae_expiration: saleData.caeExpiration || null,
    notes: saleData.notes,
    items: saleData.items,
    payments: saleData.payments,
    created_at: new Date().toISOString(),
  };

  // Modo offline
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Modo offline - Guardando venta localmente');
    
    const saved = saveOfflineSale(saleToSave);
    
    if (saved) {
      console.log('✅ Venta guardada offline:', saleToSave);
      return { success: true, data: saleToSave };
    } else {
      return { success: false, error: 'Error guardando venta offline' };
    }
  }

  // Modo online
  try {
    const {
      invoiceType,
      pointOfSale,
      invoiceNumber,
      clientId,
      userId,
      branchId,
      items,
      payments,
      subtotal,
      discount,
      tax,
      total,
      cae,
      caeExpiration,
      notes,
    } = saleData;

    // Insertar venta principal
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        sale_number: saleNumber,
        invoice_type: invoiceType,
        invoice_number: invoiceNumber,
        point_of_sale: pointOfSale,
        branch_id: branchId,
        user_id: userId,
        client_id: clientId,
        date: new Date().toISOString(),
        subtotal,
        discount: discount || 0,
        tax: tax || 0,
        total,
        payment_methods: payments.map(p => p.method),
        status: 'completed',
        cae: cae || null,
        cae_expiration: caeExpiration || null,
        notes,
      })
      .select()
      .single();

    if (saleError) throw saleError;

    // Insertar items
    if (items && items.length > 0) {
      const saleItems = items.map(item => ({
        sale_id: sale.id,
        product_id: item.id?.startsWith('gen-') ? null : item.id,
        product_name: item.name,
        product_code: item.code,
        quantity: item.quantity,
        unit_price: item.price,
        discount: item.discount || 0,
        iva_rate: item.iva || 21,
        subtotal: item.price * item.quantity,
        total: item.price * item.quantity * (1 - (item.discount || 0) / 100),
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;
    }

    // Insertar pagos
    if (payments && payments.length > 0) {
      const salePayments = payments.map(payment => ({
        sale_id: sale.id,
        method: payment.method,
        amount: payment.amount,
        reference: payment.reference || null,
        status: payment.status || 'approved',
        transaction_id: payment.transactionId || null,
      }));

      const { error: paymentsError } = await supabase
        .from('sale_payments')
        .insert(salePayments);

      if (paymentsError) throw paymentsError;
    }

    // Actualizar stock (solo productos reales, no genéricos)
    for (const item of items) {
      if (item.id && !item.id.startsWith('gen-')) {
        try {
          await supabase.rpc('decrement_stock', {
            product_id: item.id,
            quantity: item.quantity,
          });
        } catch (stockError) {
          console.warn('⚠️ Error actualizando stock:', stockError);
        }
      }
    }

    console.log('✅ Venta guardada en Supabase:', sale);
    return { success: true, data: sale };

  } catch (error) {
    console.error('❌ Error creando venta:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Anular venta
 */
export const cancelSale = async (id, reason, userId) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Función no disponible offline' };
  }

  try {
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select('*, items:sale_items(*)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (sale.status === 'cancelled') {
      throw new Error('La venta ya está anulada');
    }

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

    // Restaurar stock
    for (const item of sale.items) {
      if (item.product_id) {
        try {
          await supabase.rpc('increment_stock', {
            product_id: item.product_id,
            quantity: item.quantity,
          });
        } catch (stockError) {
          console.warn('⚠️ Error restaurando stock:', stockError);
        }
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error anulando venta:', error);
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
      byDay: {},
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
      byDay: {},
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

      const day = new Date(sale.date).toISOString().split('T')[0];
      if (!stats.byDay[day]) {
        stats.byDay[day] = { count: 0, total: 0 };
      }
      stats.byDay[day].count++;
      stats.byDay[day].total += sale.total || 0;
    });

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getSales,
  getSaleById,
  createSale,
  cancelSale,
  getSalesStats,
};