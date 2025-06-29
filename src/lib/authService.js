// src/lib/authService.js
// 🔐 SERVICIO DE AUTENTICACIÓN INDEPENDIENTE Y ROBUSTO
// Compatible con SSR/SSG y sin dependencias de React Context
// Club Canino Dos Huellitas

import supabase from './supabase.js';

class AuthService {
  constructor() {
    this.user = null;
    this.profile = null;
    this.isInitialized = false;
    this.isAuthenticated = false;
    this.listeners = new Set();
    
    // Bind methods para evitar problemas de contexto
    this.initialize = this.initialize.bind(this);
    this.signIn = this.signIn.bind(this);
    this.signOut = this.signOut.bind(this);
  }

  // ===============================================
  // 🚀 INICIALIZACIÓN
  // ===============================================

  async initialize() {
    try {
      console.log('🔄 AuthService: Inicializando...');
      
      // Verificar si estamos en el cliente
      if (typeof window === 'undefined') {
        console.log('⚠️ AuthService: Entorno servidor detectado, saltando inicialización');
        return;
      }

      // Obtener sesión actual de Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error obteniendo sesión:', error);
        throw error;
      }

      if (session?.user) {
        console.log('✅ Sesión encontrada para:', session.user.email);
        await this.loadUserProfile(session.user);
      } else {
        console.log('❌ No hay sesión activa');
        this.clearAuthState();
      }

      // Configurar listener para cambios de auth
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await this.loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.clearAuthState();
        }
        
        // Notificar a listeners
        this.notifyListeners();
      });

      this.isInitialized = true;
      console.log('✅ AuthService inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando AuthService:', error);
      this.clearAuthState();
      throw error;
    }
  }

  // ===============================================
  // 👤 GESTIÓN DE PERFIL
  // ===============================================

  async loadUserProfile(user) {
    try {
      console.log('🔄 Cargando perfil para:', user.email);
      
      // Buscar perfil en la tabla profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ Error cargando perfil:', error);
        throw error;
      }

      if (!profile) {
        throw new Error('Perfil no encontrado para el usuario');
      }

      // Actualizar estado
      this.user = user;
      this.profile = profile;
      this.isAuthenticated = true;

      console.log('✅ Perfil cargado:', {
        email: user.email,
        role: profile.role,
        name: profile.full_name
      });

      return { user, profile };
      
    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
      this.clearAuthState();
      throw error;
    }
  }

  clearAuthState() {
    this.user = null;
    this.profile = null;
    this.isAuthenticated = false;
    console.log('🧹 Estado de auth limpiado');
  }

  // ===============================================
  // 🔐 AUTENTICACIÓN
  // ===============================================

  async signIn(email, password) {
    try {
      console.log('🔄 Intentando login para:', email);
      
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }

      // Asegurar que estamos inicializados
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Intentar login con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
        console.error('❌ Error en signOut:', error);
        throw error;
      }

      // Limpiar estado local
      this.clearAuthState();
      this.notifyListeners();
      
      console.log('✅ Sesión cerrada correctamente');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===============================================
  // 🛠️ UTILIDADES
  // ===============================================

  getErrorMessage(error) {
    const errorMessages = {
      'Invalid login credentials': 'Credenciales incorrectas',
      'Email not confirmed': 'Email no confirmado',
      'Too many requests': 'Demasiados intentos, intenta más tarde',
      'Invalid email': 'Email inválido'
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
      'admin': '/dashboard/admin/'
    };

    return roleRoutes[this.profile.role] || '/dashboard/padre/';
  }

  hasRole(role) {
    return this.isAuthenticated && this.profile?.role === role;
  }

  // ===============================================
  // 🔔 SISTEMA DE LISTENERS (OPCIONAL)
  // ===============================================

  addListener(callback) {
    this.listeners.add(callback);
    
    // Retornar función para remover listener
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          user: this.user,
          profile: this.profile,
          isAuthenticated: this.isAuthenticated
        });
      } catch (error) {
        console.error('❌ Error en listener:', error);
      }
    });
  }

  // ===============================================
  // 📊 INFORMACIÓN DE ESTADO
  // ===============================================

  getState() {
    return {
      user: this.user,
      profile: this.profile,
      isAuthenticated: this.isAuthenticated,
      isInitialized: this.isInitialized
    };
  }

  // ===============================================
  // 🧪 MÉTODOS PARA TESTING
  // ===============================================

  async quickLogin(userType = 'padre') {
    const testUsers = {
      padre: { email: 'maria@ejemplo.com', password: '123456' },
      profesor: { email: 'profesor3@clubcanino.com', password: '123456' },
      admin: { email: 'admin@clubcanino.com', password: '123456' }
    };

    const user = testUsers[userType];
    if (!user) {
      throw new Error(`Tipo de usuario no válido: ${userType}`);
    }

    return await this.signIn(user.email, user.password);
  }
}

// ===============================================
// 🚀 EXPORTAR INSTANCIA SINGLETON
// ===============================================

const authService = new AuthService();

// Auto-inicializar en el cliente
if (typeof window !== 'undefined') {
  // Inicializar después de que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      authService.initialize().catch(console.error);
    });
  } else {
    // DOM ya está listo
    setTimeout(() => {
      authService.initialize().catch(console.error);
    }, 100);
  }
}

export { authService };
export default authService;