// public/sw.js - Service Worker Compatible Safari/Chrome
const CACHE_NAME = 'club-canino-v1.3.0';
const OFFLINE_URL = '/offline';

// ✅ RECURSOS CORE - Verificados y seguros
const CORE_ASSETS = [
  '/',
  '/app', 
  '/offline',
  '/login'
];

// ============================================
// 🚀 INSTALACIÓN - Simplificada y Robusta
// ============================================
self.addEventListener('install', (event) => {
  console.log('📱 Club Canino SW: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 Cacheando recursos básicos...');
        // Cache individual para evitar fallos en batch
        return Promise.allSettled(
          CORE_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`⚠️ No se pudo cachear ${url}:`, err);
            })
          )
        );
      })
      .then(() => {
        console.log('✅ SW instalado correctamente');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error en instalación SW:', error);
      })
  );
});

// ============================================
// 🔄 ACTIVACIÓN - Compatible con todos los navegadores
// ============================================
self.addEventListener('activate', (event) => {
  console.log('🔄 Club Canino SW: Activando...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Tomar control inmediato
      self.clients.claim()
    ])
    .then(() => {
      console.log('✅ SW activado exitosamente');
      
      // Notificar clientes sin errors
      return notifyClients('SW_READY', 'Service Worker listo');
    })
    .catch((error) => {
      console.error('❌ Error en activación:', error);
    })
  );
});

// ============================================
// 🌐 FETCH - Estrategia Robusta para Safari/Chrome
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 🚫 IGNORAR requests problemáticos
  if (shouldIgnoreRequest(request)) {
    return;
  }
  
  // 🎯 ESTRATEGIA por tipo de request
  if (request.mode === 'navigate') {
    // Páginas HTML
    event.respondWith(handlePageRequest(request));
  } else if (isImageRequest(request)) {
    // Imágenes
    event.respondWith(handleImageRequest(request));
  } else if (isAssetRequest(request)) {
    // CSS, JS, fonts
    event.respondWith(handleAssetRequest(request));
  } else {
    // Otros requests - network first
    event.respondWith(handleNetworkFirst(request));
  }
});

// ============================================
// 🔍 UTILIDADES DE DETECCIÓN
// ============================================
function shouldIgnoreRequest(request) {
  const url = request.url;
  
  // Ignorar requests que causan problemas
  if (
    !url.startsWith('http') ||                    // Solo HTTP/HTTPS
    url.includes('chrome-extension://') ||        // Extensions
    url.includes('moz-extension://') ||           // Firefox extensions
    url.includes('safari-extension://') ||        // Safari extensions
    url.includes('_next/') ||                     // Next.js internals
    url.includes('hot-update') ||                 // Dev hot reload
    url.includes('analytics') ||                  // Analytics scripts
    request.method !== 'GET'                      // Solo GET requests
  ) {
    return true;
  }
  
  return false;
}

function isImageRequest(request) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?.*)?$/i.test(request.url);
}

function isAssetRequest(request) {
  return /\.(css|js|woff|woff2|ttf|eot)(\?.*)?$/i.test(request.url);
}

// ============================================
// 📄 ESTRATEGIAS DE CACHE SEGURAS
// ============================================

// 🏠 PÁGINAS - Network First con fallback robusto
async function handlePageRequest(request) {
  try {
    console.log('🏠 Página solicitada:', request.url);
    
    // Intentar red primero con timeout
    const networkResponse = await fetchWithTimeout(request, 3000);
    
    if (networkResponse && networkResponse.ok) {
      // Cachear respuesta válida
      const cache = await caches.open(CACHE_NAME);
      // Clonar para evitar body usado
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache).catch(err => {
        console.warn('⚠️ No se pudo cachear página:', err);
      });
      
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('📱 Red falló, usando cache:', request.url);
    
    // Buscar en cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback a página offline
    const offlineResponse = await cache.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Último recurso - respuesta básica
    return createOfflineResponse();
  }
}

// 🖼️ IMÁGENES - Cache First
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch desde red
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      // Cachear imagen
      cache.put(request, networkResponse.clone()).catch(err => {
        console.warn('⚠️ No se pudo cachear imagen:', err);
      });
      
      return networkResponse;
    }
    
    throw new Error('Network failed');
    
  } catch (error) {
    console.log('🖼️ Imagen no disponible:', request.url);
    
    // Imagen fallback
    return createImageFallback();
  }
}

