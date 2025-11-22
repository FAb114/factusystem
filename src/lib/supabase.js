import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase no configurado. Verifica las variables de entorno.');
}

// Cliente principal de Supabase
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public',
  },
});

/**
 * ===========================================
 * CONFIGURACIÓN DE CANALES REALTIME
 * ===========================================
 */

/**
 * Crear canal privado para notificaciones de pago
 * @param {string} branchId - ID de la sucursal
 * @param {function} onPaymentConfirmed - Callback cuando se confirma un pago
 * @returns {RealtimeChannel}
 */
export const createPaymentNotificationChannel = (branchId, onPaymentConfirmed) => {
  const channel = supabase.channel(`payment-notifications:${branchId}`, {
    config: {
      broadcast: { self: false },
      presence: { key: branchId },
    },
  });

  // Suscribirse a cambios en la tabla payment_notifications
  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'payment_notifications',
        filter: `branch_id=eq.${branchId}`,
      },
      (payload) => {
        console.log('💰 Notificación de pago recibida:', payload.new);
        onPaymentConfirmed(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Canal de pagos conectado para sucursal:', branchId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error conectando canal de pagos');
      }
    });

  return channel;
};

/**
 * Desuscribirse del canal de pagos
 * @param {RealtimeChannel} channel
 */
export const unsubscribePaymentChannel = async (channel) => {
  if (channel) {
    await supabase.removeChannel(channel);
    console.log('🔌 Canal de pagos desconectado');
  }
};

/**
 * ===========================================
 * FUNCIONES DE PAGO
 * ===========================================
 */

/**
 * Crear notificación de pago (llamada desde webhook o Edge Function)
 * @param {Object} paymentData - Datos del pago confirmado
 */
export const createPaymentNotification = async (paymentData) => {
  try {
    const { data, error } = await supabase
      .from('payment_notifications')
      .insert({
        payment_id: paymentData.payment_id,
        external_id: paymentData.external_id, // ID de Mercado Pago o banco
        amount: paymentData.amount,
        currency: paymentData.currency || 'ARS',
        payment_method: paymentData.payment_method,
        status: paymentData.status,
        branch_id: paymentData.branch_id,
        user_id: paymentData.user_id,
        transaction_id: paymentData.transaction_id,
        metadata: paymentData.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Notificación de pago creada:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error creando notificación de pago:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener pagos pendientes por sucursal
 * @param {string} branchId - ID de la sucursal
 */
export const getPendingPayments = async (branchId) => {
  try {
    const { data, error } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('branch_id', branchId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error obteniendo pagos pendientes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verificar estado de un pago específico
 * @param {string} paymentId - ID del pago a verificar
 */
export const checkPaymentStatus = async (paymentId) => {
  try {
    // Verificar en la tabla de notificaciones si ya fue confirmado
    const { data, error } = await supabase
      .from('payment_notifications')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    return { 
      success: true, 
      data,
      isConfirmed: data?.status === 'approved',
    };
  } catch (error) {
    console.error('❌ Error verificando estado de pago:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verificar múltiples pagos pendientes
 * @param {string[]} paymentIds - Array de IDs de pagos
 */
export const checkMultiplePayments = async (paymentIds) => {
  try {
    const { data, error } = await supabase
      .from('payment_notifications')
      .select('*')
      .in('payment_id', paymentIds)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error verificando pagos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ===========================================
 * FUNCIONES DE ALERTAS DE STOCK
 * ===========================================
 */

/**
 * Crear canal para alertas de stock
 * @param {string} branchId - ID de la sucursal
 * @param {function} onStockAlert - Callback cuando hay alerta de stock
 */
export const createStockAlertChannel = (branchId, onStockAlert) => {
  const channel = supabase.channel(`stock-alerts:${branchId}`);

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'stock_alerts',
        filter: `branch_id=eq.${branchId}`,
      },
      (payload) => {
        console.log('📦 Alerta de stock recibida:', payload.new);
        onStockAlert(payload.new);
      }
    )
    .subscribe();

  return channel;
};

/**
 * ===========================================
 * UTILIDADES
 * ===========================================
 */

/**
 * Verificar conexión a Supabase
 */
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').single();
    if (error && error.code !== 'PGRST116') throw error;
    
    console.log('✅ Conexión a Supabase OK');
    return { success: true };
  } catch (error) {
    console.error('❌ Error de conexión a Supabase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener usuario actual
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { success: true, user };
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ===========================================
 * EXPORTACIONES
 * ===========================================
 */

export default supabase;