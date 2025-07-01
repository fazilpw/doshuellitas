// netlify/functions/test-push.js
// 🧪 Endpoint para enviar notificaciones de prueba

const webpush = require('web-push');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Manejar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: ''
    };
  }

  try {
    const { userId } = JSON.parse(event.body);

    // Configurar VAPID
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:mbedoyarudas@gmail.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // Verificar que las VAPID keys estén configuradas
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      throw new Error('VAPID keys no configuradas en las variables de entorno');
    }

    // Mensajes de prueba realistas para Club Canino
    const testMessages = [
      {
        title: '🚐 Transporte en camino',
        body: 'Max será recogido en 15 minutos. ¡Prepáralo para salir!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: { 
          type: 'transport', 
          action: 'pickup',
          dogName: 'Max',
          eta: 15,
          timestamp: Date.now()
        }
      },
      {
        title: '💉 Recordatorio de vacuna',
        body: 'La vacuna de Max está programada para mañana a las 3:00 PM',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: { 
          type: 'vaccine', 
          action: 'reminder',
          dogName: 'Max',
          appointmentTime: '15:00',
          timestamp: Date.now()
        }
      },
      {
        title: '📊 Nueva evaluación disponible',
        body: 'El profesor Carlos completó la evaluación de Max. ¡Revísala ahora!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: { 
          type: 'evaluation', 
          action: 'new',
          dogName: 'Max',
          teacher: 'Carlos',
          timestamp: Date.now()
        }
      },
      {
        title: '🏠 Max llegó a casa',
        body: 'Max ha sido entregado exitosamente. ¡Que tengan un excelente día!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: { 
          type: 'transport', 
          action: 'delivered',
          dogName: 'Max',
          timestamp: Date.now()
        }
      },
      {
        title: '🎓 Tip de entrenamiento',
        body: 'Practica el comando "quieto" con Max por 5 minutos hoy. ¡Será muy efectivo!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: { 
          type: 'tip', 
          action: 'training',
          command: 'quieto',
          duration: 5,
          timestamp: Date.now()
        }
      }
    ];

    // Seleccionar mensaje aleatorio
    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];

    console.log(`🧪 Preparando notificación de prueba para usuario ${userId}:`, randomMessage.title);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: true,
        message: 'Notificación de prueba preparada exitosamente',
        notification: {
          title: randomMessage.title,
          body: randomMessage.body,
          type: randomMessage.data.type
        },
        info: 'En producción, esta notificación se enviaría a todos los dispositivos del usuario'
      })
    };

  } catch (error) {
    console.error('❌ Error en test-push:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        error: 'Error interno del servidor',
        details: error.message,
        info: 'Verifica que las VAPID keys estén configuradas en Netlify'
      })
    };
  }
};