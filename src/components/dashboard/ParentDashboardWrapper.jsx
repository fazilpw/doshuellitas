// src/components/dashboard/ParentDashboardWrapper.jsx
// 👤 WRAPPER PARA PADRE DASHBOARD CON AUTENTICACIÓN - PROPS CORREGIDAS ✅

import { useState, useEffect } from 'react';
import ParentDashboard from './ParentDashboard.jsx';

const ParentDashboardWrapper = () => {
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
        console.log('🔄 ParentDashboardWrapper: Verificando autenticación...');
        
        // Import dinámico para evitar problemas SSR
        const { authService } = await import('../../lib/authService.js');
        
        // Inicializar si no está inicializado
        if (!authService.isInitialized) {
          console.log('⚠️ AuthService no inicializado, inicializando...');
          await authService.initialize();
        }
        
        // Verificar autenticación
        if (authService.isAuthenticated) {
          const profile = authService.profile;
          
          console.log('✅ Usuario autenticado:', {
            email: authService.user?.email,
            role: profile?.role
          });
          
          // Verificar que sea padre (o permitir admin)
          if (profile?.role !== 'padre' && profile?.role !== 'admin') {
            throw new Error(`Acceso denegado. Se requiere rol de padre, tienes: ${profile?.role}`);
          }
          
          console.log('✅ Rol autorizado para padre dashboard');
          
          // ✅ CORREGIDO: Asegurar que el estado se actualice con datos válidos
          setAuthState({
            loading: false,
            isAuthenticated: true,
            user: authService.user,
            profile: authService.profile,
            error: null
          });
          
        } else {
          // No autenticado, redirigir a login
          console.log('❌ Usuario no autenticado, redirigiendo...');
          if (typeof window !== 'undefined') {
            window.location.href = '/login/';
          }
          return;
        }
      } catch (error) {
        console.error('❌ Error verificando auth en padre:', error);
        setAuthState({
          loading: false,
          isAuthenticated: false,
          user: null,
          profile: null,
          error: error.message
        });
        
        // Redirigir a login en caso de error
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login/';
          }, 2000);
        }
      }
    };
    
    checkAuth();
  }, []);

  // ===============================================
  // 🚨 PANTALLA DE ERROR
  // ===============================================
  if (authState.error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-white">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-4">Error de Autenticación</h2>
          <p className="text-red-600 mb-6">{authState.error}</p>
          <p className="text-sm text-red-500 mb-4">Redirigiendo al login...</p>
          <button 
            onClick={() => window.location.href = '/login/'} 
            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            🔄 Ir a Login
          </button>
        </div>
      </div>
    );
  }
  
  // ===============================================
  // 🔄 PANTALLA DE CARGA
  // ===============================================
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-4xl">🐕</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#2C3E50] mb-4">
            Cargando Dashboard Padre
          </h2>
          <p className="text-gray-600 mb-8">
            Verificando permisos y cargando datos...
          </p>
          <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
            <div className="bg-[#56CCF2] h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Conectando con sistema de autenticación...
          </p>
        </div>
      </div>
    );
  }

  // ===============================================
  // ✅ RENDERIZAR DASHBOARD CON PROPS CORREGIDAS - PROBLEMA #3 SOLUCIONADO
  // ===============================================
  console.log('🎉 ParentDashboardWrapper: Renderizando ParentDashboard con props:', {
    hasUser: !!authState.user,
    hasProfile: !!authState.profile,
    userEmail: authState.user?.email,
    profileRole: authState.profile?.role
  });

  return (
    <ParentDashboard 
      authUser={authState.user}        // ✅ CORREGIDO: PROPS PASADAS - PROBLEMA #3 SOLUCIONADO
      authProfile={authState.profile}  // ✅ CORREGIDO: PROPS PASADAS - PROBLEMA #3 SOLUCIONADO
    />
  );
};

export default ParentDashboardWrapper;