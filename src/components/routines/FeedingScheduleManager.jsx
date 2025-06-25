// src/components/routines/FeedingScheduleManager.jsx - CONFIGURACIÓN FLEXIBLE DE ALIMENTACIÓN
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const FeedingScheduleManager = ({ dog, onClose, onSave }) => {
  const [feedingTimes, setFeedingTimes] = useState([]);
  const [feedingFrequency, setFeedingFrequency] = useState(2);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [loading, setLoading] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  // Presets basados en edad y tamaño
  const feedingPresets = {
    puppy_2_4_months: {
      label: 'Cachorro 2-4 meses',
      times: 4,
      schedule: [
        { name: 'Desayuno', time: '07:00' },
        { name: 'Media mañana', time: '11:00' },
        { name: 'Tarde', time: '15:00' },
        { name: 'Cena', time: '19:00' }
      ],
      description: 'Cachorros pequeños necesitan comidas frecuentes'
    },
    puppy_4_6_months: {
      label: 'Cachorro 4-6 meses',
      times: 3,
      schedule: [
        { name: 'Desayuno', time: '07:00' },
        { name: 'Almuerzo', time: '13:00' },
        { name: 'Cena', time: '19:00' }
      ],
      description: 'Reduciendo gradualmente la frecuencia'
    },
    adult_small_breed: {
      label: 'Adulto raza pequeña',
      times: 3,
      schedule: [
        { name: 'Desayuno', time: '07:00' },
        { name: 'Almuerzo', time: '13:00' },
        { name: 'Cena', time: '19:00' }
      ],
      description: 'Metabolismo más rápido, más comidas'
    },
    adult_large_breed: {
      label: 'Adulto raza grande',
      times: 2,
      schedule: [
        { name: 'Desayuno', time: '08:00' },
        { name: 'Cena', time: '18:00' }
      ],
      description: 'Previene torsión gástrica en razas grandes'
    },
    senior_dog: {
      label: 'Perro senior (+7 años)',
      times: 3,
      schedule: [
        { name: 'Desayuno', time: '07:00' },
        { name: 'Almuerzo', time: '13:00' },
        { name: 'Cena temprana', time: '17:30' }
      ],
      description: 'Digestión más fácil con comidas pequeñas'
    },
    working_schedule: {
      label: 'Horario de trabajo',
      times: 2,
      schedule: [
        { name: 'Desayuno temprano', time: '06:30' },
        { name: 'Cena', time: '19:30' }
      ],
      description: 'Antes y después del trabajo'
    }
  };

  // Lifestyle presets
  const lifestylePresets = {
    home_office: {
      label: 'Trabajo desde casa',
      times: 3,
      schedule: [
        { name: 'Desayuno', time: '08:00' },
        { name: 'Almuerzo', time: '13:00' },
        { name: 'Cena', time: '18:00' }
      ],
      description: 'Flexibilidad para horarios regulares'
    },
    irregular_schedule: {
      label: 'Horarios variables',
      times: 2,
      schedule: [
        { name: 'Comida 1', time: '08:00' },
        { name: 'Comida 2', time: '18:00' }
      ],
      description: 'Base que puedes ajustar día a día'
    }
  };

  useEffect(() => {
    // Cargar rutina existente si la hay
    loadExistingSchedule();
  }, [dog.id]);

  const loadExistingSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('dog_routines')
        .select(`
          *,
          routine_schedules(*)
        `)
        .eq('dog_id', dog.id)
        .eq('routine_category', 'food')
        .single();

      if (data && !error) {
        const schedules = data.routine_schedules.map(schedule => ({
          id: schedule.id,
          name: schedule.name,
          time: schedule.time,
          reminderMinutes: schedule.reminder_minutes,
          notes: schedule.notes || ''
        }));
        setFeedingTimes(schedules);
        setFeedingFrequency(schedules.length);
      } else {
        // No hay rutina existente, usar preset por defecto
        suggestPresetBasedOnDog();
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      suggestPresetBasedOnDog();
    }
  };

  const suggestPresetBasedOnDog = () => {
    // Lógica para sugerir preset basado en la información del perro
    const age = dog.age || 3;
    const size = dog.size?.toLowerCase() || 'medium';
    
    let suggestedPreset = 'adult_large_breed'; // default
    
    if (age < 1) {
      if (age < 0.3) { // menor a 4 meses
        suggestedPreset = 'puppy_2_4_months';
      } else {
        suggestedPreset = 'puppy_4_6_months';
      }
    } else if (age >= 7) {
      suggestedPreset = 'senior_dog';
    } else if (size === 'small' || size === 'pequeño') {
      suggestedPreset = 'adult_small_breed';
    } else {
      suggestedPreset = 'adult_large_breed';
    }
    
    setSelectedPreset(suggestedPreset);
    applyPreset(suggestedPreset);
  };

  const applyPreset = (presetKey) => {
    const preset = feedingPresets[presetKey] || lifestylePresets[presetKey];
    if (preset) {
      const newFeedingTimes = preset.schedule.map((item, index) => ({
        id: `new-${index}`,
        name: item.name,
        time: item.time,
        reminderMinutes: 5,
        notes: ''
      }));
      setFeedingTimes(newFeedingTimes);
      setFeedingFrequency(preset.times);
      setCustomMode(false);
    }
  };

  const setQuickSchedule = (times) => {
    const schedules = {
      1: [{ name: 'Comida única', time: '17:00' }],
      2: [
        { name: 'Desayuno', time: '08:00' },
        { name: 'Cena', time: '18:00' }
      ],
      3: [
        { name: 'Desayuno', time: '07:00' },
        { name: 'Almuerzo', time: '13:00' },
        { name: 'Cena', time: '19:00' }
      ],
      4: [
        { name: 'Desayuno', time: '07:00' },
        { name: 'Media mañana', time: '11:00' },
        { name: 'Tarde', time: '15:00' },
        { name: 'Cena', time: '19:00' }
      ]
    };

    const newFeedingTimes = schedules[times].map((item, index) => ({
      id: `quick-${index}`,
      name: item.name,
      time: item.time,
      reminderMinutes: 5,
      notes: ''
    }));

    setFeedingTimes(newFeedingTimes);
    setFeedingFrequency(times);
    setCustomMode(true);
    setSelectedPreset('');
  };

  const addFeedingTime = () => {
    const newFeeding = {
      id: `custom-${Date.now()}`,
      name: `Comida ${feedingTimes.length + 1}`,
      time: '12:00',
      reminderMinutes: 5,
      notes: ''
    };
    setFeedingTimes([...feedingTimes, newFeeding]);
    setFeedingFrequency(feedingTimes.length + 1);
    setCustomMode(true);
  };

  const removeFeedingTime = (id) => {
    const newTimes = feedingTimes.filter(f => f.id !== id);
    setFeedingTimes(newTimes);
    setFeedingFrequency(newTimes.length);
  };

  const updateFeedingTime = (id, field, value) => {
    setFeedingTimes(prev => 
      prev.map(f => 
        f.id === id ? { ...f, [field]: value } : f
      )
    );
  };

  const saveSchedule = async () => {
    setLoading(true);
    try {
      // Primero, obtener o crear la rutina de alimentación
      let routineId;
      
      const { data: existingRoutine } = await supabase
        .from('dog_routines')
        .select('id')
        .eq('dog_id', dog.id)
        .eq('routine_category', 'food')
        .single();

      if (existingRoutine) {
        routineId = existingRoutine.id;
        
        // Eliminar horarios existentes
        await supabase
          .from('routine_schedules')
          .delete()
          .eq('routine_id', routineId);
      } else {
        // Crear nueva rutina
        const { data: newRoutine, error } = await supabase
          .from('dog_routines')
          .insert({
            dog_id: dog.id,
            routine_category: 'food',
            name: `Alimentación de ${dog.name}`
          })
          .select('id')
          .single();

        if (error) throw error;
        routineId = newRoutine.id;
      }

      // Insertar nuevos horarios
      const schedules = feedingTimes.map(time => ({
        routine_id: routineId,
        name: time.name,
        time: time.time,
        reminder_minutes: time.reminderMinutes,
        notes: time.notes,
        days_of_week: [1, 2, 3, 4, 5, 6, 7] // Todos los días
      }));

      const { error: scheduleError } = await supabase
        .from('routine_schedules')
        .insert(schedules);

      if (scheduleError) throw scheduleError;

      // Llamar callback de éxito
      onSave && onSave();
      onClose();
      
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error guardando horarios. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black bg-opacity-50 p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full h-full sm:h-auto sm:rounded-xl sm:max-w-2xl sm:max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white p-4 sm:p-6 sm:rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">🍽️ Configurar Alimentación</h2>
              <p className="opacity-90 mt-1 text-sm sm:text-base">Horarios de comida para {dog.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Presets recomendados */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">🎯 Rutinas Recomendadas</h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(feedingPresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedPreset(key);
                    applyPreset(key);
                  }}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    selectedPreset === key
                      ? 'border-[#56CCF2] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{preset.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{preset.times} comidas/día</div>
                  <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Opciones de estilo de vida */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">👥 Según tu Estilo de Vida</h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(lifestylePresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedPreset(key);
                    applyPreset(key);
                  }}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    selectedPreset === key
                      ? 'border-[#56CCF2] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{preset.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{preset.times} comidas/día</div>
                  <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuración rápida */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">⚡ Configuración Rápida</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(times => (
                <button
                  key={times}
                  onClick={() => setQuickSchedule(times)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:border-[#56CCF2] hover:bg-blue-50 transition-colors text-sm"
                >
                  {times} vez{times > 1 ? 'es' : ''}/día
                </button>
              ))}
            </div>
          </div>

          {/* Horarios configurados */}
          {feedingTimes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">⏰ Horarios Configurados</h3>
                <span className="text-xs sm:text-sm text-gray-600">{feedingTimes.length} comidas/día</span>
              </div>
              
              <div className="space-y-3">
                {feedingTimes.map((feeding, index) => (
                  <div key={feeding.id} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="space-y-3">
                      
                      {/* Nombre y hora - Mobile first */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                          <input
                            type="text"
                            value={feeding.name}
                            onChange={(e) => updateFeedingTime(feeding.id, 'name', e.target.value)}
                            placeholder="ej: Desayuno"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Hora</label>
                          <input
                            type="time"
                            value={feeding.time}
                            onChange={(e) => updateFeedingTime(feeding.id, 'time', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Recordatorio y notas */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Recordatorio (minutos antes)</label>
                          <select
                            value={feeding.reminderMinutes}
                            onChange={(e) => updateFeedingTime(feeding.id, 'reminderMinutes', parseInt(e.target.value))}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                          >
                            <option value={0}>Sin recordatorio</option>
                            <option value={5}>5 minutos antes</option>
                            <option value={10}>10 minutos antes</option>
                            <option value={15}>15 minutos antes</option>
                            <option value={30}>30 minutos antes</option>
                          </select>
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => removeFeedingTime(feeding.id)}
                            className="w-full bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors"
                            disabled={feedingTimes.length <= 1}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>

                      {/* Notas opcionales */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Notas (opcional)</label>
                        <input
                          type="text"
                          value={feeding.notes}
                          onChange={(e) => updateFeedingTime(feeding.id, 'notes', e.target.value)}
                          placeholder="ej: Comida especial para cachorros"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={addFeedingTime}
                className="w-full mt-3 border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-[#56CCF2] hover:text-[#56CCF2] transition-colors text-sm"
              >
                + Agregar otro horario
              </button>
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-blue-900 text-sm mb-2">💡 Consejos sobre Alimentación</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Consistencia:</strong> Los perros se adaptan mejor con horarios fijos</li>
              <li>• <strong>Cachorros:</strong> Necesitan comidas más frecuentes (3-4 veces/día)</li>
              <li>• <strong>Adultos:</strong> 2 veces al día es lo más común y saludable</li>
              <li>• <strong>Seniors:</strong> Comidas más pequeñas ayudan con la digestión</li>
            </ul>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50 sm:rounded-b-xl">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={saveSchedule}
              disabled={loading || feedingTimes.length === 0}
              className="flex-1 bg-[#56CCF2] text-white py-3 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </div>
              ) : (
                '✅ Guardar Horarios'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedingScheduleManager;