import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useCurrentUser, useCurrentBranch } from '../../store/slices/authSlice';
import { DollarSign, Calendar, Building2, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

function CashOpening() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const branch = useCurrentBranch();
  const { openCashSession } = useAuthStore();

  const [formData, setFormData] = useState({
    openingAmount: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const currentDate = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.openingAmount) {
      newErrors.openingAmount = 'El monto inicial es requerido';
    } else if (isNaN(formData.openingAmount) || parseFloat(formData.openingAmount) < 0) {
      newErrors.openingAmount = 'El monto debe ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const cashSession = openCashSession({
        amount: parseFloat(formData.openingAmount),
        notes: formData.notes,
      });

      toast.success('¡Caja abierta exitosamente!');
      console.log('Sesión de caja creada:', cashSession);

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al abrir la caja');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Card de Apertura de Caja */}
      <div className="relative w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Apertura de Caja
            </h1>
            <p className="text-gray-600">
              Registra el monto inicial para comenzar tu jornada
            </p>
          </div>

          {/* Información del contexto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Fecha */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Fecha</span>
              </div>
              <p className="text-sm text-gray-900 font-semibold">{currentDate}</p>
              <p className="text-xs text-gray-600 mt-1">{currentTime}</p>
            </div>

            {/* Sucursal */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-800">Sucursal</span>
              </div>
              <p className="text-sm text-gray-900 font-semibold">
                {branch?.name || 'Sin sucursal'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {branch?.address || 'N/A'}
              </p>
            </div>

            {/* Usuario */}
            <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-pink-600" />
                <span className="text-xs font-medium text-pink-800">Usuario</span>
              </div>
              <p className="text-sm text-gray-900 font-semibold">
                {user?.fullName}
              </p>
              <p className="text-xs text-gray-600 mt-1">{user?.role}</p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Monto Inicial */}
            <div>
              <label
                htmlFor="openingAmount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Monto Inicial (ARS)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-lg font-medium">$</span>
                </div>
                <input
                  type="number"
                  id="openingAmount"
                  name="openingAmount"
                  value={formData.openingAmount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`block w-full pl-10 pr-4 py-4 border ${
                    errors.openingAmount ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-lg font-semibold`}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              {errors.openingAmount && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.openingAmount}
                </p>
              )}
            </div>

            {/* Notas opcionales */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Notas / Observaciones (opcional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                placeholder="Ej: Billetes de alta denominación, fondo fijo, etc."
              />
            </div>

            {/* Advertencia */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Importante:</strong> Verifica el monto cuidadosamente.
                    Este será el punto de partida para el cierre de caja.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/branch-selector')}
                className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Volver
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white font-medium
                  ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transform hover:scale-[1.02]'
                  } transition-all duration-200`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Abriendo caja...
                  </>
                ) : (
                  <>
                    Abrir Caja
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer informativo */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>
                Al abrir la caja, se iniciará una nueva sesión de trabajo. Podrás
                realizar ventas y movimientos hasta que realices el cierre de caja
                al finalizar tu jornada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashOpening;