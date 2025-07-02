// src/hooks/useNotificationIntegration.js
// 🔗 HOOKS PARA INTEGRAR NOTIFICACIONES CON LOS MANAGERS

import { useEffect } from 'react';
import { notificationScheduler, scheduleRoutineNotifications, scheduleVaccineNotifications, scheduleMedicineNotifications } from '../lib/notificationScheduler.js';

// ============================================
// 🔔 HOOK PRINCIPAL DE NOTIFICACIONES
// ============================================
export const useNotificationScheduler = () => {
  useEffect(() => {
    const initScheduler = async () => {
      if (Notification.permission === 'granted') {
        await notificationScheduler.initialize();
      }
    };

    initScheduler();

    // Cleanup al desmontar
    return () => {
      notificationScheduler.stop();
    };
  }, []);

  return {
    isRunning: notificationScheduler.isRunning,
    scheduleRoutine: scheduleRoutineNotifications,
    scheduleVaccine: scheduleVaccineNotifications,
    scheduleMedicine: scheduleMedicineNotifications
  };
};

// ============================================
// 📅 INTEGRACIÓN CON ROUTINE MANAGER
// ============================================

// AGREGAR ESTO AL RoutineFormManager.jsx en la función saveRoutine():

/*
// En RoutineFormManager.jsx - función saveRoutine(), después de insertar schedules:

import { scheduleRoutineNotifications } from '../lib/notificationScheduler.js';

// ... después de insertar schedules exitosamente:

// 3. Programar notificaciones
if ('serviceWorker' in navigator && 'PushManager' in window) {
  try {
    await scheduleRoutineNotifications(routine, schedules);
    console.log('✅ Notificaciones de rutina programadas');
  } catch (error) {
    console.error('❌ Error programando notificaciones:', error);
  }
}

*/

// ============================================
// 💉 INTEGRACIÓN CON VACCINE MANAGER  
// ============================================

// AGREGAR ESTO AL VaccineManager.jsx en la función handleSave():

/*
// En VaccineManager.jsx - función handleSave(), después de insertar/actualizar vacuna:

import { scheduleVaccineNotifications } from '../lib/notificationScheduler.js';

// ... después de guardar la vacuna exitosamente:

// Programar notificaciones para esta vacuna
if (!formData.administered && formData.next_due_date) {
  try {
    await scheduleVaccineNotifications({
      id: vaccineData.id,
      vaccine_name: formData.predefined_vaccine === 'custom' ? 
        formData.custom_vaccine_name : formData.predefined_vaccine,
      next_due_date: formData.next_due_date,
      dog_id: selectedDogId
    });
    console.log('✅ Notificaciones de vacuna programadas');
  } catch (error) {
    console.error('❌ Error programando notificaciones de vacuna:', error);
  }
}

*/

// ============================================
// 💊 INTEGRACIÓN CON MEDICINE MANAGER
// ============================================

// AGREGAR ESTO AL MedicineManager.jsx en la función handleSave():

/*
// En MedicineManager.jsx - función handleSave(), después de insertar/actualizar medicina:

import { scheduleMedicineNotifications } from '../lib/notificationScheduler.js';

// ... después de guardar la medicina exitosamente:

// Programar notificaciones para esta medicina
if (formData.is_ongoing && formData.next_dose_date) {
  try {
    await scheduleMedicineNotifications({
      id: medicineData.id,
      medicine_name: formData.medicine_name,
      next_dose_date: formData.next_dose_date,
      dose_time: formData.dose_time,
      is_ongoing: formData.is_ongoing,
      dog_id: selectedDogId
    });
    console.log('✅ Notificaciones de medicina programadas');
  } catch (error) {
    console.error('❌ Error programando notificaciones de medicina:', error);
  }
}

*/

// ============================================
// 🎯 COMPONENTE DE NOTIFICACIONES MEJORADO
// ============================================

export const NotificationManagerWidget = ({ userId, dogs }) => {
  const { isRunning, scheduleRoutine, scheduleVaccine, scheduleMedicine } = useNotificationScheduler();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#2C3E50]">🔔 Gestor de Notificaciones</h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          isRunning ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span>{isRunning ? 'Activo' : 'Inactivo'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">📅</span>
            <span className="font-medium text-blue-900">Rutinas</span>
          </div>
          <p className="text-sm text-blue-700">
            Recordatorios automáticos de rutinas diarias
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">💉</span>
            <span className="font-medium text-red-900">Vacunas</span>
          </div>
          <p className="text-sm text-red-700">
            Alertas de vencimiento de vacunas
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">💊</span>
            <span className="font-medium text-green-900">Medicinas</span>
          </div>
          <p className="text-sm text-green-700">
            Recordatorios de dosis de medicamentos
          </p>
        </div>
      </div>

      {!isRunning && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Tip:</strong> Activa las notificaciones en la sección "🔔 Notificaciones" 
            para recibir recordatorios automáticos.
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// 📊 TABLA DE NOTIFICACIONES PROGRAMADAS
// ============================================

export const ScheduledNotificationsTable = ({ dogId }) => {
  // Este componente mostraría todas las notificaciones programadas
  // para un perro específico (rutinas, vacunas, medicinas)
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-[#2C3E50] mb-4">📋 Notificaciones Programadas</h3>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="font-medium">Paseo matutino</p>
                <p className="text-sm text-gray-600">Todos los días a las 7:00 AM</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                Rutina
              </span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl">💉</span>
              <div>
                <p className="font-medium">Vacuna Rabia</p>
                <p className="text-sm text-gray-600">Vence en 3 días</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                Urgente
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default { useNotificationScheduler, NotificationManagerWidget, ScheduledNotificationsTable };