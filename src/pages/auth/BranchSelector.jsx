import { useNavigate } from 'react-router-dom';
import { useAuthStore, useCurrentUser } from '../../store/slices/authSlice';
import { Building2, MapPin, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

function BranchSelector() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { selectBranch } = useAuthStore();

  const handleSelectBranch = (branch) => {
    selectBranch(branch);
    toast.success(`Sucursal ${branch.name} seleccionada`);
    navigate('/cash-opening');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Seleccionar Sucursal
            </h1>
            <p className="text-gray-600">
              Bienvenido <strong>{user?.fullName}</strong>, elige la sucursal donde trabajarás hoy
            </p>
          </div>

          {/* Lista de sucursales */}
          <div className="space-y-3">
            {user?.branches?.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelectBranch(branch)}
                className="w-full p-5 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-500 rounded-xl transition-all group text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {branch.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {branch.address || 'Sin dirección registrada'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition" />
                </div>
              </button>
            ))}
          </div>

          {/* Botón de cerrar sesión */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                navigate('/login');
              }}
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BranchSelector;