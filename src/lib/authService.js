// src/lib/authService.js
// 🔐 SERVICIO DE AUTENTICACIÓN - CLUB CANINO DOS HUELLITAS
// ✅ CORREGIDO: Singleton pattern para evitar múltiples instancias

import supabase from './supabase.js';

// ============================================
// 🔧 SINGLETON PATTERN
// ============================================
let authServiceInstance = null;
let isInitializing = false;

class AuthService {
  constructor() {
    // Prevenir múltiples instancias
    if (authServiceInstance) {
      console.log('⚠️ AuthService ya existe, devolviendo instancia existente');
      return authServiceInstance;
    }

    console.log('🔧 Creando nueva instancia de AuthService');
    
    // Estado de autenticación
    this.user = null;
    this.profile = null;
    this.isInitialized = false;
    this.isAuthenticated = false;
    this.listeners = new Set();
    this.sessionCheckInterval = null;
    this.authStateListener = null;
    
    // Cache para evitar re-ejecutar operaciones
    this.initializationPromise = null;
    this.profileLoadPromise = null;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.signIn = this.signIn.bind(this);
    this.signOut = this.signOut.bind(this);
    
    // Marcar como instancia singleton
    authServiceInstance = this;
  }

  // ===============================================
  // 🚀 INICIALIZACIÓN CON CACHE
  // ===============================================

  async initialize() {
    // Si ya está inicializado, devolver inmediatamente
    if (this.isInitialized) {
      console.log('✅ AuthService ya inicializado, devolviendo estado actual');
      return true;
    }

    // Si ya está inicializando, esperar a que termine
    if (this.initializationPromise) {
      console.log('🔄 AuthService ya inicializando, esperando...');
      return await this.initializationPromise;
    }

    // Solo en el cliente
    if (typeof window === 'undefined') {
      console.log('⚠️ Entorno servidor - saltando inicialización');
      return false;
    }

    // Crear promise de inicialización para evitar múltiples llamadas
    this.initializationPromise = this.performInitialization();
    
    try {
      const result = await this.initializationPromise;
      return result;
    } catch (error) {
      this.initializationPromise = null; // Reset en caso de error
      throw error;
    }
  }

  async performInitialization() {
    try {
      console.log('🔄 AuthService: Inicializando (única vez)...');
      
      // Verificar sesión de Supabase
      console.log('🔍 Verificando sesión de Supabase...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('⚠️ Error obteniendo sesión:', sessionError);
      }

      if (sessionData?.session?.user) {
        console.log('✅ Sesión activa encontrada:', sessionData.session.user.email);
        await this.loadUserProfile(sessionData.session.user);
      } else {
        console.log('❌ No hay sesión activa en Supabase');
        this.clearAuthState();
      }

      // Configurar listener de cambios (solo una vez)
      this.setupAuthListener();

      this.isInitialized = true;
      console.log('✅ AuthService inicializado correctamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error en inicialización:', error);
      this.clearAuthState();
      return false;
    }
  }

  setupAuthListener() {
    // Remover listener previo si existe
    if (this.authStateListener) {
      console.log('🔄 Removiendo listener previo de auth');
      this.authStateListener.subscription?.unsubscribe?.();
    }

    console.log('🔗 Configurando listener de auth state changes (único)');
    
    this.authStateListener = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event);
      
      // Debounce para evitar múltiples llamadas rápidas
      if (this.authChangeTimeout) {
        clearTimeout(this.authChangeTimeout);
      }
      
