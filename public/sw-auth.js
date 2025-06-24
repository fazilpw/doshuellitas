// public/sw-auth.js - Service Worker con Autenticación Club Canino
const CACHE_NAME = 'club-canino-auth-v1.2.0';
const AUTH_CACHE = 'club-canino-auth-data-v1.0.0';

// ============================================
// 🔐 MANAGER DE AUTENTICACIÓN
// ============================================

class ClubCaninoAuthManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.userRole = null;
    this.userId = null;
  }

  // ============================================
  // 🔄 GESTIÓN DE TOKENS
  // ============================================

  async initializeAuth() {
    try {
      const authCache = await caches.open(AUTH_CACHE);
      const authData = await authCache.match('/auth-data');
      
      if (authData) {
        const data = await authData.json();
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.tokenExpiry = data.tokenExpiry;
        this.userRole = data.userRole;
        this.userId = data.userId;
        
        console.log('🔐 Auth data restored from cache');
      }
    } catch (error) {
      console.warn('⚠️ Error initializing auth:', error);
    }
  }

  async storeAuthData(authData) {
    try {
      this.accessToken = authData.accessToken;
      this.refreshToken = authData.refreshToken;
      this.tokenExpiry = authData.tokenExpiry;
      this.userRole = authData.userRole;
      this.userId = authData.userId;

      // Guardar en cache del SW
      const authCache = await caches.open(AUTH_CACHE);
      const response = new Response(JSON.stringify(authData), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      await authCache.put('/auth-data', response);
      console.log('💾 Auth data stored in SW cache');
      
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
    }
  }

  async getValidToken() {
    // Verificar si estamos online
    if (!navigator.onLine) {
      return this.validateOfflineToken();
    }

    // Verificar si el token necesita renovación
    if (this.needsRefresh()) {
      return await this.refreshToken();
    }

    return this.accessToken;
  }

  needsRefresh() {
    if (!this.tokenExpiry || !this.accessToken) return true;
    
    // Renovar si expira en los próximos 5 minutos
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() + fiveMinutes > this.tokenExpiry;
  }

  async refreshAuthToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const newAuthData = await response.json();
      await this.storeAuthData(newAuthData);
      
      console.log('🔄 Token refreshed successfully');
      return newAuthData.accessToken;
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      await this.clearAuthData();
      throw error;
    }
  }

  validateOfflineToken() {
    // Permitir 2 horas de gracia offline
    const offlineGracePeriod = 2 * 60 * 60 * 1000;
    const maxOfflineTime = parseInt(this.tokenExpiry) + offlineGracePeriod;
    
    if (Date.now() > maxOfflineTime) {
      throw new Error('Token offline expirado - Reconéctate al Club Canino');
    }
    
    console.log('🔓 Using offline token for Club Canino');
    return this.accessToken;
  }

  // ============================================
  // 🧹 LIMPIEZA COMPLETA
  // ============================================

  async clearAuthData() {
    try {
      console.log('🧹 Clearing Club Canino auth data...');
      
      // Limpiar variables internas
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      this.userRole = null;
      this.userId = null;

      // Limpiar cache de auth
      const authCache = await caches.open(AUTH_CACHE);
      await authCache.delete('/auth-data');

      // Limpiar datos específicos del Club Canino
      await this.clearClubCaninoCache();
      
      console.log('✅ Auth data cleared completely');
      
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
    }
  }

  async clearClubCaninoCache() {
    try {
      // Limpiar caches específicos del club
      const clubCaches = [
        'club-canino-pets',
        'club-canino-evaluations',
        'club-canino-photos',
        'club-canino-user-data'
      ];

      await Promise.all(
        clubCaches.map(async (cacheName) => {
          try {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            await Promise.all(keys.map(key => cache.delete(key)));
            console.log(`🗑️ Cleared cache: ${cacheName}`);
          } catch (error) {
            console.warn(`⚠️ Error clearing cache ${cacheName}:`, error);
          }
        })
      );

      // Limpiar cache principal
      const mainCache = await caches.open(CACHE_NAME);
      const userSpecificKeys = await mainCache.keys();
      
      for (const key of userSpecificKeys) {
        if (key.url.includes('/dashboard') || 
            key.url.includes('/evaluacion') ||
            key.url.includes('/mi-') ||
            key.url.includes(`/user/${this.userId}`)) {
          await mainCache.delete(key);
        }
      }

    } catch (error) {
      console.error('❌ Error clearing Club Canino cache:', error);
    }
  }

  // ============================================
  // 👤 INFORMACIÓN DE USUARIO
  // ============================================

  isAuthenticated() {
    return !!this.accessToken && !!this.userId;
  }

  hasRole(requiredRole) {
    if (!this.userRole) return false;
    
    const roleHierarchy = {
      'admin': 3,
      'profesor': 2,
      'padre': 1
    };
    
    const userLevel = roleHierarchy[this.userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 999;
    
    return userLevel >= requiredLevel;
  }

  canAccessResource(url) {
    if (!this.isAuthenticated()) return false;

    // Verificar acceso basado en URL y rol
    if (url.includes('/admin') && !this.hasRole('admin')) {
      return false;
    }
    
    if (url.includes('/profesor') && !this.hasRole('profesor')) {
      return false;
    }

    return true;
  }
}

