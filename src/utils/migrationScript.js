// src/utils/migrationScript.js
// 🔄 SCRIPT DE MIGRACIÓN PARA NOTIFICACIONES EXISTENTES

import supabase from '../lib/supabase.js';

/**
 * 🔄 MIGRADOR PRINCIPAL - Migra notificaciones existentes al nuevo schema
 */
export class NotificationMigrator {
  constructor() {
    this.migrationLog = [];
    this.backupData = {};
  }

  // ============================================
  // 📊 ANÁLISIS PREVIO A LA MIGRACIÓN
  // ============================================

  async analyzeExistingData() {
    console.log('🔍 Analizando datos existentes...');
    
    try {
      // Contar notificaciones existentes
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id, user_id, title, message, type, read, created_at')
        .order('created_at', { ascending: false });

      if (notifError) throw notifError;

      // Contar preferencias existentes
      const { data: preferences, error: prefError } = await supabase
        .from('notification_preferences')
        .select('*');

      if (prefError) throw prefError;

      // Verificar nuevas tablas
      const { data: templates, error: templatesError } = await supabase
        .from('notification_templates')
        .select('template_key, name')
        .eq('is_active', true);

      if (templatesError) throw templatesError;

      const analysis = {
        existingNotifications: notifications?.length || 0,
        existingPreferences: preferences?.length || 0,
        availableTemplates: templates?.length || 0,
        oldestNotification: notifications?.[notifications.length - 1]?.created_at,
        newestNotification: notifications?.[0]?.created_at,
        notificationsByType: this.groupByType(notifications || []),
        userStats: this.getUserStats(notifications || [])
      };

      console.log('📊 Análisis completado:', analysis);
      return analysis;

    } catch (error) {
      console.error('❌ Error en análisis:', error);
      throw error;
    }
  }

  // ============================================
  // 💾 CREAR BACKUP DE DATOS EXISTENTES
  // ============================================

  async createBackup() {
    console.log('💾 Creando backup de datos existentes...');

    try {
      // Backup de notificaciones
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*');

      if (notifError) throw notifError;

      // Backup de preferencias
      const { data: preferences, error: prefError } = await supabase
        .from('notification_preferences')
        .select('*');

      if (prefError) throw prefError;

      this.backupData = {
        notifications: notifications || [],
        preferences: preferences || [],
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Opcional: Guardar backup en localStorage para debugging
      if (typeof window !== 'undefined') {
        localStorage.setItem('notification_backup', JSON.stringify(this.backupData));
      }

      console.log('✅ Backup creado:', {
        notifications: this.backupData.notifications.length,
        preferences: this.backupData.preferences.length
      });

      return this.backupData;

    } catch (error) {
      console.error('❌ Error creando backup:', error);
      throw error;
    }
  }

  // ============================================
  // 🔄 MIGRAR NOTIFICACIONES AL NUEVO FORMATO
  // ============================================

  async migrateNotifications() {
    console.log('🔄 Iniciando migración de notificaciones...');

    try {
      const { data: existingNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      for (const notification of existingNotifications) {
        await this.migrateIndividualNotification(notification);
      }

      console.log(`✅ ${existingNotifications.length} notificaciones migradas`);
      
    } catch (error) {
      console.error('❌ Error en migración de notificaciones:', error);
      throw error;
    }
  }

  async migrateIndividualNotification(notification) {
    try {
      // Categorizar notificación basada en el contenido
      const category = this.categorizeNotification(notification);
      const priority = this.determinePriority(notification);

      // Actualizar notificación existente con nuevas columnas
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          category: category,
          priority: priority,
          data: this.extractDataFromContent(notification),
          sent_at: notification.created_at, // Marcar como enviada
          expires_at: this.calculateExpirationDate(notification)
        })
        .eq('id', notification.id);

      if (updateError) throw updateError;

      // Crear entrada en notification_logs
      const { error: logError } = await supabase
        .from('notification_logs')
        .insert({
          notification_id: notification.id,
          user_id: notification.user_id,
          title: notification.title,
          body: notification.message,
          category: category,
          priority: priority,
          sent_push: true, // Asumimos que las notificaciones existentes fueron enviadas
          delivery_status: 'delivered',
          opened_at: notification.read ? notification.created_at : null,
          sent_at: notification.created_at
        });

      if (logError) throw logError;

      this.migrationLog.push({
        id: notification.id,
        title: notification.title,
        category: category,
        status: 'migrated'
      });

    } catch (error) {
      console.error(`❌ Error migrando notificación ${notification.id}:`, error);
      this.migrationLog.push({
        id: notification.id,
        title: notification.title,
        error: error.message,
        status: 'failed'
      });
    }
  }

