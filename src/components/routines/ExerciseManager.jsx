// src/components/routines/ExerciseManager.jsx - SISTEMA COMPLETO DE EJERCICIOS
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const ExerciseManager = ({ dog, onClose, onSave }) => {
  const [exerciseSchedule, setExerciseSchedule] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [loading, setLoading] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  // ============================================
  // 🏃‍♂️ PRESETS DE EJERCICIO POR TIPO DE PERRO
  // ============================================
  const exercisePresets = {
    high_energy_large: {
      label: 'Raza Grande - Alta Energía',
      breeds: ['Golden Retriever', 'Border Collie', 'Pastor Alemán', 'Labrador', 'Husky'],
      totalMinutes: 120,
      sessions: [
        { name: 'Paseo Matutino Intenso', time: '07:00', duration: 45, type: 'walk', intensity: 'alta' },
        { name: 'Juego Mental', time: '12:00', duration: 15, type: 'mental', intensity: 'media' },
        { name: 'Ejercicio Activo', time: '16:00', duration: 30, type: 'play', intensity: 'alta' },
        { name: 'Paseo Nocturno', time: '19:30', duration: 30, type: 'walk', intensity: 'media' }
      ],
      description: 'Razas activas necesitan ejercicio intenso y estimulación mental diaria'
    },
    medium_energy_medium: {
      label: 'Raza Mediana - Energía Media',
      breeds: ['Beagle', 'Cocker Spaniel', 'Bulldog Francés', 'Schnauzer', 'Boxer'],
      totalMinutes: 90,
      sessions: [
        { name: 'Paseo Matutino', time: '07:30', duration: 30, type: 'walk', intensity: 'media' },
        { name: 'Tiempo de Juego', time: '15:00', duration: 20, type: 'play', intensity: 'media' },
        { name: 'Paseo Vespertino', time: '18:00', duration: 25, type: 'walk', intensity: 'media' },
        { name: 'Actividad Mental', time: '20:00', duration: 15, type: 'mental', intensity: 'baja' }
      ],
      description: 'Balance perfecto entre ejercicio físico y estimulación mental'
    },
    low_energy_small: {
      label: 'Raza Pequeña - Baja Energía',
      breeds: ['Chihuahua', 'Pug', 'Shih Tzu', 'Maltés', 'Pomerania'],
      totalMinutes: 60,
      sessions: [
        { name: 'Paseo Suave Mañana', time: '08:00', duration: 20, type: 'walk', intensity: 'baja' },
        { name: 'Juego Interior', time: '14:00', duration: 15, type: 'play', intensity: 'baja' },
        { name: 'Paseo Tarde', time: '17:30', duration: 20, type: 'walk', intensity: 'baja' },
        { name: 'Relajación', time: '20:30', duration: 5, type: 'mental', intensity: 'baja' }
      ],
      description: 'Ejercicio suave adaptado para razas pequeñas y de interior'
    },
    senior_adapted: {
      label: 'Perro Senior (7+ años)',
      breeds: ['Todas las razas'],
      totalMinutes: 75,
      sessions: [
        { name: 'Paseo Suave Mañana', time: '08:30', duration: 25, type: 'walk', intensity: 'baja' },
        { name: 'Estimulación Mental', time: '13:00', duration: 10, type: 'mental', intensity: 'baja' },
        { name: 'Paseo Corto Tarde', time: '17:00', duration: 20, type: 'walk', intensity: 'baja' },
        { name: 'Masaje/Relax', time: '19:00', duration: 10, type: 'therapy', intensity: 'baja' }
      ],
      description: 'Ejercicio adaptado para perros mayores, enfoque en movilidad y bienestar'
    },
    puppy_4_6_months: {
      label: 'Cachorro 4-6 meses',
      breeds: ['Todas las razas'],
      totalMinutes: 45,
      sessions: [
        { name: 'Exploración Matutina', time: '08:00', duration: 15, type: 'exploration', intensity: 'baja' },
        { name: 'Socialización', time: '11:00', duration: 10, type: 'social', intensity: 'baja' },
        { name: 'Juego Supervisado', time: '16:00', duration: 15, type: 'play', intensity: 'media' },
        { name: 'Entrenamiento Básico', time: '19:00', duration: 5, type: 'training', intensity: 'baja' }
      ],
      description: 'Ejercicio controlado para desarrollo saludable del cachorro'
    }
  };

  // ============================================
  // 🔧 EFECTOS Y CARGAS INICIALES
  // ============================================
  useEffect(() => {
    if (dog) {
      loadExistingSchedule();
      suggestPreset();
    }
  }, [dog]);

  const loadExistingSchedule = async () => {
    if (!dog) return;
    
    try {
      const { data, error } = await supabase
        .from('routine_schedules')
        .select(`
          *,
          dog_routines!inner(*)
        `)
        .eq('dog_routines.dog_id', dog.id)
        .eq('dog_routines.routine_category', 'exercise')
        .eq('dog_routines.active', true)
        .eq('active', true);

      if (!error && data && data.length > 0) {
        // Convertir datos de BD a formato del estado
        setExerciseSchedule(data.map((item, index) => ({
          id: item.id,
          name: item.name,
          time: item.time.slice(0, 5),
          duration: item.notes?.includes('Duración:') ? 
            parseInt(item.notes.match(/\d+/)?.[0]) || 30 : 30,
          type: item.notes?.includes('mental') ? 'mental' : 
                item.notes?.includes('juego') ? 'play' : 'walk',
          intensity: item.notes?.includes('intenso') ? 'alta' : 
                    item.notes?.includes('suave') ? 'baja' : 'media',
          reminder_minutes: item.reminder_minutes || 10
        })));
        setCustomMode(true);
      }
    } catch (error) {
      console.error('Error loading exercise schedule:', error);
    }
  };

  const suggestPreset = () => {
    if (!dog) return;

    const breed = dog.breed?.toLowerCase() || '';
    const age = dog.age || 0;
    const size = dog.size?.toLowerCase() || '';

    // Lógica de sugerencia inteligente
    if (age >= 7) {
      setSelectedPreset('senior_adapted');
    } else if (age < 1) {
      setSelectedPreset('puppy_4_6_months');
    } else if (size === 'grande' || size === 'grand') {
      // Razas grandes típicamente más activas
      if (breed.includes('golden') || breed.includes('border') || 
          breed.includes('pastor') || breed.includes('labrador')) {
        setSelectedPreset('high_energy_large');
      } else {
        setSelectedPreset('medium_energy_medium');
      }
    } else if (size === 'pequeño' || size === 'small') {
      setSelectedPreset('low_energy_small');
    } else {
      setSelectedPreset('medium_energy_medium');
    }
  };

  // ============================================
  // 🔄 FUNCIONES DE GESTIÓN DE SESIONES
  // ============================================
  const applyPreset = (presetKey) => {
    const preset = exercisePresets[presetKey];
    if (preset) {
      setExerciseSchedule(preset.sessions.map((session, index) => ({
        id: `preset_${index}`,
        ...session,
        reminder_minutes: 10
      })));
      setSelectedPreset(presetKey);
      setCustomMode(false);
    }
  };

  const addCustomSession = () => {
    const newSession = {
      id: `custom_${Date.now()}`,
      name: 'Nueva Actividad',
      time: '08:00',
      duration: 30,
      type: 'walk',
      intensity: 'media',
      reminder_minutes: 10
    };
    setExerciseSchedule([...exerciseSchedule, newSession]);
    setCustomMode(true);
  };

  const updateSession = (id, field, value) => {
    setExerciseSchedule(prev => prev.map(session => 
      session.id === id ? { ...session, [field]: value } : session
    ));
  };

  const removeSession = (id) => {
    setExerciseSchedule(prev => prev.filter(session => session.id !== id));
  };

  const getTotalMinutes = () => {
    return exerciseSchedule.reduce((total, session) => total + session.duration, 0);
  };

  const getPresetForDog = () => {
    return exercisePresets[selectedPreset];
  };

  // ============================================
  // 💾 GUARDAR EN BASE DE DATOS
  // ============================================
  const saveSchedule = async () => {
    if (!dog || exerciseSchedule.length === 0) {
      alert('Por favor agrega al menos una actividad de ejercicio');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Crear o actualizar rutina de ejercicio
      const { data: routine, error: routineError } = await supabase
        .from('dog_routines')
        .upsert({
          dog_id: dog.id,
          routine_category: 'exercise',
          name: `Ejercicio de ${dog.name}`,
          active: true
        }, { 
          onConflict: 'dog_id,routine_category',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (routineError) throw routineError;

      // 2. Eliminar horarios existentes
      await supabase
        .from('routine_schedules')
        .delete()
        .eq('routine_id', routine.id);

      // 3. Insertar nuevos horarios
      const schedules = exerciseSchedule.map(session => ({
        routine_id: routine.id,
        name: session.name,
        time: `${session.time}:00`,
        days_of_week: [1, 2, 3, 4, 5, 6, 7], // Todos los días
        reminder_minutes: session.reminder_minutes,
        notes: `Duración: ${session.duration}min, Tipo: ${session.type}, Intensidad: ${session.intensity}`,
        active: true
      }));

      const { error: schedulesError } = await supabase
        .from('routine_schedules')
        .insert(schedules);

      if (schedulesError) throw schedulesError;

      // 4. Programar notificaciones
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        schedules.forEach(schedule => {
          console.log(`📅 Programando notificación para ${schedule.name} a las ${schedule.time}`);
        });
      }

      console.log('✅ Horario de ejercicio guardado exitosamente');
      onSave?.();
      onClose?.();
      
    } catch (error) {
      console.error('Error saving exercise schedule:', error);
      alert(`Error guardando horario de ejercicio: ${error.message}`);
    }
    setLoading(false);
  };

  // ============================================
  // 🎨 COMPONENTE DE RENDERIZADO
  // ============================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🚶‍♂️ Ejercicio y Paseos</h2>
              <p className="opacity-90">{dog?.name} - {dog?.breed} ({dog?.size})</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Información del perro y sugerencia */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">💡 Recomendación Personalizada</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Raza:</span>
                <span className="ml-2 font-medium">{dog?.breed || 'No especificada'}</span>
              </div>
              <div>
                <span className="text-blue-700">Edad:</span>
                <span className="ml-2 font-medium">{dog?.age || 'No especificada'} años</span>
              </div>
              <div>
                <span className="text-blue-700">Tamaño:</span>
                <span className="ml-2 font-medium">{dog?.size || 'No especificado'}</span>
              </div>
            </div>
            {selectedPreset && exercisePresets[selectedPreset] && (
              <p className="mt-2 text-blue-800">
                <strong>Sugerencia:</strong> {exercisePresets[selectedPreset].description}
              </p>
            )}
          </div>

          {/* Presets disponibles */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">📋 Planes de Ejercicio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(exercisePresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`text-left p-4 rounded-lg border-2 transition-colors ${
                    selectedPreset === key
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{preset.label}</h4>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      {preset.totalMinutes} min/día
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{preset.description}</p>
                  <div className="text-xs text-gray-500">
                    {preset.sessions.length} actividades • {preset.breeds.slice(0, 2).join(', ')}
                    {preset.breeds.length > 2 && ` +${preset.breeds.length - 2} más`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Horario actual */}
          {exerciseSchedule.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  ⏰ Horario de Ejercicio ({getTotalMinutes()} min/día)
                </h3>
                <button
                  onClick={addCustomSession}
                  className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  + Agregar Actividad
                </button>
              </div>

              <div className="space-y-3">
                {exerciseSchedule.map((session, index) => (
                  <div key={session.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      {/* Nombre */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Actividad
                        </label>
                        <input
                          type="text"
                          value={session.name}
                          onChange={(e) => updateSession(session.id, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>

                      {/* Hora */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hora
                        </label>
                        <input
                          type="time"
                          value={session.time}
                          onChange={(e) => updateSession(session.id, 'time', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>

                      {/* Duración */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duración (min)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={session.duration}
                          onChange={(e) => updateSession(session.id, 'duration', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>

                      {/* Tipo e Intensidad */}
                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                          </label>
                          <select
                            value={session.type}
                            onChange={(e) => updateSession(session.id, 'type', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          >
                            <option value="walk">Paseo</option>
                            <option value="play">Juego</option>
                            <option value="mental">Mental</option>
                            <option value="training">Entrenamiento</option>
                            <option value="social">Social</option>
                            <option value="exploration">Exploración</option>
                          </select>
                        </div>
                        
                        {exerciseSchedule.length > 1 && (
                          <button
                            onClick={() => removeSession(session.id)}
                            className="text-red-500 hover:text-red-700 p-2"
                            title="Eliminar actividad"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Intensidad */}
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Intensidad
                      </label>
                      <div className="flex space-x-3">
                        {['baja', 'media', 'alta'].map(intensity => (
                          <button
                            key={intensity}
                            onClick={() => updateSession(session.id, 'intensity', intensity)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              session.intensity === intensity
                                ? intensity === 'alta' ? 'bg-red-100 text-red-800'
                                  : intensity === 'media' ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sin horario configurado */}
          {exerciseSchedule.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🚶‍♂️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sin rutina de ejercicio</h3>
              <p className="text-gray-600 mb-4">
                Selecciona un plan recomendado o crea tu propio horario personalizado
              </p>
              <button
                onClick={addCustomSession}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                + Crear Horario Personalizado
              </button>
            </div>
          )}

          {/* Consejos */}
          {exerciseSchedule.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-bold text-yellow-900 mb-2">💡 Consejos de Ejercicio</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• <strong>Gradual:</strong> Incrementa la intensidad del ejercicio gradualmente</li>
                <li>• <strong>Clima:</strong> Ajusta la actividad según las condiciones climáticas</li>
                <li>• <strong>Hidratación:</strong> Asegúrate de que tenga acceso a agua durante y después del ejercicio</li>
                <li>• <strong>Descanso:</strong> Permite tiempo de recuperación entre ejercicios intensos</li>
                <li>• <strong>Observación:</strong> Observa señales de cansancio excesivo o falta de aliento</li>
              </ul>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {exerciseSchedule.length === 0 ? (
                '⚠️ Selecciona un plan o agrega actividades'
              ) : (
                `✅ ${exerciseSchedule.length} actividades programadas (${getTotalMinutes()} min/día)`
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveSchedule}
                disabled={loading || exerciseSchedule.length === 0}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                <span>{loading ? 'Guardando...' : 'Guardar Horario'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseManager;