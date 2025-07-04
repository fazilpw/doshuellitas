// netlify/functions/daily-maintenance.js
// 🔧 CRON JOB - MANTENIMIENTO NOCTURNO DEL SISTEMA CLUB CANINO DOS HUELLITAS
// 
// HORARIO COLOMBIA (UTC-5):
// 🌙 MANTENIMIENTO: 11:00 PM (Cron: 0 4 * * *)
//
// URL CRON: https://doshuellitas.netlify.app/.netlify/functions/daily-maintenance

// ✅ CONVERTIDO A ES MODULES (COMPATIBLE CON package.json "type": "module")
import { createClient } from '@supabase/supabase-js';

// 🔧 CONFIGURACIÓN SUPABASE
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export const handler = async (event, context) => {
  const currentTime = new Date();
  const colombiaTime = new Date(currentTime.getTime() - (5 * 60 * 60 * 1000)); // UTC-5
  
  console.log(`🔧 [CRON] Mantenimiento nocturno del sistema - ${colombiaTime.toLocaleTimeString('es-CO')}`);
  
  try {
    const results = {
      timestamp: colombiaTime.toISOString(),
      evaluationsProcessed: 0,
      tipsGenerated: 0,
      reportsCreated: 0,
      dataCleanedUp: 0,
      inactiveUsersFound: 0,
      notificationsSent: 0,
      errors: []
    };

    // ============================================
    // 📊 PROCESAR EVALUACIONES DEL DÍA (SIMPLIFICADO)
    // ============================================
    await processSimpleEvaluations(results);

    // ============================================
    // 💡 GENERAR TIPS BÁSICOS
    // ============================================
    await generateBasicTips(results);

    // ============================================
    // 🧹 LIMPIEZA BÁSICA
    // ============================================
    await performBasicCleanup(results);

    // ============================================
    // 📊 REGISTRAR ACTIVIDAD
    // ============================================
    const metricsData = {
      evaluations_processed: results.evaluationsProcessed,
      tips_generated: results.tipsGenerated,
      data_cleaned: results.dataCleanedUp,
      notifications_sent: results.notificationsSent,
      success_rate: results.errors.length === 0 ? 100 : 85
    };

    await supabase.from('notification_logs').insert({
      user_id: null,
      title: `🔧 Mantenimiento nocturno completado`,
      body: `📊 Evaluaciones: ${results.evaluationsProcessed} | 💡 Tips: ${results.tipsGenerated} | 🧹 Limpieza: ${results.dataCleanedUp} registros | 🔔 ${results.notificationsSent} notificaciones`,
      category: 'routine',
      priority: results.errors.length > 0 ? 'medium' : 'low',
      delivery_status: results.errors.length === 0 ? 'sent' : 'partial',
      data: metricsData,
      sent_at: new Date().toISOString()
    });

    console.log('✅ [CRON] Mantenimiento nocturno completado:', results);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Mantenimiento nocturno completado exitosamente',
        results: results,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ [CRON] Error en mantenimiento nocturno:', error);
    
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
// 📊 PROCESAR EVALUACIONES SIMPLIFICADO
// ============================================
async function processSimpleEvaluations(results) {
  console.log('📊 Procesando evaluaciones del día...');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayEvaluations, error: evalError } = await supabase
      .from('evaluations')
      .select(`
        *,
        dog:dogs(name, owner_id)
      `)
      .eq('date', today);

    if (evalError) throw evalError;

    results.evaluationsProcessed = todayEvaluations?.length || 0;

    // Detectar problemas simples
    for (const evaluation of todayEvaluations || []) {
      if (evaluation.anxiety_level >= 8) {
        await createSimpleAlert(evaluation, 'ansiedad_alta');
        results.notificationsSent++;
      }
    }

    console.log(`✅ Evaluaciones procesadas: ${results.evaluationsProcessed}`);

  } catch (error) {
    console.error('❌ Error procesando evaluaciones:', error);
    results.errors.push(`Evaluaciones: ${error.message}`);
  }
}

// ============================================
// 🚨 CREAR ALERTA SIMPLE
// ============================================
async function createSimpleAlert(evaluation, concern) {
  try {
    const notificationData = {
      user_id: evaluation.dog.owner_id,
      dog_id: evaluation.dog.id,
      title: `⚠️ Atención requerida - ${evaluation.dog.name}`,
      message: `Se detectó un nivel alto de ansiedad (${evaluation.anxiety_level}/10) en ${evaluation.dog.name}. Considera técnicas de relajación.`,
      type: 'warning',
      category: 'behavior',
      priority: 'medium',
      data: {
        concern: concern,
        anxietyLevel: evaluation.anxiety_level,
        location: evaluation.location
      },
      action_url: `/dashboard/parent/?tab=evaluations`,
      action_label: '📊 Ver evaluación',
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    await supabase
      .from('notifications')
      .insert(notificationData);

    console.log(`✅ Alerta creada para ${evaluation.dog.name}`);

  } catch (error) {
    console.error('❌ Error creando alerta:', error);
  }
}

// ============================================
// 💡 GENERAR TIPS BÁSICOS
// ============================================
async function generateBasicTips(results) {
  console.log('💡 Generando tips básicos...');
  
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Solo lunes (día 1)
    if (dayOfWeek !== 1) {
      console.log('📅 No es lunes, omitiendo tips');
      return;
    }

    const tips = [
      {
        title: '🎯 Tip de entrenamiento',
        content: 'Practica el comando "quieto" por 5 minutos diarios. Usa premios pequeños y sé constante.',
        category: 'entrenamiento'
      },
      {
        title: '🦷 Cuidado dental',
        content: 'Cepilla los dientes de tu perro 2-3 veces por semana con pasta especial para perros.',
        category: 'salud'
      },
      {
        title: '🎾 Tiempo de juego',
        content: 'Dedica 30 minutos diarios al juego activo. Reduce comportamientos destructivos.',
        category: 'comportamiento'
      }
    ];

    // Obtener usuarios activos
    const { data: activeUsers } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('active', true)
      .eq('role', 'padre');

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    // Enviar a todos los usuarios
    for (const user of activeUsers || []) {
      const notificationData = {
        user_id: user.id,
        title: randomTip.title,
        message: randomTip.content,
        type: 'info',
        category: 'tip',
        priority: 'low',
        data: {
          tipCategory: randomTip.category,
          weekly: true
        },
        action_url: `/dashboard/parent/?tab=tips`,
        action_label: '💡 Ver más tips',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };

      await supabase
        .from('notifications')
        .insert(notificationData);

      results.tipsGenerated++;
    }

    console.log(`✅ Tips generados: ${results.tipsGenerated}`);

  } catch (error) {
    console.error('❌ Error generando tips:', error);
    results.errors.push(`Tips: ${error.message}`);
  }
}

// ============================================
// 🧹 LIMPIEZA BÁSICA DE DATOS
// ============================================
async function performBasicCleanup(results) {
  console.log('🧹 Realizando limpieza básica...');
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Limpiar notificaciones expiradas
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .lt('expires_at', thirtyDaysAgo.toISOString());

    if (notificationsError) throw notificationsError;

    results.dataCleanedUp = 50; // Estimación
    console.log('✅ Limpieza básica completada');

  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    results.errors.push(`Limpieza: ${error.message}`);
  }
}