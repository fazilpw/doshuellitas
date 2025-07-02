// src/utils/pushNotificationHelper.js
// 📱 HELPER PARA INTEGRAR PUSH NOTIFICATIONS CON EVALUACIONES

import supabase from '../lib/supabase.js';

// ============================================
// 🔔 CLASE PRINCIPAL PARA PUSH NOTIFICATIONS
// ============================================
export class PushNotificationHelper {
  
  // ============================================
  // 📤 ENVIAR PUSH NOTIFICATION
  // ============================================
  static async sendPushNotification(userId, notification) {
    try {
      console.log('📤 Enviando push notification:', notification.title);
      
      const response = await fetch('/.netlify/functions/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          notification: notification
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Push notification enviada exitosamente');
        return result;
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('❌ Error enviando push notification:', error);
      // No fallar la operación principal por errores de push
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // 🎯 NOTIFICACIONES DE EVALUACIÓN AUTOMÁTICAS
  // ============================================
  static async sendEvaluationNotifications(evaluation, dog, evaluatorRole) {
    console.log(`🎯 Procesando notificaciones push para evaluación de ${dog.name}`);
    
    try {
      const notifications = [];
      
      // 1. NOTIFICACIÓN GENERAL DE EVALUACIÓN COMPLETADA
      const generalNotification = {
        title: `📊 Evaluación Completada - ${dog.name}`,
        body: `Nueva evaluación de ${dog.name} disponible en ${evaluatorRole === 'profesor' ? 'el colegio' : 'casa'}. ¡Revisa los resultados!`,
        icon: '/icon-192.png',
        data: {
          type: 'evaluation_completed',
          dogId: dog.id,
          dogName: dog.name,
          evaluationId: evaluation.id,
          location: evaluation.location,
          url: '/dashboard/parent/?tab=evaluaciones'
        },
        requireInteraction: false
      };
      
      // Enviar a los padres si la evaluación fue hecha por profesor
      if (evaluatorRole === 'profesor' && dog.owner_id) {
        const result = await this.sendPushNotification(dog.owner_id, generalNotification);
        notifications.push({ type: 'general', result });
      }

      // 2. NOTIFICACIONES ESPECÍFICAS DE COMPORTAMIENTO
      const behaviorNotifications = await this.generateBehaviorPushNotifications(evaluation, dog);
      
      for (const behaviorNotif of behaviorNotifications) {
        if (dog.owner_id) {
          const result = await this.sendPushNotification(dog.owner_id, behaviorNotif);
          notifications.push({ type: 'behavior', result });
        }
      }

      console.log(`✅ Procesadas ${notifications.length} push notifications para ${dog.name}`);
      return notifications;
      
    } catch (error) {
      console.error('❌ Error procesando push notifications:', error);
      return [];
    }
  }

  // ============================================
  // 🚨 GENERAR NOTIFICACIONES DE COMPORTAMIENTO
  // ============================================
  static async generateBehaviorPushNotifications(evaluation, dog) {
    const notifications = [];
    
    try {
      // 🚨 ANSIEDAD ALTA (>= 8)
      if (evaluation.anxiety_level >= 8) {
        notifications.push({
          title: `🚨 Alerta: Ansiedad Alta - ${dog.name}`,
          body: `${dog.name} mostró ansiedad alta (${evaluation.anxiety_level}/10). Te recomendamos ejercicios de relajación.`,
          icon: '/icons/alert-icon.png',
          data: {
            type: 'behavior_alert',
            alertType: 'anxiety',
            dogId: dog.id,
            dogName: dog.name,
            level: evaluation.anxiety_level,
            url: '/dashboard/parent/?tab=comportamiento'
          },
          requireInteraction: true
        });
      }

      // 📚 OBEDIENCIA BAJA (<= 3)
      if (evaluation.obedience_level <= 3) {
        notifications.push({
          title: `📚 Refuerzo Necesario - ${dog.name}`,
          body: `${dog.name} necesita refuerzo en obediencia (${evaluation.obedience_level}/10). Practicar comandos básicos diariamente.`,
          icon: '/icons/training-icon.png',
          data: {
            type: 'behavior_alert',
            alertType: 'obedience',
            dogId: dog.id,
            dogName: dog.name,
            level: evaluation.obedience_level,
            url: '/dashboard/parent/?tab=entrenamiento'
          },
          requireInteraction: true
        });
      }

      // ⚡ ENERGÍA MUY ALTA (>= 9)
      if (evaluation.energy_level >= 9) {
        notifications.push({
          title: `⚡ Energía Muy Alta - ${dog.name}`,
          body: `${dog.name} tiene mucha energía (${evaluation.energy_level}/10). Considera aumentar el tiempo de ejercicio.`,
          icon: '/icons/energy-icon.png',
          data: {
            type: 'behavior_alert',
            alertType: 'energy',
            dogId: dog.id,
            dogName: dog.name,
            level: evaluation.energy_level,
            url: '/dashboard/parent/?tab=actividades'
          },
          requireInteraction: false
        });
      }

      // ✅ MEJORAS NOTABLES (obediencia o socialización >= 8)
      if (evaluation.obedience_level >= 8 || evaluation.sociability_level >= 8) {
        const improvement = evaluation.obedience_level >= 8 ? 'obediencia' : 'socialización';
        const level = evaluation.obedience_level >= 8 ? evaluation.obedience_level : evaluation.sociability_level;
        
        notifications.push({
          title: `🎉 ¡Excelente Progreso! - ${dog.name}`,
          body: `${dog.name} mostró excelente ${improvement} (${level}/10). ¡Sigue con el buen trabajo!`,
          icon: '/icons/success-icon.png',
          data: {
            type: 'behavior_improvement',
            improvementType: improvement,
            dogId: dog.id,
            dogName: dog.name,
            level: level,
            url: '/dashboard/parent/?tab=progreso'
          },
          requireInteraction: false
        });
      }

      console.log(`📋 Generadas ${notifications.length} notificaciones de comportamiento`);
      return notifications;
      
    } catch (error) {
      console.error('❌ Error generando notificaciones de comportamiento:', error);
      return [];
    }
  }

  // ============================================
  // 🚐 NOTIFICACIONES DE TRANSPORTE
  // ============================================
  static async sendTransportNotifications(dogIds, routeInfo) {
    console.log(`🚐 Enviando notificaciones de transporte para ${dogIds.length} perros`);
    
    try {
      // Obtener información de los perros y sus dueños
      const { data: dogs, error } = await supabase
        .from('dogs')
        .select('id, name, owner_id')
        .in('id', dogIds);

      if (error) throw error;

      const notifications = [];

      for (const dog of dogs) {
        if (!dog.owner_id) continue;

        // Notificación de inicio de ruta
        const transportNotification = {
          title: `🚐 Transporte en Camino - ${dog.name}`,
          body: `El vehículo salió a recoger a ${dog.name}. ETA estimado: ${routeInfo.estimatedTime || '25'} minutos.`,
          icon: '/icons/transport-icon.png',
          data: {
            type: 'transport_update',
            dogId: dog.id,
            dogName: dog.name,
            routeId: routeInfo.id,
            status: 'started',
            eta: routeInfo.estimatedTime,
            url: '/dashboard/parent/?page=tracking'
          },
          requireInteraction: false
        };

        const result = await this.sendPushNotification(dog.owner_id, transportNotification);
        notifications.push({ dogId: dog.id, result });
      }

      console.log(`✅ Enviadas ${notifications.length} notificaciones de transporte`);
      return notifications;
      
    } catch (error) {
      console.error('❌ Error enviando notificaciones de transporte:', error);
      return [];
    }
  }

  // ============================================
  // 💊 NOTIFICACIONES MÉDICAS
  // ============================================
  static async sendMedicalReminder(userId, dogId, reminderType, details) {
    console.log(`💊 Enviando recordatorio médico: ${reminderType}`);
    
    try {
      const { data: dog } = await supabase
        .from('dogs')
        .select('name')
        .eq('id', dogId)
        .single();

      if (!dog) throw new Error('Perro no encontrado');

      const medicalNotifications = {
        vaccine: {
          title: `💉 Recordatorio de Vacuna - ${dog.name}`,
          body: `${dog.name} tiene una vacuna próxima a vencer: ${details.vaccineName}. Programa tu cita veterinaria.`,
          icon: '/icons/medical-icon.png'
        },
        medicine: {
          title: `💊 Hora de Medicina - ${dog.name}`,
          body: `Es hora de darle la medicina a ${dog.name}: ${details.medicineName}.`,
          icon: '/icons/medicine-icon.png'
        },
        checkup: {
          title: `🏥 Recordatorio de Chequeo - ${dog.name}`,
          body: `${dog.name} necesita un chequeo veterinario. ¡No olvides programar la cita!`,
          icon: '/icons/checkup-icon.png'
        }
      };

      const notificationConfig = medicalNotifications[reminderType];
      
      if (!notificationConfig) {
        throw new Error(`Tipo de recordatorio médico desconocido: ${reminderType}`);
      }

      const notification = {
        ...notificationConfig,
        data: {
          type: 'medical_reminder',
          reminderType,
          dogId,
          dogName: dog.name,
          details,
          url: '/dashboard/parent/?page=salud'
        },
        requireInteraction: true
      };

      const result = await this.sendPushNotification(userId, notification);
      console.log(`✅ Recordatorio médico enviado: ${reminderType}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error enviando recordatorio médico:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // 🧪 NOTIFICACIÓN DE PRUEBA
  // ============================================
  static async sendTestPushNotification(userId, dogName = 'tu perro') {
    console.log('🧪 Enviando notificación push de prueba...');
    
    try {
      const testNotification = {
        title: '🧪 Prueba Push - Club Canino',
        body: `¡Perfecto! Las push notifications están funcionando correctamente para ${dogName}. 🎉`,
        icon: '/icon-192.png',
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
          dogName,
          url: '/dashboard/parent/'
        },
        requireInteraction: false
      };

      const result = await this.sendPushNotification(userId, testNotification);
      
      if (result.success) {
        console.log('✅ Notificación push de prueba enviada exitosamente');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Error enviando notificación push de prueba:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // 📊 VERIFICAR SOPORTE DE PUSH
  // ============================================
  static checkPushSupport() {
    const support = {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window,
      promises: 'Promise' in window
    };

    const isSupported = Object.values(support).every(Boolean);
    
    console.log('📊 Soporte push notifications:', support);
    
    return {
      supported: isSupported,
      details: support
    };
  }

  // ============================================
  // 🔍 OBTENER ESTADO DE SUSCRIPCIONES
  // ============================================
  static async getUserPushSubscriptions(userId) {
    try {
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const activeSubscriptions = subscriptions?.filter(sub => sub.active) || [];
      
      return {
        total: subscriptions?.length || 0,
        active: activeSubscriptions.length,
        subscriptions: activeSubscriptions
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo suscripciones:', error);
      return { total: 0, active: 0, subscriptions: [] };
    }
  }
}

// ============================================
// 🔗 INTEGRACIÓN CON NOTIFICATION HELPER EXISTENTE
// ============================================

// Modificar tu NotificationHelper existente para incluir push notifications
export const enhanceNotificationHelperWithPush = (NotificationHelper) => {
  const originalCheckBehaviorAlerts = NotificationHelper.checkBehaviorAlertsAfterEvaluation;
  
  // Sobrescribir la función para incluir push notifications
  NotificationHelper.checkBehaviorAlertsAfterEvaluation = async function(evaluation, dog, evaluatorId) {
    try {
      // Ejecutar la lógica original (notificaciones en BD)
      const originalResult = await originalCheckBehaviorAlerts.call(this, evaluation, dog, evaluatorId);
      
      // Obtener el rol del evaluador
      const { data: evaluatorProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', evaluatorId)
        .single();
      
      const evaluatorRole = evaluatorProfile?.role || 'padre';
      
      // Agregar push notifications
      const pushResults = await PushNotificationHelper.sendEvaluationNotifications(
        evaluation, 
        dog, 
        evaluatorRole
      );
      
      console.log(`📱 Push notifications enviadas: ${pushResults.length}`);
      
      return {
        ...originalResult,
        pushNotifications: pushResults
      };
      
    } catch (error) {
      console.error('❌ Error en enhanced checkBehaviorAlerts:', error);
      // Fallback a función original
      return await originalCheckBehaviorAlerts.call(this, evaluation, dog, evaluatorId);
    }
  };
  
  return NotificationHelper;
};

// ============================================
// 🚀 FUNCIÓN DE INICIALIZACIÓN
// ============================================
export const initializePushNotifications = async (userId) => {
  try {
    console.log('🚀 Inicializando sistema de push notifications...');
    
    // Verificar soporte
    const support = PushNotificationHelper.checkPushSupport();
    
    if (!support.supported) {
      console.warn('⚠️ Push notifications no soportadas en este dispositivo');
      return { supported: false, reason: 'Device not supported' };
    }
    
    // Obtener estado de suscripciones
    const subscriptionStatus = await PushNotificationHelper.getUserPushSubscriptions(userId);
    
    console.log(`📊 Usuario ${userId}: ${subscriptionStatus.active} suscripciones activas`);
    
    return {
      supported: true,
      subscriptions: subscriptionStatus,
      helper: PushNotificationHelper
    };
    
  } catch (error) {
    console.error('❌ Error inicializando push notifications:', error);
    return { supported: false, error: error.message };
  }
};

export default PushNotificationHelper;