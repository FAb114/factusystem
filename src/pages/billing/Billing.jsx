import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useSearchProducts } from '../../hooks/useProducts';
import { formatCurrency, formatInvoiceNumber } from '../../utils/formatters';
import { INVOICE_TYPES, PAYMENT_METHODS, IVA_RATES } from '../../utils/constants';
import toast from 'react-hot-toast';

function Billing() {
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);

  // Estados principales
  const [client, setClient] = useState({
    name: 'Consumidor Final',
    type: 'consumidor_final',
    cuit: '',
    ivaCondition: 'consumidor_final',
  });

  const [invoiceType, setInvoiceType] = useState('FACTURA_B');
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' o 'fixed'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  // Hook para buscar productos
  const { data: searchResults, isLoading: isSearching } = useSearchProducts(
    searchQuery,
    searchQuery.length >= 2
  );

  // Focus en input de código de barras al montar
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Manejar búsqueda de producto
  const handleProductSearch = (query) => {
    setSearchQuery(query);
  };

  // Agregar producto al carrito
  const addProduct = (product) => {
    const existingItem = items.find((item) => item.id === product.id);

    if (existingItem) {
      // Incrementar cantidad
      setItems(
        items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Agregar nuevo producto
      setItems([
        ...items,
        {
          id: product.id,
          name: product.name,
          code: product.code,
          price: product.price,
          quantity: 1,
          ivaRate: product.iva_rate || 21,
          discount: 0,
          imageUrl: product.image_url,
        },
      ]);
    }

    // Limpiar búsqueda
    setSearchQuery('');
    barcodeInputRef.current?.focus();
    
    toast.success(`${product.name} agregado`);
  };

  // Actualizar cantidad de un item
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Actualizar precio de un item
  const updatePrice = (itemId, newPrice) => {
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, price: parseFloat(newPrice) || 0 } : item
      )
    );
  };

  // Remover item
  const removeItem = (itemId) => {
    setItems(items.filter((item) => item.id !== itemId));
    toast.success('Producto eliminado');
  };

  // Calcular subtotal de un item
  const calculateItemSubtotal = (item) => {
    return item.price * item.quantity * (1 - item.discount / 100);
  };

  // Calcular IVA de un item (solo para Factura A)
  const calculateItemIVA = (item) => {
    if (invoiceType !== 'FACTURA_A') return 0;
    
    const subtotal = calculateItemSubtotal(item);
    return subtotal * (item.ivaRate / 100);
  };

  // Calcular totales
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + calculateItemSubtotal(item);
    }, 0);

    const discountAmount =
      discountType === 'percentage'
        ? subtotal * (discount / 100)
        : discount;

    const subtotalAfterDiscount = subtotal - discountAmount;

    const ivaAmount = items.reduce((sum, item) => {
      return sum + calculateItemIVA(item);
    }, 0);

    const total = subtotalAfterDiscount + ivaAmount;

    return {
      subtotal,
      discount: discountAmount,
      subtotalAfterDiscount,
      iva: ivaAmount,
      total,
    };
  };

  const totals = calculateTotals();

  // Manejar selección de cliente
  const handleClientSelect = () => {
    setShowClientModal(true);
  };

  // Manejar cambio de tipo de factura
  const handleInvoiceTypeChange = (type) => {
    setInvoiceType(type);
    
    // Si cambia a Factura A, ajustar precios sin IVA
    if (type === 'FACTURA_A') {
      setItems(
        items.map((item) => ({
          ...item,
          // Extraer IVA del precio
          price: item.price / (1 + item.ivaRate / 100),
        }))
      );
    }
  };

  // Procesar pago
  const handlePayment = (method) => {
    setSelectedPaymentMethod(method);
    setShowPaymentModal(true);
  };

  // Completar venta
  const completeSale = () => {
    if (items.length === 0) {
      toast.error('Agregue al menos un producto');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Seleccione un método de pago');
      return;
    }

    // TODO: Implementar lógica de guardado de venta
    console.log('Venta completada:', {
      client,
      invoiceType,
      items,
      discount,
      totals,
      paymentMethod: selectedPaymentMethod,
    });

    toast.success('Venta registrada exitosamente');

    // Resetear formulario
    setItems([]);
    setDiscount(0);
    setSelectedPaymentMethod(null);
    setClient({
      name: 'Consumidor Final',
      type: 'consumidor_final',
      cuit: '',
      ivaCondition: 'consumidor_final',
    });
    
    barcodeInputRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
            <p className="text-sm text-gray-600 mt-1">
              Nueva venta - {INVOICE_TYPES[invoiceType].name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de tipo de factura */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {Object.keys(INVOICE_TYPES)
                .filter((key) => key.startsWith('FACTURA_'))
                .map((key) => (
                  <button
                    key={key}
                    onClick={() => handleInvoiceTypeChange(key)}
                    className={`px-4 py-2 rounded-md font-medium transition ${
                      invoiceType === key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {INVOICE_TYPES[key].letter}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo - Lista de productos */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Cliente y búsqueda */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-4">
            {/* Cliente */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleClientSelect}
                className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
              >
                <User className="w-5 h-5 text-gray-600" />
                <div className="flex-1 text-left">
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium text-gray-900">{client.name}</p>
                </div>
                <Edit2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Búsqueda de productos */}
            <div className="relative">
              <Input
                ref={barcodeInputRef}
                type="text"
                placeholder="Buscar producto por nombre, código o escanear código de barras..."
                value={searchQuery}
                onChange={(e) => handleProductSearch(e.target.value)}
                icon={Search}
                fullWidth
              />

              {/* Resultados de búsqueda */}
              {searchQuery && searchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.code} • Stock: {product.stock}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lista de items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Package className="w-24 h-24 mb-4" />
                <p className="text-lg font-medium">No hay productos agregados</p>
                <p className="text-sm">
                  Busque o escanee productos para comenzar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-4">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">{item.code}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Cantidad */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded transition"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.id, parseInt(e.target.value) || 0)
                            }
                            className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                            min="1"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded transition"
                          >
                            +
                          </button>
                        </div>

                        {/* Precio */}
                        <div className="w-32">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              updatePrice(item.id, e.target.value)
                            }
                            className="w-full text-right border border-gray-300 rounded px-3 py-2 font-medium"
                            step="0.01"
                          />
                        </div>

                        {/* Subtotal */}
                        <div className="w-32 text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(calculateItemSubtotal(item))}
                          </p>
                          {invoiceType === 'FACTURA_A' && (
                            <p className="text-xs text-gray-500">
                              + IVA {formatCurrency(calculateItemIVA(item))}
                            </p>
                          )}
                        </div>

                        {/* Eliminar */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho - Totales y pago */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Descuento */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Descuento
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                placeholder="0"
                step="0.01"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="percentage">%</option>
                <option value="fixed">$</option>
              </select>
            </div>
          </div>

          {/* Totales */}
          <div className="p-6 space-y-3 border-b border-gray-200">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>

            {totals.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento:</span>
                <span className="font-medium">
                  -{formatCurrency(totals.discount)}
                </span>
              </div>
            )}

            {invoiceType === 'FACTURA_A' && totals.iva > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>IVA (21%):</span>
                <span className="font-medium">{formatCurrency(totals.iva)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Método de Pago
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                <button
                  key={key}
                  onClick={() => handlePayment(method.code)}
                  className={`p-4 border-2 rounded-lg transition ${
                    selectedPaymentMethod === method.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {method.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Botón de completar venta */}
          <div className="p-6 border-t border-gray-200">
            <Button
              onClick={completeSale}
              variant="success"
              size="lg"
              fullWidth
              disabled={items.length === 0 || !selectedPaymentMethod}
              icon={Check}
            >
              Completar Venta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Billing;