// src/components/auth/AuthProvider.jsx
// 🔐 AUTHPROVIDER CORREGIDO - CLUB CANINO DOS HUELLITAS
// ✅ CORREGIDO: Importación correcta de authService

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../../lib/authService.js'; // ✅ Importación nombrada correcta

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeProvider = async () => {
      console.log('🔄 AuthProvider inicializando...');
      
      try {
        // Asegurar que AuthService esté inicializado
        if (!authService.isInitialized) {
          console.log('⚠️ AuthService no inicializado, inicializando...');
          const initialized = await authService.initialize();
          
          if (!initialized) {
            throw new Error('No se pudo inicializar AuthService');
          }
        }

        // Cargar estado actual
        if (authService.isAuthenticated) {
          setUser(authService.user);
          setProfile(authService.profile);
          setIsAuthenticated(true);
          console.log('✅ AuthProvider: Usuario cargado', {
            email: authService.user?.email,
            role: authService.profile?.role
          });
        } else {
          console.log('❌ AuthProvider: Sin usuario');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }

        // Configurar listener para cambios de auth
        const unsubscribe = authService.addListener((authState) => {
          console.log('🔄 AuthProvider: Estado cambió', authState);
          setUser(authState.user);
          setProfile(authState.profile);
          setIsAuthenticated(authState.isAuthenticated);
        });

        // Cleanup function
        return unsubscribe;

      } catch (err) {
        console.error('❌ Error en AuthProvider:', err);
        setError(err.message);
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      } finally {
        // CRÍTICO: SIEMPRE poner loading en false
        console.log('🎯 AuthProvider: Finalizando loading...');
        setLoading(false);
      }
    };

    const cleanup = initializeProvider();
    
    // Cleanup al desmontar
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  // ===============================================
  // 🔧 FUNCIONES DE AUTENTICACIÓN
  // ===============================================

  const signIn = async (email, password) => {
    try {
      console.log('🔄 AuthProvider: Iniciando signIn...');
      
      const result = await authService.signIn(email, password);
      
      if (result.success) {
        // El estado se actualizará automáticamente por el listener
        console.log('✅ AuthProvider: Login exitoso');
        return { success: true };
      } else {
        console.error('❌ AuthProvider: Error en login:', result.error);
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('❌ AuthProvider: Error en signIn:', err);
      const errorMessage = err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 AuthProvider: Iniciando signOut...');
      
      await authService.signOut();
      
      // Limpiar estado local
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setError(null);
      
      console.log('✅ AuthProvider: SignOut exitoso');
      
      // Redireccionar a login
      if (typeof window !== 'undefined') {
        window.location.href = '/login/';
      }
      
    } catch (error) {
      console.error('❌ AuthProvider: Error en signOut:', error);
      
      // Forzar limpieza en caso de error
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      
      // Redireccionar anyway
      if (typeof window !== 'undefined') {
        window.location.href = '/login/';
      }
    }
  };

  // ===============================================
  // 🛠️ FUNCIONES AUXILIARES
  // ===============================================

  const getDashboard = () => {
    return authService.getDashboardUrl();
  };

  const redirectToDashboard = () => {
    const dashboard = getDashboard();
    if (typeof window !== 'undefined') {
      window.location.href = dashboard;
    }
    return dashboard;
  };

  const hasRole = (role) => {
    return authService.hasRole(role);
  };

  const clearError = () => {
    setError(null);
  };

  // ===============================================
  // 🧪 MODO DEBUG (solo en desarrollo)
  // ===============================================

  const isDebugMode = import.meta.env.MODE === 'development';

  // ===============================================
  // 🔄 ESTADOS DE RENDERIZADO
  // ===============================================

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="text-center">
          <div className="text-6xl mb-4">🐕</div>
          <div className="text-xl font-semibold text-[#2C3E50]">Cargando Club Canino...</div>
          <div className="mt-2 text-sm text-gray-600">Inicializando autenticación...</div>
          
          {isDebugMode && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-left">
              <p><strong>🧪 Debug AuthProvider:</strong></p>
              <p>🔄 Loading: {loading ? 'true' : 'false'}</p>
              <p>🔐 AuthService Init: {authService.isInitialized ? 'true' : 'false'}</p>
              <p>✅ AuthService Auth: {authService.isAuthenticated ? 'true' : 'false'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-600 mb-4">Error de Autenticación</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-semibold transition-colors"
          >
            🔄 Reintentar
          </button>
          
          {isDebugMode && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-left">
              <p><strong>🧪 Debug Error:</strong></p>
              <p>❌ Error: {error}</p>
              <p>🔐 AuthService: {authService.isAuthenticated ? '✅' : '❌'}</p>
              <p>👤 User: {user ? '✅' : '❌'}</p>
              <p>👥 Profile: {profile ? '✅' : '❌'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===============================================
  // ✅ CONTEXTO PRINCIPAL
  // ===============================================

  const value = {
    // Estado
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    
    // Funciones
    signIn,
    signOut,
    getDashboard,
    redirectToDashboard,
    hasRole,
    clearError
  };

  console.log('🎉 AuthProvider: Renderizando contexto', {
    isAuthenticated,
    userEmail: user?.email,
    userRole: profile?.role
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};