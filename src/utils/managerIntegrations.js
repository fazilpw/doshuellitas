// src/utils/managerIntegrations.js
// 🔗 INTEGRACIONES DIRECTAS PARA MANAGERS - REEMPLAZO DE useNotificationIntegration
// ✅ SIMPLE, DIRECTO, SIN HOOKS COMPLEJOS

import NotificationHelper from './notificationHelper.js';

// ============================================
// 🗓️ INTEGRACIÓN PARA ROUTINE MANAGER
// ============================================

/**
 * Notificar cuando se crea/actualiza una rutina
 * USAR EN: RoutineFormManager.jsx después de guardar exitosamente
 */
export const notifyRoutineCreated = async (routine, schedules, dogId, dogName, currentUserId) => {
  try {
    console.log('📅 Notificando creación de rutina:', routine.name);

    const routineDetails = {
      dogName: dogName,
      routineName: routine.name,
      description: `${routine.category} - ${schedules.length} horarios programados`,
      category: routine.category,
      scheduleCount: schedules.length
    };

    // Crear notificación usando el helper optimizado
    const result = await NotificationHelper.notifyRoutineUpdate(
      dogId,
      'routine_created',
      routineDetails,
      currentUserId
    );

    // Log para debugging
    if (result.success) {
      console.log(`✅ ${result.notifications.length} notificaciones de rutina enviadas`);
    }

    return result;

  } catch (error) {
    console.error('❌ Error en notifyRoutineCreated:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notificar recordatorios de rutina (para usar en cron jobs)
 */
export const notifyRoutineReminder = async (routine, dogId, dogName, userIds) => {
  try {
    console.log('⏰ Notificando recordatorio de rutina:', routine.name);

    const notifications = [];

    for (const userId of userIds) {
      const notification = await NotificationHelper.createDirectNotification(
        userId,
        dogId,
        `⏰ Hora de la rutina de ${dogName}`,
        `Es hora de "${routine.name}" para ${dogName}. ${routine.notes || 'Recuerda seguir las instrucciones.'}`,
        'routine',
        'normal'
      );
      notifications.push(notification);
    }

    console.log(`✅ ${notifications.length} recordatorios de rutina enviados`);
    return { success: true, notifications };

  } catch (error) {
    console.error('❌ Error en notifyRoutineReminder:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// 💉 INTEGRACIÓN PARA VACCINE MANAGER
// ============================================

/**
 * Notificar cuando se programa/actualiza una vacuna
 * USAR EN: VaccineManager.jsx después de guardar exitosamente
 */
export const notifyVaccineScheduled = async (vaccineData, dogName, currentUserId) => {
  try {
    console.log('💉 Notificando programación de vacuna:', vaccineData.vaccine_name);

    const vaccineDetails = {
      dogName: dogName,
      vaccineName: vaccineData.vaccine_name,
      dueDate: vaccineData.next_due_date ? 
        new Date(vaccineData.next_due_date).toLocaleDateString('es-CO') : 'No programada',
      description: vaccineData.administered ? 
        'aplicada exitosamente' : 'programada',
      isUrgent: !vaccineData.administered && vaccineData.next_due_date,
      veterinarian: vaccineData.veterinarian_name,
      clinic: vaccineData.clinic_name
    };

    const result = await NotificationHelper.notifyMedicalUpdate(
      vaccineData.dog_id,
      'vaccine',
      vaccineDetails,
      currentUserId
    );

    if (result.success) {
      console.log(`✅ ${result.notifications.length} notificaciones de vacuna enviadas`);
    }

    return result;

  } catch (error) {
    console.error('❌ Error en notifyVaccineScheduled:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notificar recordatorios de vacunas próximas a vencer
 */
export const notifyVaccineReminder = async (vaccine, dogName, userIds, daysUntilDue) => {
  try {
    console.log('🔔 Notificando recordatorio de vacuna:', vaccine.vaccine_name);

    const notifications = [];
    const urgencyLevel = daysUntilDue <= 3 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'normal';
    const urgencyEmoji = daysUntilDue <= 3 ? '🚨' : daysUntilDue <= 7 ? '⚠️' : '📅';

    for (const userId of userIds) {
      const notification = await NotificationHelper.createDirectNotification(
        userId,
        vaccine.dog_id,
        `${urgencyEmoji} Vacuna de ${dogName} próxima a vencer`,
        `La vacuna ${vaccine.vaccine_name} de ${dogName} vence en ${daysUntilDue} días (${new Date(vaccine.next_due_date).toLocaleDateString('es-CO')}). Programa tu cita veterinaria.`,
        'medical',
        urgencyLevel
      );
      notifications.push(notification);
    }

    console.log(`✅ ${notifications.length} recordatorios de vacuna enviados`);
    return { success: true, notifications };

  } catch (error) {
    console.error('❌ Error en notifyVaccineReminder:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// 💊 INTEGRACIÓN PARA MEDICINE MANAGER
// ============================================

/**
 * Notificar cuando se programa/actualiza una medicina
 * USAR EN: MedicineManager.jsx después de guardar exitosamente
 */
export const notifyMedicineScheduled = async (medicineData, dogName, currentUserId) => {
  try {
    console.log('💊 Notificando programación de medicina:', medicineData.medicine_name);

    const medicineDetails = {
      dogName: dogName,
      medicineName: medicineData.medicine_name,
      dosage: medicineData.dosage,
      frequency: medicineData.frequency,
      description: `${medicineData.medicine_type} - ${medicineData.dosage}, ${medicineData.frequency}`,
      prescribedBy: medicineData.prescribed_by,
      reason: medicineData.reason_for_treatment,
      isOngoing: medicineData.is_ongoing,
      nextDose: medicineData.next_dose_date
    };

    const result = await NotificationHelper.notifyMedicalUpdate(
      medicineData.dog_id,
      'medicine',
      medicineDetails,
      currentUserId
    );

    if (result.success) {
      console.log(`✅ ${result.notifications.length} notificaciones de medicina enviadas`);
    }

    return result;

  } catch (error) {
    console.error('❌ Error en notifyMedicineScheduled:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notificar recordatorios de dosis de medicina
 */
export const notifyMedicineReminder = async (medicine, dogName, userIds) => {
  try {
    console.log('💊 Notificando recordatorio de medicina:', medicine.medicine_name);

    const notifications = [];

    for (const userId of userIds) {
      const notification = await NotificationHelper.createDirectNotification(
        userId,
        medicine.dog_id,
        `💊 Hora de la medicina de ${dogName}`,
        `Es hora de administrar ${medicine.medicine_name} a ${dogName}. Dosis: ${medicine.dosage}. ${medicine.special_instructions || ''}`,
        'medical',
        'medium'
      );
      notifications.push(notification);
    }

    console.log(`✅ ${notifications.length} recordatorios de medicina enviados`);
    return { success: true, notifications };

  } catch (error) {
    console.error('❌ Error en notifyMedicineReminder:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ✂️ INTEGRACIÓN PARA GROOMING MANAGER
// ============================================

/**
 * Notificar cuando se completa un servicio de grooming
 * USAR EN: GroomingManager.jsx después de guardar exitosamente
 */
export const notifyGroomingCompleted = async (groomingData, dogName, currentUserId) => {
  try {
    console.log('✂️ Notificando grooming completado:', groomingData.service_type);

    const groomingDetails = {
      dogName: dogName,
      serviceType: groomingData.service_type,
      description: `${groomingData.service_type} realizado exitosamente`,
      performedBy: groomingData.performed_by || 'Staff del club',
      date: new Date(groomingData.service_date).toLocaleDateString('es-CO'),
      cost: groomingData.cost ? `$${groomingData.cost.toLocaleString()}` : '',
      notes: groomingData.notes || ''
    };

    const result = await NotificationHelper.notifyMedicalUpdate(
      groomingData.dog_id,
      'grooming',
      groomingDetails,
      currentUserId
    );

    if (result.success) {
      console.log(`✅ ${result.notifications.length} notificaciones de grooming enviadas`);
    }

    return result;

  } catch (error) {
    console.error('❌ Error en notifyGroomingCompleted:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// 📊 INTEGRACIÓN PARA EVALUATIONS
// ============================================

/**
 * Notificar cuando se completa una evaluación (ya implementado en NotificationHelper)
 * USAR EN: CompleteEvaluationForm.jsx después de guardar exitosamente
 */
export const notifyEvaluationCompleted = async (evaluation, dog, evaluatorId) => {
  try {
    console.log('📊 Notificando evaluación completada para:', dog.name);

    // Usar la función optimizada del helper
    const result = await NotificationHelper.processEvaluationNotifications(evaluation, dog, evaluatorId);

    console.log(`✅ Evaluación procesada: ${result.behaviorAlerts.length} alertas, ${result.crossRoleNotifications.length} notificaciones cruzadas, ${result.improvementNotifications.length} mejoras`);

    return result;

  } catch (error) {
    console.error('❌ Error en notifyEvaluationCompleted:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// 🚚 INTEGRACIÓN PARA TRANSPORT
// ============================================

/**
 * Notificar cuando inicia el transporte
 */
export const notifyTransportStarted = async (dogIds, estimatedTime, transportType = 'pickup') => {
  try {
    console.log(`🚚 Notificando inicio de transporte (${transportType}) para ${dogIds.length} perros`);

    const notifications = [];
    const isPickup = transportType === 'pickup';
    const emoji = isPickup ? '🚐' : '🏠';
    const action = isPickup ? 'recogida' : 'entrega';

    // Obtener información de cada perro y sus dueños
    for (const dogId of dogIds) {
      try {
        const { data: dog } = await supabase
          .from('dogs')
          .select('name, owner_id')
          .eq('id', dogId)
          .single();

        if (dog && dog.owner_id) {
          const notification = await NotificationHelper.createDirectNotification(
            dog.owner_id,
            dogId,
            `${emoji} Transporte en camino para ${dog.name}`,
            `El vehículo del Club Canino está en camino para la ${action} de ${dog.name}. Tiempo estimado: ${estimatedTime} minutos.`,
            'transport',
            'medium'
          );
          notifications.push(notification);
        }
      } catch (dogError) {
        console.warn(`⚠️ Error notificando transporte para perro ${dogId}:`, dogError);
      }
    }

    console.log(`✅ ${notifications.length} notificaciones de transporte enviadas`);
    return { success: true, notifications };

  } catch (error) {
    console.error('❌ Error en notifyTransportStarted:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notificar cuando se completa el transporte
 */
export const notifyTransportCompleted = async (dogIds, transportType = 'pickup') => {
  try {
    console.log(`✅ Notificando transporte completado (${transportType}) para ${dogIds.length} perros`);

    const notifications = [];
    const isPickup = transportType === 'pickup';
    const emoji = isPickup ? '🎓' : '🏠';
    const location = isPickup ? 'Club Canino' : 'casa';

    for (const dogId of dogIds) {
      try {
        const { data: dog } = await supabase
          .from('dogs')
          .select('name, owner_id')
          .eq('id', dogId)
          .single();

        if (dog && dog.owner_id) {
          const notification = await NotificationHelper.createDirectNotification(
            dog.owner_id,
            dogId,
            `${emoji} ${dog.name} llegó a ${location}`,
            `${dog.name} ha llegado ${isPickup ? 'al Club Canino y está listo para su día de actividades' : 'a casa sano y feliz'}. ¡Que tengas un excelente día!`,
            'transport',
            'low'
          );
          notifications.push(notification);
        }
      } catch (dogError) {
        console.warn(`⚠️ Error notificando llegada para perro ${dogId}:`, dogError);
      }
    }

    console.log(`✅ ${notifications.length} notificaciones de llegada enviadas`);
    return { success: true, notifications };

  } catch (error) {
    console.error('❌ Error en notifyTransportCompleted:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// 🔧 FUNCIONES DE UTILIDAD
// ============================================

/**
 * Obtener IDs de usuarios que deben recibir notificaciones para un perro
 */
export const getUsersToNotify = async (dogId, excludeUserId = null) => {
  try {
    const relatedUsers = await NotificationHelper.getRelatedUsers(dogId, excludeUserId);
    return relatedUsers.map(user => user.userId);
  } catch (error) {
    console.error('❌ Error obteniendo usuarios para notificar:', error);
    return [];
  }
};

/**
 * Verificar si las notificaciones están habilitadas para un usuario
 */
export const areNotificationsEnabled = async (userId) => {
  try {
    // Verificar preferencias del usuario (implementar según tu schema)
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('notifications_enabled')
      .eq('user_id', userId)
      .single();

    return preferences?.notifications_enabled !== false; // Default to true
  } catch (error) {
    console.warn('⚠️ Error verificando preferencias de notificación:', error);
    return true; // Default to enabled
  }
};

// ============================================
// 📦 EXPORTACIONES
// ============================================

export default {
  // Rutinas
  notifyRoutineCreated,
  notifyRoutineReminder,
  
  // Vacunas
  notifyVaccineScheduled,
  notifyVaccineReminder,
  
  // Medicinas
  notifyMedicineScheduled,
  notifyMedicineReminder,
  
  // Grooming
  notifyGroomingCompleted,
  
  // Evaluaciones
  notifyEvaluationCompleted,
  
  // Transporte
  notifyTransportStarted,
  notifyTransportCompleted,
  
  // Utilidades
  getUsersToNotify,
  areNotificationsEnabled
};