      this.authChangeTimeout = setTimeout(async () => {
        await this.handleAuthStateChange(event, session);
      }, 100);
    });
  }

  // ===============================================
  // 🔄 GESTIÓN DE ESTADO DE AUTH
  // ===============================================

  async handleAuthStateChange(event, session) {
    try {
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user && session.user.id !== this.user?.id) {
            console.log('✅ Usuario logueado:', session.user.email);
            await this.loadUserProfile(session.user);
          }
          break;
          
        case 'SIGNED_OUT':
          console.log('👋 Usuario deslogueado');
          this.clearAuthState();
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token renovado');
          // No recargar perfil en refresh, solo verificar sesión
          if (session?.user && !this.user) {
            await this.loadUserProfile(session.user);
          }
          break;
          
        default:
          console.log('🔄 Auth event:', event);
      }
      
      // Notificar cambios (con debounce)
      this.debouncedNotifyListeners();
      
    } catch (error) {
      console.error('❌ Error manejando auth state change:', error);
    }
  }

  // ===============================================
  // 👤 GESTIÓN DE PERFIL CON CACHE
  // ===============================================

  async loadUserProfile(user) {
    try {
      // Si ya estamos cargando el perfil para este usuario, esperar
      if (this.profileLoadPromise && this.user?.id === user.id) {
        console.log('🔄 Ya cargando perfil para este usuario, esperando...');
        return await this.profileLoadPromise;
      }

      console.log('🔄 Cargando perfil para:', user.email);
      
      if (!user || !user.id) {
        throw new Error('Usuario inválido');
      }

      // Crear promise para evitar múltiples cargas
      this.profileLoadPromise = this.performProfileLoad(user);
      
      try {
        const result = await this.profileLoadPromise;
        return result;
      } finally {
        this.profileLoadPromise = null;
      }
      
    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
      this.clearAuthState();
      throw error;
    }
  }

  async performProfileLoad(user) {
    // Obtener perfil de la base de datos
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ Error obteniendo perfil de DB:', error);
      throw error;
    }

    if (!profile) {
      throw new Error('Perfil no encontrado para el usuario');
    }

    // Actualizar estado
    this.user = user;
    this.profile = profile;
    this.isAuthenticated = true;

    console.log('✅ Perfil cargado exitosamente:', {
      email: user.email,
      role: profile.role,
      name: profile.full_name
    });

    return { user, profile };
  }

  // ===============================================
  // 🔐 AUTENTICACIÓN
  // ===============================================

  async signIn(email, password) {
    try {
      console.log('🔄 Intentando login para:', email);
      
      // Validación básica
      if (!email || !password) {
        return {
          success: false,
          error: 'Email y contraseña son requeridos'
        };
      }

      // Asegurar inicialización
      if (!this.isInitialized) {
        console.log('🔄 Inicializando AuthService...');
        await this.initialize();
      }

      // Limpiar estado previo
      this.clearAuthState();

      // Intentar login con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (error) {
        console.error('❌ Error en signIn:', error);
        return {
          success: false,
          error: this.getErrorMessage(error)
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No se pudo obtener información del usuario'
        };
      }

      // Cargar perfil
      const profileResult = await this.loadUserProfile(data.user);
      
      console.log('✅ Login exitoso para:', email);
      
      return {
        success: true,
        user: data.user,
        profile: profileResult.profile
      };

    } catch (error) {
      console.error('❌ Error en signIn:', error);
      return {
        success: false,
        error: error.message || 'Error al iniciar sesión'
      };
    }
  }

  async signOut() {
    try {
      console.log('🔄 Cerrando sesión...');
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error en signOut de Supabase:', error);
      }

      // Limpiar estado local
      this.clearAuthState();
      
      console.log('✅ Sesión cerrada correctamente');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      
      // Forzar limpieza local
      this.clearAuthState();
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===============================================
  // 🧹 LIMPIEZA DE ESTADO
  // ===============================================

  clearAuthState() {
    this.user = null;
    this.profile = null;
    this.isAuthenticated = false;
    this.notifyListeners();
    console.log('🧹 Estado de auth limpiado');
  }

  // ===============================================
  // 🔔 NOTIFICACIONES CON DEBOUNCE
  // ===============================================

  debouncedNotifyListeners() {
    // Evitar múltiples notificaciones rápidas
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
    }
    
    this.notifyTimeout = setTimeout(() => {
      this.notifyListeners();
    }, 50);
  }

  addListener(callback) {
    this.listeners.add(callback);
    console.log('🔗 Listener agregado, total:', this.listeners.size);
    return () => {
      this.listeners.delete(callback);
      console.log('🔗 Listener removido, total:', this.listeners.size);
    };
  }

  notifyListeners() {
    const authState = {
      user: this.user,
      profile: this.profile,
      isAuthenticated: this.isAuthenticated
    };

    console.log('🔔 Notificando', this.listeners.size, 'listeners');
    
    this.listeners.forEach(callback => {
      try {
        callback(authState);
      } catch (error) {
        console.error('❌ Error en listener:', error);
      }
    });
  }

  // ===============================================
  // 🧹 LIMPIEZA DE ESTADO
  // ===============================================

  clearAuthState() {
    const wasAuthenticated = this.isAuthenticated;
    
    this.user = null;
    this.profile = null;
    this.isAuthenticated = false;
    
    if (wasAuthenticated) {
      console.log('🧹 Estado de auth limpiado');
      this.debouncedNotifyListeners();
    }
  }

  // ===============================================
  // 🔄 CLEANUP AL DESTRUIR
  // ===============================================

  cleanup() {
    console.log('🧹 Limpiando AuthService...');
    
    // Limpiar timeouts
    if (this.authChangeTimeout) {
      clearTimeout(this.authChangeTimeout);
    }
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
    }
    
    // Remover auth listener
    if (this.authStateListener) {
      this.authStateListener.subscription?.unsubscribe?.();
    }
    
    // Limpiar listeners
    this.listeners.clear();
    
    // Reset singleton
    if (authServiceInstance === this) {
      authServiceInstance = null;
    }
  }

  // ===============================================
  // 🛠️ UTILIDADES (SIN CAMBIOS)
  // ===============================================

  getErrorMessage(error) {
    const errorMessages = {
      'Invalid login credentials': 'Credenciales incorrectas',
      'Email not confirmed': 'Email no confirmado',
      'Too many requests': 'Demasiados intentos, intenta más tarde',
      'Invalid email': 'Email inválido',
      'Network request failed': 'Error de conexión, verifica tu internet'
    };

    return errorMessages[error.message] || error.message || 'Error desconocido';
  }

  getDashboardUrl() {
    if (!this.isAuthenticated || !this.profile) {
      return '/login/';
    }

    const roleRoutes = {
      'padre': '/dashboard/padre/',
      'profesor': '/dashboard/profesor/',
      'admin': '/dashboard/admin/',
      'conductor': '/dashboard/conductor/'
    };

    return roleRoutes[this.profile.role] || '/dashboard/padre/';
  }

  hasRole(role) {
    return this.isAuthenticated && this.profile?.role === role;
  }

  isLoggedIn() {
    return this.isAuthenticated && this.user && this.profile;
  }

  getCurrentUser() {
    return {
      user: this.user,
      profile: this.profile,
      isAuthenticated: this.isAuthenticated
    };
  }
}

