// src/lib/authService.js
// 🔐 SERVICIO DE AUTENTICACIÓN CON SINCRONIZACIÓN AUTOMÁTICA
// Club Canino Dos Huellitas - Solución para desconexión auth.users ↔ profiles

import supabase from './supabase.js'; // Usar tu configuración existente

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} email
 * @property {'padre'|'profesor'|'admin'|'conductor'} role
 * @property {string|null} full_name
 * @property {string|null} phone
 * @property {string|null} avatar_url
 * @property {boolean} active
 * @property {string} club_member_since
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} email
 * @property {string} created_at
 * @property {string} last_sign_in_at
 */

/**
 * @typedef {Object} DebugInfo
 * @property {boolean} isInitialized
 * @property {boolean} hasUser
 * @property {boolean} hasProfile
 * @property {boolean} isAuthenticated
 * @property {string|undefined} userEmail
 * @property {string|undefined} userRole
 * @property {boolean} debugMode
 */

// ===============================================
// 🔐 CLASE AUTHSERVICE CON SINCRONIZACIÓN
// ===============================================

class AuthService {
  constructor() {
    /** @type {boolean} */
    this.isInitialized = false;
    
    /** @type {AuthUser|null} */
    this.currentUser = null;
    
    /** @type {UserProfile|null} */
    this.currentProfile = null;
    
    /** @type {boolean} */
    this.debug = import.meta.env.MODE === 'development';
    
    if (this.debug) {
      console.log('🔐 AuthService inicializando con sincronización automática...');
    }
  }

  // ===============================================
  // 🚀 INICIALIZACIÓN
  // ===============================================

  /**
   * Inicializa el servicio y verifica sesión existente
   * @returns {Promise<AuthUser|null>}
   */
  async initialize() {
    try {
      if (this.debug) console.log('🔄 Verificando sesión existente...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        if (this.debug) console.error('❌ Error obteniendo sesión:', error);
        throw error;
      }

      if (session?.user) {
        if (this.debug) console.log('✅ Sesión encontrada:', session.user.email);
        this.currentUser = session.user;
        await this.loadProfileWithSync(session.user.id, session.user.email);
      } else {
        if (this.debug) console.log('ℹ️ No hay sesión activa');
      }

      this.isInitialized = true;
      return this.currentUser;
      
    } catch (error) {
      console.error('❌ Error inicializando AuthService:', error);
      this.isInitialized = true; // Marcar como inicializado aunque falle
      return null;
    }
  }

  // ===============================================
  // 🔐 AUTENTICACIÓN
  // ===============================================

