// public/sw.js - Service Worker CORREGIDO para PWA móvil
// 🎯 Objetivo: NO causar pantalla en blanco en app instalada

const CACHE_VERSION = 'club-canino-pwa-v2.0.0';
const STATIC_CACHE = 'club-canino-static-v2';
const RUNTIME_CACHE = 'club-canino-runtime-v2';

// ============================================
// 🚫 RECURSOS QUE NUNCA SE DEBEN CACHEAR
// ============================================

const NEVER_CACHE = [
  // APIs y backends
  /supabase/,
  /\.supabase\./,
  /\/api\//,
  /\/auth\//,
  /\/rest\//,
  
  // JavaScript dinámico (evita MIME type errors)
  /\.js$/,
  /\.jsx$/,
  /\.ts$/,
  /\.tsx$/,
  /\.mjs$/,
  /_astro\/.*\.js/,
  /chunks\/.*\.js/,
  
  // CSS dinámico 
  /\.css$/,
  /_astro\/.*\.css/,
  
  // Rutas dinámicas
  /\/dashboard\//,
  /\/login/,
  /\/register/,
  /\/evaluacion/,
  /\/admin/,
  
  // Development
  /localhost/,
  /127\.0\.0\.1/,
  /@vite/,
  /@id/,
  /__vite/
];

// ============================================
// ✅ RECURSOS SEGUROS PARA CACHEAR
// ============================================

const SAFE_TO_CACHE = [
  // Solo imágenes y fuentes
  /\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/,
  /\.(woff|woff2|ttf|eot)$/,
  /\/icons\//,
  /\/images\//,
  /\/screenshots\//
];

// ============================================
// 📄 PÁGINAS ESTÁTICAS PARA PRE-CACHE
// ============================================

const STATIC_PAGES = [
  '/app-home/',  // ← Página principal para PWA instalada
  '/',
  '/servicios/',
  '/instalaciones/',
  '/contacto/'
];

// ============================================
// 🔍 FUNCIONES DE VERIFICACIÓN
// ============================================

function shouldNeverCache(request) {
  const url = request.url;
  return NEVER_CACHE.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(url);
    }
    return url.includes(pattern);
  });
}

function isSafeToCache(request) {
  const url = request.url;
  return SAFE_TO_CACHE.some(pattern => pattern.test(url));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isStaticPage(url) {
  const pathname = new URL(url).pathname;
  return STATIC_PAGES.some(page => pathname.startsWith(page));
}

// ============================================
// 📦 INSTALACIÓN - PRECACHE MÍNIMO
// ============================================

self.addEventListener('install', (event) => {
  console.log('📦 PWA SW v2.0.0: Instalando con estrategia conservadora...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      console.log('💾 Pre-cacheando páginas críticas...');
      
      // Solo pre-cachear páginas que sabemos que funcionan
      const pagesToCache = ['/app-home/'];
      
      const results = await Promise.allSettled(
        pagesToCache.map(async (url) => {
          try {
            const response = await fetch(url, {
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache'
              }
            });
            
            if (response.ok && response.status === 200) {
              await cache.put(url, response.clone());
              console.log(`✅ Pre-cacheado exitoso: ${url}`);
              return true;
            } else {
              console.warn(`⚠️ No se pudo pre-cachear: ${url} (status: ${response.status})`);
              return false;
            }
          } catch (error) {
            console.error(`❌ Error pre-cacheando ${url}:`, error.message);
            return false;
          }
        })
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      console.log(`📊 Pre-cache completado: ${successful}/${pagesToCache.length} páginas`);
      
      return self.skipWaiting();
    }).catch(error => {
      console.error('❌ Error durante instalación:', error);
      // Continuar incluso si hay errores en pre-cache
      return self.skipWaiting();
    })
  );
});

// ============================================
// 🔄 ACTIVACIÓN - LIMPIEZA CUIDADOSA
// ============================================

self.addEventListener('activate', (event) => {
  console.log('🔄 PWA SW: Activando y limpiando caches antiguos...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches de versiones anteriores
      caches.keys().then(cacheNames => {
        const oldCaches = cacheNames.filter(cacheName => 
          cacheName.includes('club-canino') && 
          cacheName !== STATIC_CACHE && 
          cacheName !== RUNTIME_CACHE
        );
        
        return Promise.all(
          oldCaches.map(cacheName => {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      
      // Tomar control de todas las pestañas
      self.clients.claim()
      
    ]).then(() => {
      console.log('✅ PWA SW activado - Listo para uso');
      
      // Notificar a la app
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION,
            timestamp: new Date().toISOString()
          });
        });
      });
    }).catch(error => {
      console.error('❌ Error durante activación:', error);
    })
  );
});