// 📦 ASSETS - Cache First con update
async function handleAssetRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update en background
      fetch(request).then(response => {
        if (response && response.ok) {
          cache.put(request, response.clone()).catch(err => {
            console.warn('⚠️ Background update falló:', err);
          });
        }
      }).catch(() => {
        // Ignorar errores de background update
      });
      
      return cachedResponse;
    }
    
    // Primera vez - fetch desde red
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone()).catch(err => {
        console.warn('⚠️ No se pudo cachear asset:', err);
      });
      
      return networkResponse;
    }
    
    throw new Error('Asset not available');
    
  } catch (error) {
    console.log('📦 Asset no disponible:', request.url);
    
    // Fallback básico
    return createAssetFallback(request);
  }
}

// 🌐 NETWORK FIRST - Para APIs y content dinámico
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetchWithTimeout(request, 5000);
    
    if (networkResponse && networkResponse.ok) {
      return networkResponse;
    }
    
    throw new Error('Network failed');
    
  } catch (error) {
    // Buscar en cache como fallback
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No disponible offline
    return new Response('No disponible offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// ============================================
// 🛠️ UTILIDADES HELPER
// ============================================

// Fetch con timeout para evitar requests colgados
function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}

// Respuesta offline básica
function createOfflineResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sin Conexión - Club Canino</title>
      <style>
        body { 
          font-family: system-ui, sans-serif; 
          text-align: center; 
          padding: 50px 20px; 
          background: #FFFBF0;
        }
        h1 { color: #2C3E50; }
        button { 
          background: #56CCF2; 
          color: white; 
          border: none; 
          padding: 12px 24px; 
          border-radius: 8px; 
          cursor: pointer; 
        }
      </style>
    </head>
    <body>
      <h1>🐕 Sin Conexión</h1>
      <p>Club Canino no está disponible offline</p>
      <button onclick="window.location.reload()">🔄 Reintentar</button>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// Imagen fallback
function createImageFallback() {
  // SVG simple como fallback
  const fallbackSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#f3f4f6"/>
      <text x="100" y="100" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#6b7280">
        🐕 Sin imagen
      </text>
    </svg>
  `;
  
  return new Response(fallbackSVG, {
    status: 200,
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

// Asset fallback
function createAssetFallback(request) {
  const url = request.url;
  
  if (url.endsWith('.css')) {
    return new Response('/* Estilos no disponibles offline */', {
      status: 200,
      headers: { 'Content-Type': 'text/css' }
    });
  }
  
  if (url.endsWith('.js')) {
    return new Response('// Script no disponible offline', {
      status: 200,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
  
  return new Response('Asset no disponible', { 
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Notificar clientes de forma segura
async function notifyClients(type, message) {
  try {
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      try {
        client.postMessage({ type, message, timestamp: Date.now() });
      } catch (error) {
        console.warn('⚠️ Error enviando mensaje a cliente:', error);
      }
    });
    
  } catch (error) {
    console.warn('⚠️ Error obteniendo clientes:', error);
  }
}

// ============================================
// 🔔 NOTIFICACIONES PUSH - Safari Compatible
// ============================================
self.addEventListener('push', (event) => {
  console.log('📬 Push notification recibida');
  
  try {
    let notificationData = {
      title: 'Club Canino Dos Huellitas',
      body: 'Tienes una nueva actualización sobre tu mascota',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'club-canino-update',
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'Ver Dashboard'
        },
        {
          action: 'dismiss',
          title: 'Cerrar'
        }
      ]
    };
    
    // Parse data si existe
    if (event.data) {
      try {
        const data = event.data.json();
        notificationData = { ...notificationData, ...data };
      } catch (error) {
        console.warn('⚠️ Error parsing push data:', error);
      }
    }
    
    event.waitUntil(
      self.registration.showNotification(notificationData.title, notificationData)
    );
    
  } catch (error) {
    console.error('❌ Error showing notification:', error);
  }
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event.action);
  
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Si hay una ventana abierta, enfocarla
      if (clients.length > 0) {
        return clients[0].focus();
      }
      
      // Si no, abrir nueva ventana
      if (event.action === 'view' || !event.action) {
        return self.clients.openWindow('/app');
      }
    }).catch((error) => {
      console.error('❌ Error handling notification click:', error);
    })
  );
});

// ============================================
// 🧹 LIMPIEZA Y MANTENIMIENTO
// ============================================

// Mensaje de carga exitosa
console.log('🐕 Club Canino SW v1.3.0 - Compatible Safari/Chrome ✅');