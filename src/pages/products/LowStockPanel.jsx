// src/pages/products/LowStockPanel.jsx

import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Download,
  Send,
  Package,
  TrendingDown,
  FileText,
  Mail,
  MessageCircle,
  Building2,
  CheckCircle,
  Clock,
  Filter,
  Printer,
  RefreshCw,
  ShoppingCart,
  ArrowRight,
  Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import { useCurrentUser, useCurrentBranch } from '../../store/slices/authSlice';
import * as advancedApi from '../../services/api/products.api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function LowStockPanel() {
  const user = useCurrentUser();
  const currentBranch = useCurrentBranch();

  // Estados
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    supplier: '',
    category: '',
    minCritical: 0,
  });

  useEffect(() => {
    loadLowStockProducts();
  }, [currentBranch]);

  const loadLowStockProducts = async () => {
    setLoading(true);
    const result = await advancedApi.getLowStockProducts(currentBranch?.id);
    if (result.success) {
      setLowStockProducts(result.data);
      console.log('📦 Productos con stock bajo:', result.data);
    } else {
      toast.error('Error cargando productos con stock bajo');
    }
    setLoading(false);
  };

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    return lowStockProducts.filter(product => {
      if (filters.supplier && product.supplier_name !== filters.supplier) {
        return false;
      }
      if (filters.category && product.category_name !== filters.category) {
        return false;
      }
      if (filters.minCritical && product.needed_quantity < filters.minCritical) {
        return false;
      }
      return true;
    });
  }, [lowStockProducts, filters]);

  // Agrupar por proveedor
  const productsBySupplier = useMemo(() => {
    const grouped = {};
    
    filteredProducts.forEach(product => {
      const supplier = product.supplier_name || 'Sin Proveedor';
      
      if (!grouped[supplier]) {
        grouped[supplier] = {
          name: supplier,
          email: product.supplier_email,
          phone: product.supplier_phone,
          products: [],
          totalNeeded: 0,
          totalValue: 0,
        };
      }
      
      grouped[supplier].products.push(product);
      grouped[supplier].totalNeeded += product.needed_quantity;
    });

    return Object.values(grouped);
  }, [filteredProducts]);

  // Estadísticas
  const stats = useMemo(() => {
    return {
      totalProducts: filteredProducts.length,
      criticalProducts: filteredProducts.filter(p => p.current_stock === 0).length,
      totalNeeded: filteredProducts.reduce((sum, p) => sum + p.needed_quantity, 0),
      suppliers: new Set(filteredProducts.map(p => p.supplier_name).filter(Boolean)).size,
    };
  }, [filteredProducts]);

  // ========================================
  // GENERAR PDF DE ORDEN DE PEDIDO
  // ========================================
  const generatePurchaseOrderPDF = (supplierData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('ORDEN DE PEDIDO', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 14, 30);
    doc.text(`Sucursal: ${currentBranch?.name || 'N/A'}`, 14, 36);
    
    // Datos del proveedor
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('PROVEEDOR', 14, 48);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nombre: ${supplierData.name}`, 14, 54);
    if (supplierData.email) {
      doc.text(`Email: ${supplierData.email}`, 14, 60);
    }
    if (supplierData.phone) {
      doc.text(`Teléfono: ${supplierData.phone}`, 14, 66);
    }
    
    // Tabla de productos
    const tableData = supplierData.products.map(p => [
      p.code || '-',
      p.name,
      formatNumber(p.current_stock),
      formatNumber(p.min_stock),
      formatNumber(p.needed_quantity),
      p.barcode || '-',
    ]);
    
    doc.autoTable({
      startY: 75,
      head: [['Código', 'Producto', 'Stock Actual', 'Stock Mín', 'Cantidad Pedido', 'Código Barras']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 30 },
      },
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL PRODUCTOS: ${supplierData.products.length}`, 14, finalY);
    doc.text(`CANTIDAD TOTAL SOLICITADA: ${supplierData.totalNeeded}`, 14, finalY + 6);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.text('Esta orden fue generada automáticamente por FactuSystem', pageWidth / 2, finalY + 20, { align: 'center' });
    doc.text(`Usuario: ${user?.fullName || 'N/A'} | Fecha: ${formatDateTime(new Date())}`, pageWidth / 2, finalY + 25, { align: 'center' });
    
    // Guardar
    const fileName = `Orden_Pedido_${supplierData.name.replace(/\s/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    toast.success(`Orden de pedido descargada: ${fileName}`);
  };

  // ========================================
  // ENVIAR ORDEN POR EMAIL/WHATSAPP
  // ========================================
  const handleSendOrderByEmail = async (supplierData) => {
    if (!supplierData.email) {
      toast.error('Este proveedor no tiene email registrado');
      return;
    }

    // TODO: Implementar envío real de email con el PDF adjunto
    toast.success(`Email enviado a ${supplierData.email} (Función en desarrollo)`);
  };

  const handleSendOrderByWhatsApp = (supplierData) => {
    if (!supplierData.phone) {
      toast.error('Este proveedor no tiene teléfono registrado');
      return;
    }

    // Generar mensaje
    const message = `
