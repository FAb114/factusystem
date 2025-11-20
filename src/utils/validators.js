/**
 * ===========================================
 * VALIDACIONES DE DOCUMENTOS ARGENTINOS
 * ===========================================
 */

/**
 * Validar CUIT/CUIL
 */
export const validateCUIT = (cuit) => {
  if (!cuit) return false;

  // Limpiar el CUIT de guiones y espacios
  const cleaned = cuit.toString().replace(/[-\s]/g, '');

  // Debe tener 11 dígitos
  if (cleaned.length !== 11 || !/^\d+$/.test(cleaned)) {
    return false;
  }

  // Algoritmo de validación del dígito verificador
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * multipliers[i];
  }

  const verifier = 11 - (sum % 11);
  const calculatedDigit = verifier === 11 ? 0 : verifier === 10 ? 9 : verifier;
  const providedDigit = parseInt(cleaned[10]);

  return calculatedDigit === providedDigit;
};

/**
 * Validar DNI
 */
export const validateDNI = (dni) => {
  if (!dni) return false;

  const cleaned = dni.toString().replace(/\D/g, '');

  // DNI debe tener entre 7 y 8 dígitos
  return cleaned.length >= 7 && cleaned.length <= 8 && /^\d+$/.test(cleaned);
};

/**
 * ===========================================
 * VALIDACIONES DE CONTACTO
 * ===========================================
 */

/**
 * Validar email
 */
export const validateEmail = (email) => {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar teléfono argentino
 */
export const validatePhone = (phone) => {
  if (!phone) return false;

  const cleaned = phone.toString().replace(/\D/g, '');

  // Debe tener entre 10 y 11 dígitos
  return cleaned.length >= 10 && cleaned.length <= 11;
};

/**
 * Validar celular argentino
 */
export const validateCellphone = (phone) => {
  if (!phone) return false;

  const cleaned = phone.toString().replace(/\D/g, '');

  // Celular argentino: 11 dígitos comenzando con 11, 15, o código de área
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('15'));
};

/**
 * ===========================================
 * VALIDACIONES DE TEXTO
 * ===========================================
 */

/**
 * Validar campo requerido
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validar longitud mínima
 */
export const validateMinLength = (value, minLength) => {
  if (!value) return false;
  return value.toString().length >= minLength;
};

/**
 * Validar longitud máxima
 */
export const validateMaxLength = (value, maxLength) => {
  if (!value) return true;
  return value.toString().length <= maxLength;
};

/**
 * Validar solo letras
 */
export const validateLettersOnly = (value) => {
  if (!value) return true;
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value);
};

/**
 * Validar solo números
 */
export const validateNumbersOnly = (value) => {
  if (!value) return true;
  return /^\d+$/.test(value.toString());
};

/**
 * Validar alfanumérico
 */
export const validateAlphanumeric = (value) => {
  if (!value) return true;
  return /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(value);
};

/**
 * ===========================================
 * VALIDACIONES NUMÉRICAS
 * ===========================================
 */

/**
 * Validar número
 */