// ===============================================
// 🚀 FUNCIÓN SINGLETON PARA OBTENER INSTANCIA
// ===============================================

function getAuthServiceInstance() {
  if (!authServiceInstance) {
    console.log('🔧 Creando primera instancia de AuthService');
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}

// ===============================================
// 🔄 AUTO-INICIALIZACIÓN MEJORADA
// ===============================================

// Crear instancia única
const authService = getAuthServiceInstance();

// Auto-inicialización en el cliente (con protección)
if (typeof window !== 'undefined') {
  // Verificar si ya se está inicializando
  if (!isInitializing) {
    isInitializing = true;
    
    const initializeAuth = async () => {
      try {
        if (document.readyState === 'loading') {
          await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
          });
        }
        
        console.log('🚀 Auto-inicializando AuthService...');
        await authService.initialize();
        isInitializing = false;
        
      } catch (error) {
        console.error('❌ Error en auto-inicialización:', error);
        isInitializing = false;
      }
    };

    initializeAuth();
  }
  
  // Cleanup al cerrar ventana
  window.addEventListener('beforeunload', () => {
    authService.cleanup();
  });
}

// ✅ EXPORTACIONES COMPATIBLES CON AUTHPROVIDER
export default authService;           // Para import authService from './authService.js'
export { authService };              // Para import { authService } from './authService.js'