// src/components/auth/AuthProvider.jsx
import { createContext, useContext, useState, useEffect, useCallback, useTransition, Suspense } from 'react';
import { supabase } from '../../lib/supabase.js';

// ============================================
// 🔐 CONTEXT DE AUTENTICACIÓN
// ============================================

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isPending: false,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
  isAuthenticated: false,
  hasRole: () => false,
  canManagePets: false,
  canViewAllEvaluations: false,
  canAdminClub: false,
  isPadre: false,
  isProfesor: false,
  isAdmin: false
});

// ============================================
// 🎯 LOADING SKELETON
// ============================================

const ClubCaninoLoadingSkeleton = () => (
  <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-[#56CCF2] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <span className="text-2xl">🐕</span>
      </div>
      <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">Club Canino</h2>
      <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-[#56CCF2] rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-[#56CCF2] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-[#56CCF2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <p className="text-gray-600 mt-2">Cargando...</p>
    </div>
  </div>
);

// ============================================
// 🏗️ AUTH PROVIDER COMPONENT
// ============================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // ============================================
  // 🔄 INICIALIZACIÓN
  // ============================================

  useEffect(() => {
    // Obtener sesión inicial
    getInitialSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email);
        
        startTransition(async () => {
          if (session?.user) {
            await loadUserProfile(session.user);
          } else {
            setUser(null);
            setProfile(null);
          }
        });

        // Manejar eventos específicos
        handleAuthEvent(event, session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getInitialSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error obteniendo sesión inicial:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        await loadUserProfile(session.user);
      }
    } catch (error) {
      console.error('Error en sesión inicial:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 👤 CARGAR PERFIL DE USUARIO
  // ============================================

  const loadUserProfile = async (authUser) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          phone,
          created_at,
          updated_at
        `)
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error cargando perfil:', error);
        // Si no existe perfil, crear uno básico
        if (error.code === 'PGRST116') {
          await createUserProfile(authUser);
          return;
        }
        throw error;
      }

      setUser(authUser);
      setProfile(userProfile);
      
      console.log('✅ Usuario cargado:', userProfile);
      
      // Notificar a otras pestañas
      notifyAuthChange('USER_LOADED', { user: authUser, profile: userProfile });
      
    } catch (error) {
      console.error('Error cargando perfil de usuario:', error);
      setUser(authUser);
      setProfile(null);
    }
  };

  const createUserProfile = async (authUser) => {
    try {
      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: 'padre', // Rol por defecto
        phone: authUser.user_metadata?.phone || null
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;

      setUser(authUser);
      setProfile(data);
      console.log('✅ Perfil creado:', data);

    } catch (error) {
      console.error('Error creando perfil:', error);
    }
  };

  // ============================================
  // 🔐 FUNCIONES DE AUTENTICACIÓN
  // ============================================

  const signIn = useCallback(async (credentials) => {
    const { email, password } = credentials;
    
    startTransition(async () => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        console.log('✅ Login exitoso:', data.user.email);
        
        // El perfil se cargará automáticamente via onAuthStateChange
        return { data, error: null };

      } catch (error) {
        console.error('❌ Error en login:', error);
        throw error;
      }
    });
  }, []);

  const signUp = useCallback(async (credentials) => {
    const { email, password, fullName, phone, role = 'padre' } = credentials;
    
    startTransition(async () => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              role: role
            }
          }
        });

        if (error) throw error;

        console.log('✅ Registro exitoso:', data.user?.email);
        return { data, error: null };

      } catch (error) {
        console.error('❌ Error en registro:', error);
        throw error;
      }
    });
  }, []);

  const signOut = useCallback(async () => {
    startTransition(async () => {
      try {
        console.log('👋 Cerrando sesión...');
        
        // Limpiar datos locales ANTES del logout
        await clearClubCaninoData();
        
        // Logout de Supabase
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // Limpiar estado local
        setUser(null);
        setProfile(null);
        
        // Notificar a otras pestañas
        notifyAuthChange('SIGNED_OUT', null);
        
        console.log('✅ Sesión cerrada correctamente');
        
        // Redireccionar a home
        window.location.href = '/';

      } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
        // Forzar limpieza aunque haya error
        setUser(null);
        setProfile(null);
        window.location.href = '/';
      }
    });
  }, []);

  // ============================================
  // 🧹 LIMPIEZA DE DATOS
  // ============================================

  const clearClubCaninoData = async () => {
    try {
      // Limpiar localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('club-canino') || 
          key.includes('supabase') ||
          key.includes('sb-')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Limpiar sessionStorage
      sessionStorage.clear();
      
      // Limpiar caches del service worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.includes('club-canino'))
            .map(name => caches.delete(name))
        );
      }

      console.log('🧹 Datos locales limpiados');
    } catch (error) {
      console.error('Error limpiando datos:', error);
    }
  };

  // ============================================
  // 📡 COMUNICACIÓN ENTRE PESTAÑAS
  // ============================================

  const notifyAuthChange = (event, data) => {
    try {
      const bc = new BroadcastChannel('club-canino-auth');
      bc.postMessage({
        type: event,
        data,
        timestamp: Date.now()
      });
      bc.close();
    } catch (error) {
      console.warn('Error notificando cambio de auth:', error);
    }
  };

  const handleAuthEvent = (event, session) => {
    switch (event) {
      case 'SIGNED_IN':
        console.log('✅ Usuario conectado al Club Canino');
        // Limpiar datos de error previos
        localStorage.removeItem('auth_error');
        break;
        
      case 'SIGNED_OUT':
        console.log('👋 Usuario desconectado del Club Canino');
        clearClubCaninoData();
        break;
        
      case 'TOKEN_REFRESHED':
        console.log('🔄 Token renovado automáticamente');
        break;
        
      case 'USER_UPDATED':
        console.log('👤 Perfil de usuario actualizado');
        if (session?.user) {
          loadUserProfile(session.user);
        }
        break;
        
      default:
        console.log('🔐 Evento de auth:', event);
    }
  };

  // ============================================
  // 🔍 FUNCIONES DE AUTORIZACIÓN
  // ============================================

  const hasRole = useCallback((requiredRole) => {
    if (!profile) return false;
    
    const roleHierarchy = {
      'admin': 3,
      'profesor': 2,
      'padre': 1
    };
    
    const userLevel = roleHierarchy[profile.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 999;
    
    return userLevel >= requiredLevel;
  }, [profile]);

  // ============================================
  // 📊 COMPUTED VALUES
  // ============================================

  const isAuthenticated = !!user && !!profile;
  const canManagePets = hasRole('profesor');
  const canViewAllEvaluations = hasRole('profesor');
  const canAdminClub = hasRole('admin');
  const isPadre = profile?.role === 'padre';
  const isProfesor = profile?.role === 'profesor';
  const isAdmin = profile?.role === 'admin';

  // ============================================
  // 🎁 CONTEXT VALUE
  // ============================================

  const contextValue = {
    user,
    profile,
    loading,
    isPending,
    signIn,
    signOut,
    signUp,
    isAuthenticated,
    hasRole,
    canManagePets,
    canViewAllEvaluations,
    canAdminClub,
    isPadre,
    isProfesor,
    isAdmin
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <Suspense fallback={<ClubCaninoLoadingSkeleton />}>
        {children}
      </Suspense>
    </AuthContext.Provider>
  );
}

// ============================================
// 🪝 HOOK PARA USAR EL CONTEXT
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  
  return context;
}

export default AuthProvider;