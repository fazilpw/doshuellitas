// 🔔 COMPONENTE: Panel de Control de Notificaciones Automáticas
// Ubicar en: src/components/notifications/NotificationControlPanel.jsx

import React, { useState, useEffect } from 'react';
import supabase from '../lib/supabase.js';

const NotificationControlPanel = ({ userId, dogs = [] }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({
    scheduledToday: 0,
    pendingNow: 0,
    sentToday: 0,
    routinesActive: 0
  });

  // ============================================
  // 📊 ESTADÍSTICAS EN TIEMPO REAL
  // ============================================
  
  const loadStats = async () => {
    try {
      // Notificaciones programadas para hoy
      const { data: scheduled } = await supabase
        .from('scheduled_notifications')
        .select('id')
        .gte('scheduled_for', new Date().toISOString().split('T')[0])
        .lt('scheduled_for', new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]);

      // Notificaciones pendientes ahora mismo
      const { data: pending } = await supabase
        .from('scheduled_notifications')
        .select('id')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString());

      // Notificaciones enviadas hoy
      const { data: sent } = await supabase
        .from('notifications')
        .select('id')
        .gte('created_at', new Date().toISOString().split('T')[0]);

      // Rutinas activas
      const { data: routines } = await supabase
        .from('routine_schedules')
        .select('id, dog_routines!inner(active)')
        .eq('active', true)
        .eq('dog_routines.active', true);

      setStats({
        scheduledToday: scheduled?.length || 0,
        pendingNow: pending?.length || 0,
        sentToday: sent?.length || 0,
        routinesActive: routines?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // 🔧 FUNCIONES DE CONTROL MANUAL
  // ============================================

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { 
      message, 
      type, 
      timestamp,
      id: Date.now() 
    }]);
  };

  const clearResults = () => setResults([]);

  // 1. GENERAR NOTIFICACIONES PARA MAÑANA
  const generateTomorrowNotifications = async () => {
    setLoading(true);
    try {
      addResult('🔄 Generando notificaciones para mañana...', 'info');

      const { data, error } = await supabase.rpc('manual_generate_todays_notifications');
      
      if (error) throw error;

      const result = data[0];
      addResult(`✅ ${result.message}`, 'success');
      loadStats(); // Actualizar estadísticas
      
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. PROCESAR NOTIFICACIONES PENDIENTES
  const processePendingNotifications = async () => {
    setLoading(true);
    try {
      addResult('🔄 Procesando notificaciones pendientes...', 'info');

      const { data, error } = await supabase.rpc('manual_process_notifications');
      
      if (error) throw error;

      const result = data[0];
      addResult(`✅ ${result.message}`, 'success');
      loadStats(); // Actualizar estadísticas
      
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. CREAR NOTIFICACIÓN DE PRUEBA INMEDIATA
  const createTestNotification = async (dogId, templateKey = 'routine_reminder') => {
    setLoading(true);
    try {
      const selectedDog = dogs.find(d => d.id === dogId);
      if (!selectedDog) throw new Error('Perro no encontrado');

      addResult(`🧪 Creando notificación de prueba para ${selectedDog.name}...`, 'info');

      const variables = {
        dogName: selectedDog.name,
        routineName: 'cena',
        notes: 'Prueba del sistema automático'
      };

      const { data, error } = await supabase.rpc('create_manual_notification', {
        p_user_id: userId,
        p_dog_id: dogId,
        p_template_key: templateKey,
        p_variables: variables
      });
      
      if (error) throw error;

      addResult(`✅ Notificación de prueba creada (ID: ${data})`, 'success');
      loadStats();
      
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 4. CREAR RUTINA DE EMERGENCIA PARA PROBAR
  const createEmergencyRoutine = async (dogId) => {
    setLoading(true);
    try {
      const selectedDog = dogs.find(d => d.id === dogId);
      if (!selectedDog) throw new Error('Perro no encontrado');

      addResult(`🚨 Creando rutina de emergencia para ${selectedDog.name}...`, 'info');

      // Crear rutina en 2 minutos
      const futureTime = new Date(Date.now() + 2 * 60 * 1000);
      const timeString = futureTime.toTimeString().slice(0, 8);

      // 1. Crear dog_routine
      const { data: routine, error: routineError } = await supabase
        .from('dog_routines')
        .insert({
          dog_id: dogId,
          routine_category: 'entrenamiento',
          name: 'test_emergencia',
          notes: 'Rutina de prueba - se puede eliminar'
        })
        .select()
        .single();

      if (routineError) throw routineError;

      // 2. Crear routine_schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('routine_schedules')
        .insert({
          routine_id: routine.id,
          name: `Prueba - ${selectedDog.name}`,
          time: timeString,
          reminder_minutes: 1, // Notificación 1 minuto antes
          active: true
        })
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      addResult(`✅ Rutina de emergencia creada: ${timeString} (notificación en 1 minuto)`, 'success');
      addResult(`📝 Rutina ID: ${routine.id} | Schedule ID: ${schedule.id}`, 'info');
      
      setTimeout(() => {
        loadStats();
        addResult('🔔 ¡Deberías recibir una notificación ahora!', 'warning');
      }, 60000); // Recordatorio en 1 minuto
      
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🎨 INTERFAZ DE USUARIO
  // ============================================

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          🔔 Panel de Control - Notificaciones Automáticas
        </h3>
        <button
          onClick={clearResults}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Limpiar Log
        </button>
      </div>

      {/* ESTADÍSTICAS EN TIEMPO REAL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.scheduledToday}</div>
          <div className="text-sm text-blue-600">Programadas Hoy</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.pendingNow}</div>
          <div className="text-sm text-orange-600">Pendientes Ahora</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.sentToday}</div>
          <div className="text-sm text-green-600">Enviadas Hoy</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.routinesActive}</div>
          <div className="text-sm text-purple-600">Rutinas Activas</div>
        </div>
      </div>

      {/* BOTONES DE CONTROL MANUAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={generateTomorrowNotifications}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
        >
          {loading ? '⏳ Generando...' : '📅 Generar Notificaciones Mañana'}
        </button>

        <button
          onClick={processePendingNotifications}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
        >
          {loading ? '⏳ Procesando...' : '⚡ Procesar Pendientes Ahora'}
        </button>
      </div>

      {/* PRUEBAS RÁPIDAS */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-900 mb-4">🧪 Pruebas Rápidas</h4>
        
        <div className="space-y-3">
          {dogs.map(dog => (
            <div key={dog.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span className="font-medium">{dog.name}</span>
              <div className="space-x-2">
                <button
                  onClick={() => createTestNotification(dog.id)}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                >
                  Notificación Test
                </button>
                <button
                  onClick={() => createEmergencyRoutine(dog.id)}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                >
                  Rutina Emergencia
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOG DE RESULTADOS */}
      {results.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h4 className="font-medium text-gray-900 mb-4">📋 Log de Actividad</h4>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {results.map(result => (
              <div key={result.id} className={`mb-1 ${
                result.type === 'error' ? 'text-red-400' : 
                result.type === 'success' ? 'text-green-400' : 
                result.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
              }`}>
                <span className="text-gray-500">[{result.timestamp}]</span> {result.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSTRUCCIONES */}
      <div className="border-t pt-6 mt-6 text-sm text-gray-600">
        <h4 className="font-medium text-gray-900 mb-2">💡 Instrucciones</h4>
        <ul className="space-y-1">
          <li>• <strong>Generar Mañana:</strong> Crea notificaciones para todas las rutinas del día siguiente</li>
          <li>• <strong>Procesar Pendientes:</strong> Envía inmediatamente las notificaciones que deberían haberse enviado</li>
          <li>• <strong>Notificación Test:</strong> Crea una notificación instantánea para probar</li>
          <li>• <strong>Rutina Emergencia:</strong> Crea una rutina en 2 minutos con notificación para probar el sistema completo</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationControlPanel;

// ============================================
// 🔧 HELPER: Hook para usar en otras partes de la app
// ============================================

export const useNotificationSystem = () => {
  const [systemStatus, setSystemStatus] = useState({
    isWorking: false,
    lastCheck: null,
    pendingCount: 0,
    todayCount: 0
  });

  const checkSystemHealth = async () => {
    try {
      // Verificar si hay notificaciones pendientes que deberían haberse enviado
      const { data: overdue, error } = await supabase
        .from('scheduled_notifications')
        .select('id')
        .eq('status', 'pending')
        .lt('scheduled_for', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutos de retraso

      if (error) throw error;

      const isWorking = (overdue?.length || 0) === 0;
      
      setSystemStatus({
        isWorking,
        lastCheck: new Date(),
        pendingCount: overdue?.length || 0,
        todayCount: 0 // Se puede agregar más lógica aquí
      });

      return isWorking;
    } catch (error) {
      console.error('Error checking notification system health:', error);
      return false;
    }
  };

  const forceProcessPending = async () => {
    try {
      const { data, error } = await supabase.rpc('manual_process_notifications');
      if (error) throw error;
      
      await checkSystemHealth(); // Actualizar estado
      return data[0];
    } catch (error) {
      console.error('Error forcing process:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 60000); // Verificar cada minuto
    return () => clearInterval(interval);
  }, []);

  return {
    systemStatus,
    checkSystemHealth,
    forceProcessPending
  };
};