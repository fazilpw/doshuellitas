// netlify/functions/daily-maintenance.js
// 🔧 ENDPOINT PARA CRON-JOB.ORG - MANTENIMIENTO DIARIO DEL SISTEMA
// Llamada automática: Todos los días a las 11:00 PM

const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY, 
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async (event, context) => {
  console.log('🔧 [CRON] Mantenimiento diario del sistema iniciado...');
  
  try {
    const results = {
      evaluationsProcessed: 0,
      inactiveUsersFound: 0,
      tipsGenerated: 0,
      reportsCreated: 0,
      cleanupCompleted: false,
      errors: []
    };

    // ============================================
    // 📊 PROCESAR EVALUACIONES DEL DÍA
    // ============================================
    await processEvaluationsInsights(results);

    // ============================================
    // 💡 GENERAR TIPS EDUCATIVOS SEMANALES
    // ============================================
    await generateEducationalTips(results);

    // ============================================
    // 📈 CREAR REPORTES AUTOMÁTICOS SEMANALES
    // ============================================
    await createWeeklyReports(results);

    // ============================================
    // 🧹 LIMPIEZA DE DATOS
    // ============================================
    await performDataCleanup(results);

    // ============================================
    // 👥 DETECTAR USUARIOS INACTIVOS
    // ============================================
    await checkInactiveUsers(results);

    // ============================================
    // 📝 LOG FINAL usando notification_logs
    // ============================================
    await supabase.from('notification_logs').insert({
      user_id: null,
      title: 'Mantenimiento diario completado',
      body: `Evaluaciones: ${results.evaluationsProcessed}, Tips: ${results.tipsGenerated}, Reportes: ${results.reportsCreated}`,
      category: 'general',
      priority: 'low',
      delivery_status: 'sent'
    });

    console.log('✅ [CRON] Mantenimiento diario completado:', results);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Mantenimiento diario completado',
        results
      })
    };

  } catch (error) {
    console.error('❌ [CRON] Error en mantenimiento diario:', error);
    
    await supabase.from('notification_logs').insert({
      user_id: null,
      title: 'Error en mantenimiento diario',
      body: error.message,
      category: 'general',
      priority: 'high',
      delivery_status: 'failed',
      delivery_error: error.message
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
// 📊 PROCESAR INSIGHTS DE EVALUACIONES
// ============================================
async function processEvaluationsInsights(results) {
  console.log('📊 Procesando insights de evaluaciones...');
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Obtener evaluaciones del día
    const { data: todayEvaluations, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        dog:dogs(id, name, owner_id),
        evaluator:profiles(full_name, role)
      `)
      .eq('date', today);

    if (error) throw error;

    results.evaluationsProcessed = todayEvaluations?.length || 0;

    // Analizar patrones por perro
    const dogInsights = {};
    
    for (const evaluation of todayEvaluations || []) {
      const dogId = evaluation.dog_id;
      
      if (!dogInsights[dogId]) {
        dogInsights[dogId] = {
          dogName: evaluation.dog.name,
          ownerId: evaluation.dog.owner_id,
          houseEvals: [],
          schoolEvals: [],
          trends: {}
        };
      }
      
      if (evaluation.location === 'casa') {
        dogInsights[dogId].houseEvals.push(evaluation);
      } else {
        dogInsights[dogId].schoolEvals.push(evaluation);
      }
    }

    // Generar insights específicos y notificar padres
    for (const dogId in dogInsights) {
      const insight = dogInsights[dogId];
      const personalizedTips = await generatePersonalizedTips(insight);
      
      if (personalizedTips.length > 0) {
        await sendPersonalizedInsights(insight.ownerId, insight.dogName, personalizedTips);
      }
    }

  } catch (error) {
    console.error('❌ Error procesando evaluaciones:', error);
    results.errors.push('Evaluations processing failed');
  }
}

// ============================================
// 💡 GENERAR TIPS EDUCATIVOS SEMANALES
// ============================================
async function generateEducationalTips(results) {
  console.log('💡 Generando tips educativos...');
  
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  
  // Solo generar tips los lunes, miércoles y viernes
  if (![1, 3, 5].includes(dayOfWeek)) {
    console.log('⏭️ No es día de tips educativos');
    return;
  }

  const tipCategories = {
    1: 'obedience', // Lunes: Obediencia
    3: 'exercise',  // Miércoles: Ejercicio y estimulación
    5: 'health'     // Viernes: Salud y bienestar
  };

  const category = tipCategories[dayOfWeek];
  const tips = getTipsByCategory(category);
  
  try {
    // Obtener todos los usuarios padre activos
    const { data: activeParents, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'padre')
      .eq('active', true);

    if (error) throw error;

    // Enviar tip semanal usando scheduled_notifications y templates existentes
    for (const parent of activeParents || []) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      
      await supabase.from('scheduled_notifications').insert({
        user_id: parent.id,
        template_key: 'educational_tip',
        variables: {
          tipTitle: randomTip.title,
          tipContent: randomTip.content,
          category: category
        },
        scheduled_for: new Date().toISOString()
      });

      results.tipsGenerated++;
    }

  } catch (error) {
    console.error('❌ Error generando tips:', error);
    results.errors.push('Tips generation failed');
  }
}

// ============================================
// 📈 CREAR REPORTES SEMANALES AUTOMÁTICOS
// ============================================
async function createWeeklyReports(results) {
  const today = new Date();
  
  // Solo crear reportes los domingos
  if (today.getDay() !== 0) {
    console.log('⏭️ No es día de reportes semanales');
    return;
  }

  console.log('📈 Creando reportes semanales...');
  
  try {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    
    // Obtener datos de la semana
    const { data: weeklyEvaluations, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        dog:dogs(id, name, owner_id)
      `)
      .gte('date', weekStart.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0]);

    if (error) throw error;

    // Agrupar por perro y generar reportes individuales
    const dogReports = {};
    
    for (const evaluation of weeklyEvaluations || []) {
      const dogId = evaluation.dog_id;
      
      if (!dogReports[dogId]) {
        dogReports[dogId] = {
          dogName: evaluation.dog.name,
          ownerId: evaluation.dog.owner_id,
          evaluations: [],
          weeklyStats: {}
        };
      }
      
      dogReports[dogId].evaluations.push(evaluation);
    }

    // Crear y enviar reportes usando scheduled_notifications
    for (const dogId in dogReports) {
      const report = dogReports[dogId];
      const weeklyStats = calculateWeeklyStats(report.evaluations);
      
      // Enviar notificación del reporte usando template
      await supabase.from('scheduled_notifications').insert({
        user_id: report.ownerId,
        dog_id: dogId,
        template_key: 'weekly_report',
        variables: {
          dogName: report.dogName,
          weekStart: weekStart.toISOString().split('T')[0],
          overallProgress: weeklyStats.overallProgress,
          totalEvaluations: report.evaluations.length
        },
        scheduled_for: new Date().toISOString()
      });

      results.reportsCreated++;
    }

  } catch (error) {
    console.error('❌ Error creando reportes:', error);
    results.errors.push('Weekly reports failed');
  }
}

// ============================================
// 🧹 LIMPIEZA DE DATOS
// ============================================
async function performDataCleanup(results) {
  console.log('🧹 Realizando limpieza de datos...');
  
  try {
    // Limpiar notification_logs antiguos (más de 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    await supabase
      .from('notification_logs')
      .delete()
      .lt('sent_at', thirtyDaysAgo.toISOString());

    // Limpiar scheduled_notifications enviadas (más de 60 días)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    
    await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('status', 'sent')
      .lt('sent_at', sixtyDaysAgo.toISOString());

    // Marcar suscripciones push inactivas (más de 90 días sin uso)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .lt('last_used_at', ninetyDaysAgo.toISOString());

    results.cleanupCompleted = true;

  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    results.errors.push('Data cleanup failed');
  }
}

// ============================================
// 👥 DETECTAR USUARIOS INACTIVOS
// ============================================
async function checkInactiveUsers(results) {
  console.log('👥 Verificando usuarios inactivos...');
  
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: inactiveUsers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, updated_at')
      .eq('role', 'padre')
      .eq('active', true)
      .lt('updated_at', sevenDaysAgo.toISOString());

    if (error) throw error;

    results.inactiveUsersFound = inactiveUsers?.length || 0;

    // Enviar recordatorio suave usando scheduled_notifications
    for (const user of inactiveUsers || []) {
      await supabase.from('scheduled_notifications').insert({
        user_id: user.id,
        template_key: 'reengagement_reminder',
        variables: {
          userName: user.full_name || 'amigo'
        },
        scheduled_for: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Error verificando usuarios inactivos:', error);
    results.errors.push('Inactive users check failed');
  }
}

// ============================================
// 🔧 FUNCIONES AUXILIARES
// ============================================
function getTipsByCategory(category) {
  const tipDatabase = {
    obedience: [
      {
        id: 'ob1',
        title: 'Comando "Quieto"',
        content: 'Practica el comando "quieto" 5 minutos diarios. Usa premio inmediato cuando obedezca. La consistencia es clave.'
      },
      {
        id: 'ob2', 
        title: 'Caminar con Correa',
        content: 'Si tu perro tira de la correa, para inmediatamente. Solo avanza cuando la correa esté suelta. Paciencia y constancia.'
      }
    ],
    exercise: [
      {
        id: 'ex1',
        title: 'Estimulación Mental',
        content: 'Esconde premios por la casa para que los busque. 10 minutos de búsqueda equivalen a 30 minutos de caminata física.'
      },
      {
        id: 'ex2',
        title: 'Juegos Interactivos',
        content: 'Usa juguetes rompecabezas durante las comidas. Estimula su mente mientras come más lentamente.'
      }
    ],
    health: [
      {
        id: 'he1',
        title: 'Revisión Dental',
        content: 'Revisa sus dientes semanalmente. El 80% de los perros mayores a 3 años tienen problemas dentales.'
      },
      {
        id: 'he2',
        title: 'Hidratación',
        content: 'Un perro necesita 50-100ml de agua por kg de peso diariamente. Mantén siempre agua fresca disponible.'
      }
    ]
  };

  return tipDatabase[category] || [];
}

async function generatePersonalizedTips(insight) {
  const tips = [];
  
  // Analizar tendencias y generar tips específicos
  if (insight.houseEvals.length > 0 && insight.schoolEvals.length > 0) {
    const houseAvg = insight.houseEvals.reduce((sum, eval) => sum + eval.anxiety_level, 0) / insight.houseEvals.length;
    const schoolAvg = insight.schoolEvals.reduce((sum, eval) => sum + eval.anxiety_level, 0) / insight.schoolEvals.length;
    
    if (houseAvg > schoolAvg + 2) {
      tips.push({
        type: 'anxiety_home',
        message: `${insight.dogName} muestra más ansiedad en casa que en el colegio. Intenta crear rutinas más estructuradas en casa.`
      });
    }
  }
  
  return tips;
}

function calculateWeeklyStats(evaluations) {
  if (!evaluations.length) return { overallProgress: 'Sin datos' };
  
  const metrics = ['energy_level', 'sociability_level', 'obedience_level', 'anxiety_level'];
  const stats = {};
  
  metrics.forEach(metric => {
    const values = evaluations.map(e => e[metric]).filter(v => v !== null);
    if (values.length > 0) {
      stats[metric] = {
        average: Math.round(values.reduce((sum, val) => sum + val, 0) / values.length),
        trend: values.length > 1 ? (values[values.length - 1] - values[0] > 0 ? 'mejorando' : 'estable') : 'estable'
      };
    }
  });
  
  const overallAvg = Object.values(stats).reduce((sum, stat) => sum + stat.average, 0) / Object.keys(stats).length;
  
  return {
    ...stats,
    overallProgress: overallAvg > 7 ? 'Excelente' : overallAvg > 5 ? 'Bueno' : 'Necesita atención'
  };
}

async function sendPersonalizedInsights(ownerId, dogName, tips) {
  for (const tip of tips) {
    await supabase.from('scheduled_notifications').insert({
      user_id: ownerId,
      template_key: 'personalized_insight',
      variables: {
        dogName: dogName,
        insightMessage: tip.message,
        insightType: tip.type
      },
      scheduled_for: new Date().toISOString()
    });
  }
}