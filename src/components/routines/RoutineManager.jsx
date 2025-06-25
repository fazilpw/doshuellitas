// src/components/routines/RoutineManager.jsx - CON NUEVOS COMPONENTES
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

// 🆕 NUEVOS IMPORTS
import FeedingScheduleManager from './FeedingScheduleManager.jsx';
import VaccineManager from './VaccineManager.jsx';
import NotificationSystem from '../notifications/NotificationSystem.jsx';

const RoutineManager = ({ currentUser, dogs = [] }) => {
  // Estados principales
  const [selectedDogId, setSelectedDogId] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [nextRoutine, setNextRoutine] = useState(null);
  
  // 🆕 NUEVOS ESTADOS
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [showFeedingConfig, setShowFeedingConfig] = useState(false);

  // Perro seleccionado
  const selectedDog = dogs.find(dog => dog.id === selectedDogId);
  
  // Tiempo actual
  const now = new Date();
  const timeString = now.toTimeString().slice(0, 5);

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
        .from('dog_routines')
        .select('*')
        .eq('dog_id', selectedDogId)
        .eq('active', true)
        .order('schedule_time');

      if (!routinesError && routinesData) {
        setRoutines(routinesData);
        
        // Encontrar próxima rutina
        const upcoming = routinesData.find(routine => {
          const routineTime = new Date(`2000-01-01 ${routine.schedule_time}`);
          return routineTime.getTime() > new Date(`2000-01-01 ${timeString}`).getTime();
        });
        setNextRoutine(upcoming);
      }

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
            { id: 'routines', label: 'Rutinas', icon: '🔄' },
            { id: 'feeding', label: 'Alimentación', icon: '🍽️' },
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
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
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
                className="bg-[#C7EA46] text-[#2C3E50] px-4 py-2 rounded-lg hover:bg-[#FFFE8D] transition-colors"
              >
                🍽️ Configurar comidas
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
                        isPast ? 'bg-gray-100' : 'bg-[#56CCF2]'
                      }`}>
                        <span className={`text-sm ${isPast ? 'text-gray-500' : 'text-white'}`}>
                          {routine.category === 'food' ? '🍽️' :
                           routine.category === 'exercise' ? '🚶‍♂️' :
                           routine.category === 'medical' ? '💊' :
                           routine.category === 'hygiene' ? '🛁' : '🎾'}
                        </span>
                      </div>
                      <div>
                        <h4 className={`font-medium ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                          {routine.schedule_name}
                        </h4>
                        <p className={`text-sm ${isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                          {routine.schedule_time} • {routine.routine_name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isPast ? (
                        <span className="text-green-600 text-sm">✓ Completado</span>
                      ) : (
                        <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors">
                          Marcar
                        </button>
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
          onClick={() => setActiveTab('vaccines')}
          className="bg-yellow-100 text-yellow-700 p-4 rounded-lg hover:bg-yellow-200 transition-colors text-center"
        >
          <div className="text-2xl mb-1">💉</div>
          <div className="text-sm font-medium">Vacunas</div>
        </button>
      </div>
    </div>
  );

  // Vista placeholder para tabs básicos
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
            <PlaceholderView 
              title="Gestión de Rutinas"
              icon="🔄"
              description="Aquí podrás crear, editar y organizar todas las rutinas de tus perros"
            />
          )}

          {/* 🆕 NUEVO TAB: ALIMENTACIÓN */}
          {activeTab === 'feeding' && selectedDog && (
            <FeedingScheduleManager
              dog={selectedDog}
              onClose={() => setActiveTab('today')}
              onSave={() => fetchRoutinesAndVaccines()}
            />
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

      {/* Modal para agregar rutina (placeholder) */}
      {showAddRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🚧 Próximamente</h3>
              <p className="text-gray-600 mb-6">
                El formulario para crear rutinas estará disponible en la próxima actualización.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddRoutine(false);
                    setShowFeedingConfig(true);
                  }}
                  className="flex-1 bg-[#C7EA46] text-[#2C3E50] py-2 px-4 rounded-lg hover:bg-[#FFFE8D] transition-colors"
                >
                  🍽️ Configurar comidas
                </button>
                <button
                  onClick={() => setShowAddRoutine(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineManager;