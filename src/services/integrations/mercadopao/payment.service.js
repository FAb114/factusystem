/**
 * ===========================================
 * SERVICIO DE MERCADO PAGO
 * ===========================================
 * Manejo de pagos QR y notificaciones de Mercado Pago
 */

import { post } from '../../../lib/axios';
import supabase from '../../../lib/supabase';

/**
 * Crear pago QR de Mercado Pago
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise<Object>}
 */
export const createQRPayment = async (paymentData) => {
  try {
    const {
      amount,
      description,
      branchId,
      userId,
      saleId,
      expirationMinutes = 15,
    } = paymentData;

    // Llamar a tu backend para generar el QR
    const response = await post('/api/mercadopago/create-qr', {
      amount,
      description,
      branch_id: branchId,
      user_id: userId,
      sale_id: saleId,
      expiration_minutes: expirationMinutes,
    });

    if (!response.success) {
      throw new Error(response.error || 'Error generando QR');
    }

    const qrInfo = response.data;

    // Guardar en pending_payments en Supabase
    const { data: pendingPayment, error: dbError } = await supabase
      .from('pending_payments')
      .insert({
        payment_id: qrInfo.payment_id,
        external_id: qrInfo.external_id,
        branch_id: branchId,
        user_id: userId,
        sale_id: saleId,
        amount,
        currency: 'ARS',
        payment_method: 'QR / Billetera Virtual',
        status: 'pending',
        qr_data: qrInfo.qr_data,
        qr_image_url: qrInfo.qr_image_url,
        expires_at: new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString(),
        metadata: {
          description,
          created_from: 'billing_module',
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error guardando pago pendiente:', dbError);
      throw dbError;
    }

    return {
      success: true,
      data: {
        payment_id: pendingPayment.payment_id,
        external_id: pendingPayment.external_id,
        qr_data: pendingPayment.qr_data,
        qr_image_url: pendingPayment.qr_image_url,
        expires_at: pendingPayment.expires_at,
      },
    };
  } catch (error) {
    console.error('Error creando pago QR:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Cancelar un pago QR pendiente
 * @param {string} paymentId
 */
export const cancelQRPayment = async (paymentId) => {
  try {
    // Actualizar estado en Supabase
    const { error } = await supabase
      .from('pending_payments')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', paymentId);

    if (error) throw error;

    // Opcionalmente, cancelar en Mercado Pago también
    // await post('/api/mercadopago/cancel-payment', { payment_id: paymentId });

    return { success: true };
  } catch (error) {
    console.error('Error cancelando pago:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verificar estado de un pago en Mercado Pago
 * @param {string} externalId - ID de Mercado Pago
 */
export const checkPaymentStatus = async (externalId) => {
  try {
    const response = await post('/api/mercadopago/check-status', {
      external_id: externalId,
    });

    return response;
  } catch (error) {
    console.error('Error verificando estado:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener historial de pagos de Mercado Pago
 * @param {Object} filters - Filtros de búsqueda
 */
export const getPaymentHistory = async (filters = {}) => {
  try {
    const { branchId, startDate, endDate, status } = filters;

    let query = supabase
      .from('payment_notifications')
      .select('*')
      .eq('payment_method', 'QR / Billetera Virtual')
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ===========================================
 * FUNCIONES AUXILIARES
 * ===========================================
 */

/**
 * Formatear datos del webhook de Mercado Pago
 * Esta función se usa en el webhook del backend
 */
export const formatWebhookData = (webhookPayload) => {
  const { data, type } = webhookPayload;

  // Mercado Pago envía diferentes tipos de notificaciones
  if (type === 'payment') {
    return {
      external_id: data.id,
      status: data.status, // approved, rejected, pending, etc.
      status_detail: data.status_detail,
      amount: data.transaction_amount,
      currency: data.currency_id,
      payment_method: data.payment_method_id,
      transaction_id: data.id,
      authorization_code: data.authorization_code,
      payer_email: data.payer?.email,
      payer_name: `${data.payer?.first_name} ${data.payer?.last_name}`,
    };
  }

  return null;
};

/**
 * Generar enlace de pago de Mercado Pago (alternativa al QR)
 * @param {Object} paymentData
 */
export const createPaymentLink = async (paymentData) => {
  try {
    const response = await post('/api/mercadopago/create-link', paymentData);
    return response;
  } catch (error) {
    console.error('Error creando link de pago:', error);
    return { success: false, error: error.message };
  }
};

export default {
  createQRPayment,
  cancelQRPayment,
  checkPaymentStatus,
  getPaymentHistory,
  formatWebhookData,
  createPaymentLink,
};