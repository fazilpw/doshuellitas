// src/utils/notificationHelper.js
// 🔔 HELPER PARA NOTIFICACIONES AUTOMÁTICAS + NOTIFICACIONES CRUZADAS
// ✅ Sistema completo padre ↔ profesor + medicina/vacunas

import supabase from '../lib/supabase.js';

// ============================================
// 🔧 MAPEO DE CATEGORÍAS INCORRECTAS A VÁLIDAS
// ============================================
const mapCategoryToValid = (category) => {
  const categoryMap = {
    // Mapeos de categorías incorrectas a las 8 válidas del schema
    'test': 'general',
    'improvement': 'behavior', 
    'comparison': 'general',
    'system': 'alert',
    'success': 'general',
    'info': 'general',
    'debug': 'general',
    'prueba': 'general',
    'consejos': 'tip',
    'tips': 'tip',
    
    // Categorías ya correctas (sin cambios)
    'general': 'general',
    'medical': 'medical',
    'routine': 'routine', 
    'transport': 'transport',
    'behavior': 'behavior',
    'training': 'training',
    'alert': 'alert',
    'tip': 'tip'
  };
  
  const validCategory = categoryMap[category] || 'general';
  
  if (category !== validCategory) {
    console.log(`🔄 Categoría mapeada: '${category}' → '${validCategory}'`);
  }
  
  return validCategory;
};

// ============================================
// 🤖 CLASE PRINCIPAL DE NOTIFICACIONES - MEJORADA
// ============================================
export class NotificationHelper {
  
