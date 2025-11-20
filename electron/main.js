const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

// Configuración de la ventana principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    show: false, // No mostrar hasta que esté listo
    frame: true,
    titleBarStyle: 'default',
  });

  // Cargar la aplicación
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Abrir DevTools en desarrollo
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Manejar cierre de ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Crear menú de aplicación
  createMenu();
}

// Crear menú personalizado
function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Facturar',
          accelerator: 'Ctrl+F',
          click: () => {
            mainWindow.webContents.send('menu-action', 'facturar');
          },
        },
        { type: 'separator' },
        {
          label: 'Apertura de Caja',
          accelerator: 'Ctrl+A',
          click: () => {
            mainWindow.webContents.send('menu-action', 'apertura-caja');
          },
        },
        {
          label: 'Cierre de Caja',
          accelerator: 'Ctrl+C',
          click: () => {
            mainWindow.webContents.send('menu-action', 'cierre-caja');
          },
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar recarga' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' },
      ],
    },
    {
      label: 'Herramientas',
      submenu: [
        {
          label: 'Sincronizar',
          accelerator: 'Ctrl+S',
          click: () => {
            mainWindow.webContents.send('menu-action', 'sincronizar');
          },
        },
        {
          label: 'Backup',
          click: () => {
            mainWindow.webContents.send('menu-action', 'backup');
          },
        },
        { type: 'separator' },
        {
          label: 'Configuración',
          accelerator: 'Ctrl+,',
          click: () => {
            mainWindow.webContents.send('menu-action', 'configuracion');
          },
        },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Documentación',
          click: () => {
            mainWindow.webContents.send('menu-action', 'ayuda');
          },
        },
        {
          label: 'Atajos de teclado',
          click: () => {
            mainWindow.webContents.send('menu-action', 'shortcuts');
          },
        },
        { type: 'separator' },
        {
          label: 'Acerca de FactuSystem',
          click: () => {
            mainWindow.webContents.send('menu-action', 'about');
          },
        },
      ],
    },
  ];

  // Agregar menú de desarrollo en modo dev
  if (isDev) {
    template.push({
      label: 'Desarrollo',
      submenu: [
        { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
        {
          label: 'Limpiar caché',
          click: () => {
            mainWindow.webContents.session.clearCache(() => {
              console.log('Caché limpiada');
            });
          },
        },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Evento: Aplicación lista
app.whenReady().then(() => {
  createWindow();

  // En macOS, recrear ventana cuando se hace clic en el dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cerrar aplicación cuando todas las ventanas están cerradas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Prevenir múltiples instancias
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ========================================
// IPC HANDLERS - Comunicación con Renderer
// ========================================

// Obtener información de la aplicación
ipcMain.handle('app:getInfo', () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    isDev,
  };
});

// Imprimir documento
ipcMain.handle('print:document', async (event, options) => {
  try {
    const { silent = false, printBackground = true } = options;
    
    await mainWindow.webContents.print(
      {
        silent,
        printBackground,
        margins: { marginType: 'none' },
      },
      (success, errorType) => {
        if (!success) {
          console.error('Error de impresión:', errorType);
        }
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error al imprimir:', error);
    return { success: false, error: error.message };
  }
});

// Obtener lista de impresoras
ipcMain.handle('print:getPrinters', async () => {
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return { success: true, printers };
  } catch (error) {
    console.error('Error al obtener impresoras:', error);
    return { success: false, error: error.message };
  }
});

// Guardar archivo
ipcMain.handle('file:save', async (event, { filename, data }) => {
  const { dialog } = require('electron');
  
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      filters: [
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'Excel', extensions: ['xlsx', 'xls'] },
        { name: 'Todos los archivos', extensions: ['*'] },
      ],
    });

    if (canceled) {
      return { success: false, canceled: true };
    }

    const fs = require('fs');
    fs.writeFileSync(filePath, data);
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Error al guardar archivo:', error);
    return { success: false, error: error.message };
  }
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

console.log('FactuSystem iniciado correctamente');