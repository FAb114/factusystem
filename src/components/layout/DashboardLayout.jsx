import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useCurrentUser, useCurrentBranch } from '../../store/slices/authSlice';
import {
  Menu,
  X,
  Home,
  FileText,
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  Truck,
  UserCircle,
  Calculator,
  Settings,
  BarChart3,
  FileCheck,
  HelpCircle,
  Building2,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Gift,
} from 'lucide-react';

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  const user = useCurrentUser();
  const branch = useCurrentBranch();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Menú de navegación con rutas corregidas
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', color: 'text-blue-600' },
    { icon: FileText, label: 'Facturar', path: '/dashboard/billing', color: 'text-green-600', shortcut: 'F1' },
    { icon: ShoppingCart, label: 'Ventas', path: '/dashboard/sales', color: 'text-purple-600' },
    { icon: Truck, label: 'Compras', path: '/dashboard/purchases', color: 'text-orange-600' },
    { icon: Package, label: 'Productos', path: '/dashboard/products', color: 'text-indigo-600' },
    { icon: DollarSign, label: 'Caja', path: '/dashboard/cash', color: 'text-emerald-600' },
    { icon: Users, label: 'Clientes', path: '/dashboard/clients', color: 'text-pink-600' },
    { icon: Gift, label: 'Gift Cards', path: '/dashboard/giftcards', color: 'text-rose-600' },
    { icon: Truck, label: 'Proveedores', path: '/dashboard/suppliers', color: 'text-yellow-600' },
    { icon: UserCircle, label: 'Usuarios', path: '/dashboard/settings/users', color: 'text-cyan-600' }, // CORREGIDO
    { icon: Calculator, label: 'Cuotificador', path: '/dashboard/calculator', color: 'text-teal-600' },
    { icon: BarChart3, label: 'Reportes', path: '/dashboard/reports', color: 'text-red-600' },
    { icon: FileCheck, label: 'Documentos', path: '/dashboard/documents', color: 'text-violet-600' },
    { icon: Building2, label: 'Sucursales', path: '/dashboard/settings/branches', color: 'text-amber-600' }, // CORREGIDO
    { icon: Settings, label: 'Configuración', path: '/dashboard/settings', color: 'text-gray-600' },
    { icon: HelpCircle, label: 'Ayuda', path: '/dashboard/help', color: 'text-blue-500' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Función para verificar si una ruta está activa
  const isActiveRoute = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">FactuSystem</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg hover:bg-gray-100 transition"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = isActiveRoute(item.path);
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    console.log('Navegando a:', item.path);
                    navigate(item.path);
                  }}
                  className={`w-full flex items-center ${
                    sidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center'
                  } py-2.5 rounded-lg transition group relative ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500'}`} />
                  {sidebarOpen && (
                    <>
                      <span className={`text-sm font-medium ${
                        isActive ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {item.label}
                      </span>
                      {item.shortcut && (
                        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {item.shortcut}
                        </span>
                      )}
                    </>
                  )}
                  {/* Tooltip para sidebar colapsado */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.fullName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos, clientes, facturas..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Branch indicator */}
            {branch && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{branch.name}</span>
              </div>
            )}

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user?.fullName?.charAt(0)}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <>
                  {/* Overlay para cerrar el menú */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserMenuOpen(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/dashboard/settings');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4" />
                      Configuración
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;