// src/components/auth/AuthProvider.jsx
// 🔐 VERSIÓN SIMPLIFICADA QUE GARANTIZA SALIR DE LOADING
// Club Canino Dos Huellitas

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../../lib/authService.js';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeProvider = async () => {
      console.log('🔄 AuthProvider inicializando...');
      
      try {
        // Asegurar que AuthService esté inicializado
        if (!authService.isInitialized) {
          console.log('⚠️ AuthService no inicializado, inicializando...');
          await authService.initialize();
        }

        // Cargar estado actual
        if (authService.isAuthenticated) {
          setUser(authService.user);
          setProfile(authService.profile);
          console.log('✅ AuthProvider: Usuario cargado', {
            email: authService.user?.email,
            role: authService.profile?.role
          });
        } else {
          console.log('❌ AuthProvider: Sin usuario');
        }

      } catch (err) {
        console.error('❌ Error en AuthProvider:', err);
        setError(err.message);
      }
      
      // 🔧 CRÍTICO: SIEMPRE poner loading en false al final
      console.log('🎯 AuthProvider: Finalizando loading...');
      setLoading(false);
    };

    initializeProvider();
  }, []);

  // ===============================================
  // 🔧 FUNCIONES BÁSICAS
  // ===============================================

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
      window.location.href = '/login/';
    } catch (error) {
      console.error('❌ Error en signOut:', error);
    }
  };

  const isAuthenticated = !!(user && profile);

  const getDashboard = () => {
    const role = profile?.role;
    const dashboards = {
      padre: '/dashboard/padre',
      profesor: '/dashboard/profesor',
      admin: '/dashboard/admin',
      conductor: '/dashboard/conductor'
    };
    return dashboards[role] || '/dashboard/padre';
  };

  const hasRole = (requiredRole) => {
    if (!profile?.role) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(profile.role);
    }
    return profile.role === requiredRole;
  };

  // ===============================================
  // 🎨 LOADING SCREEN SIMPLE
  // ===============================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐕</div>
          <div className="text-xl font-semibold text-[#2C3E50]">Cargando Club Canino...</div>
          <div className="mt-2 text-sm text-gray-600">Un momento por favor...</div>
          
          {/* Debug info */}
          {import.meta.env.MODE === 'development' && (
            <div className="mt-4 p-3 bg-white/80 rounded-lg text-xs">
              <p>🔧 Loading: {loading ? 'true' : 'false'}</p>
              <p>👤 User: {user ? '✅' : '❌'}</p>
              <p>👥 Profile: {profile ? '✅' : '❌'}</p>
              <p>🔐 AuthService: {authService.isAuthenticated ? '✅' : '❌'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===============================================
  // ❌ ERROR SCREEN
  // ===============================================

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-600 mb-4">Error de Autenticación</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-semibold"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ===============================================
  // 🚪 REDIRECCIÓN SI NO AUTENTICADO
  // ===============================================

  if (!isAuthenticated) {
    // Pequeño delay para evitar flash
    setTimeout(() => {
      window.location.href = '/login/';
    }, 100);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔑</div>
          <div className="text-xl font-semibold text-[#2C3E50]">Redirigiendo al login...</div>
        </div>
      </div>
    );
  }

  // ===============================================
  // ✅ CONTEXTO Y CHILDREN
  // ===============================================

  const value = {
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    signOut,
    getDashboard,
    hasRole,
    clearError: () => setError(null)
  };

  console.log('🎉 AuthProvider: Renderizando children para usuario autenticado');

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};