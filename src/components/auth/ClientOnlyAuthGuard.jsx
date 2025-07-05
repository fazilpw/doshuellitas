// src/components/auth/ClientOnlyAuthGuard.jsx
// 🛡️ GUARD DE AUTENTICACIÓN SOLO DEL LADO DEL CLIENTE
// Actualizado para usar IndependentLoginForm en lugar del problemático SimpleLoginForm

import { useState, useEffect } from 'react';

// Importar el nuevo componente independiente
import IndependentLoginForm from './IndependentLoginForm.jsx';

// ===============================================
// 🛡️ GUARD PRINCIPAL PARA DASHBOARDS PROTEGIDOS
// ===============================================

const ClientOnlyAuthGuard = ({ children, requiredRole }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuthenticated: false,
    user: null,
    profile: null,
    error: null
  });
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Importación dinámica para evitar SSR
        const { authService } = await import('../../lib/authService.js');
        
        // Inicializar si no está listo
        if (!authService.isInitialized) {
          await authService.initialize();
        }
        
        // Verificar autenticación
        if (authService.isAuthenticated) {
          const profile = authService.profile;
          
          // Verificar rol si es requerido
          if (requiredRole && profile?.role !== requiredRole) {
            throw new Error(`Acceso denegado. Se requiere rol: ${requiredRole}`);
          }
          
          setAuthState({
            loading: false,
            isAuthenticated: true,
            user: authService.user,
            profile: authService.profile,
            error: null
          });
        } else {
          // No autenticado, redirigir a login
          window.location.href = '/login/';
        }
      } catch (error) {
        console.error('❌ Error verificando auth:', error);
        setAuthState({
          loading: false,
          isAuthenticated: false,
          user: null,
          profile: null,
          error: error.message
        });
      }
    };
    
    checkAuth();
  }, [requiredRole]);
  
  // Loading
  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🐕</div>
          <div className="text-xl font-semibold text-[#2C3E50] mb-2">
            Verificando acceso...
          </div>
          <div className="text-sm text-gray-600">
            Cargando dashboard
          </div>
        </div>
      </div>
    );
  }
  
  // Error
  if (authState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-600 mb-4">Error de Acceso</h2>
          <p className="text-gray-600 mb-6">{authState.error}</p>
          <button 
            onClick={() => window.location.href = '/login/'}
            className="w-full bg-[#56CCF2] hover:bg-[#2C3E50] text-white p-3 rounded-lg font-semibold transition-colors"
          >
            🔐 Ir al Login
          </button>
        </div>
      </div>
    );
  }
  
  // Dashboard autenticado
  return children;
};

// ===============================================
// 🎯 PÁGINA DE LOGIN COMPLETA (SOLO CLIENTE)
// ===============================================
// SOLUCIÓN: Ahora usa IndependentLoginForm que NO depende de useAuth()

export const ClientOnlyLoginPage = () => {
  return <IndependentLoginForm />;
};

// ===============================================
// 🛡️ WRAPPER PARA DASHBOARDS PROTEGIDOS
// ===============================================

export const ProtectedDashboard = ({ children, requiredRole }) => {
  return (
    <ClientOnlyAuthGuard requiredRole={requiredRole}>
      {children}
    </ClientOnlyAuthGuard>
  );
};

export default ClientOnlyAuthGuard;