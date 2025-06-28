// src/components/dashboard/DashboardWrapper.jsx
// 🛡️ WRAPPER SEGURO PARA DASHBOARDS - COMPATIBLE CON SSG/NETLIFY
// Club Canino Dos Huellitas

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../auth/AuthProvider.jsx';

// ===============================================
// 🔧 COMPONENTE DE LOADING SEGURO
// ===============================================

const DashboardLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4 animate-pulse">🐕</div>
      <div className="text-xl font-semibold text-[#2C3E50] mb-2">
        Cargando Club Canino...
      </div>
      <div className="text-sm text-gray-600">
        Inicializando dashboard
      </div>
      
      {/* Indicador de progreso */}
      <div className="mt-4 w-48 mx-auto bg-gray-200 rounded-full h-2">
        <div className="bg-[#56CCF2] h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
      </div>
    </div>
  </div>
);

// ===============================================
// 🛡️ COMPONENTE INTERNO CON USEAUTH
// ===============================================

const DashboardContent = ({ children, requiredRole }) => {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mostrar loading hasta que todo esté listo
  if (!mounted || loading) {
    return <DashboardLoading />;
  }

  // Verificar autenticación
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🔐</div>
          <div className="text-xl font-semibold text-red-600 mb-4">
            Sesión no válida
          </div>
          <div className="text-gray-700 mb-6">
            Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
          </div>
          <button 
            onClick={() => window.location.href = '/login/'}
            className="bg-[#56CCF2] hover:bg-[#4AB8E0] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Ir a Login
          </button>
        </div>
      </div>
    );
  }

  // Verificar rol si es requerido
  if (requiredRole && profile?.role !== requiredRole) {
    const dashboardMap = {
      'padre': '/dashboard/padre',
      'profesor': '/dashboard/profesor', 
      'admin': '/dashboard/admin',
      'conductor': '/dashboard/conductor'
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🚫</div>
          <div className="text-xl font-semibold text-orange-600 mb-4">
            Acceso Denegado
          </div>
          <div className="text-gray-700 mb-6">
            No tienes permisos para acceder a esta sección.
            <br />
            <span className="text-sm">Tu rol: {profile?.role || 'Sin rol'}</span>
          </div>
          <button 
            onClick={() => {
              const correctDashboard = dashboardMap[profile?.role] || '/login/';
              window.location.href = correctDashboard;
            }}
            className="bg-[#56CCF2] hover:bg-[#4AB8E0] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Ir a mi Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Todo está bien, renderizar contenido
  return children;
};

// ===============================================
// 🚀 WRAPPER PRINCIPAL EXPORTADO
// ===============================================

const DashboardWrapper = ({ children, requiredRole }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Durante SSR/SSG o antes de hidratación, mostrar loading
  if (!isClient) {
    return <DashboardLoading />;
  }

  return (
    <AuthProvider>
      <DashboardContent requiredRole={requiredRole}>
        {children}
      </DashboardContent>
    </AuthProvider>
  );
};

export default DashboardWrapper;

// ===============================================
// 🎯 COMPONENTES ESPECÍFICOS POR ROL
// ===============================================

export const AdminDashboardWrapper = ({ children }) => (
  <DashboardWrapper requiredRole="admin">
    {children}
  </DashboardWrapper>
);

export const ParentDashboardWrapper = ({ children }) => (
  <DashboardWrapper requiredRole="padre">
    {children}
  </DashboardWrapper>
);

export const TeacherDashboardWrapper = ({ children }) => (
  <DashboardWrapper requiredRole="profesor">
    {children}
  </DashboardWrapper>
);

export const ConductorDashboardWrapper = ({ children }) => (
  <DashboardWrapper requiredRole="conductor">
    {children}
  </DashboardWrapper>
);

// ===============================================
// 🔧 UTILIDADES PARA DEBUGGING
// ===============================================

export const DashboardDebugInfo = () => {
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      const info = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        isClient: typeof window !== 'undefined',
        hasLocalStorage: typeof localStorage !== 'undefined',
        environment: import.meta.env.MODE
      };
      setDebugInfo(info);
    }
  }, []);

  if (import.meta.env.MODE !== 'development' || !debugInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs">
      <div className="font-bold mb-1">🔧 Debug Info:</div>
      <div>Env: {debugInfo.environment}</div>
      <div>Client: {debugInfo.isClient ? '✅' : '❌'}</div>
      <div>Storage: {debugInfo.hasLocalStorage ? '✅' : '❌'}</div>
    </div>
  );
};