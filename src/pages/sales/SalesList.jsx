// src/pages/sales/SalesList.jsx - VERSIÓN CON STATS CORREGIDAS

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
} from 'lucide-react';

import { useCurrentBranch } from '../../store/slices/authSlice';
import { useSales, useSalesStats } from '../../hooks/useSales';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';
import supabase, { isSupabaseConfigured } from '../../lib/supabase';
import Button from '../../components/ui/Button';

const INVOICE_TYPE_COLORS = {
  A: 'bg-purple-100 text-purple-800 border-purple-300',
  B: 'bg-blue-100 text-blue-800 border-blue-300',
  C: 'bg-teal-100 text-teal-800 border-teal-300',
  X: 'bg-slate-100 text-slate-800 border-slate-300',
  P: 'bg-orange-100 text-orange-800 border-orange-300',
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

  // Queries
  const { data: salesData, isLoading, refetch } = useSales(filters);
  const { data: statsData, refetch: refetchStats } = useSalesStats({
    branchId: branch?.id,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  // ========================================
  // REALTIME SOLO SI SUPABASE ESTÁ CONFIGURADO
  // ========================================
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase no configurado, Realtime desactivado');
      return;
    }

    console.log('📡 Suscribiendo a cambios en ventas...');
    
    const channel = supabase
      .channel('sales_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        (payload) => {
          console.log('🔔 Cambio detectado:', payload);
          refetch();
          refetchStats();
          toast('Lista actualizada', { icon: '🔄', position: 'bottom-right' });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime conectado');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, refetchStats]);

  // ========================================
  // CALCULAR ESTADÍSTICAS - MEJORADO
  // ========================================
  const stats = useMemo(() => {
    console.log('📊 Calculando estadísticas con:', statsData);

    if (!statsData) {
      return {
        totalVentas: 0,
        totalRecaudado: 0,
        ticketPromedio: 0,
        porTipo: {},
      };
    }
    
    return {
      totalVentas: statsData.totalSales || 0,
      totalRecaudado: statsData.totalRevenue || 0,
      ticketPromedio: statsData.averageTicket || 0,
      porTipo: statsData.byInvoiceType || {},
    };
  }, [statsData]);

  console.log('📊 Estadísticas finales:', stats);

  // ========================================
  // HANDLERS
  // ========================================
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
  };

  const handlePrint = () => {
    window.print();
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
              onClick={() => {
                refetch();
                refetchStats();
                toast.success('Lista actualizada');
              }}
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
                <p className="text-3xl font-bold">{stats.totalVentas}</p>
              </div>
              <Receipt className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Recaudación</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalRecaudado)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Ticket Promedio</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.ticketPromedio)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium">Por Tipo</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {Object.entries(stats.porTipo).map(([tipo, data]) => (
                    <span key={tipo} className="text-xs bg-white/20 px-2 py-1 rounded">
                      {tipo}: {data.count}
                    </span>
                  ))}
                  {Object.keys(stats.porTipo).length === 0 && (
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
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !salesData?.sales || salesData.sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Receipt className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg font-medium">No se encontraron ventas</p>
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
              {salesData.sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-blue-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{formatDate(sale.date)}</div>
                    <div className="text-xs text-slate-500">{format(new Date(sale.date), 'HH:mm')}</div>
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold">Detalle de Venta</h2>
              <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-slate-200 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="bg-white shadow-lg p-8 rounded-lg printable-content">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">MI NEGOCIO</h1>
                  <div className="py-2 border-y">
                    <p className="font-bold text-lg">FACTURA {selectedSale.invoice_type || 'X'}</p>
                    <p className="text-sm">
                      N°: {String(selectedSale.point_of_sale || 1).padStart(4, '0')}-{String(selectedSale.invoice_number).padStart(8, '0')}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(selectedSale.date)}</p>
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
                        <td className="p-2">{item.product_name}</td>
                        <td className="text-center p-2">{item.quantity}</td>
                        <td className="text-right p-2">{formatCurrency(item.unit_price)}</td>
                        <td className="text-right p-2 font-bold">{formatCurrency(item.total)}</td>
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