export const validateNumber = (value) => {
  if (value === null || value === undefined || value === '') return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validar número entero
 */
export const validateInteger = (value) => {
  if (!validateNumber(value)) return false;
  return Number.isInteger(Number(value));
};

/**
 * Validar número positivo
 */
export const validatePositive = (value) => {
  if (!validateNumber(value)) return false;
  return Number(value) > 0;
};

/**
 * Validar número no negativo
 */
export const validateNonNegative = (value) => {
  if (!validateNumber(value)) return false;
  return Number(value) >= 0;
};

/**
 * Validar rango numérico
 */
export const validateRange = (value, min, max) => {
  if (!validateNumber(value)) return false;
  const num = Number(value);
  return num >= min && num <= max;
};

/**
 * Validar porcentaje (0-100)
 */
export const validatePercentage = (value) => {
  return validateRange(value, 0, 100);
};

/**
 * ===========================================
 * VALIDACIONES DE FECHAS
 * ===========================================
 */

/**
 * Validar fecha
 */
export const validateDate = (date) => {
  if (!date) return false;
  const parsed = new Date(date);
  return parsed instanceof Date && !isNaN(parsed);
};

/**
 * Validar fecha futura
 */
export const validateFutureDate = (date) => {
  if (!validateDate(date)) return false;
  return new Date(date) > new Date();
};

/**
 * Validar fecha pasada
 */
export const validatePastDate = (date) => {
  if (!validateDate(date)) return false;
  return new Date(date) < new Date();
};

/**
 * Validar rango de fechas
 */
export const validateDateRange = (startDate, endDate) => {
  if (!validateDate(startDate) || !validateDate(endDate)) return false;
  return new Date(startDate) <= new Date(endDate);
};

/**
 * ===========================================
 * VALIDACIONES DE CONTRASEÑA
 * ===========================================
 */

/**
 * Validar contraseña segura
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
  } = options;

  if (!password || password.length < minLength) return false;

  if (requireUppercase && !/[A-Z]/.test(password)) return false;
  if (requireLowercase && !/[a-z]/.test(password)) return false;
  if (requireNumbers && !/\d/.test(password)) return false;
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return false;
  }

  return true;
};

/**
 * Validar coincidencia de contraseñas
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * ===========================================
 * VALIDACIONES DE FACTURACIÓN
 * ===========================================
 */

/**
 * Validar punto de venta
 */
export const validatePointOfSale = (pos) => {
  if (!pos) return false;
  const num = Number(pos);
  return validateInteger(num) && num > 0 && num <= 99999;
};

/**
 * Validar número de comprobante
 */
export const validateInvoiceNumber = (number) => {
  if (!number) return false;
  const num = Number(number);
  return validateInteger(num) && num > 0 && num <= 99999999;
};

/**
 * Validar código de barras EAN-13
 */
export const validateEAN13 = (barcode) => {
  if (!barcode) return false;

  const cleaned = barcode.toString().replace(/\D/g, '');

  if (cleaned.length !== 13) return false;

  // Algoritmo de validación EAN-13
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleaned[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cleaned[12]);
};

/**
 * ===========================================
 * VALIDACIONES DE ARCHIVOS
 * ===========================================
 */

/**
 * Validar tipo de archivo
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file) return false;
  return allowedTypes.includes(file.type);
};

/**
 * Validar tamaño de archivo
 */
export const validateFileSize = (file, maxSizeInMB) => {
  if (!file) return false;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * ===========================================
 * VALIDACIONES DE STOCK
 * ===========================================
 */

/**
 * Validar stock disponible
 */
export const validateStockAvailable = (requested, available) => {
  return validateNumber(requested) && 
         validateNumber(available) && 
         Number(requested) <= Number(available);
};

/**
 * ===========================================
 * VALIDADOR GENÉRICO CON REGLAS
 * ===========================================
 */

/**
 * Validar valor con múltiples reglas
 */
export const validate = (value, rules) => {
  const errors = [];

  for (const rule of rules) {
    const { type, message, ...params } = rule;

    let isValid = true;

    switch (type) {
      case 'required':
        isValid = validateRequired(value);
        break;
      case 'email':
        isValid = validateEmail(value);
        break;
      case 'phone':
        isValid = validatePhone(value);
        break;
      case 'cuit':
        isValid = validateCUIT(value);
        break;
      case 'dni':
        isValid = validateDNI(value);
        break;
      case 'minLength':
        isValid = validateMinLength(value, params.length);
        break;
      case 'maxLength':
        isValid = validateMaxLength(value, params.length);
        break;
      case 'number':
        isValid = validateNumber(value);
        break;
      case 'positive':
        isValid = validatePositive(value);
        break;
      case 'range':
        isValid = validateRange(value, params.min, params.max);
        break;
      case 'custom':
        isValid = params.validator(value);
        break;
      default:
        console.warn(`Tipo de validación desconocido: ${type}`);
    }

    if (!isValid) {
      errors.push(message || `Validación ${type} falló`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * ===========================================
 * EXPORTAR TODAS LAS FUNCIONES
 * ===========================================
 */
export default {
  // Documentos
  validateCUIT,
  validateDNI,

  // Contacto
  validateEmail,
  validatePhone,
  validateCellphone,

  // Texto
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateLettersOnly,
  validateNumbersOnly,
  validateAlphanumeric,

  // Números
  validateNumber,
  validateInteger,
  validatePositive,
  validateNonNegative,
  validateRange,
  validatePercentage,

  // Fechas
  validateDate,
  validateFutureDate,
  validatePastDate,
  validateDateRange,

  // Contraseña
  validatePassword,
  validatePasswordMatch,

  // Facturación
  validatePointOfSale,
  validateInvoiceNumber,
  validateEAN13,

  // Archivos
  validateFileType,
  validateFileSize,

  // Stock
  validateStockAvailable,

  // Validador genérico
  validate,
};