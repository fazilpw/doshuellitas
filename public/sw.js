// public/sw.js - Service Worker Completo Club Canino Dos Huellitas
const CACHE_NAME = 'club-canino-v1.2.0';
const OFFLINE_URL = '/offline';
const FALLBACK_IMAGE = '/icons/fallback-image.png';

// 🎯 RECURSOS ESENCIALES - Cache inmediato en instalación
const CORE_ASSETS = [
  '/',
  '/app',
  '/offline',
  '/login',
  '/dashboard/padre',
  '/dashboard/profesor', 
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/logo.svg'
];

// 📱 ESTRATEGIAS DE CACHE PERSONALIZADAS
const CACHE_STRATEGIES = {
  // 🌐 API - Network First (datos frescos prioritarios)
  api: {
    pattern: /\/api\/|supabase\.co|clubcanino/,
    strategy: 'networkFirst',
    timeout: 5000,
    cacheDuration: 5 * 60 * 1000 // 5 minutos
  },
  
  // 🖼️ Imágenes - Cache First (pueden ser viejas)
  images: {
    pattern: /\.(png|jpg|jpeg|svg|gif|webp|ico|avif)$/,
    strategy: 'cacheFirst',
    cacheDuration: 30 * 24 * 60 * 60 * 1000 // 30 días
  },
  
  // 📄 Assets estáticos - Cache First 
  static: {
    pattern: /\.(css|js|woff|woff2|ttf|eot)$/,
    strategy: 'cacheFirst', 
    cacheDuration: 7 * 24 * 60 * 60 * 1000 // 7 días
  },
  
  // 🏠 Páginas HTML - Stale While Revalidate
  pages: {
    pattern: /\/dashboard\/|\/login|\/app|\/$/,
    strategy: 'staleWhileRevalidate',
    cacheDuration: 24 * 60 * 60 * 1000 // 1 día
  }
};

// ============================================
// 🚀 INSTALACIÓN
// ============================================
self.addEventListener('install', (event) => {
  console.log('🐕 Club Canino SW: Instalando v' + CACHE_NAME.split('-v')[1]);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 Cacheando recursos esenciales...');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('✅ Instalación completada - Activando inmediatamente');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error en instalación:', error);
      })
  );
});

// ============================================
// 🔄 ACTIVACIÓN
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
      console.log('✅ Activación completada');
      return notifyClients('SW_ACTIVATED', 'Club Canino listo para usar offline! 🐕');
    })
  );
});

// ============================================
// 🌐 MANEJO DE REQUESTS - Estrategias Inteligentes
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests no-HTTP
  if (!request.url.startsWith('http')) return;
  
  // Determinar estrategia basada en el tipo de recurso
  let strategy = determineStrategy(request);
  
  event.respondWith(
    executeStrategy(request, strategy)
      .catch(() => handleOfflineFallback(request))
  );
});

// ============================================
// 📋 ESTRATEGIAS DE CACHE
// ============================================

function determineStrategy(request) {
  const url = request.url;
  
  // API calls
  if (CACHE_STRATEGIES.api.pattern.test(url)) {
    return { ...CACHE_STRATEGIES.api, name: 'networkFirst' };
  }
  
  // Imágenes
  if (CACHE_STRATEGIES.images.pattern.test(url)) {
    return { ...CACHE_STRATEGIES.images, name: 'cacheFirst' };
  }
  
  // Assets estáticos
  if (CACHE_STRATEGIES.static.pattern.test(url)) {
    return { ...CACHE_STRATEGIES.static, name: 'cacheFirst' };
  }
  
  // Páginas HTML
  if (request.mode === 'navigate' || CACHE_STRATEGIES.pages.pattern.test(url)) {
    return { ...CACHE_STRATEGIES.pages, name: 'staleWhileRevalidate' };
  }
  
  // Default: Network First
  return { name: 'networkFirst', timeout: 3000, cacheDuration: 5 * 60 * 1000 };
}

async function executeStrategy(request, strategy) {
  switch (strategy.name) {
    case 'cacheFirst':
      return cacheFirst(request, strategy);
    case 'networkFirst':
      return networkFirst(request, strategy);
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, strategy);
    default:
      return fetch(request);
  }
}

// 💾 Cache First - Para recursos estáticos
async function cacheFirst(request, strategy) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached && !isExpired(cached, strategy.cacheDuration)) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cached || handleOfflineFallback(request);
  }
}

// 🌐 Network First - Para datos dinámicos
async function networkFirst(request, strategy) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), strategy.timeout || 5000)
    );
    
    const response = await Promise.race([fetch(request), timeoutPromise]);
    
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.log('🔄 Network failed, using cache:', request.url);
    const cached = await cache.match(request);
    return cached || handleOfflineFallback(request);
  }
}

// 🔄 Stale While Revalidate - Para páginas
async function staleWhileRevalidate(request, strategy) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  // Siempre intentar actualizar en background
  const fetchPromise = fetch(request).then((response) => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Devolver cache inmediatamente si existe
  return cached || await fetchPromise || handleOfflineFallback(request);
}

// ============================================
// 🚫 FALLBACKS OFFLINE
// ============================================
async function handleOfflineFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Página HTML - mostrar página offline
  if (request.mode === 'navigate') {
    return cache.match(OFFLINE_URL) || 
           cache.match('/') || 
           new Response('Offline - Club Canino no disponible', { status: 503 });
  }
  
  // Imágenes - mostrar imagen fallback
  if (request.destination === 'image') {
    return cache.match(FALLBACK_IMAGE) ||
           new Response(generateFallbackSVG(), {
             headers: { 'Content-Type': 'image/svg+xml' }
           });
  }
  
  // CSS/JS - respuesta mínima
  if (request.url.endsWith('.css')) {
    return new Response('/* Offline - Estilos no disponibles */', {
      headers: { 'Content-Type': 'text/css' }
    });
  }
  
  if (request.url.endsWith('.js')) {
    return new Response('// Offline - Script no disponible', {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
  
  return new Response('Offline', { status: 503 });
}

// ============================================
// 🔔 NOTIFICACIONES PUSH
// ============================================
self.addEventListener('push', (event) => {
  console.log('📱 Push recibido:', event);
  
  const options = {
    body: 'Nueva actualización de tu mascota',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Dashboard',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close', 
        title: 'Cerrar',
        icon: '/icons/action-close.png'
      }
    ],
    requireInteraction: true,
    tag: 'club-canino-update'
  };

  if (event.data) {
    const data = event.data.json();
    options.title = data.title || 'Club Canino Dos Huellitas';
    options.body = data.body || options.body;
    options.icon = data.icon || options.icon;
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(
    self.registration.showNotification('Club Canino Dos Huellitas', options)
  );
});