  // ============================================
  // 🎯 FUNCIÓN PRINCIPAL - CREAR NOTIFICACIÓN DIRECTA
  // ============================================
  static async createDirectNotification(userId, dogId, title, message, category = 'behavior') {
    try {
      console.log('📝 Creando notificación directa:', { userId, dogId, title, message, category });
      
      // ✅ MAPEAR CATEGORÍA A UNA VÁLIDA
      const validCategory = mapCategoryToValid(category);
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          dog_id: dogId,
          title: title,
          message: message,
          category: validCategory,
          read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando notificación directa:', error);
        throw error;
      }

      console.log('✅ Notificación directa creada exitosamente:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Error en createDirectNotification:', error);
      throw error;
    }
  }

  // ============================================
  // 🆕 FUNCIONES DE NOTIFICACIONES CRUZADAS
  // ============================================

  /**
   * Encuentra usuarios relacionados al perro (padre o profesores)
   */
  static async getRelatedUsers(dogId, excludeUserId = null) {
    try {
      const relatedUsers = [];

      // 1. Obtener el PADRE del perro
      const { data: dogOwner, error: ownerError } = await supabase
        .from('dogs')
        .select(`
          owner_id,
          profiles!dogs_owner_id_fkey(id, full_name, email, role)
        `)
        .eq('id', dogId)
        .single();

      if (!ownerError && dogOwner?.profiles) {
        relatedUsers.push({
          user_id: dogOwner.profiles.id,
          full_name: dogOwner.profiles.full_name,
          email: dogOwner.profiles.email,
          role: dogOwner.profiles.role
        });
      }

      // 2. Obtener PROFESORES que han evaluado este perro
      const { data: relatedProfessors, error: profError } = await supabase
        .from('evaluations')
        .select(`
          evaluator_id,
          profiles!evaluations_evaluator_id_fkey(id, full_name, email, role)
        `)
        .eq('dog_id', dogId)
        .eq('profiles.role', 'profesor')
        .eq('profiles.active', true);

      if (!profError && relatedProfessors) {
        // Agregar profesores únicos
        const uniqueProfessors = relatedProfessors
          .filter(prof => prof.profiles) // Verificar que exista el profile
          .reduce((acc, prof) => {
            const profId = prof.profiles.id;
            if (!acc.find(p => p.user_id === profId)) {
              acc.push({
                user_id: profId,
                full_name: prof.profiles.full_name,
                email: prof.profiles.email,
                role: prof.profiles.role
              });
            }
            return acc;
          }, []);

        relatedUsers.push(...uniqueProfessors);
      }

      // 3. Filtrar usuario que desencadena (no notificarse a sí mismo)
      const filteredUsers = excludeUserId 
        ? relatedUsers.filter(user => user.user_id !== excludeUserId)
        : relatedUsers;

      console.log(`🔍 Usuarios relacionados al perro ${dogId}:`, filteredUsers);
      return filteredUsers;

    } catch (error) {
      console.error('❌ Error obteniendo usuarios relacionados:', error);
      return [];
    }
  }

  /**
   * Crea notificaciones cruzadas entre padre y profesores
   */
  static async createCrossRoleNotification(dogId, triggerUserId, notificationType, title, message, category = 'behavior') {
    try {
      console.log('🔄 Creando notificaciones cruzadas:', { dogId, triggerUserId, notificationType });

      // 1. Obtener información del usuario que desencadena
      const { data: triggerUser } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', triggerUserId)
        .single();

      if (!triggerUser) {
        console.warn('⚠️ Usuario que desencadena no encontrado');
        return { success: false, notifications: [] };
      }

      // 2. Obtener usuarios relacionados (excluyendo al que desencadena)
      const relatedUsers = await this.getRelatedUsers(dogId, triggerUserId);

      if (relatedUsers.length === 0) {
        console.warn('⚠️ No hay usuarios relacionados para notificar');
        return { success: false, notifications: [] };
      }

      // 3. Crear notificaciones para cada usuario relacionado
      const notificationsCreated = [];
      
      for (const targetUser of relatedUsers) {
        // Personalizar mensaje según el rol del destinatario
        let personalizedTitle = title;
        let personalizedMessage = message;

        if (triggerUser.role === 'padre' && targetUser.role === 'profesor') {
          personalizedTitle = `👨‍👩‍👧‍👦 ${personalizedTitle}`;
          personalizedMessage = `El padre/madre ${triggerUser.full_name} reporta: ${personalizedMessage}`;
        } else if (triggerUser.role === 'profesor' && targetUser.role === 'padre') {
          personalizedTitle = `🧑‍🏫 ${personalizedTitle}`;
          personalizedMessage = `El profesor ${triggerUser.full_name} informa: ${personalizedMessage}`;
        }

        try {
          const notification = await this.createDirectNotification(
            targetUser.user_id,
            dogId,
            personalizedTitle,
            personalizedMessage,
            category
          );

          notificationsCreated.push({
            notification_id: notification.id,
            recipient_name: targetUser.full_name,
            recipient_role: targetUser.role
          });

        } catch (notificationError) {
          console.error(`❌ Error creando notificación para ${targetUser.full_name}:`, notificationError);
        }
      }

      console.log(`✅ ${notificationsCreated.length} notificaciones cruzadas creadas`);
      
      return {
        success: true,
        notifications: notificationsCreated,
        trigger_user: triggerUser.full_name,
        trigger_role: triggerUser.role
      };

    } catch (error) {
      console.error('❌ Error en createCrossRoleNotification:', error);
      return { success: false, error: error.message, notifications: [] };
    }
  }

  /**
   * Procesa notificaciones automáticas después de una evaluación (MEJORADA)
   */
  static async processEvaluationNotifications(evaluation, dog, evaluatorId) {
    try {
      console.log('🔍 Procesando notificaciones de evaluación para:', dog.name);

      const results = {
        behaviorAlerts: [],
        crossRoleNotifications: [],
        totalNotifications: 0
      };

      // 1. PROCESAMIENTO DE ALERTAS DE COMPORTAMIENTO (existente)
      const behaviorResult = await this.checkBehaviorAlertsAfterEvaluation(evaluation, dog, evaluatorId);
      results.behaviorAlerts = behaviorResult.notifications || [];

      // 2. 🆕 NOTIFICACIONES CRUZADAS AUTOMÁTICAS
      const crossResults = await this.createEvaluationCrossNotifications(evaluation, dog, evaluatorId);
      results.crossRoleNotifications = crossResults.notifications || [];

      results.totalNotifications = results.behaviorAlerts.length + results.crossRoleNotifications.length;

      console.log(`✅ Procesamiento completo: ${results.totalNotifications} notificaciones creadas`);
      return results;

    } catch (error) {
      console.error('❌ Error procesando notificaciones de evaluación:', error);
      throw error;
    }
  }

  /**
   * Crea notificaciones cruzadas específicas para evaluaciones
   */
  static async createEvaluationCrossNotifications(evaluation, dog, evaluatorId) {
    try {
      // Obtener nombre del perro
      const dogName = dog.name || 'Perro';
      const location = evaluation.location === 'casa' ? 'casa' : 'colegio';

      // Construir mensaje base
      let title, message;
      
      if (location === 'casa') {
        title = `📋 Nueva Evaluación en Casa - ${dogName}`;
        message = `Evaluación en casa completada. Energía: ${evaluation.energy_level}/10, ` +
                 `Sociabilidad: ${evaluation.sociability_level}/10, ` +
                 `Obediencia: ${evaluation.obedience_level}/10, ` +
                 `Ansiedad: ${evaluation.anxiety_level}/10`;
      } else {
        title = `🏫 Nueva Evaluación en Colegio - ${dogName}`;
        message = `Evaluación en el colegio completada. Revisa el progreso y compártelo en casa.`;
      }

      // Agregar alertas especiales al mensaje
      const alerts = [];
      if (evaluation.anxiety_level >= 8) alerts.push('⚠️ Ansiedad alta detectada');
      if (evaluation.obedience_level <= 3) alerts.push('📚 Necesita refuerzo en obediencia');
      if (evaluation.energy_level >= 9) alerts.push('⚡ Energía muy alta');

      if (alerts.length > 0) {
        message += `. ALERTAS: ${alerts.join(', ')}`;
      }

      // Crear notificaciones cruzadas
      return await this.createCrossRoleNotification(
        dog.id,
        evaluatorId,
        'evaluation_completed',
        title,
        message,
        'behavior'
      );

    } catch (error) {
      console.error('❌ Error creando notificaciones cruzadas de evaluación:', error);
      return { success: false, notifications: [] };
    }
  }

  // ============================================
  // 💊 NOTIFICACIONES MÉDICAS CRUZADAS
  // ============================================

  /**
   * Notifica sobre actualizaciones médicas a padre Y profesores
   */
  static async notifyMedicalUpdate(dogId, type, details, triggerUserId) {
    try {
      const typeEmojis = {
        vaccine: '💉',
        medicine: '💊',
        appointment: '🏥',
        treatment: '🩹',
        alert: '🚨'
      };

      const emoji = typeEmojis[type] || '🏥';
      const title = `${emoji} Actualización Médica - ${details.dogName}`;
      
      let message;
      switch (type) {
        case 'vaccine':
          message = `Vacuna ${details.vaccineName} programada para ${details.dueDate}. Coordinar cuidados post-vacuna.`;
          break;
        case 'medicine':
          message = `Medicina ${details.medicineName}: ${details.dosage} cada ${details.frequency}. Supervisar administración.`;
          break;
        case 'appointment':
          message = `Cita veterinaria ${details.appointmentDate}. Informar sobre comportamiento y síntomas.`;
          break;
        default:
          message = details.description || 'Actualización médica importante';
      }

      return await this.createCrossRoleNotification(
        dogId,
        triggerUserId,
        `medical_${type}`,
        title,
        message,
        'medical'
      );

    } catch (error) {
      console.error('❌ Error notificando actualización médica:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // 🎯 ALERTAS DE COMPORTAMIENTO (CÓDIGO EXISTENTE - SIN CAMBIOS)
  // ============================================
  static async checkBehaviorAlertsAfterEvaluation(evaluation, dog, evaluatorId) {
    console.log('🔍 Verificando alertas de comportamiento para:', dog.name);
    console.log('📊 Niveles evaluados:', {
      ansiedad: evaluation.anxiety_level,
      obediencia: evaluation.obedience_level,
      energía: evaluation.energy_level,
      sociabilidad: evaluation.sociability_level
    });
    
    try {
      const notificationsCreated = [];
      
      // 🚨 1. ANSIEDAD ALTA (>= 8)
      if (evaluation.anxiety_level >= 8) {
        const title = `🚨 ${dog.name} - Ansiedad Alta Detectada`;
        const message = `${dog.name} mostró un nivel de ansiedad de ${evaluation.anxiety_level}/10. Considera practicar ejercicios de relajación y evitar situaciones estresantes por hoy.`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'behavior'
        );
        
        notificationsCreated.push(notification);
        console.log(`🚨 Alerta de ansiedad alta enviada para ${dog.name}`);
      }
      
      // 📉 2. OBEDIENCIA BAJA (< 4)
      if (evaluation.obedience_level < 4) {
        const title = `📚 ${dog.name} - Refuerzo en Obediencia`;
        const message = `${dog.name} mostró un nivel de obediencia de ${evaluation.obedience_level}/10. Te sugerimos practicar comandos básicos por 10 minutos hoy.`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'training'
        );
        
        notificationsCreated.push(notification);
        console.log(`📚 Alerta de obediencia baja enviada para ${dog.name}`);
      }
      
      // ⚡ 3. ENERGÍA MUY ALTA (>= 9)
      if (evaluation.energy_level >= 9) {
        const title = `⚡ ${dog.name} - Energía Muy Alta`;
        const message = `${dog.name} tiene mucha energía hoy (${evaluation.energy_level}/10). ¡Perfecto momento para un paseo extra o juegos activos!`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'routine'
        );
        
        notificationsCreated.push(notification);
        console.log(`⚡ Sugerencia de ejercicio enviada para ${dog.name}`);
      }
      
      // 🎉 4. SOCIABILIDAD EXCELENTE (>= 9)
      if (evaluation.sociability_level >= 9) {
        const title = `🎉 ${dog.name} - ¡Excelente Socialización!`;
        const message = `¡Felicitaciones! ${dog.name} mostró una socialización excepcional (${evaluation.sociability_level}/10). ¡Sigue así!`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'general'
        );
        
        notificationsCreated.push(notification);
        console.log(`🎉 Felicitación por socialización enviada para ${dog.name}`);
      }

      return {
        success: true,
        notificationsCreated: notificationsCreated.length,
        notifications: notificationsCreated
      };

    } catch (error) {
      console.error('❌ Error procesando alertas de comportamiento:', error);
      throw error;
    }
  }

  // ============================================
  // 🧪 FUNCIONES DE PRUEBA
  // ============================================
  static async createTestNotification(userId, dogId, dogName = 'Rio') {
    try {
      console.log('🧪 Creando notificación de prueba...');
      
      const title = `🧪 Prueba de Notificaciones - ${dogName}`;
      const message = `Esta es una notificación de prueba para verificar que el sistema funciona correctamente. Generada el ${new Date().toLocaleString('es-CO')}.`;
      
      const notification = await this.createDirectNotification(
        userId,
        dogId,
        title,
        message,
        'general'
      );
      
      console.log('✅ Notificación de prueba creada exitosamente');
      return notification;
      
    } catch (error) {
      console.error('❌ Error creando notificación de prueba:', error);
      throw error;
    }
  }

  /**
   * Prueba el sistema completo de notificaciones cruzadas
   */
  static async testCrossRoleNotifications(dogId, triggerUserId, dogName = 'Max') {
    try {
      console.log('🧪 Probando sistema de notificaciones cruzadas...');

      // 1. Simular evaluación con problemas
      const mockEvaluation = {
        anxiety_level: 9,
        obedience_level: 3,
        energy_level: 8,
        sociability_level: 6,
        location: 'casa'
      };

      const mockDog = {
        id: dogId,
        name: dogName,
        owner_id: triggerUserId // Esto se ajustará automáticamente
      };

      // 2. Procesar notificaciones completas
      const result = await this.processEvaluationNotifications(mockEvaluation, mockDog, triggerUserId);

      console.log('✅ Prueba de notificaciones cruzadas completada:', result);
      return result;

    } catch (error) {
      console.error('❌ Error en prueba de notificaciones cruzadas:', error);
      throw error;
    }
  }
}

// ============================================
// 🔧 FUNCIONES DE UTILIDAD EXPORTADAS
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
    const validCategory = mapCategoryToValid(type);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        dog_id: dogId,
        title: `🧪 Prueba: ${config.template_key}`,
        message: `Notificación de prueba tipo ${type}. Variables: ${JSON.stringify(config.variables)}`,
        category: validCategory,
        read: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    console.log(`✅ Notificación de prueba creada: ${config.template_key}`);
    return data;
  } catch (error) {
    console.error('❌ Error creando notificación de prueba:', error);
    throw error;
  }
};

// ============================================
// 🔧 EXPORTACIONES
// ============================================
export { mapCategoryToValid };
export default NotificationHelper;