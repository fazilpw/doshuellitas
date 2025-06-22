// public/sw-fixed.js - Service Worker SIN interferir con Supabase
const CACHE_NAME = 'club-canino-v1.0.1';

// 🚫 NUNCA CACHEAR ESTAS RUTAS (MUY IMPORTANTE)
const NEVER_CACHE = [
  // Supabase y APIs
  'supabase.co',
  '/auth/',
  '/rest/',
  '/storage/',
  'api.',
  // Páginas dinámicas
  '/dashboard/',
  '/evaluacion/',
  '/login',
  // Assets que cambian
  '_astro',
  '.css',
  '.js'
];

// ✅ SOLO CACHEAR ESTAS PÁGINAS ESTÁTICAS
const CACHE_ROUTES = [
  '/',
  '/servicios',
  '/instalaciones', 
  '/contacto',
  '/preguntas-frecuentes'
];

// ============================================
// 🚀 INSTALACIÓN ULTRA CONSERVADORA
// ============================================
self.addEventListener('install', (event) => {
  console.log('📦 SW: Instalando versión corregida...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('💾 Pre-cacheando solo páginas estáticas...');
        
        // Solo cachear páginas estáticas, NUNCA dinámicas
        return Promise.allSettled(
          CACHE_ROUTES.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok && response.status === 200) {
                  console.log(`✅ Cacheado: ${url}`);
                  return cache.put(url, response.clone());
                }
                console.warn(`⚠️ No cacheado: ${url} (status: ${response.status})`);
                return Promise.resolve();
              })
              .catch(err => {
                console.warn(`❌ Error cacheando ${url}:`, err);
                return Promise.resolve();
              })
          )
        );
      })
      .then(() => {
        console.log('✅ SW instalado correctamente');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error instalación SW:', error);
      })
  );
});

// ============================================
// 🔄 ACTIVACIÓN Y LIMPIEZA
// ============================================
self.addEventListener('activate', (event) => {
  console.log('🔄 SW: Activando...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.includes('club-canino') && 
              cacheName !== CACHE_NAME
            )
            .map(cacheName => {
              console.log(`🗑️ Eliminando cache antiguo: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Claim clients
      self.clients.claim()
    ])
    .then(() => {
      console.log('✅ SW activado correctamente');
      
      // Notificar a la app
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            message: 'Service Worker activado sin conflictos'
          });
        });
      });
    })
    .catch(error => {
      console.error('❌ Error activación SW:', error);
    })
  );
});

// ============================================
// 🌐 FETCH - ESTRATEGIA MUY SELECTIVA
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 🚫 IGNORAR COMPLETAMENTE (no interceptar)
  if (shouldNeverCache(request)) {
    console.log(`🚫 SW: Ignorando ${url.pathname}`);
    return; // Dejar que el navegador maneje normalmente
  }
  
  // 📄 SOLO para páginas estáticas de navegación
  if (request.mode === 'navigate' && isStaticPage(url)) {
    console.log(`📄 SW: Manejando página estática ${url.pathname}`);
    event.respondWith(handleStaticPage(request));
    return;
  }
  
  // Para todo lo demás, NO interceptar
  console.log(`➡️ SW: Pasando al navegador ${url.pathname}`);
});

// ============================================
// 🔍 FUNCIONES DE FILTRADO
// ============================================

function shouldNeverCache(request) {
  const url = request.url.toLowerCase();
  
  // Verificar contra lista negra
  return NEVER_CACHE.some(pattern => url.includes(pattern.toLowerCase())) ||
         // Métodos no-GET
         request.method !== 'GET' ||
         // Headers específicos
         request.headers.get('authorization') ||
         // URLs con parámetros de auth
         url.includes('token=') ||
         url.includes('access_token=');
}

function isStaticPage(url) {
  const pathname = url.pathname;
  
  // Solo páginas completamente estáticas
  return CACHE_ROUTES.includes(pathname) ||
         pathname.endsWith('.html');
}

// ============================================
// 📄 MANEJO DE PÁGINAS ESTÁTICAS
// ============================================
async function handleStaticPage(request) {
  const url = new URL(request.url);
  
  try {
    console.log(`🌐 SW: Intentando red para ${url.pathname}...`);
    
    // SIEMPRE intentar red primero (network-first)
    const networkResponse = await fetch(request, {
      credentials: 'same-origin',
      redirect: 'follow'
    });
    
    if (networkResponse && networkResponse.ok) {
      console.log(`✅ SW: Red OK para ${url.pathname}`);
      
      // Cachear solo si es completamente exitoso
      if (networkResponse.status === 200) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, networkResponse.clone());
          console.log(`💾 SW: Cacheado ${url.pathname}`);
        } catch (cacheError) {
          console.warn(`⚠️ SW: Error cacheando ${url.pathname}:`, cacheError);
        }
      }
      
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (networkError) {
    console.log(`📱 SW: Red falló para ${url.pathname}, buscando cache...`);
    
    // Fallback a cache solo si la red falla
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log(`✅ SW: Cache hit para ${url.pathname}`);
        return cachedResponse;
      }
      
      console.log(`❌ SW: No cache para ${url.pathname}`);
      
    } catch (cacheError) {
      console.warn(`⚠️ SW: Error accediendo cache para ${url.pathname}:`, cacheError);
    }
    
    // Si todo falla, página offline básica
    return createOfflineResponse(url.pathname);
  }
}

// ============================================
// 🚫 RESPUESTA OFFLINE MÍNIMA
// ============================================
function createOfflineResponse(pathname) {
  const offlineHTML = `<!DOCTYPE html>
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
  <div>
    <div class="icon">🐕‍🦺</div>
    <h1>Sin Conexión</h1>
    <p>Esta página no está disponible offline.</p>
    <button onclick="window.location.reload()">🔄 Reintentar</button>
    <button onclick="window.location.href='/'">🏠 Inicio</button>
  </div>
</body>
</html>`;

  return new Response(offlineHTML, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

console.log('✅ SW Corregido v1.0.1 - SIN interferir con Supabase');