/**
 * ===========================================
 * CONSTANTES DEL SISTEMA - FACTUSYSTEM
 * ===========================================
 */

/**
 * Información de la aplicación
 */
export const APP_INFO = {
  NAME: 'FactuSystem',
  VERSION: '2.0.0',
  DESCRIPTION: 'Sistema de Facturación y Gestión Comercial Multisucursal',
  AUTHOR: 'Tu Empresa',
  LICENSE: 'MIT',
};

/**
 * ===========================================
 * CONFIGURACIÓN DE LA APLICACIÓN
 * ===========================================
 */

export const APP_CONFIG = {
  DEFAULT_LANGUAGE: 'es',
  DEFAULT_CURRENCY: 'ARS',
  DEFAULT_TIMEZONE: 'America/Argentina/Buenos_Aires',
  DATE_FORMAT: 'dd/MM/yyyy',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',
  TIME_FORMAT: 'HH:mm',
};

/**
 * ===========================================
 * ROLES Y PERMISOS
 * ===========================================
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  SELLER: 'seller',
  VIEWER: 'viewer',
};

export const PERMISSIONS = {
  // Ventas
  SALES_CREATE: 'sales.create',
  SALES_READ: 'sales.read',
  SALES_UPDATE: 'sales.update',
  SALES_DELETE: 'sales.delete',
  SALES_CANCEL: 'sales.cancel',

  // Productos
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_READ: 'products.read',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',

  // Clientes
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_READ: 'clients.read',
  CLIENTS_UPDATE: 'clients.update',
  CLIENTS_DELETE: 'clients.delete',

  // Caja
  CASH_OPEN: 'cash.open',
  CASH_CLOSE: 'cash.close',
  CASH_MOVEMENTS: 'cash.movements',
  CASH_READ: 'cash.read',

  // Compras
  PURCHASES_CREATE: 'purchases.create',
  PURCHASES_READ: 'purchases.read',
  PURCHASES_UPDATE: 'purchases.update',
  PURCHASES_DELETE: 'purchases.delete',

  // Reportes
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Usuarios
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Configuración
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',

  // Sucursales
  BRANCHES_CREATE: 'branches.create',
  BRANCHES_READ: 'branches.read',
  BRANCHES_UPDATE: 'branches.update',
  BRANCHES_DELETE: 'branches.delete',
};

/**
 * ===========================================
 * TIPOS DE COMPROBANTES (AFIP)
 * ===========================================
 */

export const INVOICE_TYPES = {
  FACTURA_A: { code: '01', name: 'Factura A', letter: 'A' },
  FACTURA_B: { code: '06', name: 'Factura B', letter: 'B' },
  FACTURA_C: { code: '11', name: 'Factura C', letter: 'C' },
  FACTURA_E: { code: '19', name: 'Factura E', letter: 'E' },
  FACTURA_M: { code: '51', name: 'Factura M', letter: 'M' },
  
  NOTA_CREDITO_A: { code: '03', name: 'Nota de Crédito A', letter: 'A' },
  NOTA_CREDITO_B: { code: '08', name: 'Nota de Crédito B', letter: 'B' },
  NOTA_CREDITO_C: { code: '13', name: 'Nota de Crédito C', letter: 'C' },
  
  NOTA_DEBITO_A: { code: '02', name: 'Nota de Débito A', letter: 'A' },
  NOTA_DEBITO_B: { code: '07', name: 'Nota de Débito B', letter: 'B' },
  NOTA_DEBITO_C: { code: '12', name: 'Nota de Débito C', letter: 'C' },
  
  RECIBO: { code: '04', name: 'Recibo', letter: 'R' },
  PRESUPUESTO: { code: '00', name: 'Presupuesto', letter: 'P' },
};

/**
 * ===========================================
 * CONDICIONES DE IVA
 * ===========================================
 */

export const IVA_CONDITIONS = {
  RESPONSABLE_INSCRIPTO: { code: '01', name: 'Responsable Inscripto' },
  MONOTRIBUTO: { code: '06', name: 'Monotributo' },
  EXENTO: { code: '04', name: 'Exento' },
  CONSUMIDOR_FINAL: { code: '05', name: 'Consumidor Final' },
  NO_CATEGORIZADO: { code: '13', name: 'No Categorizado' },
};

/**
 * ===========================================
 * ALÍCUOTAS DE IVA
 * ===========================================
 */

export const IVA_RATES = {
  IVA_0: { rate: 0, code: '03', name: 'IVA 0%' },
  IVA_10_5: { rate: 10.5, code: '04', name: 'IVA 10.5%' },
  IVA_21: { rate: 21, code: '05', name: 'IVA 21%' },
  IVA_27: { rate: 27, code: '06', name: 'IVA 27%' },
  EXENTO: { rate: 0, code: '02', name: 'Exento' },
  NO_GRAVADO: { rate: 0, code: '01', name: 'No Gravado' },
};

/**
 * ===========================================
 * MÉTODOS DE PAGO
 * ===========================================
 */

