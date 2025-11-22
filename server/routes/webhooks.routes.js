/**
 * ===========================================
 * WEBHOOKS DE MERCADO PAGO Y BANCOS
 * ===========================================
 * Recibe notificaciones de pagos confirmados y las procesa
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configurar Supabase con service role key (tiene permisos completos)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * ===========================================
 * WEBHOOK: Mercado Pago
 * ===========================================
 * POST /api/webhooks/mercadopago
 * 
 * Recibe notificaciones de Mercado Pago cuando un pago cambia de estado
 */
router.post('/mercadopago', async (req, res) => {
  try {
    console.log('📥 Webhook de Mercado Pago recibido:', req.body);

    const { type, data, action } = req.body;

    // Verificar que sea una notificación de pago
    if (type !== 'payment' || action !== 'payment.created') {
      console.log('⚠️ Tipo de notificación no soportado:', type, action);
      return res.sendStatus(200);
    }

    // Obtener ID del pago
    const paymentId = data.id;

    if (!paymentId) {
      console.error('❌ ID de pago no encontrado en el webhook');
      return res.sendStatus(400);
    }

    // Consultar detalles del pago a Mercado Pago
    const paymentDetails = await getPaymentDetailsFromMP(paymentId);

    if (!paymentDetails) {
      console.error('❌ No se pudo obtener detalles del pago');
      return res.sendStatus(400);
    }

    console.log('💰 Detalles del pago:', paymentDetails);

    // Buscar el pago pendiente en Supabase por external_id
    const { data: pendingPayment, error: findError } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('external_id', paymentId.toString())
      .single();

    if (findError || !pendingPayment) {
      console.warn('⚠️ Pago pendiente no encontrado para ID:', paymentId);
      // No es un error crítico, puede ser un pago no generado desde nuestra app
      return res.sendStatus(200);
    }

    // Solo procesar si el pago fue aprobado
    if (paymentDetails.status === 'approved') {
      
      // Crear notificación en Supabase (esto dispara el Realtime)
      const { data: notification, error: notificationError } = await supabase
        .from('payment_notifications')
        .insert({
          payment_id: pendingPayment.payment_id,
          external_id: paymentId.toString(),
          branch_id: pendingPayment.branch_id,
          user_id: pendingPayment.user_id,
          sale_id: pendingPayment.sale_id,
          amount: paymentDetails.transaction_amount,
          currency: paymentDetails.currency_id,
          payment_method: 'QR / Billetera Virtual',
          status: 'approved',
          status_detail: paymentDetails.status_detail,
          transaction_id: paymentId.toString(),
          authorization_code: paymentDetails.authorization_code,
          payer_email: paymentDetails.payer?.email,
          payer_name: `${paymentDetails.payer?.first_name || ''} ${paymentDetails.payer?.last_name || ''}`.trim(),
          metadata: {
            payment_method_id: paymentDetails.payment_method_id,
            payment_type_id: paymentDetails.payment_type_id,
          },
          raw_webhook_data: paymentDetails,
          processed: false,
        })
        .select()
        .single();

      if (notificationError) {
        console.error('❌ Error creando notificación:', notificationError);
        throw notificationError;
      }

      console.log('✅ Notificación de pago creada:', notification.id);
      console.log('📡 Notificación enviada vía Realtime a sucursal:', pendingPayment.branch_id);

      // El trigger de Supabase se encargará de:
      // 1. Actualizar el estado del pending_payment
      // 2. Actualizar la venta si existe sale_id
      // 3. Enviar notificación en tiempo real

    } else {
      console.log(`⚠️ Pago ${paymentId} tiene estado: ${paymentDetails.status}`);
      
      // Si fue rechazado, crear notificación de rechazo
      if (paymentDetails.status === 'rejected') {
        await supabase
          .from('payment_notifications')
          .insert({
            payment_id: pendingPayment.payment_id,
            external_id: paymentId.toString(),
            branch_id: pendingPayment.branch_id,
            user_id: pendingPayment.user_id,
            amount: paymentDetails.transaction_amount,
            currency: paymentDetails.currency_id,
            payment_method: 'QR / Billetera Virtual',
            status: 'rejected',
            status_detail: paymentDetails.status_detail,
            raw_webhook_data: paymentDetails,
          });
      }
    }

    // Responder OK a Mercado Pago
    res.sendStatus(200);

  } catch (error) {
    console.error('❌ Error procesando webhook de Mercado Pago:', error);
    res.sendStatus(500);
  }
});

