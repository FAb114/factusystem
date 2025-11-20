# FactuSystem v2.0

Sistema de Facturación y Gestión Comercial Multisucursal desarrollado con React + Electron.

## 🚀 Características

- ✅ Facturación electrónica (AFIP)
- ✅ Gestión multisucursal
- ✅ Control de stock en tiempo real
- ✅ Sistema de caja
- ✅ Integración con Mercado Pago
- ✅ Modo offline con sincronización
- ✅ Impresión térmica y A4
- ✅ Reportes y análisis

## 📋 Requisitos

- Node.js >= 18.x
- npm >= 9.x

## 🛠️ Instalación
```bash
# Clonar repositorio
git clone [tu-repo]
cd factusystem

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
```

## 🏃 Desarrollo
```bash
# Modo desarrollo (React + Electron)
npm run dev

# Solo React (navegador)
npm run dev:vite

# Solo Electron
npm run dev:electron
```

## 📦 Build
```bash
# Build completo
npm run build

# Build solo React
npm run build

# Build Electron (Windows/Mac/Linux)
npm run build:electron
```

## 🔧 Configuración

### Supabase

1. Crear proyecto en [Supabase](https://supabase.com)
2. Copiar URL y anon key a `.env`
3. Ejecutar migraciones en `database/migrations/`

### AFIP

1. Generar certificado y clave
2. Colocar en `certificates/`
3. Configurar CUIT en `.env`

## 📁 Estructura
```
factusystem/
├── electron/          # Proceso principal Electron
├── src/               # Aplicación React
│   ├── components/    # Componentes reutilizables
│   ├── pages/         # Páginas/Vistas
│   ├── hooks/         # Custom hooks
│   ├── store/         # Estado global (Zustand)
│   ├── services/      # Servicios y API
│   └── utils/         # Utilidades
├── public/            # Archivos estáticos
└── database/          # Scripts SQL
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch
3. Commit tus cambios
4. Push al branch
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte: [tu-email]
```

### 7. **.gitignore**
```
# Dependencies
node_modules/
package-lock.json

# Production
dist/
dist-electron/
build/

# Environment
.env
.env.local
.env.production

# Electron
out/

# Logs
logs/
*.log
npm-debug.log*

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Certificates
certificates/*.pem
certificates/*.key

# Database
*.db
*.sqlite

# Testing
coverage/

# Misc
.cache/
temp/
tmp/