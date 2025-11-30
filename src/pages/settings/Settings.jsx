// src/pages/settings/Settings.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Users,
  Building2,
  CreditCard,
  Printer,
  Mail,
  MessageCircle,
  Shield,
  Palette,
  Database,
  FileText,
  ChevronRight,
} from 'lucide-react';

const SETTINGS_SECTIONS = [
  {
    id: 'users',
    title: 'Usuarios',
    description: 'Gestionar usuarios, roles y permisos',
    icon: Users,
    color: 'bg-blue-500',
    path: '/dashboard/settings/users',
  },
  {
    id: 'branches',
    title: 'Sucursales',
    description: 'Administrar sucursales y puntos de venta',
    icon: Building2,
    color: 'bg-purple-500',
    path: '/dashboard/settings/branches',
  },
  {
    id: 'company',
    title: 'Datos de la Empresa',
    description: 'Información fiscal, logo y configuración general',
    icon: FileText,
    color: 'bg-green-500',
    path: '/dashboard/settings/company',
  },
  {
    id: 'integrations',
    title: 'Integraciones',
    description: 'AFIP, Mercado Pago, bancos y servicios externos',
    icon: CreditCard,
    color: 'bg-orange-500',
    path: '/dashboard/settings/integrations',
  },
  {
    id: 'printer',
    title: 'Impresoras',
    description: 'Configurar impresoras térmicas y formatos',
    icon: Printer,
    color: 'bg-cyan-500',
    path: '/dashboard/settings/printer',
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    description: 'Email, WhatsApp y alertas del sistema',
    icon: Mail,
    color: 'bg-pink-500',
    path: '/dashboard/settings/notifications',
  },
  {
    id: 'security',
    title: 'Seguridad',
    description: 'Contraseñas, autenticación y auditoría',
    icon: Shield,
    color: 'bg-red-500',
    path: '/dashboard/settings/security',
  },
  {
    id: 'appearance',
    title: 'Apariencia',
    description: 'Tema, colores y personalización',
    icon: Palette,
    color: 'bg-indigo-500',
    path: '/dashboard/settings/appearance',
  },
  {
    id: 'backup',
    title: 'Respaldo y Sincronización',
    description: 'Backups automáticos y sincronización',
    icon: Database,
    color: 'bg-teal-500',
    path: '/dashboard/settings/backup',
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = SETTINGS_SECTIONS.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
              <p className="text-sm text-slate-500">
                Administra tu sistema FactuSystem
              </p>
            </div>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Buscar configuraciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <SettingsIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Grid de secciones */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleNavigate(section.path)}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left group border border-slate-200 hover:border-blue-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${section.color} p-3 rounded-lg`}>
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition">
                {section.title}
              </h3>

              <p className="text-sm text-slate-600">
                {section.description}
              </p>
            </button>
          ))}
        </div>

        {filteredSections.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <SettingsIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No se encontraron configuraciones</p>
            <p className="text-sm">Intenta con otro término de búsqueda</p>
          </div>
        )}

        {/* Información del sistema */}
        <div className="mt-8 bg-slate-100 rounded-xl p-6 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 uppercase mb-4">
            Información del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Versión</p>
              <p className="text-sm font-bold text-slate-900">
                FactuSystem v2.0.0
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Base de Datos</p>
              <p className="text-sm font-bold text-slate-900">
                PostgreSQL (Supabase)
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Estado</p>
              <p className="text-sm font-bold text-green-600">
                ✓ Sistema Operativo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}