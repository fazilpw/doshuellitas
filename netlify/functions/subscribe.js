// netlify/functions/subscribe.js
// 🔔 Endpoint para suscribir usuarios a push notifications

const webpush = require('web-push');

exports.handler = async (event, context) => {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { subscription, userId, userRole, deviceInfo } = JSON.parse(event.body);

    // Configurar VAPID
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // Validar suscripción
    if (!subscription || !subscription.endpoint) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ error: 'Suscripción inválida' })
      };
    }

    console.log('✅ Suscripción guardada:', {
      userId,
      userRole,
      endpoint: subscription.endpoint,
      timestamp: new Date().toISOString()
    });

    // Enviar notificación de bienvenida
    const welcomePayload = JSON.stringify({
      title: '🐕 ¡Bienvenido al Club Canino!',
      body: 'Notificaciones activadas. Te mantendremos informado sobre tu mascota.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'welcome',
        timestamp: Date.now()
      }
    });

    await webpush.sendNotification(subscription, welcomePayload);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: true,
        message: 'Suscripción exitosa y notificación de bienvenida enviada'
      })
    };

  } catch (error) {
    console.error('❌ Error en subscribe:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        error: 'Error interno del servidor',
        details: error.message
      })
    };
  }
};


// ============================================
// netlify/functions/test-push.js
// 🧪 Endpoint para enviar notificaciones de prueba
// ============================================

// const webpush = require('web-push');

// exports.handler = async (event, context) => {
//   if (event.httpMethod !== 'POST') {
//     return {
//       statusCode: 405,
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Headers': 'Content-Type',
//       },
//       body: JSON.stringify({ error: 'Method not allowed' })
//     };
//   }

//   try {
//     const { userId } = JSON.parse(event.body);

//     // Configurar VAPID
//     webpush.setVapidDetails(
//       process.env.VAPID_SUBJECT,
//       process.env.VAPID_PUBLIC_KEY,
//       process.env.VAPID_PRIVATE_KEY
//     );

//     // Aquí buscarías las suscripciones del usuario en Supabase
//     // const { data: subscriptions } = await supabase
//     //   .from('push_subscriptions')
//     //   .select('subscription')
//     //   .eq('user_id', userId);

//     // Por ahora, enviamos mensajes de prueba predefinidos
//     const testMessages = [
//       {
//         title: '🚐 Transporte en camino',
//         body: 'Max será recogido en 15 minutos. ¡Prepáralo para salir!',
//         icon: '/icons/icon-192x192.png',
//         data: { type: 'transport', action: 'pickup' }
//       },
//       {
//         title: '💉 Recordatorio de vacuna',
//         body: 'La vacuna de Max está programada para mañana a las 3:00 PM',
//         icon: '/icons/icon-192x192.png',
//         data: { type: 'vaccine', action: 'reminder' }
//       },
//       {
//         title: '📊 Nueva evaluación disponible',
//         body: 'El profesor Carlos completó la evaluación de Max. ¡Revísala ahora!',
//         icon: '/icons/icon-192x192.png',
//         data: { type: 'evaluation', action: 'new' }
//       }
//     ];

//     const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];

//     console.log('🧪 Enviando notificación de prueba:', randomMessage.title);

//     return {
//       statusCode: 200,
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Headers': 'Content-Type',
//       },
//       body: JSON.stringify({
//         success: true,
//         message: 'Notificación de prueba programada',
//         notification: randomMessage
//       })
//     };

//   } catch (error) {
//     console.error('❌ Error en test-push:', error);
    
//     return {
//       statusCode: 500,
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Headers': 'Content-Type',
//       },
//       body: JSON.stringify({
//         error: 'Error interno del servidor',
//         details: error.message
//       })
//     };
//   }
// };