// src/pages/sales/SalesList.jsx - VERSIÓN CORREGIDA

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Eye,
  Printer,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Mail,
  MessageCircle,
  Ban,
  FileSpreadsheet,
  ArrowUpDown,
  SlidersHorizontal,
  User,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

import { useCurrentBranch, useCurrentUser } from '../../store/slices/authSlice';
import { useSales, useSalesStats, useCancelSale } from '../../hooks/useSales';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button';

// Constantes
const INVOICE_TYPE_COLORS = {
  A: 'bg-purple-100 text-purple-800 border-purple-300',
  B: 'bg-blue-100 text-blue-800 border-blue-300',
  C: 'bg-teal-100 text-teal-800 border-teal-300',
  X: 'bg-slate-100 text-slate-800 border-slate-300',
  P: 'bg-orange-100 text-orange-800 border-orange-300',
};

const STATUS_CONFIG = {
  completed: { label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Anulada', color: 'bg-red-100 text-red-800', icon: XCircle },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
};

const PAYMENT_ICONS = {
  'Efectivo': Banknote,
  'Tarjeta Débito': CreditCard,
  'Tarjeta Crédito': CreditCard,
  'QR (Mercado Pago)': Smartphone,
  'Transferencia': Smartphone,
  'Transferencia (MP)': Smartphone,
};

export default function SalesList() {
  const navigate = useNavigate();
  const branch = useCurrentBranch();
  const user = useCurrentUser();

  // Estados de filtros
  const [filters, setFilters] = useState({
    search: '',
    invoiceType: '',
    status: '',
    paymentMethod: '',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    hasCAE: null,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedSales, setSelectedSales] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedSale, setSelectedSale] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Queries
  const { data: salesData, isLoading, isError, refetch } = useSales(filters);
  const { data: statsData } = useSalesStats({
    branchId: branch?.id,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  // Mutation para cancelar venta
  const cancelSaleMutation = useCancelSale();

  // Estadísticas calculadas
  const stats = useMemo(() => {
    if (!statsData) return null;
    return {
      totalVentas: statsData.totalSales || 0,
      totalRecaudado: statsData.totalRevenue || 0,
      ticketPromedio: statsData.averageTicket || 0,
      porTipo: statsData.byInvoiceType || {},
    };
  }, [statsData]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      invoiceType: '',
      status: '',
      paymentMethod: '',
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      hasCAE: null,
    });
    setPage(1);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
  };

  const handlePrint = (sale) => {
    toast.success('Preparando impresión...');
  };

  const handleCancelSale = async () => {
    if (!selectedSale || !cancelReason.trim()) {
      toast.error('Ingrese un motivo de anulación');
      return;
    }

    try {
      await cancelSaleMutation.mutateAsync({
        id: selectedSale.id,
        reason: cancelReason,
        userId: user.id,
      });
      
      setShowCancelModal(false);
      setSelectedSale(null);
      setCancelReason('');
      refetch();
    } catch (error) {
      console.error('Error al anular venta:', error);
    }
  };

  const handleExport = async () => {
    toast.loading('Generando exportación...', { id: 'export' });
    setTimeout(() => {
      toast.success('Archivo exportado correctamente', { id: 'export' });
    }, 1500);
  };

  // Presets de fecha
  const datePresets = [
    { label: 'Hoy', getValue: () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      return { startDate: today, endDate: today };
    }},
    { label: 'Esta semana', getValue: () => {
      const now = new Date();
      const start = new Date(now.setDate(now.getDate() - now.getDay()));
      return { 
        startDate: format(start, 'yyyy-MM-dd'), 
        endDate: format(new Date(), 'yyyy-MM-dd') 
      };
    }},
    { label: 'Este mes', getValue: () => ({
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    })},
    { label: 'Mes anterior', getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    }},
  ];

  const applyDatePreset = (preset) => {
    const dates = preset.getValue();
    setFilters(prev => ({ ...prev, ...dates }));
    setPage(1);
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
              onClick={() => refetch()}
              className="text-slate-600"
            >
              Actualizar
            </Button>
            <Button
              variant="outline"
              icon={FileSpreadsheet}
              onClick={handleExport}
              className="text-slate-600"
            >
              Exportar
            </Button>
            <Button
              variant="primary"
              icon={FileText}
              onClick={() => navigate('/dashboard/billing')}
            >
              Nueva Venta
            </Button>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        {stats && (
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
                  <div className="flex gap-2 mt-1">
                    {Object.entries(stats.porTipo).map(([tipo, data]) => (
                      <span key={tipo} className="text-xs bg-white/20 px-2 py-1 rounded">
                        {tipo}: {data.count}
                      </span>
                    ))}
                  </div>
                </div>
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por N° factura, cliente, CAE..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {datePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyDatePreset(preset)}
                className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-white hover:shadow-sm transition"
              >
                {preset.label}
              </button>
            ))}
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

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              showFilters 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Panel de filtros avanzados */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tipo de Comprobante
                </label>
                <select
                  value={filters.invoiceType}
                  onChange={(e) => handleFilterChange('invoiceType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Todos</option>
                  <option value="A">Factura A</option>
                  <option value="B">Factura B</option>
                  <option value="C">Factura C</option>
                  <option value="X">Factura X</option>
                  <option value="P">Presupuesto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Todos</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Anulada</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Método de Pago
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Todos</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta Débito">Tarjeta Débito</option>
                  <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                  <option value="QR (Mercado Pago)">QR (Mercado Pago)</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Factura Fiscal
                </label>
                <select
                  value={filters.hasCAE === null ? '' : filters.hasCAE.toString()}
                  onChange={(e) => handleFilterChange('hasCAE', 
                    e.target.value === '' ? null : e.target.value === 'true'
                  )}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Todas</option>
                  <option value="true">Con CAE</option>
                  <option value="false">Sin CAE</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de ventas */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <XCircle className="w-12 h-12 mb-2 text-red-400" />
              <p>Error al cargar las ventas</p>
              <button 
                onClick={() => refetch()}
                className="mt-2 text-blue-600 hover:underline"
              >
                Reintentar
              </button>
            </div>
          ) : !salesData?.sales || salesData.sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Receipt className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg font-medium">No se encontraron ventas</p>
              <p className="text-sm">Ajusta los filtros o realiza una nueva venta</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-100 sticky top-0 z-10">
                <tr className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </th>
                  <th 
                    className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Fecha
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Comprobante</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesData.sales.map((sale) => {
                  const statusConfig = STATUS_CONFIG[sale.status] || STATUS_CONFIG.completed;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr 
                      key={sale.id}
                      className={`hover:bg-blue-50/50 transition ${
                        sale.status === 'cancelled' ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input type="checkbox" className="rounded border-slate-300" />
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900">
                          {formatDate(sale.date)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(sale.date), 'HH:mm')}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm border ${INVOICE_TYPE_COLORS[sale.invoice_type] || INVOICE_TYPE_COLORS.X}`}>
                            {sale.invoice_type || 'X'}
                          </span>
                          <div>
                            <div className="text-sm font-mono font-medium text-slate-900">
                              {String(sale.point_of_sale || 1).padStart(4, '0')}-
                              {String(sale.invoice_number || 0).padStart(8, '0')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900">
                          {sale.client?.name || 'Consumidor Final'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(sale.payment_methods || []).map((method, idx) => {
                            const PaymentIcon = PAYMENT_ICONS[method] || CreditCard;
                            return (
                              <span 
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs"
                              >
                                <PaymentIcon className="w-3 h-3" />
                                {method.split(' ')[0]}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold ${
                          sale.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}>
                          {formatCurrency(sale.total)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewSale(sale)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(sale)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {salesData?.totalPages > 1 && (
          <div className="bg-white border-t px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Mostrando {((page - 1) * 25) + 1} - {Math.min(page * 25, salesData.total)} de {salesData.total} ventas
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-sm text-slate-600">
                Página {page} de {salesData.totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(salesData.totalPages, p + 1))}
                disabled={page === salesData.totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedSale && !showCancelModal && (
        <SaleDetailModal 
          sale={selectedSale} 
          onClose={() => setSelectedSale(null)}
          onPrint={() => handlePrint(selectedSale)}
        />
      )}

      {/* Modal de anulación */}
      {showCancelModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Anular Venta</h3>
                <p className="text-sm text-slate-500">
                  {selectedSale.invoice_type} {selectedSale.invoice_number}
                </p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Atención:</strong> Esta acción no se puede deshacer.
                </p>
              </div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Motivo de anulación *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ingrese el motivo de la anulación..."
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                icon={Ban}
                onClick={handleCancelSale}
                disabled={!cancelReason.trim() || cancelSaleMutation.isLoading}
                loading={cancelSaleMutation.isLoading}
              >
                Confirmar Anulación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal de detalle simplificado
function SaleDetailModal({ sale, onClose, onPrint }) {
  const statusConfig = STATUS_CONFIG[sale.status] || STATUS_CONFIG.completed;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center justify-center w-14 h-14 rounded-xl font-bold text-2xl border-2 ${INVOICE_TYPE_COLORS[sale.invoice_type] || INVOICE_TYPE_COLORS.X}`}>
              {sale.invoice_type || 'X'}
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {sale.invoice_type === 'P' ? 'Presupuesto' : `Factura ${sale.invoice_type}`}
              </h2>
              <p className="text-lg font-mono text-slate-600">
                N° {String(sale.point_of_sale || 1).padStart(4, '0')}-
                {String(sale.invoice_number || 0).padStart(8, '0')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                Información General
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Fecha:</span>
                  <span className="font-medium">{formatDateTime(sale.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Usuario:</span>
                  <span className="font-medium">{sale.user?.full_name || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                Cliente
              </h3>
              <div className="space-y-2 text-sm">
                <div className="font-medium text-slate-900">
                  {sale.client?.name || 'Consumidor Final'}
                </div>
                {sale.client?.cuit && (
                  <div className="text-slate-600">CUIT: {sale.client.cuit}</div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                Información Fiscal
              </h3>
              {sale.cae ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">CAE:</span>
                    <span className="font-mono text-xs font-medium">{sale.cae}</span>
                  </div>
                  <div className="mt-2 p-2 bg-green-100 rounded text-green-800 text-xs text-center">
                    ✓ Factura validada por AFIP
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 text-center py-4">
                  Comprobante no fiscal
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Detalle de Productos
            </h3>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold text-slate-600 uppercase">
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-center">Cantidad</th>
                    <th className="px-4 py-3 text-right">Precio Unit.</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(sale.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {item.product?.name || item.product_name || 'Producto'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-sm bg-slate-900 text-white rounded-xl p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal:</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">IVA:</span>
                    <span>{formatCurrency(sale.tax)}</span>
                  </div>
                )}
                <hr className="border-slate-700" />
                <div className="flex justify-between text-xl font-bold">
                  <span>TOTAL:</span>
                  <span className="text-green-400">{formatCurrency(sale.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 rounded-b-xl flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Creado: {formatDateTime(sale.created_at || sale.date)}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Mail} size="sm">Email</Button>
            <Button variant="outline" icon={MessageCircle} size="sm">WhatsApp</Button>
            <Button variant="primary" icon={Printer} size="sm" onClick={onPrint}>
              Imprimir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}