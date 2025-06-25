// public/sw-notifications.js - SERVICE WORKER PARA NOTIFICACIONES DE RUTINAS
// Club Canino Dos Huellitas

const CACHE_NAME = 'club-canino-notifications-v1';
const NOTIFICATION_TAG_PREFIX = 'club-canino-';

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado para notificaciones');
  self.skipWaiting();
});

// Activar service worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activado para notificaciones');
  event.waitUntil(self.clients.claim());
});

// Escuchar mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SCHEDULE_ROUTINE_NOTIFICATIONS':
      scheduleRoutineNotifications(data);
      break;
      
    case 'SCHEDULE_VACCINE_REMINDER':
      scheduleVaccineReminder(data);
      break;
      
    case 'CANCEL_NOTIFICATION':
      cancelNotification(data.tag);
      break;
      
    case 'UPDATE_PREFERENCES':
      updateNotificationPreferences(data);
      break;
  }
});

// Programar notificaciones de rutinas
function scheduleRoutineNotifications(routines) {
  console.log('📅 Programando notificaciones para rutinas:', routines.length);
  
  routines.forEach(routine => {
    const {
      id,
      dogName,
      routineName,
      scheduledTime,
      reminderMinutes,
      dogId
    } = routine;
    
    // Calcular tiempo hasta la notificación
    const notificationTime = new Date(scheduledTime);
    notificationTime.setMinutes(notificationTime.getMinutes() - reminderMinutes);
    
    const now = new Date();
    const timeUntilNotification = notificationTime.getTime() - now.getTime();
    
    // Solo programar si es en el futuro
    if (timeUntilNotification > 0) {
      setTimeout(() => {
        showRoutineNotification({
          dogName,
          routineName,
          reminderMinutes,
          dogId,
          routineId: id
        });
      }, timeUntilNotification);
      
      console.log(`⏰ Notificación programada para ${dogName}: ${routineName} en ${Math.round(timeUntilNotification / 1000 / 60)} minutos`);
    }
  });
}

// Mostrar notificación de rutina
function showRoutineNotification({ dogName, routineName, reminderMinutes, dogId, routineId }) {
  const title = `🔔 Recordatorio de ${dogName}`;
  const body = reminderMinutes > 0 
    ? `${routineName} en ${reminderMinutes} minutos`
    : `¡Es hora! ${routineName}`;
    
  const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `${NOTIFICATION_TAG_PREFIX}routine-${routineId}`,
    vibrate: [200, 100, 200],
    data: {
      type: 'routine',
      dogId,
      routineId,
      dogName,
      routineName,
      timestamp: Date.now(),
      url: '/dashboard/rutinas'
    },
    actions: [
      {
        action: 'complete',
        title: '✅ Marcar como hecho',
        icon: '/icons/check-icon.png'
      },
      {
        action: 'snooze',
        title: '⏰ Recordar en 5 min',
        icon: '/icons/snooze-icon.png'
      },
      {
        action: 'view',
        title: '👁️ Ver rutinas',
        icon: '/icons/view-icon.png'
      }
    ],
    requireInteraction: true, // Mantener visible hasta que el usuario actúe
    silent: false
  };
  
  self.registration.showNotification(title, options);
}

// Programar recordatorio de vacuna
function scheduleVaccineReminder({ dogId, dogName, vaccineName, daysUntil, vaccineId }) {
  const title = `💉 Recordatorio de Vacuna - ${dogName}`;
  const body = daysUntil <= 1 
    ? `¡${vaccineName} vence HOY! Agenda cita urgente`
    : daysUntil <= 3
    ? `${vaccineName} vence en ${daysUntil} días`
    : `${vaccineName} vence en ${daysUntil} días - Programa tu cita`;
    
  const urgency = daysUntil <= 1 ? 'high' : daysUntil <= 7 ? 'normal' : 'low';
  
  const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `${NOTIFICATION_TAG_PREFIX}vaccine-${vaccineId}`,
    vibrate: daysUntil <= 1 ? [300, 100, 300, 100, 300] : [200, 100, 200],
    data: {
      type: 'vaccine',
      dogId,
      vaccineId,
      dogName,
      vaccineName,
      daysUntil,
      urgency,
      timestamp: Date.now(),
      url: '/dashboard/rutinas?tab=vaccines'
    },
    actions: [
      {
        action: 'schedule',
        title: '📅 Agendar cita',
        icon: '/icons/calendar-icon.png'
      },
      {
        action: 'applied',
        title: '✅ Ya aplicada',
        icon: '/icons/check-icon.png'
      },
      {
        action: 'remind_later',
        title: '⏰ Recordar mañana',
        icon: '/icons/snooze-icon.png'
      }
    ],
    requireInteraction: daysUntil <= 3, // Interacción requerida si es urgente
    silent: false
  };
  
  self.registration.showNotification(title, options);
}

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;
  
  console.log('🖱️ Click en notificación:', { action, data });
  
  notification.close();
  
  // Manejar diferentes acciones
  switch (action) {
    case 'complete':
      handleCompleteRoutine(data);
      break;
      
    case 'snooze':
      handleSnoozeRoutine(data);
      break;
      
    case 'schedule':
      openAppWithURL('/dashboard/rutinas?tab=vaccines&action=schedule');
      break;
      
    case 'applied':
      handleVaccineApplied(data);
      break;
      
    case 'remind_later':
      handleRemindLater(data);
      break;
      
    case 'view':
    default:
      // Abrir la app en la sección correcta
      const url = data.url || '/dashboard/rutinas';
      openAppWithURL(url);
      break;
  }
});

