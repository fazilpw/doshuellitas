// ============================================
// 🔗 INTEGRACIÓN CON COMPONENTES EXISTENTES
// ============================================

// 1. INTEGRAR EN FORMULARIO DE EVALUACIÓN
// src/components/evaluation/EvaluationForm.jsx

import { NotificationHelper } from '../../utils/notificationHelper.js';

// En tu función de envío de evaluación, agregar:
const handleEvaluationSubmit = async (evaluationData) => {
  try {
    // Crear evaluación normal
    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .insert([evaluationData])
      .select()
      .single();

    if (error) throw error;

    // ✅ NUEVO: Verificar alertas de comportamiento automáticamente
    const { data: dog } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', evaluationData.dog_id)
      .single();

    if (dog) {
      await NotificationHelper.checkBehaviorAlertsAfterEvaluation(
        evaluation, 
        dog, 
        evaluationData.evaluator_id
      );
    }

    console.log('✅ Evaluación guardada y notificaciones enviadas');
    return evaluation;

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
};

// ============================================
// 2. INTEGRAR EN SISTEMA DE TRANSPORTE
// src/components/transport/TransportManager.jsx

import { NotificationHelper } from '../../utils/notificationHelper.js';

// Función para iniciar ruta de transporte
const startTransportRoute = async (vehicleId, dogIds) => {
  try {
    // Crear ruta en la base de datos
    const { data: route, error } = await supabase
      .from('vehicle_routes')
      .insert([{
        vehicle_id: vehicleId,
        dog_ids: dogIds,
        route_type: 'pickup',
        status: 'in_progress',
        actual_start_time: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // ✅ NUEVO: Enviar notificaciones automáticamente
    await NotificationHelper.notifyTransportSequence(vehicleId, dogIds, route);

    console.log('🚐 Ruta iniciada y notificaciones programadas');
    return route;

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
};

// ============================================
// 3. INTEGRAR EN GESTIÓN MÉDICA
// src/components/medical/MedicalManager.jsx

import { NotificationHelper } from '../../utils/notificationHelper.js';

// Función que se ejecuta al cargar el dashboard médico
const checkMedicalAlertsOnLoad = async () => {
  await NotificationHelper.checkMedicalReminders();
};

// Función para programar recordatorio de medicina
const scheduleMedicineReminder = async (medicineData) => {
  try {
    // Guardar medicina en la base de datos
    const { data: medicine, error } = await supabase
      .from('medicines')
      .insert([medicineData])
      .select()
      .single();

    if (error) throw error;

    // ✅ NUEVO: Si requiere dosis diarias, programar recordatorios
    if (medicine.frequency === 'diario' && medicine.next_dose_date) {
      // Esto se manejará automáticamente por el checkMedicalReminders()
      // que debe ejecutarse diariamente
    }

    return medicine;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
};

// ============================================
// 4. INTEGRAR EN DASHBOARD PADRE
// src/components/dashboard/ParentDashboard.jsx

import { createTestNotification } from '../../utils/notificationHelper.js';

// Agregar botones de prueba en el dashboard
const TestNotificationsSection = ({ currentUser, dogs }) => {
  const [testing, setTesting] = useState(false);

  const testNotification = async (type) => {
    if (!currentUser || dogs.length === 0) return;
    
    setTesting(true);
    try {
      await createTestNotification(currentUser.id, dogs[0].id, type);
      alert(`✅ Notificación de ${type} enviada`);
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
      <h3 className="text-lg font-bold text-[#2C3E50] mb-4">
        🧪 Probar Notificaciones Reales
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => testNotification('transport')}
          disabled={testing}
          className="bg-blue-100 text-blue-700 p-3 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          🚐 Transporte
        </button>
        
        <button
          onClick={() => testNotification('behavior')}
          disabled={testing}
          className="bg-orange-100 text-orange-700 p-3 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
        >
          🎯 Comportamiento
        </button>
        
        <button
          onClick={() => testNotification('medical')}
          disabled={testing}
          className="bg-red-100 text-red-700 p-3 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          💊 Médica
        </button>
        
        <button
          onClick={() => testNotification('improvement')}
          disabled={testing}
          className="bg-green-100 text-green-700 p-3 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
        >
          🎉 Mejora
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mt-3">
        Estos botones crean notificaciones reales que aparecerán en tu dashboard
      </p>
    </div>
  );
};

// ============================================
// 5. HOOK PERSONALIZADO PARA NOTIFICACIONES
// src/hooks/useNotifications.js

import { useState, useEffect } from 'react';
import { NotificationHelper } from '../utils/notificationHelper.js';

export const useNotifications = (userId, dogs) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar notificaciones del usuario
  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  // Marcar como leída
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      await loadNotifications(); // Recargar
    } catch (error) {
      console.error('Error marcando como leída:', error);
    }
  };

  // Crear notificación de prueba
  const createTestNotification = async (type) => {
    if (dogs.length === 0) return;
    
    try {
      await createTestNotification(userId, dogs[0].id, type);
      await loadNotifications(); // Recargar para mostrar la nueva
    } catch (error) {
      console.error('Error creando notificación de prueba:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadNotifications();
      
      // Verificar nuevas notificaciones cada 30 segundos
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    createTestNotification
  };
};

// ============================================
// 6. COMPONENTE DE NOTIFICACIONES EN TIEMPO REAL
// src/components/notifications/LiveNotificationBell.jsx

import { useNotifications } from '../../hooks/useNotifications.js';

export const LiveNotificationBell = ({ userId, dogs }) => {
  const { notifications, unreadCount, markAsRead } = useNotifications(userId, dogs);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      {/* Bell Icon con contador */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-[#56CCF2] transition-colors"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">
              Notificaciones ({unreadCount} nuevas)
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <span className="text-lg mr-3">
                    {notification.category === 'transport' ? '🚐' :
                     notification.category === 'medical' ? '💊' :
                     notification.category === 'behavior' ? '🎯' :
                     notification.category === 'routine' ? '⏰' : '📬'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {notifications.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <span className="text-4xl mb-4 block">📬</span>
              <p>No hay notificaciones</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// 7. CRON JOB SIMULADO (PARA RECORDATORIOS DIARIOS)
// src/utils/dailyNotificationCheck.js

export const runDailyNotificationCheck = async () => {
  console.log('🔄 Ejecutando verificación diaria de notificaciones...');
  
  try {
    // 1. Verificar recordatorios médicos
    await NotificationHelper.checkMedicalReminders();
    
    // 2. Procesar notificaciones programadas pendientes
    const now = new Date().toISOString();
    
    const { data: pendingNotifications } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now);

    for (const scheduled of pendingNotifications) {
      try {
        // Crear la notificación real
        await supabase.rpc('create_notification_from_template', {
          user_id_param: scheduled.user_id,
          dog_id_param: scheduled.dog_id,
          template_key_param: scheduled.template_key,
          variables_param: scheduled.variables
        });

        // Marcar como enviada
        await supabase
          .from('scheduled_notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', scheduled.id);

        console.log(`✅ Notificación programada enviada: ${scheduled.template_key}`);
      } catch (error) {
        console.error(`❌ Error enviando notificación programada ${scheduled.id}:`, error);
      }
    }

    console.log('✅ Verificación diaria completada');
  } catch (error) {
    console.error('❌ Error en verificación diaria:', error);
  }
};

// Para ejecutar manualmente (en desarrollo):
// window.runDailyCheck = runDailyNotificationCheck;