import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  CreditCard,
  Smartphone,
  Printer,
  Mail,
  MessageCircle,
  User,
  Package,
  X,
  Check,
  Barcode,
  FileText,
  Zap,
} from 'lucide-react';

// Tipos de factura
const INVOICE_TYPES = {
  X: { code: 'X', name: 'Factura X', color: 'bg-blue-600' },
  A: { code: 'A', name: 'Factura A', color: 'bg-green-600' },
  B: { code: 'B', name: 'Factura B', color: 'bg-yellow-600' },
  C: { code: 'C', name: 'Factura C', color: 'bg-purple-600' },
  PRESUPUESTO: { code: 'P', name: 'Presupuesto', color: 'bg-gray-600' },
};

// Métodos de pago
const PAYMENT_METHODS = {
  EFECTIVO: { code: 'efectivo', name: 'Efectivo', icon: DollarSign, color: 'bg-green-500' },
  TARJETA: { code: 'tarjeta', name: 'Tarjeta', icon: CreditCard, color: 'bg-blue-500' },
  TRANSFERENCIA: { code: 'transferencia', name: 'Transferencia', icon: Smartphone, color: 'bg-purple-500' },
  QR: { code: 'qr', name: 'QR / Mercado Pago', icon: Smartphone, color: 'bg-cyan-500' },
};

