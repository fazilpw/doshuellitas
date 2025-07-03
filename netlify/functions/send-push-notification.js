// netlify/functions/send-push-notification.js
// 🚀 FUNCIÓN DE BACKEND PARA ENVIAR PUSH NOTIFICATIONS REALES - CORREGIDA

const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push'); // 🔧 AGREGADA: Importación directa

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
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'VAPID keys no configuradas',
          mode: 'test' 
        })
      };
    }

    // 🔧 CONFIGURAR VAPID INMEDIATAMENTE
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    // Parsear datos del request
    const requestData = JSON.parse(event.body || '{}');
    const { userId, notification, targetUsers, notificationType } = requestData;

    console.log('📨 Datos recibidos:', {
      userId,
      hasNotification: !!notification,
      notificationType,
      targetUsers: targetUsers?.length || 0
    });

    // Determinar a quién enviar las notificaciones
    let targetUserIds = [];
    if (targetUsers && Array.isArray(targetUsers)) {
      targetUserIds = targetUsers;
    } else if (userId) {
      targetUserIds = [userId];
    } else {
      throw new Error('No se especificaron usuarios objetivo');
    }

    console.log(`📤 Enviando notificación a ${targetUserIds.length} usuario(s)`);

    // Enviar notificaciones a todos los usuarios objetivo
    const results = await Promise.allSettled(
      targetUserIds.map(id => sendPushNotificationToUser(id, notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Resultados: ${successful} enviadas, ${failed} fallidas`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results: {
          sent: successful,
          failed: failed,
          total: targetUserIds.length
        },
        message: `Notificaciones enviadas: ${successful}/${targetUserIds.length}`
      })
    };

  } catch (error) {
    console.error('❌ Error en send-push-notification:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      })
    };
  }
};

// ============================================
// 📤 ENVIAR NOTIFICACIÓN A UN USUARIO
// ============================================
async function sendPushNotificationToUser(userId, notification) {
  try {
    console.log(`📲 Enviando notificación a usuario ${userId}`);

    // Obtener las suscripciones activas del usuario
    const { data: subscriptions, error: dbError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh_key, auth_key, device_type, browser_name')
      .eq('user_id', userId)
      .eq('active', true);

    if (dbError) {
      throw new Error(`Error BD: ${dbError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`⚠️ No hay suscripciones activas para usuario ${userId}`);
      return { success: false, error: 'No hay suscripciones activas' };
    }

    console.log(`📱 Encontradas ${subscriptions.length} suscripciones para usuario ${userId}`);

    // Enviar a todas las suscripciones del usuario
    const results = await Promise.allSettled(
      subscriptions.map(subscription => sendPushToSubscription(subscription, notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Usuario ${userId}: ${successful} enviadas, ${failed} fallidas`);

    return {
      success: true,
      sent: successful,
      failed: failed,
      totalSubscriptions: subscriptions.length
    };

  } catch (error) {
    console.error(`❌ Error enviando a usuario ${userId}:`, error);
    throw error;
  }
}

// ============================================
// 📲 ENVIAR A UNA SUSCRIPCIÓN ESPECÍFICA
// ============================================
async function sendPushToSubscription(subscription, notification) {
  try {
    console.log('📲 Enviando a endpoint:', subscription.endpoint.slice(-20) + '...');

    // 🔧 CORRECCIÓN: Estructura correcta de suscripción
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh_key,  // 🔧 CORREGIDO: Acceso correcto
        auth: subscription.auth_key       // 🔧 CORREGIDO: Acceso correcto
      }
    };

    // Preparar payload
    const payload = JSON.stringify({
      title: notification.title || '🐕 Club Canino',
      body: notification.body || 'Nueva notificación disponible',
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/badge-72x72.png',
      tag: notification.tag || 'club-canino-notification',
      data: notification.data || {},
      requireInteraction: notification.requireInteraction || false,
      actions: notification.actions || []
    });

    // 🔧 ENVÍO DIRECTO CON WEB-PUSH
    await webpush.sendNotification(pushSubscription, payload);
    
    console.log('✅ Push enviado exitosamente');
    return { success: true, method: 'web-push' };

  } catch (error) {
    console.error('❌ Error enviando push a suscripción:', error);
    
    // Si la suscripción es inválida (410 Gone), marcarla como inactiva
    if (error.statusCode === 410 || error.message.includes('410')) {
      console.log('🗑️ Suscripción inválida, marcando como inactiva');
      await markSubscriptionInactive(subscription.id);
    }
    
    throw error;
  }
}

// ============================================
// 🗑️ MARCAR SUSCRIPCIÓN COMO INACTIVA
// ============================================
async function markSubscriptionInactive(subscriptionId) {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ 
        active: false, 
        updated_at: new Date().toISOString() 
      })
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
    icon: '/icons/icon-192x192.png',
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
    icon: icons[alertType] || '/icons/icon-192x192.png',
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

console.log('✅ Función send-push-notification CORREGIDA cargada');