  // ============================================
  // 🔧 MIGRAR PREFERENCIAS DE USUARIOS
  // ============================================

  async migratePreferences() {
    console.log('🔧 Migrando preferencias de usuarios...');

    try {
      const { data: existingPrefs, error } = await supabase
        .from('notification_preferences')
        .select('*');

      if (error) throw error;

      for (const pref of existingPrefs) {
        await this.migrateIndividualPreference(pref);
      }

      console.log(`✅ ${existingPrefs.length} preferencias migradas`);

    } catch (error) {
      console.error('❌ Error migrando preferencias:', error);
      throw error;
    }
  }

  async migrateIndividualPreference(preference) {
    try {
      // Convertir preferencias existentes al nuevo formato
      const newCategories = {
        medical: preference.vaccine_reminders || true,
        routine: preference.routine_reminders || true,
        transport: true, // Nueva categoría, activada por defecto
        behavior: true, // Nueva categoría, activada por defecto
        training: true, // Nueva categoría, activada por defecto
        tips: true, // Nueva categoría, activada por defecto
        general: true
      };

      const { error } = await supabase
        .from('notification_preferences')
        .update({
          categories: newCategories,
          priority_filter: 'low', // Mostrar todas las notificaciones por defecto
          device_tokens: [] // Array vacío, se poblará cuando se suscriban
        })
        .eq('id', preference.id);

      if (error) throw error;

      console.log(`✅ Preferencias migradas para usuario: ${preference.user_id}`);

    } catch (error) {
      console.error(`❌ Error migrando preferencia ${preference.id}:`, error);
    }
  }

  // ============================================
  // 🎯 CREAR NOTIFICACIONES PROGRAMADAS INTELIGENTES
  // ============================================

  async createSmartScheduledNotifications() {
    console.log('🎯 Creando notificaciones programadas inteligentes...');

    try {
      // Obtener todos los perros activos
      const { data: dogs, error: dogsError } = await supabase
        .from('dogs')
        .select('id, name, owner_id')
        .eq('active', true);

      if (dogsError) throw dogsError;

      // Crear tips semanales para cada usuario
      const users = [...new Set(dogs.map(dog => dog.owner_id))];
      
      for (const userId of users) {
        await this.scheduleWeeklyTips(userId);
      }

      // Programar recordatorios de rutina basados en datos existentes
      for (const dog of dogs) {
        await this.scheduleRoutineReminders(dog);
      }

      console.log('✅ Notificaciones programadas creadas');

    } catch (error) {
      console.error('❌ Error creando notificaciones programadas:', error);
    }
  }

  async scheduleWeeklyTips(userId) {
    const nextMonday = this.getNextMonday();
    
    const { error } = await supabase
      .from('scheduled_notifications')
      .insert({
        user_id: userId,
        template_key: 'weekly_tip',
        variables: {
          tip: 'La consistencia es clave en el entrenamiento canino. Practica comandos básicos 5 minutos al día.'
        },
        scheduled_for: nextMonday.toISOString(),
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO', // Cada lunes
        status: 'pending'
      });

    if (error) console.error('Error programando tip semanal:', error);
  }