export const PAYMENT_METHODS = {
  CASH: { code: 'cash', name: 'Efectivo', icon: 'DollarSign' },
  DEBIT_CARD: { code: 'debit_card', name: 'Tarjeta de Débito', icon: 'CreditCard' },
  CREDIT_CARD: { code: 'credit_card', name: 'Tarjeta de Crédito', icon: 'CreditCard' },
  TRANSFER: { code: 'transfer', name: 'Transferencia', icon: 'ArrowRightLeft' },
  MERCADO_PAGO: { code: 'mercado_pago', name: 'Mercado Pago', icon: 'Smartphone' },
  CHECK: { code: 'check', name: 'Cheque', icon: 'FileText' },
  WALLET: { code: 'wallet', name: 'Billetera Virtual', icon: 'Wallet' },
  ACCOUNT: { code: 'account', name: 'Cuenta Corriente', icon: 'BookOpen' },
  GIFT_CARD: { code: 'gift_card', name: 'Gift Card', icon: 'Gift' },
};

/**
 * ===========================================
 * ESTADOS DE VENTA
 * ===========================================
 */

export const SALE_STATUS = {
  PENDING: { code: 'pending', name: 'Pendiente', color: 'warning' },
  COMPLETED: { code: 'completed', name: 'Completada', color: 'success' },
  CANCELLED: { code: 'cancelled', name: 'Cancelada', color: 'danger' },
  REFUNDED: { code: 'refunded', name: 'Reembolsada', color: 'info' },
};

/**
 * ===========================================
 * ESTADOS DE CAJA
 * ===========================================
 */

export const CASH_STATUS = {
  OPEN: { code: 'open', name: 'Abierta', color: 'success' },
  CLOSED: { code: 'closed', name: 'Cerrada', color: 'danger' },
  RECONCILED: { code: 'reconciled', name: 'Conciliada', color: 'info' },
};

/**
 * ===========================================
 * TIPOS DE MOVIMIENTOS DE CAJA
 * ===========================================
 */

export const CASH_MOVEMENT_TYPES = {
  SALE: { code: 'sale', name: 'Venta', type: 'income' },
  REFUND: { code: 'refund', name: 'Reembolso', type: 'expense' },
  WITHDRAWAL: { code: 'withdrawal', name: 'Extracción', type: 'expense' },
  DEPOSIT: { code: 'deposit', name: 'Depósito', type: 'income' },
  EXPENSE: { code: 'expense', name: 'Gasto', type: 'expense' },
  OPENING: { code: 'opening', name: 'Apertura', type: 'income' },
  CLOSING: { code: 'closing', name: 'Cierre', type: 'neutral' },
};

/**
 * ===========================================
 * UNIDADES DE MEDIDA
 * ===========================================
 */

export const UNITS = {
  UNIT: { code: 'un', name: 'Unidad' },
  KG: { code: 'kg', name: 'Kilogramo' },
  G: { code: 'g', name: 'Gramo' },
  L: { code: 'l', name: 'Litro' },
  ML: { code: 'ml', name: 'Mililitro' },
  M: { code: 'm', name: 'Metro' },
  CM: { code: 'cm', name: 'Centímetro' },
  M2: { code: 'm2', name: 'Metro Cuadrado' },
  M3: { code: 'm3', name: 'Metro Cúbico' },
  PACK: { code: 'pack', name: 'Paquete' },
  BOX: { code: 'box', name: 'Caja' },
};

/**
 * ===========================================
 * CATEGORÍAS DE PRODUCTOS (EJEMPLO)
 * ===========================================
 */

export const PRODUCT_CATEGORIES = {
  ELECTRONICS: { code: 'electronics', name: 'Electrónica' },
  CLOTHING: { code: 'clothing', name: 'Indumentaria' },
  FOOD: { code: 'food', name: 'Alimentos' },
  DRINKS: { code: 'drinks', name: 'Bebidas' },
  HOME: { code: 'home', name: 'Hogar' },
  SPORTS: { code: 'sports', name: 'Deportes' },
  TOYS: { code: 'toys', name: 'Juguetes' },
  BOOKS: { code: 'books', name: 'Libros' },
  HEALTH: { code: 'health', name: 'Salud' },
  BEAUTY: { code: 'beauty', name: 'Belleza' },
  AUTOMOTIVE: { code: 'automotive', name: 'Automotor' },
  SERVICES: { code: 'services', name: 'Servicios' },
  OTHER: { code: 'other', name: 'Otros' },
};

/**
 * ===========================================
 * ESTADOS DE STOCK
 * ===========================================
 */

export const STOCK_STATUS = {
  AVAILABLE: { code: 'available', name: 'Disponible', color: 'success' },
  LOW: { code: 'low', name: 'Bajo', color: 'warning' },
  OUT: { code: 'out', name: 'Sin stock', color: 'danger' },
  RESERVED: { code: 'reserved', name: 'Reservado', color: 'info' },
};

