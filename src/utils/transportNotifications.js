// Archivo: src/utils/transportNotifications.js
import { supabase } from '../config/supabase';

export const NOTIFICATION_TYPES = {
  ROUTE_STARTED: 'route_started',
  APPROACHING_PICKUP: 'approaching_pickup',
  DOG_PICKED_UP: 'dog_picked_up',
  ETA_UPDATE: 'eta_update',
  DELAY_ALERT: 'delay_alert',
  ROUTE_COMPLETED: 'route_completed'
};

export async function sendTransportNotification(type, data) {
  const notifications = {
    [NOTIFICATION_TYPES.ROUTE_STARTED]: {
      title: '🚐 Transporte en camino',
      message: `El vehículo salió del colegio. ETA estimado: ${data.eta} minutos`,
      icon: '/icons/transport-icon.png'
    },
    [NOTIFICATION_TYPES.APPROACHING_PICKUP]: {
      title: '📍 Transporte cerca',
      message: `El vehículo está a ${data.distance} minutos de tu casa`,
      icon: '/icons/location-icon.png'
    },
    [NOTIFICATION_TYPES.DOG_PICKED_UP]: {
      title: '✅ Recogida exitosa',
      message: `${data.dogName} ya está en el vehículo. ¡Que tenga buen día!`,
      icon: '/icons/success-icon.png'
    }
  };

  const notification = notifications[type];
  
  if (notification) {
    // Enviar push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: notification.icon,
        tag: `transport-${data.dogId || 'general'}`,
        vibrate: [200, 100, 200]
      });
    }

    // Guardar en base de datos para historial
    await supabase.from('notifications').insert({
      user_id: data.userId,
      type,
      title: notification.title,
      message: notification.message,
      data: data
    });
  }
}