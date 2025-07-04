// netlify/functions/check-routine-reminders.js
// 🕐 CRON JOB - VERIFICACIÓN DE RUTINAS CADA HORA - CLUB CANINO DOS HUELLITAS
// 
// HORARIO COLOMBIA (UTC-5):
// ⏰ VERIFICACIÓN: CADA HORA EN PUNTO (Cron: 0 * * * *)
//
// URL CRON: https://doshuellitas.netlify.app/.netlify/functions/check-routine-reminders

// ✅ SINTAXIS ES MODULES
import { createClient } from '@supabase/supabase-js';

// ✅ FUNCIÓN PRINCIPAL - VERIFICACIÓN HORARIA
export const handler = async (event, context) => {
  const currentTime = new Date();
  const colombiaTime = new Date(currentTime.getTime() - (5 * 60 * 60 * 1000)); // UTC-5
  
  const currentHour = colombiaTime.getHours();
  const currentMinute = colombiaTime.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  const currentDayOfWeek = colombiaTime.getDay() === 0 ? 7 : colombiaTime.getDay(); // 1=Lunes, 7=Domingo
  
  console.log(`🕐 [CRON] Verificación de rutinas - ${currentTimeStr} (Día ${currentDayOfWeek})`);
  
  try {
    // ✅ CONFIGURAR WEBPUSH DINÁMICAMENTE
    let webpush = null;
    try {
      const webpushModule = await import('web-push');
      webpush = webpushModule.default || webpushModule;
      
      const vapidPublic = process.env.PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
      const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
      const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@doshuellitas.com';
      
      if (vapidPublic && vapidPrivate) {
        webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
        console.log('✅ VAPID configurado para rutinas');
      } else {
        console.warn('⚠️ VAPID keys no encontradas para rutinas');
        webpush = null;
      }
    } catch (webpushError) {
      console.warn('⚠️ Web-push no disponible para rutinas:', webpushError.message);
      webpush = null;
    }
    
    // ✅ CREAR CLIENTE SUPABASE
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variables de entorno de Supabase no configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = {
      timestamp: colombiaTime.toISOString(),
      currentTime: currentTimeStr,
      dayOfWeek: currentDayOfWeek,
      routinesChecked: 0,
      routinesDue: 0,
      notificationsSent: 0,
      pushNotificationsSent: 0,
      categories: {
        feeding: 0,
        exercise: 0,
        walk: 0,
        grooming: 0,
        training: 0,
        other: 0
      },
      errors: []
    };

    // ============================================
    // 🕐 VERIFICAR RUTINAS PROGRAMADAS PARA ESTA HORA
    // ============================================
    await checkScheduledRoutines(supabase, webpush, currentTimeStr, currentDayOfWeek, results);

    // ============================================
    // 📊 REGISTRAR ACTIVIDAD EN LOGS
    // ============================================
    const metricsData = {
      current_time: currentTimeStr,
      day_of_week: currentDayOfWeek,
      routines_checked: results.routinesChecked,
      routines_due: results.routinesDue,
      notifications_sent: results.notificationsSent,
      push_notifications_sent: results.pushNotificationsSent,
      categories: results.categories,
      success_rate: results.errors.length === 0 ? 100 : 90
    };

    // Solo registrar en logs si hay actividad relevante
    if (results.routinesDue > 0 || results.errors.length > 0) {
      try {
        await supabase.from('notification_logs').insert({
          user_id: null, // Sistema automático
          title: `🕐 Verificación de rutinas ${currentTimeStr}`,
          body: `📅 ${results.routinesChecked} rutinas verificadas | 🔔 ${results.routinesDue} rutinas activas | 📱 ${results.notificationsSent} notificaciones enviadas`,
          category: 'routine',
          priority: results.routinesDue > 5 ? 'medium' : 'low',
          delivery_status: results.errors.length === 0 ? 'sent' : 'partial',
          data: metricsData,
          sent_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('❌ Error guardando log de rutinas:', logError);
      }
    }

    console.log(`✅ [CRON] Verificación de rutinas completada: ${results.routinesDue} rutinas activas`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Verificación de rutinas completada exitosamente',
        results: results,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ [CRON] Error en verificación de rutinas:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// ============================================
// 🕐 VERIFICAR RUTINAS PROGRAMADAS PARA ESTA HORA
// ============================================
async function checkScheduledRoutines(supabase, webpush, currentTimeStr, currentDayOfWeek, results) {
  console.log(`🕐 Verificando rutinas para las ${currentTimeStr} del día ${currentDayOfWeek}...`);
  
  try {
    // Buscar rutinas programadas para esta hora exacta y este día de la semana
    const { data: scheduledRoutines, error: routineError } = await supabase
      .from('routine_schedules')
      .select(`
        *,
        routine:dog_routines(
          *,
          dog:dogs(
            name, 
            owner_id, 
            profiles(full_name, email)
          )
        )
      `)
      .eq('active', true)
      .eq('time', `${currentTimeStr}:00`)
      .contains('days_of_week', [currentDayOfWeek]);

    if (routineError) throw routineError;

    results.routinesChecked = scheduledRoutines?.length || 0;

    if (!scheduledRoutines || scheduledRoutines.length === 0) {
      console.log(`📋 No hay rutinas programadas para las ${currentTimeStr}`);
      return;
    }

    console.log(`📅 Encontradas ${scheduledRoutines.length} rutinas para las ${currentTimeStr}`);

    // Procesar cada rutina encontrada
    for (const schedule of scheduledRoutines) {
      if (!schedule.routine || !schedule.routine.dog) {
        console.warn('⚠️ Rutina sin datos completos, omitiendo...');
        continue;
      }

      results.routinesDue++;
      
      // Categorizar la rutina
      const category = schedule.routine.routine_category || 'other';
      if (results.categories[category] !== undefined) {
        results.categories[category]++;
      } else {
        results.categories.other++;
      }

      // Enviar notificación de rutina
      await sendRoutineNotification(supabase, webpush, schedule, results);
      results.notificationsSent++;
    }

    console.log(`✅ Rutinas procesadas: ${results.routinesDue} activas, ${results.notificationsSent} notificaciones`);

  } catch (error) {
    console.error('❌ Error verificando rutinas:', error);
    results.errors.push(`Rutinas: ${error.message}`);
  }
}

// ============================================
// 📨 ENVIAR NOTIFICACIÓN DE RUTINA
// ============================================
async function sendRoutineNotification(supabase, webpush, schedule, results) {
  try {
    const routine = schedule.routine;
    const dog = routine.dog;
    const category = routine.routine_category;
    
    // Determinar emoji y mensaje según categoría
    const categoryConfig = {
      feeding: {
        emoji: '🍽️',
        title: `Es hora de alimentar a ${dog.name}`,
        message: `${schedule.name} - ${dog.name}`,
        action: 'alimentar'
      },
      exercise: {
        emoji: '🏃',
        title: `Hora de ejercicio para ${dog.name}`,
        message: `${schedule.name} - ${dog.name}`,
        action: 'ejercitar'
      },
      walk: {
        emoji: '🚶',
        title: `Hora del paseo de ${dog.name}`,
        message: `${schedule.name} - ${dog.name}`,
        action: 'pasear'
      },
      grooming: {
        emoji: '🛁',
        title: `Cuidado personal de ${dog.name}`,
        message: `${schedule.name} - ${dog.name}`,
        action: 'cuidar'
      },
      training: {
        emoji: '🎯',
        title: `Sesión de entrenamiento con ${dog.name}`,
        message: `${schedule.name} - ${dog.name}`,
        action: 'entrenar'
      },
      medicine: {
        emoji: '💊',
        title: `Medicamento para ${dog.name}`,
        message: `${schedule.name} - ${dog.name}`,
        action: 'administrar medicina'
      }
    };

    const config = categoryConfig[category] || {
      emoji: '⏰',
      title: `Recordatorio para ${dog.name}`,
      message: `${schedule.name} - ${dog.name}`,
      action: 'atender'
    };

    // Crear notificación en dashboard
    const notificationData = {
      user_id: dog.owner_id,
      dog_id: routine.dog_id,
      title: `${config.emoji} ${config.title}`,
      message: config.message + (schedule.notes ? ` - ${schedule.notes}` : ''),
      type: 'info',
      category: 'routine',
      priority: 'medium',
      data: {
        routineId: routine.id,
        scheduleId: schedule.id,
        routineName: routine.name,
        scheduleName: schedule.name,
        routineCategory: category,
        time: schedule.time,
        notes: schedule.notes,
        dogName: dog.name
      },
      action_url: `/dashboard/parent/?tab=routines`,
      action_label: `✅ Confirmar ${config.action}`,
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 horas
      created_at: new Date().toISOString()
    };

    const { data: notification, error: notifyError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (notifyError) {
      console.error(`❌ Error creando notificación de rutina:`, notifyError);
      return;
    }

    // Enviar push notification si está disponible
    if (webpush) {
      const pushResult = await sendRoutinePushNotification(supabase, webpush, dog.owner_id, notificationData);
      
      if (pushResult && pushResult.successCount > 0) {
        console.log(`📱 Push de rutina enviado a ${dog.profiles?.full_name || 'propietario'}`);
        results.pushNotificationsSent += pushResult.successCount;
      }
    }

    console.log(`✅ Notificación de rutina enviada: ${config.title}`);

  } catch (error) {
    console.error('❌ Error enviando notificación de rutina:', error);
  }
}

// ============================================
// 📱 ENVIAR PUSH NOTIFICATION DE RUTINA
// ============================================
async function sendRoutinePushNotification(supabase, webpush, userId, notificationData) {
  try {
    console.log(`📱 Enviando push notification de rutina a usuario ${userId}...`);
    
    // Verificar si webpush está disponible
    if (!webpush) {
      console.log('📱 Web-push no disponible para rutinas, omitiendo push notification');
      return { successCount: 0, errorCount: 0, totalSubscriptions: 0, skipped: true };
    }
    
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`📱 Usuario ${userId} sin suscripciones push activas para rutinas`);
      return { successCount: 0, errorCount: 0, totalSubscriptions: 0 };
    }

    const pushPayload = JSON.stringify({
      title: notificationData.title,
      body: notificationData.message,
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: `routine-${Date.now()}`,
      data: {
        ...notificationData.data,
        url: notificationData.action_url,
        timestamp: Date.now(),
        type: 'routine'
      },
      actions: [
        {
          action: 'complete',
          title: '✅ Completado'
        },
        {
          action: 'snooze',
          title: '⏰ Recordar en 30min'
        }
      ],
      requireInteraction: false, // Para rutinas, no requiere interacción obligatoria
      vibrate: [200, 100, 200], // Patrón más suave para rutinas
      renotify: false
    });

    let successCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          },
          pushPayload
        );
        
        successCount++;
        
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', subscription.id);

      } catch (pushError) {
        errorCount++;
        console.error(`❌ Error enviando push de rutina:`, pushError.message);
        
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id);
        }
      }
    }

    return { successCount, errorCount, totalSubscriptions: subscriptions.length };

  } catch (error) {
    console.error('❌ Error crítico en push notifications de rutinas:', error);
    return { successCount: 0, errorCount: 1, totalSubscriptions: 0, error: error.message };
  }
}