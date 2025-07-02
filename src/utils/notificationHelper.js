// src/utils/notificationHelper.js
// 🔔 HELPER PARA NOTIFICACIONES AUTOMÁTICAS - VERSION COMPLETA

import supabase from '../lib/supabase.js';

// ============================================
// 🔧 FUNCIONES DE UTILIDAD BÁSICAS
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
    // 🔧 VERSIÓN SIMPLIFICADA: Crear notificación directa
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        dog_id: dogId,
        title: `🧪 Prueba: ${config.template_key}`,
        message: `Notificación de prueba tipo ${type}. Variables: ${JSON.stringify(config.variables)}`,
        category: type,
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
// 🤖 CLASE PRINCIPAL DE NOTIFICACIONES
// ============================================

export class NotificationHelper {
  
  // ============================================
  // 🎯 FUNCIÓN PRINCIPAL - CREAR NOTIFICACIÓN DIRECTA
  // ============================================
  
  static async createDirectNotification(userId, dogId, title, message, category = 'behavior') {
    try {
      console.log('📝 Creando notificación directa:', { userId, dogId, title, message });
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          dog_id: dogId,
          title: title,
          message: message,
          category: category,
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
  // 🎯 NOTIFICACIONES DE COMPORTAMIENTO AUTOMÁTICAS
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
      
      // ============================================
      // 🚨 1. ANSIEDAD ALTA (>= 8)
      // ============================================
      if (evaluation.anxiety_level >= 8) {
        const title = `🚨 ${dog.name} - Ansiedad Alta Detectada`;
        const message = `${dog.name} mostró un nivel de ansiedad de ${evaluation.anxiety_level}/10. Recomendamos: practicar ejercicios de relajación, evitar lugares muy concurridos y mantener rutinas predecibles.`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'behavior'
        );
        
        notificationsCreated.push(notification);
        console.log(`🚨 Alerta de ansiedad enviada para ${dog.name}`);
      }

      // ============================================
      // 📚 2. OBEDIENCIA BAJA (<= 3)
      // ============================================
      if (evaluation.obedience_level <= 3) {
        const title = `📚 ${dog.name} - Refuerzo en Obediencia`;
        const message = `${dog.name} necesita refuerzo en obediencia (nivel ${evaluation.obedience_level}/10). Sugerimos: practicar comando "quieto" 5 min diarios, usar refuerzos positivos y mantener consistencia en las órdenes.`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'behavior'
        );
        
        notificationsCreated.push(notification);
        console.log(`📚 Alerta de obediencia enviada para ${dog.name}`);
      }

      // ============================================
      // ⚡ 3. ENERGÍA MUY ALTA (>= 9)
      // ============================================
      if (evaluation.energy_level >= 9) {
        const title = `⚡ ${dog.name} - Energía Muy Alta`;
        const message = `${dog.name} tiene energía muy alta (${evaluation.energy_level}/10). Recomendamos: aumentar tiempo de ejercicio, juegos de estimulación mental y actividades de búsqueda para cansarlo mentalmente.`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'behavior'
        );
        
