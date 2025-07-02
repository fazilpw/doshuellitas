// public/sw.js
// 🔔 SERVICE WORKER CON PUSH NOTIFICATIONS REALES
// Version 3.0.0 - Club Canino Dos Huellitas

const CACHE_NAME = 'club-canino-v3.0.0';
const SW_VERSION = '3.0.0';

console.log(`🚀 Service Worker v${SW_VERSION} iniciando...`);

// ============================================
// 📦 RECURSOS PARA CACHE
// ============================================
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
];

// ============================================
// 🎯 INSTALACIÓN DEL SW
// ============================================
self.addEventListener('install', (event) => {
  console.log('📥 SW: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 SW: Cacheando recursos core...');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('✅ SW: Instalado exitosamente');
        self.skipWaiting(); // Activar inmediatamente
      })
      .catch((error) => {
        console.error('❌ SW: Error en instalación:', error);
      })
  );
});

// ============================================
// 🔄 ACTIVACIÓN DEL SW  
// ============================================
self.addEventListener('activate', (event) => {
  console.log('🔄 SW: Activando...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ SW: Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar control de todas las ventanas
      self.clients.claim()
    ])
    .then(() => {
      console.log('✅ SW: Activado y controlando todas las ventanas');
      
      // Notificar al cliente que estamos listos
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            data: { version: SW_VERSION }
          });
        });
      });
    })
  );
});

// ============================================
// 🔔 MANEJO DE PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
  console.log('🔔 SW: Push notification recibida');
  
  let notificationData = {
    title: '🐕 Club Canino Dos Huellitas',
    body: 'Nueva notificación disponible',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'club-canino-notification',
    requireInteraction: true,
    data: {}
  };
  
  // Procesar datos del push
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('📨 SW: Datos del push:', pushData);
      
      // Mergear con datos por defecto
      notificationData = {
        ...notificationData,
        ...pushData,
        data: pushData.data || {}
      };
      
    } catch (error) {
      console.error('❌ SW: Error parseando datos push:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }
  
  // Personalizar según el tipo de notificación
  if (notificationData.data.type) {
    notificationData = customizeNotificationByType(notificationData);
  }
  
  console.log('📢 SW: Mostrando notificación:', notificationData.title);
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: generateNotificationActions(notificationData.data.type),
      vibrate: [200, 100, 200, 100, 200],
      silent: false
    })
  );
});

// ============================================
// 🎨 PERSONALIZAR NOTIFICACIÓN POR TIPO
// ============================================
function customizeNotificationByType(notification) {
  const { type } = notification.data;
  
  switch (type) {
    case 'behavior_alert':
      return {
        ...notification,
        icon: '/icons/alert-icon.png',
        tag: 'behavior-alert',
        requireInteraction: true,
        data: {
          ...notification.data,
          url: '/dashboard/parent/',
          action: 'view_evaluation'
        }
      };
      
    case 'behavior_improvement':
      return {
        ...notification,
        icon: '/icons/success-icon.png',
        tag: 'behavior-improvement',
        requireInteraction: false,
        data: {
          ...notification.data,
          url: '/dashboard/parent/',
          action: 'view_progress'
        }
      };
      
    case 'transport_update':
      return {
        ...notification,
        icon: '/icons/transport-icon.png',
        tag: 'transport-update',
        requireInteraction: true,
        data: {
          ...notification.data,
          url: '/dashboard/parent/?page=tracking',
          action: 'track_transport'
        }
      };
      
    case 'medical_reminder':
      return {
        ...notification,
        icon: '/icons/medical-icon.png',
        tag: 'medical-reminder',
        requireInteraction: true,
        data: {
          ...notification.data,
          url: '/dashboard/parent/?page=salud',
          action: 'view_medical'
        }
      };
      
    default:
      return notification;
  }
}

// ============================================
// 🎮 GENERAR ACCIONES DE NOTIFICACIÓN
// ============================================
function generateNotificationActions(type) {
  const commonActions = [
    {
      action: 'open',
      title: '👀 Ver detalles'
    }
  ];
  
  switch (type) {
    case 'behavior_alert':
      return [
        {
          action: 'view_evaluation',
          title: '📊 Ver evaluación'
        },
        {
          action: 'dismiss',
          title: '✖️ Cerrar'
        }
      ];
      
    case 'transport_update':
      return [
        {
          action: 'track_transport',
          title: '📍 Seguir ruta'
        },
        {
          action: 'dismiss',
          title: '✖️ Cerrar'
        }
      ];
      
    case 'medical_reminder':
      return [
        {
          action: 'view_medical',
          title: '💊 Ver recordatorio'
        },
        {
          action: 'snooze',
          title: '⏰ Recordar después'
        }
      ];
      
    default:
      return commonActions;
  }
}

