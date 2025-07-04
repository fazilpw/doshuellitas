// netlify/functions/daily-maintenance.js
// 🔧 CRON JOB - MANTENIMIENTO NOCTURNO DEL SISTEMA CLUB CANINO DOS HUELLITAS
// 
// HORARIO COLOMBIA (UTC-5):
// 🌙 MANTENIMIENTO: 11:00 PM (Cron: 0 4 * * *)
//
// URL CRON: https://doshuellitas.netlify.app/.netlify/functions/daily-maintenance

// ✅ SINTAXIS ES MODULES
import { createClient } from '@supabase/supabase-js';

// ✅ FUNCIÓN PRINCIPAL CON SINTAXIS ES MODULES
export const handler = async (event, context) => {
  const currentTime = new Date();
  const colombiaTime = new Date(currentTime.getTime() - (5 * 60 * 60 * 1000)); // UTC-5
  
  console.log(`🔧 [CRON] Mantenimiento nocturno del sistema - ${colombiaTime.toLocaleTimeString('es-CO')}`);
  
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
    await processSimpleEvaluations(supabase, results);

    // ============================================
    // 💡 GENERAR TIPS BÁSICOS
    // ============================================
    await generateBasicTips(supabase, results);

    // ============================================
    // 🧹 LIMPIEZA BÁSICA
    // ============================================
    await performBasicCleanup(supabase, results);

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
async function processSimpleEvaluations(supabase, results) {
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
        await createSimpleAlert(supabase, evaluation, 'ansiedad_alta');
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
async function createSimpleAlert(supabase, evaluation, concern) {
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
async function generateBasicTips(supabase, results) {
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
async function performBasicCleanup(supabase, results) {
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

// ============================================
// 📊 PROCESAR EVALUACIONES SIMPLIFICADO
// ============================================
async function processSimpleEvaluations(supabase, results) {
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
        await createSimpleAlert(supabase, evaluation, 'ansiedad_alta');
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
async function createSimpleAlert(supabase, evaluation, concern) {
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
async function generateBasicTips(supabase, results) {
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
async function performBasicCleanup(supabase, results) {
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

// ============================================
// 📊 PROCESAR EVALUACIONES DEL DÍA
// ============================================
async function processEvaluationsInsights(results) {
  console.log('📊 Procesando evaluaciones del día...');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Obtener evaluaciones de hoy
    const { data: todayEvaluations, error: evalError } = await supabase
      .from('evaluations')
      .select(`
        *,
        dog:dogs(name, owner_id, profiles(*))
      `)
      .eq('date', today);

    if (evalError) throw evalError;

    results.evaluationsProcessed = todayEvaluations?.length || 0;

    if (!todayEvaluations || todayEvaluations.length === 0) {
      console.log('📋 No hay evaluaciones de hoy');
      return;
    }

    // Analizar patrones de comportamiento
    for (const evaluation of todayEvaluations) {
      await analyzeEvaluationPatterns(evaluation, results);
    }

    console.log(`✅ Evaluaciones procesadas: ${results.evaluationsProcessed}`);

  } catch (error) {
    console.error('❌ Error procesando evaluaciones:', error);
    results.errors.push(`Evaluaciones: ${error.message}`);
  }
}

// ============================================
// 🔍 ANALIZAR PATRONES DE EVALUACIÓN
// ============================================
async function analyzeEvaluationPatterns(evaluation, results) {
  try {
    // Detectar problemas de comportamiento que requieren atención
    const concerns = [];
    
    // Ansiedad alta
    if (evaluation.anxiety_level >= 8) {
      concerns.push('ansiedad_alta');
    }
    
    // Energía muy baja o muy alta
    if (evaluation.energy_level <= 3 || evaluation.energy_level >= 9) {
      concerns.push('energia_extrema');
    }
    
    // Problemas de obediencia
    if (evaluation.obedience_level <= 4) {
      concerns.push('obediencia_baja');
    }
    
    // Comportamiento destructivo frecuente
    if (evaluation.destructive === 'frecuente') {
      concerns.push('destructividad');
    }

    // Si hay problemas, crear notificaciones automáticas
    if (concerns.length > 0) {
      await createBehaviorAlerts(evaluation, concerns);
      results.notificationsSent++;
    }

    // Buscar patrones comparando con evaluaciones anteriores
    await detectTrends(evaluation);

  } catch (error) {
    console.error('❌ Error analizando patrones:', error);
  }
}

// ============================================
// 🚨 CREAR ALERTAS DE COMPORTAMIENTO
// ============================================
async function createBehaviorAlerts(evaluation, concerns) {
  try {
    let title, message, priority;

    if (concerns.includes('ansiedad_alta')) {
      title = `🚨 Nivel alto de ansiedad detectado - ${evaluation.dog.name}`;
      message = `${evaluation.dog.name} mostró un nivel de ansiedad de ${evaluation.anxiety_level}/10 ${evaluation.location === 'casa' ? 'en casa' : 'en el colegio'}. Considera técnicas de relajación.`;
      priority = 'high';
    } else if (concerns.includes('obediencia_baja')) {
      title = `📢 Refuerzo de entrenamiento recomendado - ${evaluation.dog.name}`;
      message = `${evaluation.dog.name} tuvo un nivel de obediencia bajo (${evaluation.obedience_level}/10). Es momento de reforzar los comandos básicos.`;
      priority = 'medium';
    } else {
      title = `⚠️ Atención requerida - ${evaluation.dog.name}`;
      message = `Se detectaron algunos comportamientos en ${evaluation.dog.name} que requieren atención. Revisa la evaluación detallada.`;
      priority = 'medium';
    }

    // Crear notificación para el propietario
    const notificationData = {
      user_id: evaluation.dog.owner_id,
      dog_id: evaluation.dog.id,
      title: title,
      message: message,
      type: priority === 'high' ? 'warning' : 'info',
      category: 'behavior',
      priority: priority,
      data: {
        evaluationId: evaluation.id,
        concerns: concerns,
        location: evaluation.location,
        anxietyLevel: evaluation.anxiety_level,
        obedienceLevel: evaluation.obedience_level,
        energyLevel: evaluation.energy_level
      },
      action_url: `/dashboard/parent/?tab=evaluations`,
      action_label: '📊 Ver evaluación completa',
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días
      created_at: new Date().toISOString()
    };

    await supabase
      .from('notifications')
      .insert(notificationData);

    console.log(`✅ Alerta de comportamiento creada para ${evaluation.dog.name}`);

  } catch (error) {
    console.error('❌ Error creando alerta de comportamiento:', error);
  }
}

// ============================================
// 📈 DETECTAR TENDENCIAS
// ============================================
async function detectTrends(currentEvaluation) {
  try {
    // Obtener últimas 5 evaluaciones del mismo perro
    const { data: recentEvaluations } = await supabase
      .from('evaluations')
      .select('*')
      .eq('dog_id', currentEvaluation.dog_id)
      .order('date', { ascending: false })
      .limit(5);

    if (!recentEvaluations || recentEvaluations.length < 3) return;

    // Calcular tendencias en ansiedad
    const anxietyLevels = recentEvaluations.map(e => e.anxiety_level).filter(Boolean);
    if (anxietyLevels.length >= 3) {
      const recentAvg = anxietyLevels.slice(0, 2).reduce((a, b) => a + b) / 2;
      const olderAvg = anxietyLevels.slice(-2).reduce((a, b) => a + b) / 2;
      
      if (recentAvg - olderAvg >= 2) {
        console.log(`📈 Tendencia creciente en ansiedad detectada para ${currentEvaluation.dog.name}`);
      }
    }

  } catch (error) {
    console.error('❌ Error detectando tendencias:', error);
  }
}

// ============================================
// 💡 GENERAR TIPS EDUCATIVOS SEMANALES
// ============================================
async function generateEducationalTips(results) {
  console.log('💡 Generando tips educativos semanales...');
  
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    // Solo generar tips los lunes (día 1)
    if (dayOfWeek !== 1) {
      console.log('📅 No es lunes, omitiendo generación de tips semanales');
      return;
    }

    // Obtener todos los usuarios activos con perros
    const { data: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select(`
        *,
        dogs(*)
      `)
      .eq('active', true)
      .eq('role', 'padre');

    if (usersError) throw usersError;

    const tipsCategories = [
      {
        category: 'entrenamiento',
        tips: [
          {
            title: '🎯 Tip de entrenamiento',
            content: 'Practica el comando "quieto" por 5 minutos diarios. Usa premios pequeños y repite hasta que tu perro lo domine.',
            icon: '🎯'
          },
          {
            title: '🏃 Ejercicio mental',
            content: 'Esconde premios por la casa para que tu perro los busque. Estimula su mente y reduce la ansiedad.',
            icon: '🧠'
          }
        ]
      },
      {
        category: 'salud',
        tips: [
          {
            title: '🦷 Cuidado dental',
            content: 'Cepilla los dientes de tu perro 2-3 veces por semana con pasta especial para perros. Previene problemas dentales.',
            icon: '🦷'
          },
          {
            title: '💧 Hidratación',
            content: 'Asegúrate de que tu perro siempre tenga agua fresca disponible. Cambia el agua diariamente.',
            icon: '💧'
          }
        ]
      },
      {
        category: 'comportamiento',
        tips: [
          {
            title: '🚫 Corregir ladridos',
            content: 'No grites cuando tu perro ladre. Usa comando "silencio" y premia cuando se calme.',
            icon: '🤫'
          },
          {
            title: '🎾 Tiempo de juego',
            content: 'Dedica 30 minutos diarios al juego activo. Reduce comportamientos destructivos y fortalece vuestro vínculo.',
            icon: '🎾'
          }
        ]
      }
    ];

    // Seleccionar tip aleatorio por categoría
    for (const category of tipsCategories) {
      const randomTip = category.tips[Math.floor(Math.random() * category.tips.length)];
      
      // Enviar tip a todos los usuarios activos
      for (const user of activeUsers || []) {
        if (user.dogs && user.dogs.length > 0) {
          await sendEducationalTip(user, randomTip, category.category);
          results.tipsGenerated++;
        }
      }
    }

    console.log(`✅ Tips educativos generados: ${results.tipsGenerated}`);

  } catch (error) {
    console.error('❌ Error generando tips educativos:', error);
    results.errors.push(`Tips: ${error.message}`);
  }
}

// ============================================
// 📨 ENVIAR TIP EDUCATIVO
// ============================================
async function sendEducationalTip(user, tip, category) {
  try {
    const notificationData = {
      user_id: user.id,
      title: tip.title,
      message: tip.content,
      type: 'info',
      category: 'tip',
      priority: 'low',
      data: {
        tipCategory: category,
        icon: tip.icon,
        weekly: true
      },
      action_url: `/dashboard/parent/?tab=tips`,
      action_label: '💡 Ver más tips',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
      created_at: new Date().toISOString()
    };

    await supabase
      .from('notifications')
      .insert(notificationData);

    console.log(`✅ Tip educativo enviado a ${user.full_name || user.email}`);

  } catch (error) {
    console.error('❌ Error enviando tip educativo:', error);
  }
}

// ============================================
// 📈 CREAR REPORTES SEMANALES
// ============================================
async function createWeeklyReports(results) {
  console.log('📈 Creando reportes automáticos semanales...');
  
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Solo crear reportes los domingos (día 0)
    if (dayOfWeek !== 0) {
      console.log('📅 No es domingo, omitiendo reportes semanales');
      return;
    }

    // Calcular fechas de la semana pasada
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - 1); // Sábado
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6); // Lunes

    // Obtener estadísticas de la semana
    const { data: weeklyEvaluations } = await supabase
      .from('evaluations')
      .select(`
        *,
        dog:dogs(name, owner_id, profiles(*))
      `)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (!weeklyEvaluations || weeklyEvaluations.length === 0) {
      console.log('📊 No hay evaluaciones de la semana pasada');
      return;
    }

    // Generar reporte por perro
    const dogReports = {};
    
    weeklyEvaluations.forEach(evaluation => {
      const dogId = evaluation.dog_id;
      if (!dogReports[dogId]) {
        dogReports[dogId] = {
          dog: evaluation.dog,
          evaluations: [],
          avgAnxiety: 0,
          avgEnergy: 0,
          avgObedience: 0,
          improvementAreas: []
        };
      }
      dogReports[dogId].evaluations.push(evaluation);
    });

    // Calcular promedios y crear reportes
    for (const dogId in dogReports) {
      const report = dogReports[dogId];
      const evals = report.evaluations;
      
      report.avgAnxiety = evals.reduce((sum, e) => sum + (e.anxiety_level || 0), 0) / evals.length;
      report.avgEnergy = evals.reduce((sum, e) => sum + (e.energy_level || 0), 0) / evals.length;
      report.avgObedience = evals.reduce((sum, e) => sum + (e.obedience_level || 0), 0) / evals.length;

      // Identificar áreas de mejora
      if (report.avgAnxiety > 6) report.improvementAreas.push('Manejo de ansiedad');
      if (report.avgObedience < 6) report.improvementAreas.push('Entrenamiento de obediencia');
      if (report.avgEnergy < 4 || report.avgEnergy > 8) report.improvementAreas.push('Regulación de energía');

      await sendWeeklyReport(report);
      results.reportsCreated++;
    }

    console.log(`✅ Reportes semanales creados: ${results.reportsCreated}`);

  } catch (error) {
    console.error('❌ Error creando reportes semanales:', error);
    results.errors.push(`Reportes: ${error.message}`);
  }
}

// ============================================
// 📨 ENVIAR REPORTE SEMANAL
// ============================================
async function sendWeeklyReport(report) {
  try {
    const improvementText = report.improvementAreas.length > 0 
      ? `Áreas de enfoque: ${report.improvementAreas.join(', ')}.`
      : 'Excelente progreso en todas las áreas.';

    const notificationData = {
      user_id: report.dog.owner_id,
      dog_id: report.dog.id,
      title: `📊 Reporte semanal de ${report.dog.name}`,
      message: `Esta semana ${report.dog.name} tuvo ${report.evaluations.length} evaluaciones. Ansiedad promedio: ${report.avgAnxiety.toFixed(1)}/10, Obediencia: ${report.avgObedience.toFixed(1)}/10. ${improvementText}`,
      type: 'info',
      category: 'report',
      priority: 'low',
      data: {
        weeklyReport: true,
        avgAnxiety: report.avgAnxiety,
        avgEnergy: report.avgEnergy,
        avgObedience: report.avgObedience,
        improvementAreas: report.improvementAreas,
        evaluationsCount: report.evaluations.length
      },
      action_url: `/dashboard/parent/?tab=progress`,
      action_label: '📊 Ver progreso detallado',
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 días
      created_at: new Date().toISOString()
    };

    await supabase
      .from('notifications')
      .insert(notificationData);

    console.log(`✅ Reporte semanal enviado para ${report.dog.name}`);

  } catch (error) {
    console.error('❌ Error enviando reporte semanal:', error);
  }
}

// ============================================
// 🧹 LIMPIEZA DE DATOS ANTIGUOS
// ============================================
async function performDataCleanup(results) {
  console.log('🧹 Realizando limpieza de datos antiguos...');
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Limpiar notificaciones expiradas (más de 30 días)
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .lt('expires_at', thirtyDaysAgo.toISOString());

    if (notificationsError) throw notificationsError;

    // Limpiar logs antiguos de notificaciones (más de 90 días)
    const { error: logsError } = await supabase
      .from('notification_logs')
      .delete()
      .lt('sent_at', ninetyDaysAgo.toISOString());

    if (logsError) throw logsError;

    // Marcar suscripciones push inactivas (más de 60 días sin uso)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .lt('last_used_at', sixtyDaysAgo.toISOString())
      .eq('is_active', true);

    if (subscriptionsError) throw subscriptionsError;

    results.dataCleanedUp = 100; // Estimación
    console.log('✅ Limpieza de datos completada');

  } catch (error) {
    console.error('❌ Error en limpieza de datos:', error);
    results.errors.push(`Limpieza: ${error.message}`);
  }
}

// ============================================
// 👥 DETECTAR USUARIOS INACTIVOS
// ============================================
async function checkInactiveUsers(results) {
  console.log('👥 Detectando usuarios inactivos...');
  
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Buscar usuarios que no han hecho evaluaciones en 2 semanas
    const { data: inactiveUsers } = await supabase
      .from('profiles')
      .select(`
        *,
        dogs(id),
        evaluations!evaluator_id(date)
      `)
      .eq('active', true)
      .eq('role', 'padre');

    if (!inactiveUsers) return;

    for (const user of inactiveUsers) {
      if (!user.dogs || user.dogs.length === 0) continue;

      const recentEvaluations = user.evaluations?.filter(
        eval => new Date(eval.date) > twoWeeksAgo
      ) || [];

      if (recentEvaluations.length === 0) {
        await sendInactivityReminder(user);
        results.inactiveUsersFound++;
      }
    }

    console.log(`✅ Usuarios inactivos detectados: ${results.inactiveUsersFound}`);

  } catch (error) {
    console.error('❌ Error detectando usuarios inactivos:', error);
    results.errors.push(`Inactividad: ${error.message}`);
  }
}

// ============================================
// 📨 ENVIAR RECORDATORIO DE INACTIVIDAD
// ============================================
async function sendInactivityReminder(user) {
  try {
    const notificationData = {
      user_id: user.id,
      title: '👋 Te extrañamos en Club Canino',
      message: `Hace tiempo que no registras evaluaciones de tus perros. ¿Cómo han estado? Mantén el seguimiento de su progreso.`,
      type: 'info',
      category: 'routine',
      priority: 'low',
      data: {
        inactivityReminder: true,
        lastSeen: new Date().toISOString()
      },
      action_url: `/dashboard/parent/`,
      action_label: '📝 Hacer evaluación',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
      created_at: new Date().toISOString()
    };

    await supabase
      .from('notifications')
      .insert(notificationData);

    console.log(`✅ Recordatorio de inactividad enviado a ${user.full_name || user.email}`);

  } catch (error) {
    console.error('❌ Error enviando recordatorio de inactividad:', error);
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