// ============================================
// 🌐 FETCH - ESTRATEGIA ULTRA CONSERVADORA
// ============================================

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // 🚨 REGLA #1: NUNCA interceptar recursos prohibidos
  if (shouldNeverCache(request)) {
    // Dejar pasar completamente SIN interceptar
    console.log('🚫 SW: Pasando sin interceptar:', url.pathname);
    return; // ← No usar event.respondWith()
  }
  
  // 🚨 REGLA #2: Manejar navegación de forma muy cuidadosa
  if (isNavigationRequest(request)) {
    console.log('🧭 SW: Solicitud de navegación:', url.pathname);
    
    // Solo interceptar páginas que sabemos que están cached
    if (isStaticPage(request.url)) {
      event.respondWith(handleNavigation(request));
    } else {
      // Para cualquier otra navegación, dejar pasar al servidor
      console.log('🚫 SW: Navegación no cached, pasando al servidor:', url.pathname);
      return;
    }
    return;
  }
  
  // 🚨 REGLA #3: Solo cachear assets seguros
  if (isSafeToCache(request)) {
    console.log('🖼️ SW: Manejando asset seguro:', url.pathname);
    event.respondWith(handleAsset(request));
  }
  
  // Para todo lo demás, dejar pasar sin interceptar
});

// ============================================
// 🧭 MANEJAR NAVEGACIÓN
// ============================================

async function handleNavigation(request) {
  const url = new URL(request.url);
  
  try {
    console.log('🔍 SW: Procesando navegación:', url.pathname);
    
    // Network First para navegación (datos frescos)
    const networkResponse = await fetch(request, {
      cache: 'no-cache'
    });
    
    if (networkResponse.ok) {
      // Cachear para uso offline
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('✅ SW: Navegación servida desde red y cacheada');
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
    
  } catch (networkError) {
    console.log('🌐 SW: Red falló para navegación, buscando cache...');
    
    // Intentar servir desde cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('✅ SW: Navegación servida desde cache');
      return cachedResponse;
    }
    
    // Último recurso: página offline para PWA
    console.log('📱 SW: Sirviendo página offline de emergencia');
    return createOfflinePage();
  }
}

// ============================================
// 🖼️ MANEJAR ASSETS
// ============================================

async function handleAsset(request) {
  try {
    // Cache First para assets (rendimiento)
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('💾 SW: Asset servido desde cache:', request.url);
      return cachedResponse;
    }
    
    // Si no está en cache, buscar en red
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear para uso futuro
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('✅ SW: Asset servido desde red y cacheado');
      return networkResponse;
    }
    
    throw new Error(`Asset fetch failed: ${networkResponse.status}`);
    
  } catch (error) {
    console.warn('⚠️ SW: Error cargando asset:', request.url, error.message);
    
    // Para assets, simplemente fallar - el navegador manejará el error
    return new Response('', { status: 404 });
  }
}

// ============================================
// 📱 PÁGINA OFFLINE DE EMERGENCIA
// ============================================

function createOfflinePage() {
  const offlineHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Club Canino - Sin conexión</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #FFFBF0 0%, #ACF0F4 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
      width: 100%;
      background: white;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .icon { font-size: 80px; margin-bottom: 20px; }
    h1 { color: #2C3E50; margin-bottom: 16px; font-size: 1.8rem; }
    p { color: #666; margin-bottom: 30px; line-height: 1.5; }
    .btn {
      background: #56CCF2;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 10px;
      font-weight: bold;
      cursor: pointer;
      font-size: 16px;
      margin: 5px;
    }
    .btn:hover { background: #2C3E50; }
    .btn-secondary { background: #gray; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>Sin Conexión</h1>
    <p>
      No se pudo conectar con el servidor. 
      Verifica tu conexión a internet e intenta nuevamente.
    </p>
    <button class="btn" onclick="window.location.reload()">
      🔄 Reintentar
    </button>
    <button class="btn btn-secondary" onclick="window.location.href='/app-home/'">
      🏠 Ir al inicio
    </button>
    
    <script>
      // Auto-retry cuando vuelva la conexión
      window.addEventListener('online', () => {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
    </script>
  </div>
</body>
</html>
  `;
  
  return new Response(offlineHTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
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
        version: CACHE_VERSION,
        timestamp: new Date().toISOString(),
        caches: {
          static: STATIC_CACHE,
          runtime: RUNTIME_CACHE
        }
      });
      break;
      
    case 'CLEAR_CACHE':
      console.log('🧹 SW: Limpiando caches por solicitud...');
      caches.keys().then(cacheNames => {
        const clubCaninoCaches = cacheNames.filter(name => 
          name.includes('club-canino')
        );
        return Promise.all(
          clubCaninoCaches.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('✅ SW: Caches limpiados');
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

// ============================================
// 📊 INICIALIZACIÓN COMPLETA
// ============================================

console.log('🐕 Club Canino Service Worker v2.0.0 - Optimizado para PWA móvil');
console.log('🎯 Estrategia: Ultra conservadora para evitar pantalla en blanco');
console.log('✅ Listo para cachear solo recursos seguros');