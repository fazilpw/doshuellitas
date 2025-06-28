// src/components/auth/AuthProvider.jsx
// 🔐 SISTEMA DE AUTENTICACIÓN UNIFICADO PARA CLUB CANINO
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
  const [isClient, setIsClient] = useState(false);

  // ===============================================
  // 🚀 INICIALIZACIÓN
  // ===============================================

  useEffect(() => {
    // Marcar que estamos en el cliente
    setIsClient(true);
    
    // Solo ejecutar en el cliente (browser)
    if (typeof window !== 'undefined') {
      initializeAuth();
    } else {
      // En el servidor, simplemente marcar como no cargando
      setLoading(false);
    }
  }, []);

  const redirectToDashboard = (role = null) => {
    const userRole = role || profile?.role;
    if (!userRole) return '/';
    
    const dashboards = {
      admin: '/dashboard/admin/',
      profesor: '/dashboard/profesor/',
      padre: '/dashboard/padre/'
    };
    
    return dashboards[userRole] || '/dashboard/padre/';
  };

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Verificar sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      }
      
      // Escuchar cambios de auth
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state change:', event, session?.user?.email);
          
          if (session?.user) {
            setUser(session.user);
            await loadUserProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      );

      return () => subscription?.unsubscribe();
    } catch (err) {
      console.error('❌ Error inicializando auth:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 👤 GESTIÓN DE PERFIL
  // ===============================================

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setProfile(data);
      
      // Redirigir al dashboard correcto después de cargar perfil
      if (data && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const expectedDashboard = redirectToDashboard(data.role);
        
        // Solo redirigir si estamos en login o en dashboard incorrecto
        if (currentPath === '/login/' || 
            (currentPath.includes('/dashboard/') && currentPath !== expectedDashboard)) {
          window.location.href = expectedDashboard;
        }
      }
    } catch (err) {
      console.error('❌ Error loading profile:', err);
      // Si no hay perfil, crear uno básico
      if (err.code === 'PGRST116') {
        await createBasicProfile(userId);
      }
    }
  };

  const createBasicProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: 'padre',
full_name: 'Usuario',
          active: true
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('❌ Error creating profile:', err);
    }
  };

  // ===============================================
  // 🔐 FUNCIONES DE AUTENTICACIÓN
  // ===============================================

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      // El perfil se cargará automáticamente en onAuthStateChange
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error sign in:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
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
      setUser(null);
      setProfile(null);
      
      // Redirigir a home solo en el cliente
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      
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

  

  // ===============================================
  // 🎯 VALOR DEL CONTEXTO
  // ===============================================

  const value = {
    // Estado
    user,
    profile,
    loading,
    error,
isAuthenticated: !!user && !!profile,
    isClient,
    
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

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, profile, loading, hasRole, redirectToDashboard, isClient } = useAuth();
  
  // Mostrar loading mientras se inicializa
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="text-center">
          <div className="text-6xl mb-4">🐕</div>
          <div className="text-xl font-semibold text-[#2C3E50]">Cargando Club Canino...</div>
          <div className="mt-2 text-sm text-gray-600">Preparando tu experiencia</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    // Redirigir a login solo en el cliente
    if (typeof window !== 'undefined') {
      window.location.href = '/login/';
    }
    return null;
  }
  
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirigir a dashboard autorizado
    if (typeof window !== 'undefined') {
      window.location.href = redirectToDashboard();
    }
    return null;
  }
  
  return children;
};

export default AuthContext;