/**
 * ===========================================
 * PROVINCIAS ARGENTINAS
 * ===========================================
 */

export const PROVINCES = [
  { code: 'BA', name: 'Buenos Aires' },
  { code: 'CABA', name: 'Ciudad Autónoma de Buenos Aires' },
  { code: 'CA', name: 'Catamarca' },
  { code: 'CH', name: 'Chaco' },
  { code: 'CT', name: 'Chubut' },
  { code: 'CO', name: 'Córdoba' },
  { code: 'CR', name: 'Corrientes' },
  { code: 'ER', name: 'Entre Ríos' },
  { code: 'FO', name: 'Formosa' },
  { code: 'JU', name: 'Jujuy' },
  { code: 'LP', name: 'La Pampa' },
  { code: 'LR', name: 'La Rioja' },
  { code: 'MZ', name: 'Mendoza' },
  { code: 'MI', name: 'Misiones' },
  { code: 'NQ', name: 'Neuquén' },
  { code: 'RN', name: 'Río Negro' },
  { code: 'SA', name: 'Salta' },
  { code: 'SJ', name: 'San Juan' },
  { code: 'SL', name: 'San Luis' },
  { code: 'SC', name: 'Santa Cruz' },
  { code: 'SF', name: 'Santa Fe' },
  { code: 'SE', name: 'Santiago del Estero' },
  { code: 'TF', name: 'Tierra del Fuego' },
  { code: 'TU', name: 'Tucumán' },
];

/**
 * ===========================================
 * LÍMITES Y VALIDACIONES
 * ===========================================
 */

export const LIMITS = {
  // Productos
  MAX_PRODUCT_NAME_LENGTH: 200,
  MAX_PRODUCT_DESCRIPTION_LENGTH: 1000,
  MIN_PRODUCT_PRICE: 0.01,
  MAX_PRODUCT_PRICE: 999999999.99,
  MIN_STOCK: 0,
  MAX_STOCK: 999999999,

  // Clientes
  MAX_CLIENT_NAME_LENGTH: 150,
  MAX_CLIENT_ADDRESS_LENGTH: 250,
  MAX_CLIENT_PHONE_LENGTH: 20,

  // Ventas
  MAX_SALE_ITEMS: 1000,
  MAX_DISCOUNT_PERCENTAGE: 100,
  MIN_DISCOUNT_PERCENTAGE: 0,

  // Caja
  MAX_CASH_AMOUNT: 999999999.99,
  MIN_CASH_AMOUNT: 0,

  // Archivos
  MAX_FILE_SIZE_MB: 10,
  MAX_IMAGE_SIZE_MB: 5,
};

/**
 * ===========================================
 * ATAJOS DE TECLADO
 * ===========================================
 */

export const KEYBOARD_SHORTCUTS = {
  // Navegación
  NEW_SALE: { key: 'F1', description: 'Nueva venta' },
  SEARCH_PRODUCT: { key: 'F2', description: 'Buscar producto' },
  SEARCH_CLIENT: { key: 'F3', description: 'Buscar cliente' },
  OPEN_CASH: { key: 'F4', description: 'Apertura de caja' },
  CLOSE_CASH: { key: 'F5', description: 'Cierre de caja' },
  
  // Acciones
  SAVE: { key: 'Ctrl+S', description: 'Guardar' },
  CANCEL: { key: 'Esc', description: 'Cancelar' },
  PRINT: { key: 'Ctrl+P', description: 'Imprimir' },
  SEARCH: { key: 'Ctrl+F', description: 'Buscar' },
  
  // Facturación
  ADD_PRODUCT: { key: 'Ctrl+A', description: 'Agregar producto' },
  REMOVE_PRODUCT: { key: 'Del', description: 'Eliminar producto' },
  COMPLETE_SALE: { key: 'F12', description: 'Completar venta' },
};

/**
 * ===========================================
 * MENSAJES DE ERROR COMUNES
 * ===========================================
 */

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  SERVER_ERROR: 'Error del servidor. Intenta nuevamente más tarde.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  VALIDATION_ERROR: 'Los datos ingresados no son válidos.',
  DUPLICATE_ERROR: 'Ya existe un registro con estos datos.',
  UNKNOWN_ERROR: 'Ocurrió un error inesperado.',
};

/**
 * ===========================================
 * EXPORTAR TODAS LAS CONSTANTES
 * ===========================================
 */
export default {
  APP_INFO,
  APP_CONFIG,
  ROLES,
  PERMISSIONS,
  INVOICE_TYPES,
  IVA_CONDITIONS,
  IVA_RATES,
  PAYMENT_METHODS,
  SALE_STATUS,
  CASH_STATUS,
  CASH_MOVEMENT_TYPES,
  UNITS,
  PRODUCT_CATEGORIES,
  STOCK_STATUS,
  PROVINCES,
  LIMITS,
  KEYBOARD_SHORTCUTS,
  ERROR_MESSAGES,
};