  /**
   * Inicia sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<AuthUser>}
   */
  async signIn(email, password) {
    try {
      if (this.debug) console.log('🔄 Intentando login con:', email);

      // Validaciones básicas
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }

      if (!email.includes('@')) {
        throw new Error('Formato de email inválido');
      }

      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Intentar login usando tu configuración existente de Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });

      if (error) {
        if (this.debug) console.error('❌ Error en signIn:', error);
        
        // Traducir errores comunes a español
        const translatedError = this.translateAuthError(error.message);
        throw new Error(translatedError);
      }

      if (!data.user) {
        throw new Error('Error inesperado en el login');
      }

      // Login exitoso - usar sincronización inteligente
      this.currentUser = data.user;
      await this.loadProfileWithSync(data.user.id, data.user.email);

      if (this.debug) {
        console.log('✅ Login exitoso:', {
          email: this.currentUser.email,
          role: this.currentProfile?.role,
          profile: !!this.currentProfile,
          synced: true
        });
      }

      return data.user;

    } catch (error) {
      console.error('❌ Error en signIn:', error);
      throw error;
    }
  }

  // ===============================================
  // 👤 GESTIÓN DE PERFIL CON SINCRONIZACIÓN
  // ===============================================

  /**
   * Carga el perfil con sincronización automática auth.users ↔ profiles
   * @param {string} authUserId - ID real de auth.users
   * @param {string} userEmail - Email del usuario para fallback
   * @returns {Promise<UserProfile>}
   */
  async loadProfileWithSync(authUserId, userEmail) {
    try {
      if (this.debug) console.log('🔄 Cargando perfil con sync para:', authUserId, userEmail);

      // PASO 1: Buscar por ID de auth.users (caso ideal)
      const { data: profileById, error: errorById } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (!errorById && profileById) {
        // ✅ Encontrado por ID - todo está sincronizado
        if (this.debug) console.log('✅ Perfil encontrado por ID (ya sincronizado)');
        this.currentProfile = profileById;
        return profileById;
      }

      // PASO 2: No encontrado por ID, buscar por email (caso de desincronización)
      if (this.debug) console.log('🔍 No encontrado por ID, buscando por email...');
      
      const { data: profileByEmail, error: errorByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail.toLowerCase().trim())
        .single();

      if (!errorByEmail && profileByEmail) {
        // 🔄 Encontrado por email - necesita sincronización
        if (this.debug) console.log('🔄 Perfil encontrado por email, sincronizando ID...');
        
        const syncedProfile = await this.syncProfileId(profileByEmail.id, authUserId, userEmail);
        this.currentProfile = syncedProfile;
        return syncedProfile;
      }

      // PASO 3: No existe perfil - crear uno nuevo
      if (this.debug) console.log('➕ No existe perfil, creando nuevo...');
      return await this.createBasicProfile(authUserId, userEmail);

    } catch (error) {
      console.error('❌ Error en loadProfileWithSync:', error);
      throw error;
    }
  }

  /**
   * Sincroniza el ID del perfil con el ID real de auth.users
   * @param {string} oldProfileId - ID actual en profiles (hardcodeado)
   * @param {string} newAuthUserId - ID real de auth.users
   * @param {string} userEmail - Email para verificación
   * @returns {Promise<UserProfile>}
   */
  async syncProfileId(oldProfileId, newAuthUserId, userEmail) {
    try {
      if (this.debug) {
        console.log('🔄 Sincronizando IDs:', {
          oldId: oldProfileId,
          newId: newAuthUserId,
          email: userEmail
        });
      }

      // Actualizar el ID en profiles para que coincida con auth.users
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ id: newAuthUserId })
        .eq('id', oldProfileId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error sincronizando ID:', error);
        
        // Si falla la sincronización, aún podemos usar el perfil existente
        // pero sin la sincronización perfecta
        const { data: fallbackProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail)
          .single();
        
        if (fallbackProfile) {
          if (this.debug) console.log('⚠️ Usando perfil sin sincronizar como fallback');
          return fallbackProfile;
        }
        
        throw error;
      }

      if (this.debug) console.log('✅ ID sincronizado exitosamente');
      return updatedProfile;

    } catch (error) {
      console.error('❌ Error en syncProfileId:', error);
      throw error;
    }
  }

  /**
   * Carga el perfil del usuario (método legacy para compatibilidad)
   * @param {string} userId - ID del usuario
   * @returns {Promise<UserProfile>}
   */
  async loadProfile(userId) {
    if (this.currentUser?.email) {
      return await this.loadProfileWithSync(userId, this.currentUser.email);
    } else {
      // Fallback al método anterior si no hay email disponible
      return await this.loadProfileLegacy(userId);
    }
  }

  /**
   * Método de carga legacy (para compatibilidad)
   * @param {string} userId - ID del usuario
   * @returns {Promise<UserProfile>}
   */
  async loadProfileLegacy(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return await this.createBasicProfile(userId, this.currentUser?.email);
        }
        throw error;
      }

      this.currentProfile = data;
      return data;

    } catch (error) {
      console.error('❌ Error en loadProfileLegacy:', error);
      throw error;
    }
  }

  /**
   * Crea un perfil básico para nuevos usuarios
   * @param {string} userId - ID del usuario
   * @param {string} [userEmail] - Email del usuario (opcional)
   * @returns {Promise<UserProfile>}
   */
  async createBasicProfile(userId, userEmail) {
    try {
      if (this.debug) console.log('🔄 Creando perfil básico...');

      const email = userEmail || this.currentUser?.email || '';
      
      const profileData = {
        id: userId,
        email: email,
        role: 'padre', // Rol por defecto
        full_name: email.split('@')[0] || 'Usuario',
        active: true
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.currentProfile = data;
      
      if (this.debug) {
        console.log('✅ Perfil básico creado:', data);
      }

      return data;

    } catch (error) {
      console.error('❌ Error creando perfil:', error);
      
      // Si falla por duplicate key, intentar recuperar el existente
      if (error.code === '23505' && error.message.includes('email')) {
        if (this.debug) console.log('🔄 Email duplicado, intentando recuperar perfil existente...');
        
        const email = userEmail || this.currentUser?.email;
        if (email) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();
          
          if (existingProfile) {
            if (this.debug) console.log('✅ Perfil existente recuperado');
            this.currentProfile = existingProfile;
            return existingProfile;
          }
        }
      }
      
      throw error;
    }
  }

  // ===============================================
  // 🧭 NAVEGACIÓN Y ROLES
  // ===============================================

  /**
   * Obtiene la URL del dashboard según el rol del usuario
   * @param {string} [role] - Rol específico (opcional)
   * @returns {string} URL del dashboard
   */
  getDashboard(role) {
    const userRole = role || this.currentProfile?.role || 'padre';
    
    const dashboards = {
      admin: '/dashboard/admin/',
      profesor: '/dashboard/profesor/',
      conductor: '/dashboard/conductor/',
      padre: '/dashboard/padre/'
    };

    const dashboard = dashboards[userRole] || dashboards.padre;
    
    if (this.debug) {
      console.log('🧭 Redirigiendo a dashboard:', { role: userRole, url: dashboard });
    }

    return dashboard;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   * @param {string} requiredRole - Rol requerido
   * @returns {boolean}
   */
  hasRole(requiredRole) {
    const userRole = this.currentProfile?.role;
    
    if (!userRole) return false;

    // Admin puede acceder a todo
    if (userRole === 'admin') return true;

    // Verificación específica
    return userRole === requiredRole;
  }

  /**
   * Verifica si el usuario puede acceder a una ruta específica
   * @param {string} route - Ruta a verificar
   * @returns {boolean}
   */
  canAccess(route) {
    const userRole = this.currentProfile?.role;
    
    // Rutas públicas
    const publicRoutes = ['/', '/login', '/about', '/servicios', '/instalaciones', '/contacto'];
    if (publicRoutes.some(r => route.startsWith(r))) {
      return true;
    }

    // Rutas protegidas
    if (!userRole) return false;

    // Admin acceso total
    if (userRole === 'admin') return true;

    // Verificaciones específicas por rol
    if (route.startsWith('/dashboard/admin') && userRole !== 'admin') {
      return false;
    }

    if (route.startsWith('/dashboard/profesor') && !['admin', 'profesor'].includes(userRole)) {
      return false;
    }

    return true;
  }

  // ===============================================
  // 🚪 LOGOUT
  // ===============================================

  /**
   * Cierra la sesión del usuario
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      if (this.debug) console.log('🔄 Cerrando sesión...');

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Limpiar estado local
      this.currentUser = null;
      this.currentProfile = null;

      if (this.debug) console.log('✅ Sesión cerrada correctamente');

    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      // Limpiar estado local aunque haya error
      this.currentUser = null;
      this.currentProfile = null;
    }
  }

  // ===============================================
  // 🔍 GETTERS Y ESTADO
  // ===============================================

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean}
   */
  get isAuthenticated() {
    return !!(this.currentUser && this.currentProfile);
  }

  /**
   * Obtiene el usuario actual
   * @returns {AuthUser|null}
   */
  get user() {
    return this.currentUser;
  }

  /**
   * Obtiene el perfil actual
   * @returns {UserProfile|null}
   */
  get profile() {
    return this.currentProfile;
  }

  /**
   * Obtiene el rol del usuario actual
   * @returns {string|undefined}
   */
  get userRole() {
    return this.currentProfile?.role;
  }

  // ===============================================
  // 🛠️ UTILIDADES PRIVADAS
  // ===============================================

  /**
   * Traduce errores de autenticación a español
   * @param {string} errorMessage - Mensaje de error original
   * @returns {string} Mensaje traducido
   */
  translateAuthError(errorMessage) {
    const translations = {
      'Invalid login credentials': 'Email o contraseña incorrectos',
      'Email not confirmed': 'Por favor confirma tu email antes de iniciar sesión',
      'Too many requests': 'Demasiados intentos. Intenta de nuevo en unos minutos',
      'User not found': 'Usuario no encontrado',
      'Invalid email': 'Email inválido',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
      'Signup disabled': 'El registro está deshabilitado',
      'Email rate limit exceeded': 'Límite de emails excedido',
      'Database connection error': 'Error de conexión con la base de datos'
    };

    return translations[errorMessage] || errorMessage;
  }

  // ===============================================
  // 🛠️ UTILIDADES DE DEBUG
  // ===============================================

  /**
   * Obtiene información de debug del servicio
   * @returns {DebugInfo}
   */
  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      hasUser: !!this.currentUser,
      hasProfile: !!this.currentProfile,
      isAuthenticated: this.isAuthenticated,
      userEmail: this.currentUser?.email,
      userRole: this.currentProfile?.role,
      debugMode: this.debug
    };
  }

  /**
   * Escucha cambios en el estado de autenticación
   * @param {Function} callback - Función a ejecutar cuando cambie el estado
   * @returns {Object} Subscription object
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (this.debug) {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
      }
      
      if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.currentProfile = null;
      } else if (event === 'SIGNED_IN' && session?.user) {
        this.currentUser = session.user;
        // La carga del perfil se hace en signIn
      }
      
      callback(event, session);
    });
  }
}

// ===============================================
// 🌟 SINGLETON EXPORTADO
// ===============================================

export const authService = new AuthService();

// Para debugging en desarrollo - compatible con tu estructura
if (import.meta.env.MODE === 'development') {
  if (typeof window !== 'undefined') {
    window.authService = authService;
    console.log('🔧 AuthService con sincronización disponible en window.authService');
  }
}

// Export por defecto para compatibilidad con tu estructura existente
export default authService;