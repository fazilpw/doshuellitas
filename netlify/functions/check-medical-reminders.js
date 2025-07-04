// netlify/functions/check-medical-reminders.js
// 🏥 CRON JOB - VERIFICACIÓN MÉDICA AUTOMÁTICA CLUB CANINO DOS HUELLITAS
// 
// HORARIO COLOMBIA (UTC-5):
// 🌅 VERIFICACIÓN: 8:00 AM (Cron: 0 13 * * *)
//
// URL CRON: https://doshuellitas.netlify.app/.netlify/functions/check-medical-reminders

// ✅ SINTAXIS ES MODULES
import { createClient } from '@supabase/supabase-js';

// ✅ FUNCIÓN PRINCIPAL CON SINTAXIS ES MODULES
export const handler = async (event, context) => {
  const currentTime = new Date();
  const colombiaTime = new Date(currentTime.getTime() - (5 * 60 * 60 * 1000)); // UTC-5
  
  console.log(`🏥 [CRON] Verificación médica automática - ${colombiaTime.toLocaleTimeString('es-CO')}`);
  
  try {
    // ✅ CREAR CLIENTE SUPABASE CON ES MODULES
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variables de entorno de Supabase no configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = {
      timestamp: colombiaTime.toISOString(),
      vaccinesChecked: 0,
      vaccinesOverdue: 0,
      medicinesChecked: 0,
      medicinesDue: 0,
      notificationsSent: 0,
      errors: []
    };

    // ============================================
    // 💉 VERIFICAR VACUNAS PRÓXIMAS Y VENCIDAS
    // ============================================
    await checkVaccineReminders(supabase, results);

    // ============================================
    // 💊 VERIFICAR MEDICINAS Y DOSIS PENDIENTES
    // ============================================
    await checkMedicineReminders(supabase, results);

    // ============================================
    // 📊 REGISTRAR ACTIVIDAD EN LOGS
    // ============================================
    const metricsData = {
      vaccines_checked: results.vaccinesChecked,
      vaccines_overdue: results.vaccinesOverdue,
      medicines_checked: results.medicinesChecked,
      medicines_due: results.medicinesDue,
      notifications_sent: results.notificationsSent,
      success_rate: results.errors.length === 0 ? 100 : 90
    };

    await supabase.from('notification_logs').insert({
      user_id: null, // Sistema automático
      title: `🏥 Verificación médica automática`,
      body: `💉 Vacunas: ${results.vaccinesChecked} verificadas, ${results.vaccinesOverdue} vencidas | 💊 Medicinas: ${results.medicinesChecked} verificadas, ${results.medicinesDue} pendientes | 🔔 ${results.notificationsSent} notificaciones enviadas`,
      category: 'medical',
      priority: results.vaccinesOverdue > 0 || results.medicinesDue > 0 ? 'high' : 'medium',
      delivery_status: results.errors.length === 0 ? 'sent' : 'partial',
      data: metricsData,
      sent_at: new Date().toISOString()
    });

    console.log('✅ [CRON] Verificación médica completada:', results);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Verificación médica completada exitosamente',
        results: results,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ [CRON] Error en verificación médica:', error);
    
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
// 💉 VERIFICAR VACUNAS Y ENVIAR RECORDATORIOS
// ============================================
async function checkVaccineReminders(results) {
  console.log('💉 Verificando vacunas próximas y vencidas...');
  
  try {
    // Obtener todas las vacunas activas
    const { data: vaccines, error: vaccineError } = await supabase
      .from('dog_vaccines')
      .select(`
        *,
        dog:dogs(name, owner_id, profiles(*))
      `)
      .eq('administered', false);

    if (vaccineError) throw vaccineError;

    results.vaccinesChecked = vaccines?.length || 0;

    if (!vaccines || vaccines.length === 0) {
      console.log('📋 No hay vacunas pendientes');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    for (const vaccine of vaccines) {
      const dueDateStr = vaccine.next_due_date;
      const dueDate = new Date(dueDateStr);
      const todayDate = new Date(today);
      
      const daysUntilDue = Math.ceil((dueDate - todayDate) / (1000 * 60 * 60 * 24));

      // VACUNAS VENCIDAS (fecha pasada)
      if (daysUntilDue < 0) {
        results.vaccinesOverdue++;
        await sendVaccineNotification(vaccine, 'overdue', Math.abs(daysUntilDue));
        results.notificationsSent++;
      }
      // VACUNAS URGENTES (0-3 días)
      else if (daysUntilDue <= 3) {
        await sendVaccineNotification(vaccine, 'urgent', daysUntilDue);
        results.notificationsSent++;
      }
      // VACUNAS PRÓXIMAS (4-7 días)
      else if (daysUntilDue <= 7) {
        await sendVaccineNotification(vaccine, 'upcoming', daysUntilDue);
        results.notificationsSent++;
      }

      // Marcar recordatorio como enviado si está dentro del rango
      if (daysUntilDue <= 7) {
        await supabase
          .from('dog_vaccines')
          .update({ 
            reminder_sent: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', vaccine.id);
      }
    }

    console.log(`✅ Vacunas verificadas: ${results.vaccinesChecked}, vencidas: ${results.vaccinesOverdue}`);

  } catch (error) {
    console.error('❌ Error verificando vacunas:', error);
    results.errors.push(`Vacunas: ${error.message}`);
  }
}

// ============================================
// 💊 VERIFICAR MEDICINAS Y DOSIS PENDIENTES
// ============================================
async function checkMedicineReminders(results) {
  console.log('💊 Verificando medicinas y dosis pendientes...');
  
  try {
    // Obtener medicinas activas con dosis próximas
    const { data: medicines, error: medicineError } = await supabase
      .from('medicines')
      .select(`
        *,
        dog:dogs(name, owner_id, profiles(*))
      `)
      .eq('is_ongoing', true)
      .not('next_dose_date', 'is', null);

    if (medicineError) throw medicineError;

    results.medicinesChecked = medicines?.length || 0;

    if (!medicines || medicines.length === 0) {
      console.log('📋 No hay medicinas activas');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    for (const medicine of medicines) {
      const doseDateStr = medicine.next_dose_date;
      const doseDate = new Date(doseDateStr);
      const todayDate = new Date(today);
      
      const daysUntilDose = Math.ceil((doseDate - todayDate) / (1000 * 60 * 60 * 24));

      // DOSIS VENCIDAS O DE HOY
      if (daysUntilDose <= 0) {
        results.medicinesDue++;
        await sendMedicineNotification(medicine, 'due', Math.abs(daysUntilDose));
        results.notificationsSent++;
        
        // Calcular próxima dosis basada en frecuencia
        await updateNextDoseDate(medicine);
      }
      // DOSIS PRÓXIMAS (mañana)
      else if (daysUntilDose === 1) {
        await sendMedicineNotification(medicine, 'tomorrow', daysUntilDose);
        results.notificationsSent++;
      }
    }

    console.log(`✅ Medicinas verificadas: ${results.medicinesChecked}, dosis pendientes: ${results.medicinesDue}`);

  } catch (error) {
    console.error('❌ Error verificando medicinas:', error);
    results.errors.push(`Medicinas: ${error.message}`);
  }
}

// ============================================
// 📨 ENVIAR NOTIFICACIÓN DE VACUNA
// ============================================
async function sendVaccineNotification(vaccine, urgency, days) {
  try {
    let title, message, priority;
    
    switch (urgency) {
      case 'overdue':
        title = `💉 VACUNA VENCIDA - ${vaccine.vaccine_name}`;
        message = `La vacuna ${vaccine.vaccine_name} de ${vaccine.dog.name} está vencida desde hace ${days} días. Agenda cita veterinaria urgente.`;
        priority = 'urgent';
        break;
      case 'urgent':
        title = `💉 VACUNA URGENTE - ${vaccine.vaccine_name}`;
        message = `La vacuna ${vaccine.vaccine_name} de ${vaccine.dog.name} vence ${days === 0 ? 'HOY' : `en ${days} días`}. Agenda cita pronto.`;
        priority = 'high';
        break;
      case 'upcoming':
        title = `💉 Recordatorio de vacuna - ${vaccine.vaccine_name}`;
        message = `La vacuna ${vaccine.vaccine_name} de ${vaccine.dog.name} vence en ${days} días. Es hora de programar la cita.`;
        priority = 'medium';
        break;
    }

    // Crear notificación en dashboard
    const notificationData = {
      user_id: vaccine.dog.owner_id,
      dog_id: vaccine.dog.id,
      title: title,
      message: message,
      type: urgency === 'overdue' ? 'error' : 'warning',
      category: 'medical',
      priority: priority,
      data: {
        vaccineId: vaccine.id,
        vaccineName: vaccine.vaccine_name,
        daysUntilDue: urgency === 'overdue' ? -days : days,
        clinicName: vaccine.clinic_name,
        veterinarianName: vaccine.veterinarian_name
      },
      action_url: `/dashboard/parent/?tab=medical`,
      action_label: '🏥 Ver información médica',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
      created_at: new Date().toISOString()
    };

    const { data: notification, error: notifyError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (notifyError) {
      console.error(`❌ Error creando notificación de vacuna:`, notifyError);
      return;
    }

    // Enviar push notification
    const pushResult = await sendPushNotification(vaccine.dog.owner_id, notificationData);
    
    if (pushResult && pushResult.successCount > 0) {
      console.log(`📱 Push de vacuna enviado a ${vaccine.dog.profiles.full_name || 'propietario'}`);
    }

    console.log(`✅ Notificación de vacuna enviada: ${vaccine.vaccine_name} (${urgency})`);

  } catch (error) {
    console.error('❌ Error enviando notificación de vacuna:', error);
  }
}

// ============================================
// 📨 ENVIAR NOTIFICACIÓN DE MEDICINA
// ============================================
async function sendMedicineNotification(medicine, urgency, days) {
  try {
    let title, message, priority;
    
    switch (urgency) {
      case 'due':
        title = `💊 DOSIS PENDIENTE - ${medicine.medicine_name}`;
        message = `Es hora de administrar ${medicine.medicine_name} a ${medicine.dog.name}. Dosis: ${medicine.dosage}`;
        priority = 'high';
        break;
      case 'tomorrow':
        title = `💊 Recordatorio de medicina - ${medicine.medicine_name}`;
        message = `Mañana debes administrar ${medicine.medicine_name} a ${medicine.dog.name}. Dosis: ${medicine.dosage}`;
        priority = 'medium';
        break;
    }

    // Crear notificación en dashboard
    const notificationData = {
      user_id: medicine.dog.owner_id,
      dog_id: medicine.dog.id,
      title: title,
      message: message,
      type: urgency === 'due' ? 'warning' : 'info',
      category: 'medical',
      priority: priority,
      data: {
        medicineId: medicine.id,
        medicineName: medicine.medicine_name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        specialInstructions: medicine.special_instructions
      },
      action_url: `/dashboard/parent/?tab=medical`,
      action_label: '💊 Registrar dosis administrada',
      expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días
      created_at: new Date().toISOString()
    };

    const { data: notification, error: notifyError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (notifyError) {
      console.error(`❌ Error creando notificación de medicina:`, notifyError);
      return;
    }

    // Enviar push notification
    const pushResult = await sendPushNotification(medicine.dog.owner_id, notificationData);
    
    if (pushResult && pushResult.successCount > 0) {
      console.log(`📱 Push de medicina enviado a ${medicine.dog.profiles.full_name || 'propietario'}`);
    }

    console.log(`✅ Notificación de medicina enviada: ${medicine.medicine_name} (${urgency})`);

  } catch (error) {
    console.error('❌ Error enviando notificación de medicina:', error);
  }
}

// ============================================
// 🔄 ACTUALIZAR PRÓXIMA FECHA DE DOSIS
// ============================================
async function updateNextDoseDate(medicine) {
  try {
    let nextDate = new Date();
    
    // Calcular próxima dosis según frecuencia
    switch (medicine.frequency?.toLowerCase()) {
      case 'diaria':
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'cada 12 horas':
      case '12h':
        nextDate.setHours(nextDate.getHours() + 12);
        break;
      case 'cada 8 horas':
      case '8h':
        nextDate.setHours(nextDate.getHours() + 8);
        break;
      case 'semanal':
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'mensual':
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        // Por defecto, asumir diaria
        nextDate.setDate(nextDate.getDate() + 1);
    }

    // Actualizar en base de datos
    await supabase
      .from('medicines')
      .update({ 
        next_dose_date: nextDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', medicine.id);

    console.log(`✅ Próxima dosis actualizada para ${medicine.medicine_name}: ${nextDate.toISOString().split('T')[0]}`);

  } catch (error) {
    console.error('❌ Error actualizando próxima dosis:', error);
  }
}

// ============================================
// 📱 ENVIAR PUSH NOTIFICATION (REUTILIZAR)
// ============================================
async function sendPushNotification(userId, notificationData) {
  try {
    console.log(`📱 Enviando push notification médica a usuario ${userId}...`);
    
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`📱 Usuario ${userId} sin suscripciones push activas`);
      return { successCount: 0, errorCount: 0, totalSubscriptions: 0 };
    }

    const pushPayload = JSON.stringify({
      title: notificationData.title,
      body: notificationData.message,
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: `medical-${Date.now()}`,
      data: {
        ...notificationData.data,
        url: notificationData.action_url,
        timestamp: Date.now(),
        type: 'medical'
      },
      actions: [
        {
          action: 'view',
          title: '🏥 Ver detalles'
        },
        {
          action: 'close',
          title: '❌ Cerrar'
        }
      ],
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300], // Patrón distintivo para notificaciones médicas
      renotify: true
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
        console.error(`❌ Error enviando push médico:`, pushError.message);
        
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
    console.error('❌ Error crítico en push notifications médicas:', error);
    return { successCount: 0, errorCount: 1, totalSubscriptions: 0, error: error.message };
  }
}

// ============================================
// ✅ RESPUESTA EXITOSA
// ============================================
function successResponse(results, message) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      message: message,
      results: results,
      timestamp: new Date().toISOString()
    })
  };
}