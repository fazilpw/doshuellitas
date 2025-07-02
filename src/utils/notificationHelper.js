// src/utils/notificationHelper.js
// 🔔 HELPER PARA NOTIFICACIONES AUTOMÁTICAS - COMPLETAMENTE CORREGIDO
// ✅ Todas las categorías mapeadas a las 8 válidas del schema

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
// 🔧 FUNCIÓN DE UTILIDAD BÁSICA CORREGIDA
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
    // ✅ USAR CATEGORÍA VÁLIDA MAPEADA
    const validCategory = mapCategoryToValid(type);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        dog_id: dogId,
        title: `🧪 Prueba: ${config.template_key}`,
        message: `Notificación de prueba tipo ${type}. Variables: ${JSON.stringify(config.variables)}`,
        category: validCategory, // ✅ CORREGIDO: usar categoría válida
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
// 🤖 CLASE PRINCIPAL DE NOTIFICACIONES - CORREGIDA
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
          category: validCategory, // ✅ CORREGIDO: usar categoría válida
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
        const message = `${dog.name} mostró un nivel de ansiedad de ${evaluation.anxiety_level}/10. Considera practicar ejercicios de relajación y evitar situaciones estresantes por hoy.`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'behavior' // ✅ CATEGORÍA VÁLIDA
        );
        
        notificationsCreated.push(notification);
        console.log(`🚨 Alerta de ansiedad alta enviada para ${dog.name}`);
      }
      
      // ============================================
      // 📉 2. OBEDIENCIA BAJA (< 4)
      // ============================================
      if (evaluation.obedience_level < 4) {
        const title = `📚 ${dog.name} - Refuerzo en Obediencia`;
        const message = `${dog.name} mostró un nivel de obediencia de ${evaluation.obedience_level}/10. Te sugerimos practicar comandos básicos por 10 minutos hoy.`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'training' // ✅ CATEGORÍA VÁLIDA
        );
        
        notificationsCreated.push(notification);
        console.log(`📚 Alerta de obediencia baja enviada para ${dog.name}`);
      }
      
      // ============================================
      // ⚡ 3. ENERGÍA MUY ALTA (>= 9)
      // ============================================
      if (evaluation.energy_level >= 9) {
        const title = `⚡ ${dog.name} - Energía Muy Alta`;
        const message = `${dog.name} tiene mucha energía hoy (${evaluation.energy_level}/10). ¡Perfecto momento para un paseo extra o juegos activos!`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'routine' // ✅ CATEGORÍA VÁLIDA
        );
        
        notificationsCreated.push(notification);
        console.log(`⚡ Sugerencia de ejercicio enviada para ${dog.name}`);
      }
      
      // ============================================
      // 🎉 4. SOCIABILIDAD EXCELENTE (>= 9)
      // ============================================
      if (evaluation.sociability_level >= 9) {
        const title = `🎉 ${dog.name} - ¡Excelente Socialización!`;
        const message = `¡Felicitaciones! ${dog.name} mostró una socialización excepcional (${evaluation.sociability_level}/10). ¡Sigue así!`;
        
        const notification = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          title,
          message,
          'general' // ✅ CATEGORÍA VÁLIDA (para celebraciones)
        );
        
        notificationsCreated.push(notification);
        console.log(`🎉 Felicitación por socialización enviada para ${dog.name}`);
      }
      
      // ============================================
      // 📊 5. COMPARATIVA CASA VS COLEGIO (si hay datos)
      // ============================================
      try {
        const otherLocation = evaluation.location === 'casa' ? 'colegio' : 'casa';
        
        const { data: lastOtherEvaluation } = await supabase
          .from('evaluations')
          .select('anxiety_level, obedience_level, location, date')
          .eq('dog_id', dog.id)
          .eq('location', otherLocation)
          .order('date', { ascending: false })
          .limit(1)
          .single();
        
        if (lastOtherEvaluation) {
          const anxietyDiff = Math.abs(evaluation.anxiety_level - lastOtherEvaluation.anxiety_level);
          
          if (anxietyDiff >= 3) {
            const isHigher = evaluation.anxiety_level > lastOtherEvaluation.anxiety_level;
            const title = `📊 ${dog.name} - Diferencia Casa vs Colegio`;
            const message = `${dog.name} está ${isHigher ? 'más ansioso' : 'más relajado'} en ${evaluation.location} (${evaluation.anxiety_level}/10) que en ${otherLocation} (${lastOtherEvaluation.anxiety_level}/10). ${isHigher ? 'Considera ajustar el ambiente en ' + evaluation.location : 'Excelente adaptación en ' + evaluation.location}.`;
            
            const notification = await this.createDirectNotification(
              dog.owner_id,
              dog.id,
              title,
              message,
              'general' // ✅ CATEGORÍA VÁLIDA (para comparativas)
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
          'alert' // ✅ CATEGORÍA VÁLIDA (era 'system')
        );
      } catch (errorNotificationError) {
        console.error('❌ Error creando notificación de error:', errorNotificationError);
      }
      
      throw error;
    }
  }

  // ============================================
  // 🧪 FUNCIÓN DE PRUEBA CORREGIDA
  // ============================================
  static async createTestNotification(userId, dogId, dogName = 'Rio') {
    try {
      console.log('🧪 Creando notificación de prueba...');
      
      const title = `🧪 Prueba de Notificaciones - ${dogName}`;
      const message = `Esta es una notificación de prueba para verificar que el sistema funciona correctamente. Generada el ${new Date().toLocaleString('es-CO')}.`;
      
      // ✅ USAR CATEGORÍA VÁLIDA
      const notification = await this.createDirectNotification(
        userId,
        dogId,
        title,
        message,
        'general' // ✅ CORREGIDO: 'general' en lugar de 'test'
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

      for (const vaccine of upcomingVaccines || []) {
        const daysUntil = Math.ceil((new Date(vaccine.next_due_date) - new Date()) / (1000 * 60 * 60 * 24));
        
        await this.createDirectNotification(
          vaccine.dog.owner_id,
          vaccine.dog_id,
          `💉 Recordatorio de Vacuna - ${vaccine.dog.name}`,
          `La vacuna ${vaccine.vaccine_name} de ${vaccine.dog.name} vence en ${daysUntil} días. Programa tu cita veterinaria.`,
          'medical' // ✅ CATEGORÍA VÁLIDA
        );
      }

      console.log(`✅ ${upcomingVaccines?.length || 0} recordatorios médicos procesados`);
      
    } catch (error) {
      console.error('❌ Error verificando recordatorios médicos:', error);
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
// 🔧 EXPORTACIONES
// ============================================
export { mapCategoryToValid };
export default NotificationHelper;