// ============================================
// 🚀 INICIALIZACIÓN DEL SERVICE WORKER
// ============================================

const authManager = new ClubCaninoAuthManager();

self.addEventListener('install', (event) => {
  console.log('📱 Club Canino Auth SW: Installing...');
  
  event.waitUntil(
    Promise.all([
      authManager.initializeAuth(),
      caches.open(CACHE_NAME).then(cache => {
        // Pre-cache solo páginas de auth
        return cache.addAll([
          '/login',
          '/offline'
        ]).catch(error => {
          console.warn('⚠️ Error pre-caching auth pages:', error);
        });
      })
    ]).then(() => {
      console.log('✅ Club Canino Auth SW installed');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('🔄 Club Canino Auth SW: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => 
              name.includes('club-canino') && 
              !name.includes('auth-v1.2.0') &&
              !name.includes('auth-data-v1.0.0')
            )
            .map(name => {
              console.log('🗑️ Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      
      // Claim clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Club Canino Auth SW activated');
      
      // Notificar a los clientes
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            message: 'Auth Service Worker activo'
          });
        });
      });
    })
  );
});

// ============================================
// 🌐 INTERCEPTAR REQUESTS
// ============================================

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Solo interceptar requests específicas
  if (shouldInterceptRequest(request)) {
    event.respondWith(handleAuthenticatedRequest(request));
  }
});

function shouldInterceptRequest(request) {
  const url = request.url;
  
  // Interceptar solo requests del Club Canino que requieren auth
  return (
    request.method === 'GET' &&
    (
      url.includes('/dashboard') ||
      url.includes('/evaluacion') ||
      url.includes('/api/club') ||
      url.includes('/api/pets') ||
      url.includes('/api/evaluations')
    ) &&
    !url.includes('supabase.co')
  );
}

async function handleAuthenticatedRequest(request) {
  try {
    const url = new URL(request.url);
    
    // Verificar autenticación para rutas protegidas
    if (requiresAuth(url.pathname)) {
      if (!authManager.isAuthenticated()) {
        return createAuthRedirectResponse();
      }
      
      if (!authManager.canAccessResource(url.pathname)) {
        return createUnauthorizedResponse();
      }
    }

    // Intentar obtener token válido
    let token = null;
    try {
      token = await authManager.getValidToken();
    } catch (error) {
      console.warn('⚠️ Token validation failed:', error);
      // Para requests críticas, redireccionar a login
      if (url.pathname.includes('/dashboard')) {
        return createAuthRedirectResponse();
      }
    }

    // Hacer request con token si está disponible
    const headers = new Headers(request.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const authenticatedRequest = new Request(request.url, {
      method: request.method,
      headers: headers,
      body: request.body,
      mode: request.mode,
      credentials: request.credentials,
      cache: 'no-cache' // Evitar cache de datos de usuario
    });

    const response = await fetch(authenticatedRequest);
    
    // Manejar respuestas de auth
    if (response.status === 401) {
      console.log('🔐 Auth expired, clearing data');
      await authManager.clearAuthData();
      return createAuthRedirectResponse();
    }

    return response;

  } catch (error) {
    console.error('❌ Error in authenticated request:', error);
    
    // Fallback a cache o página offline
    return handleOfflineRequest(request);
  }
}

// ============================================
// 📨 MANEJO DE MENSAJES
// ============================================

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'AUTH_LOGIN':
      handleAuthLogin(data);
      break;
      
    case 'AUTH_LOGOUT':
      handleAuthLogout();
      break;
      
    case 'AUTH_REFRESH':
      handleAuthRefresh();
      break;
      
    case 'CLEAR_USER_DATA':
      handleClearUserData(data);
      break;
      
    default:
      console.log('📢 SW message:', type, data);
  }
});

