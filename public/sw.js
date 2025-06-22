// public/sw.js - Service Worker para Club Canino Dos Huellitas
const CACHE_NAME = 'club-canino-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Recursos esenciales para cache inmediato
const CORE_ASSETS = [
  '/',
  '/offline.html',
  '/dashboard/padre',
  '/dashboard/profesor',
  '/login',
  '/_astro/base.css', // Ajustar según build de Astro
  '/logo.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Recursos para cache bajo demanda
const RUNTIME_CACHE = [
  '/servicios',
  '/instalaciones',
  '/contacto',
  '/preguntas-frecuentes',
  '/diagnostico'
];

// Estrategias de cache personalizadas
const CACHE_STRATEGIES = {
  // API calls - Network First (datos frescos prioritarios)
  api: {
    pattern: /\/api\/|supabase\.co/,
    strategy: 'networkFirst',
    cacheDuration: 5 * 60 * 1000 // 5 minutos
  },
  
  // Imágenes - Cache First (pueden ser viejas)
  images: {
    pattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
    strategy: 'cacheFirst',
    cacheDuration: 30 * 24 * 60 * 60 * 1000 // 30 días
  },
  
  // Fonts y CSS - Cache First (estáticos)
  static: {
    pattern: /\.(css|js|woff|woff2|ttf|eot)$/,
    strategy: 'cacheFirst',
    cacheDuration: 7 * 24 * 60 * 60 * 1000 // 7 días
  },
  
  // Páginas HTML - Stale While Revalidate (balance)
  pages: {
    pattern: /\/dashboard\/|\/login|\/$/,
    strategy: 'staleWhileRevalidate',
    cacheDuration: 24 * 60 * 60 * 1000 // 1 día
  }
};

// ============================================
// INSTALLATION - Instalar el Service Worker
// ============================================
self.addEventListener('install', (event) => {
  console.log('🚀 Club Canino SW: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 Club Canino SW: Cacheando recursos core...');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('✅ Club Canino SW: Instalación completada');
        // Activar inmediatamente sin esperar
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Club Canino SW: Error en instalación:', error);
      })
  );
});

// ============================================
// ACTIVATION - Activar y limpiar caches viejos
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
              console.log('🗑️ Club Canino SW: Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Tomar control inmediato de todos los clientes
      self.clients.claim()
    ])
    .then(() => {
      console.log('✅ Club Canino SW: Activación completada');
      
      // Notificar a todos los clientes que el SW está listo
      return self.clients.matchAll();
    })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          message: 'Club Canino está listo para usar offline! 🐕'
        });
      });
    })
    .catch((error) => {
      console.error('❌ Club Canino SW: Error en activación:', error);
    })
  );
});

// ============================================
// FETCH - Interceptar requests y aplicar estrategias
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar requests HTTP/HTTPS
  if (!request.url.startsWith('http')) return;
  
  // Estrategia especial para navegación (páginas HTML)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Aplicar estrategias según el tipo de recurso
  const strategy = getStrategy(request.url);
  event.respondWith(applyStrategy(request, strategy));
});

// ============================================
// ESTRATEGIAS DE CACHE
// ============================================

function getStrategy(url) {
  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(url)) {
      return { name, ...config };
    }
  }
  
  // Estrategia por defecto
  return {
    name: 'networkFirst',
    strategy: 'networkFirst',
    cacheDuration: 60 * 60 * 1000 // 1 hora
  };
}

async function applyStrategy(request, strategy) {
  const cache = await caches.open(CACHE_NAME);
  
  switch (strategy.strategy) {
    case 'cacheFirst':
      return cacheFirst(request, cache, strategy);
    
    case 'networkFirst':
      return networkFirst(request, cache, strategy);
    
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, cache, strategy);
    
    default:
      return networkFirst(request, cache, strategy);
  }
}

// Cache First - Para recursos estáticos
async function cacheFirst(request, cache, strategy) {
  try {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, strategy.cacheDuration)) {
      console.log('💾 Cache hit:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('🌐 Network + cached:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('🔄 Cache fallback:', request.url);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Recurso no disponible offline', { status: 503 });
  }
}

// Network First - Para datos dinámicos
async function networkFirst(request, cache, strategy) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('🌐 Network fresh:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('🔄 Cache fallback:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si es una página, mostrar página offline
    if (request.mode === 'navigate') {
      return cache.match(OFFLINE_URL);
    }
    
    return new Response('No disponible offline', { status: 503 });
  }
}