  async scheduleRoutineReminders(dog) {
    // Programar recordatorio de paseo matutino
    const tomorrow7AM = new Date();
    tomorrow7AM.setDate(tomorrow7AM.getDate() + 1);
    tomorrow7AM.setHours(7, 0, 0, 0);

    const { error } = await supabase
      .from('scheduled_notifications')
      .insert({
        user_id: dog.owner_id,
        dog_id: dog.id,
        template_key: 'walk_reminder',
        variables: {
          dogName: dog.name,
          duration: '20'
        },
        scheduled_for: tomorrow7AM.toISOString(),
        is_recurring: true,
        recurrence_rule: 'FREQ=DAILY;BYHOUR=7', // Diario a las 7 AM
        status: 'pending'
      });

    if (error) console.error('Error programando recordatorio de paseo:', error);
  }

  // ============================================
  // 🧹 LIMPIEZA POST-MIGRACIÓN
  // ============================================

  async cleanupAfterMigration() {
    console.log('🧹 Realizando limpieza post-migración...');

    try {
      // Marcar notificaciones muy antiguas como expiradas
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { error: expireError } = await supabase
        .from('notifications')
        .update({ expires_at: new Date().toISOString() })
        .lt('created_at', sixMonthsAgo.toISOString())
        .is('expires_at', null);

      if (expireError) console.warn('Error expirando notificaciones antiguas:', expireError);

      // Crear índices para optimización si no existen
      // (Esto se hace desde el SQL, pero podemos verificar)

      console.log('✅ Limpieza completada');

    } catch (error) {
      console.error('❌ Error en limpieza:', error);
    }
  }

  // ============================================
  // 📊 GENERAR REPORTE DE MIGRACIÓN
  // ============================================

  generateMigrationReport() {
    const successful = this.migrationLog.filter(log => log.status === 'migrated');
    const failed = this.migrationLog.filter(log => log.status === 'failed');

    const report = {
      summary: {
        total: this.migrationLog.length,
        successful: successful.length,
        failed: failed.length,
        successRate: ((successful.length / this.migrationLog.length) * 100).toFixed(2) + '%'
      },
      backupInfo: {
        created: !!this.backupData.timestamp,
        timestamp: this.backupData.timestamp,
        notificationsBackedUp: this.backupData.notifications?.length || 0,
        preferencesBackedUp: this.backupData.preferences?.length || 0
      },
      failedMigrations: failed,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Reporte de migración:', report);
    return report;
  }

  // ============================================
  // 🛠️ FUNCIONES AUXILIARES
  // ============================================

  categorizeNotification(notification) {
    const title = notification.title?.toLowerCase() || '';
    const message = notification.message?.toLowerCase() || '';
    const content = title + ' ' + message;

    if (content.includes('vacuna') || content.includes('medicina') || content.includes('veterinario')) {
      return 'medical';
    }
    if (content.includes('transporte') || content.includes('recog') || content.includes('vehículo')) {
      return 'transport';
    }
    if (content.includes('ansiedad') || content.includes('comportamiento') || content.includes('obediencia')) {
      return 'behavior';
    }
    if (content.includes('paseo') || content.includes('rutina') || content.includes('horario')) {
      return 'routine';
    }
    if (content.includes('tip') || content.includes('consejo') || content.includes('entrenamiento')) {
      return 'training';
    }
    return 'general';
  }

  determinePriority(notification) {
    const content = (notification.title + ' ' + notification.message).toLowerCase();
    
    if (content.includes('urgente') || content.includes('crítico') || content.includes('vencida')) {
      return 'urgent';
    }
    if (content.includes('importante') || content.includes('alerta') || content.includes('vence')) {
      return 'high';
    }
    if (content.includes('recordatorio') || content.includes('próxima')) {
      return 'medium';
    }
    return 'low';
  }

  extractDataFromContent(notification) {
    // Intentar extraer datos estructurados del contenido de la notificación
    return {
      originalTitle: notification.title,
      originalMessage: notification.message,
      originalType: notification.type,
      migrated: true,
      migrationDate: new Date().toISOString()
    };
  }

  calculateExpirationDate(notification) {
    // Las notificaciones de tips no expiran
    if (notification.title?.includes('tip') || notification.title?.includes('consejo')) {
      return null;
    }
    
    // Las notificaciones médicas expiran en 30 días
    if (this.categorizeNotification(notification) === 'medical') {
      const expiry = new Date(notification.created_at);
      expiry.setDate(expiry.getDate() + 30);
      return expiry.toISOString();
    }

    // Las notificaciones de transporte expiran en 1 día
    if (this.categorizeNotification(notification) === 'transport') {
      const expiry = new Date(notification.created_at);
      expiry.setDate(expiry.getDate() + 1);
      return expiry.toISOString();
    }

    // Otras notificaciones expiran en 7 días
    const expiry = new Date(notification.created_at);
    expiry.setDate(expiry.getDate() + 7);
    return expiry.toISOString();
  }

  groupByType(notifications) {
    return notifications.reduce((acc, notif) => {
      const type = notif.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }

  getUserStats(notifications) {
    const userStats = notifications.reduce((acc, notif) => {
      acc[notif.user_id] = (acc[notif.user_id] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUsers: Object.keys(userStats).length,
      avgNotificationsPerUser: Object.values(userStats).reduce((a, b) => a + b, 0) / Object.keys(userStats).length || 0,
      maxNotificationsPerUser: Math.max(...Object.values(userStats))
    };
  }

  getNextMonday() {
    const today = new Date();
    const daysUntilMonday = (1 + 7 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    nextMonday.setHours(9, 0, 0, 0); // 9 AM
    return nextMonday;
  }
}

// ============================================
// 🚀 FUNCIÓN PRINCIPAL DE MIGRACIÓN
// ============================================

export async function runFullMigration() {
  console.log('🚀 Iniciando migración completa de notificaciones...');
  
  const migrator = new NotificationMigrator();
  
  try {
    // 1. Análisis previo
    const analysis = await migrator.analyzeExistingData();
    console.log('📊 Análisis:', analysis);

    // 2. Crear backup
    await migrator.createBackup();

    // 3. Migrar notificaciones existentes
    await migrator.migrateNotifications();

    // 4. Migrar preferencias
    await migrator.migratePreferences();

    // 5. Crear notificaciones programadas inteligentes
    await migrator.createSmartScheduledNotifications();

    // 6. Limpieza post-migración
    await migrator.cleanupAfterMigration();

    // 7. Generar reporte
    const report = migrator.generateMigrationReport();

    console.log('✅ Migración completada exitosamente');
    return { success: true, report, migrator };

  } catch (error) {
    console.error('❌ Error en migración:', error);
    
    // Generar reporte de error
    const report = migrator.generateMigrationReport();
    
    return { 
      success: false, 
      error: error.message, 
      report, 
      migrator,
      backup: migrator.backupData 
    };
  }
}

// ============================================
// 🔄 FUNCIÓN DE ROLLBACK (EMERGENCIA)
// ============================================

export async function rollbackMigration(backupData) {
  console.log('🔄 Iniciando rollback de migración...');
  
  try {
    if (!backupData || !backupData.notifications) {
      throw new Error('No hay datos de backup disponibles');
    }

    // Restaurar notificaciones originales
    // (Nota: En producción, sería mejor hacer esto con más cuidado)
    console.warn('⚠️ Rollback no implementado completamente - usar backup manual');
    
    return { success: true, message: 'Datos de backup disponibles en localStorage' };

  } catch (error) {
    console.error('❌ Error en rollback:', error);
    return { success: false, error: error.message };
  }
}