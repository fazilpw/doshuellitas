// ============================================
// 🔔 INTEGRACIÓN REAL DE NOTIFICACIONES
// ============================================

// 1. CREAR HELPER DE NOTIFICACIONES
// src/utils/notificationHelper.js

import supabase from '../lib/supabase.js';

export class NotificationHelper {
  
  // ============================================
  // 🎯 NOTIFICACIONES DE COMPORTAMIENTO
  // ============================================
  
  static async checkBehaviorAlertsAfterEvaluation(evaluation, dog, evaluator) {
    console.log('🔍 Verificando alertas de comportamiento...');
    
    try {
      // 1. ANSIEDAD ALTA (>= 8)
      if (evaluation.anxiety_level >= 8) {
        await supabase.rpc('create_notification_from_template', {
          user_id_param: dog.owner_id,
          dog_id_param: dog.id,
          template_key_param: 'behavior_alert',
          variables_param: {
            dogName: dog.name,
            behavior: 'ansiedad alta',
            recommendation: 'practicar ejercicios de relajación y evitar lugares muy concurridos'
          }
        });
        console.log(`🚨 Alerta ansiedad enviada para ${dog.name}`);
      }

      // 2. OBEDIENCIA MEJORADA (>= 8 y era menor antes)
      if (evaluation.obedience_level >= 8) {
        // Buscar evaluación anterior para comparar
        const { data: prevEvaluation } = await supabase
          .from('evaluations')
          .select('obedience_level')
          .eq('dog_id', dog.id)
          .neq('id', evaluation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!prevEvaluation || prevEvaluation.obedience_level < 6) {
          await supabase.rpc('create_notification_from_template', {
            user_id_param: dog.owner_id,
            dog_id_param: dog.id,
            template_key_param: 'behavior_improvement',
            variables_param: {
              dogName: dog.name,
              area: 'obediencia',
              details: `¡Ha mejorado de ${prevEvaluation?.obedience_level || 'N/A'} a ${evaluation.obedience_level}! Sigue con el buen trabajo.`
            }
          });
          console.log(`🎉 Mejora obediencia enviada para ${dog.name}`);
        }
      }

      // 3. SOCIALIZACIÓN EXCELENTE (>= 9)
      if (evaluation.sociability_level >= 9) {
        await supabase.rpc('create_notification_from_template', {
          user_id_param: dog.owner_id,
          dog_id_param: dog.id,
          template_key_param: 'behavior_improvement',
          variables_param: {
            dogName: dog.name,
            area: 'socialización',
            details: '¡Socialización excelente hoy! Es un ejemplo para otros perros.'
          }
        });
        console.log(`🌟 Socialización excelente enviada para ${dog.name}`);
      }

      // 4. ENERGÍA MUY ALTA (>= 9) - Sugerir más ejercicio
      if (evaluation.energy_level >= 9) {
        await supabase.rpc('create_notification_from_template', {
          user_id_param: dog.owner_id,
          dog_id_param: dog.id,
          template_key_param: 'behavior_alert',
          variables_param: {
            dogName: dog.name,
            behavior: 'energía muy alta',
            recommendation: 'aumentar tiempo de ejercicio y juegos de estimulación mental'
          }
        });
        console.log(`⚡ Energía alta enviada para ${dog.name}`);
      }

    } catch (error) {
      console.error('❌ Error enviando notificaciones de comportamiento:', error);
    }
  }

  // ============================================
  // 🚐 NOTIFICACIONES DE TRANSPORTE
  // ============================================
  
