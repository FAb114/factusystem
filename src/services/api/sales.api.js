// src/services/api/sales.api.js

import supabase from '../../lib/supabase';

/**
 * ===========================================
 * API DE VENTAS - FACTUSYSTEM
 * ===========================================
 * Gestión completa de ventas y facturación
 */

/**
 * Obtener ventas con filtros avanzados
 */
export const getSales = async (filters = {}) => {
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

    // Filtro por búsqueda general
    if (search) {
      query = query.or(`
        sale_number.ilike.%${search}%,
        invoice_number.ilike.%${search}%,
        cae.ilike.%${search}%
      `);
    }

    // Filtro por tipo de factura
    if (invoiceType) {
      query = query.eq('invoice_type', invoiceType);
    }

    // Filtro por cliente
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Filtro por usuario
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Filtro por sucursal
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    // Filtro por estado
    if (status) {
      query = query.eq('status', status);
    }

    // Filtro por método de pago
    if (paymentMethod) {
      query = query.contains('payment_methods', [paymentMethod]);
    }

    // Filtro por rango de fechas
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Filtro por CAE (facturas fiscales)
    if (hasCAE === true) {
      query = query.not('cae', 'is', null);
    } else if (hasCAE === false) {
      query = query.is('cae', null);
    }

    // Ordenamiento
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Paginación
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
 * Obtener una venta por ID con todos los detalles
 */
export const getSaleById = async (id) => {
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

    // Generar número de venta único
    const saleNumber = `${branchId?.slice(0, 4) || 'MAIN'}-${Date.now()}`;

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

    // Insertar items de la venta
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

    // Actualizar stock de productos
    for (const item of items) {
      if (item.id && !item.id.startsWith('gen-')) {
        await supabase.rpc('decrement_stock', {
          product_id: item.id,
          quantity: item.quantity,
        });
      }
    }

    // Registrar movimiento de caja si hay pago en efectivo
    const cashPayment = payments.find(p => p.method === 'Efectivo');
    if (cashPayment && saleData.cashSessionId) {
      await supabase.from('cash_movements').insert({
        cash_session_id: saleData.cashSessionId,
        type: 'sale',
        amount: cashPayment.amount,
        payment_method: 'Efectivo',
        reference: sale.sale_number,
        description: `Venta ${invoiceType} ${invoiceNumber}`,
        user_id: userId,
      });
    }

    return { success: true, data: sale };
  } catch (error) {
    console.error('Error creando venta:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Anular venta
 */
export const cancelSale = async (id, reason, userId) => {
  try {
    // Obtener venta actual
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select('*, items:sale_items(*)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (sale.status === 'cancelled') {
      throw new Error('La venta ya está anulada');
    }

    // Actualizar estado
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
        await supabase.rpc('increment_stock', {
          product_id: item.product_id,
          quantity: item.quantity,
        });
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
  const {
    branchId = null,
    startDate = null,
    endDate = null,
    groupBy = 'day', // day, week, month
  } = filters;

  try {
    // Ventas del período
    let query = supabase
      .from('sales')
      .select('*')
      .eq('status', 'completed');

    if (branchId) query = query.eq('branch_id', branchId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data: sales, error } = await query;

    if (error) throw error;

    // Calcular estadísticas
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

    // Agrupar por tipo de factura
    sales.forEach(sale => {
      const type = sale.invoice_type || 'X';
      if (!stats.byInvoiceType[type]) {
        stats.byInvoiceType[type] = { count: 0, total: 0 };
      }
      stats.byInvoiceType[type].count++;
      stats.byInvoiceType[type].total += sale.total || 0;

      // Agrupar por método de pago
      (sale.payment_methods || []).forEach(method => {
        if (!stats.byPaymentMethod[method]) {
          stats.byPaymentMethod[method] = { count: 0 };
        }
        stats.byPaymentMethod[method].count++;
      });

      // Agrupar por día
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

/**
 * Obtener ventas del día actual
 */
export const getTodaySales = async (branchId = null) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = supabase
      .from('sales')
      .select(`
        *,
        client:clients(id, name),
        user:users(id, full_name)
      `)
      .gte('date', today.toISOString())
      .eq('status', 'completed')
      .order('date', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const summary = {
      count: data.length,
      total: data.reduce((sum, s) => sum + (s.total || 0), 0),
      cash: data.filter(s => s.payment_methods?.includes('Efectivo'))
                .reduce((sum, s) => sum + (s.total || 0), 0),
      cards: data.filter(s => 
        s.payment_methods?.some(m => m.includes('Tarjeta'))
      ).reduce((sum, s) => sum + (s.total || 0), 0),
      digital: data.filter(s => 
        s.payment_methods?.some(m => m.includes('QR') || m.includes('Transferencia'))
      ).reduce((sum, s) => sum + (s.total || 0), 0),
    };

    return { success: true, data: { sales: data, summary } };
  } catch (error) {
    console.error('Error obteniendo ventas del día:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener resumen mensual para reportes
 */
export const getMonthlySummary = async (year, month, branchId = null) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let query = supabase
      .from('sales')
      .select('*')
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .eq('status', 'completed');

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calcular IVA para libro de ventas
    const ivaVentas = {
      netoGravado21: 0,
      netoGravado105: 0,
      netoGravado27: 0,
      iva21: 0,
      iva105: 0,
      iva27: 0,
      exento: 0,
      noGravado: 0,
      total: 0,
    };

    const byType = {
      A: { count: 0, total: 0, iva: 0 },
      B: { count: 0, total: 0, iva: 0 },
      C: { count: 0, total: 0, iva: 0 },
      X: { count: 0, total: 0, iva: 0 },
    };

    data.forEach(sale => {
      const type = sale.invoice_type || 'X';
      if (byType[type]) {
        byType[type].count++;
        byType[type].total += sale.total || 0;
        byType[type].iva += sale.tax || 0;
      }

      // Solo facturas A discriminan IVA
      if (type === 'A') {
        ivaVentas.netoGravado21 += (sale.subtotal || 0);
        ivaVentas.iva21 += (sale.tax || 0);
      }

      ivaVentas.total += sale.total || 0;
    });

    return {
      success: true,
      data: {
        period: { year, month },
        totalSales: data.length,
        totalRevenue: data.reduce((sum, s) => sum + (s.total || 0), 0),
        byType,
        ivaVentas,
        dailyBreakdown: groupByDay(data),
      },
    };
  } catch (error) {
    console.error('Error obteniendo resumen mensual:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar ventas para autocompletado
 */
export const searchSales = async (query, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        id, 
        sale_number, 
        invoice_type, 
        invoice_number, 
        total, 
        date,
        client:clients(id, name)
      `)
      .or(`sale_number.ilike.%${query}%,invoice_number.ilike.%${query}%`)
      .order('date', { ascending: false })
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
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('invoice_number')
      .eq('invoice_type', invoiceType)
      .eq('point_of_sale', pointOfSale)
      .eq('branch_id', branchId)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    const nextNumber = data ? parseInt(data.invoice_number) + 1 : 1;

    return { success: true, data: nextNumber };
  } catch (error) {
    console.error('Error obteniendo siguiente número:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function groupByDay(sales) {
  const grouped = {};
  
  sales.forEach(sale => {
    const day = new Date(sale.date).toISOString().split('T')[0];
    if (!grouped[day]) {
      grouped[day] = { count: 0, total: 0 };
    }
    grouped[day].count++;
    grouped[day].total += sale.total || 0;
  });

  return Object.entries(grouped).map(([date, data]) => ({
    date,
    ...data,
  })).sort((a, b) => a.date.localeCompare(b.date));
}

export default {
  getSales,
  getSaleById,
  createSale,
  cancelSale,
  getSalesStats,
  getTodaySales,
  getMonthlySummary,
  searchSales,
  getNextInvoiceNumber,
};