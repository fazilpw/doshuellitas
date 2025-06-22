// public/sw.js - Service Worker Mobile-Optimized para Club Canino
const CACHE_NAME = 'club-canino-mobile-v1.0.0';

// 🔍 DETECCIÓN DE DISPOSITIVO
const isMobile = () => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// 📱 RECURSOS MÍNIMOS para móviles (sin conflictos)
const MOBILE_CORE_ASSETS = [
  '/',
  '/app'
];

// ============================================
// 🚀 INSTALACIÓN SIMPLIFICADA
// ============================================
self.addEventListener('install', (event) => {
  console.log('📱 Club Canino Mobile SW: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache solo recursos esenciales para evitar conflictos
        console.log('💾 Cacheando recursos móviles básicos...');
        return Promise.allSettled(
          MOBILE_CORE_ASSETS.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response.clone());
                }
                return Promise.resolve();
              })
              .catch(err => {
                console.warn(`⚠️ No se pudo pre-cachear ${url}:`, err);
                return Promise.resolve();
              })
          )
        );
      })
      .then(() => {
        console.log('✅ Mobile SW instalado');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error instalación mobile SW:', error);
      })
  );
});

// ============================================
// 🔄 ACTIVACIÓN MÓVIL
// ============================================
self.addEventListener('activate', (event) => {
  console.log('🔄 Mobile SW: Activando...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('🗑️ Eliminando cache móvil antiguo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Claim clients
      self.clients.claim()
    ])
    .then(() => {
      console.log('✅ Mobile SW activado');
    })
    .catch((error) => {
      console.error('❌ Error activación mobile SW:', error);
    })
  );
});

// ============================================
// 🌐 FETCH - ESTRATEGIA ULTRA SIMPLE PARA MÓVILES
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 🚫 SOLO interceptar lo mínimo necesario en móviles
  if (shouldIgnoreMobileRequest(request)) {
    // Dejar que el navegador maneje la request normalmente
    return;
  }
  
  // 📱 SOLO para navegación de páginas principales
  if (request.mode === 'navigate' && isMainPageRequest(url)) {
    event.respondWith(handleMobileNavigation(request));
  }
  
  // Para todo lo demás, usar la red directamente
});

// ============================================
// 🔍 FILTROS MÓVILES MUY ESTRICTOS
// ============================================
function shouldIgnoreMobileRequest(request) {
  const url = request.url;
  
  // Ignorar TODO excepto navegación principal
  return (
    !url.startsWith('http') ||                    // Solo HTTP
    url.includes('api/') ||                       // No APIs
    url.includes('_astro/') ||                    // No assets Astro
    url.includes('.css') ||                       // No CSS
    url.includes('.js') ||                        // No JS
    url.includes('.png') ||                       // No imágenes
    url.includes('.jpg') ||                       // No imágenes
    url.includes('.svg') ||                       // No SVG
    url.includes('supabase') ||                   // No Supabase
    url.includes('analytics') ||                  // No analytics
    url.includes('font') ||                       // No fonts
    request.method !== 'GET' ||                   // Solo GET
    request.destination === 'image' ||            // No imágenes
    request.destination === 'script' ||           // No scripts
    request.destination === 'style'               // No estilos
  );
}

function isMainPageRequest(url) {
  const pathname = url.pathname;
  
  // Solo interceptar páginas principales
  return (
    pathname === '/' ||
    pathname === '/app' ||
    pathname === '/login' ||
    pathname.startsWith('/dashboard/')
  );
}

// ============================================
// 📱 NAVEGACIÓN MÓVIL SUPER SIMPLE
// ============================================
async function handleMobileNavigation(request) {
  try {
    console.log('📱 Navegación móvil:', request.url);
    
    // SIEMPRE intentar red primero en móviles
    const networkResponse = await fetch(request, {
      // Configuración optimizada para móviles
      credentials: 'same-origin',
      redirect: 'follow',
      mode: 'same-origin'
    });
    
    if (networkResponse && networkResponse.ok) {
      // Solo cachear si la respuesta es perfecta
      if (networkResponse.status === 200 && networkResponse.headers.get('content-type')?.includes('text/html')) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, networkResponse.clone());
          console.log('✅ Página cacheada para móvil:', request.url);
        } catch (cacheError) {
          console.warn('⚠️ Error cacheando en móvil:', cacheError);
          // Continuar sin cachear
        }
      }
      
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (networkError) {
    console.log('📱 Red falló en móvil, buscando cache:', request.url);
    
    // Fallback a cache solo si existe
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log('✅ Cache hit en móvil:', request.url);
        return cachedResponse;
      }
    } catch (cacheError) {
      console.warn('⚠️ Error accediendo cache móvil:', cacheError);
    }
    
    // Último recurso: página offline mínima
    return createMobileOfflineResponse(request);
  }
}

// ============================================
// 🚫 RESPUESTA OFFLINE MÓVIL MÍNIMA
// ============================================
function createMobileOfflineResponse(request) {
  const url = new URL(request.url);
  
  // HTML mínimo sin conflictos
  const offlineHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Club Canino - Sin Conexión</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      margin: 0; padding: 20px; text-align: center; background: #FFFBF0; 
      min-height: 100vh; display: flex; flex-direction: column; 
      justify-content: center; align-items: center;
    }
    .container { max-width: 300px; }
    h1 { color: #2C3E50; margin-bottom: 20px; }
    button { 
      background: #56CCF2; color: white; border: none; 
      padding: 12px 24px; border-radius: 8px; font-size: 16px;
      cursor: pointer; width: 100%; margin-top: 20px;
    }
    .icon { font-size: 48px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🐕</div>
    <h1>Sin Conexión</h1>
    <p>Club Canino no está disponible sin internet.</p>
    <button onclick="window.location.reload()">🔄 Reintentar</button>
    <button onclick="window.history.back()" style="background: #ccc; color: #333; margin-top: 10px;">
      ← Volver
    </button>
  </div>
</body>
</html>`;

  return new Response(offlineHTML, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}

// ============================================
// 🔔 NOTIFICACIONES MÓVILES BÁSICAS
// ============================================
self.addEventListener('push', (event) => {
  console.log('📱 Push móvil recibido');
  
  // Configuración básica para móviles
  const options = {
    body: 'Nueva actualización de tu mascota',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'club-canino-mobile',
    requireInteraction: false,
    silent: false,
    vibrate: [100, 50, 100]
  };
  
  // Parse data si está disponible
  if (event.data) {
    try {
      const data = event.data.json();
      options.title = data.title || 'Club Canino';
      options.body = data.body || options.body;
    } catch (error) {
      console.warn('⚠️ Error parsing push data móvil:', error);
      options.title = 'Club Canino';
    }
  } else {
    options.title = 'Club Canino';
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
      .catch(error => {
        console.error('❌ Error mostrando notificación móvil:', error);
      })
  );
});

// Click en notificación móvil
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Click notificación móvil');
  
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Si hay una ventana abierta, enfocarla
        if (clients.length > 0) {
          return clients[0].focus();
        }
        
        // Si no, abrir nueva ventana
        return self.clients.openWindow('/app');
      })
      .catch((error) => {
        console.error('❌ Error manejando click notificación móvil:', error);
      })
  );
});

// ============================================
// 📱 LOG FINAL
// ============================================
console.log('📱 Club Canino Mobile SW v1.0.0 - Optimizado para móviles ✅');