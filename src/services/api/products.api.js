import supabase, { isSupabaseConfigured } from '../../lib/supabase';

/**
 * ===========================================
 * API AVANZADA DE PRODUCTOS
 * ===========================================
 */

// ========================================
// GESTIÓN DE CATEGORÍAS
// ========================================

export const getCategories = async () => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: [] };
  }

  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return { success: false, error: error.message };
  }
};

export const createCategory = async (categoryData) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data, error } = await supabase
      .from('product_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========================================
// GESTIÓN DE MARCAS
// ========================================

export const getBrands = async () => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: [] };
  }

  try {
    const { data, error } = await supabase
      .from('product_brands')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========================================
// GESTIÓN DE PROVEEDORES
// ========================================

export const getSuppliers = async (filters = {}) => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: [] };
  }

  try {
    let query = supabase
      .from('product_suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createSupplier = async (supplierData) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data, error } = await supabase
      .from('product_suppliers')
      .insert(supplierData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========================================
// STOCK POR SUCURSAL
// ========================================

export const getStockByBranch = async (productId) => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: [] };
  }

  try {
    const { data, error } = await supabase
      .from('product_stock_by_branch')
      .select(`
        *,
        branch:branches(id, name, code)
      `)
      .eq('product_id', productId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateStockByBranch = async (productId, branchId, updates) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data, error } = await supabase
      .from('product_stock_by_branch')
      .upsert({
        product_id: productId,
        branch_id: branchId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========================================
// PRODUCTOS CON STOCK BAJO
// ========================================

export const getLowStockProducts = async (branchId = null) => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: [] };
  }

  try {
    let query = supabase
      .from('v_low_stock_products')
      .select('*')
      .order('needed_quantity', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========================================
// KARDEX - HISTORIAL DE MOVIMIENTOS
// ========================================

export const getProductMovements = async (productId, branchId = null, filters = {}) => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: [] };
  }

  try {
    let query = supabase
      .from('product_movements')
      .select(`
        *,
        user:users(full_name)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createManualAdjustment = async (adjustmentData) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  const { productId, branchId, quantity, reason, userId } = adjustmentData;

  try {
    // Obtener stock actual
    const { data: currentStock, error: stockError } = await supabase
      .from('product_stock_by_branch')
      .select('stock')
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .single();

    if (stockError) throw stockError;

    const previousStock = currentStock?.stock || 0;
    const newStock = previousStock + quantity;

    // Actualizar stock
    await supabase
      .from('product_stock_by_branch')
      .upsert({
        product_id: productId,
        branch_id: branchId,
        stock: newStock,
        updated_at: new Date().toISOString(),
      });

    // Registrar en kardex
    const { data, error } = await supabase
      .from('product_movements')
      .insert({
        product_id: productId,
        branch_id: branchId,
        type: 'adjustment',
        quantity: quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: reason,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========================================
// TRANSFERENCIAS ENTRE SUCURSALES
// ========================================

export const createTransferRequest = async (transferData) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    // Generar número de transferencia
    const transferNumber = `TRANS-${Date.now()}`;

    const { data: transfer, error: transferError } = await supabase
      .from('stock_transfers')
      .insert({
        transfer_number: transferNumber,
        from_branch_id: transferData.fromBranchId,
        to_branch_id: transferData.toBranchId,
        requested_by: transferData.requestedBy,
        notes: transferData.notes,
        status: 'pending',
      })
      .select()
      .single();

    if (transferError) throw transferError;

    // Insertar items
    const items = transferData.items.map(item => ({
      transfer_id: transfer.id,
      product_id: item.productId,
      quantity_requested: item.quantity,
      notes: item.notes,
    }));

    const { error: itemsError } = await supabase
      .from('stock_transfer_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return { success: true, data: transfer };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getTransferRequests = async (filters = {}) => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: [] };
  }

  try {
    let query = supabase
      .from('stock_transfers')
      .select(`
        *,
        from_branch:branches!from_branch_id(name, code),
        to_branch:branches!to_branch_id(name, code),
        requested_by_user:users!requested_by(full_name),
        items:stock_transfer_items(
          *,
          product:products(name, code)
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.fromBranchId) {
      query = query.eq('from_branch_id', filters.fromBranchId);
    }

    if (filters.toBranchId) {
      query = query.eq('to_branch_id', filters.toBranchId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const approveTransfer = async (transferId, userId, itemsToSend) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    // Actualizar cantidades enviadas
    for (const item of itemsToSend) {
      await supabase
        .from('stock_transfer_items')
        .update({ quantity_sent: item.quantitySent })
        .eq('id', item.id);
    }

    // Completar transferencia (esto ejecuta la función de DB que mueve el stock)
    const { error } = await supabase.rpc('complete_stock_transfer', {
      p_transfer_id: transferId,
      p_user_id: userId,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========================================
// ÓRDENES DE COMPRA
// ========================================

export const createPurchaseOrder = async (orderData) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const orderNumber = `PO-${Date.now()}`;

    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        order_number: orderNumber,
        supplier_id: orderData.supplierId,
        branch_id: orderData.branchId,
        created_by: orderData.createdBy,
        notes: orderData.notes,
        total: orderData.total,
        status: 'draft',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insertar items
    const items = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      quantity_requested: item.quantity,
      unit_cost: item.unitCost,
      subtotal: item.quantity * item.unitCost,
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return { success: true, data: order };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPurchaseOrders = async (filters = {}) => {
  if (!isSupabaseConfigured()) {
    return { success: true, data: [] };
  }

  try {
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:product_suppliers(name, email, phone),
        branch:branches(name, code),
        creator:users!created_by(full_name),
        items:purchase_order_items(
          *,
          product:products(name, code, barcode)
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.supplierId) {
      query = query.eq('supplier_id', filters.supplierId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========================================
// GIFT CARDS
// ========================================

export const createGiftCard = async (giftCardData) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const code = `GC-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const { data, error } = await supabase
      .from('gift_cards')
      .insert({
        code: code,
        barcode: giftCardData.barcode,
        type: giftCardData.type,
        value: giftCardData.value,
        initial_balance: giftCardData.type === 'fixed' ? giftCardData.value : null,
        current_balance: giftCardData.type === 'fixed' ? giftCardData.value : null,
        issued_by: giftCardData.issuedBy,
        expires_at: giftCardData.expiresAt,
        sale_id: giftCardData.saleId,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getGiftCardByCode = async (code) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    // Verificar si está vencida
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { success: false, error: 'Gift Card vencida' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const useGiftCard = async (code, amountUsed) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'No disponible offline' };
  }

  try {
    const { data: giftCard, error: getError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', code)
      .single();

    if (getError) throw getError;

    let updates = {};

    if (giftCard.type === 'fixed') {
      const newBalance = (giftCard.current_balance || 0) - amountUsed;
      updates = {
        current_balance: Math.max(0, newBalance),
        is_active: newBalance > 0,
      };
    } else {
      updates = {
        is_active: false,
        used_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('gift_cards')
      .update(updates)
      .eq('id', giftCard.id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========================================
// GENERADOR DE CÓDIGOS DE BARRA
// ========================================

export const generateBarcode = async (productId) => {
  // Generar código EAN-13 válido
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  let code = timestamp.slice(-9) + random;
  
  // Calcular dígito verificador
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  code += checkDigit;

  return { success: true, data: code };
};

export default {
  getCategories,
  createCategory,
  getBrands,
  getSuppliers,
  createSupplier,
  getStockByBranch,
  updateStockByBranch,
  getLowStockProducts,
  getProductMovements,
  createManualAdjustment,
  createTransferRequest,
  getTransferRequests,
  approveTransfer,
  createPurchaseOrder,
  getPurchaseOrders,
  createGiftCard,
  getGiftCardByCode,
  useGiftCard,
  generateBarcode,
};