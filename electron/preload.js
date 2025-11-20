const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Información de la aplicación
  app: {
    getInfo: () => ipcRenderer.invoke('app:getInfo'),
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => process.platform,
  },

  // Gestión de impresión
  print: {
    document: (options) => ipcRenderer.invoke('print:document', options),
    getPrinters: () => ipcRenderer.invoke('print:getPrinters'),
    thermal: (data) => ipcRenderer.invoke('print:thermal', data),
  },

  // Gestión de archivos
  file: {
    save: (filename, data) => ipcRenderer.invoke('file:save', { filename, data }),
    select: (options) => ipcRenderer.invoke('file:select', options),
    read: (filePath) => ipcRenderer.invoke('file:read', filePath),
  },

  // Lector de código de barras
  barcode: {
    startScanner: () => ipcRenderer.invoke('barcode:start'),
    stopScanner: () => ipcRenderer.invoke('barcode:stop'),
    onScan: (callback) => {
      ipcRenderer.on('barcode:scanned', (event, data) => callback(data));
    },
  },

  // Base de datos local (PouchDB)
  db: {
    put: (doc) => ipcRenderer.invoke('db:put', doc),
    get: (id) => ipcRenderer.invoke('db:get', id),
    delete: (id, rev) => ipcRenderer.invoke('db:delete', { id, rev }),
    find: (query) => ipcRenderer.invoke('db:find', query),
    sync: () => ipcRenderer.invoke('db:sync'),
  },

  // Notificaciones del sistema
  notification: {
    show: (title, body, options) => 
      ipcRenderer.invoke('notification:show', { title, body, options }),
  },

  // Menú y navegación
  menu: {
    onAction: (callback) => {
      ipcRenderer.on('menu-action', (event, action) => callback(action));
    },
  },

  // Atajos de teclado
  shortcuts: {
    register: (shortcut, callback) => 
      ipcRenderer.invoke('shortcuts:register', { shortcut, callback }),
    unregister: (shortcut) => 
      ipcRenderer.invoke('shortcuts:unregister', shortcut),
  },

  // Almacenamiento local seguro (electron-store)
  store: {
    get: (key, defaultValue) => 
      ipcRenderer.invoke('store:get', { key, defaultValue }),
    set: (key, value) => 
      ipcRenderer.invoke('store:set', { key, value }),
    delete: (key) => 
      ipcRenderer.invoke('store:delete', key),
    clear: () => 
      ipcRenderer.invoke('store:clear'),
  },

  // Eventos del sistema
  system: {
    onOnline: (callback) => {
      window.addEventListener('online', callback);
    },
    onOffline: (callback) => {
      window.addEventListener('offline', callback);
    },
    isOnline: () => navigator.onLine,
  },

  // Backup y sincronización
  sync: {
    backup: () => ipcRenderer.invoke('sync:backup'),
    restore: (filePath) => ipcRenderer.invoke('sync:restore', filePath),
    status: () => ipcRenderer.invoke('sync:status'),
    onProgress: (callback) => {
      ipcRenderer.on('sync:progress', (event, data) => callback(data));
    },
  },

  // Ventanas y diálogos
  dialog: {
    showMessage: (options) => ipcRenderer.invoke('dialog:message', options),
    showError: (title, message) => 
      ipcRenderer.invoke('dialog:error', { title, message }),
    showConfirm: (title, message) => 
      ipcRenderer.invoke('dialog:confirm', { title, message }),
  },

  // Logs y depuración
  logger: {
    info: (message, data) => 
      ipcRenderer.invoke('logger:info', { message, data }),
    error: (message, error) => 
      ipcRenderer.invoke('logger:error', { message, error }),
    warn: (message, data) => 
      ipcRenderer.invoke('logger:warn', { message, data }),
  },
});

// Logs de consola (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('Preload script cargado correctamente');
  console.log('electronAPI expuesto al renderer process');
}