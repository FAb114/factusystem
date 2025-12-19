// src/pages/products/ProductsList.jsx

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Package,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Tag,
  Barcode,
  TrendingDown,
  Eye,
  Copy,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import { useCurrentBranch } from '../../store/slices/authSlice';
import * as productsApi from '../../services/api/products.api';
import * as advancedApi from '../../services/api/products.advanced.api';

export default function ProductsList() {
  const navigate = useNavigate();
  const currentBranch = useCurrentBranch();

  // Estados
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Filtros
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    supplier: '',
    stockStatus: '', // 'all', 'available', 'low', 'out'
    isActive: true,
    isService: null,
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const result = await productsApi.getProducts({ 
      isActive: filters.isActive,
      limit: 1000 
    });
    if (result.success) {
      setProducts(result.data.products || []);
    } else {
      toast.error('Error cargando productos');
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    const result = await advancedApi.getCategories();
    if (result.success) {
      setCategories(result.data);
    }
  };

  const loadBrands = async () => {
    const result = await advancedApi.getBrands();
    if (result.success) {
      setBrands(result.data);
    }
  };

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Búsqueda por texto
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        if (
          !product.name.toLowerCase().includes(search) &&
          !product.code?.toLowerCase().includes(search) &&
          !product.barcode?.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // Filtro de categoría
      if (filters.category && product.category_id !== filters.category) {
        return false;
      }

      // Filtro de marca
      if (filters.brand && product.brand_id !== filters.brand) {
        return false;
      }

      // Filtro de estado de stock
      if (filters.stockStatus) {
        if (filters.stockStatus === 'out' && product.stock > 0) return false;
        if (filters.stockStatus === 'low' && product.stock > product.min_stock) return false;
        if (filters.stockStatus === 'available' && product.stock <= product.min_stock) return false;
      }

      // Filtro de servicios
      if (filters.isService !== null && product.is_service !== filters.isService) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, filters]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.is_active).length;
    const lowStock = products.filter(p => p.stock <= p.min_stock && p.is_active).length;
    const outOfStock = products.filter(p => p.stock === 0 && p.is_active).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    return { total, active, lowStock, outOfStock, totalValue };
  }, [products]);

  // Handlers
  const handleCreateProduct = () => {
    navigate('/dashboard/products/new');
  };

  const handleEditProduct = (product) => {
    navigate(`/dashboard/products/edit/${product.id}`);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    const result = await productsApi.deleteProduct(productId);
    if (result.success) {
      toast.success('Producto eliminado');
      loadProducts();
    } else {
      toast.error('Error al eliminar producto');
    }
  };

  const handleDuplicateProduct = async (product) => {
    const newProduct = {
      ...product,
      name: `${product.name} (Copia)`,
      code: `${product.code}-COPY`,
      barcode: null,
    };
    delete newProduct.id;
    delete newProduct.created_at;
    delete newProduct.updated_at;

    const result = await productsApi.createProduct(newProduct);
    if (result.success) {
      toast.success('Producto duplicado');
      loadProducts();
    } else {
      toast.error('Error al duplicar producto');
    }
  };

  const handleGenerateBarcode = async (productId) => {
    const result = await advancedApi.generateBarcode(productId);
    if (result.success) {
      await productsApi.updateProduct(productId, { barcode: result.data });
      toast.success('Código de barras generado');
      loadProducts();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    if (!confirm(`¿Eliminar ${selectedProducts.length} productos?`)) return;

    for (const id of selectedProducts) {
      await productsApi.deleteProduct(id);
    }

    toast.success('Productos eliminados');
    setSelectedProducts([]);
    loadProducts();
  };

  const handleExport = () => {
    // TODO: Implementar exportación a Excel
    toast.success('Función de exportación en desarrollo');
  };

  const handleImport = () => {
    // TODO: Implementar importación desde Excel
    toast.success('Función de importación en desarrollo');
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const getStockStatus = (product) => {
    if (!product.discounts_stock) {
      return { label: 'N/A', color: 'bg-gray-100 text-gray-700', icon: null };
    }
    if (product.stock === 0) {
      return { label: 'Sin stock', color: 'bg-red-100 text-red-700', icon: XCircle };
    }
    if (product.stock <= product.min_stock) {
      return { label: 'Stock bajo', color: 'bg-orange-100 text-orange-700', icon: AlertCircle };
    }
    return { label: 'Disponible', color: 'bg-green-100 text-green-700', icon: CheckCircle };
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
              <p className="text-sm text-slate-500">
                {filteredProducts.length} de {products.length} productos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={Download}
              onClick={handleExport}
              size="sm"
            >
              Exportar
            </Button>
            <Button
              variant="outline"
              icon={Upload}
              onClick={handleImport}
              size="sm"
            >
              Importar
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleCreateProduct}
            >
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <p className="text-sm opacity-90 mb-1">Total Productos</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <p className="text-sm opacity-90 mb-1">Activos</p>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <p className="text-sm opacity-90 mb-1">Stock Bajo</p>
            <p className="text-2xl font-bold">{stats.lowStock}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
            <p className="text-sm opacity-90 mb-1">Sin Stock</p>
            <p className="text-2xl font-bold">{stats.outOfStock}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <p className="text-sm opacity-90 mb-1">Valor Total</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>

        {/* Búsqueda y filtros */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o código de barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <Button
            variant={showFilters ? 'primary' : 'outline'}
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoría
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Todas</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Marca
                </label>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Todas</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estado de Stock
                </label>
                <select
                  value={filters.stockStatus}
                  onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Todos</option>
                  <option value="available">Disponible</option>
                  <option value="low">Stock bajo</option>
                  <option value="out">Sin stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo
                </label>
                <select
                  value={filters.isService === null ? '' : filters.isService ? 'service' : 'product'}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    isService: e.target.value === '' ? null : e.target.value === 'service'
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Todos</option>
                  <option value="product">Productos</option>
                  <option value="service">Servicios</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    category: '',
                    brand: '',
                    supplier: '',
                    stockStatus: '',
                    isActive: true,
                    isService: null,
                  });
                  setSearchQuery('');
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}

        {/* Acciones masivas */}
        {selectedProducts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {selectedProducts.length} productos seleccionados
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" icon={Trash2} onClick={handleBulkDelete}>
                Eliminar seleccionados
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de productos */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Package className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No se encontraron productos</p>
            <p className="text-sm mt-2">Ajusta los filtros o crea un nuevo producto</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-xs font-semibold text-slate-600 uppercase">
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const StatusIcon = stockStatus.icon;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleSelectProduct(product.id)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-medium text-slate-900">
                              {product.code}
                            </span>
                            {product.barcode && (
                              <span className="font-mono text-xs text-slate-500">
                                {product.barcode}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900">{product.name}</p>
                              {product.is_service && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Servicio
                                </span>
                              )}
                              {product.is_giftcard && (
                                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full ml-1">
                                  Gift Card
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">
                            {product.category || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(product.price)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {product.discounts_stock ? (
                            <span className={`font-bold ${
                              product.stock === 0 
                                ? 'text-red-600' 
                                : product.stock <= product.min_stock 
                                ? 'text-orange-600' 
                                : 'text-green-600'
                            }`}>
                              {formatNumber(product.stock)}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                              {StatusIcon && <StatusIcon className="w-3 h-3" />}
                              {stockStatus.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => navigate(`/dashboard/products/${product.id}`)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateProduct(product)}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition"
                              title="Duplicar"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {!product.barcode && (
                              <button
                                onClick={() => handleGenerateBarcode(product.id)}
                                className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition"
                                title="Generar código de barras"
                              >
                                <Barcode className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}