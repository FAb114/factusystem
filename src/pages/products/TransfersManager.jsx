// src/pages/products/TransfersManager.jsx

import { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Building2,
  User,
  Calendar,
  Send,
  FileText,
  AlertCircle,
  Truck,
  Eye,
  Edit,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime, formatNumber } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import { useCurrentUser, useCurrentBranch } from '../../store/slices/authSlice';
import * as advancedApi from '../../services/api/products.advanced.api';

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    icon: Clock,
    badgeColor: 'bg-yellow-500',
  },
  approved: {
    label: 'Aprobada',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: CheckCircle,
    badgeColor: 'bg-blue-500',
  },
  in_transit: {
    label: 'En Tránsito',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: Truck,
    badgeColor: 'bg-purple-500',
  },
  completed: {
    label: 'Completada',
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: CheckCircle,
    badgeColor: 'bg-green-500',
  },
  cancelled: {
    label: 'Cancelada',
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: XCircle,
    badgeColor: 'bg-red-500',
  },
};

export default function TransfersManager() {
  const user = useCurrentUser();
  const currentBranch = useCurrentBranch();

  // Estados
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [itemsToSend, setItemsToSend] = useState([]);

  useEffect(() => {
    loadTransfers();
    
    // 🔥 Suscribirse a notificaciones en tiempo real con Supabase Realtime
    subscribeToTransferNotifications();
  }, [selectedStatus, currentBranch]);

  const loadTransfers = async () => {
    setLoading(true);
    
    const filters = {
      status: selectedStatus === 'all' ? null : selectedStatus,
    };

    // Si es sucursal matriz, ver transferencias donde ella es origen
    if (currentBranch?.is_principal) {
      filters.fromBranchId = currentBranch.id;
    } else {
      // Si es sucursal secundaria, ver transferencias donde ella es destino
      filters.toBranchId = currentBranch.id;
    }

    const result = await advancedApi.getTransferRequests(filters);
    
    if (result.success) {
      setTransfers(result.data);
      console.log('📦 Transferencias cargadas:', result.data);
    } else {
      toast.error('Error cargando transferencias');
    }
    
    setLoading(false);
  };

  // 🔥 Suscripción a notificaciones en tiempo real
  const subscribeToTransferNotifications = () => {
    // TODO: Implementar con Supabase Realtime
    // Esto permitirá recibir notificaciones instantáneas cuando:
    // - Una sucursal secundaria crea una solicitud
    // - Una transferencia cambia de estado
    
    console.log('🔔 Suscrito a notificaciones de transferencias');
  };

  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer);
    setDetailModalOpen(true);
  };

  const handleOpenApprovalModal = (transfer) => {
    setSelectedTransfer(transfer);
    
    // Pre-cargar las cantidades solicitadas
    const initialItems = transfer.items.map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product?.name || 'N/A',
      quantityRequested: item.quantity_requested,
      quantitySent: item.quantity_requested, // Por defecto enviar lo solicitado
    }));
    
    setItemsToSend(initialItems);
    setApprovalModalOpen(true);
  };

  const handleApproveTransfer = async () => {
    if (!selectedTransfer) return;

    // Validar que todas las cantidades sean válidas
    const invalid = itemsToSend.some(item => 
      !item.quantitySent || 
      item.quantitySent <= 0 || 
      item.quantitySent > item.quantityRequested
    );

    if (invalid) {
      toast.error('Revisa las cantidades a enviar');
      return;
    }

    const result = await advancedApi.approveTransfer(
      selectedTransfer.id,
      user.id,
      itemsToSend
    );

    if (result.success) {
      toast.success('✅ Transferencia aprobada y ejecutada');
      
      // Mostrar notificación adicional
      toast(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-bold">Stock transferido exitosamente</p>
            <p className="text-sm">
              Se notificó a {selectedTransfer.to_branch?.name}
            </p>
          </div>
        </div>,
        { duration: 5000 }
      );

      setApprovalModalOpen(false);
      setSelectedTransfer(null);
      loadTransfers();
    } else {
      toast.error(result.error || 'Error al aprobar transferencia');
    }
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    setItemsToSend(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantitySent: parseInt(newQuantity) || 0 }
          : item
      )
    );
  };

  // Estadísticas
  const stats = {
    pending: transfers.filter(t => t.status === 'pending').length,
    approved: transfers.filter(t => t.status === 'approved').length,
    inTransit: transfers.filter(t => t.status === 'in_transit').length,
    completed: transfers.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Transferencias Entre Sucursales
              </h1>
              <p className="text-sm text-slate-500">
                {currentBranch?.is_principal 
                  ? 'Solicitudes recibidas de otras sucursales' 
                  : 'Estado de tus solicitudes a la matriz'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            icon={FileText}
            onClick={loadTransfers}
            size="sm"
          >
            Actualizar
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`p-4 rounded-lg border-2 transition ${
              selectedStatus === 'pending'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-slate-200 bg-white hover:border-yellow-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-slate-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus('approved')}
            className={`p-4 rounded-lg border-2 transition ${
              selectedStatus === 'approved'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-slate-600">Aprobadas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus('in_transit')}
            className={`p-4 rounded-lg border-2 transition ${
              selectedStatus === 'in_transit'
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 bg-white hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-slate-600">En Tránsito</p>
                <p className="text-2xl font-bold text-purple-600">{stats.inTransit}</p>
              </div>
              <Truck className="w-8 h-8 text-purple-500" />
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus('completed')}
            className={`p-4 rounded-lg border-2 transition ${
              selectedStatus === 'completed'
                ? 'border-green-500 bg-green-50'
                : 'border-slate-200 bg-white hover:border-green-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-slate-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </button>
        </div>
      </div>

      {/* Lista de transferencias */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : transfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Package className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No hay transferencias</p>
            <p className="text-sm mt-2">No se encontraron transferencias con el estado seleccionado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((transfer) => {
              const statusConfig = STATUS_CONFIG[transfer.status];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={transfer.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {statusConfig.label}
                          </span>
                          <span className="font-mono text-sm text-slate-500">
                            #{transfer.transfer_number}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDateTime(transfer.created_at)}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="grid grid-cols-3 gap-6 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Origen</p>
                              <p className="font-medium text-slate-900">
                                {transfer.from_branch?.name || 'N/A'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {transfer.from_branch?.code}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Destino</p>
                              <p className="font-medium text-slate-900">
                                {transfer.to_branch?.name || 'N/A'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {transfer.to_branch?.code}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <User className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Solicitado por</p>
                              <p className="font-medium text-slate-900">
                                {transfer.requested_by_user?.full_name || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Productos */}
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Package className="w-4 h-4" />
                          <span className="font-medium">
                            {transfer.items?.length || 0} productos
                          </span>
                          <span className="text-slate-400">•</span>
                          <span>
                            Total: {transfer.items?.reduce((sum, item) => sum + item.quantity_requested, 0)} unidades
                          </span>
                        </div>

                        {transfer.notes && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                            <p className="font-medium text-slate-700 mb-1">Notas:</p>
                            {transfer.notes}
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          icon={Eye}
                          onClick={() => handleViewDetails(transfer)}
                          size="sm"
                        >
                          Ver Detalles
                        </Button>

                        {transfer.status === 'pending' && currentBranch?.is_principal && (
                          <Button
                            variant="primary"
                            icon={CheckCircle}
                            onClick={() => handleOpenApprovalModal(transfer)}
                            size="sm"
                          >
                            Aprobar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Detalle de transferencia */}
      {detailModalOpen && selectedTransfer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  Transferencia #{selectedTransfer.transfer_number}
                </h2>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr className="text-left text-xs font-semibold text-slate-600 uppercase">
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3 text-center">Solicitado</th>
                      <th className="px-4 py-3 text-center">Enviado</th>
                      <th className="px-4 py-3 text-center">Recibido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTransfer.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-xs text-slate-500">{item.product?.code}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-bold">
                          {formatNumber(item.quantity_requested)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.quantity_sent ? formatNumber(item.quantity_sent) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.quantity_received ? formatNumber(item.quantity_received) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end">
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Aprobar transferencia */}
      {approvalModalOpen && selectedTransfer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                Aprobar Transferencia #{selectedTransfer.transfer_number}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Ajusta las cantidades a enviar según disponibilidad
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  💡 Puedes modificar las cantidades si no tienes stock suficiente.
                  El sistema registrará lo que realmente envíes.
                </p>
              </div>

              <div className="space-y-4">
                {itemsToSend.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.productName}</p>
                        <p className="text-sm text-slate-500">
                          Solicitado: {formatNumber(item.quantityRequested)} unidades
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-slate-700">
                          Cantidad a enviar:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantityRequested}
                          value={item.quantitySent}
                          onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                          className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setApprovalModalOpen(false);
                  setSelectedTransfer(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                icon={CheckCircle}
                onClick={handleApproveTransfer}
              >
                Aprobar y Transferir Stock
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}