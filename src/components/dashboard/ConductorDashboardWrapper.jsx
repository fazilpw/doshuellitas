// src/components/dashboard/ConductorDashboardWrapper.jsx
// 🚐 WRAPPER PARA CONDUCTOR DASHBOARD CON AUTENTICACIÓN

import { useState, useEffect } from 'react';
import ConductorDashboard from './ConductorDashboard.jsx';

const ConductorDashboardWrapper = () => {
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
        // Import dinámico para evitar problemas SSR
        const { authService } = await import('../../lib/authService.js');
        
        // Inicializar si no está inicializado
        if (!authService.isInitialized) {
          await authService.initialize();
        }
        
        // Verificar autenticación
        if (authService.isAuthenticated) {
          const profile = authService.profile;
          
          // Verificar que sea conductor (o permitir admin)
          if (profile?.role !== 'conductor' && profile?.role !== 'admin') {
            throw new Error(`Acceso denegado. Se requiere rol de conductor, tienes: ${profile?.role}`);
          }
          
          // Preparar datos del usuario para el componente
          const userData = {
            id: authService.user.id,
            email: authService.user.email,
            name: profile?.full_name || authService.user.email?.split('@')[0] || 'Conductor',
            role: profile?.role || 'conductor',
            phone: profile?.phone || null,
            avatar: profile?.avatar_url || null
          };
          
          setAuthState({
            loading: false,
            isAuthenticated: true,
            user: userData,
            profile: authService.profile,
            error: null
          });
        } else {
          // No autenticado, redirigir a login
          window.location.href = '/login/';
        }
      } catch (error) {
        console.error('❌ Error verificando auth en conductor:', error);
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
  }, []);
  
  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🚐</div>
          <div className="text-xl font-semibold text-[#2C3E50] mb-2">
            Cargando Dashboard Conductor...
          </div>
          <div className="text-sm text-gray-600">
            Accediendo al panel de rutas
          </div>
        </div>
      </div>
    );
  }
  
  if (authState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center mx-4">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
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
  
  return (
    <ConductorDashboard user={authState.user} />
  );
};

export default ConductorDashboardWrapper;