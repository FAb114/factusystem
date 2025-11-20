import { format, formatDistance, formatRelative, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * ===========================================
 * FORMATEO DE MONEDA
 * ===========================================
 */

/**
 * Formatear número como moneda argentina (ARS)
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = 'ARS',
    locale = 'es-AR',
    decimals = 2,
    showSymbol = true,
  } = options;

  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(amount || 0);
};

/**
 * Formatear como pesos argentinos
 */
export const formatPesos = (amount) => {
  return formatCurrency(amount, { currency: 'ARS', decimals: 2 });
};

/**
 * Formatear porcentaje
 */
export const formatPercentage = (value, decimals = 2) => {
  return `${(value || 0).toFixed(decimals)}%`;
};

/**
 * ===========================================
 * FORMATEO DE FECHAS
 * ===========================================
 */

/**
 * Formatear fecha
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '-';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, formatStr, { locale: es });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '-';
  }
};

/**
 * Formatear fecha y hora
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Formatear solo hora
 */
export const formatTime = (date) => {
  return formatDate(date, 'HH:mm:ss');
};

/**
 * Formatear fecha relativa (hace 2 horas)
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return formatDistance(parsedDate, new Date(), {
      addSuffix: true,
      locale: es,
    });
  } catch (error) {
    console.error('Error formateando fecha relativa:', error);
    return '-';
  }
};

/**
 * Formatear fecha relativa completa
 */
export const formatRelativeFull = (date) => {
  if (!date) return '-';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return formatRelative(parsedDate, new Date(), { locale: es });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '-';
  }
};

/**
 * ===========================================
 * FORMATEO DE NÚMEROS
 * ===========================================
 */

/**
 * Formatear número con separadores de miles
 */
export const formatNumber = (number, decimals = 0) => {
  if (number == null) return '0';
  
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/**
 * Formatear número compacto (1K, 1M, etc.)
 */
export const formatCompactNumber = (number) => {
  if (number == null) return '0';
  
  return new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(number);
};

/**
 * ===========================================
 * FORMATEO DE TEXTO
 * ===========================================
 */

/**
 * Capitalizar primera letra
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitalizar cada palabra
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
};

/**
 * Truncar texto
 */
export const truncate = (text, maxLength = 50, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * ===========================================
 * FORMATEO DE DOCUMENTOS
 * ===========================================
 */

/**
 * Formatear CUIT/CUIL (XX-XXXXXXXX-X)
 */
export const formatCUIT = (cuit) => {
  if (!cuit) return '';
  
  const cleaned = cuit.toString().replace(/\D/g, '');
  
  if (cleaned.length !== 11) return cuit;
  
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
};

/**
 * Formatear DNI
 */
export const formatDNI = (dni) => {
  if (!dni) return '';
  
  const cleaned = dni.toString().replace(/\D/g, '');
  return new Intl.NumberFormat('es-AR').format(cleaned);
};

/**
 * Formatear teléfono argentino
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.toString().replace(/\D/g, '');
  
  // Formato: (0XX) XXX-XXXX o (011) XXXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `(${cleaned.slice(0, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }
  
  return phone;
};

/**
 * ===========================================
 * FORMATEO DE FACTURAS
 * ===========================================
 */

/**
 * Formatear número de factura
 */
export const formatInvoiceNumber = (pointOfSale, number) => {
  const pos = pointOfSale.toString().padStart(5, '0');
  const num = number.toString().padStart(8, '0');
  return `${pos}-${num}`;
};

/**
 * Formatear tipo de comprobante
 */
export const formatInvoiceType = (type) => {
  const types = {
    A: 'Factura A',
    B: 'Factura B',
    C: 'Factura C',
    X: 'Factura X',
    M: 'Factura M',
    NC_A: 'Nota de Crédito A',
    NC_B: 'Nota de Crédito B',
    NC_C: 'Nota de Crédito C',
    ND_A: 'Nota de Débito A',
    ND_B: 'Nota de Débito B',
    ND_C: 'Nota de Débito C',
  };
  
  return types[type] || type;
};

/**
 * ===========================================
 * FORMATEO DE ARCHIVOS
 * ===========================================
 */

/**
 * Formatear tamaño de archivo
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * ===========================================
 * FORMATEO DE STOCK
 * ===========================================
 */

/**
 * Formatear cantidad con unidad
 */
export const formatQuantity = (quantity, unit = 'un') => {
  return `${formatNumber(quantity)} ${unit}`;
};

/**
 * Formatear estado de stock
 */
export const formatStockStatus = (current, min) => {
  if (current <= 0) return { text: 'Sin stock', color: 'danger' };
  if (current <= min) return { text: 'Stock bajo', color: 'warning' };
  if (current <= min * 2) return { text: 'Stock medio', color: 'info' };
  return { text: 'Stock disponible', color: 'success' };
};

/**
 * ===========================================
 * FORMATEO DE DIRECCIONES
 * ===========================================
 */

/**
 * Formatear dirección completa
 */
export const formatAddress = (address) => {
  if (!address) return '';
  
  const parts = [
    address.street,
    address.number,
    address.floor && `Piso ${address.floor}`,
    address.apartment && `Depto ${address.apartment}`,
    address.city,
    address.province,
    address.zipCode && `(${address.zipCode})`,
  ].filter(Boolean);
  
  return parts.join(', ');
};

/**
 * ===========================================
 * EXPORTAR TODAS LAS FUNCIONES
 * ===========================================
 */
export default {
  // Moneda
  formatCurrency,
  formatPesos,
  formatPercentage,
  
  // Fechas
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatRelativeFull,
  
  // Números
  formatNumber,
  formatCompactNumber,
  
  // Texto
  capitalize,
  capitalizeWords,
  truncate,
  
  // Documentos
  formatCUIT,
  formatDNI,
  formatPhone,
  
  // Facturas
  formatInvoiceNumber,
  formatInvoiceType,
  
  // Archivos
  formatFileSize,
  
  // Stock
  formatQuantity,
  formatStockStatus,
  
  // Direcciones
  formatAddress,
};