// src/pages/settings/Users.jsx

import { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  X,
  Save,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as usersApi from '../../services/api/users.api';
import * as branchesApi from '../../services/api/branches.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ROLES = [
  { value: 'admin', label: 'Administrador', color: 'text-red-600 bg-red-100' },
  { value: 'manager', label: 'Gerente', color: 'text-purple-600 bg-purple-100' },
  { value: 'cashier', label: 'Cajero', color: 'text-blue-600 bg-blue-100' },
  { value: 'seller', label: 'Vendedor', color: 'text-green-600 bg-green-100' },
  { value: 'viewer', label: 'Visualizador', color: 'text-gray-600 bg-gray-100' },
];

const PERMISSIONS = [
  { id: 'sales.create', label: 'Crear ventas' },
  { id: 'sales.cancel', label: 'Anular ventas' },
  { id: 'products.manage', label: 'Gestionar productos' },
  { id: 'clients.manage', label: 'Gestionar clientes' },
  { id: 'cash.open', label: 'Abrir caja' },
  { id: 'cash.close', label: 'Cerrar caja' },
  { id: 'reports.view', label: 'Ver reportes' },
  { id: 'settings.manage', label: 'Gestionar configuración' },
];

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'seller',
    phone: '',
    permissions: [],
    branchIds: [],
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  // Cargar datos
  useEffect(() => {
    loadUsers();
    loadBranches();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await usersApi.getUsers();
    if (result.success) {
      setUsers(result.data);
    } else {
      toast.error('Error cargando usuarios');
    }
    setLoading(false);
  };

  const loadBranches = async () => {
    const result = await branchesApi.getBranches();
    if (result.success) {
      setBranches(result.data);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedRole === '' || user.role === selectedRole)
  );

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        fullName: user.full_name,
        role: user.role,
        phone: user.phone || '',
        permissions: user.permissions || [],
        branchIds: user.branches?.map(b => b.id) || [],
        isActive: user.is_active,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'seller',
        phone: '',
        permissions: [],
        branchIds: [],
        isActive: true,
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'seller',
      phone: '',
      permissions: [],
      branchIds: [],
      isActive: true,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    if (!editingUser && !formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (formData.branchIds.length === 0) {
      newErrors.branchIds = 'Selecciona al menos una sucursal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let result;

      if (editingUser) {
        result = await usersApi.updateUser(editingUser.id, formData);
      } else {
        result = await usersApi.createUser(formData);
      }

      if (result.success) {
        toast.success(
          editingUser ? 'Usuario actualizado' : 'Usuario creado'
        );
        handleCloseModal();
        loadUsers();
      } else {
        toast.error(result.error || 'Error al guardar usuario');
      }
    } catch (error) {
      toast.error('Error al guardar usuario');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    const result = await usersApi.deleteUser(userId);

    if (result.success) {
      toast.success('Usuario eliminado');
      loadUsers();
    } else {
      toast.error('Error al eliminar usuario');
    }
  };

  const togglePermission = (permissionId) => {
    setFormData((prev) => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions };
    });
  };

  const toggleBranch = (branchId) => {
    setFormData((prev) => {
      const branchIds = prev.branchIds.includes(branchId)
        ? prev.branchIds.filter((b) => b !== branchId)
        : [...prev.branchIds, branchId];
      return { ...prev, branchIds };
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
              <p className="text-sm text-slate-500">
                {users.length} usuarios registrados
              </p>
            </div>
          </div>

          <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>
            Nuevo Usuario
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos los roles</option>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-600 uppercase">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Sucursales</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const roleConfig = ROLES.find((r) => r.value === user.role);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {user.full_name}
                            </p>
                            <p className="text-sm text-slate-500">
                              @{user.username}
                            </p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${roleConfig?.color}`}
                        >
                          <Shield className="w-3 h-3" />
                          {roleConfig?.label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.branches?.slice(0, 2).map((branch) => (
                            <span
                              key={branch.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                            >
                              <Building2 className="w-3 h-3" />
                              {branch.code}
                            </span>
                          ))}
                          {user.branches?.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                              +{user.branches.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <UserCheck className="w-3 h-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <UserX className="w-3 h-3" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <UsersIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No se encontraron usuarios</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                {/* Datos básicos */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre de usuario"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    error={errors.username}
                    required
                    disabled={!!editingUser}
                  />

                  <Input
                    label="Nombre completo"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    error={errors.fullName}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    error={errors.email}
                    required
                  />

                  <Input
                    label="Teléfono"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                {/* Contraseña */}
                <div className="relative">
                  <Input
                    label={editingUser ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'}
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    error={errors.password}
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sucursales */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sucursales asignadas *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {branches.map((branch) => (
                      <label
                        key={branch.id}
                        className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.branchIds.includes(branch.id)}
                          onChange={() => toggleBranch(branch.id)}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">
                          {branch.name} ({branch.code})
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.branchIds && (
                    <p className="mt-1 text-sm text-red-600">{errors.branchIds}</p>
                  )}
                </div>

                {/* Permisos */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Permisos específicos
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PERMISSIONS.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">Usuario activo</span>
                  </label>
                </div>
              </div>
            </form>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button variant="primary" icon={Save} onClick={handleSubmit}>
                {editingUser ? 'Actualizar' : 'Crear Usuario'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}