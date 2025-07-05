// src/utils/notificationHelper.js
// 🔔 SISTEMA DE NOTIFICACIONES OPTIMIZADO - CLUB CANINO DOS HUELLITAS
// ✅ UNIFICADO: Combina funcionalidad de BD + funciones que prometía el hook eliminado

import supabase from '../lib/supabase.js';

// ============================================
// 🔧 MAPEO DE CATEGORÍAS MEJORADO
// ============================================
const mapCategoryToValid = (category) => {
  const categoryMap = {
    // Mapeos comunes
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
    'routine_reminder': 'routine',
    'vaccine_reminder': 'medical',
    'medicine_reminder': 'medical',
    
    // Categorías correctas
    'general': 'general',
    'medical': 'medical',
    'routine': 'routine', 
    'transport': 'transport',
    'behavior': 'behavior',
    'training': 'training',
    'alert': 'alert',
    'tip': 'tip'
  };
  
  return categoryMap[category] || 'general';
};

// ============================================
// 🎯 CLASE PRINCIPAL OPTIMIZADA
// ============================================
export class NotificationHelper {
  
  // ===============================================
  // 📝 CREAR NOTIFICACIÓN DIRECTA (MEJORADA)
  // ===============================================
  static async createDirectNotification(userId, dogId, title, message, category = 'general', priority = 'normal') {
    try {
      console.log('📝 Creando notificación optimizada:', { userId, dogId, title, category, priority });
      
      const validCategory = mapCategoryToValid(category);
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          dog_id: dogId,
          title: title,
          message: message,
          category: validCategory,
          priority: priority,
          read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Notificación optimizada creada:', data);
      
      // Disparar evento para UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: data }));
      }
      
      return data;
      
    } catch (error) {
      console.error('❌ Error en createDirectNotification optimizada:', error);
      throw error;
    }
  }

  // ===============================================
  // 🏥 NOTIFICACIONES MÉDICAS INTEGRADAS (NUEVA)
  // ===============================================
  static async notifyMedicalUpdate(dogId, medicalType, details, evaluatorId) {
    try {
      const relatedUsers = await this.getRelatedUsers(dogId, evaluatorId);
      const notifications = [];

      for (const user of relatedUsers) {
        let title, message, priority;

        switch (medicalType) {
          case 'vaccine':
            title = `💉 Vacuna de ${details.dogName}`;
            message = `Vacuna ${details.vaccineName} ${details.description}. Próxima fecha: ${details.dueDate}`;
            priority = details.dueDate ? 'high' : 'normal';
            break;
            
          case 'medicine':
            title = `💊 Medicina de ${details.dogName}`;
            message = `${details.medicineName} - ${details.dosage}, ${details.frequency}. ${details.description}`;
            priority = 'normal';
            break;
            
          case 'grooming':
            title = `✂️ Aseo de ${details.dogName}`;
            message = `${details.description}. Realizado por: ${details.performedBy}`;
            priority = 'low';
            break;
            
          default:
            title = `🏥 Actualización médica de ${details.dogName}`;
            message = details.description;
            priority = 'normal';
        }

        const notification = await this.createDirectNotification(
          user.userId,
          dogId,
          title,
          message,
          'medical',
          priority
        );
        
        notifications.push(notification);
      }

      console.log(`✅ ${notifications.length} notificaciones médicas enviadas`);
      return { success: true, notifications };
      
    } catch (error) {
      console.error('❌ Error en notificaciones médicas:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // 📅 NOTIFICACIONES DE RUTINA INTEGRADAS (NUEVA)
  // ===============================================
  static async notifyRoutineUpdate(dogId, routineType, details, creatorId) {
    try {
      const relatedUsers = await this.getRelatedUsers(dogId, creatorId);
      const notifications = [];

      for (const user of relatedUsers) {
        const title = `📅 Rutina de ${details.dogName}`;
        const message = `Nueva rutina "${details.routineName}" programada. ${details.description}`;

        const notification = await this.createDirectNotification(
          user.userId,
          dogId,
          title,
          message,
          'routine',
          'normal'
        );
        
        notifications.push(notification);
      }

      console.log(`✅ ${notifications.length} notificaciones de rutina enviadas`);
      return { success: true, notifications };
      
    } catch (error) {
      console.error('❌ Error en notificaciones de rutina:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // 🎯 PROCESAMIENTO DE EVALUACIONES (MEJORADO)
  // ===============================================
  static async processEvaluationNotifications(evaluation, dog, evaluatorId) {
    try {
      console.log('🔄 Procesando notificaciones de evaluación optimizadas...');
      
      const results = {
        behaviorAlerts: [],
        crossRoleNotifications: [],
        improvementNotifications: []
      };

      // 1. Alertas de comportamiento
      const behaviorAlerts = await this.checkBehaviorAlertsAfterEvaluation(evaluation, dog, evaluatorId);
      results.behaviorAlerts = behaviorAlerts;

      // 2. Notificaciones cruzadas
      if (dog.owner_id && dog.owner_id !== evaluatorId) {
        const crossNotifications = await this.createCrossRoleNotifications(evaluation, dog, evaluatorId);
        results.crossRoleNotifications = crossNotifications;
      }

      // 3. Notificaciones de mejora (NUEVA FUNCIONALIDAD)
      const improvementNotifications = await this.checkForImprovements(evaluation, dog, evaluatorId);
      results.improvementNotifications = improvementNotifications;

      console.log('✅ Notificaciones optimizadas procesadas:', results);
      return results;

    } catch (error) {
      console.error('❌ Error procesando notificaciones optimizadas:', error);
      throw error;
    }
  }

  // ===============================================
  // 📈 DETECCIÓN DE MEJORAS (NUEVA)
  // ===============================================
  static async checkForImprovements(evaluation, dog, evaluatorId) {
    try {
      const improvements = [];
      
      // Obtener evaluación anterior del mismo lugar
      const { data: previousEvaluation } = await supabase
        .from('evaluations')
        .select('*')
        .eq('dog_id', dog.id)
        .eq('location', evaluation.location)
        .neq('id', evaluation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!previousEvaluation) return improvements;

      const dogName = dog.name || 'tu perro';
      
      // Verificar mejoras en cada métrica
      const metrics = [
        { key: 'anxiety_level', name: 'ansiedad', inverse: true },
        { key: 'obedience_level', name: 'obediencia', inverse: false },
        { key: 'energy_level', name: 'energía', inverse: false },
        { key: 'sociability_level', name: 'sociabilidad', inverse: false }
      ];

      for (const metric of metrics) {
        const current = evaluation[metric.key] || 0;
        const previous = previousEvaluation[metric.key] || 0;
        
        // Calcular mejora (para ansiedad, menos es mejor)
        const improvement = metric.inverse ? (previous - current) : (current - previous);
        
        if (improvement >= 2) { // Mejora significativa
          const improvementNotification = await this.createDirectNotification(
            dog.owner_id,
            dog.id,
            `🎉 ¡${dogName} ha mejorado!`,
            `${dogName} mostró una mejora significativa en ${metric.name} (${improvement} puntos). ¡Sigue así con el entrenamiento!`,
            'behavior',
            'low'
          );
          improvements.push(improvementNotification);
        }
      }

      return improvements;
      
    } catch (error) {
      console.error('❌ Error detectando mejoras:', error);
      return [];
    }
  }

  // ===============================================
  // 🧠 ALERTAS DE COMPORTAMIENTO (MEJORADAS)
  // ===============================================
  static async checkBehaviorAlertsAfterEvaluation(evaluation, dog, evaluatorId) {
    try {
      const alerts = [];
      const dogName = dog.name || 'tu perro';

      // Ansiedad crítica (nuevo umbral)
      if (evaluation.anxiety_level >= 9) {
        const alert = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          `🚨 ${dogName} - Ansiedad Crítica`,
          `${dogName} mostró ansiedad crítica (${evaluation.anxiety_level}/10) en ${evaluation.location}. Recomendamos consulta veterinaria inmediata y técnicas de relajación.`,
          'behavior',
          'high'
        );
        alerts.push(alert);
      } 
      // Ansiedad alta
      else if (evaluation.anxiety_level >= 7) {
        const alert = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          `⚠️ ${dogName} - Ansiedad Alta`,
          `${dogName} mostró ansiedad alta (${evaluation.anxiety_level}/10) en ${evaluation.location}. Recomendamos ejercicios de relajación y evitar situaciones estresantes.`,
          'behavior',
          'medium'
        );
        alerts.push(alert);
      }

      // Obediencia muy baja (mejorado)
      if (evaluation.obedience_level <= 2) {
        const alert = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          `📚 ${dogName} - Reforzar Entrenamiento Urgente`,
          `${dogName} mostró obediencia muy baja (${evaluation.obedience_level}/10). Es crítico reforzar comandos básicos con entrenamiento diario de 15-20 minutos.`,
          'training',
          'high'
        );
        alerts.push(alert);
      }
      // Obediencia baja
      else if (evaluation.obedience_level <= 4) {
        const alert = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          `📚 ${dogName} - Mejorar Entrenamiento`,
          `${dogName} necesita más entrenamiento (${evaluation.obedience_level}/10). Practica comandos básicos 10 minutos diarios con refuerzo positivo.`,
          'training',
          'medium'
        );
        alerts.push(alert);
      }

      // Energía excesiva (nuevo)
      if (evaluation.energy_level >= 9) {
        const alert = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          `⚡ ${dogName} - Energía Excesiva`,
          `${dogName} tiene energía excesiva (${evaluation.energy_level}/10). Necesita más ejercicio físico intensivo y estimulación mental para evitar comportamientos destructivos.`,
          'behavior',
          'medium'
        );
        alerts.push(alert);
      }

      // Socialización baja (nuevo)
      if (evaluation.sociability_level <= 3) {
        const alert = await this.createDirectNotification(
          dog.owner_id,
          dog.id,
          `👥 ${dogName} - Mejorar Socialización`,
          `${dogName} mostró baja sociabilidad (${evaluation.sociability_level}/10). Recomendamos exposición gradual a otros perros y personas en ambientes controlados.`,
          'training',
          'medium'
        );
        alerts.push(alert);
      }

      return alerts;
      
    } catch (error) {
      console.error('❌ Error en alertas de comportamiento mejoradas:', error);
      return [];
    }
  }

  // ===============================================
  // 🔄 NOTIFICACIONES CRUZADAS (MEJORADAS)
  // ===============================================
  static async createCrossRoleNotifications(evaluation, dog, evaluatorId) {
    try {
      const notifications = [];
      
      const { data: evaluatorProfile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', evaluatorId)
        .single();

      const evaluatorRole = evaluatorProfile?.role || 'desconocido';
      const evaluatorName = evaluatorProfile?.full_name || 'Un profesional';

      // Determinar prioridad basada en la evaluación
      let priority = 'normal';
      if (evaluation.anxiety_level >= 8 || evaluation.obedience_level <= 3) {
        priority = 'high';
      } else if (evaluation.anxiety_level >= 6 || evaluation.obedience_level <= 5) {
        priority = 'medium';
      }

      // Crear mensaje más informativo
      const metrics = [
        `Energía: ${evaluation.energy_level}/10`,
        `Obediencia: ${evaluation.obedience_level}/10`,
        `Ansiedad: ${evaluation.anxiety_level}/10`,
        `Sociabilidad: ${evaluation.sociability_level}/10`
      ];

      const notification = await this.createDirectNotification(
        dog.owner_id,
        dog.id,
        `📋 Nueva Evaluación de ${dog.name}`,
        `${evaluatorName} (${evaluatorRole}) evaluó a ${dog.name} en ${evaluation.location}.\n\n${metrics.join(' | ')}\n\nRevisa el progreso completo en tu dashboard.`,
        'evaluation',
        priority
      );
      
      notifications.push(notification);

      return notifications;
      
    } catch (error) {
      console.error('❌ Error en notificaciones cruzadas mejoradas:', error);
      return [];
    }
  }

  // ===============================================
  // 👥 OBTENER USUARIOS RELACIONADOS (MEJORADA)
  // ===============================================
  static async getRelatedUsers(dogId, excludeUserId = null) {
    try {
      const relatedUsers = [];

      // Obtener dueño del perro
      const { data: dog } = await supabase
        .from('dogs')
        .select('owner_id, name')
        .eq('id', dogId)
        .single();

      if (dog?.owner_id && dog.owner_id !== excludeUserId) {
        relatedUsers.push({
          userId: dog.owner_id,
          role: 'owner',
          dogName: dog.name
        });
      }

      // Obtener profesores que han evaluado este perro
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('evaluator_id')
        .eq('dog_id', dogId)
        .neq('evaluator_id', excludeUserId)
        .not('evaluator_id', 'is', null);

      if (evaluations) {
        const teacherIds = [...new Set(evaluations.map(e => e.evaluator_id))];
        for (const teacherId of teacherIds) {
          if (!relatedUsers.find(u => u.userId === teacherId)) {
            relatedUsers.push({
              userId: teacherId,
              role: 'teacher',
              dogName: dog?.name
            });
          }
        }
      }

      return relatedUsers;
      
    } catch (error) {
      console.error('❌ Error obteniendo usuarios relacionados:', error);
      return [];
    }
  }

  // ===============================================
  // 🧪 FUNCIONES DE PRUEBA MEJORADAS
  // ===============================================
  // ===============================================
  // 🧪 FUNCIÓN DE PRUEBA CORREGIDA - CON DATOS REALES
  // ===============================================
  static async testOptimizedNotificationFlow(userId, dogId, dogName = 'Max') {
    try {
      console.log('🧪 Probando flujo optimizado de notificaciones...');
      console.log('📝 Parámetros:', { userId, dogId, dogName });
      
      // ✅ VALIDACIÓN: Verificar que los parámetros sean UUIDs válidos
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(userId)) {
        throw new Error(`userId inválido: ${userId}`);
      }
      
      if (!uuidRegex.test(dogId)) {
        throw new Error(`dogId inválido: ${dogId}`);
      }
      
      // ✅ CORREGIDO: Usar UUID real para evaluation.id
      const mockEvaluation = {
        id: crypto.randomUUID(), // ✅ ID válido para evitar error 400
        anxiety_level: 9,
        obedience_level: 2,
        energy_level: 8,
        sociability_level: 6,
        location: 'colegio'
      };

      const mockDog = {
        id: dogId,
        name: dogName,
        owner_id: userId
      };

      console.log('🎭 Evaluación simulada:', mockEvaluation);
      console.log('🐕 Perro simulado:', mockDog);

      // ✅ CORREGIDO: Usar userId REAL como evaluatorId (no profesor-test-id)
      const result = await this.processEvaluationNotifications(mockEvaluation, mockDog, userId);

      console.log('✅ Flujo optimizado completado:', result);
      return result;

    } catch (error) {
      console.error('❌ Error en flujo optimizado:', error);
      throw error;
    }
  }

  // ===============================================
  // 🧪 ALIAS CORREGIDO PARA COMPATIBILIDAD
  // ===============================================
  static async testCrossRoleNotifications(dogId, userId, dogName = 'Max') {
    console.log('🔄 Redirigiendo testCrossRoleNotifications → testOptimizedNotificationFlow');
    // ✅ MANTENER el orden correcto: userId PRIMERO, dogId SEGUNDO
    return await this.testOptimizedNotificationFlow(userId, dogId, dogName);
  }
}

