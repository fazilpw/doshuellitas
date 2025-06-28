// src/components/auth/AuthProvider.jsx
// 🔐 CONTEXTO DE AUTH SIMPLIFICADO - COMPATIBLE CON TU ARQUITECTURA
// Club Canino Dos Huellitas

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../../lib/authService.js';

// ===============================================
// 🎯 CONTEXTO SIMPLIFICADO
// ===============================================

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

// ===============================================
// 🔐 PROVIDER SIMPLIFICADO
// ===============================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===============================================
  // 🚀 INICIALIZACIÓN (Solo verificación)
  // ===============================================

  useEffect(() => {
    const initializeProvider = async () => {
      try {
        setLoading(true);
        
        // El AuthService ya debería estar inicializado por el login
        if (!authService.isInitialized) {
          console.log('⚠️ AuthService no inicializado, inicializando...');
          await authService.initialize();
        }

        // Verificar si hay usuario autenticado
        if (authService.isAuthenticated) {
          setUser(authService.user);
          setProfile(authService.profile);
          
          console.log('✅ AuthProvider: Usuario cargado', {
            email: authService.user?.email,
            role: authService.profile?.role
          });
        } else {
          // No hay usuario autenticado, redirigir a login
          console.log('❌ AuthProvider: Sin usuario, redirigiendo a login');
          if (typeof window !== 'undefined') {
            window.location.href = '/login/';
          }
          return;
        }

        // Escuchar cambios de auth
        const subscription = authService.onAuthStateChange((event, session) => {
          console.log('🔄 Auth state changed in Provider:', event);
          
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            if (typeof window !== 'undefined') {
              window.location.href = '/login/';
            }
          } else if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            // El perfil se carga en authService.signIn
            if (authService.profile) {
              setProfile(authService.profile);
            }
          }
        });

        // Cleanup function
        return () => subscription?.unsubscribe();

      } catch (err) {
        console.error('❌ Error en AuthProvider:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        
        // En caso de error, redirigir a login
        if (typeof window !== 'undefined') {
          window.location.href = '/login/';
        }
      } finally {
        setLoading(false);
      }
    };

    initializeProvider();
  }, []);

  // ===============================================
  // 🔄 SINCRONIZACIÓN CON AUTHSERVICE
  // ===============================================

  useEffect(() => {
    // Mantener sincronizado con authService
    const syncInterval = setInterval(() => {
      if (authService.user && authService.profile) {
        if (!user || !profile) {
          setUser(authService.user);
          setProfile(authService.profile);
        }
      }
    }, 5000); // Verificar cada 5 segundos

    return () => clearInterval(syncInterval);
  }, [user, profile]);

  // ===============================================
  // 🚪 FUNCIONES DE AUTH
  // ===============================================

  const signOut = async () => {
    try {
      setLoading(true);
      
      await authService.signOut();
      
      setUser(null);
      setProfile(null);
      
      // Redirigir a login
      if (typeof window !== 'undefined') {
        window.location.href = '/login/';
      }
      
    } catch (error) {
      console.error('❌ Error en signOut:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      
      // Redirigir aunque haya error
      if (typeof window !== 'undefined') {
        window.location.href = '/login/';
      }
    } finally {
      setLoading(false);
    }
  };

  // Refrescar perfil (para cambios en tiempo real)
  const refreshProfile = async () => {
    try {
      if (user?.id) {
        const updatedProfile = await authService.loadProfile(user.id);
        setProfile(updatedProfile);
        return updatedProfile;
      }
    } catch (error) {
      console.error('❌ Error refrescando perfil:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
    }
    return undefined;
  };

  // ===============================================
  // 🛡️ UTILIDADES DE PERMISOS
  // ===============================================

  const hasRole = (requiredRole) => {
    return authService.hasRole(requiredRole);
  };

  const canAccess = (route) => {
    return authService.canAccess(route);
  };

  const hasPermission = (permission, context = {}) => {
    const role = profile?.role;
    
    // Admin puede todo
    if (role === 'admin') return true;
    
    // Definir permisos por rol
    const permissions = {
      admin: [
        'view_all_dogs',
        'edit_all_dogs',
        'manage_users',
        'view_reports',
        'manage_system'
      ],
      profesor: [
        'view_assigned_dogs',
        'create_evaluations',
        'view_student_progress',
        'upload_photos'
      ],
      padre: [
        'view_own_dogs',
        'create_evaluations',
        'view_own_progress',
        'manage_routines'
      ],
      conductor: [
        'view_transport',
        'update_locations',
        'manage_routes'
      ]
    };

    const rolePermissions = permissions[role] || [];
    
    // Verificar permisos específicos con contexto
    if (permission === 'view_own_dogs' && context.dogId) {
      // Verificar que el perro pertenece al usuario
      return context.ownerId === user?.id;
    }

    return rolePermissions.includes(permission);
  };

  // ===============================================
  // 🔍 GETTERS Y ESTADO
  // ===============================================

  const isAuthenticated = !!(user && profile);

  const getDashboard = () => {
    return authService.getDashboard();
  };

  // ===============================================
  // 📊 VALOR DEL CONTEXTO
  // ===============================================

  const value = {
    // Estado
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    
    // Funciones de auth
    signOut,
    refreshProfile,
    
    // Utilidades
    hasRole,
    canAccess,
    hasPermission,
    getDashboard,
    
    // Para backward compatibility con tu código existente
    clearError: () => setError(null),
    
    // Info de debug
    authServiceStatus: authService.getDebugInfo()
  };

  // ===============================================
  // 🎨 COMPONENTE DE LOADING
  // ===============================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐕</div>
          <div className="text-xl font-semibold text-[#2C3E50]">Cargando Club Canino...</div>
          <div className="mt-2 text-sm text-gray-600">Preparando tu experiencia</div>
          
          {/* Progress bar animado */}
          <div className="mt-4 w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div className="bg-[#56CCF2] h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
          
          {/* Debug info en desarrollo */}
          {import.meta.env.MODE === 'development' && (
            <div className="mt-4 text-xs text-gray-500">
              Verificando autenticación...
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===============================================
  // 🚨 COMPONENTE DE ERROR
  // ===============================================

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl font-semibold text-red-600 mb-4">Error de Autenticación</div>
          <div className="text-gray-700 mb-6 bg-white p-4 rounded-lg">
            {error}
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#56CCF2] hover:bg-[#4AB8E0] text-white p-3 rounded-lg font-semibold"
            >
              🔄 Reintentar
            </button>
            
            <button 
              onClick={() => window.location.href = '/login/'}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-semibold"
            >
              🔐 Ir a Login
            </button>
          </div>

          {import.meta.env.MODE === 'development' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
              <h3 className="font-semibold text-yellow-800 mb-2">🔧 Debug Info:</h3>
              <pre className="text-xs text-yellow-700 overflow-auto">
                {JSON.stringify(authService.getDebugInfo(), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===============================================
  // ✅ PROVIDER PRINCIPAL
  // ===============================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ===============================================
// 🛡️ COMPONENTE DE PROTECCIÓN MEJORADO
// ===============================================

export const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredPermission = null, 
  permissionContext = {} 
}) => {
  const { user, profile, loading, hasRole, hasPermission, isAuthenticated, getDashboard } = useAuth();
  
  // Mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🐕</div>
          <div className="text-xl font-semibold">Verificando acceso...</div>
        </div>
      </div>
    );
  }
  
  // Verificar autenticación
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login/';
    }
    return null;
  }
  
  // Verificar rol
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🚫</div>
          <div className="text-xl font-semibold text-red-600 mb-4">Acceso Denegado</div>
          <div className="text-gray-700 mb-6">
            No tienes permisos para acceder a esta sección.
          </div>
          <button 
            onClick={() => window.location.href = getDashboard()}
            className="bg-[#56CCF2] hover:bg-[#4AB8E0] text-white px-6 py-3 rounded-lg font-semibold"
          >
            Ir a mi Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // Verificar permiso específico
  if (requiredPermission && !hasPermission(requiredPermission, permissionContext)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-xl font-semibold text-yellow-600 mb-4">Permiso Requerido</div>
          <div className="text-gray-700 mb-6">
            Necesitas permisos adicionales para realizar esta acción.
          </div>
          <button 
            onClick={() => window.history.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }
  
  return children;
};

// ===============================================
// 🔧 DEBUG HELPERS
// ===============================================

if (import.meta.env.MODE === 'development') {
  if (typeof window !== 'undefined') {
    window.authProviderDebug = {
      getAuthService: () => authService,
      getDebugInfo: () => authService.getDebugInfo()
    };
  }
}

export default AuthContext;