// src/components/auth/AuthContext.jsx
// SISTEMA DE AUTENTICACIÓN COMPLETO SIN MIDDLEWARE
import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

// ===============================================
// 🎯 CONTEXTO DE AUTENTICACIÓN
// ===============================================

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

// ===============================================
// 🔐 PROVEEDOR DE AUTENTICACIÓN
// ===============================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===============================================
  // 🚀 INICIALIZACIÓN
  // ===============================================

  useEffect(() => {
    // Verificar sesión actual
    getInitialSession();
    
    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        
        if (session?.user) {
          await handleUserSession(session.user);
        } else {
          handleSignOut();
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const getInitialSession = async () => {
    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        setError(error.message);
        return;
      }

      if (session?.user) {
        await handleUserSession(session.user);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Error en inicialización:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ===============================================
  // 👤 MANEJO DE USUARIO
  // ===============================================

  const handleUserSession = async (user) => {
    try {
      setUser(user);
      
      // Obtener perfil del usuario
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
      setError(null);
      
    } catch (err) {
      console.error('❌ Error obteniendo perfil:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Si no existe perfil, crear uno básico
        if (error.code === 'PGRST116') {
          return await createBasicProfile(userId);
        }
        throw error;
      }

      return data;
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      throw err;
    }
  };

  const createBasicProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email,
          role: 'padre',
          full_name: user.user_metadata?.full_name || 
                     user.email?.split('@')[0] || 
                     'Usuario',
          active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('❌ Error creating profile:', err);
      throw err;
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setProfile(null);
    setError(null);
    setLoading(false);
  };

  // ===============================================
  // 🔑 FUNCIONES DE AUTENTICACIÓN
  // ===============================================

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error sign in:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error sign up:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpiar estado
      handleSignOut();
      
      // Redirigir a home
      window.location.href = '/';
      
    } catch (err) {
      console.error('❌ Error sign out:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🛡️ UTILIDADES DE AUTORIZACIÓN
  // ===============================================

  const hasRole = (requiredRole) => {
    if (!profile) return false;
    
    const roleHierarchy = {
      'admin': 3,
      'profesor': 2,
      'padre': 1
    };
    
    const userLevel = roleHierarchy[profile.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 999;
    
    return userLevel >= requiredLevel;
  };

  const canAccess = (route) => {
    if (!user || !profile) return false;
    
    // Rutas por rol
    const roleRoutes = {
      padre: ['/dashboard/padre', '/mis-mascotas', '/progreso'],
      profesor: ['/dashboard/profesor', '/evaluaciones', '/estudiantes'],
      admin: ['/dashboard/admin', '/admin', '/usuarios', '/reportes']
    };
    
    const userRoutes = roleRoutes[profile.role] || [];
    const hasDirectAccess = userRoutes.some(r => route.startsWith(r));
    
    // Admin tiene acceso a todo
    if (profile.role === 'admin') return true;
    
    return hasDirectAccess;
  };

  const redirectToDashboard = () => {
    if (!profile) return '/';
    
    const dashboards = {
      admin: '/dashboard/admin/',
      profesor: '/dashboard/profesor/',
      padre: '/dashboard/padre/'
    };
    
    return dashboards[profile.role] || '/dashboard/padre/';
  };

  // ===============================================
  // 🎯 VALOR DEL CONTEXTO
  // ===============================================

  const value = {
    // Estado
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    
    // Funciones de auth
    signIn,
    signUp,
    signOut,
    
    // Utilidades
    hasRole,
    canAccess,
    redirectToDashboard,
    
    // Limpiar error
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ===============================================
// 🛡️ COMPONENTE DE PROTECCIÓN
// ===============================================

export const ProtectedRoute = ({ children, requiredRole = null, fallback = null }) => {
  const { user, profile, loading, canAccess, hasRole, redirectToDashboard } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🐕</div>
          <div className="text-xl font-semibold text-[#2C3E50]">Cargando...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    // Redirigir a login
    window.location.href = '/login/';
    return null;
  }
  
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirigir a dashboard autorizado
    window.location.href = redirectToDashboard();
    return null;
  }
  
  return children;
};

// ===============================================
// 🔗 HOOK PARA DATOS DEL USUARIO
// ===============================================

export const useUserData = () => {
  const { user, profile, loading } = useAuth();
  
  return {
    userId: user?.id,
    userEmail: user?.email,
    userRole: profile?.role,
    userName: profile?.full_name,
    userPhone: profile?.phone,
    isLoading: loading
  };
};

export default AuthContext;