/**
 * ===========================================
 * WEBHOOK: Transferencias Bancarias
 * ===========================================
 * POST /api/webhooks/bank-transfer
 * 
 * Recibe notificaciones de transferencias bancarias confirmadas
 */
router.post('/bank-transfer', async (req, res) => {
  try {
    console.log('📥 Webhook de transferencia bancaria:', req.body);

    // Validar firma/token del banco (importante para seguridad)
    const isValid = await validateBankWebhook(req.headers, req.body);
    
    if (!isValid) {
      console.error('❌ Webhook inválido - firma incorrecta');
      return res.sendStatus(403);
    }

    const {
      transaction_id,
      amount,
      reference, // Aquí debería venir el payment_id nuestro
      status,
      payer_account,
      payer_name,
    } = req.body;

    if (status !== 'approved' && status !== 'completed') {
      console.log('⚠️ Transferencia con estado:', status);
      return res.sendStatus(200);
    }

    // Buscar el pago pendiente por payment_id
    const { data: pendingPayment, error: findError } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('payment_id', reference)
      .single();

    if (findError || !pendingPayment) {
      console.warn('⚠️ Pago pendiente no encontrado para referencia:', reference);
      return res.sendStatus(200);
    }

    // Crear notificación
    const { error: notificationError } = await supabase
      .from('payment_notifications')
      .insert({
        payment_id: pendingPayment.payment_id,
        external_id: transaction_id,
        branch_id: pendingPayment.branch_id,
        user_id: pendingPayment.user_id,
        sale_id: pendingPayment.sale_id,
        amount: parseFloat(amount),
        currency: 'ARS',
        payment_method: 'Transferencia',
        status: 'approved',
        transaction_id: transaction_id,
        payer_name: payer_name,
        metadata: {
          payer_account: payer_account,
        },
        raw_webhook_data: req.body,
        processed: false,
      });

    if (notificationError) {
      console.error('❌ Error creando notificación:', notificationError);
      throw notificationError;
    }

    console.log('✅ Transferencia procesada correctamente');
    res.sendStatus(200);

  } catch (error) {
    console.error('❌ Error procesando webhook de transferencia:', error);
    res.sendStatus(500);
  }
});

/**
 * ===========================================
 * FUNCIONES AUXILIARES
 * ===========================================
 */

/**
 * Obtener detalles del pago desde Mercado Pago
 */
async function getPaymentDetailsFromMP(paymentId) {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Error consultando MP:', response.status);
      return null;
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error obteniendo detalles de MP:', error);
    return null;
  }
}

/**
 * Validar webhook de banco (ejemplo genérico)
 */
async function validateBankWebhook(headers, body) {
  try {
    // Ejemplo: Validar firma HMAC
    const signature = headers['x-bank-signature'];
    const secret = process.env.BANK_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    return signature === expectedSignature;

  } catch (error) {
    console.error('Error validando webhook:', error);
    return false;
  }
}

/**
 * ===========================================
 * ENDPOINT DE PRUEBA (Solo desarrollo)
 * ===========================================
 * POST /api/webhooks/test-payment
 * 
 * Simula un pago confirmado para testing
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test-payment', async (req, res) => {
    try {
      const { payment_id, amount, branch_id } = req.body;

      const { data, error } = await supabase
        .from('payment_notifications')
        .insert({
          payment_id: payment_id || 'TEST-' + Date.now(),
          external_id: 'MP-TEST-' + Date.now(),
          branch_id: branch_id,
          user_id: req.body.user_id,
          amount: amount || 1000,
          currency: 'ARS',
          payment_method: 'QR / Billetera Virtual',
          status: 'approved',
          transaction_id: 'TXN-TEST-' + Date.now(),
          payer_email: 'test@test.com',
          payer_name: 'Usuario de Prueba',
          metadata: { test: true },
          processed: false,
        })
        .select()
        .single();

      if (error) throw error;

      res.json({ 
        success: true, 
        message: 'Pago de prueba creado',
        data 
      });

    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
}

module.exports = router;