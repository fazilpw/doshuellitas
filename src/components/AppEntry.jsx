// src/components/AppEntry.jsx - Entrada Principal de la Aplicación
import { useEffect, useState } from 'react';
import { useAuth } from './auth/AuthProvider.jsx';
import { useClubCaninoAuth } from '../hooks/useClubCaninoAuth.js';

// Dashboards por rol
import ParentDashboard from './dashboard/ParentDashboard.jsx';
import TeacherDashboard from './dashboard/TeacherDashboard.jsx';
import AdminDashboard from './dashboard/AdminDashboard.jsx';

// Componentes de carga y error
import ClubCaninoLoginForm from './auth/ClubCaninoLoginForm.jsx';

// ============================================
// 🚀 COMPONENTE PRINCIPAL DE ENTRADA
// ============================================

export default function AppEntry() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { 
    clubRole, 
    loading: clubLoading, 
    clubDisplayName,
    syncOfflineData 
  } = useClubCaninoAuth();
  
  const [initialLoad, setInitialLoad] = useState(true);
  const [offlineSynced, setOfflineSynced] = useState(false);

  // ============================================
  // 🔄 EFECTOS DE INICIALIZACIÓN
  // ============================================

  useEffect(() => {
    // Sincronizar datos offline cuando se carga la app
    if (isAuthenticated && !offlineSynced) {
      handleOfflineSync();
    }
  }, [isAuthenticated, offlineSynced]);

  useEffect(() => {
    // Marcar como carga inicial completada
    if (!authLoading && !clubLoading) {
      setTimeout(() => setInitialLoad(false), 500); // Pequeño delay para transición suave
    }
  }, [authLoading, clubLoading]);

  // ============================================
  // 🔄 SINCRONIZACIÓN OFFLINE
  // ============================================

  const handleOfflineSync = async () => {
    try {
      console.log('🔄 Sincronizando datos offline...');
      await syncOfflineData();
      setOfflineSynced(true);
      console.log('✅ Sincronización offline completada');
    } catch (error) {
      console.error('❌ Error en sincronización offline:', error);
      // No bloquear la app por errores de sync
      setOfflineSynced(true);
    }
  };

  // ============================================
  // ⏳ ESTADO DE CARGA INICIAL
  // ============================================

  if (initialLoad || authLoading || clubLoading) {
    return <AppLoadingScreen />;
  }

  // ============================================
  // 🔐 USUARIO NO AUTENTICADO
  // ============================================

  if (!isAuthenticated) {
    return <ClubCaninoLoginForm />;
  }

  // ============================================
  // 📱 USUARIO AUTENTICADO - MOSTRAR DASHBOARD
  // ============================================

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      
      {/* Header de la aplicación */}
      <AppHeader />
      
      {/* Notificación de sync offline si es necesario */}
      {!offlineSynced && <OfflineSyncNotification />}
      
      {/* Dashboard basado en rol */}
      <main className="pb-safe">
        {renderDashboardByRole(clubRole)}
      </main>
      
      {/* Footer móvil */}
      <MobileBottomNavigation />
      
    </div>
  );
}

// ============================================
// ⏳ PANTALLA DE CARGA
// ============================================

function AppLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center">
      <div className="text-center">
        
        {/* Logo animado */}
        <div className="w-24 h-24 bg-[#56CCF2] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
          <span className="text-4xl">🐕</span>
        </div>
        
        {/* Título */}
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">
          Club Canino
        </h1>
        <p className="text-[#56CCF2] font-medium mb-6">
          Dos Huellitas
        </p>
        
        {/* Indicador de carga */}
        <div className="flex justify-center space-x-2 mb-4">
          <div className="w-3 h-3 bg-[#56CCF2] rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-[#56CCF2] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-[#56CCF2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        <p className="text-gray-600 text-sm">
          Cargando tu panel personalizado...
        </p>
        
        {/* Progreso de carga */}
        <div className="w-64 h-1 bg-gray-200 rounded-full mx-auto mt-4 overflow-hidden">
          <div className="h-full bg-[#56CCF2] rounded-full animate-pulse" style={{ width: '70%' }}></div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 🎩 HEADER DE LA APLICACIÓN
