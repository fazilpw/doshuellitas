// netlify/functions/send-push-notification.js
// 🚀 FUNCIÓN DE BACKEND PARA ENVIAR PUSH NOTIFICATIONS REALES

const { createClient } = require('@supabase/supabase-js');

// ============================================
// 🔧 CONFIGURACIÓN
// ============================================

// Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// VAPID Keys (configurar en Netlify Environment Variables)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:clubcaninodoshuellitas@gmail.com';

// Headers requeridos para CORS
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// ============================================
// 🎯 FUNCIÓN PRINCIPAL
// ============================================
exports.handler = async (event, context) => {
  console.log('🚀 Función send-push-notification iniciada');
  
  // Manejar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS OK' })
    };
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    // Validar configuración
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuración de Supabase faltante');
    }

    if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
      console.warn('⚠️ VAPID keys no configuradas, usando modo de prueba');
    }

    // Parsear datos del request
    const requestData = JSON.parse(event.body || '{}');
    const { userId, notification, targetUsers, notificationType } = requestData;

    console.log('📨 Datos recibidos:', {
      userId,
      hasNotification: !!notification,
      targetUsers: targetUsers?.length || 0,
      type: notificationType
    });

    // Enviar según el tipo de request
    let result;
    
    if (targetUsers && targetUsers.length > 0) {
      // Envío masivo a múltiples usuarios
      result = await sendBulkPushNotifications(targetUsers, notification);
    } else if (userId) {
      // Envío a un usuario específico
      result = await sendPushNotificationToUser(userId, notification);
    } else {
      throw new Error('Faltan parámetros: userId o targetUsers requeridos');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Error en función push:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// ============================================
// 📤 ENVIAR A UN USUARIO ESPECÍFICO
// ============================================
async function sendPushNotificationToUser(userId, notification) {
  console.log(`📤 Enviando push a usuario: ${userId}`);
  
  try {
    // Obtener suscripciones activas del usuario
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      console.log('📭 No hay suscripciones activas para el usuario');
      return {
        sent: 0,
        failed: 0,
        message: 'Usuario no tiene suscripciones activas'
      };
    }

    console.log(`📬 Encontradas ${subscriptions.length} suscripciones activas`);

    // Enviar a todas las suscripciones del usuario
    const results = await Promise.allSettled(
      subscriptions.map(subscription => 
        sendPushToSubscription(subscription, notification)
      )
    );

    // Contar resultados
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Log errores
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ Error suscripción ${index}:`, result.reason);
      }
    });

    return {
      sent,
      failed,
      totalSubscriptions: subscriptions.length,
      message: `Enviadas ${sent} de ${subscriptions.length} notificaciones`
    };

  } catch (error) {
    console.error('❌ Error enviando a usuario:', error);
    throw error;
  }
}

// ============================================
// 📤 ENVÍO MASIVO A MÚLTIPLES USUARIOS
// ============================================
async function sendBulkPushNotifications(userIds, notification) {
  console.log(`📤 Enviando push masivo a ${userIds.length} usuarios`);
  
  try {
    // Obtener todas las suscripciones de los usuarios
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)
      .eq('active', true);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return {
        sent: 0,
        failed: 0,
        message: 'No hay suscripciones activas para los usuarios objetivo'
      };
    }

    console.log(`📬 Enviando a ${subscriptions.length} suscripciones`);

    // Enviar en lotes para evitar sobrecargar
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      batches.push(subscriptions.slice(i, i + batchSize));
    }

    let totalSent = 0;
    let totalFailed = 0;

    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map(subscription => 
          sendPushToSubscription(subscription, notification)
        )
      );

      const sent = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      totalSent += sent;
      totalFailed += failed;

      // Pausa pequeña entre lotes
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      sent: totalSent,
      failed: totalFailed,
      totalSubscriptions: subscriptions.length,
      message: `Enviadas ${totalSent} de ${subscriptions.length} notificaciones`
    };

  } catch (error) {
    console.error('❌ Error en envío masivo:', error);
    throw error;
  }
}

// ============================================
// 📲 ENVIAR A UNA SUSCRIPCIÓN ESPECÍFICA
// ============================================
async function sendPushToSubscription(subscription, notification) {
  try {
    console.log('📲 Enviando a endpoint:', subscription.endpoint.slice(-20) + '...');

    // Si no hay VAPID keys configuradas, simular envío
    if (!VAPID_PRIVATE_KEY) {
      console.log('🧪 Modo simulación - VAPID keys no configuradas');
      await new Promise(resolve => setTimeout(resolve, 100)); // Simular delay
      return { success: true, simulated: true };
    }

    // Preparar payload
    const payload = JSON.stringify({
      title: notification.title || '🐕 Club Canino',
      body: notification.body || 'Nueva notificación disponible',
      icon: notification.icon || '/icon-192.png',
      badge: notification.badge || '/badge-72.png',
      tag: notification.tag || 'club-canino-notification',
      data: notification.data || {},
      requireInteraction: notification.requireInteraction || false,
      actions: notification.actions || []
    });

    // Configurar web-push (si está disponible)
    if (typeof require !== 'undefined') {
      try {
        const webpush = require('web-push');
        
        webpush.setVapidDetails(
          VAPID_SUBJECT,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY
        );

        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        await webpush.sendNotification(pushSubscription, payload);
        console.log('✅ Push enviado con web-push');
        
        return { success: true, method: 'web-push' };

      } catch (webpushError) {
        console.warn('⚠️ web-push no disponible, usando fetch:', webpushError.message);
      }
    }

    // Fallback: envío manual con fetch
    const response = await sendPushWithFetch(subscription, payload);
    
    if (response.ok) {
      console.log('✅ Push enviado con fetch');
      return { success: true, method: 'fetch' };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

  } catch (error) {
    console.error('❌ Error enviando push a suscripción:', error);
    
    // Si la suscripción es inválida, marcarla como inactiva
    if (error.statusCode === 410 || error.message.includes('410')) {
      await markSubscriptionInactive(subscription.id);
    }
    
    throw error;
  }
}

// ============================================
// 🌐 ENVÍO MANUAL CON FETCH
// ============================================
async function sendPushWithFetch(subscription, payload) {
  // Implementación simplificada para demostración
  // En producción, necesitarías implementar toda la especificación Web Push
  
  console.log('🌐 Enviando con fetch (modo básico)');
  
  const headers = {
    'Content-Type': 'application/json',
    'TTL': '86400' // 24 horas
  };

  // Si hay VAPID, agregar autorización
  if (VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY) {
    headers['Authorization'] = generateVapidAuthHeader(subscription.endpoint);
  }

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers,
    body: payload
  });

  return response;
}

// ============================================
// 🔐 GENERAR HEADER DE AUTORIZACIÓN VAPID
// ============================================
function generateVapidAuthHeader(endpoint) {
  // Implementación simplificada
  // En producción, necesitarías generar JWT VAPID correctamente
  
  const urlParts = new URL(endpoint);
  const audience = `${urlParts.protocol}//${urlParts.host}`;
  
  // Por ahora, retornar header básico
  return `vapid t=dummy_token,k=${VAPID_PUBLIC_KEY}`;
}

// ============================================
// 🗑️ MARCAR SUSCRIPCIÓN COMO INACTIVA
// ============================================
async function markSubscriptionInactive(subscriptionId) {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', subscriptionId);

    if (error) throw error;
    
    console.log(`🗑️ Suscripción ${subscriptionId} marcada como inactiva`);
    
  } catch (error) {
    console.error('❌ Error marcando suscripción inactiva:', error);
  }
}

