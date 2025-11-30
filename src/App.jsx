import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Páginas
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import BranchSelector from './pages/auth/BranchSelector';
import CashOpening from './pages/auth/CashOpening';
import Billing from './pages/billing/Billing';
import SalesList from './pages/sales/SalesList';

// Settings
import Settings from './pages/settings/Settings';
import UsersManagement from './pages/settings/Users';
import BranchesManagement from './pages/settings/Branches';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Hooks
import { useAuthStore } from './store/slices/authSlice';

// Configuración de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  // Verificar autenticación al montar
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Detectar estado online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Conexión restaurada');
      // Aquí puedes agregar lógica de sincronización
    };

    const handleOffline = () => {
      console.log('⚠️ Sin conexión - Modo offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route
            path="/login"
            element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
          />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Selector de sucursal (después del login) */}
          <Route
            path="/branch-selector"
            element={
              isAuthenticated ? <BranchSelector /> : <Navigate to="/login" />
            }
          />

          {/* Apertura de caja (obligatoria) */}
          <Route
            path="/cash-opening"
            element={
              isAuthenticated ? <CashOpening /> : <Navigate to="/login" />
            }
          />

          {/* Dashboard y módulos principales */}
          <Route
            path="/dashboard/*"
            element={
              isAuthenticated ? (
                <DashboardLayout>
                  <Routes>
                    <Route index element={<Dashboard />} />
                    
                    {/* Módulos principales */}
                    <Route path="billing" element={<Billing />} />
                    <Route path="sales" element={<SalesList />} />
                    
                    {/* Configuraciones */}
                    <Route path="settings" element={<Settings />} />
                    <Route path="settings/users" element={<UsersManagement />} />
                    <Route path="settings/branches" element={<BranchesManagement />} />
                    
                    {/* Placeholder para otras rutas */}
                    {/* <Route path="products" element={<Products />} /> */}
                    {/* <Route path="clients" element={<Clients />} /> */}
                    {/* etc... */}
                  </Routes>
                </DashboardLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* Toast notifications globales */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '14px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  );
}

export default App;