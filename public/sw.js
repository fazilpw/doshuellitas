// public/sw.js - Service Worker para PWA + Push Notifications
// 🎯 Objetivo: Caching inteligente + Push notifications funcionales

const CACHE_VERSION = 'club-canino-push-v1.0.0';
const STATIC_CACHE = 'club-canino-static-v1';
const RUNTIME_CACHE = 'club-canino-runtime-v1';

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
  // Página principal
  /^https:\/\/[^\/]+\/$/, 
];

// ============================================
// 📦 INSTALACIÓN DEL SW
// ============================================
self.addEventListener('install', (event) => {
  console.log('🔧 SW Club Canino: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('📦 Cache estático abierto');
      // Pre-cachear recursos críticos mínimos
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png'
      ]).catch((error) => {
        console.warn('⚠️ Error pre-cacheando recursos:', error);
        // No fallar la instalación por esto
      });
    })
  );
  
  // Activar inmediatamente
  self.skipWaiting();
});

// ============================================
// 🚀 ACTIVACIÓN DEL SW
// ============================================
self.addEventListener('activate', (event) => {
  console.log('🚀 SW Club Canino: Activando...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE) {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Tomar control inmediato
      self.clients.claim()
    ])
  );
  
  console.log('✅ SW Club Canino: Activo y listo para push notifications');
  
  // Notificar al cliente que el SW está listo
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SW_ACTIVATED',
        data: { version: CACHE_VERSION }
      });
    });
  });
});

// ============================================
// 🌐 INTERCEPCIÓN DE REQUESTS (Caching)
// ============================================
self.addEventListener('fetch', (event) => {
  // Solo manejar requests GET
  if (event.request.method !== 'GET') return;
  
  const url = event.request.url;
  
  // Nunca cachear estos recursos
  if (NEVER_CACHE.some(pattern => pattern.test(url))) {
    return; // Ir directo a la red
  }
  
  // Solo cachear recursos seguros
  if (SAFE_TO_CACHE.some(pattern => pattern.test(url))) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            console.log('📦 Cache hit:', url);
            return response;
          }
          
          // Fetch y cachear
          return fetch(event.request).then((response) => {
            // Solo cachear respuestas exitosas
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
  }
});

// ============================================
// 🔔 PUSH NOTIFICATIONS - EVENTO PRINCIPAL
// ============================================
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification recibida:', event);
  
  let notificationData = {};
  
  try {
    // Intentar parsear datos del push
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    console.warn('⚠️ Error parseando datos push:', error);
    // Usar datos por defecto
    notificationData = {
      title: '🐕 Club Canino Dos Huellitas',
      body: 'Nueva notificación disponible',
      icon: '/icons/icon-192x192.png'
    };
  }
  
  // Configuración por defecto de notificación
  const notificationOptions = {
    body: notificationData.body || 'Tienes una nueva actualización',
    icon: notificationData.icon || '/icons/icon-192x192.png',
    badge: notificationData.badge || '/icons/badge-72x72.png',
    tag: notificationData.tag || 'club-canino-notification',
    data: notificationData.data || {},
    
    // Configuraciones avanzadas
    requireInteraction: true, // La notificación permanece hasta que el usuario interactúe
    vibrate: [100, 50, 100], // Patrón de vibración
    
    // Acciones disponibles en la notificación
    actions: [
      {
        action: 'view',
        title: '👀 Ver detalles',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: '❌ Descartar',
        icon: '/icons/dismiss-icon.png'
      }
    ]
  };
  
  // Personalización según tipo de notificación
  if (notificationData.data && notificationData.data.type) {
    switch (notificationData.data.type) {
      case 'transport':
        notificationOptions.requireInteraction = true;
        notificationOptions.tag = 'transport-update';
        break;
      case 'evaluation':
        notificationOptions.tag = 'evaluation-new';
        break;
      case 'vaccine':
        notificationOptions.requireInteraction = true;
        notificationOptions.tag = 'vaccine-reminder';
        break;
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || '🐕 Club Canino',
      notificationOptions
    ).then(() => {
      console.log('✅ Notificación mostrada:', notificationData.title);
    }).catch((error) => {
      console.error('❌ Error mostrando notificación:', error);
    })
  );
});

// ============================================
// 👆 CLICK EN NOTIFICACIÓN
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notificación clickeada:', event.notification.tag, event.action);
  
  event.notification.close();
  
  let url = '/dashboard/';
  
  // Determinar URL según el tipo de notificación
  if (event.notification.data) {
    switch (event.notification.data.type) {
      case 'transport':
        url = '/dashboard/tracking/';
        break;
      case 'evaluation':
        url = '/dashboard/evaluaciones/';
        break;
      case 'vaccine':
        url = '/dashboard/recordatorios/';
        break;
    }
  }
  
  // Manejar acciones específicas
  if (event.action === 'dismiss') {
    console.log('🗑️ Notificación descartada');
    return;
  }
  
  // Abrir la app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Buscar si ya hay una ventana abierta
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          console.log('🔄 Enfocando ventana existente');
          return client.focus();
        }
      }
      
      // Si no hay ventana abierta, abrir nueva
      if (clients.openWindow) {
        console.log('🆕 Abriendo nueva ventana:', url);
        return clients.openWindow(url);
      }
    })
  );
});

// ============================================
// 🔕 CERRAR NOTIFICACIÓN
// ============================================
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notificación cerrada:', event.notification.tag);
  
  // Opcional: Analytics de notificaciones cerradas
  // trackNotificationClose(event.notification.data);
});

// ============================================
// 📨 MENSAJES DEL CLIENTE
// ============================================
self.addEventListener('message', (event) => {
  console.log('📨 Mensaje recibido en SW:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
    case 'CLEAR_CACHE':
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

// ============================================
// 🚫 ERROR HANDLING
// ============================================
self.addEventListener('error', (event) => {
  console.error('❌ Error en SW:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rechazada en SW:', event.reason);
});

console.log('🔧 Club Canino SW: Script cargado y listo para push notifications');