*ORDEN DE PEDIDO - ${currentBranch?.name}*

Hola! Les solicitamos los siguientes productos:

${supplierData.products.map(p => 
  `• ${p.name}: *${p.needed_quantity} unidades*`
).join('\n')}

*Total productos:* ${supplierData.products.length}
*Cantidad total:* ${supplierData.totalNeeded}

Generado: ${new Date().toLocaleDateString('es-AR')}
    `.trim();

    const phone = supplierData.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp abierto con la orden');
  };

  // ========================================
  // SOLICITAR A SUCURSAL MATRIZ
  // ========================================
  const handleRequestFromMainBranch = async () => {
    if (!selectedProducts.length) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    const mainBranch = user?.branches?.find(b => b.is_principal);
    
    if (!mainBranch) {
      toast.error('No se encontró la sucursal matriz');
      return;
    }

    if (currentBranch?.is_principal) {
      toast.error('Ya estás en la sucursal matriz');
      return;
    }

    const transferData = {
      fromBranchId: mainBranch.id,
      toBranchId: currentBranch.id,
      requestedBy: user.id,
      notes: `Solicitud automática por stock bajo - Generado: ${formatDateTime(new Date())}`,
      items: selectedProducts.map(productId => {
        const product = filteredProducts.find(p => p.id === productId);
        return {
          productId: product.id,
          quantity: product.needed_quantity,
          notes: `Stock actual: ${product.current_stock} | Mínimo: ${product.min_stock}`,
        };
      }),
    };

    const result = await advancedApi.createTransferRequest(transferData);

    if (result.success) {
      toast.success('✅ Solicitud enviada a la sucursal matriz');
      
      // Mostrar notificación adicional
      toast(
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-bold">Notificación enviada</p>
            <p className="text-sm">La sucursal matriz recibirá una alerta en tiempo real</p>
          </div>
        </div>,
        { duration: 5000 }
      );

      setSelectedProducts([]);
      setTransferModalOpen(false);
    } else {
      toast.error(result.error || 'Error al crear solicitud');
    }
  };

  // ========================================
  // CREAR ORDEN DE COMPRA FORMAL
  // ========================================
  const handleCreatePurchaseOrder = async (supplierData) => {
    const orderData = {
      supplierId: supplierData.products[0]?.supplier_id,
      branchId: currentBranch?.id,
      createdBy: user?.id,
      notes: `Orden generada automáticamente por stock bajo`,
      items: supplierData.products.map(p => ({
        productId: p.id,
        quantity: p.needed_quantity,
        unitCost: 0, // TODO: Obtener costo real del producto
      })),
      total: 0,
    };

    const result = await advancedApi.createPurchaseOrder(orderData);

    if (result.success) {
      toast.success('Orden de compra creada exitosamente');
      // TODO: Navegar a la orden creada
    } else {
      toast.error('Error al crear orden de compra');
    }
  };

  // ========================================
  // HANDLERS
  // ========================================
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

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Stock Bajo</h1>
              <p className="text-sm text-slate-500">
                {filteredProducts.length} productos requieren reposición
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={loadLowStockProducts}
              size="sm"
            >
              Actualizar
            </Button>
            
            {!currentBranch?.is_principal && (
              <Button
                variant="primary"
                icon={Send}
                onClick={() => setTransferModalOpen(true)}
                disabled={selectedProducts.length === 0}
              >
                Solicitar a Matriz ({selectedProducts.length})
              </Button>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <p className="text-sm opacity-90 mb-1">Productos Afectados</p>
            <p className="text-3xl font-bold">{stats.totalProducts}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
            <p className="text-sm opacity-90 mb-1">Críticos (Sin Stock)</p>
            <p className="text-3xl font-bold">{stats.criticalProducts}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <p className="text-sm opacity-90 mb-1">Cantidad Necesaria</p>
            <p className="text-3xl font-bold">{stats.totalNeeded}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <p className="text-sm opacity-90 mb-1">Proveedores</p>
            <p className="text-3xl font-bold">{stats.suppliers}</p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <CheckCircle className="w-16 h-16 mb-4 text-green-500" />
            <p className="text-lg font-medium">¡Todo en orden!</p>
            <p className="text-sm mt-2">No hay productos con stock bajo</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vista agrupada por proveedor */}
            {productsBySupplier.map((supplier, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header del proveedor */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        {supplier.name}
                      </h3>
                      <div className="flex gap-4 mt-1 text-sm text-slate-600">
                        {supplier.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {supplier.email}
                          </span>
                        )}
                        {supplier.phone && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {supplier.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        icon={Printer}
                        onClick={() => generatePurchaseOrderPDF(supplier)}
                        size="sm"
                      >
                        Descargar PDF
                      </Button>
                      
                      {supplier.email && (
                        <Button
                          variant="outline"
                          icon={Mail}
                          onClick={() => handleSendOrderByEmail(supplier)}
                          size="sm"
                        >
                          Email
                        </Button>
                      )}
                      
                      {supplier.phone && (
                        <Button
                          variant="success"
                          icon={MessageCircle}
                          onClick={() => handleSendOrderByWhatsApp(supplier)}
                          size="sm"
                        >
                          WhatsApp
                        </Button>
                      )}

                      <Button
                        variant="primary"
                        icon={ShoppingCart}
                        onClick={() => handleCreatePurchaseOrder(supplier)}
                        size="sm"
                      >
                        Crear Orden
                      </Button>
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className="mt-3 flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">{supplier.products.length}</span>
                      <span className="text-slate-600">productos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">{supplier.totalNeeded}</span>
                      <span className="text-slate-600">unidades necesarias</span>
                    </div>
                  </div>
                </div>

                {/* Tabla de productos */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-left text-xs font-semibold text-slate-600 uppercase">
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            onChange={() => {
                              const allIds = supplier.products.map(p => p.id);
                              const allSelected = allIds.every(id => selectedProducts.includes(id));
                              if (allSelected) {
                                setSelectedProducts(prev => prev.filter(id => !allIds.includes(id)));
                              } else {
                                setSelectedProducts(prev => [...new Set([...prev, ...allIds])]);
                              }
                            }}
                            checked={supplier.products.every(p => selectedProducts.includes(p.id))}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="px-4 py-3">Código</th>
                        <th className="px-4 py-3">Producto</th>
                        <th className="px-4 py-3 text-center">Stock Actual</th>
                        <th className="px-4 py-3 text-center">Stock Mínimo</th>
                        <th className="px-4 py-3 text-center">Necesario</th>
                        <th className="px-4 py-3">Categoría</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplier.products.map((product) => (
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
                            <span className="font-mono text-sm">{product.code}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{product.name}</p>
                            {product.barcode && (
                              <p className="text-xs text-slate-500 font-mono">{product.barcode}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${
                              product.current_stock === 0 ? 'text-red-600' : 'text-orange-600'
                            }`}>
                              {formatNumber(product.current_stock)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-slate-600">
                              {formatNumber(product.min_stock)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-blue-600 text-lg">
                              {formatNumber(product.needed_quantity)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-600">
                              {product.category_name || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Solicitud a Sucursal Matriz */}
      {transferModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Solicitar a Sucursal Matriz
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedProducts.length} productos seleccionados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 mb-1">
                      Notificación en Tiempo Real
                    </p>
                    <p className="text-sm text-blue-700">
                      La sucursal matriz recibirá una alerta instantánea con esta solicitud.
                      Ellos podrán aprobar y enviar los productos desde su panel de gestión.
                    </p>
                  </div>
                </div>
              </div>

              {/* Listado de productos seleccionados */}
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-left text-xs font-semibold text-slate-600 uppercase">
                      <th className="px-4 py-2">Producto</th>
                      <th className="px-4 py-2 text-center">Necesario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProducts.map(productId => {
                      const product = filteredProducts.find(p => p.id === productId);
                      return (
                        <tr key={productId} className="text-sm">
                          <td className="px-4 py-2">
                            <p className="font-medium">{product?.name}</p>
                            <p className="text-xs text-slate-500">{product?.code}</p>
                          </td>
                          <td className="px-4 py-2 text-center font-bold text-blue-600">
                            {product?.needed_quantity}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setTransferModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                icon={Send}
                onClick={handleRequestFromMainBranch}
              >
                Enviar Solicitud
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}