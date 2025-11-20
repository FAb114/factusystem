import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/styles/globals.css';

// Ocultar el loader inicial cuando React esté listo
const hideLoader = () => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
      loader.remove();
    }, 500);
  }
};

// Renderizar la aplicación
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Ocultar loader después de que React monte
setTimeout(hideLoader, 100);

// Log de inicio (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🚀 FactuSystem iniciado correctamente');
  console.log('📦 Versión:', import.meta.env.VITE_APP_VERSION || '2.0.0');
  console.log('🌍 Entorno:', import.meta.env.MODE);
}