import { get, post, put, del } from '../../lib/axios';
import supabase from '../../lib/supabase';

/**
 * ===========================================
 * API DE PRODUCTOS
 * ===========================================
 */

/**
 * Obtener todos los productos con filtros
 */
export const getProducts = async (filters = {}) => {
  const {
    search = '',
    category = '',
    isActive = true,
    page = 1,
    limit = 50,
    sortBy = 'name',
    sortOrder = 'asc',
  } = filters;

  try {
    // Opción 1: Con Supabase
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive);
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
        products: data,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      },
    };

    // Opción 2: Con API REST personalizada
    // return await get('/products', { params: filters });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Obtener un producto por ID
 */
export const getProductById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener producto por código de barras
 */
export const getProductByBarcode = async (barcode) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo producto por barcode:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Crear nuevo producto
 */
export const createProduct = async (productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creando producto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar producto
 */
export const updateProduct = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error actualizando producto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar producto (soft delete)
 */
export const deleteProduct = async (id) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error eliminando producto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar stock de producto
 */
export const updateProductStock = async (id, quantity, operation = 'set') => {
  try {
    if (operation === 'set') {
      // Establecer stock exacto
      const { data, error } = await supabase
        .from('products')
        .update({ stock: quantity })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } else if (operation === 'add') {
      // Incrementar stock
      const { data, error } = await supabase.rpc('increment_stock', {
        product_id: id,
        quantity: quantity,
      });

      if (error) throw error;
      return { success: true, data };
    } else if (operation === 'subtract') {
      // Decrementar stock
      const { data, error } = await supabase.rpc('decrement_stock', {
        product_id: id,
        quantity: quantity,
      });

      if (error) throw error;
      return { success: true, data };
    }
  } catch (error) {
    console.error('Error actualizando stock:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener productos con stock bajo
 */
export const getLowStockProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lte('stock', supabase.raw('min_stock'))
      .eq('is_active', true)
      .order('stock', { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo productos con stock bajo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar productos (autocompletado)
 */
export const searchProducts = async (query, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, code, barcode, price, stock, image_url')
      .or(`name.ilike.%${query}%,code.ilike.%${query}%,barcode.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(limit);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error buscando productos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener categorías de productos
 */
export const getProductCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)
      .order('category');

    if (error) throw error;

    // Obtener categorías únicas
    const uniqueCategories = [...new Set(data.map((item) => item.category))];

    return { success: true, data: uniqueCategories };
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Importar productos desde CSV/Excel
 */
export const importProducts = async (file) => {
  try {
    // Aquí implementarías la lógica de importación
    // Por ahora es un placeholder
    console.log('Importando productos desde archivo:', file.name);

    return {
      success: true,
      data: {
        imported: 0,
        errors: [],
      },
    };
  } catch (error) {
    console.error('Error importando productos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exportar productos a CSV
 */
export const exportProducts = async (filters = {}) => {
  try {
    const result = await getProducts({ ...filters, limit: 10000 });

    if (!result.success) throw new Error(result.error);

    return {
      success: true,
      data: result.data.products,
    };
  } catch (error) {
    console.error('Error exportando productos:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getLowStockProducts,
  searchProducts,
  getProductCategories,
  importProducts,
  exportProducts,
};