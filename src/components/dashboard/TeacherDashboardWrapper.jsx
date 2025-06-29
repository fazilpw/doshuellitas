// src/components/dashboard/TeacherDashboardWrapper.jsx
// 🧑‍🏫 WRAPPER PARA TEACHER DASHBOARD CON AUTENTICACIÓN

import { useState, useEffect } from 'react';
import TeacherDashboard from './TeacherDashboard.jsx';

const TeacherDashboardWrapper = () => {
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
          
          // Verificar que sea profesor (o permitir admin)
          if (profile?.role !== 'profesor' && profile?.role !== 'admin') {
            throw new Error(`Acceso denegado. Se requiere rol de profesor, tienes: ${profile?.role}`);
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
        console.error('❌ Error verificando auth en profesor:', error);
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
          <div className="text-6xl mb-4 animate-pulse">🧑‍🏫</div>
          <div className="text-xl font-semibold text-[#2C3E50] mb-2">
            Cargando Dashboard Profesor...
          </div>
          <div className="text-sm text-gray-600">
            Accediendo al panel de evaluaciones
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
    <TeacherDashboard 
      authUser={authState.user}
      authProfile={authState.profile}
    />
  );
};

export default TeacherDashboardWrapper;