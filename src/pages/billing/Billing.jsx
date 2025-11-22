import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  Printer,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  User,
  ShoppingCart,
  FileText,
  DollarSign,
  X,
  Save,
  Mail,
  MessageCircle,
  Smartphone,
  ArrowRight,
  Barcode,
  Calculator,
  Receipt,
  Building2,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrentUser, useCurrentBranch } from '../../store/slices/authSlice';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { INVOICE_TYPES, PAYMENT_METHODS, IVA_CONDITIONS } from '../../utils/constants';

// --- DATOS INICIALES ---
const INITIAL_PRODUCTS = [
  { id: '101', code: '779001', name: 'Coca Cola 2.25L', price: 2500, stock: 50, iva: 21, category: 'Bebidas' },
  { id: '102', code: '779002', name: 'Fernet Branca 750ml', price: 9500, stock: 24, iva: 21, category: 'Bebidas' },
  { id: '103', code: '779003', name: 'Pan Lactal Blanco', price: 1800, stock: 10, iva: 10.5, category: 'Panadería' },
  { id: '104', code: 'SERV01', name: 'Servicio Genérico', price: 1000, stock: 999, iva: 21, category: 'Servicios' },
  { id: '105', code: '779004', name: 'Leche Entera 1L', price: 850, stock: 30, iva: 21, category: 'Lácteos' },
];

const CONSUMIDOR_FINAL = {
  id: 'C0',
  name: 'CONSUMIDOR FINAL',
  docType: 'DNI',
  docNum: '0',
  condition: 'Final',
  address: '',
  city: '-',
};

const INITIAL_CLIENTS = [
  CONSUMIDOR_FINAL,
  {
    id: 'C1',
    name: 'Tech Solutions S.A.',
    docType: 'CUIT',
    docNum: '30-71000000-1',
    condition: 'RI',
    address: 'Av. Corrientes 1234',
    city: 'CABA',
  },
  {
    id: 'C2',
    name: 'Juan Pérez',
    docType: 'DNI',
    docNum: '25123456',
    condition: 'Monotributo',
    address: 'Calle Falsa 123',
    city: 'Zárate',
  },
];