async function handleAuthLogin(authData) {
  try {
    await authManager.storeAuthData(authData);
    console.log('✅ User logged in via SW');
    
    // Notificar a todos los clientes
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'AUTH_STATE_CHANGED',
        state: 'LOGGED_IN',
        userId: authData.userId
      });
    });
    
  } catch (error) {
    console.error('❌ Error handling login:', error);
  }
}

async function handleAuthLogout() {
  try {
    console.log('👋 Processing logout in SW...');
    
    // Limpiar todos los datos de autenticación
    await authManager.clearAuthData();
    
    // Notificar a todos los clientes
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'AUTH_STATE_CHANGED',
        state: 'LOGGED_OUT'
      });
    });
    
    console.log('✅ Logout completed in SW');
    
  } catch (error) {
    console.error('❌ Error handling logout:', error);
  }
}

async function handleAuthRefresh() {
  try {
    const newToken = await authManager.refreshAuthToken();
    console.log('🔄 Token refreshed in SW');
    
    return newToken;
  } catch (error) {
    console.error('❌ Token refresh failed in SW:', error);
    await handleAuthLogout();
  }
}

async function handleClearUserData(userId) {
  try {
    if (userId === authManager.userId) {
      await authManager.clearClubCaninoCache();
      console.log('🧹 User data cleared for:', userId);
    }
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
  }
}

// ============================================
// 🛠️ FUNCIONES AUXILIARES
// ============================================

function requiresAuth(pathname) {
  const protectedPaths = [
    '/dashboard',
    '/evaluacion',
    '/mi-',
    '/admin',
    '/profesor'
  ];
  
  return protectedPaths.some(path => pathname.includes(path));
}

function createAuthRedirectResponse() {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/login'
    }
  });
}

function createUnauthorizedResponse() {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Acceso Denegado - Club Canino</title>
      <style>
        body { 
          font-family: system-ui, sans-serif; margin: 0; padding: 20px; 
          text-align: center; background: #FFFBF0; min-height: 100vh; 
          display: flex; flex-direction: column; justify-content: center; 
        }
        .container { max-width: 400px; margin: 0 auto; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #2C3E50; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 20px; }
        button { 
          background: #56CCF2; color: white; border: none; 
          padding: 12px 24px; border-radius: 8px; font-size: 16px; 
          cursor: pointer; margin: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🚫</div>
        <h1>Acceso Denegado</h1>
        <p>No tienes permisos para acceder a esta sección del Club Canino.</p>
        <button onclick="window.history.back()">← Volver</button>
        <button onclick="window.location.href='/app'">🏠 Dashboard</button>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    status: 403,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleOfflineRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Página offline para Club Canino
    return createOfflineResponse();
    
  } catch (error) {
    return createOfflineResponse();
  }
}

function createOfflineResponse() {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sin Conexión - Club Canino</title>
      <style>
        body { 
          font-family: system-ui, sans-serif; margin: 0; padding: 20px; 
          text-align: center; background: #FFFBF0; min-height: 100vh; 
          display: flex; flex-direction: column; justify-content: center; 
        }
        .container { max-width: 400px; margin: 0 auto; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #2C3E50; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 20px; }
        button { 
          background: #56CCF2; color: white; border: none; 
          padding: 12px 24px; border-radius: 8px; font-size: 16px; 
          cursor: pointer; margin: 5px; width: 100%;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🐕‍🦺</div>
        <h1>Sin Conexión</h1>
        <p>Club Canino no está disponible offline. Verifica tu conexión a internet.</p>
        <button onclick="window.location.reload()">🔄 Reintentar</button>
        <button onclick="window.location.href='/'">🏠 Inicio</button>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

console.log('🔐 Club Canino Auth Service Worker v1.2.0 loaded');