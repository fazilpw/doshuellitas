// src/components/routines/RoutineManager.jsx
// 📅 GESTOR COMPLETO DE RUTINAS - TODAS LAS FUNCIONALIDADES

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';
import { notifyRoutineCreated } from '../../utils/managerIntegrations.js';


const RoutineManager = ({ dogs = [], currentUser, parentLoading = false, onRoutineUpdated }) => {
  // Estados principales
  const [selectedDogId, setSelectedDogId] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [todayRoutines, setTodayRoutines] = useState([]);
  
  // Estados para modales
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Estados para formulario
  const [formData, setFormData] = useState({
    name: '',
    category: 'alimentacion',
    time: '',
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    reminder_minutes: 5,
    notes: ''
  });

  const selectedDog = dogs.find(dog => dog.id === selectedDogId);
  const currentTime = new Date().toTimeString().slice(0, 5);
  const currentDay = new Date().getDay() || 7; // 1=Lunes, 7=Domingo

  // Categorías de rutinas
  const categories = {
    'alimentacion': { label: 'Alimentación', icon: '🍽️', color: 'bg-blue-50 text-blue-700' },
    'ejercicio': { label: 'Ejercicio', icon: '🏃‍♂️', color: 'bg-green-50 text-green-700' },
    'medicacion': { label: 'Medicación', icon: '💊', color: 'bg-red-50 text-red-700' },
    'entrenamiento': { label: 'Entrenamiento', icon: '🎯', color: 'bg-purple-50 text-purple-700' },
    'higiene': { label: 'Higiene', icon: '🛁', color: 'bg-yellow-50 text-yellow-700' },
    'descanso': { label: 'Descanso', icon: '😴', color: 'bg-indigo-50 text-indigo-700' },
    'socialization': { label: 'Socialización', icon: '🐕‍🦺', color: 'bg-pink-50 text-pink-700' },
    'juego': { label: 'Juego', icon: '🎾', color: 'bg-orange-50 text-orange-700' }
  };

  // Efectos
  useEffect(() => {
    if (dogs.length > 0 && !selectedDogId) {
      setSelectedDogId(dogs[0].id);
    }
  }, [dogs, selectedDogId]);

  useEffect(() => {
    if (selectedDogId) {
      fetchRoutines();
    }
  }, [selectedDogId]);

  // ===============================================
  // 📊 OBTENER RUTINAS
  // ===============================================
  const fetchRoutines = async () => {
    if (!selectedDogId) return;
    
    setLoading(true);
    try {
      // Obtener rutinas del perro
      const { data: routinesData, error: routinesError } = await supabase
        .from('dog_routines')
        .select(`
          id,
          name,
          routine_category,
          notes,
          active,
          routine_schedules!inner(
            id,
            name,
            time,
            days_of_week,
            reminder_minutes,
            notes,
            active
          )
        `)
        .eq('dog_id', selectedDogId)
        .eq('active', true)
        .order('routine_category');

      if (routinesError) {
        console.error('❌ Error fetching routines:', routinesError);
        return;
      }

      // Aplanar los datos para facilitar el manejo
      const flatRoutines = [];
      routinesData?.forEach(routine => {
        routine.routine_schedules?.forEach(schedule => {
          flatRoutines.push({
            routine_id: routine.id,
            routine_name: routine.name,
            routine_category: routine.routine_category,
            routine_notes: routine.notes,
            schedule_id: schedule.id,
            schedule_name: schedule.name,
            time: schedule.time,
            days_of_week: schedule.days_of_week,
            reminder_minutes: schedule.reminder_minutes,
            schedule_notes: schedule.notes
          });
        });
      });

      setRoutines(flatRoutines);

      // Filtrar rutinas de hoy
      const todayRoutines = flatRoutines.filter(routine => 
        routine.days_of_week?.includes(currentDay)
      );

      // Obtener completadas de hoy
      const today = new Date().toISOString().split('T')[0];
      const { data: completions } = await supabase
        .from('routine_completions')
        .select('routine_schedule_id')
        .eq('dog_id', selectedDogId)
        .gte('completed_at', `${today}T00:00:00Z`)
        .lt('completed_at', `${today}T23:59:59Z`);

      const completedIds = new Set(completions?.map(c => c.routine_schedule_id) || []);

      const enrichedTodayRoutines = todayRoutines.map(routine => ({
        ...routine,
        isCompleted: completedIds.has(routine.schedule_id),
        isPast: routine.time < currentTime
      }));

      setTodayRoutines(enrichedTodayRoutines);
      
    } catch (error) {
      console.error('❌ Error in fetchRoutines:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 📝 MANEJO DEL FORMULARIO
  // ===============================================
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'alimentacion',
      time: '',
      days_of_week: [1, 2, 3, 4, 5, 6, 7],
      reminder_minutes: 5,
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingRoutine) {
        // Actualizar rutina existente
        await updateRoutine();
      } else {
        // Crear nueva rutina
        await createRoutine();
      }
      
      setShowAddRoutine(false);
      setEditingRoutine(null);
      resetForm();
      fetchRoutines();
      
      if (onRoutineUpdated) {
        onRoutineUpdated();
      }
      
    } catch (error) {
      console.error('❌ Error saving routine:', error);
      alert('Error al guardar la rutina');
    } finally {
      setLoading(false);
    }
  };

  const createRoutine = async () => {
    // 1. Crear el dog_routine
    const { data: routineData, error: routineError } = await supabase
      .from('dog_routines')
      .insert({
        dog_id: selectedDogId,
        name: formData.name,
        routine_category: formData.category,
        notes: formData.notes
      })
      .select()
      .single();

    if (routineError) throw routineError;

    // 2. Crear el routine_schedule
    const { error: scheduleError } = await supabase
  .from('routine_schedules')
  .insert({
    routine_id: routineData.id,
    name: formData.name,
    time: formData.time,
    days_of_week: formData.days_of_week,
    reminder_minutes: formData.reminder_minutes,
    notes: formData.notes
  });

if (scheduleError) throw scheduleError;

console.log('✅ Rutina creada exitosamente');

// ⬇️ AGREGAR ESTA SECCIÓN DESPUÉS:
// 3. Notificar creación de rutina
try {
  const selectedDog = dogs.find(dog => dog.id === selectedDogId);
  const mockSchedules = [{ time: formData.time, days_of_week: formData.days_of_week }];
  
  const notificationResult = await notifyRoutineCreated(
    {
      name: formData.name,
      category: formData.category,
      description: formData.notes || `Rutina ${formData.name} programada`
    },
    mockSchedules,
    selectedDogId,
    selectedDog?.name || 'Perro',
    currentUser?.id
  );
  
  if (notificationResult.success) {
    console.log(`✅ ${notificationResult.notifications.length} notificaciones de rutina enviadas`);
  }
} catch (notificationError) {
  console.warn('⚠️ Error enviando notificaciones de rutina:', notificationError);
  // No fallar el guardado por problemas de notificación
}
};

const updateRoutine = async () => {
    // Actualizar dog_routine
    const { error: routineError } = await supabase
      .from('dog_routines')
      .update({
        name: formData.name,
        routine_category: formData.category,
        notes: formData.notes
      })
      .eq('id', editingRoutine.routine_id);

    if (routineError) throw routineError;

    // Actualizar routine_schedule
    const { error: scheduleError } = await supabase
      .from('routine_schedules')
      .update({
        name: formData.name,
        time: formData.time,
        days_of_week: formData.days_of_week,
        reminder_minutes: formData.reminder_minutes,
        notes: formData.notes
      })
      .eq('id', editingRoutine.schedule_id);

    if (scheduleError) throw scheduleError;

    console.log('✅ Rutina actualizada exitosamente');
  };

  // ===============================================
  // 🗑️ ELIMINAR RUTINA
  // ===============================================
  const handleDelete = async (routine) => {
    setLoading(true);
    try {
      // Eliminar schedule
      const { error: scheduleError } = await supabase
        .from('routine_schedules')
        .delete()
        .eq('id', routine.schedule_id);

      if (scheduleError) throw scheduleError;

      // Verificar si quedan más schedules para esta rutina
      const { data: remainingSchedules } = await supabase
        .from('routine_schedules')
        .select('id')
        .eq('routine_id', routine.routine_id);

      // Si no quedan schedules, eliminar la rutina también
      if (!remainingSchedules || remainingSchedules.length === 0) {
        const { error: routineError } = await supabase
          .from('dog_routines')
          .delete()
          .eq('id', routine.routine_id);

        if (routineError) throw routineError;
      }

      setShowDeleteConfirm(null);
      fetchRoutines();
      
      if (onRoutineUpdated) {
        onRoutineUpdated();
      }
      
      console.log('✅ Rutina eliminada exitosamente');
      
    } catch (error) {
      console.error('❌ Error deleting routine:', error);
      alert('Error al eliminar la rutina');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // ✅ MARCAR COMO COMPLETADA
  // ===============================================
  const handleMarkAsCompleted = async (routine) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('routine_completions')
        .insert({
          routine_schedule_id: routine.schedule_id,
          dog_id: selectedDogId,
          user_id: currentUser.id,
          status: 'completed',
          notes: 'Completado desde la app'
        });

      if (error) throw error;

      // Actualizar estado local
      setTodayRoutines(prev => prev.map(r => 
        r.schedule_id === routine.schedule_id ? { ...r, isCompleted: true } : r
      ));

      console.log('✅ Rutina marcada como completada');
      
    } catch (error) {
      console.error('❌ Error marking routine as completed:', error);
      alert('Error al marcar la rutina como completada');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // ✏️ EDITAR RUTINA
  // ===============================================
  const handleEdit = (routine) => {
    setFormData({
      name: routine.routine_name,
      category: routine.routine_category,
      time: routine.time,
      days_of_week: routine.days_of_week || [1, 2, 3, 4, 5, 6, 7],
      reminder_minutes: routine.reminder_minutes || 5,
      notes: routine.routine_notes || ''
    });
    setEditingRoutine(routine);
    setShowAddRoutine(true);
  };

  // ===============================================
  // 🎨 COMPONENTES DE RENDERIZADO
  // ===============================================
  const renderDogSelector = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="text-2xl">📅</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rutinas</h2>
          <p className="text-sm text-gray-600">
            {selectedDog ? `Para ${selectedDog.name}` : 'Selecciona un perro'}
          </p>
        </div>
      </div>
      
      {dogs.length > 0 && (
        <select
          value={selectedDogId}
          onChange={(e) => setSelectedDogId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          {dogs.map(dog => (
            <option key={dog.id} value={dog.id}>{dog.name}</option>
          ))}
        </select>
      )}
    </div>
  );

  const renderTabs = () => (
    <div className="flex space-x-6 border-b border-gray-200 mb-6">
      <button
        onClick={() => setActiveTab('today')}
        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'today'
            ? 'border-[#56CCF2] text-[#56CCF2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        📅 Hoy
      </button>
      <button
        onClick={() => setActiveTab('manage')}
        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'manage'
            ? 'border-[#56CCF2] text-[#56CCF2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        🔧 Gestionar
      </button>
    </div>
  );

  const renderTodayView = () => (
    <div className="space-y-6">
      {/* Rutinas de hoy */}
      {todayRoutines.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            📅 Rutinas de Hoy ({new Date().toLocaleDateString()})
          </h3>
          
          {todayRoutines.map(routine => {
            const category = categories[routine.routine_category] || categories.alimentacion;
            
            return (
              <div key={routine.schedule_id} className={`border rounded-lg p-4 ${
                routine.isCompleted ? 'bg-green-50 border-green-200' :
                routine.isPast ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{routine.routine_name}</h4>
                      <p className={`text-sm ${
                        routine.isCompleted ? 'text-green-600' :
                        routine.isPast ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        {routine.time} • {category.label}
                      </p>
                      {routine.routine_notes && (
                        <p className="text-xs text-gray-500 mt-1">{routine.routine_notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {routine.isCompleted ? (
                      <span className="text-green-600 text-sm font-medium">✅ Completado</span>
                    ) : routine.isPast ? (
                      <span className="text-orange-600 text-sm font-medium">⏰ Pendiente</span>
                    ) : (
                      <button
                        onClick={() => handleMarkAsCompleted(routine)}
                        disabled={loading}
                        className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        ✅ Completar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay rutinas para hoy</h3>
          <p className="text-gray-600 mb-6">Crea rutinas para organizar el día de {selectedDog?.name}</p>
          <button
            onClick={() => setShowAddRoutine(true)}
            className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            ➕ Crear Primera Rutina
          </button>
        </div>
      )}

      {/* Acciones rápidas */}
      {todayRoutines.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowAddRoutine(true)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="text-sm font-medium text-gray-700">Nueva Rutina</div>
          </button>
          
          <button
            onClick={() => {
              setFormData({
                ...formData,
                name: 'Desayuno',
                category: 'alimentacion',
                time: '08:00'
              });
              setShowAddRoutine(true);
            }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🍽️</div>
            <div className="text-sm font-medium text-blue-700">Alimentación</div>
          </button>
          
          <button
            onClick={() => {
              setFormData({
                ...formData,
                name: 'Paseo matutino',
                category: 'ejercicio',
                time: '07:00'
              });
              setShowAddRoutine(true);
            }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🏃‍♂️</div>
            <div className="text-sm font-medium text-green-700">Ejercicio</div>
          </button>
          
          <button
            onClick={() => {
              setFormData({
                ...formData,
                name: 'Medicación',
                category: 'medicacion',
                time: '12:00'
              });
              setShowAddRoutine(true);
            }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">💊</div>
            <div className="text-sm font-medium text-red-700">Medicina</div>
          </button>
        </div>
      )}
    </div>
  );

  const renderManageView = () => (
    <div className="space-y-6">
      {/* Header con botón crear */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">🔧 Gestionar Rutinas</h3>
        <button
          onClick={() => setShowAddRoutine(true)}
          className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Nueva Rutina</span>
        </button>
      </div>

      {/* Lista de rutinas existentes */}
      {routines.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rutina
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routines.map((routine) => {
                  const category = categories[routine.routine_category] || categories.alimentacion;
                  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
                  
                  return (
                    <tr key={routine.schedule_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{category.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{routine.routine_name}</div>
                            {routine.routine_notes && (
                              <div className="text-sm text-gray-500">{routine.routine_notes}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{routine.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {dayNames.map((day, index) => (
                            <span key={index} className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                              routine.days_of_week?.includes(index + 1)
                                ? 'bg-[#56CCF2] text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}>
                              {day}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                          {category.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(routine)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(routine)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay rutinas configuradas</h3>
          <p className="text-gray-600 mb-6">Crea tu primera rutina para {selectedDog?.name}</p>
          <button
            onClick={() => setShowAddRoutine(true)}
            className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            ➕ Crear Primera Rutina
          </button>
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {editingRoutine ? '✏️ Editar Rutina' : '➕ Nueva Rutina'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la rutina
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Ej: Desayuno, Paseo matutino..."
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              {Object.entries(categories).map(([key, category]) => (
                <option key={key} value={key}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Hora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              required
            />
          </div>

          {/* Días de la semana */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días de la semana
            </label>
            <div className="grid grid-cols-7 gap-2">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => {
                const dayNumber = index + 1;
                const isSelected = formData.days_of_week.includes(dayNumber);
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setFormData({
                          ...formData,
                          days_of_week: formData.days_of_week.filter(d => d !== dayNumber)
                        });
                      } else {
                        setFormData({
                          ...formData,
                          days_of_week: [...formData.days_of_week, dayNumber].sort()
                        });
                      }
                    }}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#56CCF2] text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recordatorio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recordatorio (minutos antes)
            </label>
            <select
              value={formData.reminder_minutes}
              onChange={(e) => setFormData({ ...formData, reminder_minutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              <option value={0}>Sin recordatorio</option>
              <option value={5}>5 minutos antes</option>
              <option value={15}>15 minutos antes</option>
              <option value={30}>30 minutos antes</option>
              <option value={60}>1 hora antes</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              rows={3}
              placeholder="Instrucciones especiales, dosis, etc..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddRoutine(false);
                setEditingRoutine(null);
                resetForm();
              }}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#56CCF2] text-white py-2 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : editingRoutine ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ===============================================
// 🎨 RENDERIZADO PRINCIPAL COMPLETO Y CORREGIDO
// ===============================================
if (!currentUser) {
  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-gray-600">Error: Usuario no autenticado</p>
    </div>
  );
}

// 🔧 CORREGIDO: Verificar parentLoading PRIMERO
if (parentLoading) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
        <span className="text-2xl">📅</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Cargando rutinas...</h3>
      <p className="text-gray-600">Obteniendo información de tus mascotas...</p>
    </div>
  );
}

// 🔧 CORREGIDO: Solo mostrar "sin perros" si NO está loading Y dogs está vacío
if (!parentLoading && dogs.length === 0) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🐕</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No hay perros registrados</h3>
      <p className="text-gray-600 mb-6">Agrega un perro para comenzar a gestionar rutinas</p>
    </div>
  );
}

return (
  <div className="space-y-6">
    {renderDogSelector()}
    {renderTabs()}
    
    {activeTab === 'today' && renderTodayView()}
    {activeTab === 'manage' && renderManageView()}

    {/* Modales */}
    {showAddRoutine && renderForm()}
    
    {/* Modal de confirmación de eliminación */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4 text-red-600">🗑️ Eliminar Rutina</h3>
          <p className="text-gray-600 mb-6">
            ¿Estás seguro de que quieres eliminar la rutina "{showDeleteConfirm.routine_name}"?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleDelete(showDeleteConfirm)}
              disabled={loading}  // ← Este loading SÍ está bien (es el useState interno)
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default RoutineManager;