// ============================================
// 👆 MANEJO DE CLICKS EN NOTIFICACIONES
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('👆 SW: Click en notificación:', event.action);
  
  const notification = event.notification;
  const data = notification.data || {};
  
  // Cerrar la notificación
  notification.close();
  
  // Manejar acciones específicas
  let targetUrl = data.url || '/dashboard/parent/';
  
  switch (event.action) {
    case 'view_evaluation':
      targetUrl = '/dashboard/parent/?tab=evaluaciones';
      break;
      
    case 'track_transport':
      targetUrl = '/dashboard/parent/?page=tracking';
      break;
      
    case 'view_medical':
      targetUrl = '/dashboard/parent/?page=salud';
      break;
      
    case 'snooze':
      // Programar recordatorio en 1 hora
      scheduleSnoozeReminder(data);
      return; // No abrir ventana
      
    case 'dismiss':
      return; // Solo cerrar notificación
      
    default:
      // Acción 'open' o click principal
      break;
  }
  
  console.log('🌐 SW: Abriendo URL:', targetUrl);
  
  // Abrir o enfocar ventana de la app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar ventana existente de la app
        const existingClient = clientList.find((client) => {
          return client.url.includes(self.location.origin);
        });
        
        if (existingClient) {
          // Enfocar ventana existente y navegar
          return existingClient.focus().then(() => {
            return existingClient.navigate(targetUrl);
          });
        } else {
          // Abrir nueva ventana
          return clients.openWindow(targetUrl);
        }
      })
      .catch((error) => {
        console.error('❌ SW: Error manejando click:', error);
        // Fallback: abrir nueva ventana
        return clients.openWindow(targetUrl);
      })
  );
});

// ============================================
// ⏰ RECORDATORIO DIFERIDO
// ============================================
function scheduleSnoozeReminder(data) {
  console.log('⏰ SW: Programando recordatorio diferido...');
  
  // Mostrar notificación en 1 hora
  setTimeout(() => {
    self.registration.showNotification('🔔 Recordatorio médico', {
      body: `No olvides: ${data.reminderText || 'Atención médica pendiente'}`,
      icon: '/icons/medical-icon.png',
      tag: 'medical-snooze',
      requireInteraction: true,
      data: data
    });
  }, 60 * 60 * 1000); // 1 hora
}

// ============================================
// 📬 MANEJO DE MENSAJES DEL CLIENTE
// ============================================
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  console.log('📬 SW: Mensaje recibido:', type);
  
  switch (type) {
    case 'SKIP_WAITING':
      console.log('⏭️ SW: Saltando espera...');
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: SW_VERSION });
      break;
      
    case 'CLEAR_NOTIFICATIONS':
      // Limpiar todas las notificaciones
      self.registration.getNotifications().then((notifications) => {
        notifications.forEach((notification) => {
          notification.close();
        });
        console.log(`🧹 SW: ${notifications.length} notificaciones limpiadas`);
      });
      break;
      
    case 'TEST_NOTIFICATION':
      // Notificación de prueba
      self.registration.showNotification('🧪 Prueba de Notificación', {
        body: 'Esta es una notificación de prueba del Service Worker',
        icon: '/icon-192.png',
        tag: 'test-notification',
        requireInteraction: false,
        data: { type: 'test', url: '/dashboard/parent/' }
      });
      break;
      
    default:
      console.log('❓ SW: Tipo de mensaje desconocido:', type);
  }
});

// ============================================
// 🌐 ESTRATEGIA DE CACHE PARA REQUESTS
// ============================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Solo cachear requests de nuestro dominio
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Estrategia Network First para páginas dinámicas
  if (url.pathname.startsWith('/dashboard/') || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cachear respuestas exitosas
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback al cache si la red falla
          return caches.match(event.request);
        })
    );
  }
  // Estrategia Cache First para assets estáticos
  else if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
  }
});

// ============================================
// 🚨 MANEJO DE ERRORES GLOBAL
// ============================================
self.addEventListener('error', (event) => {
  console.error('🚨 SW: Error global:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 SW: Promise rechazada:', event.reason);
});

// ============================================
// 💗 MANTENER SW VIVO
// ============================================
self.addEventListener('sync', (event) => {
  console.log('🔄 SW: Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('🔄 SW: Ejecutando sincronización en background...');
  // Aquí puedes sincronizar datos pendientes
}

console.log(`✅ Service Worker v${SW_VERSION} listo para push notifications`);