// --- COMPONENTE PRINCIPAL ---
export default function Billing() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const branch = useCurrentBranch();

  // Estados principales
  const [items, setItems] = useState([]);
  const [selectedClient, setSelectedClient] = useState(CONSUMIDOR_FINAL);
  const [products] = useState(INITIAL_PRODUCTS);
  const [clients] = useState(INITIAL_CLIENTS);

  // Configuración de factura
  const [invoiceType, setInvoiceType] = useState('X');
  const [posNumber] = useState(1);
  const [counters, setCounters] = useState({ afip: 1024, x: 50, presupuesto: 200 });

  // UI States
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [showProdList, setShowProdList] = useState(false);

  // Línea de carga de productos
  const [entryItem, setEntryItem] = useState({
    id: null,
    code: '',
    name: '',
    quantity: 1,
    price: 0,
    discount: 0,
    stock: 0,
    iva: 21,
    isGeneric: false,
  });

  // Estados de pago
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [printFormat, setPrintFormat] = useState('80mm');

  // Estados para notificaciones de pago
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [paymentNotification, setPaymentNotification] = useState(null);

  // Referencias
  const clientInputRef = useRef(null);
  const prodInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const discInputRef = useRef(null);

  // --- CALCULOS ---
  const currentNumber = useMemo(() => {
    if (['A', 'B', 'C'].includes(invoiceType)) return counters.afip;
    if (invoiceType === 'X') return counters.x;
    return counters.presupuesto;
  }, [invoiceType, counters]);

  const totals = useMemo(() => {
    let subtotalNeto = 0;
    let totalIva = 0;
    let totalFinal = 0;

    items.forEach((item) => {
      const discountFactor = 1 - (item.discount || 0) / 100;
      const finalUnitPrice = item.price * discountFactor;
      const lineTotal = finalUnitPrice * item.quantity;
      totalFinal += lineTotal;

      if (invoiceType === 'A') {
        const ivaRate = (item.iva || 21) / 100;
        const netAmount = lineTotal / (1 + ivaRate);
        subtotalNeto += netAmount;
        totalIva += lineTotal - netAmount;
      }
    });

    return {
      subtotalNeto,
      totalIva,
      total: totalFinal,
      totalPagado: payments.reduce((acc, p) => acc + p.amount, 0),
    };
  }, [items, payments, invoiceType]);

  // --- LÓGICA AUTOMÁTICA DE TIPO DE COMPROBANTE ---
  useEffect(() => {
    if (payments.length === 0) {
      // Sin pagos aún, mantener el tipo según cliente
      if (selectedClient.condition === 'RI') {
        setInvoiceType('A');
      } else {
        setInvoiceType('X');
      }
      return;
    }

    const hasNonCash = payments.some((p) => p.method !== 'Efectivo');

    if (hasNonCash) {
      // Hay al menos un pago que NO es efectivo → Factura Fiscal
      const fiscalType = selectedClient.condition === 'RI' ? 'A' : 'B';
      if (invoiceType !== fiscalType) {
        setInvoiceType(fiscalType);
        toast(`Cambiado automáticamente a Factura ${fiscalType} por método de pago no efectivo`); 
      }
    } else {
      // TODOS los pagos son efectivo → Factura X
      if (invoiceType !== 'X') {
        setInvoiceType('X');
        toast('Cambiado automáticamente a Factura X (todos los pagos en efectivo)', {
  icon: 'ℹ️',
});
      }
    }
  }, [payments, selectedClient.condition]);

  // --- SIMULACIÓN DE NOTIFICACIONES DE MERCADO PAGO ---
  useEffect(() => {
    if (!waitingForPayment) return;

    // Simulación: después de 3 segundos llega la notificación de pago
    const timer = setTimeout(() => {
      const paymentInfo = {
        type: paymentMethod === 'QR (Mercado Pago)' ? 'QR' : 'Transferencia',
        amount: parseFloat(paymentAmount),
        status: 'approved',
        timestamp: new Date(),
      };

      setPaymentNotification(paymentInfo);
      setWaitingForPayment(false);

      // Agregar el pago automáticamente
      handleConfirmPaymentNotification(paymentInfo);

      // Toast de éxito
      toast.success(
        `💳 Pago ${paymentInfo.type} recibido: ${formatCurrency(paymentInfo.amount)}`,
        { duration: 5000 }
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [waitingForPayment]);

  // --- HANDLERS CLIENTE ---
  const handleClientKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (!clientSearch.trim()) {
        handleClientSelect(CONSUMIDOR_FINAL);
      } else {
        const match = clients.find((c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase())
        );
        if (match) handleClientSelect(match);
        else setShowClientList(true);
      }
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setClientSearch('');
    setShowClientList(false);

    // Establecer tipo de factura por defecto según cliente
    if (payments.length === 0) {
      if (client.condition === 'RI') setInvoiceType('A');
      else setInvoiceType('X');
    }

    setTimeout(() => prodInputRef.current?.focus(), 100);
  };

  // --- HANDLERS PRODUCTO ---
  const prepareEntryItem = (product, isGeneric = false) => {
    setEntryItem({
      id: isGeneric ? null : product.id,
      code: isGeneric ? 'GEN' : product.code,
      name: isGeneric ? prodSearch : product.name,
      quantity: 1,
      price: isGeneric ? 0 : product.price,
      discount: 0,
      stock: isGeneric ? 999 : product.stock,
      iva: isGeneric ? 21 : product.iva,
      isGeneric,
    });

    setProdSearch(isGeneric ? prodSearch : product.name);
    setShowProdList(false);
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  const handleProdKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (!prodSearch.trim()) return;
      const exactMatch = products.find(
        (p) =>
          p.code === prodSearch ||
          p.name.toLowerCase() === prodSearch.toLowerCase()
      );
      if (exactMatch) {
        prepareEntryItem(exactMatch);
      } else {
        prepareEntryItem(null, true);
      }
    }
  };

  const commitEntryItem = () => {
    if (!entryItem.name) return;

    const newItem = {
      ...entryItem,
      id: entryItem.id || `gen-${Date.now()}`,
      price: parseFloat(entryItem.price) || 0,
      quantity: parseFloat(entryItem.quantity) || 1,
      discount: parseFloat(entryItem.discount) || 0,
    };

    setItems([...items, newItem]);

    setEntryItem({
      id: null,
      code: '',
      name: '',
      quantity: 1,
      price: 0,
      discount: 0,
      stock: 0,
      iva: 21,
      isGeneric: false,
    });
    setProdSearch('');

    setTimeout(() => prodInputRef.current?.focus(), 50);
  };

  const updateGridItem = (id, field, value) => {
    setItems(
      items.map((i) => {
        if (i.id !== id) return i;
        return { ...i, [field]: parseFloat(value) || 0 };
      })
    );
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((i) => i.id !== id));
  };

  // --- PAGOS ---
  const handleAddPayment = () => {
    const val = parseFloat(paymentAmount);
    if (!val || val <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    // Si es Mercado Pago (QR o Transferencia), iniciar espera de notificación
    if (paymentMethod === 'QR (Mercado Pago)' || paymentMethod === 'Transferencia (MP)') {
      setWaitingForPayment(true);
      toast.loading('Esperando confirmación de pago...', { duration: 3000 });
      return;
    }

    // Pago normal (Efectivo, Tarjeta, etc.)
    const newPayment = { method: paymentMethod, amount: val };
    setPayments([...payments, newPayment]);
    setPaymentAmount('');
    toast.success(`Pago agregado: ${formatCurrency(val)}`);
  };

  const handleConfirmPaymentNotification = (paymentInfo) => {
    const newPayment = {
      method: paymentInfo.type === 'QR' ? 'QR (Mercado Pago)' : 'Transferencia (MP)',
      amount: paymentInfo.amount,
      status: paymentInfo.status,
      timestamp: paymentInfo.timestamp,
    };

    setPayments([...payments, newPayment]);
    setPaymentAmount('');
    setPaymentNotification(null);
  };

  const handleRemovePayment = (index) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };

  const handleConfirmSale = async () => {
    // Validaciones
    if (items.length === 0) {
      toast.error('Agregue al menos un producto');
      return;
    }

    if (totals.totalPagado < totals.total - 0.1) {
      toast.error('El pago es insuficiente');
      return;
    }

    // Validación de seguridad
    if (invoiceType === 'X' && payments.some((p) => p.method !== 'Efectivo')) {
      toast.error('⚠️ No se puede emitir Factura X con pagos no efectivo');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise((r) => setTimeout(r, 1500));

      const finalData = {
        client: selectedClient,
        items,
        totals,
        payments,
        type: invoiceType,
        number: currentNumber,
        pos: posNumber,
        date: new Date(),
        cae: ['A', 'B', 'C'].includes(invoiceType) ? '73459823475234' : null,
        caeVto: ['A', 'B', 'C'].includes(invoiceType) ? '2025-12-31' : null,
      };

      // Actualizar contadores
      setCounters((prev) => {
        if (['A', 'B', 'C'].includes(invoiceType))
          return { ...prev, afip: prev.afip + 1 };
        if (invoiceType === 'X') return { ...prev, x: prev.x + 1 };
        return { ...prev, presupuesto: prev.presupuesto + 1 };
      });

      setSuccessData(finalData);
      toast.success('¡Venta registrada exitosamente!');
    } catch (error) {
      toast.error('Error al procesar la venta');
      console.error(error);
    } finally {
      setIsProcessing(false);
      setPaymentModalOpen(false);
    }
  };

  const resetAll = () => {
    setItems([]);
    setPayments([]);
    setSelectedClient(CONSUMIDOR_FINAL);
    setSuccessData(null);
    setInvoiceType('X');
    setProdSearch('');
    setEntryItem({
      id: null,
      code: '',
      name: '',
      quantity: 1,
      price: 0,
      discount: 0,
      stock: 0,
      iva: 21,
      isGeneric: false,
    });
  };

  // --- VISTA DE ÉXITO ---
  if (successData) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 overflow-y-auto">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[90vh]">
          <div className="bg-green-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CheckCircle size={28} />
              <span className="font-bold text-lg">Venta Registrada</span>
            </div>
            <button
              onClick={resetAll}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Nueva
            </button>
          </div>

          <div className="p-4 bg-slate-100 border-b flex flex-wrap gap-3 justify-center items-center">
            <div className="flex gap-1">
              <button
                onClick={() => setPrintFormat('58mm')}
                className={`px-3 py-1 text-sm rounded-l border ${
                  printFormat === '58mm'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                58mm
              </button>
              <button
                onClick={() => setPrintFormat('80mm')}
                className={`px-3 py-1 text-sm border-t border-b ${
                  printFormat === '80mm'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                80mm
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1 text-sm rounded-r border ${
                  printFormat === 'a4'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                A4
              </button>
            </div>

            <div className="w-px h-6 bg-slate-300 mx-2"></div>

            <button className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 shadow-sm transition-colors text-sm font-medium">
              <MessageCircle size={16} /> WhatsApp
            </button>
            <button className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-sm transition-colors text-sm font-medium">
              <Mail size={16} /> Email
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-800 shadow-sm transition-colors text-sm font-medium"
            >
              <Printer size={16} /> Imprimir
            </button>
          </div>

          <div className="flex-1 bg-slate-200 p-8 overflow-y-auto flex justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">MI NEGOCIO S.A.</h2>
                <p className="text-sm text-gray-600">IVA Responsable Inscripto</p>
                <div className="my-4 py-2 border-y">
                  <p className="font-bold text-lg">
                    {successData.type === 'P'
                      ? 'PRESUPUESTO'
                      : successData.type === 'X'
                      ? 'COMPROBANTE X'
                      : `FACTURA "${successData.type}"`}
                  </p>
                  <p className="text-sm">
                    N°: {String(successData.pos).padStart(4, '0')}-
                    {String(successData.number).padStart(8, '0')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(successData.date)}
                  </p>
                </div>
              </div>

              <div className="mb-4 text-sm">
                <p>
                  <strong>Cliente:</strong> {successData.client.name}
                </p>
                <p>
                  <strong>Documento:</strong> {successData.client.docNum}
                </p>
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
                  {successData.items.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{item.name}</td>
                      <td className="text-center p-2">{item.quantity}</td>
                      <td className="text-right p-2">
                        {formatCurrency(
                          item.price * (1 - item.discount / 100)
                        )}
                      </td>
                      <td className="text-right p-2 font-bold">
                        {formatCurrency(
                          item.price * item.quantity * (1 - item.discount / 100)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t-2 pt-4 text-right">
                <p className="text-2xl font-bold mb-4">
                  TOTAL: {formatCurrency(successData.totals.total)}
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p className="font-bold mb-2">Detalle de Pagos:</p>
                  {successData.payments.map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{p.method}</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500">
                Gracias por su compra
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL DE FACTURACIÓN ---
  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* HEADER */}
      <header className="bg-white border-b px-4 py-3 shrink-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Tipo de comprobante */}
            <div className="relative group">
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value)}
                className={`appearance-none font-bold text-xl text-white text-center w-14 h-12 rounded cursor-pointer outline-none ${
                  invoiceType === 'A'
                    ? 'bg-purple-600'
                    : invoiceType === 'B'
                    ? 'bg-blue-600'
                    : invoiceType === 'X'
                    ? 'bg-slate-600'
                    : invoiceType === 'P'
                    ? 'bg-orange-500'
                    : 'bg-teal-600'
                }`}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="X">X</option>
                <option value="P">P</option>
              </select>
            </div>

            {/* Número de comprobante */}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold">
                N° COMPROBANTE
              </span>
              <span className="font-mono font-bold text-lg leading-none">
                {String(posNumber).padStart(4, '0')}-
                {String(currentNumber).padStart(8, '0')}
              </span>
            </div>

            <div className="w-px h-8 bg-slate-200 mx-2" />

            {/* Buscador de cliente */}
            <div className="relative flex-1 max-w-md">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                ref={clientInputRef}
                type="text"
                placeholder="Buscar Cliente..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={
                  selectedClient.id === 'C0' && !clientSearch
                    ? ''
                    : clientSearch || selectedClient.name
                }
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  if (!e.target.value) setSelectedClient(CONSUMIDOR_FINAL);
                  setShowClientList(true);
                }}
                onKeyDown={handleClientKeyDown}
                onFocus={() => setShowClientList(true)}
              />
              {selectedClient.id !== 'C0' && !clientSearch && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-blue-800 px-2 rounded">
                  {selectedClient.condition}
                </div>
              )}
              {showClientList && (
                <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-b-lg border mt-1 z-50 max-h-60 overflow-y-auto">
                  {clients
                    .filter((c) =>
                      c.name.toLowerCase().includes(clientSearch.toLowerCase())
                    )
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleClientSelect(c)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b flex justify-between"
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-slate-400">{c.docNum}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Info de usuario y sucursal */}
          <div className="flex items-center gap-4">
            {branch && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Building2 size={16} />
                <span>{branch.name}</span>
              </div>
            )}
            <div className="text-right text-xs text-slate-500">
              <p className="font-bold">{user?.fullName}</p>
              <p>{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* BARRA DE CARGA ACTIVA */}
          <div className="bg-white p-2 rounded-lg shadow-sm border border-blue-200 mb-4 flex gap-2 items-center">
            {/* Buscador */}
            <div className="flex-[3] relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={18} />
              </div>
              <input
                ref={prodInputRef}
                type="text"
                className="w-full pl-9 pr-3 py-2 text-lg bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-bold text-slate-700"
                placeholder="Buscar producto o escribir nuevo..."
                value={prodSearch}
                onChange={(e) => {
                  setProdSearch(e.target.value);
                  setShowProdList(true);
                }}
                onKeyDown={handleProdKeyDown}
              />
              {showProdList && prodSearch && (
                <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-b-lg border mt-1 z-40 max-h-60 overflow-y-auto">
                  {products
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
                        p.code.includes(prodSearch)
                    )
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => prepareEntryItem(p)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold">{p.name}</div>
                          <div className="text-xs text-slate-500">
                            {p.code} | Stock: {p.stock}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">
                            {formatCurrency(p.price)}
                          </div>
                        </div>
                      </button>
                    ))}
                  {products.filter(
                    (p) =>
                      p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
                      p.code.includes(prodSearch)
                  ).length === 0 && (
                    <div className="p-3 text-center text-sm text-slate-500">
                      Enter para usar nombre genérico
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cantidad */}
            <div className="flex-[1] min-w-[80px]">
              <div className="text-[10px] text-slate-500 font-bold pl-1">
                CANT
              </div>
              <input
                ref={qtyInputRef}
                type="number"
                min="1"
                className="w-full py-2 px-2 text-center text-lg font-bold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={entryItem.quantity}
                onChange={(e) =>
                  setEntryItem({ ...entryItem, quantity: e.target.value })
                }
                onKeyDown={(e) =>
                  e.key === 'Enter' && priceInputRef.current?.focus()
                }
                onFocus={(e) => e.target.select()}
              />
            </div>

            {/* Precio */}
            <div className="flex-[1] min-w-[100px]">
              <div className="text-[10px] text-slate-500 font-bold pl-1">
                PRECIO
              </div>
              <input
                ref={priceInputRef}
                type="number"
                className="w-full py-2 px-2 text-right text-lg font-bold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={entryItem.price}
                onChange={(e) =>
                  setEntryItem({ ...entryItem, price: e.target.value })
                }
                onKeyDown={(e) =>
                  e.key === 'Enter' && discInputRef.current?.focus()
                }
                onFocus={(e) => e.target.select()}
              />
            </div>

            {/* Descuento */}
            <div className="flex-[1] min-w-[80px]">
              <div className="text-[10px] text-slate-500 font-bold pl-1">
                % DESC
              </div>
              <input
                ref={discInputRef}
                type="number"
                placeholder="0"
                className="w-full py-2 px-2 text-right text-lg font-bold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-red-600"
                value={entryItem.discount}
                onChange={(e) =>
                  setEntryItem({ ...entryItem, discount: e.target.value })
                }
                onKeyDown={(e) => e.key === 'Enter' && commitEntryItem()}
                onFocus={(e) => e.target.select()}
              />
            </div>

            {/* Botón agregar */}
            <button
              onClick={commitEntryItem}
              disabled={!prodSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white h-[46px] px-6 rounded font-bold shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center mt-4"
            >
              <Plus size={24} />
            </button>
          </div>

          {/* TABLA DE ITEMS */}
          <div className="flex-1 bg-white rounded-xl shadow border overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-xs uppercase text-slate-500 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3 w-24 text-center">Cant</th>
                    <th className="p-3 w-32 text-right">Precio U.</th>
                    <th className="p-3 w-24 text-right">% Desc</th>
                    <th className="p-3 w-32 text-right">Subtotal</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {items.map((item, idx) => {
                    const factor = 1 - (item.discount || 0) / 100;
                    const lineTotal = item.price * factor * item.quantity;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-50 hover:bg-blue-50/50"
                      >
                        <td className="p-2 text-center text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-2">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.code}
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className="w-full text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none"
                            value={item.quantity}
                            onChange={(e) =>
                              updateGridItem(item.id, 'quantity', e.target.value)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className="w-full text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none"
                            value={item.price}
                            onChange={(e) =>
                              updateGridItem(item.id, 'price', e.target.value)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className={`w-full text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none ${
                              item.discount !== 0
                                ? 'text-red-500 font-bold'
                                : ''
                            }`}
                            value={item.discount}
                            onChange={(e) =>
                              updateGridItem(item.id, 'discount', e.target.value)
                            }
                          />
                        </td>
                        <td className="p-2 text-right font-bold">
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-12 text-center text-slate-400">
                        <ShoppingCart
                          size={48}
                          className="mx-auto mb-2 opacity-20"
                        />
                        <p>Carrito vacío</p>
                        <p className="text-xs mt-2">
                          Escanee o busque productos para comenzar
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTALES */}
          <div className="mt-4 bg-slate-900 text-white rounded-xl p-6 flex justify-between items-center shadow-2xl">
            <div className="flex gap-6 text-sm">
              <div className="text-slate-400">
                <p>
                  Items:{' '}
                  <span className="text-white font-bold">
                    {items.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                </p>
                <p>
                  Tipo:{' '}
                  <span className="text-white font-bold">{invoiceType}</span>
                </p>
              </div>
              {invoiceType === 'A' && (
                <div className="border-l border-slate-700 pl-6 text-slate-400">
                  <p>
                    Neto:{' '}
                    <span className="text-white">
                      {formatCurrency(totals.subtotalNeto)}
                    </span>
                  </p>
                  <p>
                    IVA:{' '}
                    <span className="text-white">
                      {formatCurrency(totals.totalIva)}
                    </span>
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  Total a Pagar
                </div>
                <div className="text-5xl font-bold tracking-tighter text-green-400">
                  {formatCurrency(totals.total)}
                </div>
              </div>
              <button
                onClick={() => {
                  setPaymentAmount((totals.total - totals.totalPagado).toFixed(2));
                  setPaymentModalOpen(true);
                }}
                disabled={items.length === 0}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <DollarSign size={28} /> COBRAR
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE PAGO */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-100 rounded-t-xl">
              <h3 className="font-bold text-lg text-slate-800">
                Procesar Pago
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4 bg-white overflow-y-auto flex-1">
              {/* Total a cobrar */}
              <div className="flex justify-between items-center bg-gradient-to-r from-slate-100 to-slate-50 p-4 rounded-lg border-l-4 border-blue-600">
                <span className="text-slate-600 font-bold">Total a Cobrar</span>
                <span className="text-3xl font-bold text-slate-800">
                  {formatCurrency(totals.total)}
                </span>
              </div>

              {/* Tipo de comprobante actual */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                <FileText className="text-blue-600" size={20} />
                <div className="flex-1">
                  <p className="text-xs text-blue-700 font-bold">
                    Tipo de Comprobante
                  </p>
                  <p className="text-sm font-bold text-blue-900">
                    Factura {invoiceType} -{' '}
                    {invoiceType === 'X' ? 'No Fiscal' : 'Fiscal'}
                  </p>
                </div>
              </div>

              {/* Formulario de pago */}
              <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Método de Pago
                    </label>
                    <select
                      className="w-full p-2 border rounded mt-1 font-medium"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option>Efectivo</option>
                      <option>Tarjeta Débito</option>
                      <option>Tarjeta Crédito</option>
                      <option>QR (Mercado Pago)</option>
                      <option>Transferencia (MP)</option>
                      <option>Transferencia Bancaria</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Monto
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2 text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        className="w-full pl-8 p-2 border rounded font-bold"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddPayment()}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddPayment}
                  disabled={waitingForPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold disabled:bg-slate-400"
                >
                  {waitingForPayment ? 'Esperando pago...' : 'Agregar Pago'}
                </button>
              </div>

              {/* Notificación de espera de pago */}
              {waitingForPayment && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <Clock className="text-yellow-600 animate-spin" size={24} />
                    <div>
                      <p className="font-bold text-yellow-800">
                        Esperando confirmación de pago
                      </p>
                      <p className="text-sm text-yellow-700">
                        Aguardando notificación de Mercado Pago...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notificación de pago recibido */}
              {paymentNotification && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg animate-slide-up">
                  <div className="flex items-center gap-3">
                    <Check className="text-green-600" size={24} />
                    <div className="flex-1">
                      <p className="font-bold text-green-800">
                        ✓ Pago recibido correctamente
                      </p>
                      <p className="text-sm text-green-700">
                        {paymentNotification.type} por{' '}
                        {formatCurrency(paymentNotification.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de pagos */}
              <div className="border rounded bg-white overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-bold text-sm text-slate-700">
                  Pagos Registrados
                </div>
                {payments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <CreditCard size={48} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No hay pagos registrados</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                      <tr>
                        <th className="p-2">Método</th>
                        <th className="p-2 text-right">Monto</th>
                        <th className="p-2 text-center">Estado</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{p.method}</td>
                          <td className="p-2 text-right font-mono font-bold">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="p-2 text-center">
                            {p.status === 'approved' ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Aprobado
                              </span>
                            ) : (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                Registrado
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleRemovePayment(i)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Resumen de pago */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total:</span>
                  <span className="font-bold">{formatCurrency(totals.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Pagado:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(totals.totalPagado)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span
                    className={
                      totals.totalPagado >= totals.total
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    Restante:
                  </span>
                  <span
                    className={
                      totals.totalPagado >= totals.total
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {formatCurrency(totals.total - totals.totalPagado)}
                  </span>
                </div>

                {totals.totalPagado > totals.total && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-green-700 font-bold">
                      Vuelto: {formatCurrency(totals.totalPagado - totals.total)}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleConfirmSale}
                  disabled={
                    totals.totalPagado < totals.total - 0.1 || isProcessing
                  }
                  className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold rounded-lg text-lg shadow flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={24} />
                      CONFIRMAR VENTA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}