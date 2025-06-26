// src/components/routines/ExerciseManager.jsx - SISTEMA DE EJERCICIOS Y PASEOS
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const ExerciseManager = ({ dog, onClose, onSave }) => {
  const [exerciseSchedule, setExerciseSchedule] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [loading, setLoading] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  // Presets basados en raza, tamaño y energía
  const exercisePresets = {
    high_energy_large: {
      label: 'Raza Grande - Alta Energía',
      breeds: ['Golden Retriever', 'Border Collie', 'Pastor Alemán', 'Labrador'],
      totalMinutes: 120,
      sessions: [
        { name: 'Paseo Matutino Intenso', time: '07:00', duration: 45, type: 'walk', intensity: 'alta' },
        { name: 'Juego Mental', time: '12:00', duration: 15, type: 'mental', intensity: 'media' },
        { name: 'Ejercicio Activo', time: '16:00', duration: 30, type: 'play', intensity: 'alta' },
        { name: 'Paseo Nocturno', time: '19:30', duration: 30, type: 'walk', intensity: 'media' }
      ],
      description: 'Razas activas necesitan ejercicio intenso y estimulación mental'
    },
    medium_energy_medium: {
      label: 'Raza Mediana - Energía Media',
      breeds: ['Beagle', 'Cocker Spaniel', 'Bulldog Francés', 'Schnauzer'],
      totalMinutes: 90,
      sessions: [
        { name: 'Paseo Matutino', time: '07:30', duration: 30, type: 'walk', intensity: 'media' },
        { name: 'Tiempo de Juego', time: '15:00', duration: 20, type: 'play', intensity: 'media' },
        { name: 'Paseo Vespertino', time: '18:00', duration: 25, type: 'walk', intensity: 'media' },
        { name: 'Actividad Mental', time: '20:00', duration: 15, type: 'mental', intensity: 'baja' }
      ],
      description: 'Balance perfecto entre ejercicio físico y mental'
    },
    low_energy_small: {
      label: 'Raza Pequeña - Baja Energía',
      breeds: ['Chihuahua', 'Pug', 'Shih Tzu', 'Maltés'],
      totalMinutes: 60,
      sessions: [
        { name: 'Paseo Suave Mañana', time: '08:00', duration: 20, type: 'walk', intensity: 'baja' },
        { name: 'Juego Interior', time: '14:00', duration: 15, type: 'play', intensity: 'baja' },
        { name: 'Paseo Tarde', time: '17:30', duration: 20, type: 'walk', intensity: 'baja' },
        { name: 'Relajación', time: '20:30', duration: 5, type: 'mental', intensity: 'baja' }
      ],
      description: 'Ejercicio suave adaptado a razas pequeñas'
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
      description: 'Ejercicio adaptado para perros mayores, enfoque en movilidad'
    },
    puppy_4_6_months: {
      label: 'Cachorro 4-6 meses',
      breeds: ['Todas las razas'],
      totalMinutes: 45,
      sessions: [
        { name: 'Exploración Matutina', time: '08:00', duration: 15, type: 'exploration', intensity: 'baja' },
        { name: 'Juego y Socialización', time: '14:00', duration: 15, type: 'play', intensity: 'media' },
        { name: 'Paseo Corto', time: '18:00', duration: 15, type: 'walk', intensity: 'baja' }
      ],
      description: 'Ejercicio suave para desarrollo de cachorros'
    }
  };

  // Tipos de actividades con iconos
  const activityTypes = {
    walk: { icon: '🚶‍♂️', label: 'Paseo', color: 'bg-blue-100 text-blue-800' },
    play: { icon: '🎾', label: 'Juego', color: 'bg-green-100 text-green-800' },
    mental: { icon: '🧠', label: 'Mental', color: 'bg-purple-100 text-purple-800' },
    therapy: { icon: '💆‍♂️', label: 'Terapia', color: 'bg-pink-100 text-pink-800' },
    exploration: { icon: '🔍', label: 'Exploración', color: 'bg-yellow-100 text-yellow-800' }
  };

  // Niveles de intensidad
  const intensityLevels = {
    baja: { color: 'bg-green-500', label: 'Suave' },
    media: { color: 'bg-yellow-500', label: 'Moderado' },
    alta: { color: 'bg-red-500', label: 'Intenso' }
  };

  useEffect(() => {
    if (dog) {
      loadExistingSchedule();
      suggestPreset();
    }
  }, [dog]);

  const loadExistingSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('routine_schedules')
        .select(`
          *,
          dog_routines!inner(*)
        `)
        .eq('dog_routines.dog_id', dog.id)
        .eq('dog_routines.routine_category', 'exercise')
        .eq('active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        setExerciseSchedule(data.map(item => ({
          id: item.id,
          name: item.name,
          time: item.time.slice(0, 5), // HH:MM format
          duration: item.notes ? parseInt(item.notes.match(/\d+/)?.[0]) || 30 : 30,
          type: item.notes?.includes('mental') ? 'mental' : 
                item.notes?.includes('juego') ? 'play' : 'walk',
          intensity: item.notes?.includes('intenso') ? 'alta' : 
                    item.notes?.includes('suave') ? 'baja' : 'media',
          reminder_minutes: item.reminder_minutes || 10
        })));
      }
    } catch (error) {
      console.error('Error loading exercise schedule:', error);
    }
  };

  const suggestPreset = () => {
    if (!dog) return;

    const breed = dog.breed?.toLowerCase() || '';
    const age = dog.age || 0;

    // Lógica de sugerencia inteligente
    if (age >= 7) {
      setSelectedPreset('senior_adapted');
    } else if (age < 1) {
      setSelectedPreset('puppy_4_6_months');
    } else if (dog.size === 'grande') {
      // Razas grandes típicamente más activas
      if (breed.includes('golden') || breed.includes('border') || breed.includes('pastor')) {
        setSelectedPreset('high_energy_large');
      } else {
        setSelectedPreset('medium_energy_medium');
      }
    } else if (dog.size === 'pequeño') {
      setSelectedPreset('low_energy_small');
    } else {
      setSelectedPreset('medium_energy_medium');
    }
  };

  const applyPreset = (presetKey) => {
    const preset = exercisePresets[presetKey];
    if (preset) {
      setExerciseSchedule(preset.sessions.map((session, index) => ({
        id: `temp_${index}`,
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

  const saveSchedule = async () => {
    if (!dog || exerciseSchedule.length === 0) return;
    
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
        days_of_week: '[1,2,3,4,5,6,7]', // Todos los días
        reminder_minutes: session.reminder_minutes,
        notes: `Duración: ${session.duration}min, Tipo: ${session.type}, Intensidad: ${session.intensity}`,
        active: true
      }));

      const { error: schedulesError } = await supabase
        .from('routine_schedules')
        .insert(schedules);

      if (schedulesError) throw schedulesError;

      // 4. Programar notificaciones para cada horario
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        schedules.forEach(schedule => {
          // Aquí se programarían las notificaciones push
          console.log(`📅 Programando notificación para ${schedule.name} a las ${schedule.time}`);
        });
      }

      onSave?.();
      onClose?.();
      
    } catch (error) {
      console.error('Error saving exercise schedule:', error);
      alert('Error guardando horario de ejercicio');
    }
    setLoading(false);
  };

  const getTotalMinutes = () => {
    return exerciseSchedule.reduce((total, session) => total + session.duration, 0);
  };

  const getPresetForDog = () => {
    return Object.entries(exercisePresets).find(([key, preset]) => 
      preset.breeds.includes(dog?.breed) || 
      (key === selectedPreset)
    )?.[1];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🚶‍♂️ Ejercicio y Paseos</h2>
              <p className="opacity-90">{dog?.name} - {dog?.breed}</p>
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
                <span className="ml-2 font-medium">{dog?.breed}</span>
              </div>
              <div>
                <span className="text-blue-700">Edad:</span>
                <span className="ml-2 font-medium">{dog?.age} años</span>
              </div>
              <div>
                <span className="text-blue-700">Tamaño:</span>
                <span className="ml-2 font-medium">{dog?.size}</span>
              </div>
            </div>
            {selectedPreset && (
              <p className="mt-2 text-blue-800">
                <strong>Sugerencia:</strong> {exercisePresets[selectedPreset]?.description}
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
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{preset.label}</div>
                  <div className="text-sm text-gray-600">{preset.totalMinutes} min/día</div>
                  <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Horario actual */}
          {exerciseSchedule.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">⏰ Horario de Ejercicio</h3>
                <div className="text-sm text-gray-600">
                  Total: <span className="font-medium">{getTotalMinutes()} minutos/día</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {exerciseSchedule.map((session, index) => {
                  const activityType = activityTypes[session.type];
                  const intensity = intensityLevels[session.intensity];
                  
                  return (
                    <div key={session.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{activityType.icon}</span>
                            <input
                              type="text"
                              value={session.name}
                              onChange={(e) => updateSession(session.id, 'name', e.target.value)}
                              className="font-medium text-gray-900 bg-transparent border-none outline-none flex-1"
                              placeholder="Nombre de la actividad"
                            />
                            <span className={`px-2 py-1 rounded-full text-xs ${activityType.color}`}>
                              {activityType.label}
                            </span>
                            <div className={`w-3 h-3 rounded-full ${intensity.color}`} title={intensity.label}></div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Hora */}
                            <div>
                              <label className="text-xs text-gray-500">Hora</label>
                              <input
                                type="time"
                                value={session.time}
                                onChange={(e) => updateSession(session.id, 'time', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            </div>
                            
                            {/* Duración */}
                            <div>
                              <label className="text-xs text-gray-500">Duración (min)</label>
                              <input
                                type="number"
                                value={session.duration}
                                onChange={(e) => updateSession(session.id, 'duration', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                min="5"
                                max="120"
                              />
                            </div>
                            
                            {/* Tipo de actividad */}
                            <div>
                              <label className="text-xs text-gray-500">Tipo</label>
                              <select
                                value={session.type}
                                onChange={(e) => updateSession(session.id, 'type', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                {Object.entries(activityTypes).map(([key, type]) => (
                                  <option key={key} value={key}>{type.icon} {type.label}</option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Intensidad */}
                            <div>
                              <label className="text-xs text-gray-500">Intensidad</label>
                              <select
                                value={session.intensity}
                                onChange={(e) => updateSession(session.id, 'intensity', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                {Object.entries(intensityLevels).map(([key, level]) => (
                                  <option key={key} value={key}>{level.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Recordatorio */}
                          <div className="flex items-center space-x-3 text-sm">
                            <span className="text-gray-500">Recordar:</span>
                            <select
                              value={session.reminder_minutes}
                              onChange={(e) => updateSession(session.id, 'reminder_minutes', parseInt(e.target.value))}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              <option value={0}>En el momento</option>
                              <option value={5}>5 min antes</option>
                              <option value={10}>10 min antes</option>
                              <option value={15}>15 min antes</option>
                              <option value={30}>30 min antes</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Botón eliminar */}
                        <button
                          onClick={() => removeSession(session.id)}
                          className="text-red-500 hover:text-red-700 p-1 ml-3"
                          title="Eliminar actividad"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botón agregar actividad personalizada */}
              <button
                onClick={addCustomSession}
                className="w-full mt-3 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                ➕ Agregar actividad personalizada
              </button>
            </div>
          )}

          {/* Consejos por tipo de ejercicio */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-bold text-green-900 mb-3">💡 Consejos de Ejercicio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-green-800 mb-2">🚶‍♂️ Paseos Efectivos:</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• Cambia de ruta para estimular mentalmente</li>
                  <li>• Permite olfatear - es ejercicio mental</li>
                  <li>• Ajusta velocidad según la edad</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">🎾 Juego y Actividad:</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Juegos de buscar fortalecen el vínculo</li>
                  <li>• Varía los juguetes semanalmente</li>
                  <li>• Incluye comandos en el juego</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-purple-800 mb-2">🧠 Estimulación Mental:</h4>
                <ul className="space-y-1 text-purple-700">
                  <li>• Esconde premios por la casa</li>
                  <li>• Enseña trucos nuevos regularmente</li>
                  <li>• Usa juguetes rompecabezas</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-orange-800 mb-2">⚠️ Precauciones:</h4>
                <ul className="space-y-1 text-orange-700">
                  <li>• Evita ejercicio intenso después de comer</li>
                  <li>• Ajusta según el clima</li>
                  <li>• Observa signos de fatiga</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Resumen y proyección */}
          {exerciseSchedule.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3">📊 Resumen Semanal</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{getTotalMinutes()}</div>
                  <div className="text-sm text-gray-600">min/día</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{Math.round(getTotalMinutes() * 7 / 60)}</div>
                  <div className="text-sm text-gray-600">horas/semana</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{exerciseSchedule.length}</div>
                  <div className="text-sm text-gray-600">actividades/día</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {exerciseSchedule.filter(s => s.type === 'walk').length}
                  </div>
                  <div className="text-sm text-gray-600">paseos/día</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="bg-gray-50 p-6 rounded-b-xl flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {exerciseSchedule.length === 0 ? (
              '⚠️ Selecciona un plan de ejercicio para comenzar'
            ) : (
              `✅ ${exerciseSchedule.length} actividades programadas`
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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
              <span>{loading ? 'Guardando...' : 'Guardar Horario'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseManager;