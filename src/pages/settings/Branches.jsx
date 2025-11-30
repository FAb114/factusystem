// src/pages/settings/Branches.jsx

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Hash,
  CheckCircle,
  XCircle,
  X,
  Save,
  AlertCircle,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as branchesApi from '../../services/api/branches.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

export default function BranchesManagement() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [stats, setStats] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    province: '',
    zipCode: '',
    phone: '',
    email: '',
    afipPosNumber: '',
    isPrincipal: false,
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadBranches();
    loadStats();
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    const result = await branchesApi.getBranches({ isActive: null });
    if (result.success) {
      setBranches(result.data);
    } else {
      toast.error('Error cargando sucursales');
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const result = await branchesApi.getBranchesStats();
    if (result.success) {
      setStats(result.data);
    }
  };

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        code: branch.code,
        address: branch.address || '',
        city: branch.city || '',
        province: branch.province || '',
        zipCode: branch.zip_code || '',
        phone: branch.phone || '',
        email: branch.email || '',
        afipPosNumber: branch.afip_pos_number || '',
        isPrincipal: branch.is_principal || false,
        isActive: branch.is_active,
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        province: '',
        zipCode: '',
        phone: '',
        email: '',
        afipPosNumber: '',
        isPrincipal: false,
        isActive: true,
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBranch(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    }

    if (!formData.afipPosNumber) {
      newErrors.afipPosNumber = 'El punto de venta AFIP es requerido';
    } else {
      const posNumber = parseInt(formData.afipPosNumber);
      if (isNaN(posNumber) || posNumber < 1 || posNumber > 99999) {
        newErrors.afipPosNumber = 'Debe ser un número entre 1 y 99999';
      }

      // Verificar si el punto de venta ya existe
      const existingPos = branches.find(
        (b) =>
          b.afip_pos_number === posNumber &&
          b.id !== editingBranch?.id
      );

      if (existingPos) {
        newErrors.afipPosNumber = `El punto de venta ${posNumber} ya está asignado a ${existingPos.name}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let result;

      if (editingBranch) {
        result = await branchesApi.updateBranch(editingBranch.id, formData);
      } else {
        result = await branchesApi.createBranch(formData);
      }

      if (result.success) {
        toast.success(
          editingBranch ? 'Sucursal actualizada' : 'Sucursal creada'
        );
        handleCloseModal();
        loadBranches();
        loadStats();
      } else {
        toast.error(result.error || 'Error al guardar sucursal');
      }
    } catch (error) {
      toast.error('Error al guardar sucursal');
    }
  };

  const handleDelete = async (branchId) => {
    if (!confirm('¿Estás seguro de eliminar esta sucursal?')) return;

    const result = await branchesApi.deleteBranch(branchId);

    if (result.success) {
      toast.success('Sucursal eliminada');
      loadBranches();
      loadStats();
    } else {
      toast.error('Error al eliminar sucursal');
    }
  };

  const getBranchStats = (branchId) => {
    return stats.find(s => s.id === branchId) || {};
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sucursales</h1>
              <p className="text-sm text-slate-500">
                {branches.length} sucursales registradas
              </p>
            </div>
          </div>

          <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>
            Nueva Sucursal
          </Button>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar sucursales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>
      </div>

      {/* Grid de sucursales */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map((branch) => {
              const branchStats = getBranchStats(branch.id);
              return (
                <div
                  key={branch.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${branch.is_principal ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-slate-200'} rounded-lg flex items-center justify-center`}>
                        <Building2 className={`w-6 h-6 ${branch.is_principal ? 'text-white' : 'text-slate-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          {branch.name}
                          {branch.is_principal && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              Principal
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-slate-500">{branch.code}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(branch)}
                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!branch.is_principal && (
                        <button
                          onClick={() => handleDelete(branch.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Punto de venta AFIP */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-700">
                        Punto de Venta AFIP
                      </span>
                      <span className="text-xl font-bold text-blue-900">
                        {String(branch.afip_pos_number).padStart(4, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Información */}
                  <div className="space-y-2 text-sm">
                    {branch.address && (
                      <div className="flex items-start gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {branch.address}
                          {branch.city && `, ${branch.city}`}
                        </span>
                      </div>
                    )}

                    {branch.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{branch.phone}</span>
                      </div>
                    )}

                    {branch.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span>{branch.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Estadísticas */}
                  {branchStats.sales_count !== undefined && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-xs text-slate-500">Usuarios</p>
                          <p className="text-lg font-bold text-slate-900">
                            {branchStats.users_count || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Ventas</p>
                          <p className="text-lg font-bold text-slate-900">
                            {branchStats.sales_count || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estado */}
                  <div className="mt-4">
                    {branch.is_active ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 w-full justify-center">
                        <CheckCircle className="w-3 h-3" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 w-full justify-center">
                        <XCircle className="w-3 h-3" />
                        Inactiva
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredBranches.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Building2 className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No se encontraron sucursales</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Alerta importante */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Punto de Venta AFIP</p>
                    <p>
                      Cada sucursal debe tener un punto de venta único para la facturación electrónica.
                      Este número se utilizará para todas las facturas emitidas desde esta sucursal.
                    </p>
                  </div>
                </div>

                {/* Datos básicos */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre de la sucursal"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    error={errors.name}
                    required
                  />

                  <Input
                    label="Código"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    error={errors.code}
                    placeholder="SUC001"
                    required
                  />
                </div>

                {/* Punto de venta AFIP */}
                <div>
                  <Input
                    label="Punto de Venta AFIP"
                    type="number"
                    min="1"
                    max="99999"
                    value={formData.afipPosNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, afipPosNumber: e.target.value })
                    }
                    error={errors.afipPosNumber}
                    helperText="Número del 1 al 99999 - Debe ser único para cada sucursal"
                    icon={Hash}
                    required
                  />
                </div>

                {/* Dirección */}
                <Input
                  label="Dirección"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  icon={MapPin}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ciudad"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Provincia
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) =>
                        setFormData({ ...formData, province: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">Seleccionar...</option>
                      {PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Código Postal"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                />

                {/* Contacto */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Teléfono"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    icon={Phone}
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    icon={Mail}
                  />
                </div>

                {/* Opciones */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isPrincipal}
                      onChange={(e) =>
                        setFormData({ ...formData, isPrincipal: e.target.checked })
                      }
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Sucursal principal
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Sucursal activa
                    </span>
                  </label>
                </div>
              </div>
            </form>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button variant="primary" icon={Save} onClick={handleSubmit}>
                {editingBranch ? 'Actualizar' : 'Crear Sucursal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}