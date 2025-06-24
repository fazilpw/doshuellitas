// src/components/dashboard/PadreSidebar.jsx
import React from 'react';

export default function PadreSidebar({ sections = [] }) {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard/padre', icon: '🏠', current: true },
    { name: 'Mis Mascotas', href: '/mis-mascotas', icon: '🐕' },
    { name: 'Evaluaciones', href: '/evaluaciones', icon: '📝' },
    { name: 'Progreso', href: '/progreso', icon: '📈' },
    { name: 'Fotos', href: '/fotos', icon: '📸' },
    { name: 'Contacto', href: 'https://wa.me/573144329824', icon: '💬', external: true }
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center">
          <img className="h-8 w-auto" src="/images/logo.png" alt="Club Canino" />
          <span className="ml-2 text-lg font-semibold text-[#2C3E50]">Panel Padre</span>
        </div>
      </div>
      
      <nav className="mt-8 px-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target={item.external ? '_blank' : '_self'}
              rel={item.external ? 'noopener noreferrer' : ''}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                item.current
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#56CCF2]'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </a>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-[#FFFBF0] border border-[#C7EA46] rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">🐾</span>
            <div className="ml-3">
              <p className="text-sm font-medium text-[#2C3E50]">¿Necesitas ayuda?</p>
              <p className="text-xs text-gray-600">Contáctanos por WhatsApp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/components/dashboard/ProfesorSidebar.jsx
export function ProfesorSidebar({ sections = [] }) {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard/profesor', icon: '🏠', current: true },
    { name: 'Estudiantes', href: '/estudiantes', icon: '🐕' },
    { name: 'Evaluar', href: '/evaluaciones/crear', icon: '📝' },
    { name: 'Historial', href: '/evaluaciones/historial', icon: '📋' },
    { name: 'Reportes', href: '/reportes', icon: '📊' },
    { name: 'Actividades', href: '/actividades', icon: '🎾' }
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center">
          <img className="h-8 w-auto" src="/images/logo.png" alt="Club Canino" />
          <span className="ml-2 text-lg font-semibold text-[#2C3E50]">Panel Profesor</span>
        </div>
      </div>
      
      <nav className="mt-8 px-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                item.current
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#56CCF2]'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </a>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">🎓</span>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Modo Profesor</p>
              <p className="text-xs text-green-600">Evalúa cuando sea necesario</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/components/dashboard/AdminSidebar.jsx
export function AdminSidebar({ sections = [] }) {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: '🏠', current: true },
    { name: 'Usuarios', href: '/admin/usuarios', icon: '👥' },
    { name: 'Perros', href: '/admin/perros', icon: '🐕' },
    { name: 'Evaluaciones', href: '/admin/evaluaciones', icon: '📊' },
    { name: 'Fotos', href: '/admin/fotos', icon: '📸' },
    { name: 'Reportes', href: '/admin/reportes', icon: '📈' },
    { name: 'Configuración', href: '/admin/config', icon: '⚙️' }
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center">
          <img className="h-8 w-auto" src="/images/logo.png" alt="Club Canino" />
          <span className="ml-2 text-lg font-semibold text-[#2C3E50]">Panel Admin</span>
        </div>
      </div>
      
      <nav className="mt-8 px-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                item.current
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#56CCF2]'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </a>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">⚡</span>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Modo Admin</p>
              <p className="text-xs text-red-600">Control total del sistema</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}