// ============================================

function AppHeader() {
  const { clubDisplayName, clubRole } = useClubCaninoAuth();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await signOut();
    }
  };

  const roleColors = {
    padre: 'bg-green-100 text-green-700',
    profesor: 'bg-blue-100 text-blue-700',
    admin: 'bg-purple-100 text-purple-700'
  };

  const roleIcons = {
    padre: '👨‍👩‍👧‍👦',
    profesor: '👨‍🏫',
    admin: '👑'
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo y título */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#56CCF2] rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm">🐕</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#2C3E50]">
                Club Canino
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Dos Huellitas
              </p>
            </div>
          </div>

          {/* Información del usuario */}
          <div className="flex items-center space-x-4">
            
            {/* Badge de rol */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleColors[clubRole] || 'bg-gray-100 text-gray-700'}`}>
              <span className="mr-1">{roleIcons[clubRole]}</span>
              {clubRole}
            </span>

            {/* Nombre del usuario */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {clubDisplayName}
              </p>
              <p className="text-xs text-gray-500">
                Panel personalizado
              </p>
            </div>

            {/* Botón de logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Cerrar sesión"
            >
              <span className="text-lg">🚪</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================
// 🔄 NOTIFICACIÓN DE SINCRONIZACIÓN
// ============================================

function OfflineSyncNotification() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <p className="text-sm text-blue-700">
            Sincronizando datos offline...
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-blue-400 hover:text-blue-600"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ============================================
// 📱 NAVEGACIÓN MÓVIL INFERIOR
// ============================================

function MobileBottomNavigation() {
  const { clubRole } = useClubCaninoAuth();

  const getNavigationItems = (role) => {
    const base = [
      { icon: '🏠', label: 'Inicio', href: '/app' },
      { icon: '📊', label: 'Dashboard', href: '/dashboard' }
    ];

    switch (role) {
      case 'padre':
        return [
          ...base,
          { icon: '🐕', label: 'Mis Mascotas', href: '/mi-mascotas' },
          { icon: '📝', label: 'Evaluar', href: '/evaluacion' },
          { icon: '💬', label: 'Contacto', href: 'https://wa.me/573144329824' }
        ];
      case 'profesor':
        return [
          ...base,
          { icon: '📋', label: 'Evaluaciones', href: '/evaluaciones' },
          { icon: '👥', label: 'Estudiantes', href: '/estudiantes' },
          { icon: '📊', label: 'Reportes', href: '/reportes' }
        ];
      case 'admin':
        return [
          ...base,
          { icon: '👥', label: 'Usuarios', href: '/usuarios' },
          { icon: '⚙️', label: 'Config', href: '/configuracion' },
          { icon: '📈', label: 'Analytics', href: '/analytics' }
        ];
      default:
        return base;
    }
  };

  const navigationItems = getNavigationItems(clubRole);

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-inset-bottom">
      <div className="flex justify-around">
        {navigationItems.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="flex flex-col items-center py-1 px-2 text-gray-500 hover:text-[#56CCF2] transition-colors"
            target={item.href.startsWith('http') ? '_blank' : '_self'}
            rel={item.href.startsWith('http') ? 'noopener noreferrer' : ''}
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

// ============================================
// 🎯 RENDERIZAR DASHBOARD POR ROL
// ============================================

function renderDashboardByRole(role) {
  switch (role) {
    case 'padre':
      return <ParentDashboard />;
    case 'profesor':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <DefaultDashboard role={role} />;
  }
}

// ============================================
// 📊 DASHBOARD POR DEFECTO
// ============================================

function DefaultDashboard({ role }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🤔</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Dashboard en Construcción
        </h2>
        <p className="text-gray-600 mb-6">
          El dashboard para el rol "{role}" está siendo desarrollado.
        </p>
        <div className="space-y-3">
          <a
            href="/dashboard"
            className="inline-block bg-[#56CCF2] text-white px-6 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            Ver Dashboard General
          </a>
          <br />
          <a
            href="https://wa.me/573144329824"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            💬 Contactar Soporte
          </a>
        </div>
      </div>
    </div>
  );
}