// src/components/dashboard/DashboardWrapper.jsx
// 🛡️ WRAPPER CON REDIRECCIÓN AUTOMÁTICA INTELIGENTE - ARREGLADO
// Evita que usuarios como Carlos vuelvan a tener problemas de redirección

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../auth/AuthProvider.jsx';

// ===============================================
// 🔧 COMPONENTE DE LOADING
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
      <div className="mt-4 w-48 mx-auto bg-gray-200 rounded-full h-2">
        <div className="bg-[#56CCF2] h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
      </div>
    </div>
  </div>
);

// ===============================================
// 🔄 COMPONENTE DE REDIRECCIÓN
// ===============================================
const RedirectingMessage = ({ userRole, correctURL }) => (
  <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center">
    <div className="text-center max-w-md mx-4">
      <div className="text-6xl mb-4 animate-bounce">🔄</div>
      <div className="text-xl font-semibold text-[#56CCF2] mb-4">
        Redirigiendo...
      </div>
      <div className="text-gray-700 mb-6">
        Te estamos llevando a tu dashboard correcto
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="text-sm text-gray-600 mb-2">
          <strong>Tu rol:</strong> {userRole}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Destino:</strong> {correctURL}
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Si no se redirecciona automáticamente, 
        <button 
          onClick={() => window.location.href = correctURL}
          className="text-[#56CCF2] underline ml-1"
        >
          haz click aquí
        </button>
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
  const [redirecting, setRedirecting] = useState(false);
  const [redirectInfo, setRedirectInfo] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ===============================================
  // 🎯 LÓGICA DE REDIRECCIÓN INTELIGENTE
  // ===============================================
  useEffect(() => {
    if (!mounted || loading || !isAuthenticated) return;

    const userRole = profile?.role;
    if (!userRole) return;

    // Mapeo de roles a dashboards
    const dashboardMap = {
      'padre': '/dashboard/padre/',
      'profesor': '/dashboard/profesor/', 
      'admin': '/dashboard/admin/',
      'conductor': '/dashboard/conductor/'
    };

    // Detectar dashboard actual
    const currentPath = window.location.pathname;
    let currentDashboard = null;
    
    for (const [role, path] of Object.entries(dashboardMap)) {
      if (currentPath.includes(path.replace(/\/$/, ''))) {
        currentDashboard = role;
        break;
      }
    }

    const correctURL = dashboardMap[userRole];

    console.log('🔍 Verificando redirección:', {
      userRole,
      currentDashboard,
      requiredRole,
      currentPath,
      correctURL
    });

    // 🎯 CASO 1: Usuario en dashboard incorrecto
    if (currentDashboard && userRole !== currentDashboard) {
      console.log(`🔄 REDIRECCIÓN: Usuario ${userRole} en dashboard ${currentDashboard}`);
      setRedirectInfo({ userRole, correctURL });
      setRedirecting(true);
      
      setTimeout(() => {
        window.location.href = correctURL;
      }, 2000);
      return;
    }

    // 🎯 CASO 2: Rol específico requerido diferente al usuario
    if (requiredRole && userRole !== requiredRole) {
      console.log(`⚠️ Rol incorrecto: requiere ${requiredRole}, usuario es ${userRole}`);
      setRedirectInfo({ userRole, correctURL });
      setRedirecting(true);
      
      setTimeout(() => {
        window.location.href = correctURL;
      }, 2000);
      return;
    }

    // ✅ Todo correcto
    console.log('✅ Usuario en dashboard correcto');
  }, [mounted, loading, isAuthenticated, profile, requiredRole]);

  // Mostrar loading hasta que todo esté listo
  if (!mounted || loading) {
    return <DashboardLoading />;
  }

  // Mostrar pantalla de redirección
  if (redirecting && redirectInfo) {
    return <RedirectingMessage {...redirectInfo} />;
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

  // ===============================================
  // ✅ RENDERIZAR DASHBOARD AUTORIZADO
  // ===============================================

  // Verificar rol final (solo mostrar error si NO se está redirigiendo)
  if (requiredRole && profile?.role !== requiredRole && !redirecting) {
    const dashboardMap = {
      'padre': '/dashboard/padre/',
      'profesor': '/dashboard/profesor/', 
      'admin': '/dashboard/admin/',
      'conductor': '/dashboard/conductor/'
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🚫</div>
          <div className="text-xl font-semibold text-orange-600 mb-4">
            Acceso Denegado
          </div>
          <div className="text-gray-700 mb-4">
            No tienes permisos para acceder a esta sección.
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="text-sm text-gray-600 mb-2">
              <strong>Tu rol:</strong> {profile?.role || 'Sin rol'}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Se requiere:</strong> {requiredRole}
            </div>
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