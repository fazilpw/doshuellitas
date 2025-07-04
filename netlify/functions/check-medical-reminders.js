// netlify/functions/check-medical-reminders.js
// 🏥 ENDPOINT PARA CRON-JOB.ORG - VERIFICACIÓN MÉDICA DIARIA
// Llamada automática: Todos los días a las 8:00 AM Colombia

const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurar VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY, 
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async (event, context) => {
  console.log('🏥 [CRON] Verificación médica diaria iniciada...');
  
  try {
    const results = {
      vaccinesChecked: 0,
      medicinesChecked: 0,
      notificationsSent: 0,
      errors: []
    };

    // ============================================
    // 💉 VERIFICAR VACUNAS PRÓXIMAS (7 días)
    // ============================================
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const { data: upcomingVaccines, error: vaccineError } = await supabase
      .from('dog_vaccines')
      .select(`
        *,
        dog:dogs(name, owner_id, profiles(*))
      `)
      .gte('next_due_date', new Date().toISOString().split('T')[0])
      .lte('next_due_date', nextWeek.toISOString().split('T')[0])
      .eq('administered', false);

    if (vaccineError) throw vaccineError;

    results.vaccinesChecked = upcomingVaccines?.length || 0;

    // Enviar notificaciones de vacunas
    for (const vaccine of upcomingVaccines || []) {
      const daysUntil = Math.ceil(
        (new Date(vaccine.next_due_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      // Usar scheduled_notifications que ya existe
      await supabase.from('scheduled_notifications').insert({
        user_id: vaccine.dog.owner_id,
        dog_id: vaccine.dog_id,
        template_key: 'vaccine_reminder',
        variables: {
          dogName: vaccine.dog.name,
          vaccineName: vaccine.vaccine_name,
          daysUntil: daysUntil
        },
        scheduled_for: new Date().toISOString()
      });

      results.notificationsSent++;
    }

    // ============================================
    // 💊 VERIFICAR MEDICINAS HOY
    // ============================================
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayMedicines, error: medicineError } = await supabase
      .from('medicines')
      .select(`
        *,
        dog:dogs(name, owner_id, profiles(*))
      `)
      .eq('next_dose_date', today)
      .eq('is_ongoing', true);

    if (medicineError) throw medicineError;

    results.medicinesChecked = todayMedicines?.length || 0;

    // Enviar notificaciones de medicinas usando scheduled_notifications
    for (const medicine of todayMedicines || []) {
      await supabase.from('scheduled_notifications').insert({
        user_id: medicine.dog.owner_id,
        dog_id: medicine.dog_id,
        template_key: 'medicine_reminder',
        variables: {
          dogName: medicine.dog.name,
          medicineName: medicine.medicine_name,
          dosage: medicine.dosage
        },
        scheduled_for: new Date().toISOString()
      });

      results.notificationsSent++;

      // Actualizar próxima dosis según frecuencia
      const nextDoseDate = calculateNextDoseDate(medicine.frequency);
      await supabase
        .from('medicines')
        .update({ 
          next_dose_date: nextDoseDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', medicine.id);
    }

    // ============================================
    // 📊 CREAR LOG DE VERIFICACIÓN usando notification_logs
    // ============================================
    await supabase.from('notification_logs').insert({
      user_id: null, // Sistema
      title: 'Verificación médica automática',
      body: `Procesadas ${results.vaccinesChecked} vacunas y ${results.medicinesChecked} medicinas`,
      category: 'medical',
      priority: 'low',
      delivery_status: 'sent'
    });

    console.log('✅ [CRON] Verificación médica completada:', results);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Verificación médica completada',
        results
      })
    };

  } catch (error) {
    console.error('❌ [CRON] Error en verificación médica:', error);
    
    // Log del error
    await supabase.from('cron_logs').insert({
      job_type: 'medical_check',
      status: 'error',
      error_message: error.message,
      executed_at: new Date().toISOString()
    });

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

// ============================================
// 📨 FUNCIÓN AUXILIAR: ENVIAR NOTIFICACIÓN
// ============================================
async function sendNotificationToUser(userId, notification) {
  try {
    // Obtener suscripciones activas del usuario
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    for (const subscription of subscriptions || []) {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key
        }
      };

      await webpush.sendNotification(
        pushSubscription, 
        JSON.stringify(notification)
      );
    }

    // Registrar notificación en base de datos
    await supabase.from('notifications').insert({
      user_id: userId,
      title: notification.title,
      message: notification.body,
      type: notification.data.type,
      status: 'sent',
      sent_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
  }
}

// ============================================
// 📅 FUNCIÓN AUXILIAR: CALCULAR PRÓXIMA DOSIS
// ============================================
function calculateNextDoseDate(frequency) {
  const today = new Date();
  
  switch (frequency) {
    case 'daily':
      today.setDate(today.getDate() + 1);
      break;
    case 'twice_daily':
      today.setHours(today.getHours() + 12);
      break;
    case 'weekly':
      today.setDate(today.getDate() + 7);
      break;
    case 'monthly':
      today.setMonth(today.getMonth() + 1);
      break;
    default:
      today.setDate(today.getDate() + 1);
  }
  
  return today.toISOString().split('T')[0];
}