// Stale While Revalidate - Balance entre fresco y rápido
async function staleWhileRevalidate(request, cache, strategy) {
  const cachedResponse = cache.match(request);
  
  // Actualizar en background
  const networkUpdate = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        console.log('🔄 Background update:', request.url);
      }
      return response;
    })
    .catch(() => {
      console.log('🔄 Background update failed:', request.url);
    });
  
  // Devolver cache inmediatamente si existe
  const cached = await cachedResponse;
  if (cached) {
    console.log('⚡ Stale served:', request.url);
    return cached;
  }
  
  // Si no hay cache, esperar la red
  try {
    return await networkUpdate;
  } catch (error) {
    return new Response('No disponible', { status: 503 });
  }
}

// Manejo especial para navegación de páginas
async function handleNavigationRequest(request) {
  try {
    // Intentar red primero para páginas
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    // Fallback a cache o página offline
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Página offline como último recurso
    return cache.match(OFFLINE_URL) || new Response('Página no disponible offline', {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// ============================================
// NOTIFICACIONES PUSH
// ============================================
self.addEventListener('push', (event) => {
  console.log('📬 Club Canino SW: Push recibido');
  
  const options = {
    body: 'Tienes actualizaciones sobre tu peludito! 🐕',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/dashboard/padre',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'Ver Dashboard',
        icon: '/icons/action-view.png'
      },
      {
        action: 'photos',
        title: 'Ver Fotos',
        icon: '/icons/action-photos.png'
      }
    ],
    requireInteraction: false,
    silent: false,
    tag: 'club-canino-update'
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      options.body = pushData.body || options.body;
      options.title = pushData.title || 'Club Canino Dos Huellitas';
      options.data.url = pushData.url || options.data.url;
      options.data.dogName = pushData.dogName;
      options.data.type = pushData.type;
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Club Canino Dos Huellitas', options)
  );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Club Canino SW: Notification click');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard/padre';
  
  // Determinar acción según el botón presionado
  if (event.action === 'photos') {
    urlToOpen = '/dashboard/padre?tab=fotos';
  } else if (event.action === 'view') {
    urlToOpen = '/dashboard/padre';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar ventana existente
        for (const client of clientList) {
          if (client.url.includes('club') && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        
        // Abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// BACKGROUND SYNC - Sincronización offline
// ============================================
self.addEventListener('sync', (event) => {
  console.log('🔄 Club Canino SW: Background sync:', event.tag);
  
  if (event.tag === 'sync-evaluations') {
    event.waitUntil(syncOfflineEvaluations());
  }
  
  if (event.tag === 'sync-photos') {
    event.waitUntil(syncOfflinePhotos());
  }
});

async function syncOfflineEvaluations() {
  try {
    console.log('📊 Sincronizando evaluaciones offline...');
    
    // Aquí se sincronizarían las evaluaciones guardadas offline
    // Por ahora, solo notificar que se intentó
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: 'evaluations'
      });
    });
    
  } catch (error) {
    console.error('Error sincronizando evaluaciones:', error);
  }
}

async function syncOfflinePhotos() {
  try {
    console.log('📸 Sincronizando fotos offline...');
    
    // Aquí se sincronizarían las fotos guardadas offline
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE', 
        data: 'photos'
      });
    });
    
  } catch (error) {
    console.error('Error sincronizando fotos:', error);
  }
}

// ============================================
// UTILIDADES
// ============================================

function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const date = new Date(dateHeader);
  return (Date.now() - date.getTime()) > maxAge;
}

// Limpiar cache periódicamente
setInterval(() => {
  console.log('🧹 Club Canino SW: Limpieza periódica de cache...');
  
  caches.open(CACHE_NAME).then((cache) => {
    cache.keys().then((requests) => {
      requests.forEach((request) => {
        cache.match(request).then((response) => {
          if (response && isExpired(response, 7 * 24 * 60 * 60 * 1000)) {
            cache.delete(request);
            console.log('🗑️ Cache expirado eliminado:', request.url);
          }
        });
      });
    });
  });
}, 24 * 60 * 60 * 1000); // Cada 24 horas

console.log('🐕 Club Canino Dos Huellitas - Service Worker cargado exitosamente!');