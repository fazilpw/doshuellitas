// src/components/notifications/NotificationSystem.jsx - SISTEMA COMPLETO DE NOTIFICACIONES
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const NotificationSystem = ({ userId, dogs = [] }) => {
  const [permission, setPermission] = useState('default');
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  useEffect(() => {
    // Verificar permisos existentes
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    
    // Cargar preferencias de usuario
    loadUserPreferences();
    
    // Registrar service worker si es necesario
    registerServiceWorker();
  }, [userId]);

  const registerServiceWorker = async () => {
     /*
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-notifications.js');
        console.log('📡 Service Worker registrado:', registration);
      } catch (error) {
        console.error('❌ Error registrando Service Worker:', error);
      }
    }
        */
  };

  const loadUserPreferences = async () => {
    if (!userId || dogs.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Convertir array a objeto para fácil acceso
      const prefsMap = {};
      data.forEach(pref => {
        prefsMap[pref.dog_id] = pref;
      });
      
      setPreferences(prefsMap);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones');
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);
    
    if (permission === 'granted') {
      // Crear preferencias por defecto para todos los perros
      await createDefaultPreferences();
      return true;
    } else {
      alert('Para recibir recordatorios de rutinas, necesitas permitir las notificaciones');
      return false;
    }
  };

  const createDefaultPreferences = async () => {
    if (!userId || dogs.length === 0) return;

    const defaultPrefs = dogs.map(dog => ({
      user_id: userId,
      dog_id: dog.id,
      push_notifications: true,
      routine_reminders: true,
      vaccine_reminders: true,
      exercise_reminders: true,
      routine_reminder_minutes: 5,
      vaccine_reminder_days: 7
    }));

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(defaultPrefs, { 
          onConflict: 'user_id,dog_id',
          ignoreDuplicates: false 
        });

      if (!error) {
        await loadUserPreferences();
      }
    } catch (error) {
      console.error('Error creating preferences:', error);
    }
  };

  const updatePreference = async (dogId, field, value) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          dog_id: dogId,
          [field]: value
        }, { onConflict: 'user_id,dog_id' });

      if (!error) {
        setPreferences(prev => ({
          ...prev,
          [dogId]: {
            ...prev[dogId],
            [field]: value
          }
        }));
      }
    } catch (error) {
      console.error('Error updating preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = () => {
    if (permission !== 'granted') {
      alert('Primero debes permitir las notificaciones');
      return;
    }

    const dogName = dogs[0]?.name || 'tu perro';
    
    new Notification('🔔 Club Canino - Prueba', {
      body: `¡Perfecto! Las notificaciones están funcionando. Te recordaremos las rutinas de ${dogName}.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'test-notification',
      vibrate: [200, 100, 200],
      data: {
        type: 'test',
        timestamp: Date.now()
      }
    });

    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const scheduleRoutineNotifications = async () => {
    // Esta función sería llamada por un worker en background
    // Por ahora simularemos las notificaciones para las próximas rutinas
    
    if (permission !== 'granted') return;

    try {
      // Obtener rutinas de hoy para todos los perros del usuario
      const { data: routines, error } = await supabase
        .from('routine_schedules')
        .select(`
          *,
          dog_routines!inner(
            name,
            routine_category,
            dog_id,
            dogs!inner(name, owner_id)
          )
        `)
        .eq('dog_routines.dogs.owner_id', userId)
        .eq('active', true);

      if (error) throw error;

      // Programar notificaciones para cada rutina
      routines.forEach(routine => {
        const dogName = routine.dog_routines.dogs.name;
        const routineName = routine.name;
        const routineTime = routine.time;
        const reminderMinutes = routine.reminder_minutes;

        // Calcular cuándo enviar la notificación
        const now = new Date();
        const [hours, minutes] = routineTime.split(':').map(Number);
        const routineDateTime = new Date();
        routineDateTime.setHours(hours, minutes - reminderMinutes, 0, 0);

        // Si la rutina es hoy y en el futuro
        if (routineDateTime > now) {
          const timeUntilNotification = routineDateTime.getTime() - now.getTime();
          
          setTimeout(() => {
            new Notification(`🔔 Recordatorio de ${dogName}`, {
              body: `${routineName} en ${reminderMinutes} minutos`,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/badge-72x72.png',
              tag: `routine-${routine.id}`,
              vibrate: [200, 100, 200],
              data: {
                type: 'routine',
                dogId: routine.dog_routines.dog_id,
                routineId: routine.id,
                timestamp: Date.now()
              }
            });
          }, timeUntilNotification);
        }
      });

    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const NotificationPreferences = ({ dog }) => {
    const prefs = preferences[dog.id] || {};
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#56CCF2] rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🐕</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{dog.name}</h3>
            <p className="text-sm text-gray-600">{dog.breed}</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Notificaciones Push</span>
              <p className="text-xs text-gray-500">Recibir alertas en tiempo real</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.push_notifications ?? true}
                onChange={(e) => updatePreference(dog.id, 'push_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#56CCF2]"></div>
            </label>
          </div>

          {/* Routine Reminders */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Recordatorios de Rutinas</span>
              <p className="text-xs text-gray-500">Comida, paseos, etc.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.routine_reminders ?? true}
                onChange={(e) => updatePreference(dog.id, 'routine_reminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#56CCF2]"></div>
            </label>
          </div>

          {/* Vaccine Reminders */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Recordatorios de Vacunas</span>
              <p className="text-xs text-gray-500">Próximas citas médicas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.vaccine_reminders ?? true}
                onChange={(e) => updatePreference(dog.id, 'vaccine_reminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#56CCF2]"></div>
            </label>
          </div>

          {/* Reminder Timing */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Tiempo de recordatorio de rutinas</label>
            <select
              value={prefs.routine_reminder_minutes ?? 5}
              onChange={(e) => updatePreference(dog.id, 'routine_reminder_minutes', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              <option value={0}>En el momento exacto</option>
              <option value={5}>5 minutos antes</option>
              <option value={10}>10 minutos antes</option>
              <option value={15}>15 minutos antes</option>
              <option value={30}>30 minutos antes</option>
            </select>
          </div>

          {/* Vaccine Reminder Timing */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Recordatorio de vacunas</label>
            <select
              value={prefs.vaccine_reminder_days ?? 7}
              onChange={(e) => updatePreference(dog.id, 'vaccine_reminder_days', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              <option value={1}>1 día antes</option>
              <option value={3}>3 días antes</option>
              <option value={7}>1 semana antes</option>
              <option value={14}>2 semanas antes</option>
              <option value={30}>1 mes antes</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white rounded-xl p-6">
        <h2 className="text-xl font-bold mb-2">🔔 Configuración de Notificaciones</h2>
        <p className="opacity-90">Personaliza cómo quieres recibir recordatorios para tus peluditos</p>
      </div>

      {/* Permission Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">Estado de Permisos</h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="font-medium text-gray-900">Notificaciones del Navegador</span>
            <p className="text-sm text-gray-600 mt-1">
              Estado actual: 
              <span className={`ml-1 font-medium ${
                permission === 'granted' ? 'text-green-600' : 
                permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {permission === 'granted' ? '✅ Permitidas' : 
                 permission === 'denied' ? '❌ Bloqueadas' : '⏳ Pendientes'}
              </span>
            </p>
          </div>
          
          {permission !== 'granted' && (
            <button 
              onClick={requestNotificationPermission}
              className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors text-sm"
            >
              🔔 Activar Notificaciones
            </button>
          )}
        </div>

        {permission === 'granted' && (
          <div className="space-y-3">
            <button
              onClick={sendTestNotification}
              disabled={testNotificationSent}
              className="w-full sm:w-auto bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 text-sm"
            >
              {testNotificationSent ? '✅ Notificación enviada' : '🧪 Enviar notificación de prueba'}
            </button>
            
            <button
              onClick={scheduleRoutineNotifications}
              className="w-full sm:w-auto bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors ml-0 sm:ml-3 mt-3 sm:mt-0 text-sm"
            >
              📅 Programar recordatorios de hoy
            </button>
          </div>
        )}

        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">Notificaciones Bloqueadas</h4>
            <p className="text-sm text-red-700 mb-3">
              Para recibir recordatorios automáticos, necesitas habilitar las notificaciones en la configuración de tu navegador.
            </p>
            <details className="text-sm text-red-600">
              <summary className="cursor-pointer font-medium">¿Cómo habilitar notificaciones?</summary>
              <div className="mt-2 space-y-1">
                <p><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Configuración del sitio → Notificaciones</p>
                <p><strong>Firefox:</strong> Preferencias → Privacidad y seguridad → Permisos → Notificaciones</p>
                <p><strong>Safari:</strong> Preferencias → Sitios web → Notificaciones</p>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">🌙 Horarios de Silencio</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configura cuando NO quieres recibir notificaciones (ej: durante la noche)
        </p>
        
        {dogs.length > 0 && (
          <div className="space-y-4">
            {dogs.map(dog => {
              const prefs = preferences[dog.id] || {};
              return (
                <div key={dog.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900">{dog.name}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefs.quiet_hours_enabled ?? false}
                        onChange={(e) => updatePreference(dog.id, 'quiet_hours_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#56CCF2]"></div>
                    </label>
                  </div>
                  
                  {prefs.quiet_hours_enabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Inicio</label>
                        <input
                          type="time"
                          value={prefs.quiet_start_time || '22:00'}
                          onChange={(e) => updatePreference(dog.id, 'quiet_start_time', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Fin</label>
                        <input
                          type="time"
                          value={prefs.quiet_end_time || '07:00'}
                          onChange={(e) => updatePreference(dog.id, 'quiet_end_time', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual Dog Preferences */}
      {dogs.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-4">🐕 Configuración por Perro</h3>
          <div className="space-y-4">
            {dogs.map(dog => (
              <NotificationPreferences key={dog.id} dog={dog} />
            ))}
          </div>
        </div>
      )}

      {/* Information Card */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="font-bold text-yellow-900 mb-3">📱 Cómo Funcionan las Notificaciones</h3>
        <div className="space-y-2 text-sm text-yellow-800">
          <p><strong>🔔 Push Notifications:</strong> Aparecen en tu pantalla aunque no tengas la app abierta</p>
          <p><strong>⏰ Recordatorios Automáticos:</strong> Te avisamos antes de cada rutina programada</p>
          <p><strong>💉 Alertas de Vacunas:</strong> Nunca olvides una cita importante del veterinario</p>
          <p><strong>🌙 Respeta tu Descanso:</strong> No molestamos durante las horas de silencio</p>
          <p><strong>📱 Funciona Offline:</strong> Los recordatorios se programan aunque cierres la app</p>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#56CCF2]"></div>
            <span className="text-gray-700">Guardando configuración...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;