// public/sw.js - Service Worker FINAL para Club Canino (SIN conflictos MIME)
const CACHE_NAME = 'club-canino-final-v1.3.0';
const STATIC_CACHE = 'club-canino-static-v1.3.0';

// 🚨 CRÍTICO: URLs que NUNCA deben ser cacheadas
const NEVER_CACHE_PATTERNS = [
  // 🔥 SUPABASE - NUNCA cachear
  /supabase\.co/,
  /\.supabase\.co/,
  
  // 🔥 JAVASCRIPT - NUNCA cachear (evita MIME type error)
  /\.js$/,
  /\.jsx$/,
  /\.ts$/,
  /\.tsx$/,
  /\.mjs$/,
  /\.cjs$/,
  
  // 🔥 ASSETS DINÁMICOS - NUNCA cachear
  /_astro\/.*\.js/,
  /chunks\/.*\.js/,
  /\.css$/,
  /\.map$/,
  
  // 🔥 APIs y RUTAS DINÁMICAS - NUNCA cachear
  /\/api\//,
  /\/auth\//,
  /\/rest\//,
  /\/storage\//,
  /\/dashboard\//,
  /\/admin\//,
  /\/login/,
  /\/register/,
  /\/evaluacion/,
  
  // 🔥 DEVELOPMENT - NUNCA cachear
  /\/@vite/,
  /\/@id/,
  /\/__vite/,
  /\/src\//,
  /localhost/,
  /127\.0\.0\.1/
];

// ✅ SOLO estos recursos estáticos PUEDEN ser cacheados
const ALLOWED_CACHE_PATTERNS = [
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
  /\.(woff|woff2|ttf|eot)$/,
  /\/icons\//,
  /\/images\//
];

// ✅ PÁGINAS estáticas que SÍ pueden cachearse
const STATIC_PAGES = [
  '/',
  '/servicios',
  '/instalaciones',
  '/contacto',
  '/preguntas-frecuentes'
];

// ============================================
// 🔍 FUNCIÓN CRÍTICA: Verificar si NO cachear
// ============================================
function shouldNeverCache(request) {
  const url = new URL(request.url);
  
  // Verificar cada patrón de NEVER_CACHE
  const shouldSkip = NEVER_CACHE_PATTERNS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(url.href) || pattern.test(url.pathname);
    }
    return url.href.includes(pattern) || url.pathname.includes(pattern);
  });
  
  if (shouldSkip) {
    console.log('🚫 SW: NO cacheando (patrón bloqueado):', url.pathname);
    return true;
  }
  
  return false;
}

// ============================================
// 🔍 FUNCIÓN: Verificar si SÍ puede cachearse
// ============================================
function canBeCached(request) {
  const url = new URL(request.url);
  
  // Solo assets estáticos permitidos
  return ALLOWED_CACHE_PATTERNS.some(pattern => 
    pattern.test(url.pathname)
  );
}

// ============================================
// 🚀 INSTALACIÓN ULTRA CONSERVADORA
// ============================================
self.addEventListener('install', (event) => {
  console.log('📦 Club Canino SW v1.3.0: Instalando (modo ultra-seguro)...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('💾 Pre-cacheando SOLO páginas estáticas seguras...');
        
        return Promise.allSettled(
          STATIC_PAGES.map(async (url) => {
            try {
              const response = await fetch(url, { 
                cache: 'no-cache',
                headers: { 'Cache-Control': 'no-cache' }
              });
              
              if (response.ok && response.status === 200) {
                console.log(`✅ Pre-cacheado: ${url}`);
                return cache.put(url, response.clone());
              } else {
                console.warn(`⚠️ No pre-cacheado: ${url} (status: ${response.status})`);
              }
            } catch (err) {
              console.warn(`❌ Error pre-cacheando ${url}:`, err.message);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ SW instalado - solo páginas estáticas cacheadas');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error instalando SW:', error);
      })
  );
});

// ============================================
// 🔄 ACTIVACIÓN Y LIMPIEZA AGRESIVA
// ============================================
self.addEventListener('activate', (event) => {
  console.log('🔄 SW: Activando y limpiando caches problemáticos...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar TODOS los caches antiguos agresivamente
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE
            )
            .map(cacheName => {
              console.log('🗑️ Eliminando cache antiguo/problemático:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Tomar control inmediato
      self.clients.claim()
      
    ]).then(() => {
      console.log('✅ SW activado - caches limpios');
      
      // Notificar a la app que estamos activos
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_NAME
          });
        });
      });
    })
  );
});

// ============================================
// 🌐 FETCH: ESTRATEGIA ULTRA CONSERVADORA
// ============================================
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // 🚨 PASO 1: NUNCA interceptar recursos críticos
  if (shouldNeverCache(request)) {
    // Dejar que pase directo al servidor SIN interceptar
    console.log('🚫 SW: Pasando directo (no interceptado):', url.pathname);
    return; // ← CLAVE: No usar event.respondWith()
  }
  
  // 🔍 PASO 2: Solo interceptar navegación de páginas estáticas
  if (request.mode === 'navigate') {
    // Solo para páginas estáticas conocidas
    if (STATIC_PAGES.includes(url.pathname)) {
      event.respondWith(handleStaticNavigation(request));
    }
    // Para todo lo demás, dejar pasar directo
    return;
  }
  
  // 🖼️ PASO 3: Solo interceptar assets estáticos seguros
  if (canBeCached(request)) {
    event.respondWith(handleStaticAsset(request));
  }
  
  // Para todo lo demás (JS, CSS, APIs), NUNCA interceptar
});

// ============================================
// 📄 MANEJAR NAVEGACIÓN ESTÁTICA
// ============================================
async function handleStaticNavigation(request) {
  try {
    console.log('🔍 SW: Manejando navegación estática:', request.url);
    
    // Network First para páginas (siempre datos frescos)
    const networkResponse = await fetch(request, {
      cache: 'no-cache'
    });
    
    if (networkResponse.ok) {
      // Cachear respuesta fresca
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('🌐 SW: Red falló, buscando en cache...');
    
    // Fallback a cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('✅ SW: Sirviendo desde cache:', request.url);
      return cached;
    }
    
    // Último fallback: página de error offline
    return createOfflineResponse();
  }
}

// ============================================
// 🖼️ MANEJAR ASSETS ESTÁTICOS
// ============================================
async function handleStaticAsset(request) {
  try {
    // Cache First para assets estáticos
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Si no está en cache, obtener de red
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.warn('⚠️ SW: Error obteniendo asset:', request.url);
    throw error;
  }
}

// ============================================
// 📄 RESPUESTA OFFLINE
// ============================================
function createOfflineResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sin Conexión | Club Canino</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #FFFBF0, #ACF0F4);
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh; margin: 0; padding: 20px;
        }
        .container { 
          background: white; border-radius: 16px; padding: 40px;
          text-align: center; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        h1 { color: #2C3E50; margin-bottom: 16px; }
        p { color: #666; margin-bottom: 24px; }
        button { 
          background: #56CCF2; color: white; border: none;
          padding: 12px 24px; border-radius: 8px; cursor: pointer;
          font-size: 16px; width: 100%;
        }
        button:hover { background: #2C3E50; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="font-size: 48px; margin-bottom: 16px;">📡</div>
        <h1>Sin Conexión</h1>
        <p>Verifica tu conexión a internet y vuelve a intentarlo.</p>
        <button onclick="window.location.reload()">🔄 Reintentar</button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// ============================================
// 📬 MENSAJES DE LA APP
// ============================================
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      console.log('⏭️ SW: Skip waiting solicitado');
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ 
        version: CACHE_NAME,
        timestamp: new Date().toISOString()
      });
      break;
      
    case 'CLEAR_ALL_CACHES':
      console.log('🧹 SW: Limpiando todos los caches...');
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('✅ SW: Todos los caches eliminados');
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    default:
      console.log('📨 SW: Mensaje no reconocido:', type);
  }
});

// ============================================
// 🔧 MANEJO DE ERRORES
// ============================================
self.addEventListener('error', (event) => {
  console.error('❌ SW Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ SW Promise Rejection:', event.reason);
  event.preventDefault();
});

console.log('🐕 Club Canino Service Worker v1.3.0 ULTRA-SEGURO activado');