  static async notifyTransportSequence(vehicleId, dogIds, route) {
    console.log('🚐 Iniciando secuencia de notificaciones de transporte...');
    
    try {
      // Obtener información de los perros
      const { data: dogs } = await supabase
        .from('dogs')
        .select('id, name, owner_id')
        .in('id', dogIds);

      for (const dog of dogs) {
        // 1. NOTIFICAR INICIO DE RUTA
        await supabase.rpc('create_notification_from_template', {
          user_id_param: dog.owner_id,
          dog_id_param: dog.id,
          template_key_param: 'transport_started',
          variables_param: {
            dogName: dog.name,
            eta: '25' // Puedes calcular ETA real basado en ubicación
          }
        });

        // 2. PROGRAMAR NOTIFICACIÓN "ACERCÁNDOSE" (15 minutos después)
        const approachingTime = new Date(Date.now() + 15 * 60 * 1000);
        await supabase.from('scheduled_notifications').insert({
          user_id: dog.owner_id,
          dog_id: dog.id,
          template_key: 'transport_approaching',
          variables: {
            dogName: dog.name,
            minutes: '5'
          },
          scheduled_for: approachingTime.toISOString(),
          status: 'pending'
        });

        // 3. PROGRAMAR NOTIFICACIÓN "RECOGIDO" (20 minutos después)
        const pickedUpTime = new Date(Date.now() + 20 * 60 * 1000);
        await supabase.from('scheduled_notifications').insert({
          user_id: dog.owner_id,
          dog_id: dog.id,
          template_key: 'dog_picked_up',
          variables: {
            dogName: dog.name
          },
          scheduled_for: pickedUpTime.toISOString(),
          status: 'pending'
        });
      }

      console.log(`✅ Secuencia de transporte programada para ${dogs.length} perros`);
    } catch (error) {
      console.error('❌ Error en notificaciones de transporte:', error);
    }
  }

  // ============================================
  // 💊 NOTIFICACIONES MÉDICAS AUTOMÁTICAS
  // ============================================
  
  static async checkMedicalReminders() {
    console.log('💊 Verificando recordatorios médicos...');
    
    try {
      // VACUNAS PRÓXIMAS A VENCER (próximos 7 días)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data: upcomingVaccines } = await supabase
        .from('dog_vaccines')
        .select(`
          *,
          dog:dogs(name, owner_id)
        `)
        .gte('next_due_date', new Date().toISOString().split('T')[0])
        .lte('next_due_date', nextWeek.toISOString().split('T')[0]);

      for (const vaccine of upcomingVaccines) {
        const daysUntil = Math.ceil((new Date(vaccine.next_due_date) - new Date()) / (1000 * 60 * 60 * 24));
        
        await supabase.rpc('create_notification_from_template', {
          user_id_param: vaccine.dog.owner_id,
          dog_id_param: vaccine.dog_id,
          template_key_param: 'vaccine_due_soon',
          variables_param: {
            dogName: vaccine.dog.name,
            vaccineName: vaccine.vaccine_name,
            days: daysUntil.toString()
          }
        });
      }

      // MEDICINAS PARA HOY
      const today = new Date().toISOString().split('T')[0];
      const { data: todayMedicines } = await supabase
        .from('medicines')
        .select(`
          *,
          dog:dogs(name, owner_id)
        `)
        .eq('next_dose_date', today)
        .eq('is_ongoing', true);

      for (const medicine of todayMedicines) {
        await supabase.rpc('create_notification_from_template', {
          user_id_param: medicine.dog.owner_id,
          dog_id_param: medicine.dog_id,
          template_key_param: 'medicine_reminder',
          variables_param: {
            dogName: medicine.dog.name,
            medicineName: medicine.medicine_name,
            dosage: medicine.dosage
          }
        });
      }

      console.log(`✅ Recordatorios médicos enviados: ${upcomingVaccines.length} vacunas, ${todayMedicines.length} medicinas`);
    } catch (error) {
      console.error('❌ Error en recordatorios médicos:', error);
    }
  }

  // ============================================
  // ⏰ RUTINAS Y HORARIOS
  // ============================================
  
