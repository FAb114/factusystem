// src/pages/sales/SalesList.jsx - VERSIÓN CORREGIDA

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
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
import * as salesApi from '../../services/api/sales.api';

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
    startDate: '',
    endDate: '',
  });

  const [selectedSale, setSelectedSale] = useState(null);
  const [isOfflineMode] = useState(!isSupabaseConfigured());
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 CARGAR VENTAS AL MONTAR Y AL REFRESCAR
  const loadSales = async () => {
    console.log('🔄 [SalesList] Cargando ventas...');
    setLoading(true);
    
    try {
      const result = await salesApi.getSales(filters);
      
      if (result.success) {
        console.log('✅ [SalesList] Ventas cargadas:', result.data.sales.length);
        setSales(result.data.sales || []);
      } else {
        console.error('❌ [SalesList] Error:', result.error);
        toast.error('Error al cargar ventas');
      }
    } catch (error) {
      console.error('❌ [SalesList] Error crítico:', error);
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar
  useEffect(() => {
    loadSales();
  }, []);

  // 🔥 ESCUCHAR NUEVAS VENTAS OFFLINE
  useEffect(() => {
    const handleNewSale = (event) => {
      console.log('🎉 [SalesList] Nueva venta detectada:', event.detail);
      loadSales(); // Recargar lista
      toast.success('Nueva venta registrada');
    };

    window.addEventListener('offline-sale-created', handleNewSale);

    return () => {
      window.removeEventListener('offline-sale-created', handleNewSale);
    };
  }, []);

  // Filtrar ventas localmente
  const filteredSales = useMemo(() => {
    let filtered = [...sales];
    
    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.sale_number?.toLowerCase().includes(searchLower) ||
        s.invoice_number?.toString().includes(searchLower) ||
        s.client?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtro de tipo
    if (filters.invoiceType) {
      filtered = filtered.filter(s => s.invoice_type === filters.invoiceType);
    }
    
    // Filtro de estado
    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }
    
    // Filtro de fecha
    if (filters.startDate) {
      const filterStart = new Date(filters.startDate);
      filtered = filtered.filter(s => {
        const saleDate = new Date(s.date || s.created_at);
        return saleDate >= filterStart;
      });
    }
    
    if (filters.endDate) {
      const filterEnd = new Date(filters.endDate);
      filterEnd.setHours(23, 59, 59, 999);
      filtered = filtered.filter(s => {
        const saleDate = new Date(s.date || s.created_at);
        return saleDate <= filterEnd;
      });
    }
    
    return filtered;
  }, [sales, filters]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const byInvoiceType = {};
    filteredSales.forEach(sale => {
      const type = sale.invoice_type || 'X';
      if (!byInvoiceType[type]) {
        byInvoiceType[type] = { count: 0, total: 0 };
      }
      byInvoiceType[type].count++;
      byInvoiceType[type].total += parseFloat(sale.total) || 0;
    });

    return {
      totalSales,
      totalRevenue,
      averageTicket,
      byInvoiceType,
    };
  }, [filteredSales]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
  };

  const handleRefresh = () => {
    loadSales();
  };

  // 🔥 NUEVA FUNCIÓN: Imprimir factura
  const handlePrintInvoice = (sale) => {
    const printWindow = window.open('', '_blank');
    const invoiceHTML = generateInvoiceHTML(sale);
    
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    
    // Esperar a que cargue el contenido y luego imprimir
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // 🔥 NUEVA FUNCIÓN: Descargar como PDF
  const handleDownloadPDF = async (sale) => {
    try {
      // Importar jsPDF dinámicamente
      const { default: jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      // Obtener el contenido de la factura
      const invoiceElement = document.getElementById('invoice-content');
      
      if (!invoiceElement) {
        toast.error('Error al generar PDF');
        return;
      }

      // Mostrar toast de progreso
      toast.loading('Generando PDF...', { id: 'pdf-generation' });

      // Convertir a canvas
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Crear PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Guardar PDF
      const filename = `Factura_${sale.invoice_type}_${String(sale.point_of_sale).padStart(4, '0')}-${String(sale.invoice_number).padStart(8, '0')}.pdf`;
      pdf.save(filename);

      toast.success('PDF descargado correctamente', { id: 'pdf-generation' });
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar PDF', { id: 'pdf-generation' });
    }
  };

  // 🔥 NUEVA FUNCIÓN: Generar HTML de la factura para imprimir
  const generateInvoiceHTML = (sale) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Factura ${sale.invoice_type} ${String(sale.point_of_sale).padStart(4, '0')}-${String(sale.invoice_number).padStart(8, '0')}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
            }
            .invoice {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border: 1px solid #ddd;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 10px;
            }
            .header .invoice-type {
              font-size: 20px;
              font-weight: bold;
              margin: 10px 0;
            }
            .header .invoice-number {
              font-size: 16px;
              margin: 5px 0;
            }
            .header .date {
              font-size: 12px;
              color: #666;
            }
            .client-info {
              margin-bottom: 20px;
              font-size: 14px;
            }
            .client-info p {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            thead {
              background: #f5f5f5;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              font-weight: bold;
            }
            .text-center {
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .total-section {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #333;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .payment-methods {
              font-size: 12px;
            }
            .payment-methods p {
              margin: 3px 0;
            }
            .total-amount {
              font-size: 24px;
              font-weight: bold;
              text-align: right;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .cae-info {
              margin-top: 10px;
              font-size: 11px;
              background: #f9f9f9;
              padding: 10px;
              border-radius: 5px;
            }
            @media print {
              body {
                padding: 0;
              }
              .invoice {
                border: none;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>MI NEGOCIO</h1>
              <div class="invoice-type">FACTURA ${sale.invoice_type || 'X'}</div>
              <div class="invoice-number">
                N°: ${String(sale.point_of_sale || 1).padStart(4, '0')}-${String(sale.invoice_number).padStart(8, '0')}
              </div>
              <div class="date">${formatDateTime(sale.date || sale.created_at)}</div>
              ${sale.cae ? `
                <div class="cae-info">
                  <strong>CAE:</strong> ${sale.cae}<br>
                  <strong>Vto. CAE:</strong> ${formatDate(sale.cae_expiration)}
                </div>
              ` : ''}
            </div>

            <div class="client-info">
              <p><strong>Cliente:</strong> ${getClientName(sale)}</p>
              ${sale.client?.document_number ? `<p><strong>Documento:</strong> ${sale.client.document_number}</p>` : ''}
            </div>

            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-center">Cant.</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(sale.items || []).map(item => `
                  <tr>
                    <td>${item.product_name || item.name}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.unit_price || item.price)}</td>
                    <td class="text-right"><strong>${formatCurrency(item.total || (item.price * item.quantity))}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-section">
              <div class="payment-methods">
                ${sale.payments && sale.payments.length > 0 ? `
                  <p><strong>Formas de Pago:</strong></p>
                  ${sale.payments.map(p => `<p>${p.method}: ${formatCurrency(p.amount)}</p>`).join('')}
                ` : ''}
              </div>
              <div class="total-amount">
                TOTAL: ${formatCurrency(sale.total)}
              </div>
            </div>

            <div class="footer">
              <p>Gracias por su compra</p>
              <p style="margin-top: 10px;">FactuSystem - Sistema de Facturación</p>
            </div>
          </div>

          <script>
            // Auto-cerrar ventana después de imprimir
            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
      </html>
    `;
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
        {isOfflineMode && (
          <div className="mb-4 bg-orange-50 border-l-4 border-orange-400 p-3 rounded-r-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-bold text-orange-800">Modo Offline</p>
                <p className="text-xs text-orange-700">
                  Mostrando ventas guardadas localmente ({sales.length} ventas)
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>
            <p className="text-sm text-slate-500">
              {filteredSales.length} ventas encontradas
            </p>
          </div>
          
          <Button variant="outline" icon={RefreshCw} onClick={handleRefresh}>
            Actualizar
          </Button>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Ventas</p>
                <p className="text-3xl font-bold">{stats.totalSales}</p>
              </div>
              <Receipt className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Recaudación</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Ticket Promedio</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.averageTicket)}</p>
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
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <select
            value={filters.invoiceType}
            onChange={(e) => handleFilterChange('invoiceType', e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos los tipos</option>
            <option value="A">Factura A</option>
            <option value="B">Factura B</option>
            <option value="C">Factura C</option>
            <option value="X">Factura X</option>
            <option value="P">Presupuesto</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSales.length === 0 ? (
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
              {filteredSales.map((sale) => (
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
            {/* Header con botones de acción */}
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold">Detalle de Venta</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintInvoice(selectedSale)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownloadPDF(selectedSale)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar PDF
                </Button>
                <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-slate-200 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido de la factura */}
            <div className="flex-1 overflow-y-auto p-8">
              <div id="invoice-content" className="bg-white shadow-lg p-8 rounded-lg">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">MI NEGOCIO</h1>
                  <div className="py-2 border-y">
                    <p className="font-bold text-lg">FACTURA {selectedSale.invoice_type || 'X'}</p>
                    <p className="text-sm">
                      N°: {String(selectedSale.point_of_sale || 1).padStart(4, '0')}-{String(selectedSale.invoice_number).padStart(8, '0')}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(selectedSale.date || selectedSale.created_at)}</p>
                    {selectedSale.cae && (
                      <div className="mt-2 text-xs">
                        <p><strong>CAE:</strong> {selectedSale.cae}</p>
                        <p><strong>Vto. CAE:</strong> {formatDate(selectedSale.cae_expiration)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4 text-sm">
                  <p><strong>Cliente:</strong> {getClientName(selectedSale)}</p>
                  {selectedSale.client?.document_number && (
                    <p><strong>Documento:</strong> {selectedSale.client.document_number}</p>
                  )}
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

                <div className="border-t-2 pt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      {selectedSale.payments && selectedSale.payments.length > 0 && (
                        <div>
                          <p className="font-bold mb-1">Formas de Pago:</p>
                          {selectedSale.payments.map((p, i) => (
                            <p key={i} className="text-xs">
                              {p.method}: {formatCurrency(p.amount)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">TOTAL: {formatCurrency(selectedSale.total)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-xs text-gray-500">
                  <p>Gracias por su compra</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}