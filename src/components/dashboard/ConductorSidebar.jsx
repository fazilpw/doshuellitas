// src/components/dashboard/ConductorSidebar.jsx
import { useState } from 'react';

export const ConductorSidebar = ({ sections = [] }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      icon: '🚐',
      label: 'Control de Ruta',
      href: '/dashboard/conductor',
      active: true,
      description: 'Panel principal de tracking'
    },
    {
      icon: '📋',
      label: 'Historial de Rutas',
      href: '/dashboard/conductor/historial',
      active: false,
      description: 'Ver rutas anteriores'
    },
    {
      icon: '🐕',
      label: 'Perros Asignados',
      href: '/dashboard/conductor/perros',
      active: false,
      description: 'Lista de perros regulares'
    },
    {
      icon: '📞',
      label: 'Contactos',
      href: '/dashboard/conductor/contactos',
      active: false,
      description: 'Padres y emergencias'
    },
    {
      icon: '⚙️',
      label: 'Mi Perfil',
      href: '/dashboard/conductor/perfil',
      active: false,
      description: 'Configuración personal'
    }
  ];

  const quickActions = [
    {
      icon: '🚨',
      label: 'Emergencia',
      action: 'emergency',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      icon: '📞',
      label: 'Llamar Colegio',
      action: 'call-school',
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ];

  const handleQuickAction = (action) => {
    switch (action) {
      case 'emergency':
        // Función de emergencia
        if (confirm('¿Confirmas que hay una emergencia?')) {
          alert('🚨 Alerta de emergencia enviada al colegio');
          // Aquí se enviaría la alerta real
        }
        break;
      case 'call-school':
        window.open('tel:+573144329824');
        break;
    }
  };

  return (
    <div className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <div className="flex items-center space-x-2">
                <img src="/images/logo.png" alt="Club Canino" className="h-8 w-8" />
                <span className="text-lg font-bold text-[#2C3E50]">Conductor</span>
              </div>
              <p className="text-sm text-[#5B9BD5] mt-1">Panel de Control</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-500">
              {isCollapsed ? '→' : '←'}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-[#56CCF2] text-white' 
                  : 'text-gray-700 hover:bg-[#FFFBF0] hover:text-[#2C3E50]'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="text-lg">{item.icon}</span>
              {!isCollapsed && (
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${item.active ? 'text-blue-100' : 'text-gray-500'}`}>
                    {item.description}
                  </div>
                </div>
              )}
            </a>
          ))}
        </div>
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Acciones Rápidas</h3>
          </div>
        )}
        
        <div className="space-y-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.action)}
              className={`w-full flex items-center space-x-2 p-2 rounded-lg text-white transition-colors ${action.color}`}
              title={isCollapsed ? action.label : ''}
            >
              <span>{action.icon}</span>
              {!isCollapsed && <span className="text-sm font-medium">{action.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="text-xs text-gray-500">
            <div className="flex items-center justify-between mb-1">
              <span>Estado:</span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                En línea
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Versión:</span>
              <span>v1.0.0</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConductorSidebar;