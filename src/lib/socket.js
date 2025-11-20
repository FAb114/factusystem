import { io } from 'socket.io-client';
import { useAuthStore } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

let socket = null;

/**
 * Inicializar conexión WebSocket
 */
export const initializeSocket = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
  const { user, selectedBranch } = useAuthStore.getState();

  if (!user) {
    console.warn('⚠️ No se puede inicializar socket sin usuario autenticado');
    return null;
  }

  // Si ya existe una conexión, desconectar primero
  if (socket && socket.connected) {
    socket.disconnect();
  }

  // Crear nueva conexión
  socket = io(socketUrl, {
    auth: {
      token: user.token,
      userId: user.id,
      branchId: selectedBranch?.id,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Eventos de conexión
  socket.on('connect', () => {
    console.log('🟢 WebSocket conectado:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔴 WebSocket desconectado:', reason);
    if (reason === 'io server disconnect') {
      // El servidor forzó la desconexión, reconectar manualmente
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Error de conexión WebSocket:', error);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 WebSocket reconectado después de', attemptNumber, 'intentos');
    toast.success('Conexión restaurada');
  });

  socket.on('reconnect_error', (error) => {
    console.error('❌ Error al reconectar:', error);
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Falló la reconexión del WebSocket');
    toast.error('No se pudo reconectar al servidor');
  });

  // Eventos personalizados del sistema
  setupSystemEvents(socket);

  return socket;
};

/**
 * Configurar eventos del sistema
 */
const setupSystemEvents = (socketInstance) => {
  // Alerta de stock bajo
  socketInstance.on('stock:low', (data) => {
    console.log('📦 Alerta de stock bajo:', data);
    toast.error(`Stock bajo: ${data.productName} (${data.quantity} unidades)`, {
      duration: 5000,
    });
  });

  // Nueva venta en sucursal
  socketInstance.on('sale:new', (data) => {
    console.log('💰 Nueva venta registrada:', data);
  });

  // Sincronización de datos
  socketInstance.on('sync:update', (data) => {
    console.log('🔄 Actualización de datos:', data);
    // Aquí puedes disparar eventos para actualizar el store
  });

  // Mensaje del sistema
  socketInstance.on('system:message', (data) => {
    console.log('📢 Mensaje del sistema:', data);
    toast(data.message, {
      icon: data.icon || '📢',
      duration: data.duration || 4000,
    });
  });

  // Notificación de caja
  socketInstance.on('cash:alert', (data) => {
    console.log('💵 Alerta de caja:', data);
    toast.warning(data.message);
  });
};

/**
 * Obtener instancia del socket
 */
export const getSocket = () => {
  if (!socket) {
    console.warn('⚠️ Socket no inicializado. Llamar a initializeSocket() primero');
    return null;
  }
  return socket;
};

/**
 * Desconectar socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔴 Socket desconectado manualmente');
  }
};

/**
 * Emitir evento al servidor
 */
export const emit = (event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
    return true;
  }
  console.warn('⚠️ No se puede emitir evento, socket no conectado');
  return false;
};

/**
 * Escuchar evento del servidor
 */
export const on = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
    return true;
  }
  console.warn('⚠️ No se puede escuchar evento, socket no inicializado');
  return false;
};

/**
 * Dejar de escuchar evento
 */
export const off = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
    return true;
  }
  return false;
};

/**
 * Verificar si el socket está conectado
 */
export const isConnected = () => {
  return socket && socket.connected;
};

/**
 * Hook para usar en componentes React
 */
export const useSocket = () => {
  return {
    socket: getSocket(),
    emit,
    on,
    off,
    isConnected: isConnected(),
    initialize: initializeSocket,
    disconnect: disconnectSocket,
  };
};

export default {
  initialize: initializeSocket,
  getSocket,
  disconnect: disconnectSocket,
  emit,
  on,
  off,
  isConnected,
};