// Marcar rutina como completada
function handleCompleteRoutine(data) {
  // Enviar mensaje a la app principal para marcar como completada
  self.clients.matchAll().then(clients => {
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'ROUTINE_COMPLETED',
        data: {
          routineId: data.routineId,
          dogId: data.dogId,
          timestamp: Date.now()
        }
      });
    }
  });
  
  // Mostrar confirmación
  self.registration.showNotification(
    `✅ ${data.dogName} - Rutina Completada`,
    {
      body: `${data.routineName} marcada como realizada`,
      icon: '/icons/icon-192x192.png',
      tag: `${NOTIFICATION_TAG_PREFIX}completed-${data.routineId}`,
      vibrate: [100, 50, 100],
      data: { type: 'confirmation' },
      silent: false
    }
  );
}

// Posponer rutina 5 minutos
function handleSnoozeRoutine(data) {
  setTimeout(() => {
    showRoutineNotification({
      ...data,
      reminderMinutes: 0 // Mostrar sin tiempo adicional
    });
  }, 5 * 60 * 1000); // 5 minutos
  
  // Mostrar confirmación
  self.registration.showNotification(
    `⏰ ${data.dogName} - Recordatorio Pospuesto`,
    {
      body: `Te recordaremos ${data.routineName} en 5 minutos`,
      icon: '/icons/icon-192x192.png',
      tag: `${NOTIFICATION_TAG_PREFIX}snoozed-${data.routineId}`,
      vibrate: [100, 50, 100],
      data: { type: 'confirmation' },
      silent: false
    }
  );
}

// Marcar vacuna como aplicada
function handleVaccineApplied(data) {
  self.clients.matchAll().then(clients => {
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'VACCINE_APPLIED',
        data: {
          vaccineId: data.vaccineId,
          dogId: data.dogId,
          timestamp: Date.now()
        }
      });
    }
  });
  
  self.registration.showNotification(
    `✅ ${data.dogName} - Vacuna Actualizada`,
    {
      body: `${data.vaccineName} marcada como aplicada`,
      icon: '/icons/icon-192x192.png',
      tag: `${NOTIFICATION_TAG_PREFIX}vaccine-applied-${data.vaccineId}`,
      vibrate: [100, 50, 100],
      data: { type: 'confirmation' },
      silent: false
    }
  );
}

// Recordar vacuna más tarde
function handleRemindLater(data) {
  // Programar recordatorio para mañana
  setTimeout(() => {
    scheduleVaccineReminder({
      ...data,
      daysUntil: Math.max(data.daysUntil - 1, 0)
    });
  }, 24 * 60 * 60 * 1000); // 24 horas
  
  self.registration.showNotification(
    `📅 ${data.dogName} - Recordatorio Programado`,
    {
      body: `Te recordaremos sobre ${data.vaccineName} mañana`,
      icon: '/icons/icon-192x192.png',
      tag: `${NOTIFICATION_TAG_PREFIX}remind-later-${data.vaccineId}`,
      vibrate: [100, 50, 100],
      data: { type: 'confirmation' },
      silent: false
    }
  );
}

// Abrir la app en una URL específica
function openAppWithURL(url) {
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Buscar si ya hay una ventana abierta
      for (let client of clients) {
        if (client.url.includes('club-canino') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
}

// Cancelar notificación específica
function cancelNotification(tag) {
  self.registration.getNotifications({ tag }).then(notifications => {
    notifications.forEach(notification => notification.close());
  });
}

// Verificar permisos de notificación
function checkNotificationPermission() {
  return self.registration.pushManager.getSubscription()
    .then(subscription => {
      if (subscription) {
        console.log('✅ Usuario suscrito a notificaciones push');
        return true;
      } else {
        console.log('❌ Usuario no suscrito a notificaciones push');
        return false;
      }
    });
}

// Manejar notificaciones push desde el servidor (futuro)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const { type, payload } = data;
    
    switch (type) {
      case 'routine_reminder':
        event.waitUntil(
          showRoutineNotification(payload)
        );
        break;
        
      case 'vaccine_reminder':
        event.waitUntil(
          scheduleVaccineReminder(payload)
        );
        break;
        
      case 'transport_update':
        event.waitUntil(
          showTransportNotification(payload)
        );
        break;
        
      default:
        console.log('🤷‍♂️ Tipo de notificación desconocido:', type);
    }
  } catch (error) {
    console.error('❌ Error procesando notificación push:', error);
  }
});

// Notificación de transporte (para futuro GPS tracking)
function showTransportNotification({ dogName, message, eta, status }) {
  const title = `🚐 Transporte - ${dogName}`;
  
  const options = {
    body: message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `${NOTIFICATION_TAG_PREFIX}transport-${Date.now()}`,
    vibrate: [200, 100, 200],
    data: {
      type: 'transport',
      dogName,
      eta,
      status,
      timestamp: Date.now(),
      url: '/dashboard/tracking'
    },
    actions: status === 'arriving' ? [
      {
        action: 'track',
        title: '📍 Ver ubicación',
        icon: '/icons/location-icon.png'
      },
      {
        action: 'ready',
        title: '✅ Estoy listo',
        icon: '/icons/check-icon.png'
      }
    ] : [
      {
        action: 'track',
        title: '📍 Ver ruta',
        icon: '/icons/location-icon.png'
      }
    ],
    silent: false
  };
  
  self.registration.showNotification(title, options);
}

// Limpiar notificaciones antiguas (ejecutar periódicamente)
function cleanupOldNotifications() {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  self.registration.getNotifications().then(notifications => {
    notifications.forEach(notification => {
      if (notification.data && notification.data.timestamp < oneDayAgo) {
        notification.close();
      }
    });
  });
}

// Ejecutar limpieza cada 6 horas
setInterval(cleanupOldNotifications, 6 * 60 * 60 * 1000);

console.log('🎉 Service Worker de notificaciones cargado completamente');