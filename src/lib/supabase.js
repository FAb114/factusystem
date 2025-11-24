// src/lib/supabase.js - VERSIÓN CORREGIDA

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Supabase no está configurado correctamente');
  console.error('Variables de entorno requeridas:');
  console.error('- VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  console.warn('⚠️ La aplicación funcionará en MODO OFFLINE');
}

// Cliente de Supabase (con valores por defecto para desarrollo)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
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
  }
);

// Verificar si Supabase está disponible
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co');
};

/**
 * ===========================================
 * CONFIGURACIÓN DE CANALES REALTIME
 * ===========================================
 */

export const createPaymentNotificationChannel = (branchId, onPaymentConfirmed) => {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase no configurado - Canal de pagos no disponible');
    return null;
  }

  const channel = supabase.channel(`payment-notifications:${branchId}`, {
    config: {
      broadcast: { self: false },
      presence: { key: branchId },
    },
  });

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

export const createPaymentNotification = async (paymentData) => {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Modo offline - Notificación no guardada');
    return { success: false, error: 'Supabase no configurado' };
  }

  try {
    const { data, error } = await supabase
      .from('payment_notifications')
      .insert({
        payment_id: paymentData.payment_id,
        external_id: paymentData.external_id,
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

export const getPendingPayments = async (branchId) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase no configurado' };
  }

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

export const checkPaymentStatus = async (paymentId) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase no configurado' };
  }

  try {
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

export const checkMultiplePayments = async (paymentIds) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase no configurado' };
  }

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

export const createStockAlertChannel = (branchId, onStockAlert) => {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase no configurado - Canal de stock no disponible');
    return null;
  }

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

export const checkConnection = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase no configurado');
    return { success: false, error: 'Supabase no configurado' };
  }

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

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase no configurado' };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { success: true, user };
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    return { success: false, error: error.message };
  }
};

// Log inicial
if (isSupabaseConfigured()) {
  console.log('✅ Supabase configurado correctamente');
  console.log('📡 URL:', supabaseUrl);
} else {
  console.warn('⚠️ Supabase NO configurado - Modo offline');
  console.info('💡 Para habilitar Supabase, configura las variables de entorno:');
  console.info('   VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
}

export default supabase;