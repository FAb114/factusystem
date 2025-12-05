// src/pages/sales/SalesList.jsx - VERSIÓN ULTRA-CORREGIDA

import { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  Search,
  Eye,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Receipt,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react';

import { useCurrentBranch } from '../../store/slices/authSlice';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';
import { isSupabaseConfigured } from '../../lib/supabase';
import Button from '../../components/ui/Button';

const INVOICE_TYPE_COLORS = {
  A: 'bg-purple-100 text-purple-800 border-purple-300',
  B: 'bg-blue-100 text-blue-800 border-blue-300',
  C: 'bg-teal-100 text-teal-800 border-teal-300',
  X: 'bg-slate-100 text-slate-800 border-slate-300',
  P: 'bg-orange-100 text-orange-800 border-orange-300',
};

// ========================================
// FUNCIONES PARA LEER DATOS OFFLINE
// ========================================
const getOfflineSales = () => {
  try {
    const data = localStorage.getItem('factusystem_offline_sales');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error leyendo ventas offline:', error);
    return [];
  }
};

export default function SalesList() {
  const branch = useCurrentBranch();

  const [filters, setFilters] = useState({
    search: '',
    invoiceType: '',
    status: '',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const [selectedSale, setSelectedSale] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(!isSupabaseConfigured());
  const [offlineSales, setOfflineSales] = useState([]);
  const [loading, setLoading] = useState(false);

  // ========================================
  // CARGAR VENTAS OFFLINE AL MONTAR Y AL CAMBIAR FILTROS
  // ========================================
  useEffect(() => {
    console.log('🔍 [SalesList] Verificando modo de operación...');
    const offline = !isSupabaseConfigured();
    setIsOfflineMode(offline);
    
    if (offline) {
      console.log('📦 [SalesList] MODO OFFLINE - Cargando ventas desde localStorage');
      const sales = getOfflineSales();
      console.log('✅ [SalesList] Ventas offline cargadas:', sales.length);
      if (sales.length > 0) {
        console.table(sales.map(s => ({
          id: s.id,
          tipo: s.invoice_type,
          numero: s.invoice_number,
          total: s.total,
          fecha: s.date
        })));
      }
      setOfflineSales(sales);
    } else {
      console.log('🌐 [SalesList] MODO ONLINE - Usando React Query');
    }
  }, []);

  // Recargar cuando cambian los filtros en modo offline
  useEffect(() => {
    if (isOfflineMode) {
      console.log('🔄 [SalesList] Aplicando filtros en modo offline');
      const sales = getOfflineSales();
      setOfflineSales(sales);
    }
  }, [filters.search, filters.invoiceType, filters.status, filters.startDate, filters.endDate, isOfflineMode]);

  // ========================================
  // USAR DATOS OFFLINE DIRECTAMENTE (sin React Query)
  // ========================================
  const sales = useMemo(() => {
    if (isOfflineMode) {
      console.log('📋 [SalesList] Usando ventas offline para la lista:', offlineSales.length);
      
      // Aplicar filtros manualmente
      let filtered = [...offlineSales];
      
      // Filtro de búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(s => 
          s.sale_number?.toLowerCase().includes(searchLower) ||
          s.invoice_number?.toString().includes(searchLower) ||
          s.client?.name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Filtro de tipo de factura
      if (filters.invoiceType) {
        filtered = filtered.filter(s => s.invoice_type === filters.invoiceType);
      }
      
      // Filtro de estado
      if (filters.status) {
        filtered = filtered.filter(s => s.status === filters.status);
      }
      
      // Filtro de fecha
      if (filters.startDate) {
        filtered = filtered.filter(s => s.date >= filters.startDate);
      }
      if (filters.endDate) {
        filtered = filtered.filter(s => s.date <= filters.endDate);
      }
      
      // Ordenar por fecha descendente
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      console.log('✅ [SalesList] Ventas filtradas:', filtered.length);
      return filtered;
    }
    return []; // En modo online, esto debería venir de React Query
  }, [isOfflineMode, offlineSales, filters]);

  // ========================================
  // CALCULAR ESTADÍSTICAS
  // ========================================
  const stats = useMemo(() => {
    console.log('📊 [SalesList] Calculando estadísticas...');
    console.log('- Modo offline:', isOfflineMode);
    console.log('- Sales data:', sales.length, 'ventas');
    
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const byInvoiceType = {};
    sales.forEach(sale => {
      const type = sale.invoice_type || 'X';
      if (!byInvoiceType[type]) {
        byInvoiceType[type] = { count: 0, total: 0 };
      }
      byInvoiceType[type].count++;
      byInvoiceType[type].total += parseFloat(sale.total) || 0;
    });

    console.log('✅ [SalesList] Estadísticas calculadas:', {
      totalSales,
      totalRevenue,
      averageTicket,
      byInvoiceType,
    });

    return {
      totalSales,
      totalRevenue,
      averageTicket,
      byInvoiceType,
    };
  }, [sales, isOfflineMode]);

  console.log('📊 [SalesList] Estadísticas finales:', stats);

  // ========================================
  // HANDLERS
  // ========================================
  const handleFilterChange = (key, value) => {
    console.log(`🔧 [SalesList] Cambiando filtro ${key}:`, value);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewSale = (sale) => {
    console.log('👁️ [SalesList] Viendo venta:', sale);
    setSelectedSale(sale);
  };

  const handleRefresh = () => {
    console.log('🔄 [SalesList] Refrescando ventas...');
    if (isOfflineMode) {
      const sales = getOfflineSales();
      console.log('📊 [SalesList] Ventas recargadas:', sales.length);
      setOfflineSales(sales);
      toast.success(`${sales.length} ventas cargadas`);
    } else {
      toast.success('Lista actualizada');
    }
  };

  const getClientName = (sale) => {
    if (!sale) return 'Consumidor Final';
    if (sale.client?.name) return sale.client.name;
    if (sale.client_id && sale.client_id !== 'C0') {
      return `Cliente ID: ${sale.client_id}`;
    }
    return 'Consumidor Final';
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header con estadísticas */}
      <div className="bg-white border-b px-6 py-4">
        {/* Indicador de modo offline */}
        {isOfflineMode && (
          <div className="mb-4 bg-orange-50 border-l-4 border-orange-400 p-3 rounded-r-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-bold text-orange-800">
                  Modo Offline
                </p>
                <p className="text-xs text-orange-700">
                  Mostrando ventas guardadas localmente ({offlineSales.length} ventas). Las ventas se sincronizarán cuando configures Supabase.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>
            <p className="text-sm text-slate-500">
              {format(new Date(filters.startDate), "d 'de' MMMM", { locale: es })} - {' '}
              {format(new Date(filters.endDate), "d 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={handleRefresh}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Ventas</p>
                <p className="text-3xl font-bold">
                  {stats.totalSales}
                </p>
              </div>
              <Receipt className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Recaudación</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Ticket Promedio</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(stats.averageTicket)}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium">Por Tipo</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {Object.entries(stats.byInvoiceType).map(([tipo, data]) => (
                    <span key={tipo} className="text-xs bg-white/20 px-2 py-1 rounded">
                      {tipo}: {data.count}
                    </span>
                  ))}
                  {Object.keys(stats.byInvoiceType).length === 0 && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Sin datos</span>
                  )}
                </div>
              </div>
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por N° factura, cliente..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Receipt className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg font-medium">No se encontraron ventas</p>
            {isOfflineMode && (
              <p className="text-sm mt-2">Realiza una venta para que aparezca aquí</p>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr className="text-left text-xs font-semibold text-slate-600 uppercase">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-blue-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">
                      {formatDate(sale.date || sale.created_at)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(sale.date || sale.created_at), 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm border ${INVOICE_TYPE_COLORS[sale.invoice_type] || INVOICE_TYPE_COLORS.X}`}>
                        {sale.invoice_type || 'X'}
                      </span>
                      <div className="text-sm font-mono font-medium text-slate-900">
                        {String(sale.point_of_sale || 1).padStart(4, '0')}-{String(sale.invoice_number || 0).padStart(8, '0')}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{getClientName(sale)}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(sale.total)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <button onClick={() => handleViewSale(sale)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Detalle */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold">Detalle de Venta</h2>
              <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-slate-200 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="bg-white shadow-lg p-8 rounded-lg">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">MI NEGOCIO</h1>
                  <div className="py-2 border-y">
                    <p className="font-bold text-lg">FACTURA {selectedSale.invoice_type || 'X'}</p>
                    <p className="text-sm">
                      N°: {String(selectedSale.point_of_sale || 1).padStart(4, '0')}-{String(selectedSale.invoice_number).padStart(8, '0')}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(selectedSale.date || selectedSale.created_at)}</p>
                  </div>
                </div>

                <div className="mb-4 text-sm">
                  <p><strong>Cliente:</strong> {getClientName(selectedSale)}</p>
                </div>

                <table className="w-full mb-4 text-sm">
                  <thead className="border-b-2">
                    <tr>
                      <th className="text-left p-2">Producto</th>
                      <th className="text-center p-2">Cant.</th>
                      <th className="text-right p-2">Precio</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedSale.items || []).map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{item.product_name || item.name}</td>
                        <td className="text-center p-2">{item.quantity}</td>
                        <td className="text-right p-2">{formatCurrency(item.unit_price || item.price)}</td>
                        <td className="text-right p-2 font-bold">{formatCurrency(item.total || (item.price * item.quantity))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t-2 pt-4 text-right">
                  <p className="text-2xl font-bold">TOTAL: {formatCurrency(selectedSale.total)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}