// ============================================
// 🔧 FUNCIONES HELPER EXPORTADAS
// ============================================

// Función para enviar notificación de evaluación automática
exports.sendEvaluationNotification = async (userId, dogName, evaluationData) => {
  const notification = {
    title: `📊 Nueva Evaluación - ${dogName}`,
    body: `Se ha completado una nueva evaluación de ${dogName}. ¡Revisa los resultados!`,
    icon: '/icon-192.png',
    data: {
      type: 'evaluation_completed',
      dogName,
      evaluationId: evaluationData.id,
      url: '/dashboard/parent/?tab=evaluaciones'
    },
    requireInteraction: true
  };

  return sendPushNotificationToUser(userId, notification);
};

// Función para notificaciones de comportamiento
exports.sendBehaviorAlert = async (userId, dogName, alertType, message) => {
  const icons = {
    anxiety: '/icons/alert-icon.png',
    obedience: '/icons/training-icon.png',
    energy: '/icons/energy-icon.png',
    improvement: '/icons/success-icon.png'
  };

  const notification = {
    title: `🚨 Alerta de Comportamiento - ${dogName}`,
    body: message,
    icon: icons[alertType] || '/icon-192.png',
    data: {
      type: 'behavior_alert',
      alertType,
      dogName,
      url: '/dashboard/parent/'
    },
    requireInteraction: true
  };

  return sendPushNotificationToUser(userId, notification);
};

console.log('✅ Función send-push-notification cargada');