        notificationsCreated.push(notification);
        console.log(`⚡ Alerta de energía alta enviada para ${dog.name}`);
      }

      // ============================================
      // ✅ 4. OBEDIENCIA EXCELENTE (>= 8)
      // ============================================
      if (evaluation.obedience_level >= 8) {
        const title = `✅ ${dog.name} - ¡Excelente Obediencia!`;
        const message = `¡Felicitaciones! ${dog.name} mostró excelente obediencia (${evaluation.obedience_level}/10). Continúa con el entrenamiento actual, está dando excelentes resultados.`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'improvement'
        );
        
        notificationsCreated.push(notification);
        console.log(`✅ Felicitación de obediencia enviada para ${dog.name}`);
      }

      // ============================================
      // 🐕 5. SOCIALIZACIÓN EXCELENTE (>= 8)
      // ============================================
      if (evaluation.sociability_level >= 8) {
        const title = `🐕 ${dog.name} - ¡Excelente Socialización!`;
        const message = `${dog.name} demostró excelente socialización (${evaluation.sociability_level}/10). ¡Es un ejemplo para otros perros! Perfecto para actividades grupales y juegos sociales.`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'improvement'
        );
        
        notificationsCreated.push(notification);
        console.log(`🐕 Felicitación de socialización enviada para ${dog.name}`);
      }

      // ============================================
      // 📊 6. COMPARATIVA CASA VS COLEGIO
      // ============================================
      try {
        // Buscar última evaluación en ubicación diferente
        const otherLocation = evaluation.location === 'casa' ? 'colegio' : 'casa';
        
        const { data: lastOtherEvaluation } = await supabase
          .from('evaluations')
          .select('anxiety_level, energy_level, sociability_level, obedience_level, location')
          .eq('dog_id', dog.id)
          .eq('location', otherLocation)
          .neq('id', evaluation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastOtherEvaluation) {
          // Comparar ansiedad
          const anxietyDiff = evaluation.anxiety_level - lastOtherEvaluation.anxiety_level;
          
          if (Math.abs(anxietyDiff) >= 3) {
            const isHigher = anxietyDiff > 0;
            const title = `📊 ${dog.name} - Diferencia Casa vs Colegio`;
            const message = `${dog.name} está ${isHigher ? 'más ansioso' : 'más relajado'} en ${evaluation.location} (${evaluation.anxiety_level}/10) que en ${otherLocation} (${lastOtherEvaluation.anxiety_level}/10). ${isHigher ? 'Considera ajustar el ambiente en ' + evaluation.location : 'Excelente adaptación en ' + evaluation.location}.`;
            
            const notification = await this.createDirectNotification(
              dog.owner_id,
              dog.id,
              title,
              message,
              'comparison'
            );
            
            notificationsCreated.push(notification);
            console.log(`📊 Comparativa casa/colegio enviada para ${dog.name}`);
          }
        }
      } catch (comparisonError) {
        console.warn('⚠️ Error en comparativa casa/colegio:', comparisonError);
        // No fallar por este error
      }

      // ============================================
      // 📈 RESUMEN FINAL
      // ============================================
      console.log(`✅ Procesamiento completo para ${dog.name}:`);
      console.log(`   📧 ${notificationsCreated.length} notificaciones creadas`);
      console.log(`   📊 Evaluación en: ${evaluation.location}`);
      console.log(`   🔍 Owner ID: ${dog.owner_id}`);
      
      return {
        success: true,
        notificationsCreated: notificationsCreated.length,
        notifications: notificationsCreated
      };

    } catch (error) {
      console.error('❌ Error procesando alertas de comportamiento:', error);
      
      // Crear notificación de error para debugging
      try {
        await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          `⚠️ Error en Notificaciones Automáticas`,
          `Hubo un problema procesando las notificaciones automáticas para ${dog.name}. La evaluación se guardó correctamente.`,
          'system'
        );
      } catch (errorNotificationError) {
        console.error('❌ Error creando notificación de error:', errorNotificationError);
      }
      
      throw error;
    }
  }

  // ============================================
  // 🧪 FUNCIÓN DE PRUEBA RÁPIDA
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
        'test'
      );
      
      console.log('✅ Notificación de prueba creada exitosamente');
      return notification;
      
    } catch (error) {
      console.error('❌ Error creando notificación de prueba:', error);
      throw error;
    }
  }

  // ============================================
  // 📱 FUNCIÓN PARA REFRESCAR DASHBOARD
  // ============================================
  
  static async triggerDashboardRefresh() {
    // Disparar evento personalizado para que el dashboard se refresque
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('notificationsUpdated', {
        detail: { timestamp: new Date().toISOString() }
      });
      window.dispatchEvent(event);
      console.log('🔄 Evento de refresco del dashboard disparado');
    }
  }
}

// ============================================
// 🔧 FUNCIÓN DE UTILIDAD PARA TESTING MANUAL
// ============================================

export const testNotifications = async (userId, dogId, dogName) => {
  try {
    console.log('🧪 Iniciando prueba manual de notificaciones...');
    
    // Crear notificación de prueba
    const testNotification = await NotificationHelper.createTestNotification(userId, dogId, dogName);
    
    // Simular evaluación con ansiedad alta
    const mockEvaluation = {
      anxiety_level: 9,
      obedience_level: 4,
      energy_level: 8,
      sociability_level: 7,
      location: 'casa'
    };
    
    const mockDog = {
      id: dogId,
      name: dogName,
      owner_id: userId
    };
    
    // Procesar alertas
    const result = await NotificationHelper.checkBehaviorAlertsAfterEvaluation(
      mockEvaluation,
      mockDog,
      userId
    );
    
    console.log('✅ Prueba de notificaciones completada:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en prueba de notificaciones:', error);
    throw error;
  }
};

// ============================================
// 🔧 EXPORTACIÓN DEFAULT PARA COMPATIBILIDAD
// ============================================
export default NotificationHelper;