  static async scheduleRoutineReminders(dogId, routineType, time) {
    console.log(`⏰ Programando recordatorios de rutina para ${routineType}...`);
    
    try {
      // Obtener información del perro
      const { data: dog } = await supabase
        .from('dogs')
        .select('name, owner_id')
        .eq('id', dogId)
        .single();

      // Calcular próxima hora de la rutina
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [hours, minutes] = time.split(':');
      tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Determinar template y variables según tipo de rutina
      let templateKey = 'routine_reminder';
      let variables = {
        dogName: dog.name,
        routineName: routineType,
        notes: ''
      };

      if (routineType === 'paseo' || routineType === 'ejercicio') {
        templateKey = 'walk_reminder';
        variables = {
          dogName: dog.name,
          duration: '20'
        };
      }

      // Programar notificación recurrente
      await supabase.from('scheduled_notifications').insert({
        user_id: dog.owner_id,
        dog_id: dogId,
        template_key: templateKey,
        variables: variables,
        scheduled_for: tomorrow.toISOString(),
        is_recurring: true,
        recurrence_rule: 'FREQ=DAILY;BYHOUR=' + hours,
        status: 'pending'
      });

      console.log(`✅ Rutina programada: ${routineType} a las ${time} para ${dog.name}`);
    } catch (error) {
      console.error('❌ Error programando rutina:', error);
    }
  }

  // ============================================
  // 📊 TIPS EDUCATIVOS SEMANALES
  // ============================================
  
  static async scheduleWeeklyTips(userId) {
    const tips = [
      'La consistencia es clave en el entrenamiento canino. Practica comandos básicos 5 minutos al día.',
      'Los perros aprenden mejor con sesiones cortas de 5-10 minutos que con sesiones largas.',
      'Recompensar inmediatamente después del comportamiento deseado mejora el aprendizaje.',
      'El ejercicio mental es tan importante como el físico. Prueba juegos de olfato.',
      'Los perros necesitan rutina para sentirse seguros y felices.',
      'La socialización temprana previene problemas de comportamiento en el futuro.',
      'Los comandos básicos (sit, stay, come) pueden salvar la vida de tu perro.'
    ];

    try {
      // Programar tip para el próximo lunes
      const nextMonday = new Date();
      const daysUntilMonday = (1 + 7 - nextMonday.getDay()) % 7 || 7;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0);

      const randomTip = tips[Math.floor(Math.random() * tips.length)];

      await supabase.from('scheduled_notifications').insert({
        user_id: userId,
        template_key: 'weekly_tip',
        variables: { tip: randomTip },
        scheduled_for: nextMonday.toISOString(),
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO',
        status: 'pending'
      });

      console.log('✅ Tip semanal programado para', nextMonday.toLocaleDateString());
    } catch (error) {
      console.error('❌ Error programando tip semanal:', error);
    }
  }
}

// ============================================
// 🔧 FUNCIONES DE UTILIDAD
// ============================================

export const createTestNotification = async (userId, dogId, type = 'transport') => {
  const templates = {
    transport: {
      template_key: 'transport_started',
      variables: { dogName: 'Max', eta: '25' }
    },
    behavior: {
      template_key: 'behavior_alert', 
      variables: { dogName: 'Max', behavior: 'ansiedad alta', recommendation: 'ejercicios de relajación' }
    },
    medical: {
      template_key: 'vaccine_due_soon',
      variables: { dogName: 'Max', vaccineName: 'Rabia', days: '3' }
    },
    improvement: {
      template_key: 'behavior_improvement',
      variables: { dogName: 'Max', area: 'obediencia', details: '¡Ha mejorado mucho!' }
    }
  };

  const config = templates[type];
  
  try {
    const { data, error } = await supabase.rpc('create_notification_from_template', {
      user_id_param: userId,
      dog_id_param: dogId,
      template_key_param: config.template_key,
      variables_param: config.variables
    });

    if (error) throw error;
    console.log(`✅ Notificación de prueba creada: ${config.template_key}`);
    return data;
  } catch (error) {
    console.error('❌ Error creando notificación de prueba:', error);
    throw error;
  }
};