// ============================================
// 🔄 EXPORTACIONES MEJORADAS
// ============================================
// SOLO LA SECCIÓN DE EXPORTACIONES CORREGIDA

// ============================================
// 🔄 EXPORTACIONES COMPLETAS Y CORREGIDAS
// ============================================
export { mapCategoryToValid };

// Mantener compatibilidad con funciones existentes
export const createTestNotification = NotificationHelper.createTestNotification;
export const processEvaluationNotifications = NotificationHelper.processEvaluationNotifications;

// ✅ NUEVA EXPORTACIÓN FALTANTE
export const testOptimizedNotificationFlow = NotificationHelper.testOptimizedNotificationFlow;

// ✅ ALIAS PARA COMPATIBILIDAD CON CÓDIGO EXISTENTE
export const testCrossRoleNotifications = NotificationHelper.testOptimizedNotificationFlow;

// Nuevas funciones optimizadas
export const notifyMedicalUpdate = NotificationHelper.notifyMedicalUpdate;
export const notifyRoutineUpdate = NotificationHelper.notifyRoutineUpdate;

// ✅ EXPORTAR TODAS LAS FUNCIONES DE PRUEBA
export const checkBehaviorAlertsAfterEvaluation = NotificationHelper.checkBehaviorAlertsAfterEvaluation;
export const checkForImprovements = NotificationHelper.checkForImprovements;
export const createCrossRoleNotifications = NotificationHelper.createCrossRoleNotifications;
export const getRelatedUsers = NotificationHelper.getRelatedUsers;

export default NotificationHelper;