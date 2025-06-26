// src/components/routines/RoutineFormManager.jsx - FORMULARIO COMPLETO DE RUTINAS
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const RoutineFormManager = ({ dog, onClose, onSave, editingRoutine = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'food',
    schedules: [
      {
        name: '',
        time: '08:00',
        days_of_week: [1, 2, 3, 4, 5, 6, 7], // Todos los días por defecto
        reminder_minutes: 10,
        notes: ''
      }
    ]
  });
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Categorías de rutinas con sus opciones
  const routineCategories = {
    food: {
      label: 'Alimentación',
      icon: '🍽️',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      presets: [
        { name: 'Desayuno', time: '07:00', notes: 'Ración matutina' },
        { name: 'Almuerzo', time: '13:00', notes: 'Ración del mediodía' },
        { name: 'Cena', time: '19:00', notes: 'Ración nocturna' },
        { name: 'Snack Saludable', time: '16:00', notes: 'Premio o snack' }
      ]
    },
    exercise: {
      label: 'Ejercicio',
      icon: '🚶‍♂️',
      color: 'bg-green-100 text-green-800 border-green-200',
      presets: [
        { name: 'Paseo Matutino', time: '07:30', notes: '30-45 minutos de caminata' },
        { name: 'Paseo Vespertino', time: '18:00', notes: '30-45 minutos de caminata' },
        { name: 'Tiempo de Juego', time: '16:00', notes: '15-20 minutos de actividad' },
        { name: 'Ejercicio Intenso', time: '08:00', notes: 'Correr o actividad intensa' }
      ]
    },
    hygiene: {
      label: 'Higiene',
      icon: '🛁',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      presets: [
        { name: 'Cepillado Dental', time: '20:00', notes: 'Limpieza de dientes' },
        { name: 'Cepillado de Pelo', time: '19:00', notes: 'Cuidado del pelaje' },
        { name: 'Baño Semanal', time: '10:00', notes: 'Baño completo' },
        { name: 'Limpieza de Oídos', time: '18:00', notes: 'Revisión y limpieza' }
      ]
    },
    medical: {
      label: 'Médico',
      icon: '💊',
      color: 'bg-red-100 text-red-800 border-red-200',
      presets: [
        { name: 'Medicamento Mañana', time: '08:00', notes: 'Dosis matutina' },
        { name: 'Medicamento Noche', time: '20:00', notes: 'Dosis nocturna' },
        { name: 'Vitaminas', time: '07:00', notes: 'Suplementos diarios' },
        { name: 'Tratamiento Tópico', time: '12:00', notes: 'Aplicación externa' }
      ]
    },
    play: {
      label: 'Juego',
      icon: '🎾',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      presets: [
        { name: 'Juego Mental', time: '15:00', notes: 'Rompecabezas o juguetes' },
        { name: 'Juego de Buscar', time: '17:00', notes: 'Pelota o frisbee' },
        { name: 'Socialización', time: '16:00', notes: 'Juego con otros perros' },
        { name: 'Entrenamiento', time: '10:00', notes: 'Enseñar trucos nuevos' }
      ]
    }
  };

  // Días de la semana
  const daysOfWeek = [
    { id: 1, label: 'Lun', name: 'Lunes' },
    { id: 2, label: 'Mar', name: 'Martes' },
    { id: 3, label: 'Mié', name: 'Miércoles' },
    { id: 4, label: 'Jue', name: 'Jueves' },
    { id: 5, label: 'Vie', name: 'Viernes' },
    { id: 6, label: 'Sáb', name: 'Sábado' },
    { id: 7, label: 'Dom', name: 'Domingo' }
  ];

  useEffect(() => {
    if (editingRoutine) {
      loadEditingRoutine();
    }
  }, [editingRoutine]);

  const loadEditingRoutine = async () => {
    try {
      const { data, error } = await supabase
        .from('routine_schedules')
        .select('*')
        .eq('routine_id', editingRoutine.id);

      if (error) throw error;

      setFormData({
        name: editingRoutine.name,
        category: editingRoutine.routine_category,
        schedules: data.map(schedule => ({
          name: schedule.name,
          time: schedule.time.slice(0, 5),
          days_of_week: JSON.parse(schedule.days_of_week || '[1,2,3,4,5,6,7]'),
          reminder_minutes: schedule.reminder_minutes,
          notes: schedule.notes || ''
        }))
      });
    } catch (error) {
      console.error('Error loading routine:', error);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSchedule = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.map((schedule, i) => 
        i === index ? { ...schedule, [field]: value } : schedule
      )
    }));
  };

  const addSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, {
        name: '',
        time: '08:00',
        days_of_week: [1, 2, 3, 4, 5, 6, 7],
        reminder_minutes: 10,
        notes: ''
      }]
    }));
  };

  const removeSchedule = (index) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }));
  };

  const applyPreset = (preset) => {
    const newSchedule = {
      name: preset.name,
      time: preset.time,
      days_of_week: [1, 2, 3, 4, 5, 6, 7],
      reminder_minutes: 10,
      notes: preset.notes
    };
    
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, newSchedule]
    }));
  };

  const toggleDay = (scheduleIndex, dayId) => {
    const schedule = formData.schedules[scheduleIndex];
    const days = schedule.days_of_week.includes(dayId)
      ? schedule.days_of_week.filter(d => d !== dayId)
      : [...schedule.days_of_week, dayId].sort();
    
    updateSchedule(scheduleIndex, 'days_of_week', days);
  };

  const saveRoutine = async () => {
    if (!dog || !formData.name.trim() || formData.schedules.length === 0) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      // 1. Crear o actualizar rutina principal
      const routineData = {
        dog_id: dog.id,
        routine_category: formData.category,
        name: formData.name.trim(),
        active: true
      };

      let routine;
      if (editingRoutine) {
        const { data, error } = await supabase
          .from('dog_routines')
          .update(routineData)
          .eq('id', editingRoutine.id)
          .select()
          .single();
        
        if (error) throw error;
        routine = data;

        // Eliminar horarios existentes
        await supabase
          .from('routine_schedules')
          .delete()
          .eq('routine_id', routine.id);
      } else {
        const { data, error } = await supabase
          .from('dog_routines')
          .insert(routineData)
          .select()
          .single();
        
        if (error) throw error;
        routine = data;
      }

      // 2. Insertar nuevos horarios
      const schedules = formData.schedules.map(schedule => ({
        routine_id: routine.id,
        name: schedule.name.trim(),
        time: `${schedule.time}:00`,
        days_of_week: JSON.stringify(schedule.days_of_week),
        reminder_minutes: schedule.reminder_minutes,
        notes: schedule.notes.trim() || null,
        active: true
      }));

      const { error: schedulesError } = await supabase
        .from('routine_schedules')
        .insert(schedules);

      if (schedulesError) throw schedulesError;

      // 3. Programar notificaciones
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        schedules.forEach(schedule => {
          console.log(`📅 Programando notificación: ${schedule.name} a las ${schedule.time}`);
        });
      }

      onSave?.();
      onClose?.();
      
    } catch (error) {
      console.error('Error saving routine:', error);
      alert('Error guardando la rutina');
    }
    setLoading(false);
  };

  const currentCategory = routineCategories[formData.category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {editingRoutine ? '📝 Editar Rutina' : '➕ Nueva Rutina'}
              </h2>
              <p className="opacity-90">Para {dog?.name} - {dog?.breed}</p>
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
          
          {/* Paso 1: Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">1. Información Básica</h3>
            
            {/* Nombre de la rutina */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la rutina *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Ej: Rutina de alimentación de Max"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(routineCategories).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => updateFormData('category', key)}
                    className={`p-3 rounded-lg border-2 transition-colors text-center ${
                      formData.category === key
                        ? category.color
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{category.icon}</div>
                    <div className="text-sm font-medium">{category.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Presets de la categoría seleccionada */}
          {currentCategory && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                💡 Sugerencias para {currentCategory.label}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentCategory.presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyPreset(preset)}
                    className="text-left p-3 border border-gray-200 rounded-lg hover:bg-white transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{preset.name}</div>
                        <div className="text-sm text-gray-600">{preset.time} - {preset.notes}</div>
                      </div>
                      <span className="text-gray-400">+</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2: Horarios */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">2. Horarios</h3>
              <button
                onClick={addSchedule}
                className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors text-sm"
              >
                ➕ Agregar Horario
              </button>
            </div>

            {formData.schedules.map((schedule, scheduleIndex) => (
              <div key={scheduleIndex} className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Horario {scheduleIndex + 1}</h4>
                  {formData.schedules.length > 1 && (
                    <button
                      onClick={() => removeSchedule(scheduleIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre del horario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del horario *
                    </label>
                    <input
                      type="text"
                      value={schedule.name}
                      onChange={(e) => updateSchedule(scheduleIndex, 'name', e.target.value)}
                      placeholder="Ej: Desayuno"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Hora */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora *
                    </label>
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={(e) => updateSchedule(scheduleIndex, 'time', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Días de la semana */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días de la semana
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(scheduleIndex, day.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          schedule.days_of_week.includes(day.id)
                            ? 'bg-[#56CCF2] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Días seleccionados: {schedule.days_of_week.map(id => 
                      daysOfWeek.find(d => d.id === id)?.name
                    ).join(', ')}
                  </div>
                </div>

                {/* Recordatorio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recordatorio
                  </label>
                  <select
                    value={schedule.reminder_minutes}
                    onChange={(e) => updateSchedule(scheduleIndex, 'reminder_minutes', parseInt(e.target.value))}
                    className="w-full md:w-auto border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value={0}>En el momento exacto</option>
                    <option value={5}>5 minutos antes</option>
                    <option value={10}>10 minutos antes</option>
                    <option value={15}>15 minutos antes</option>
                    <option value={30}>30 minutos antes</option>
                    <option value={60}>1 hora antes</option>
                  </select>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas adicionales
                  </label>
                  <textarea
                    value={schedule.notes}
                    onChange={(e) => updateSchedule(scheduleIndex, 'notes', e.target.value)}
                    placeholder="Ej: Cantidad específica, instrucciones especiales..."
                    rows={2}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}

            {formData.schedules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">⏰</div>
                <p>No hay horarios configurados</p>
                <button
                  onClick={addSchedule}
                  className="mt-3 bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
                >
                  Agregar primer horario
                </button>
              </div>
            )}
          </div>

          {/* Resumen de la rutina */}
          {formData.name && formData.schedules.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-3">📋 Resumen de la Rutina</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium w-20">Nombre:</span>
                  <span className="text-blue-800">{formData.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium w-20">Categoría:</span>
                  <span className="text-blue-800">
                    {currentCategory?.icon} {currentCategory?.label}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-700 font-medium w-20">Horarios:</span>
                  <div className="flex-1">
                    {formData.schedules.map((schedule, index) => (
                      <div key={index} className="text-blue-800 text-sm">
                        • {schedule.name} - {schedule.time} 
                        ({schedule.days_of_week.length === 7 ? 'Todos los días' : 
                          `${schedule.days_of_week.length} días por semana`})
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium w-20">Total:</span>
                  <span className="text-blue-800">{formData.schedules.length} horarios programados</span>
                </div>
              </div>
            </div>
          )}

          {/* Consejos según la categoría */}
          {currentCategory && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-bold text-yellow-900 mb-3">
                💡 Consejos para {currentCategory.label}
              </h3>
              <div className="text-sm text-yellow-800 space-y-2">
                {formData.category === 'food' && (
                  <>
                    <p>• <strong>Consistencia:</strong> Alimenta a la misma hora todos los días</p>
                    <p>• <strong>Cantidad:</strong> Ajusta las porciones según edad, peso y actividad</p>
                    <p>• <strong>Calidad:</strong> Usa alimento de alta calidad apropiado para la edad</p>
                    <p>• <strong>Agua:</strong> Asegúrate de que siempre tenga agua fresca disponible</p>
                  </>
                )}
                {formData.category === 'exercise' && (
                  <>
                    <p>• <strong>Gradual:</strong> Incrementa la intensidad del ejercicio gradualmente</p>
                    <p>• <strong>Clima:</strong> Ajusta la actividad según las condiciones climáticas</p>
                    <p>• <strong>Variedad:</strong> Combina diferentes tipos de ejercicio</p>
                    <p>• <strong>Descanso:</strong> Permite tiempo de recuperación entre ejercicios intensos</p>
                  </>
                )}
                {formData.category === 'hygiene' && (
                  <>
                    <p>• <strong>Rutina:</strong> Mantén una rutina regular de higiene</p>
                    <p>• <strong>Productos:</strong> Usa productos específicos para perros</p>
                    <p>• <strong>Paciencia:</strong> Ve despacio, especialmente si es nuevo para tu perro</p>
                    <p>• <strong>Recompensas:</strong> Usa premios para hacer la experiencia positiva</p>
                  </>
                )}
                {formData.category === 'medical' && (
                  <>
                    <p>• <strong>Precisión:</strong> Sigue exactamente las instrucciones del veterinario</p>
                    <p>• <strong>Horarios:</strong> Administra medicamentos a la misma hora todos los días</p>
                    <p>• <strong>Registro:</strong> Lleva un registro de medicamentos administrados</p>
                    <p>• <strong>Efectos:</strong> Observa cualquier efecto secundario y reporta al veterinario</p>
                  </>
                )}
                {formData.category === 'play' && (
                  <>
                    <p>• <strong>Estimulación:</strong> Combina juego físico y mental</p>
                    <p>• <strong>Supervisión:</strong> Supervisa el juego para asegurar que sea seguro</p>
                    <p>• <strong>Socialización:</strong> Permite interacción controlada con otros perros</p>
                    <p>• <strong>Duración:</strong> Ajusta la duración según la edad y energía del perro</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="bg-gray-50 p-6 rounded-b-xl flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {!formData.name.trim() ? (
              '⚠️ Ingresa un nombre para la rutina'
            ) : formData.schedules.length === 0 ? (
              '⚠️ Agrega al menos un horario'
            ) : (
              `✅ Rutina lista para guardar: ${formData.schedules.length} horarios`
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
              onClick={saveRoutine}
              disabled={loading || !formData.name.trim() || formData.schedules.length === 0}
              className="px-6 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
              <span>{loading ? 'Guardando...' : editingRoutine ? 'Actualizar Rutina' : 'Crear Rutina'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineFormManager;