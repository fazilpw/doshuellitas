// src/components/routines/RoutineManager.jsx - HOOKS CORREGIDOS
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

// IMPORTS
import FeedingScheduleManager from './FeedingScheduleManager.jsx';
import VaccineManager from './VaccineManager.jsx';
import NotificationSystem from '../notifications/NotificationSystem.jsx';
import ExerciseManager from './ExerciseManager.jsx';
import RoutineFormManager from './RoutineFormManager.jsx';
import { 
  markRoutineAsCompleted, 
  snoozeRoutine, 
  getRoutineStatusForDog, 
  isRoutineCompletedToday,
  deleteRoutine as deleteRoutineHelper  // 🔧 AGREGAR ESTA LÍNEA
} from '../../lib/routineHelpers.js';

const RoutineManager = ({ currentUser, dogs = [] }) => {
  // Estados principales
  const [selectedDogId, setSelectedDogId] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [nextRoutine, setNextRoutine] = useState(null);
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [showFeedingConfig, setShowFeedingConfig] = useState(false);
  const [showExerciseConfig, setShowExerciseConfig] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [routineStatus, setRoutineStatus] = useState({
    pending: [],
    completed: [],
    stats: {}
  });

  // Perro seleccionado
  const selectedDog = dogs.find(dog => dog.id === selectedDogId);
  
  // Tiempo actual
  const now = new Date();
  const timeString = now.toTimeString().slice(0, 5);

  // 🔍 DEBUG HOOKS - AHORA ESTÁN EN EL LUGAR CORRECTO
  useEffect(() => {
    console.log('🐕 RoutineManager mounted:', { 
      currentUser: currentUser?.id, 
      dogsLength: dogs.length,
      dogs: dogs.map(d => ({ id: d.id, name: d.name }))
    });
  }, [currentUser, dogs]);

  useEffect(() => {
    if (selectedDogId) {
      console.log('🐕 Dog selector changed:', { 
        selectedDogId,
        dogName: dogs.find(d => d.id === selectedDogId)?.name 
      });
    }
  }, [selectedDogId, dogs]);

  useEffect(() => {
    if (dogs.length > 0 && !selectedDogId) {
      setSelectedDogId(dogs[0].id);
    }
  }, [dogs, selectedDogId]);

  useEffect(() => {
    if (selectedDogId) {
      fetchRoutinesAndVaccines();
    }
  }, [selectedDogId]);

  const fetchRoutinesAndVaccines = async () => {
    if (!selectedDogId) return;
    
    setLoading(true);
    try {
      // Obtener rutinas del día
      const { data: routinesData, error: routinesError } = await supabase
        .from('routine_schedules')
        .select(`
          *,
          dog_routines!inner(*)
        `)
        .eq('dog_routines.dog_id', selectedDogId)
        .eq('dog_routines.active', true)
        .eq('active', true)
        .order('time');

      if (!routinesError && routinesData) {
        // Enriquecer rutinas con estado de completación
        const enrichedRoutines = await Promise.all(
          routinesData.map(async (routine) => {
            const { isCompleted } = await isRoutineCompletedToday(routine.id, selectedDogId);
            return {
              ...routine,
              schedule_name: routine.name,
              schedule_time: routine.time.slice(0, 5),
              routine_name: routine.dog_routines.name,
              category: routine.dog_routines.routine_category,
              isCompleted
            };
          })
        );

        setRoutines(enrichedRoutines);
        
        // Encontrar próxima rutina no completada
        const upcoming = enrichedRoutines.find(routine => {
          const routineTime = new Date(`2000-01-01 ${routine.schedule_time}`);
          const currentTime = new Date(`2000-01-01 ${timeString}`);
          return routineTime.getTime() > currentTime.getTime() && !routine.isCompleted;
        });
        setNextRoutine(upcoming);
      }

      // Obtener estado completo de rutinas
      const status = await getRoutineStatusForDog(selectedDogId);
      setRoutineStatus(status);

      // Obtener vacunas próximas
      const { data: vaccinesData, error: vaccinesError } = await supabase
        .from('dog_vaccines')
        .select('*')
        .eq('dog_id', selectedDogId)
        .gte('next_due_date', new Date().toISOString().split('T')[0])
        .order('next_due_date')
        .limit(3);

      if (!vaccinesError && vaccinesData) {
        setVaccines(vaccinesData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  // FUNCIÓN PARA MARCAR RUTINA COMO COMPLETADA - CORREGIDA
  const handleMarkAsCompleted = async (routine) => {
    if (!selectedDog || !currentUser) {
      console.error('❌ Missing data:', { selectedDog: !!selectedDog, currentUser: !!currentUser });
      return;
    }
    
    console.log('📤 Llamando markRoutineAsCompleted con ID REAL:', {
      routineId: routine.id,
      dogId: selectedDogId,
      userId: currentUser.id,
      routineName: routine.schedule_name
    });
    
    try {
      setLoading(true);
      
      const { data } = await markRoutineAsCompleted(
        routine.id,      // routine_schedule_id
        selectedDogId,   // dog_id 
        currentUser.id,  // user_id
        `Completada desde la app`
      );
      
      console.log('✅ markRoutineAsCompleted SUCCESS:', data);
      
      // Actualizar estado local
      setRoutines(prev => prev.map(r => 
        r.id === routine.id ? { ...r, isCompleted: true } : r
      ));
      
      // Refrescar datos
      await fetchRoutinesAndVaccines();
      
      // Mostrar notificación de éxito
      if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('✅ Rutina Completada', {
          body: `${routine.schedule_name} marcada como completada`,
          icon: '/icons/icon-192x192.png'
        });
      }
      
    } catch (error) {
      console.error('❌ Error marking routine as completed:', error);
      alert(`Error al marcar la rutina como completada: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  // 🆕 FUNCIÓN PARA POSPONER RUTINA
  const handleSnoozeRoutine = async (routine, minutes = 15) => {
    if (!selectedDog || !currentUser) return;
    
    try {
      setLoading(true);
      
      await snoozeRoutine(
        routine.id,
        selectedDogId,
        currentUser.id,
        minutes
      );
      
      // Refrescar datos
      await fetchRoutinesAndVaccines();
      
      // Mostrar notificación
      if ('serviceWorker' in navigator) {
        new Notification('⏰ Rutina Pospuesta', {
          body: `${routine.schedule_name} pospuesta ${minutes} minutos`,
          icon: '/icons/icon-192x192.png'
        });
      }
      
    } catch (error) {
      console.error('Error snoozing routine:', error);
      alert('Error al posponer la rutina');
    } finally {
      setLoading(false);
    }
  };

  // Selector de perro
  const DogSelector = () => (
    <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold mb-1">🔔 Rutinas y Horarios</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm opacity-75">
              {new Date().toLocaleDateString('es-CO', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selector de perro */}
      <div className="mt-4">
        <select
          value={selectedDogId}
          onChange={(e) => setSelectedDogId(e.target.value)}
          className="w-full sm:w-auto bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm min-w-48"
        >
          <option value="" className="text-gray-900">Seleccionar perro...</option>
          {dogs.map(dog => (
            <option key={dog.id} value={dog.id} className="text-gray-900">
              🐕 {dog.name} ({dog.breed})
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  // 🆕 NAVEGACIÓN ACTUALIZADA CON NUEVOS TABS
  const TabNavigation = () => (
    <div className="bg-white border-b border-gray-200">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max">
          {[
            { id: 'today', label: 'Hoy', icon: '📅' },
            { id: 'routines', label: 'Gestionar', icon: '🔄' },
            { id: 'feeding', label: 'Alimentación', icon: '🍽️' },
            { id: 'exercise', label: 'Ejercicio', icon: '🚶‍♂️' },
            { id: 'vaccines', label: 'Vacunas', icon: '💉' },
            { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
            { id: 'settings', label: 'Config', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors min-w-max ${
                activeTab === tab.id
                  ? 'border-[#56CCF2] text-[#56CCF2] bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Vista del día de hoy
  const TodayView = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Próxima rutina destacada */}
      {nextRoutine && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">⏰</span>
              </div>
              <div>
                <h3 className="font-bold text-green-900">¡Próxima rutina!</h3>
                <p className="text-green-700">{nextRoutine.schedule_name} a las {nextRoutine.schedule_time}</p>
              </div>
            </div>
            <button 
              onClick={() => handleMarkAsCompleted(nextRoutine)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              ✓ Marcar hecho
            </button>
          </div>
        </div>
      )}

      {/* Vacunas próximas */}
      {vaccines.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-900 mb-3 flex items-center">
            <span className="mr-2">💉</span>
            Vacunas Próximas
          </h3>
          <div className="space-y-2">
            {vaccines.map((vaccine, index) => {
              const daysUntil = Math.ceil((new Date(vaccine.next_due_date) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{vaccine.vaccine_name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      daysUntil <= 7 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {daysUntil <= 0 ? '🚨' : '⏰'} En {daysUntil} días
                    </span>
                  </div>
                  <span className="text-sm text-yellow-600">
                    {new Date(vaccine.next_due_date).toLocaleDateString('es-CO')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rutinas del día */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center">
            <span className="mr-2">📅</span>
            Rutinas de Hoy - {selectedDog?.name}
          </h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#56CCF2] mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Cargando rutinas...</p>
          </div>
        ) : routines.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">🐕</div>
            <p className="text-gray-500 mb-4">No hay rutinas configuradas para hoy</p>
            <div className="space-y-2">
              <button 
                onClick={() => setShowAddRoutine(true)}
                className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors mr-2"
              >
                + Crear rutina
              </button>
              <button 
                onClick={() => setShowFeedingConfig(true)}
                className="bg-[#C7EA46] text-[#2C3E50] px-4 py-2 rounded-lg hover:bg-[#FFFE8D] transition-colors mr-2"
              >
                🍽️ Configurar comidas
              </button>
              <button 
                onClick={() => setShowExerciseConfig(true)}
                className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
              >
                🚶‍♂️ Configurar ejercicio
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {routines.map((routine, index) => {
              const routineTime = new Date(`2000-01-01 ${routine.schedule_time}`);
              const isPast = routineTime.getTime() < new Date(`2000-01-01 ${timeString}`).getTime();
              
              return (
                <div key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        routine.isCompleted ? 'bg-green-500' :
                        isPast ? 'bg-gray-100' : 'bg-[#56CCF2]'
                      }`}>
                        <span className={`text-sm ${
                          routine.isCompleted ? 'text-white' :
                          isPast ? 'text-gray-500' : 'text-white'
                        }`}>
                          {routine.isCompleted ? '✓' :
                           routine.category === 'food' ? '🍽️' :
                           routine.category === 'exercise' ? '🚶‍♂️' :
                           routine.category === 'medical' ? '💊' :
                           routine.category === 'hygiene' ? '🛁' : '🎾'}
                        </span>
                      </div>
                      <div>
                        <h4 className={`font-medium ${
                          routine.isCompleted ? 'text-green-700 line-through' :
                          isPast ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          {routine.schedule_name}
                        </h4>
                        <p className={`text-sm ${
                          routine.isCompleted ? 'text-green-600' :
                          isPast ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {routine.schedule_time} • {routine.routine_name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {routine.isCompleted ? (
                        <span className="text-green-600 text-sm">✓ Completado</span>
                      ) : isPast ? (
                        <span className="text-orange-600 text-sm">⚠️ Atrasado</span>
                      ) : (
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleMarkAsCompleted(routine)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                          >
                            ✓ Marcar
                          </button>
                          <button 
                            onClick={() => handleSnoozeRoutine(routine)}
                            className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
                          >
                            ⏰ +15min
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setShowAddRoutine(true)}
          className="bg-[#56CCF2] text-white p-4 rounded-lg hover:bg-[#5B9BD5] transition-colors text-center"
        >
          <div className="text-2xl mb-1">➕</div>
          <div className="text-sm font-medium">Nueva Rutina</div>
        </button>
        
        <button
          onClick={() => setShowFeedingConfig(true)}
          className="bg-[#C7EA46] text-[#2C3E50] p-4 rounded-lg hover:bg-[#FFFE8D] transition-colors text-center"
        >
          <div className="text-2xl mb-1">🍽️</div>
          <div className="text-sm font-medium">Alimentación</div>
        </button>
        
        <button
          onClick={() => setShowExerciseConfig(true)}
          className="bg-green-100 text-green-700 p-4 rounded-lg hover:bg-green-200 transition-colors text-center"
        >
          <div className="text-2xl mb-1">🚶‍♂️</div>
          <div className="text-sm font-medium">Ejercicio</div>
        </button>
      </div>
    </div>
  );

  // 🆕 NUEVA VISTA: Gestión de Rutinas
  const RoutinesManagementView = () => (
    <div className="space-y-6">
      {/* Header con botón crear */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">🔄 Gestionar Rutinas</h3>
        <button
          onClick={() => setShowAddRoutine(true)}
          className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Nueva Rutina</span>
        </button>
      </div>

      {/* Rutinas existentes agrupadas por categoría */}
      {routines.length > 0 ? (
        <div className="space-y-4">
          {/* Agrupar rutinas por categoría */}
          {['food', 'exercise', 'hygiene', 'medical', 'play'].map(category => {
            const categoryRoutines = routines.filter(r => r.category === category);
            if (categoryRoutines.length === 0) return null;

            const categoryIcons = {
              food: '🍽️',
              exercise: '🚶‍♂️', 
              hygiene: '🛁',
              medical: '💊',
              play: '🎾'
            };

            const categoryNames = {
              food: 'Alimentación',
              exercise: 'Ejercicio',
              hygiene: 'Higiene', 
              medical: 'Médico',
              play: 'Juego'
            };

            return (
              <div key={category} className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2 text-xl">{categoryIcons[category]}</span>
                  {categoryNames[category]}
                </h4>
                <div className="space-y-2">
                  {categoryRoutines.map((routine, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{routine.schedule_name}</div>
                        <div className="text-sm text-gray-600">
                          {routine.schedule_time} • {routine.routine_name}
                          {routine.notes && ` • ${routine.notes}`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingRoutine(routine);
                            setShowAddRoutine(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Editar rutina"
                        >
                          ✏️
                        </button>
                        <button
  onClick={() => {
    console.log('🔍 Datos de rutina para eliminar:', routine);
    console.log('🎯 ID de rutina a eliminar:', routine.dog_routines?.id);
    deleteRoutine(routine.dog_routines?.id);
  }}
  className="text-red-600 hover:text-red-800 p-1"
  title="Eliminar rutina"
>
  🗑️
</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔄</div>
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

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button
          onClick={() => setShowFeedingConfig(true)}
          className="bg-orange-50 border border-orange-200 p-4 rounded-lg hover:bg-orange-100 transition-colors text-left"
        >
          <div className="text-2xl mb-2">🍽️</div>
          <div className="font-medium text-orange-900">Configurar Alimentación</div>
          <div className="text-sm text-orange-700">Horarios de comida</div>
        </button>

        <button
          onClick={() => setShowExerciseConfig(true)}
          className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition-colors text-left"
        >
          <div className="text-2xl mb-2">🚶‍♂️</div>
          <div className="font-medium text-green-900">Configurar Ejercicio</div>
          <div className="text-sm text-green-700">Paseos y actividad</div>
        </button>

        <button
          onClick={() => setActiveTab('vaccines')}
          className="bg-red-50 border border-red-200 p-4 rounded-lg hover:bg-red-100 transition-colors text-left"
        >
          <div className="text-2xl mb-2">💉</div>
          <div className="font-medium text-red-900">Gestionar Vacunas</div>
          <div className="text-sm text-red-700">Control médico</div>
        </button>
      </div>
    </div>
  );

  const deleteRoutine = async (routineId) => {
  if (!confirm('¿Estás seguro de que quieres eliminar esta rutina?')) return;
  
  console.log('🗑️ Intentando eliminar rutina con ID:', routineId);
  
  try {
    setLoading(true);
    
    // 🔧 USAR EL HELPER EN LUGAR DE CONSULTAS DIRECTAS
    const result = await deleteRoutineHelper(routineId, currentUser?.id);
    
    console.log('✅ Rutina eliminada exitosamente:', result);
    
    // Refrescar datos
    await fetchRoutinesAndVaccines();
    
    alert('✅ Rutina eliminada correctamente!');
    
  } catch (error) {
    console.error('❌ Error eliminando la rutina:', error);
    alert(`Error eliminando la rutina: ${error.message}`);
  } finally {
    setLoading(false);
  }
};


  // Vista placeholder para configuración
  const PlaceholderView = ({ title, icon, description }) => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-sm text-yellow-800">
          🚧 Esta sección está en desarrollo. Próximamente tendrás acceso completo.
        </p>
      </div>
    </div>
  );

  if (!selectedDog) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-lg">
          <DogSelector />
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">🐕</div>
            <p className="text-gray-600">Selecciona un perro para ver sus rutinas</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <DogSelector />
        
        {/* Navegación */}
        <TabNavigation />
        
        {/* Contenido */}
        <div className="p-4 sm:p-6">
          {activeTab === 'today' && <TodayView />}
          
          {activeTab === 'routines' && (
            <RoutinesManagementView />
          )}

          

         

          {/* 🆕 NUEVO TAB: VACUNAS */}
          {activeTab === 'vaccines' && (
            <VaccineManager
              dogs={dogs}
              onClose={() => setActiveTab('today')}
            />
          )}

          {/* 🆕 NUEVO TAB: NOTIFICACIONES */}
          {activeTab === 'notifications' && (
            <NotificationSystem
              userId={currentUser?.id}
              dogs={dogs}
            />
          )}

          {activeTab === 'settings' && (
            <PlaceholderView 
              title="Configuración"
              icon="⚙️"
              description="Personaliza tus notificaciones y preferencias de rutinas"
            />
          )}
        </div>
      </div>

      {/* 🆕 MODAL PARA CONFIGURAR EJERCICIO */}
      {showExerciseConfig && selectedDog && (
        <ExerciseManager
          dog={selectedDog}
          onClose={() => setShowExerciseConfig(false)}
          onSave={() => {
            fetchRoutinesAndVaccines();
            setShowExerciseConfig(false);
          }}
        />
      )}

 {/* 🆕 MODAL PARA CONFIGURAR ALIMENTACIÓN */}
      {showFeedingConfig && selectedDog && (
        <FeedingScheduleManager
          dog={selectedDog}
          onClose={() => setShowFeedingConfig(false)}
          onSave={() => {
            fetchRoutinesAndVaccines();
            setShowFeedingConfig(false);
          }}
        />
      )}

      {/* 🆕 MODAL PARA CONFIGURAR EJERCICIO */}
      {showExerciseConfig && selectedDog && (
        <ExerciseManager
          dog={selectedDog}
          onClose={() => setShowExerciseConfig(false)}
          onSave={() => {
            fetchRoutinesAndVaccines();
            setShowExerciseConfig(false);
          }}
        />
      )}

      {/* 🆕 MODAL PARA FORMULARIO DE RUTINAS COMPLETO */}
      {showAddRoutine && selectedDog && (
        <RoutineFormManager
          dog={selectedDog}
          editingRoutine={editingRoutine}
          onClose={() => {
            setShowAddRoutine(false);
            setEditingRoutine(null);
          }}
          onSave={() => {
            fetchRoutinesAndVaccines();
            setShowAddRoutine(false);
            setEditingRoutine(null);
          }}
        />
      )}
    </div>
  );
};

export default RoutineManager;


      

     {/* 🆕 MODAL PARA CONFIGURAR ALIMENTACIÓN */}
