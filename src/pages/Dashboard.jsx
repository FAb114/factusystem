import { useEffect, useState } from 'react';
import { useCurrentUser, useCurrentBranch } from '../store/slices/authSlice';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  Calendar,
  Clock,
} from 'lucide-react';

function Dashboard() {
  const user = useCurrentUser();
  const branch = useCurrentBranch();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Datos de ejemplo (TODO: Conectar con API real)
  const stats = [
    {
      title: 'Ventas del Día',
      value: '$125,430',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Transacciones',
      value: '342',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Clientes Atendidos',
      value: '186',
      change: '+5.4%',
      trend: 'up',
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: 'Productos Vendidos',
      value: '892',
      change: '-2.3%',
      trend: 'down',
      icon: Package,
      color: 'bg-orange-500',
    },
  ];

  const recentSales = [
    { id: 1, client: 'Juan Pérez', amount: '$2,450', time: '10:45 AM', status: 'completed' },
    { id: 2, client: 'María González', amount: '$1,230', time: '11:20 AM', status: 'completed' },
    { id: 3, client: 'Carlos Rodríguez', amount: '$890', time: '11:35 AM', status: 'pending' },
    { id: 4, client: 'Ana Martínez', amount: '$3,560', time: '12:10 PM', status: 'completed' },
  ];

  const lowStockProducts = [
    { id: 1, name: 'Producto A', stock: 5, minStock: 20 },
    { id: 2, name: 'Producto B', stock: 8, minStock: 15 },
    { id: 3, name: 'Producto C', stock: 2, minStock: 10 },
  ];

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido, {user?.fullName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {branch ? `Sucursal: ${branch.name}` : 'Dashboard Principal'}
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">
              {formatDate(currentTime)}
            </span>
          </div>
          <div className="w-px h-6 bg-gray-300"></div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium font-mono">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp
                    className={`w-4 h-4 ${
                      stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500">vs ayer</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas Recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Ventas Recientes
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver todas
            </button>
          </div>
          
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sale.client}</p>
                    <p className="text-sm text-gray-500">{sale.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{sale.amount}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      sale.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {sale.status === 'completed' ? 'Completada' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Bajo */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">
              Alertas de Stock
            </h2>
          </div>

          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded-lg"
              >
                <p className="font-medium text-gray-900 mb-1">
                  {product.name}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Stock actual: <strong>{product.stock}</strong>
                  </span>
                  <span className="text-gray-600">
                    Mínimo: {product.minStock}
                  </span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{
                      width: `${(product.stock / product.minStock) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium">
            Ver Inventario Completo
          </button>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-blue-500" />
            <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
              Nueva Venta
            </p>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition group">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-green-500" />
            <p className="text-sm font-medium text-gray-700 group-hover:text-green-700">
              Productos
            </p>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition group">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-purple-500" />
            <p className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
              Clientes
            </p>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition group">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-orange-500" />
            <p className="text-sm font-medium text-gray-700 group-hover:text-orange-700">
              Caja
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;