function Billing() {
  // Estados principales
  const [client, setClient] = useState({
    name: 'Consumidor Final',
    type: 'consumidor_final',
    cuit: '',
    address: '',
    phone: '',
    email: '',
    ivaCondition: 'consumidor_final',
  });
  
  const [invoiceType, setInvoiceType] = useState('X');
  const [invoiceCounters, setInvoiceCounters] = useState({
    X: 1,
    A: 1,
    B: 1,
    C: 1,
    PRESUPUESTO: 1,
  });
  
  const [items, setItems] = useState([]);
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    price: '',
    quantity: '1',
    modifier: '',
  });
  
  const [payments, setPayments] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCardTypeModal, setShowCardTypeModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAfipModal, setShowAfipModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [cardType, setCardType] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Referencias para los inputs
  const clientInputRef = useRef(null);
  const productNameRef = useRef(null);
  const productPriceRef = useRef(null);
  const productQuantityRef = useRef(null);
  const productModifierRef = useRef(null);
  const productSearchRef = useRef(null);
  const cashReceivedRef = useRef(null);
  const paymentAmountRef = useRef(null);

  // Productos de ejemplo (simulando base de datos)
  const mockProducts = [
    { id: 1, name: 'Coca Cola 2.25L', price: 1500, barcode: '7790001234567', stock: 50, iva: 21 },
    { id: 2, name: 'Pan Lactal Bimbo', price: 800, barcode: '7790001234568', stock: 30, iva: 21 },
    { id: 3, name: 'Leche La Serenísima 1L', price: 650, barcode: '7790001234569', stock: 40, iva: 21 },
    { id: 4, name: 'Arroz Gallo Oro 1kg', price: 1200, barcode: '7790001234570', stock: 25, iva: 21 },
    { id: 5, name: 'Aceite Girasol Cocinero 900ml', price: 2300, barcode: '7790001234571', stock: 15, iva: 21 },
    { id: 6, name: 'Azúcar Ledesma 1kg', price: 950, barcode: '7790001234572', stock: 60, iva: 21 },
    { id: 7, name: 'Yerba Playadito 1kg', price: 1800, barcode: '7790001234573', stock: 35, iva: 21 },
    { id: 8, name: 'Fideos Matarazzo 500g', price: 750, barcode: '7790001234574', stock: 45, iva: 21 },
  ];

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Filtrar productos en modal
  useEffect(() => {
    if (productSearchQuery.length >= 2) {
      const results = mockProducts.filter(p => 
        p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        p.barcode.includes(productSearchQuery)
      );
      setFilteredProducts(results);
    } else {
      setFilteredProducts(mockProducts);
    }
  }, [productSearchQuery]);

  // Focus inicial
  useEffect(() => {
    clientInputRef.current?.focus();
  }, []);

  // Manejar Enter en cliente (F2 para modal)
  const handleClientKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!client.name || client.name === 'Consumidor Final') {
        setClient({
          name: 'Consumidor Final',
          type: 'consumidor_final',
          cuit: '',
          address: '',
          phone: '',
          email: '',
          ivaCondition: 'consumidor_final',
        });
      }
      productNameRef.current?.focus();
    } else if (e.key === 'F2') {
      e.preventDefault();
      setShowClientModal(true);
    }
  };

  // Manejar Enter en nombre de producto (F3 para modal)
  const handleProductNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Buscar producto existente
      const foundProduct = mockProducts.find(p => 
        p.name.toLowerCase() === currentProduct.name.toLowerCase() ||
        p.barcode === currentProduct.name
      );
      
      if (foundProduct) {
        setCurrentProduct(prev => ({
          ...prev,
          price: foundProduct.price.toString(),
        }));
      }
      
      productPriceRef.current?.focus();
    } else if (e.key === 'F3') {
      e.preventDefault();
      setProductSearchQuery('');
      setFilteredProducts(mockProducts);
      setShowProductModal(true);
    }
  };

  // Manejar Enter en precio
  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      productQuantityRef.current?.focus();
    }
  };

  // Manejar Enter en cantidad
  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      productModifierRef.current?.focus();
    }
  };

  // Manejar Enter en modificador
  const handleModifierKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProductToList();
    }
  };

  // Agregar producto a la lista
  const addProductToList = () => {
    if (!currentProduct.name || !currentProduct.price) return;

    let finalPrice = parseFloat(currentProduct.price);
    const modifier = currentProduct.modifier.trim();

    // Calcular modificador
    if (modifier) {
      if (modifier.includes('%')) {
        const percent = parseFloat(modifier.replace('%', '').replace('+', '').replace('-', ''));
        if (modifier.startsWith('+')) {
          finalPrice = finalPrice * (1 + percent / 100);
        } else if (modifier.startsWith('-')) {
          finalPrice = finalPrice * (1 - percent / 100);
        }
      } else if (modifier.includes('$')) {
        const amount = parseFloat(modifier.replace('$', '').replace('+', '').replace('-', ''));
        if (modifier.startsWith('+')) {
          finalPrice += amount;
        } else if (modifier.startsWith('-')) {
          finalPrice -= amount;
        }
      } else {
        // Solo número, asumir porcentaje
        const value = parseFloat(modifier.replace('+', '').replace('-', ''));
        if (modifier.startsWith('+')) {
          finalPrice = finalPrice * (1 + value / 100);
        } else if (modifier.startsWith('-')) {
          finalPrice = finalPrice * (1 - value / 100);
        }
      }
    }

    const quantity = parseFloat(currentProduct.quantity) || 1;
    const subtotal = finalPrice * quantity;

    const newItem = {
      id: Date.now(),
      name: currentProduct.name,
      price: finalPrice,
      originalPrice: parseFloat(currentProduct.price),
      quantity: quantity,
      modifier: currentProduct.modifier,
      subtotal: subtotal,
      iva: 21,
    };

    setItems([...items, newItem]);
    
    // Limpiar formulario
    setCurrentProduct({ name: '', price: '', quantity: '1', modifier: '' });
    productNameRef.current?.focus();
  };

  // Seleccionar producto del modal
  const selectProduct = (product) => {
    setCurrentProduct({
      name: product.name,
      price: product.price.toString(),
      quantity: '1',
      modifier: '',
    });
    setShowProductModal(false);
    productPriceRef.current?.focus();
  };

  // Remover item
  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Abrir modal de edición de item
  const openEditItemModal = (item) => {
    setEditingItem({
      ...item,
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      modifier: item.modifier || '',
    });
    setShowEditItemModal(true);
  };

  // Guardar cambios en item
  const saveItemChanges = () => {
    if (!editingItem) return;

    let finalPrice = parseFloat(editingItem.price);
    const modifier = editingItem.modifier.trim();

    // Calcular modificador
    if (modifier) {
      if (modifier.includes('%')) {
        const percent = parseFloat(modifier.replace('%', '').replace('+', '').replace('-', ''));
        if (modifier.startsWith('+')) {
          finalPrice = finalPrice * (1 + percent / 100);
        } else if (modifier.startsWith('-')) {
          finalPrice = finalPrice * (1 - percent / 100);
        }
      } else if (modifier.includes('

  // Calcular totales
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    let iva = 0;
    let neto = subtotal;
    let total = subtotal;

    // Si es Factura A, discriminar IVA (el precio ya incluye IVA)
    if (invoiceType === 'A') {
      neto = subtotal / 1.21;
      iva = subtotal - neto;
      total = subtotal;
    }

    return { subtotal, neto, iva, total };
  };

  const totals = calculateTotals();

  // Abrir modal de pago según método
  const openPaymentModal = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentAmount(totals.total.toFixed(2));
    
    if (method === 'tarjeta') {
      setShowCardTypeModal(true);
    } else if (method === 'efectivo') {
      setCashReceived('');
      setShowPaymentModal(true);
      setTimeout(() => cashReceivedRef.current?.focus(), 100);
    } else {
      setShowPaymentModal(true);
      setTimeout(() => paymentAmountRef.current?.focus(), 100);
    }
  };

  // Confirmar tipo de tarjeta
  const confirmCardType = (type) => {
    setCardType(type);
    setShowCardTypeModal(false);
    setShowPaymentModal(true);
    setTimeout(() => paymentAmountRef.current?.focus(), 100);
  };

  // Agregar pago
  const addPayment = () => {
    if (!selectedPaymentMethod) return;

    let amount = 0;
    
    if (selectedPaymentMethod === 'efectivo') {
      if (!cashReceived) return;
      amount = parseFloat(paymentAmount);
    } else {
      if (!paymentAmount) return;
      amount = parseFloat(paymentAmount);
    }

    const newPayment = {
      id: editingPayment ? editingPayment.id : Date.now(),
      method: selectedPaymentMethod,
      cardType: cardType,
      amount: amount,
      received: selectedPaymentMethod === 'efectivo' ? parseFloat(cashReceived) : amount,
    };

    if (editingPayment) {
      // Editar pago existente
      setPayments(payments.map(p => p.id === editingPayment.id ? newPayment : p));
    } else {
      // Agregar nuevo pago
      setPayments([...payments, newPayment]);
    }
    
    // Cambiar a Factura C si no es efectivo y está en X
    if (selectedPaymentMethod !== 'efectivo' && invoiceType === 'X') {
      setInvoiceType('C');
    }

    // Cerrar modales
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setPaymentAmount('');
    setCashReceived('');
    setCardType('');
    setEditingPayment(null);
  };

  // Editar pago
  const editPayment = (payment) => {
    setEditingPayment(payment);
    setSelectedPaymentMethod(payment.method);
    setPaymentAmount(payment.amount.toString());
    setCardType(payment.cardType || '');
    
    if (payment.method === 'efectivo') {
      setCashReceived(payment.received.toString());
    }

    if (payment.method === 'tarjeta') {
      setShowCardTypeModal(false);
      setShowPaymentModal(true);
    } else {
      setShowPaymentModal(true);
    }

    setTimeout(() => {
      if (payment.method === 'efectivo') {
        cashReceivedRef.current?.focus();
      } else {
        paymentAmountRef.current?.focus();
      }
    }, 100);
  };

  // Eliminar pago
  const removePayment = (id) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  // Calcular cambio
  const calculateChange = () => {
    const totalPaid = parseFloat(cashReceived) || 0;
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  // Verificar si puede facturar con AFIP
  const canInvoiceAfip = () => {
    const hasNonCashPayment = payments.some(p => p.method !== 'efectivo');
    return hasNonCashPayment && ['A', 'B', 'C'].includes(invoiceType);
  };

  // Facturar con AFIP
  const invoiceWithAfip = () => {
    setShowAfipModal(true);
    
    setTimeout(() => {
      setShowAfipModal(false);
      completeSale();
    }, 3000);
  };

  // Completar venta
  const completeSale = () => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid < totals.total) {
      alert('El monto pagado es menor al total de la venta');
      return;
    }

    console.log('Venta completada:', {
      client,
      invoiceType,
      invoiceNumber: invoiceCounters[invoiceType],
      items,
      totals,
      payments,
    });

    setShowPrintModal(true);
  };

  // Imprimir y resetear
  const handlePrint = (type) => {
    console.log('Imprimiendo:', type);
    
    // Incrementar contador
    setInvoiceCounters(prev => ({
      ...prev,
      [invoiceType]: prev[invoiceType] + 1,
    }));
    
    // Resetear todo
    setItems([]);
    setPayments([]);
    setClient({
      name: 'Consumidor Final',
      type: 'consumidor_final',
      cuit: '',
      address: '',
      phone: '',
      email: '',
      ivaCondition: 'consumidor_final',
    });
    setInvoiceType('X');
    setCurrentProduct({ name: '', price: '', quantity: '1', modifier: '' });
    setShowPrintModal(false);
    
    clientInputRef.current?.focus();
  };

  // Obtener cambio total
  const getTotalChange = () => {
    const totalPaid = payments.reduce((sum, p) => sum + (p.received || p.amount), 0);
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Facturador</h1>
              <p className="text-sm opacity-90">
                {INVOICE_TYPES[invoiceType].name} Nº {String(invoiceCounters[invoiceType]).padStart(8, '0')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Object.entries(INVOICE_TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setInvoiceType(key)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  invoiceType === key
                    ? 'bg-white text-blue-700 shadow-lg scale-105'
                    : 'bg-blue-500 hover:bg-blue-400 text-white'
                }`}
              >
                {type.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel Principal */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Cliente y Producto */}
          <div className="border-b border-gray-300 p-4 space-y-3 bg-gray-50">
            {/* Cliente */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Cliente (Enter: Consumidor Final | F2: Datos completos)
                </label>
                <input
                  ref={clientInputRef}
                  type="text"
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  onKeyDown={handleClientKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none font-medium"
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>

            {/* Producto */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Producto / Código de Barras (F3: Buscar)
                </label>
                <input
                  ref={productNameRef}
                  type="text"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  onKeyDown={handleProductNameKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre o escanee código"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Precio $</label>
                <input
                  ref={productPriceRef}
                  type="number"
                  value={currentProduct.price}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                  onKeyDown={handlePriceKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-right font-bold"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cantidad</label>
                <input
                  ref={productQuantityRef}
                  type="number"
                  value={currentProduct.quantity}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: e.target.value })}
                  onKeyDown={handleQuantityKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center font-bold"
                  placeholder="1"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Ajuste ±%/$
                </label>
                <input
                  ref={productModifierRef}
                  type="text"
                  value={currentProduct.modifier}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, modifier: e.target.value })}
                  onKeyDown={handleModifierKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center"
                  placeholder="+10% -$20"
                />
              </div>

              <div className="col-span-1 flex items-end">
                <button
                  onClick={addProductToList}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition flex items-center justify-center shadow"
                  title="Agregar producto (Enter)"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase w-12">#</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-24">Cant.</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">Precio</th>
                  {invoiceType === 'A' && (
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">IVA</th>
                  )}
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-40">Subtotal</th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={invoiceType === 'A' ? 7 : 6} className="text-center py-20">
                      <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-400 font-medium">No hay productos agregados</p>
                      <p className="text-gray-400 text-sm">Escanee o busque productos para comenzar</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const itemNeto = invoiceType === 'A' ? item.subtotal / 1.21 : item.subtotal;
                    const itemIva = invoiceType === 'A' ? item.subtotal - itemNeto : 0;
                    
                    return (
                      <tr 
                        key={item.id} 
                        className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition"
                        onDoubleClick={() => openEditItemModal(item)}
                        title="Doble click para editar"
                      >
                        <td className="px-4 py-3 text-sm font-bold text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.modifier && (
                            <p className="text-xs text-blue-600">Ajuste: {item.modifier}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{item.quantity.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        {invoiceType === 'A' && (
                          <td className="px-4 py-3 text-right text-sm text-green-700 font-medium">
                            {formatCurrency(itemIva)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-bold text-lg text-blue-700">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Derecho - Totales y Pagos */}
        <div className="w-96 bg-white border-l-4 border-blue-600 flex flex-col shadow-xl">
          {/* Totales */}
          <div className="p-4 border-b-2 border-gray-300 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Totales</h3>
            
            {invoiceType === 'A' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Neto:</span>
                  <span className="font-bold">{formatCurrency(totals.neto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA 21%:</span>
                  <span className="font-bold text-green-600">{formatCurrency(totals.iva)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                  <span className="text-3xl font-bold text-blue-700">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                <span className="text-4xl font-bold text-blue-700">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            )}
          </div>

          {/* Métodos de Pago */}
          <div className="p-4 border-b-2 border-gray-300">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Formas de Pago</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                <button
                  key={key}
                  onClick={() => openPaymentModal(method.code)}
                  disabled={items.length === 0}
                  className={`${method.color} hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-lg transition shadow-md flex flex-col items-center gap-2`}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pagos Registrados */}
          {payments.length > 0 && (
            <div className="p-4 border-b-2 border-gray-300 max-h-40 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Pagos:</h3>
              <div className="space-y-1">
                {payments.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200 hover:bg-green-100 cursor-pointer transition group"
                    onDoubleClick={() => editPayment(payment)}
                    title="Doble click para editar"
                  >
                    <span className="text-sm font-medium capitalize">
                      {payment.method} {payment.cardType && `(${payment.cardType})`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-700">{formatCurrency(payment.amount)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePayment(payment.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón AFIP */}
          {canInvoiceAfip() && (
            <div className="p-4">
              <button
                onClick={invoiceWithAfip}
                disabled={items.length === 0 || payments.length === 0}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Facturar con AFIP
              </button>
            </div>
          )}

          {/* Botón Completar Venta */}
          <div className="mt-auto p-4">
            <button
              onClick={completeSale}
              disabled={items.length === 0 || payments.length === 0}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6" />
              COMPLETAR VENTA
            </button>
            {getTotalChange() > 0 && (
              <div className="mt-2 p-2 bg-yellow-100 border-2 border-yellow-400 rounded text-center">
                <p className="text-xs font-bold text-yellow-800">VUELTO</p>
                <p className="text-lg font-bold text-yellow-900">{formatCurrency(getTotalChange())}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Datos del Cliente</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="Juan Pérez / Empresa SA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">DNI / CUIT</label>
                  <input
                    type="text"
                    value={client.cuit}
                    onChange={(e) => setClient({ ...client, cuit: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Av. Siempreviva 742"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={client.phone}
                    onChange={(e) => setClient({ ...client, phone: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="11-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Condición frente al IVA</label>
                <select
                  value={client.ivaCondition}
                  onChange={(e) => setClient({ ...client, ivaCondition: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="consumidor_final">Consumidor Final</option>
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="monotributo">Monotributo</option>
                  <option value="exento">Exento</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow"
                >
                  Guardar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Productos */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Buscar Producto</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-300">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  placeholder="Buscar por nombre o código de barras..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg group-hover:text-blue-700">{product.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Código: {product.barcode}</span>
                          <span className={`${product.stock > 10 ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No se encontraron productos</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-300">
              <button
                onClick={() => setShowProductModal(false)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tipo de Tarjeta */}
      {showCardTypeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold">Tipo de Tarjeta</h3>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => confirmCardType('Débito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Débito</p>
                <p className="text-sm text-gray-600">Cobro inmediato</p>
              </button>
              <button
                onClick={() => confirmCardType('Crédito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Crédito</p>
                <p className="text-sm text-gray-600">Pago diferido</p>
              </button>
              <button
                onClick={() => setShowCardTypeModal(false)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className={`${PAYMENT_METHODS[selectedPaymentMethod.toUpperCase()]?.color || 'bg-blue-600'} text-white px-6 py-4 rounded-t-xl flex items-center justify-between`}>
              <h3 className="text-xl font-bold capitalize">
                {editingPayment ? 'Editar' : 'Pago con'} {selectedPaymentMethod} {cardType && `- ${cardType}`}
              </h3>
              {editingPayment && (
                <span className="text-sm bg-white/20 px-2 py-1 rounded">Editando</span>
              )}
            </div>
            <div className="p-6 space-y-4">
              {selectedPaymentMethod === 'efectivo' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total a pagar</label>
                    <div className="text-4xl font-bold text-center text-blue-700 p-4 bg-blue-50 rounded-lg">
                      {formatCurrency(totals.total)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Efectivo recibido</label>
                    <input
                      ref={cashReceivedRef}
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  {cashReceived && parseFloat(cashReceived) >= totals.total && (
                    <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg">
                      <p className="text-sm font-bold text-green-800 text-center">VUELTO</p>
                      <p className="text-3xl font-bold text-green-900 text-center">
                        {formatCurrency(calculateChange())}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monto a cobrar</label>
                  <input
                    ref={paymentAmountRef}
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-blue-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMethod(null);
                    setCashReceived('');
                    setCardType('');
                    setEditingPayment(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={addPayment}
                  disabled={
                    (selectedPaymentMethod === 'efectivo' && (!cashReceived || parseFloat(cashReceived) < totals.total)) ||
                    (selectedPaymentMethod !== 'efectivo' && !paymentAmount)
                  }
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold transition shadow"
                >
                  {editingPayment ? 'Guardar Cambios' : 'Confirmar Pago'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Item */}
      {showEditItemModal && editingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h3 className="text-xl font-bold">Editar Producto</h3>
              <button
                onClick={() => {
                  setShowEditItemModal(false);
                  setEditingItem(null);
                }}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Producto</label>
                <input
                  type="text"
                  value={editingItem.name}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 font-medium text-gray-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Precio Unitario</label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-right font-bold text-lg"
                    step="0.01"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cantidad</label>
                  <input
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center font-bold text-lg"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ajuste ±%/$</label>
                  <input
                    type="text"
                    value={editingItem.modifier}
                    onChange={(e) => setEditingItem({ ...editingItem, modifier: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center"
                    placeholder="+10% -$20"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-700">Subtotal:</span>
                  <span className="text-3xl font-bold text-blue-700">
                    {formatCurrency(
                      (() => {
                        let price = parseFloat(editingItem.price) || 0;
                        const modifier = editingItem.modifier.trim();
                        if (modifier) {
                          if (modifier.includes('%')) {
                            const percent = parseFloat(modifier.replace('%', '').replace('+', '').replace('-', ''));
                            if (modifier.startsWith('+')) {
                              price = price * (1 + percent / 100);
                            } else if (modifier.startsWith('-')) {
                              price = price * (1 - percent / 100);
                            }
                          } else if (modifier.includes('
      {showAfipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Conectando con AFIP</h3>
            <p className="text-gray-600 mb-4">Procesando factura electrónica...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impresión */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center gap-3">
              <Check className="w-8 h-8" />
              <h3 className="text-xl font-bold">¡Venta Completada!</h3>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-600 mb-4">¿Cómo desea imprimir el comprobante?</p>
              <div className="space-y-2">
                <button
                  onClick={() => handlePrint('thermal-58')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 58mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica pequeña</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('thermal-80')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 80mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica estándar</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('a4')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Factura A4</p>
                    <p className="text-sm text-gray-600">Formato completo</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('whatsapp')}
                  className="w-full p-4 border-2 border-green-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition flex items-center gap-3"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por WhatsApp</p>
                    <p className="text-sm text-gray-600">Compartir comprobante</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('email')}
                  className="w-full p-4 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition flex items-center gap-3"
                >
                  <Mail className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por Email</p>
                    <p className="text-sm text-gray-600">Correo electrónico</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;)) {
        const amount = parseFloat(modifier.replace('

  // Calcular totales
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    let iva = 0;
    let neto = subtotal;
    let total = subtotal;

    // Si es Factura A, discriminar IVA (el precio ya incluye IVA)
    if (invoiceType === 'A') {
      neto = subtotal / 1.21;
      iva = subtotal - neto;
      total = subtotal;
    }

    return { subtotal, neto, iva, total };
  };

  const totals = calculateTotals();

  // Abrir modal de pago según método
  const openPaymentModal = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentAmount(totals.total.toFixed(2));
    
    if (method === 'tarjeta') {
      setShowCardTypeModal(true);
    } else if (method === 'efectivo') {
      setCashReceived('');
      setShowPaymentModal(true);
      setTimeout(() => cashReceivedRef.current?.focus(), 100);
    } else {
      setShowPaymentModal(true);
      setTimeout(() => paymentAmountRef.current?.focus(), 100);
    }
  };

  // Confirmar tipo de tarjeta
  const confirmCardType = (type) => {
    setCardType(type);
    setShowCardTypeModal(false);
    setShowPaymentModal(true);
    setTimeout(() => paymentAmountRef.current?.focus(), 100);
  };

  // Agregar pago
  const addPayment = () => {
    if (!selectedPaymentMethod) return;

    let amount = 0;
    
    if (selectedPaymentMethod === 'efectivo') {
      if (!cashReceived) return;
      amount = parseFloat(paymentAmount);
    } else {
      if (!paymentAmount) return;
      amount = parseFloat(paymentAmount);
    }

    const newPayment = {
      id: Date.now(),
      method: selectedPaymentMethod,
      cardType: cardType,
      amount: amount,
      received: selectedPaymentMethod === 'efectivo' ? parseFloat(cashReceived) : amount,
    };

    setPayments([...payments, newPayment]);
    
    // Cambiar a Factura C si no es efectivo y está en X
    if (selectedPaymentMethod !== 'efectivo' && invoiceType === 'X') {
      setInvoiceType('C');
    }

    // Cerrar modales
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setPaymentAmount('');
    setCashReceived('');
    setCardType('');
  };

  // Calcular cambio
  const calculateChange = () => {
    const totalPaid = parseFloat(cashReceived) || 0;
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  // Verificar si puede facturar con AFIP
  const canInvoiceAfip = () => {
    const hasNonCashPayment = payments.some(p => p.method !== 'efectivo');
    return hasNonCashPayment && ['A', 'B', 'C'].includes(invoiceType);
  };

  // Facturar con AFIP
  const invoiceWithAfip = () => {
    setShowAfipModal(true);
    
    setTimeout(() => {
      setShowAfipModal(false);
      completeSale();
    }, 3000);
  };

  // Completar venta
  const completeSale = () => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid < totals.total) {
      alert('El monto pagado es menor al total de la venta');
      return;
    }

    console.log('Venta completada:', {
      client,
      invoiceType,
      invoiceNumber: invoiceCounters[invoiceType],
      items,
      totals,
      payments,
    });

    setShowPrintModal(true);
  };

  // Imprimir y resetear
  const handlePrint = (type) => {
    console.log('Imprimiendo:', type);
    
    // Incrementar contador
    setInvoiceCounters(prev => ({
      ...prev,
      [invoiceType]: prev[invoiceType] + 1,
    }));
    
    // Resetear todo
    setItems([]);
    setPayments([]);
    setClient({
      name: 'Consumidor Final',
      type: 'consumidor_final',
      cuit: '',
      address: '',
      phone: '',
      email: '',
      ivaCondition: 'consumidor_final',
    });
    setInvoiceType('X');
    setCurrentProduct({ name: '', price: '', quantity: '1', modifier: '' });
    setShowPrintModal(false);
    
    clientInputRef.current?.focus();
  };

  // Obtener cambio total
  const getTotalChange = () => {
    const totalPaid = payments.reduce((sum, p) => sum + (p.received || p.amount), 0);
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Facturador</h1>
              <p className="text-sm opacity-90">
                {INVOICE_TYPES[invoiceType].name} Nº {String(invoiceCounters[invoiceType]).padStart(8, '0')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Object.entries(INVOICE_TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setInvoiceType(key)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  invoiceType === key
                    ? 'bg-white text-blue-700 shadow-lg scale-105'
                    : 'bg-blue-500 hover:bg-blue-400 text-white'
                }`}
              >
                {type.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel Principal */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Cliente y Producto */}
          <div className="border-b border-gray-300 p-4 space-y-3 bg-gray-50">
            {/* Cliente */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Cliente (Enter: Consumidor Final | F2: Datos completos)
                </label>
                <input
                  ref={clientInputRef}
                  type="text"
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  onKeyDown={handleClientKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none font-medium"
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>

            {/* Producto */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Producto / Código de Barras (F3: Buscar)
                </label>
                <input
                  ref={productNameRef}
                  type="text"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  onKeyDown={handleProductNameKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre o escanee código"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Precio $</label>
                <input
                  ref={productPriceRef}
                  type="number"
                  value={currentProduct.price}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                  onKeyDown={handlePriceKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-right font-bold"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cantidad</label>
                <input
                  ref={productQuantityRef}
                  type="number"
                  value={currentProduct.quantity}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: e.target.value })}
                  onKeyDown={handleQuantityKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center font-bold"
                  placeholder="1"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Ajuste ±%/$
                </label>
                <input
                  ref={productModifierRef}
                  type="text"
                  value={currentProduct.modifier}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, modifier: e.target.value })}
                  onKeyDown={handleModifierKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center"
                  placeholder="+10% -$20"
                />
              </div>

              <div className="col-span-1 flex items-end">
                <button
                  onClick={addProductToList}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition flex items-center justify-center shadow"
                  title="Agregar producto (Enter)"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase w-12">#</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-24">Cant.</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">Precio</th>
                  {invoiceType === 'A' && (
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">IVA</th>
                  )}
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-40">Subtotal</th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={invoiceType === 'A' ? 7 : 6} className="text-center py-20">
                      <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-400 font-medium">No hay productos agregados</p>
                      <p className="text-gray-400 text-sm">Escanee o busque productos para comenzar</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const itemNeto = invoiceType === 'A' ? item.subtotal / 1.21 : item.subtotal;
                    const itemIva = invoiceType === 'A' ? item.subtotal - itemNeto : 0;
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-bold text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.modifier && (
                            <p className="text-xs text-blue-600">Ajuste: {item.modifier}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{item.quantity.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        {invoiceType === 'A' && (
                          <td className="px-4 py-3 text-right text-sm text-green-700 font-medium">
                            {formatCurrency(itemIva)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-bold text-lg text-blue-700">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Derecho - Totales y Pagos */}
        <div className="w-96 bg-white border-l-4 border-blue-600 flex flex-col shadow-xl">
          {/* Totales */}
          <div className="p-4 border-b-2 border-gray-300 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Totales</h3>
            
            {invoiceType === 'A' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Neto:</span>
                  <span className="font-bold">{formatCurrency(totals.neto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA 21%:</span>
                  <span className="font-bold text-green-600">{formatCurrency(totals.iva)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                  <span className="text-3xl font-bold text-blue-700">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                <span className="text-4xl font-bold text-blue-700">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            )}
          </div>

          {/* Métodos de Pago */}
          <div className="p-4 border-b-2 border-gray-300">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Formas de Pago</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                <button
                  key={key}
                  onClick={() => openPaymentModal(method.code)}
                  disabled={items.length === 0}
                  className={`${method.color} hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-lg transition shadow-md flex flex-col items-center gap-2`}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pagos Registrados */}
          {payments.length > 0 && (
            <div className="p-4 border-b-2 border-gray-300 max-h-40 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Pagos:</h3>
              <div className="space-y-1">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium capitalize">
                      {payment.method} {payment.cardType && `(${payment.cardType})`}
                    </span>
                    <span className="font-bold text-green-700">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón AFIP */}
          {canInvoiceAfip() && (
            <div className="p-4">
              <button
                onClick={invoiceWithAfip}
                disabled={items.length === 0 || payments.length === 0}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Facturar con AFIP
              </button>
            </div>
          )}

          {/* Botón Completar Venta */}
          <div className="mt-auto p-4">
            <button
              onClick={completeSale}
              disabled={items.length === 0 || payments.length === 0}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6" />
              COMPLETAR VENTA
            </button>
            {getTotalChange() > 0 && (
              <div className="mt-2 p-2 bg-yellow-100 border-2 border-yellow-400 rounded text-center">
                <p className="text-xs font-bold text-yellow-800">VUELTO</p>
                <p className="text-lg font-bold text-yellow-900">{formatCurrency(getTotalChange())}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Datos del Cliente</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="Juan Pérez / Empresa SA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">DNI / CUIT</label>
                  <input
                    type="text"
                    value={client.cuit}
                    onChange={(e) => setClient({ ...client, cuit: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Av. Siempreviva 742"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={client.phone}
                    onChange={(e) => setClient({ ...client, phone: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="11-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Condición frente al IVA</label>
                <select
                  value={client.ivaCondition}
                  onChange={(e) => setClient({ ...client, ivaCondition: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="consumidor_final">Consumidor Final</option>
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="monotributo">Monotributo</option>
                  <option value="exento">Exento</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow"
                >
                  Guardar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Productos */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Buscar Producto</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-300">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  placeholder="Buscar por nombre o código de barras..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg group-hover:text-blue-700">{product.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Código: {product.barcode}</span>
                          <span className={`${product.stock > 10 ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No se encontraron productos</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-300">
              <button
                onClick={() => setShowProductModal(false)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tipo de Tarjeta */}
      {showCardTypeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold">Tipo de Tarjeta</h3>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => confirmCardType('Débito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Débito</p>
                <p className="text-sm text-gray-600">Cobro inmediato</p>
              </button>
              <button
                onClick={() => confirmCardType('Crédito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Crédito</p>
                <p className="text-sm text-gray-600">Pago diferido</p>
              </button>
              <button
                onClick={() => setShowCardTypeModal(false)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className={`${PAYMENT_METHODS[selectedPaymentMethod.toUpperCase()]?.color || 'bg-blue-600'} text-white px-6 py-4 rounded-t-xl`}>
              <h3 className="text-xl font-bold capitalize">
                Pago con {selectedPaymentMethod} {cardType && `- ${cardType}`}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {selectedPaymentMethod === 'efectivo' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total a pagar</label>
                    <div className="text-4xl font-bold text-center text-blue-700 p-4 bg-blue-50 rounded-lg">
                      {formatCurrency(totals.total)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Efectivo recibido</label>
                    <input
                      ref={cashReceivedRef}
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  {cashReceived && parseFloat(cashReceived) >= totals.total && (
                    <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg">
                      <p className="text-sm font-bold text-green-800 text-center">VUELTO</p>
                      <p className="text-3xl font-bold text-green-900 text-center">
                        {formatCurrency(calculateChange())}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monto a cobrar</label>
                  <input
                    ref={paymentAmountRef}
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-blue-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMethod(null);
                    setCashReceived('');
                    setCardType('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={addPayment}
                  disabled={
                    (selectedPaymentMethod === 'efectivo' && (!cashReceived || parseFloat(cashReceived) < totals.total)) ||
                    (selectedPaymentMethod !== 'efectivo' && !paymentAmount)
                  }
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold transition shadow"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal AFIP */}
      {showAfipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Conectando con AFIP</h3>
            <p className="text-gray-600 mb-4">Procesando factura electrónica...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impresión */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center gap-3">
              <Check className="w-8 h-8" />
              <h3 className="text-xl font-bold">¡Venta Completada!</h3>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-600 mb-4">¿Cómo desea imprimir el comprobante?</p>
              <div className="space-y-2">
                <button
                  onClick={() => handlePrint('thermal-58')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 58mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica pequeña</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('thermal-80')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 80mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica estándar</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('a4')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Factura A4</p>
                    <p className="text-sm text-gray-600">Formato completo</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('whatsapp')}
                  className="w-full p-4 border-2 border-green-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition flex items-center gap-3"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por WhatsApp</p>
                    <p className="text-sm text-gray-600">Compartir comprobante</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('email')}
                  className="w-full p-4 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition flex items-center gap-3"
                >
                  <Mail className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por Email</p>
                    <p className="text-sm text-gray-600">Correo electrónico</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;, '').replace('+', '').replace('-', ''));
        if (modifier.startsWith('+')) {
          finalPrice += amount;
        } else if (modifier.startsWith('-')) {
          finalPrice -= amount;
        }
      } else {
        const value = parseFloat(modifier.replace('+', '').replace('-', ''));
        if (modifier.startsWith('+')) {
          finalPrice = finalPrice * (1 + value / 100);
        } else if (modifier.startsWith('-')) {
          finalPrice = finalPrice * (1 - value / 100);
        }
      }
    }

    const quantity = parseFloat(editingItem.quantity) || 1;
    const subtotal = finalPrice * quantity;

    setItems(items.map(item => 
      item.id === editingItem.id 
        ? {
            ...item,
            price: finalPrice,
            quantity: quantity,
            modifier: editingItem.modifier,
            subtotal: subtotal,
          }
        : item
    ));

    setShowEditItemModal(false);
    setEditingItem(null);
  };

  // Calcular totales
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    let iva = 0;
    let neto = subtotal;
    let total = subtotal;

    // Si es Factura A, discriminar IVA (el precio ya incluye IVA)
    if (invoiceType === 'A') {
      neto = subtotal / 1.21;
      iva = subtotal - neto;
      total = subtotal;
    }

    return { subtotal, neto, iva, total };
  };

  const totals = calculateTotals();

  // Abrir modal de pago según método
  const openPaymentModal = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentAmount(totals.total.toFixed(2));
    
    if (method === 'tarjeta') {
      setShowCardTypeModal(true);
    } else if (method === 'efectivo') {
      setCashReceived('');
      setShowPaymentModal(true);
      setTimeout(() => cashReceivedRef.current?.focus(), 100);
    } else {
      setShowPaymentModal(true);
      setTimeout(() => paymentAmountRef.current?.focus(), 100);
    }
  };

  // Confirmar tipo de tarjeta
  const confirmCardType = (type) => {
    setCardType(type);
    setShowCardTypeModal(false);
    setShowPaymentModal(true);
    setTimeout(() => paymentAmountRef.current?.focus(), 100);
  };

  // Agregar pago
  const addPayment = () => {
    if (!selectedPaymentMethod) return;

    let amount = 0;
    
    if (selectedPaymentMethod === 'efectivo') {
      if (!cashReceived) return;
      amount = parseFloat(paymentAmount);
    } else {
      if (!paymentAmount) return;
      amount = parseFloat(paymentAmount);
    }

    const newPayment = {
      id: Date.now(),
      method: selectedPaymentMethod,
      cardType: cardType,
      amount: amount,
      received: selectedPaymentMethod === 'efectivo' ? parseFloat(cashReceived) : amount,
    };

    setPayments([...payments, newPayment]);
    
    // Cambiar a Factura C si no es efectivo y está en X
    if (selectedPaymentMethod !== 'efectivo' && invoiceType === 'X') {
      setInvoiceType('C');
    }

    // Cerrar modales
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setPaymentAmount('');
    setCashReceived('');
    setCardType('');
  };

  // Calcular cambio
  const calculateChange = () => {
    const totalPaid = parseFloat(cashReceived) || 0;
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  // Verificar si puede facturar con AFIP
  const canInvoiceAfip = () => {
    const hasNonCashPayment = payments.some(p => p.method !== 'efectivo');
    return hasNonCashPayment && ['A', 'B', 'C'].includes(invoiceType);
  };

  // Facturar con AFIP
  const invoiceWithAfip = () => {
    setShowAfipModal(true);
    
    setTimeout(() => {
      setShowAfipModal(false);
      completeSale();
    }, 3000);
  };

  // Completar venta
  const completeSale = () => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid < totals.total) {
      alert('El monto pagado es menor al total de la venta');
      return;
    }

    console.log('Venta completada:', {
      client,
      invoiceType,
      invoiceNumber: invoiceCounters[invoiceType],
      items,
      totals,
      payments,
    });

    setShowPrintModal(true);
  };

  // Imprimir y resetear
  const handlePrint = (type) => {
    console.log('Imprimiendo:', type);
    
    // Incrementar contador
    setInvoiceCounters(prev => ({
      ...prev,
      [invoiceType]: prev[invoiceType] + 1,
    }));
    
    // Resetear todo
    setItems([]);
    setPayments([]);
    setClient({
      name: 'Consumidor Final',
      type: 'consumidor_final',
      cuit: '',
      address: '',
      phone: '',
      email: '',
      ivaCondition: 'consumidor_final',
    });
    setInvoiceType('X');
    setCurrentProduct({ name: '', price: '', quantity: '1', modifier: '' });
    setShowPrintModal(false);
    
    clientInputRef.current?.focus();
  };

  // Obtener cambio total
  const getTotalChange = () => {
    const totalPaid = payments.reduce((sum, p) => sum + (p.received || p.amount), 0);
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Facturador</h1>
              <p className="text-sm opacity-90">
                {INVOICE_TYPES[invoiceType].name} Nº {String(invoiceCounters[invoiceType]).padStart(8, '0')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Object.entries(INVOICE_TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setInvoiceType(key)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  invoiceType === key
                    ? 'bg-white text-blue-700 shadow-lg scale-105'
                    : 'bg-blue-500 hover:bg-blue-400 text-white'
                }`}
              >
                {type.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel Principal */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Cliente y Producto */}
          <div className="border-b border-gray-300 p-4 space-y-3 bg-gray-50">
            {/* Cliente */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Cliente (Enter: Consumidor Final | F2: Datos completos)
                </label>
                <input
                  ref={clientInputRef}
                  type="text"
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  onKeyDown={handleClientKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none font-medium"
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>

            {/* Producto */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Producto / Código de Barras (F3: Buscar)
                </label>
                <input
                  ref={productNameRef}
                  type="text"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  onKeyDown={handleProductNameKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre o escanee código"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Precio $</label>
                <input
                  ref={productPriceRef}
                  type="number"
                  value={currentProduct.price}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                  onKeyDown={handlePriceKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-right font-bold"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cantidad</label>
                <input
                  ref={productQuantityRef}
                  type="number"
                  value={currentProduct.quantity}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: e.target.value })}
                  onKeyDown={handleQuantityKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center font-bold"
                  placeholder="1"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Ajuste ±%/$
                </label>
                <input
                  ref={productModifierRef}
                  type="text"
                  value={currentProduct.modifier}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, modifier: e.target.value })}
                  onKeyDown={handleModifierKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center"
                  placeholder="+10% -$20"
                />
              </div>

              <div className="col-span-1 flex items-end">
                <button
                  onClick={addProductToList}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition flex items-center justify-center shadow"
                  title="Agregar producto (Enter)"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase w-12">#</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-24">Cant.</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">Precio</th>
                  {invoiceType === 'A' && (
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">IVA</th>
                  )}
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-40">Subtotal</th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={invoiceType === 'A' ? 7 : 6} className="text-center py-20">
                      <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-400 font-medium">No hay productos agregados</p>
                      <p className="text-gray-400 text-sm">Escanee o busque productos para comenzar</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const itemNeto = invoiceType === 'A' ? item.subtotal / 1.21 : item.subtotal;
                    const itemIva = invoiceType === 'A' ? item.subtotal - itemNeto : 0;
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-bold text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.modifier && (
                            <p className="text-xs text-blue-600">Ajuste: {item.modifier}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{item.quantity.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        {invoiceType === 'A' && (
                          <td className="px-4 py-3 text-right text-sm text-green-700 font-medium">
                            {formatCurrency(itemIva)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-bold text-lg text-blue-700">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Derecho - Totales y Pagos */}
        <div className="w-96 bg-white border-l-4 border-blue-600 flex flex-col shadow-xl">
          {/* Totales */}
          <div className="p-4 border-b-2 border-gray-300 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Totales</h3>
            
            {invoiceType === 'A' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Neto:</span>
                  <span className="font-bold">{formatCurrency(totals.neto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA 21%:</span>
                  <span className="font-bold text-green-600">{formatCurrency(totals.iva)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                  <span className="text-3xl font-bold text-blue-700">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                <span className="text-4xl font-bold text-blue-700">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            )}
          </div>

          {/* Métodos de Pago */}
          <div className="p-4 border-b-2 border-gray-300">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Formas de Pago</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                <button
                  key={key}
                  onClick={() => openPaymentModal(method.code)}
                  disabled={items.length === 0}
                  className={`${method.color} hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-lg transition shadow-md flex flex-col items-center gap-2`}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pagos Registrados */}
          {payments.length > 0 && (
            <div className="p-4 border-b-2 border-gray-300 max-h-40 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Pagos:</h3>
              <div className="space-y-1">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium capitalize">
                      {payment.method} {payment.cardType && `(${payment.cardType})`}
                    </span>
                    <span className="font-bold text-green-700">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón AFIP */}
          {canInvoiceAfip() && (
            <div className="p-4">
              <button
                onClick={invoiceWithAfip}
                disabled={items.length === 0 || payments.length === 0}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Facturar con AFIP
              </button>
            </div>
          )}

          {/* Botón Completar Venta */}
          <div className="mt-auto p-4">
            <button
              onClick={completeSale}
              disabled={items.length === 0 || payments.length === 0}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6" />
              COMPLETAR VENTA
            </button>
            {getTotalChange() > 0 && (
              <div className="mt-2 p-2 bg-yellow-100 border-2 border-yellow-400 rounded text-center">
                <p className="text-xs font-bold text-yellow-800">VUELTO</p>
                <p className="text-lg font-bold text-yellow-900">{formatCurrency(getTotalChange())}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Datos del Cliente</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="Juan Pérez / Empresa SA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">DNI / CUIT</label>
                  <input
                    type="text"
                    value={client.cuit}
                    onChange={(e) => setClient({ ...client, cuit: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Av. Siempreviva 742"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={client.phone}
                    onChange={(e) => setClient({ ...client, phone: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="11-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Condición frente al IVA</label>
                <select
                  value={client.ivaCondition}
                  onChange={(e) => setClient({ ...client, ivaCondition: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="consumidor_final">Consumidor Final</option>
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="monotributo">Monotributo</option>
                  <option value="exento">Exento</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow"
                >
                  Guardar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Productos */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Buscar Producto</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-300">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  placeholder="Buscar por nombre o código de barras..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg group-hover:text-blue-700">{product.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Código: {product.barcode}</span>
                          <span className={`${product.stock > 10 ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No se encontraron productos</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-300">
              <button
                onClick={() => setShowProductModal(false)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tipo de Tarjeta */}
      {showCardTypeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold">Tipo de Tarjeta</h3>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => confirmCardType('Débito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Débito</p>
                <p className="text-sm text-gray-600">Cobro inmediato</p>
              </button>
              <button
                onClick={() => confirmCardType('Crédito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Crédito</p>
                <p className="text-sm text-gray-600">Pago diferido</p>
              </button>
              <button
                onClick={() => setShowCardTypeModal(false)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className={`${PAYMENT_METHODS[selectedPaymentMethod.toUpperCase()]?.color || 'bg-blue-600'} text-white px-6 py-4 rounded-t-xl`}>
              <h3 className="text-xl font-bold capitalize">
                Pago con {selectedPaymentMethod} {cardType && `- ${cardType}`}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {selectedPaymentMethod === 'efectivo' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total a pagar</label>
                    <div className="text-4xl font-bold text-center text-blue-700 p-4 bg-blue-50 rounded-lg">
                      {formatCurrency(totals.total)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Efectivo recibido</label>
                    <input
                      ref={cashReceivedRef}
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  {cashReceived && parseFloat(cashReceived) >= totals.total && (
                    <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg">
                      <p className="text-sm font-bold text-green-800 text-center">VUELTO</p>
                      <p className="text-3xl font-bold text-green-900 text-center">
                        {formatCurrency(calculateChange())}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monto a cobrar</label>
                  <input
                    ref={paymentAmountRef}
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-blue-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMethod(null);
                    setCashReceived('');
                    setCardType('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={addPayment}
                  disabled={
                    (selectedPaymentMethod === 'efectivo' && (!cashReceived || parseFloat(cashReceived) < totals.total)) ||
                    (selectedPaymentMethod !== 'efectivo' && !paymentAmount)
                  }
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold transition shadow"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal AFIP */}
      {showAfipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Conectando con AFIP</h3>
            <p className="text-gray-600 mb-4">Procesando factura electrónica...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impresión */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center gap-3">
              <Check className="w-8 h-8" />
              <h3 className="text-xl font-bold">¡Venta Completada!</h3>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-600 mb-4">¿Cómo desea imprimir el comprobante?</p>
              <div className="space-y-2">
                <button
                  onClick={() => handlePrint('thermal-58')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 58mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica pequeña</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('thermal-80')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 80mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica estándar</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('a4')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Factura A4</p>
                    <p className="text-sm text-gray-600">Formato completo</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('whatsapp')}
                  className="w-full p-4 border-2 border-green-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition flex items-center gap-3"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por WhatsApp</p>
                    <p className="text-sm text-gray-600">Compartir comprobante</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('email')}
                  className="w-full p-4 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition flex items-center gap-3"
                >
                  <Mail className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por Email</p>
                    <p className="text-sm text-gray-600">Correo electrónico</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;)) {
                            const amount = parseFloat(modifier.replace('
      {showAfipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Conectando con AFIP</h3>
            <p className="text-gray-600 mb-4">Procesando factura electrónica...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impresión */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center gap-3">
              <Check className="w-8 h-8" />
              <h3 className="text-xl font-bold">¡Venta Completada!</h3>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-600 mb-4">¿Cómo desea imprimir el comprobante?</p>
              <div className="space-y-2">
                <button
                  onClick={() => handlePrint('thermal-58')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 58mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica pequeña</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('thermal-80')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 80mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica estándar</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('a4')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Factura A4</p>
                    <p className="text-sm text-gray-600">Formato completo</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('whatsapp')}
                  className="w-full p-4 border-2 border-green-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition flex items-center gap-3"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por WhatsApp</p>
                    <p className="text-sm text-gray-600">Compartir comprobante</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('email')}
                  className="w-full p-4 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition flex items-center gap-3"
                >
                  <Mail className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por Email</p>
                    <p className="text-sm text-gray-600">Correo electrónico</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;)) {
        const amount = parseFloat(modifier.replace('

  // Calcular totales
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    let iva = 0;
    let neto = subtotal;
    let total = subtotal;

    // Si es Factura A, discriminar IVA (el precio ya incluye IVA)
    if (invoiceType === 'A') {
      neto = subtotal / 1.21;
      iva = subtotal - neto;
      total = subtotal;
    }

    return { subtotal, neto, iva, total };
  };

  const totals = calculateTotals();

  // Abrir modal de pago según método
  const openPaymentModal = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentAmount(totals.total.toFixed(2));
    
    if (method === 'tarjeta') {
      setShowCardTypeModal(true);
    } else if (method === 'efectivo') {
      setCashReceived('');
      setShowPaymentModal(true);
      setTimeout(() => cashReceivedRef.current?.focus(), 100);
    } else {
      setShowPaymentModal(true);
      setTimeout(() => paymentAmountRef.current?.focus(), 100);
    }
  };

  // Confirmar tipo de tarjeta
  const confirmCardType = (type) => {
    setCardType(type);
    setShowCardTypeModal(false);
    setShowPaymentModal(true);
    setTimeout(() => paymentAmountRef.current?.focus(), 100);
  };

  // Agregar pago
  const addPayment = () => {
    if (!selectedPaymentMethod) return;

    let amount = 0;
    
    if (selectedPaymentMethod === 'efectivo') {
      if (!cashReceived) return;
      amount = parseFloat(paymentAmount);
    } else {
      if (!paymentAmount) return;
      amount = parseFloat(paymentAmount);
    }

    const newPayment = {
      id: Date.now(),
      method: selectedPaymentMethod,
      cardType: cardType,
      amount: amount,
      received: selectedPaymentMethod === 'efectivo' ? parseFloat(cashReceived) : amount,
    };

    setPayments([...payments, newPayment]);
    
    // Cambiar a Factura C si no es efectivo y está en X
    if (selectedPaymentMethod !== 'efectivo' && invoiceType === 'X') {
      setInvoiceType('C');
    }

    // Cerrar modales
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setPaymentAmount('');
    setCashReceived('');
    setCardType('');
  };

  // Calcular cambio
  const calculateChange = () => {
    const totalPaid = parseFloat(cashReceived) || 0;
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  // Verificar si puede facturar con AFIP
  const canInvoiceAfip = () => {
    const hasNonCashPayment = payments.some(p => p.method !== 'efectivo');
    return hasNonCashPayment && ['A', 'B', 'C'].includes(invoiceType);
  };

  // Facturar con AFIP
  const invoiceWithAfip = () => {
    setShowAfipModal(true);
    
    setTimeout(() => {
      setShowAfipModal(false);
      completeSale();
    }, 3000);
  };

  // Completar venta
  const completeSale = () => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid < totals.total) {
      alert('El monto pagado es menor al total de la venta');
      return;
    }

    console.log('Venta completada:', {
      client,
      invoiceType,
      invoiceNumber: invoiceCounters[invoiceType],
      items,
      totals,
      payments,
    });

    setShowPrintModal(true);
  };

  // Imprimir y resetear
  const handlePrint = (type) => {
    console.log('Imprimiendo:', type);
    
    // Incrementar contador
    setInvoiceCounters(prev => ({
      ...prev,
      [invoiceType]: prev[invoiceType] + 1,
    }));
    
    // Resetear todo
    setItems([]);
    setPayments([]);
    setClient({
      name: 'Consumidor Final',
      type: 'consumidor_final',
      cuit: '',
      address: '',
      phone: '',
      email: '',
      ivaCondition: 'consumidor_final',
    });
    setInvoiceType('X');
    setCurrentProduct({ name: '', price: '', quantity: '1', modifier: '' });
    setShowPrintModal(false);
    
    clientInputRef.current?.focus();
  };

  // Obtener cambio total
  const getTotalChange = () => {
    const totalPaid = payments.reduce((sum, p) => sum + (p.received || p.amount), 0);
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Facturador</h1>
              <p className="text-sm opacity-90">
                {INVOICE_TYPES[invoiceType].name} Nº {String(invoiceCounters[invoiceType]).padStart(8, '0')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Object.entries(INVOICE_TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setInvoiceType(key)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  invoiceType === key
                    ? 'bg-white text-blue-700 shadow-lg scale-105'
                    : 'bg-blue-500 hover:bg-blue-400 text-white'
                }`}
              >
                {type.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel Principal */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Cliente y Producto */}
          <div className="border-b border-gray-300 p-4 space-y-3 bg-gray-50">
            {/* Cliente */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Cliente (Enter: Consumidor Final | F2: Datos completos)
                </label>
                <input
                  ref={clientInputRef}
                  type="text"
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  onKeyDown={handleClientKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none font-medium"
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>

            {/* Producto */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Producto / Código de Barras (F3: Buscar)
                </label>
                <input
                  ref={productNameRef}
                  type="text"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  onKeyDown={handleProductNameKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre o escanee código"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Precio $</label>
                <input
                  ref={productPriceRef}
                  type="number"
                  value={currentProduct.price}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                  onKeyDown={handlePriceKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-right font-bold"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cantidad</label>
                <input
                  ref={productQuantityRef}
                  type="number"
                  value={currentProduct.quantity}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: e.target.value })}
                  onKeyDown={handleQuantityKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center font-bold"
                  placeholder="1"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Ajuste ±%/$
                </label>
                <input
                  ref={productModifierRef}
                  type="text"
                  value={currentProduct.modifier}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, modifier: e.target.value })}
                  onKeyDown={handleModifierKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center"
                  placeholder="+10% -$20"
                />
              </div>

              <div className="col-span-1 flex items-end">
                <button
                  onClick={addProductToList}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition flex items-center justify-center shadow"
                  title="Agregar producto (Enter)"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase w-12">#</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-24">Cant.</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">Precio</th>
                  {invoiceType === 'A' && (
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">IVA</th>
                  )}
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-40">Subtotal</th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={invoiceType === 'A' ? 7 : 6} className="text-center py-20">
                      <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-400 font-medium">No hay productos agregados</p>
                      <p className="text-gray-400 text-sm">Escanee o busque productos para comenzar</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const itemNeto = invoiceType === 'A' ? item.subtotal / 1.21 : item.subtotal;
                    const itemIva = invoiceType === 'A' ? item.subtotal - itemNeto : 0;
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-bold text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.modifier && (
                            <p className="text-xs text-blue-600">Ajuste: {item.modifier}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{item.quantity.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        {invoiceType === 'A' && (
                          <td className="px-4 py-3 text-right text-sm text-green-700 font-medium">
                            {formatCurrency(itemIva)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-bold text-lg text-blue-700">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Derecho - Totales y Pagos */}
        <div className="w-96 bg-white border-l-4 border-blue-600 flex flex-col shadow-xl">
          {/* Totales */}
          <div className="p-4 border-b-2 border-gray-300 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Totales</h3>
            
            {invoiceType === 'A' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Neto:</span>
                  <span className="font-bold">{formatCurrency(totals.neto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA 21%:</span>
                  <span className="font-bold text-green-600">{formatCurrency(totals.iva)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                  <span className="text-3xl font-bold text-blue-700">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                <span className="text-4xl font-bold text-blue-700">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            )}
          </div>

          {/* Métodos de Pago */}
          <div className="p-4 border-b-2 border-gray-300">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Formas de Pago</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                <button
                  key={key}
                  onClick={() => openPaymentModal(method.code)}
                  disabled={items.length === 0}
                  className={`${method.color} hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-lg transition shadow-md flex flex-col items-center gap-2`}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pagos Registrados */}
          {payments.length > 0 && (
            <div className="p-4 border-b-2 border-gray-300 max-h-40 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Pagos:</h3>
              <div className="space-y-1">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium capitalize">
                      {payment.method} {payment.cardType && `(${payment.cardType})`}
                    </span>
                    <span className="font-bold text-green-700">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón AFIP */}
          {canInvoiceAfip() && (
            <div className="p-4">
              <button
                onClick={invoiceWithAfip}
                disabled={items.length === 0 || payments.length === 0}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Facturar con AFIP
              </button>
            </div>
          )}

          {/* Botón Completar Venta */}
          <div className="mt-auto p-4">
            <button
              onClick={completeSale}
              disabled={items.length === 0 || payments.length === 0}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6" />
              COMPLETAR VENTA
            </button>
            {getTotalChange() > 0 && (
              <div className="mt-2 p-2 bg-yellow-100 border-2 border-yellow-400 rounded text-center">
                <p className="text-xs font-bold text-yellow-800">VUELTO</p>
                <p className="text-lg font-bold text-yellow-900">{formatCurrency(getTotalChange())}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Datos del Cliente</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="Juan Pérez / Empresa SA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">DNI / CUIT</label>
                  <input
                    type="text"
                    value={client.cuit}
                    onChange={(e) => setClient({ ...client, cuit: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Av. Siempreviva 742"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={client.phone}
                    onChange={(e) => setClient({ ...client, phone: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="11-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Condición frente al IVA</label>
                <select
                  value={client.ivaCondition}
                  onChange={(e) => setClient({ ...client, ivaCondition: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="consumidor_final">Consumidor Final</option>
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="monotributo">Monotributo</option>
                  <option value="exento">Exento</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow"
                >
                  Guardar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Productos */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Buscar Producto</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-300">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  placeholder="Buscar por nombre o código de barras..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg group-hover:text-blue-700">{product.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Código: {product.barcode}</span>
                          <span className={`${product.stock > 10 ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No se encontraron productos</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-300">
              <button
                onClick={() => setShowProductModal(false)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tipo de Tarjeta */}
      {showCardTypeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold">Tipo de Tarjeta</h3>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => confirmCardType('Débito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Débito</p>
                <p className="text-sm text-gray-600">Cobro inmediato</p>
              </button>
              <button
                onClick={() => confirmCardType('Crédito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Crédito</p>
                <p className="text-sm text-gray-600">Pago diferido</p>
              </button>
              <button
                onClick={() => setShowCardTypeModal(false)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className={`${PAYMENT_METHODS[selectedPaymentMethod.toUpperCase()]?.color || 'bg-blue-600'} text-white px-6 py-4 rounded-t-xl`}>
              <h3 className="text-xl font-bold capitalize">
                Pago con {selectedPaymentMethod} {cardType && `- ${cardType}`}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {selectedPaymentMethod === 'efectivo' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total a pagar</label>
                    <div className="text-4xl font-bold text-center text-blue-700 p-4 bg-blue-50 rounded-lg">
                      {formatCurrency(totals.total)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Efectivo recibido</label>
                    <input
                      ref={cashReceivedRef}
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  {cashReceived && parseFloat(cashReceived) >= totals.total && (
                    <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg">
                      <p className="text-sm font-bold text-green-800 text-center">VUELTO</p>
                      <p className="text-3xl font-bold text-green-900 text-center">
                        {formatCurrency(calculateChange())}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monto a cobrar</label>
                  <input
                    ref={paymentAmountRef}
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-blue-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMethod(null);
                    setCashReceived('');
                    setCardType('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={addPayment}
                  disabled={
                    (selectedPaymentMethod === 'efectivo' && (!cashReceived || parseFloat(cashReceived) < totals.total)) ||
                    (selectedPaymentMethod !== 'efectivo' && !paymentAmount)
                  }
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold transition shadow"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal AFIP */}
      {showAfipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Conectando con AFIP</h3>
            <p className="text-gray-600 mb-4">Procesando factura electrónica...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impresión */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center gap-3">
              <Check className="w-8 h-8" />
              <h3 className="text-xl font-bold">¡Venta Completada!</h3>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-600 mb-4">¿Cómo desea imprimir el comprobante?</p>
              <div className="space-y-2">
                <button
                  onClick={() => handlePrint('thermal-58')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 58mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica pequeña</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('thermal-80')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 80mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica estándar</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('a4')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Factura A4</p>
                    <p className="text-sm text-gray-600">Formato completo</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('whatsapp')}
                  className="w-full p-4 border-2 border-green-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition flex items-center gap-3"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por WhatsApp</p>
                    <p className="text-sm text-gray-600">Compartir comprobante</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('email')}
                  className="w-full p-4 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition flex items-center gap-3"
                >
                  <Mail className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por Email</p>
                    <p className="text-sm text-gray-600">Correo electrónico</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;, '').replace('+', '').replace('-', ''));
        if (modifier.startsWith('+')) {
          finalPrice += amount;
        } else if (modifier.startsWith('-')) {
          finalPrice -= amount;
        }
      } else {
        const value = parseFloat(modifier.replace('+', '').replace('-', ''));
        if (modifier.startsWith('+')) {
          finalPrice = finalPrice * (1 + value / 100);
        } else if (modifier.startsWith('-')) {
          finalPrice = finalPrice * (1 - value / 100);
        }
      }
    }

    const quantity = parseFloat(editingItem.quantity) || 1;
    const subtotal = finalPrice * quantity;

    setItems(items.map(item => 
      item.id === editingItem.id 
        ? {
            ...item,
            price: finalPrice,
            quantity: quantity,
            modifier: editingItem.modifier,
            subtotal: subtotal,
          }
        : item
    ));

    setShowEditItemModal(false);
    setEditingItem(null);
  };

  // Calcular totales
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    let iva = 0;
    let neto = subtotal;
    let total = subtotal;

    // Si es Factura A, discriminar IVA (el precio ya incluye IVA)
    if (invoiceType === 'A') {
      neto = subtotal / 1.21;
      iva = subtotal - neto;
      total = subtotal;
    }

    return { subtotal, neto, iva, total };
  };

  const totals = calculateTotals();

  // Abrir modal de pago según método
  const openPaymentModal = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentAmount(totals.total.toFixed(2));
    
    if (method === 'tarjeta') {
      setShowCardTypeModal(true);
    } else if (method === 'efectivo') {
      setCashReceived('');
      setShowPaymentModal(true);
      setTimeout(() => cashReceivedRef.current?.focus(), 100);
    } else {
      setShowPaymentModal(true);
      setTimeout(() => paymentAmountRef.current?.focus(), 100);
    }
  };

  // Confirmar tipo de tarjeta
  const confirmCardType = (type) => {
    setCardType(type);
    setShowCardTypeModal(false);
    setShowPaymentModal(true);
    setTimeout(() => paymentAmountRef.current?.focus(), 100);
  };

  // Agregar pago
  const addPayment = () => {
    if (!selectedPaymentMethod) return;

    let amount = 0;
    
    if (selectedPaymentMethod === 'efectivo') {
      if (!cashReceived) return;
      amount = parseFloat(paymentAmount);
    } else {
      if (!paymentAmount) return;
      amount = parseFloat(paymentAmount);
    }

    const newPayment = {
      id: Date.now(),
      method: selectedPaymentMethod,
      cardType: cardType,
      amount: amount,
      received: selectedPaymentMethod === 'efectivo' ? parseFloat(cashReceived) : amount,
    };

    setPayments([...payments, newPayment]);
    
    // Cambiar a Factura C si no es efectivo y está en X
    if (selectedPaymentMethod !== 'efectivo' && invoiceType === 'X') {
      setInvoiceType('C');
    }

    // Cerrar modales
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setPaymentAmount('');
    setCashReceived('');
    setCardType('');
  };

  // Calcular cambio
  const calculateChange = () => {
    const totalPaid = parseFloat(cashReceived) || 0;
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  // Verificar si puede facturar con AFIP
  const canInvoiceAfip = () => {
    const hasNonCashPayment = payments.some(p => p.method !== 'efectivo');
    return hasNonCashPayment && ['A', 'B', 'C'].includes(invoiceType);
  };

  // Facturar con AFIP
  const invoiceWithAfip = () => {
    setShowAfipModal(true);
    
    setTimeout(() => {
      setShowAfipModal(false);
      completeSale();
    }, 3000);
  };

  // Completar venta
  const completeSale = () => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid < totals.total) {
      alert('El monto pagado es menor al total de la venta');
      return;
    }

    console.log('Venta completada:', {
      client,
      invoiceType,
      invoiceNumber: invoiceCounters[invoiceType],
      items,
      totals,
      payments,
    });

    setShowPrintModal(true);
  };

  // Imprimir y resetear
  const handlePrint = (type) => {
    console.log('Imprimiendo:', type);
    
    // Incrementar contador
    setInvoiceCounters(prev => ({
      ...prev,
      [invoiceType]: prev[invoiceType] + 1,
    }));
    
    // Resetear todo
    setItems([]);
    setPayments([]);
    setClient({
      name: 'Consumidor Final',
      type: 'consumidor_final',
      cuit: '',
      address: '',
      phone: '',
      email: '',
      ivaCondition: 'consumidor_final',
    });
    setInvoiceType('X');
    setCurrentProduct({ name: '', price: '', quantity: '1', modifier: '' });
    setShowPrintModal(false);
    
    clientInputRef.current?.focus();
  };

  // Obtener cambio total
  const getTotalChange = () => {
    const totalPaid = payments.reduce((sum, p) => sum + (p.received || p.amount), 0);
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Facturador</h1>
              <p className="text-sm opacity-90">
                {INVOICE_TYPES[invoiceType].name} Nº {String(invoiceCounters[invoiceType]).padStart(8, '0')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Object.entries(INVOICE_TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setInvoiceType(key)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  invoiceType === key
                    ? 'bg-white text-blue-700 shadow-lg scale-105'
                    : 'bg-blue-500 hover:bg-blue-400 text-white'
                }`}
              >
                {type.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel Principal */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Cliente y Producto */}
          <div className="border-b border-gray-300 p-4 space-y-3 bg-gray-50">
            {/* Cliente */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Cliente (Enter: Consumidor Final | F2: Datos completos)
                </label>
                <input
                  ref={clientInputRef}
                  type="text"
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  onKeyDown={handleClientKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none font-medium"
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>

            {/* Producto */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Producto / Código de Barras (F3: Buscar)
                </label>
                <input
                  ref={productNameRef}
                  type="text"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  onKeyDown={handleProductNameKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre o escanee código"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Precio $</label>
                <input
                  ref={productPriceRef}
                  type="number"
                  value={currentProduct.price}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                  onKeyDown={handlePriceKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-right font-bold"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cantidad</label>
                <input
                  ref={productQuantityRef}
                  type="number"
                  value={currentProduct.quantity}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: e.target.value })}
                  onKeyDown={handleQuantityKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center font-bold"
                  placeholder="1"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Ajuste ±%/$
                </label>
                <input
                  ref={productModifierRef}
                  type="text"
                  value={currentProduct.modifier}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, modifier: e.target.value })}
                  onKeyDown={handleModifierKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center"
                  placeholder="+10% -$20"
                />
              </div>

              <div className="col-span-1 flex items-end">
                <button
                  onClick={addProductToList}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition flex items-center justify-center shadow"
                  title="Agregar producto (Enter)"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase w-12">#</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-24">Cant.</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">Precio</th>
                  {invoiceType === 'A' && (
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">IVA</th>
                  )}
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-40">Subtotal</th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={invoiceType === 'A' ? 7 : 6} className="text-center py-20">
                      <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-400 font-medium">No hay productos agregados</p>
                      <p className="text-gray-400 text-sm">Escanee o busque productos para comenzar</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const itemNeto = invoiceType === 'A' ? item.subtotal / 1.21 : item.subtotal;
                    const itemIva = invoiceType === 'A' ? item.subtotal - itemNeto : 0;
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-bold text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.modifier && (
                            <p className="text-xs text-blue-600">Ajuste: {item.modifier}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{item.quantity.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        {invoiceType === 'A' && (
                          <td className="px-4 py-3 text-right text-sm text-green-700 font-medium">
                            {formatCurrency(itemIva)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-bold text-lg text-blue-700">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Derecho - Totales y Pagos */}
        <div className="w-96 bg-white border-l-4 border-blue-600 flex flex-col shadow-xl">
          {/* Totales */}
          <div className="p-4 border-b-2 border-gray-300 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Totales</h3>
            
            {invoiceType === 'A' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Neto:</span>
                  <span className="font-bold">{formatCurrency(totals.neto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA 21%:</span>
                  <span className="font-bold text-green-600">{formatCurrency(totals.iva)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                  <span className="text-3xl font-bold text-blue-700">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                <span className="text-4xl font-bold text-blue-700">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            )}
          </div>

          {/* Métodos de Pago */}
          <div className="p-4 border-b-2 border-gray-300">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Formas de Pago</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                <button
                  key={key}
                  onClick={() => openPaymentModal(method.code)}
                  disabled={items.length === 0}
                  className={`${method.color} hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-lg transition shadow-md flex flex-col items-center gap-2`}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pagos Registrados */}
          {payments.length > 0 && (
            <div className="p-4 border-b-2 border-gray-300 max-h-40 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Pagos:</h3>
              <div className="space-y-1">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium capitalize">
                      {payment.method} {payment.cardType && `(${payment.cardType})`}
                    </span>
                    <span className="font-bold text-green-700">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón AFIP */}
          {canInvoiceAfip() && (
            <div className="p-4">
              <button
                onClick={invoiceWithAfip}
                disabled={items.length === 0 || payments.length === 0}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Facturar con AFIP
              </button>
            </div>
          )}

          {/* Botón Completar Venta */}
          <div className="mt-auto p-4">
            <button
              onClick={completeSale}
              disabled={items.length === 0 || payments.length === 0}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6" />
              COMPLETAR VENTA
            </button>
            {getTotalChange() > 0 && (
              <div className="mt-2 p-2 bg-yellow-100 border-2 border-yellow-400 rounded text-center">
                <p className="text-xs font-bold text-yellow-800">VUELTO</p>
                <p className="text-lg font-bold text-yellow-900">{formatCurrency(getTotalChange())}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Datos del Cliente</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="Juan Pérez / Empresa SA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">DNI / CUIT</label>
                  <input
                    type="text"
                    value={client.cuit}
                    onChange={(e) => setClient({ ...client, cuit: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Av. Siempreviva 742"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={client.phone}
                    onChange={(e) => setClient({ ...client, phone: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="11-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Condición frente al IVA</label>
                <select
                  value={client.ivaCondition}
                  onChange={(e) => setClient({ ...client, ivaCondition: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="consumidor_final">Consumidor Final</option>
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="monotributo">Monotributo</option>
                  <option value="exento">Exento</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow"
                >
                  Guardar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Productos */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Buscar Producto</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-300">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  placeholder="Buscar por nombre o código de barras..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg group-hover:text-blue-700">{product.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Código: {product.barcode}</span>
                          <span className={`${product.stock > 10 ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No se encontraron productos</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-300">
              <button
                onClick={() => setShowProductModal(false)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tipo de Tarjeta */}
      {showCardTypeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold">Tipo de Tarjeta</h3>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => confirmCardType('Débito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Débito</p>
                <p className="text-sm text-gray-600">Cobro inmediato</p>
              </button>
              <button
                onClick={() => confirmCardType('Crédito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Crédito</p>
                <p className="text-sm text-gray-600">Pago diferido</p>
              </button>
              <button
                onClick={() => setShowCardTypeModal(false)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className={`${PAYMENT_METHODS[selectedPaymentMethod.toUpperCase()]?.color || 'bg-blue-600'} text-white px-6 py-4 rounded-t-xl`}>
              <h3 className="text-xl font-bold capitalize">
                Pago con {selectedPaymentMethod} {cardType && `- ${cardType}`}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {selectedPaymentMethod === 'efectivo' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total a pagar</label>
                    <div className="text-4xl font-bold text-center text-blue-700 p-4 bg-blue-50 rounded-lg">
                      {formatCurrency(totals.total)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Efectivo recibido</label>
                    <input
                      ref={cashReceivedRef}
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  {cashReceived && parseFloat(cashReceived) >= totals.total && (
                    <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg">
                      <p className="text-sm font-bold text-green-800 text-center">VUELTO</p>
                      <p className="text-3xl font-bold text-green-900 text-center">
                        {formatCurrency(calculateChange())}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monto a cobrar</label>
                  <input
                    ref={paymentAmountRef}
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-blue-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMethod(null);
                    setCashReceived('');
                    setCardType('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={addPayment}
                  disabled={
                    (selectedPaymentMethod === 'efectivo' && (!cashReceived || parseFloat(cashReceived) < totals.total)) ||
                    (selectedPaymentMethod !== 'efectivo' && !paymentAmount)
                  }
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold transition shadow"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal AFIP */}
      {showAfipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Conectando con AFIP</h3>
            <p className="text-gray-600 mb-4">Procesando factura electrónica...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impresión */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center gap-3">
              <Check className="w-8 h-8" />
              <h3 className="text-xl font-bold">¡Venta Completada!</h3>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-600 mb-4">¿Cómo desea imprimir el comprobante?</p>
              <div className="space-y-2">
                <button
                  onClick={() => handlePrint('thermal-58')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 58mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica pequeña</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('thermal-80')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 80mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica estándar</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('a4')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Factura A4</p>
                    <p className="text-sm text-gray-600">Formato completo</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('whatsapp')}
                  className="w-full p-4 border-2 border-green-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition flex items-center gap-3"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por WhatsApp</p>
                    <p className="text-sm text-gray-600">Compartir comprobante</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('email')}
                  className="w-full p-4 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition flex items-center gap-3"
                >
                  <Mail className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por Email</p>
                    <p className="text-sm text-gray-600">Correo electrónico</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;, '').replace('+', '').replace('-', ''));
                            if (modifier.startsWith('+')) {
                              price += amount;
                            } else if (modifier.startsWith('-')) {
                              price -= amount;
                            }
                          } else {
                            const value = parseFloat(modifier.replace('+', '').replace('-', ''));
                            if (modifier.startsWith('+')) {
                              price = price * (1 + value / 100);
                            } else if (modifier.startsWith('-')) {
                              price = price * (1 - value / 100);
                            }
                          }
                        }
                        return price * (parseFloat(editingItem.quantity) || 0);
                      })()
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditItemModal(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveItemChanges}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal AFIP */}
      {showAfipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Conectando con AFIP</h3>
            <p className="text-gray-600 mb-4">Procesando factura electrónica...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impresión */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center gap-3">
              <Check className="w-8 h-8" />
              <h3 className="text-xl font-bold">¡Venta Completada!</h3>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-600 mb-4">¿Cómo desea imprimir el comprobante?</p>
              <div className="space-y-2">
                <button
                  onClick={() => handlePrint('thermal-58')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 58mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica pequeña</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('thermal-80')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 80mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica estándar</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('a4')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Factura A4</p>
                    <p className="text-sm text-gray-600">Formato completo</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('whatsapp')}
                  className="w-full p-4 border-2 border-green-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition flex items-center gap-3"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por WhatsApp</p>
                    <p className="text-sm text-gray-600">Compartir comprobante</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('email')}
                  className="w-full p-4 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition flex items-center gap-3"
                >
                  <Mail className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por Email</p>
                    <p className="text-sm text-gray-600">Correo electrónico</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;)) {
        const amount = parseFloat(modifier.replace('

  // Calcular totales
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    let iva = 0;
    let neto = subtotal;
    let total = subtotal;

    // Si es Factura A, discriminar IVA (el precio ya incluye IVA)
    if (invoiceType === 'A') {
      neto = subtotal / 1.21;
      iva = subtotal - neto;
      total = subtotal;
    }

    return { subtotal, neto, iva, total };
  };

  const totals = calculateTotals();

  // Abrir modal de pago según método
  const openPaymentModal = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentAmount(totals.total.toFixed(2));
    
    if (method === 'tarjeta') {
      setShowCardTypeModal(true);
    } else if (method === 'efectivo') {
      setCashReceived('');
      setShowPaymentModal(true);
      setTimeout(() => cashReceivedRef.current?.focus(), 100);
    } else {
      setShowPaymentModal(true);
      setTimeout(() => paymentAmountRef.current?.focus(), 100);
    }
  };

  // Confirmar tipo de tarjeta
  const confirmCardType = (type) => {
    setCardType(type);
    setShowCardTypeModal(false);
    setShowPaymentModal(true);
    setTimeout(() => paymentAmountRef.current?.focus(), 100);
  };

  // Agregar pago
  const addPayment = () => {
    if (!selectedPaymentMethod) return;

    let amount = 0;
    
    if (selectedPaymentMethod === 'efectivo') {
      if (!cashReceived) return;
      amount = parseFloat(paymentAmount);
    } else {
      if (!paymentAmount) return;
      amount = parseFloat(paymentAmount);
    }

    const newPayment = {
      id: Date.now(),
      method: selectedPaymentMethod,
      cardType: cardType,
      amount: amount,
      received: selectedPaymentMethod === 'efectivo' ? parseFloat(cashReceived) : amount,
    };

    setPayments([...payments, newPayment]);
    
    // Cambiar a Factura C si no es efectivo y está en X
    if (selectedPaymentMethod !== 'efectivo' && invoiceType === 'X') {
      setInvoiceType('C');
    }

    // Cerrar modales
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setPaymentAmount('');
    setCashReceived('');
    setCardType('');
  };

  // Calcular cambio
  const calculateChange = () => {
    const totalPaid = parseFloat(cashReceived) || 0;
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  // Verificar si puede facturar con AFIP
  const canInvoiceAfip = () => {
    const hasNonCashPayment = payments.some(p => p.method !== 'efectivo');
    return hasNonCashPayment && ['A', 'B', 'C'].includes(invoiceType);
  };

  // Facturar con AFIP
  const invoiceWithAfip = () => {
    setShowAfipModal(true);
    
    setTimeout(() => {
      setShowAfipModal(false);
      completeSale();
    }, 3000);
  };

  // Completar venta
  const completeSale = () => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid < totals.total) {
      alert('El monto pagado es menor al total de la venta');
      return;
    }

    console.log('Venta completada:', {
      client,
      invoiceType,
      invoiceNumber: invoiceCounters[invoiceType],
      items,
      totals,
      payments,
    });

    setShowPrintModal(true);
  };

  // Imprimir y resetear
  const handlePrint = (type) => {
    console.log('Imprimiendo:', type);
    
    // Incrementar contador
    setInvoiceCounters(prev => ({
      ...prev,
      [invoiceType]: prev[invoiceType] + 1,
    }));
    
    // Resetear todo
    setItems([]);
    setPayments([]);
    setClient({
      name: 'Consumidor Final',
      type: 'consumidor_final',
      cuit: '',
      address: '',
      phone: '',
      email: '',
      ivaCondition: 'consumidor_final',
    });
    setInvoiceType('X');
    setCurrentProduct({ name: '', price: '', quantity: '1', modifier: '' });
    setShowPrintModal(false);
    
    clientInputRef.current?.focus();
  };

  // Obtener cambio total
  const getTotalChange = () => {
    const totalPaid = payments.reduce((sum, p) => sum + (p.received || p.amount), 0);
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Facturador</h1>
              <p className="text-sm opacity-90">
                {INVOICE_TYPES[invoiceType].name} Nº {String(invoiceCounters[invoiceType]).padStart(8, '0')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Object.entries(INVOICE_TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setInvoiceType(key)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  invoiceType === key
                    ? 'bg-white text-blue-700 shadow-lg scale-105'
                    : 'bg-blue-500 hover:bg-blue-400 text-white'
                }`}
              >
                {type.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel Principal */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Cliente y Producto */}
          <div className="border-b border-gray-300 p-4 space-y-3 bg-gray-50">
            {/* Cliente */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Cliente (Enter: Consumidor Final | F2: Datos completos)
                </label>
                <input
                  ref={clientInputRef}
                  type="text"
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  onKeyDown={handleClientKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none font-medium"
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>

            {/* Producto */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Producto / Código de Barras (F3: Buscar)
                </label>
                <input
                  ref={productNameRef}
                  type="text"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  onKeyDown={handleProductNameKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre o escanee código"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Precio $</label>
                <input
                  ref={productPriceRef}
                  type="number"
                  value={currentProduct.price}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                  onKeyDown={handlePriceKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-right font-bold"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cantidad</label>
                <input
                  ref={productQuantityRef}
                  type="number"
                  value={currentProduct.quantity}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: e.target.value })}
                  onKeyDown={handleQuantityKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center font-bold"
                  placeholder="1"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Ajuste ±%/$
                </label>
                <input
                  ref={productModifierRef}
                  type="text"
                  value={currentProduct.modifier}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, modifier: e.target.value })}
                  onKeyDown={handleModifierKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center"
                  placeholder="+10% -$20"
                />
              </div>

              <div className="col-span-1 flex items-end">
                <button
                  onClick={addProductToList}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition flex items-center justify-center shadow"
                  title="Agregar producto (Enter)"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase w-12">#</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-24">Cant.</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">Precio</th>
                  {invoiceType === 'A' && (
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">IVA</th>
                  )}
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-40">Subtotal</th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={invoiceType === 'A' ? 7 : 6} className="text-center py-20">
                      <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-400 font-medium">No hay productos agregados</p>
                      <p className="text-gray-400 text-sm">Escanee o busque productos para comenzar</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const itemNeto = invoiceType === 'A' ? item.subtotal / 1.21 : item.subtotal;
                    const itemIva = invoiceType === 'A' ? item.subtotal - itemNeto : 0;
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-bold text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.modifier && (
                            <p className="text-xs text-blue-600">Ajuste: {item.modifier}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{item.quantity.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        {invoiceType === 'A' && (
                          <td className="px-4 py-3 text-right text-sm text-green-700 font-medium">
                            {formatCurrency(itemIva)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-bold text-lg text-blue-700">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Derecho - Totales y Pagos */}
        <div className="w-96 bg-white border-l-4 border-blue-600 flex flex-col shadow-xl">
          {/* Totales */}
          <div className="p-4 border-b-2 border-gray-300 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Totales</h3>
            
            {invoiceType === 'A' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Neto:</span>
                  <span className="font-bold">{formatCurrency(totals.neto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA 21%:</span>
                  <span className="font-bold text-green-600">{formatCurrency(totals.iva)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                  <span className="text-3xl font-bold text-blue-700">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                <span className="text-4xl font-bold text-blue-700">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            )}
          </div>

          {/* Métodos de Pago */}
          <div className="p-4 border-b-2 border-gray-300">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Formas de Pago</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                <button
                  key={key}
                  onClick={() => openPaymentModal(method.code)}
                  disabled={items.length === 0}
                  className={`${method.color} hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-lg transition shadow-md flex flex-col items-center gap-2`}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pagos Registrados */}
          {payments.length > 0 && (
            <div className="p-4 border-b-2 border-gray-300 max-h-40 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Pagos:</h3>
              <div className="space-y-1">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium capitalize">
                      {payment.method} {payment.cardType && `(${payment.cardType})`}
                    </span>
                    <span className="font-bold text-green-700">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón AFIP */}
          {canInvoiceAfip() && (
            <div className="p-4">
              <button
                onClick={invoiceWithAfip}
                disabled={items.length === 0 || payments.length === 0}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Facturar con AFIP
              </button>
            </div>
          )}

          {/* Botón Completar Venta */}
          <div className="mt-auto p-4">
            <button
              onClick={completeSale}
              disabled={items.length === 0 || payments.length === 0}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6" />
              COMPLETAR VENTA
            </button>
            {getTotalChange() > 0 && (
              <div className="mt-2 p-2 bg-yellow-100 border-2 border-yellow-400 rounded text-center">
                <p className="text-xs font-bold text-yellow-800">VUELTO</p>
                <p className="text-lg font-bold text-yellow-900">{formatCurrency(getTotalChange())}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Datos del Cliente</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="Juan Pérez / Empresa SA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">DNI / CUIT</label>
                  <input
                    type="text"
                    value={client.cuit}
                    onChange={(e) => setClient({ ...client, cuit: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Av. Siempreviva 742"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={client.phone}
                    onChange={(e) => setClient({ ...client, phone: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="11-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Condición frente al IVA</label>
                <select
                  value={client.ivaCondition}
                  onChange={(e) => setClient({ ...client, ivaCondition: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="consumidor_final">Consumidor Final</option>
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="monotributo">Monotributo</option>
                  <option value="exento">Exento</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow"
                >
                  Guardar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Productos */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Buscar Producto</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-300">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  placeholder="Buscar por nombre o código de barras..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg group-hover:text-blue-700">{product.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Código: {product.barcode}</span>
                          <span className={`${product.stock > 10 ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No se encontraron productos</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-300">
              <button
                onClick={() => setShowProductModal(false)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tipo de Tarjeta */}
      {showCardTypeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold">Tipo de Tarjeta</h3>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => confirmCardType('Débito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Débito</p>
                <p className="text-sm text-gray-600">Cobro inmediato</p>
              </button>
              <button
                onClick={() => confirmCardType('Crédito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Crédito</p>
                <p className="text-sm text-gray-600">Pago diferido</p>
              </button>
              <button
                onClick={() => setShowCardTypeModal(false)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className={`${PAYMENT_METHODS[selectedPaymentMethod.toUpperCase()]?.color || 'bg-blue-600'} text-white px-6 py-4 rounded-t-xl`}>
              <h3 className="text-xl font-bold capitalize">
                Pago con {selectedPaymentMethod} {cardType && `- ${cardType}`}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {selectedPaymentMethod === 'efectivo' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total a pagar</label>
                    <div className="text-4xl font-bold text-center text-blue-700 p-4 bg-blue-50 rounded-lg">
                      {formatCurrency(totals.total)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Efectivo recibido</label>
                    <input
                      ref={cashReceivedRef}
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  {cashReceived && parseFloat(cashReceived) >= totals.total && (
                    <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg">
                      <p className="text-sm font-bold text-green-800 text-center">VUELTO</p>
                      <p className="text-3xl font-bold text-green-900 text-center">
                        {formatCurrency(calculateChange())}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monto a cobrar</label>
                  <input
                    ref={paymentAmountRef}
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-blue-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMethod(null);
                    setCashReceived('');
                    setCardType('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={addPayment}
                  disabled={
                    (selectedPaymentMethod === 'efectivo' && (!cashReceived || parseFloat(cashReceived) < totals.total)) ||
                    (selectedPaymentMethod !== 'efectivo' && !paymentAmount)
                  }
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold transition shadow"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal AFIP */}
      {showAfipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Conectando con AFIP</h3>
            <p className="text-gray-600 mb-4">Procesando factura electrónica...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impresión */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center gap-3">
              <Check className="w-8 h-8" />
              <h3 className="text-xl font-bold">¡Venta Completada!</h3>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-600 mb-4">¿Cómo desea imprimir el comprobante?</p>
              <div className="space-y-2">
                <button
                  onClick={() => handlePrint('thermal-58')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 58mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica pequeña</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('thermal-80')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 80mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica estándar</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('a4')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Factura A4</p>
                    <p className="text-sm text-gray-600">Formato completo</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('whatsapp')}
                  className="w-full p-4 border-2 border-green-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition flex items-center gap-3"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por WhatsApp</p>
                    <p className="text-sm text-gray-600">Compartir comprobante</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('email')}
                  className="w-full p-4 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition flex items-center gap-3"
                >
                  <Mail className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por Email</p>
                    <p className="text-sm text-gray-600">Correo electrónico</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;, '').replace('+', '').replace('-', ''));
        if (modifier.startsWith('+')) {
          finalPrice += amount;
        } else if (modifier.startsWith('-')) {
          finalPrice -= amount;
        }
      } else {
        const value = parseFloat(modifier.replace('+', '').replace('-', ''));
        if (modifier.startsWith('+')) {
          finalPrice = finalPrice * (1 + value / 100);
        } else if (modifier.startsWith('-')) {
          finalPrice = finalPrice * (1 - value / 100);
        }
      }
    }

    const quantity = parseFloat(editingItem.quantity) || 1;
    const subtotal = finalPrice * quantity;

    setItems(items.map(item => 
      item.id === editingItem.id 
        ? {
            ...item,
            price: finalPrice,
            quantity: quantity,
            modifier: editingItem.modifier,
            subtotal: subtotal,
          }
        : item
    ));

    setShowEditItemModal(false);
    setEditingItem(null);
  };

  // Calcular totales
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    let iva = 0;
    let neto = subtotal;
    let total = subtotal;

    // Si es Factura A, discriminar IVA (el precio ya incluye IVA)
    if (invoiceType === 'A') {
      neto = subtotal / 1.21;
      iva = subtotal - neto;
      total = subtotal;
    }

    return { subtotal, neto, iva, total };
  };

  const totals = calculateTotals();

  // Abrir modal de pago según método
  const openPaymentModal = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentAmount(totals.total.toFixed(2));
    
    if (method === 'tarjeta') {
      setShowCardTypeModal(true);
    } else if (method === 'efectivo') {
      setCashReceived('');
      setShowPaymentModal(true);
      setTimeout(() => cashReceivedRef.current?.focus(), 100);
    } else {
      setShowPaymentModal(true);
      setTimeout(() => paymentAmountRef.current?.focus(), 100);
    }
  };

  // Confirmar tipo de tarjeta
  const confirmCardType = (type) => {
    setCardType(type);
    setShowCardTypeModal(false);
    setShowPaymentModal(true);
    setTimeout(() => paymentAmountRef.current?.focus(), 100);
  };

  // Agregar pago
  const addPayment = () => {
    if (!selectedPaymentMethod) return;

    let amount = 0;
    
    if (selectedPaymentMethod === 'efectivo') {
      if (!cashReceived) return;
      amount = parseFloat(paymentAmount);
    } else {
      if (!paymentAmount) return;
      amount = parseFloat(paymentAmount);
    }

    const newPayment = {
      id: Date.now(),
      method: selectedPaymentMethod,
      cardType: cardType,
      amount: amount,
      received: selectedPaymentMethod === 'efectivo' ? parseFloat(cashReceived) : amount,
    };

    setPayments([...payments, newPayment]);
    
    // Cambiar a Factura C si no es efectivo y está en X
    if (selectedPaymentMethod !== 'efectivo' && invoiceType === 'X') {
      setInvoiceType('C');
    }

    // Cerrar modales
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setPaymentAmount('');
    setCashReceived('');
    setCardType('');
  };

  // Calcular cambio
  const calculateChange = () => {
    const totalPaid = parseFloat(cashReceived) || 0;
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  // Verificar si puede facturar con AFIP
  const canInvoiceAfip = () => {
    const hasNonCashPayment = payments.some(p => p.method !== 'efectivo');
    return hasNonCashPayment && ['A', 'B', 'C'].includes(invoiceType);
  };

  // Facturar con AFIP
  const invoiceWithAfip = () => {
    setShowAfipModal(true);
    
    setTimeout(() => {
      setShowAfipModal(false);
      completeSale();
    }, 3000);
  };

  // Completar venta
  const completeSale = () => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid < totals.total) {
      alert('El monto pagado es menor al total de la venta');
      return;
    }

    console.log('Venta completada:', {
      client,
      invoiceType,
      invoiceNumber: invoiceCounters[invoiceType],
      items,
      totals,
      payments,
    });

    setShowPrintModal(true);
  };

  // Imprimir y resetear
  const handlePrint = (type) => {
    console.log('Imprimiendo:', type);
    
    // Incrementar contador
    setInvoiceCounters(prev => ({
      ...prev,
      [invoiceType]: prev[invoiceType] + 1,
    }));
    
    // Resetear todo
    setItems([]);
    setPayments([]);
    setClient({
      name: 'Consumidor Final',
      type: 'consumidor_final',
      cuit: '',
      address: '',
      phone: '',
      email: '',
      ivaCondition: 'consumidor_final',
    });
    setInvoiceType('X');
    setCurrentProduct({ name: '', price: '', quantity: '1', modifier: '' });
    setShowPrintModal(false);
    
    clientInputRef.current?.focus();
  };

  // Obtener cambio total
  const getTotalChange = () => {
    const totalPaid = payments.reduce((sum, p) => sum + (p.received || p.amount), 0);
    const change = totalPaid - totals.total;
    return change > 0 ? change : 0;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Facturador</h1>
              <p className="text-sm opacity-90">
                {INVOICE_TYPES[invoiceType].name} Nº {String(invoiceCounters[invoiceType]).padStart(8, '0')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Object.entries(INVOICE_TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setInvoiceType(key)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  invoiceType === key
                    ? 'bg-white text-blue-700 shadow-lg scale-105'
                    : 'bg-blue-500 hover:bg-blue-400 text-white'
                }`}
              >
                {type.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel Principal */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Cliente y Producto */}
          <div className="border-b border-gray-300 p-4 space-y-3 bg-gray-50">
            {/* Cliente */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Cliente (Enter: Consumidor Final | F2: Datos completos)
                </label>
                <input
                  ref={clientInputRef}
                  type="text"
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  onKeyDown={handleClientKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none font-medium"
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>

            {/* Producto */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Producto / Código de Barras (F3: Buscar)
                </label>
                <input
                  ref={productNameRef}
                  type="text"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  onKeyDown={handleProductNameKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre o escanee código"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Precio $</label>
                <input
                  ref={productPriceRef}
                  type="number"
                  value={currentProduct.price}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                  onKeyDown={handlePriceKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-right font-bold"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cantidad</label>
                <input
                  ref={productQuantityRef}
                  type="number"
                  value={currentProduct.quantity}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: e.target.value })}
                  onKeyDown={handleQuantityKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center font-bold"
                  placeholder="1"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Ajuste ±%/$
                </label>
                <input
                  ref={productModifierRef}
                  type="text"
                  value={currentProduct.modifier}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, modifier: e.target.value })}
                  onKeyDown={handleModifierKeyDown}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center"
                  placeholder="+10% -$20"
                />
              </div>

              <div className="col-span-1 flex items-end">
                <button
                  onClick={addProductToList}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition flex items-center justify-center shadow"
                  title="Agregar producto (Enter)"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase w-12">#</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-24">Cant.</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">Precio</th>
                  {invoiceType === 'A' && (
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-32">IVA</th>
                  )}
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase w-40">Subtotal</th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={invoiceType === 'A' ? 7 : 6} className="text-center py-20">
                      <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-400 font-medium">No hay productos agregados</p>
                      <p className="text-gray-400 text-sm">Escanee o busque productos para comenzar</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const itemNeto = invoiceType === 'A' ? item.subtotal / 1.21 : item.subtotal;
                    const itemIva = invoiceType === 'A' ? item.subtotal - itemNeto : 0;
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-bold text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.modifier && (
                            <p className="text-xs text-blue-600">Ajuste: {item.modifier}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{item.quantity.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        {invoiceType === 'A' && (
                          <td className="px-4 py-3 text-right text-sm text-green-700 font-medium">
                            {formatCurrency(itemIva)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-bold text-lg text-blue-700">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Derecho - Totales y Pagos */}
        <div className="w-96 bg-white border-l-4 border-blue-600 flex flex-col shadow-xl">
          {/* Totales */}
          <div className="p-4 border-b-2 border-gray-300 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Totales</h3>
            
            {invoiceType === 'A' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Neto:</span>
                  <span className="font-bold">{formatCurrency(totals.neto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA 21%:</span>
                  <span className="font-bold text-green-600">{formatCurrency(totals.iva)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                  <span className="text-3xl font-bold text-blue-700">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                <span className="text-4xl font-bold text-blue-700">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            )}
          </div>

          {/* Métodos de Pago */}
          <div className="p-4 border-b-2 border-gray-300">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Formas de Pago</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                <button
                  key={key}
                  onClick={() => openPaymentModal(method.code)}
                  disabled={items.length === 0}
                  className={`${method.color} hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-lg transition shadow-md flex flex-col items-center gap-2`}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pagos Registrados */}
          {payments.length > 0 && (
            <div className="p-4 border-b-2 border-gray-300 max-h-40 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Pagos:</h3>
              <div className="space-y-1">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium capitalize">
                      {payment.method} {payment.cardType && `(${payment.cardType})`}
                    </span>
                    <span className="font-bold text-green-700">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón AFIP */}
          {canInvoiceAfip() && (
            <div className="p-4">
              <button
                onClick={invoiceWithAfip}
                disabled={items.length === 0 || payments.length === 0}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Facturar con AFIP
              </button>
            </div>
          )}

          {/* Botón Completar Venta */}
          <div className="mt-auto p-4">
            <button
              onClick={completeSale}
              disabled={items.length === 0 || payments.length === 0}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6" />
              COMPLETAR VENTA
            </button>
            {getTotalChange() > 0 && (
              <div className="mt-2 p-2 bg-yellow-100 border-2 border-yellow-400 rounded text-center">
                <p className="text-xs font-bold text-yellow-800">VUELTO</p>
                <p className="text-lg font-bold text-yellow-900">{formatCurrency(getTotalChange())}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Datos del Cliente</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="Juan Pérez / Empresa SA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">DNI / CUIT</label>
                  <input
                    type="text"
                    value={client.cuit}
                    onChange={(e) => setClient({ ...client, cuit: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Av. Siempreviva 742"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={client.phone}
                    onChange={(e) => setClient({ ...client, phone: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="11-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Condición frente al IVA</label>
                <select
                  value={client.ivaCondition}
                  onChange={(e) => setClient({ ...client, ivaCondition: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="consumidor_final">Consumidor Final</option>
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="monotributo">Monotributo</option>
                  <option value="exento">Exento</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow"
                >
                  Guardar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Productos */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold">Buscar Producto</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-300">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  placeholder="Buscar por nombre o código de barras..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg group-hover:text-blue-700">{product.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Código: {product.barcode}</span>
                          <span className={`${product.stock > 10 ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No se encontraron productos</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-300">
              <button
                onClick={() => setShowProductModal(false)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tipo de Tarjeta */}
      {showCardTypeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold">Tipo de Tarjeta</h3>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => confirmCardType('Débito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Débito</p>
                <p className="text-sm text-gray-600">Cobro inmediato</p>
              </button>
              <button
                onClick={() => confirmCardType('Crédito')}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
              >
                <p className="font-bold text-lg">Tarjeta de Crédito</p>
                <p className="text-sm text-gray-600">Pago diferido</p>
              </button>
              <button
                onClick={() => setShowCardTypeModal(false)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className={`${PAYMENT_METHODS[selectedPaymentMethod.toUpperCase()]?.color || 'bg-blue-600'} text-white px-6 py-4 rounded-t-xl`}>
              <h3 className="text-xl font-bold capitalize">
                Pago con {selectedPaymentMethod} {cardType && `- ${cardType}`}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {selectedPaymentMethod === 'efectivo' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total a pagar</label>
                    <div className="text-4xl font-bold text-center text-blue-700 p-4 bg-blue-50 rounded-lg">
                      {formatCurrency(totals.total)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Efectivo recibido</label>
                    <input
                      ref={cashReceivedRef}
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-green-500 focus:outline-none"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  {cashReceived && parseFloat(cashReceived) >= totals.total && (
                    <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg">
                      <p className="text-sm font-bold text-green-800 text-center">VUELTO</p>
                      <p className="text-3xl font-bold text-green-900 text-center">
                        {formatCurrency(calculateChange())}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monto a cobrar</label>
                  <input
                    ref={paymentAmountRef}
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-3xl font-bold text-center focus:border-blue-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMethod(null);
                    setCashReceived('');
                    setCardType('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={addPayment}
                  disabled={
                    (selectedPaymentMethod === 'efectivo' && (!cashReceived || parseFloat(cashReceived) < totals.total)) ||
                    (selectedPaymentMethod !== 'efectivo' && !paymentAmount)
                  }
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold transition shadow"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal AFIP */}
      {showAfipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Conectando con AFIP</h3>
            <p className="text-gray-600 mb-4">Procesando factura electrónica...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impresión */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center gap-3">
              <Check className="w-8 h-8" />
              <h3 className="text-xl font-bold">¡Venta Completada!</h3>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-600 mb-4">¿Cómo desea imprimir el comprobante?</p>
              <div className="space-y-2">
                <button
                  onClick={() => handlePrint('thermal-58')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 58mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica pequeña</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('thermal-80')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <Printer className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Ticket Térmico 80mm</p>
                    <p className="text-sm text-gray-600">Impresora térmica estándar</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('a4')}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <p className="font-bold">Factura A4</p>
                    <p className="text-sm text-gray-600">Formato completo</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('whatsapp')}
                  className="w-full p-4 border-2 border-green-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition flex items-center gap-3"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por WhatsApp</p>
                    <p className="text-sm text-gray-600">Compartir comprobante</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('email')}
                  className="w-full p-4 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition flex items-center gap-3"
                >
                  <Mail className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-bold">Enviar por Email</p>
                    <p className="text-sm text-gray-600">Correo electrónico</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;