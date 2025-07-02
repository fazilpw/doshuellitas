// src/components/notifications/NotificationTester.jsx
// 🧪 COMPONENTE PARA PROBAR NOTIFICACIONES BÁSICAS CON EL NUEVO SCHEMA

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const NotificationTester = ({ userId, dogs = [] }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [testType, setTestType] = useState('basic');

  useEffect(() => {
    if (dogs.length > 0 && !selectedDog) {
      setSelectedDog(dogs[0]);
    }
  }, [dogs]);

  // ============================================
  // 🧪 PRUEBAS BÁSICAS DEL NUEVO SCHEMA
  // ============================================

  const runBasicTests = async () => {
    setTesting(true);
    setResults([]);
    
    const testResults = [];

    try {
      // 1. PROBAR FUNCIÓN DE PLANTILLAS
      addResult('🔧 Probando función process_notification_template...', 'info');
      
      const { data: templateTest, error: templateError } = await supabase
        .rpc('process_notification_template', {
          template_key_param: 'transport_started',
          variables_param: {
            dogName: selectedDog?.name || 'Max',
            eta: '25'
          }
        });

      if (templateError) {
        addResult('❌ Error en plantillas: ' + templateError.message, 'error');
      } else {
        addResult('✅ Plantillas funcionando: ' + templateTest[0]?.title, 'success');
      }

      // 2. CREAR NOTIFICACIÓN DESDE PLANTILLA
      addResult('📝 Creando notificación desde plantilla...', 'info');
      
      const { data: notificationId, error: createError } = await supabase
        .rpc('create_notification_from_template', {
          user_id_param: userId,
          dog_id_param: selectedDog?.id,
          template_key_param: 'transport_started',
          variables_param: {
            dogName: selectedDog?.name || 'Max',
            eta: '25'
          }
        });

      if (createError) {
        addResult('❌ Error creando notificación: ' + createError.message, 'error');
      } else {
        addResult('✅ Notificación creada con ID: ' + notificationId, 'success');
      }

      // 3. VERIFICAR NOTIFICACIÓN EN TABLA
      addResult('🔍 Verificando notificación en base de datos...', 'info');
      
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (fetchError) {
        addResult('❌ Error verificando notificación: ' + fetchError.message, 'error');
      } else {
        addResult('✅ Notificación encontrada: ' + notification.title, 'success');
      }

      // 4. PROBAR NOTIFICACIÓN PROGRAMADA
      addResult('⏰ Creando notificación programada...', 'info');
      
      const futureTime = new Date(Date.now() + 60000); // 1 minuto en el futuro
      
      const { data: scheduledData, error: scheduleError } = await supabase
        .from('scheduled_notifications')
        .insert({
          user_id: userId,
          dog_id: selectedDog?.id,
          template_key: 'walk_reminder',
          variables: {
            dogName: selectedDog?.name || 'Max',
            duration: '20'
          },
          scheduled_for: futureTime.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (scheduleError) {
        addResult('❌ Error programando notificación: ' + scheduleError.message, 'error');
      } else {
        addResult('✅ Notificación programada para: ' + futureTime.toLocaleTimeString(), 'success');
      }

      // 5. VERIFICAR PLANTILLAS DISPONIBLES
      addResult('📋 Consultando plantillas disponibles...', 'info');
      
      const { data: templates, error: templatesError } = await supabase
        .from('notification_templates')
        .select('template_key, name, category')
        .eq('is_active', true);

      if (templatesError) {
        addResult('❌ Error consultando plantillas: ' + templatesError.message, 'error');
      } else {
        addResult(`✅ ${templates.length} plantillas disponibles`, 'success');
      }

    } catch (error) {
      addResult('❌ Error general: ' + error.message, 'error');
    }

    setTesting(false);
  };

  // ============================================
  // 🚐 PRUEBAS DE NOTIFICACIONES DE TRANSPORTE
  // ============================================

  const runTransportTests = async () => {
    setTesting(true);
    setResults([]);

    try {
      addResult('🚐 Probando notificaciones de transporte...', 'info');

      // Crear secuencia completa de transporte
      const transportSequence = [
        { template: 'transport_started', variables: { dogName: selectedDog?.name, eta: '25' } },
        { template: 'transport_approaching', variables: { dogName: selectedDog?.name, minutes: '5' } },
        { template: 'dog_picked_up', variables: { dogName: selectedDog?.name } }
      ];

      for (const [index, notification] of transportSequence.entries()) {
        addResult(`📡 Enviando: ${notification.template}...`, 'info');
        
        const { data: notificationId, error } = await supabase
          .rpc('create_notification_from_template', {
            user_id_param: userId,
            dog_id_param: selectedDog?.id,
            template_key_param: notification.template,
            variables_param: notification.variables
          });

        if (error) {
          addResult(`❌ Error en ${notification.template}: ${error.message}`, 'error');
        } else {
          addResult(`✅ ${notification.template} enviada`, 'success');
        }

        // Pequeña pausa entre notificaciones
        if (index < transportSequence.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error) {
      addResult('❌ Error en pruebas de transporte: ' + error.message, 'error');
    }

    setTesting(false);
  };

  // ============================================
  // 💊 PRUEBAS DE NOTIFICACIONES MÉDICAS
  // ============================================

  const runMedicalTests = async () => {
    setTesting(true);
    setResults([]);

    try {
      addResult('💊 Probando notificaciones médicas...', 'info');

      // Crear notificación de vacuna próxima
      const { data: vaccineNotification, error: vaccineError } = await supabase
        .rpc('create_notification_from_template', {
          user_id_param: userId,
          dog_id_param: selectedDog?.id,
          template_key_param: 'vaccine_due_soon',
          variables_param: {
            dogName: selectedDog?.name || 'Max',
            vaccineName: 'Rabia',
            days: '3'
          }
        });

      if (vaccineError) {
        addResult('❌ Error notificación vacuna: ' + vaccineError.message, 'error');
      } else {
        addResult('✅ Notificación de vacuna creada', 'success');
      }

      // Crear recordatorio de medicina
      const { data: medicineNotification, error: medicineError } = await supabase
        .rpc('create_notification_from_template', {
          user_id_param: userId,
          dog_id_param: selectedDog?.id,
          template_key_param: 'medicine_reminder',
          variables_param: {
            dogName: selectedDog?.name || 'Max',
            medicineName: 'Antibiótico',
            dosage: '1 pastilla'
          }
        });

      if (medicineError) {
        addResult('❌ Error recordatorio medicina: ' + medicineError.message, 'error');
      } else {
        addResult('✅ Recordatorio de medicina creado', 'success');
      }

    } catch (error) {
      addResult('❌ Error en pruebas médicas: ' + error.message, 'error');
    }

    setTesting(false);
  };

  // ============================================
  // 🎯 PRUEBAS DE NOTIFICACIONES DE COMPORTAMIENTO
  // ============================================

  const runBehaviorTests = async () => {
    setTesting(true);
    setResults([]);

    try {
      addResult('🎯 Probando notificaciones de comportamiento...', 'info');

      // Alerta de ansiedad
      const { data: anxietyAlert, error: anxietyError } = await supabase
        .rpc('create_notification_from_template', {
          user_id_param: userId,
          dog_id_param: selectedDog?.id,
          template_key_param: 'behavior_alert',
          variables_param: {
            dogName: selectedDog?.name || 'Max',
            behavior: 'ansiedad alta',
            recommendation: 'practicar ejercicios de relajación'
          }
        });

      if (anxietyError) {
        addResult('❌ Error alerta ansiedad: ' + anxietyError.message, 'error');
      } else {
        addResult('✅ Alerta de ansiedad creada', 'success');
      }

      // Mejora detectada
      const { data: improvement, error: improvementError } = await supabase
        .rpc('create_notification_from_template', {
          user_id_param: userId,
          dog_id_param: selectedDog?.id,
          template_key_param: 'behavior_improvement',
          variables_param: {
            dogName: selectedDog?.name || 'Max',
            area: 'obediencia',
            details: '¡Ha mejorado mucho siguiendo comandos!'
          }
        });

      if (improvementError) {
        addResult('❌ Error mejora detectada: ' + improvementError.message, 'error');
      } else {
        addResult('✅ Mejora de comportamiento registrada', 'success');
      }

    } catch (error) {
      addResult('❌ Error en pruebas de comportamiento: ' + error.message, 'error');
    }

    setTesting(false);
  };

  // ============================================
  // 🧪 FUNCIONES AUXILIARES
  // ============================================

  const addResult = (message, type) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { message, type, timestamp }]);
  };

  const runSelectedTest = () => {
    switch (testType) {
      case 'basic':
        runBasicTests();
        break;
      case 'transport':
        runTransportTests();
        break;
      case 'medical':
        runMedicalTests();
        break;
      case 'behavior':
        runBehaviorTests();
        break;
      default:
        runBasicTests();
    }
  };

  // ============================================
  // 🎨 RENDER
  // ============================================

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#2C3E50] mb-2">
          🧪 Pruebas de Notificaciones
        </h3>
        <p className="text-gray-600 text-sm">
          Prueba el nuevo sistema de notificaciones con plantillas
        </p>
      </div>

      {/* Configuración de prueba */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Perro para pruebas:
          </label>
          <select
            value={selectedDog?.id || ''}
            onChange={(e) => {
              const dog = dogs.find(d => d.id === e.target.value);
              setSelectedDog(dog);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {dogs.map(dog => (
              <option key={dog.id} value={dog.id}>
                {dog.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de prueba:
          </label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="basic">🔧 Pruebas Básicas</option>
            <option value="transport">🚐 Transporte</option>
            <option value="medical">💊 Médicas</option>
            <option value="behavior">🎯 Comportamiento</option>
          </select>
        </div>
      </div>

      {/* Botón de prueba */}
      <button
        onClick={runSelectedTest}
        disabled={testing || !userId || !selectedDog}
        className="w-full bg-[#56CCF2] text-white py-3 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {testing ? '⏳ Ejecutando pruebas...' : '🚀 Ejecutar Pruebas'}
      </button>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h4 className="font-bold text-gray-800 mb-3">📊 Resultados:</h4>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 text-sm ${
                  result.type === 'success' ? 'text-green-700' :
                  result.type === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}
              >
                <span className="text-xs text-gray-500 min-w-[60px]">
                  {result.timestamp}
                </span>
                <span className="flex-1">{result.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información sobre las pruebas */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2">💡 ¿Qué prueban estas funciones?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Básicas:</strong> Plantillas, funciones SQL, notificaciones programadas</li>
          <li>• <strong>Transporte:</strong> Secuencia completa de recogida y entrega</li>
          <li>• <strong>Médicas:</strong> Recordatorios de vacunas y medicinas</li>
          <li>• <strong>Comportamiento:</strong> Alertas y mejoras detectadas</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationTester;