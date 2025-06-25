// src/components/dashboard/ParentDashboard.jsx - CON NAVEGACIÓN INTERNA
import { useState, useEffect } from 'react';
import supabase, { getDogAverages, getMultipleDogsAverages } from '../../lib/supabase.js';
import CompleteEvaluationForm from './CompleteEvaluationForm.jsx';
import DogProgressModal from './DogProgressModal.jsx';
import RoutineManager from '../routines/RoutineManager.jsx';

const ParentDashboard = () => {
  const [dogs, setDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [dogAverages, setDogAverages] = useState({});
  
  // 📊 Estados para el modal de progreso
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedDogForProgress, setSelectedDogForProgress] = useState(null);

  // 🆕 NUEVO: Estado para el selector de perros
  const [selectedDogId, setSelectedDogId] = useState('');

  // 🆕 NUEVO: Estado para navegación de páginas
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'rutinas', 'evaluaciones', 'progreso'

  useEffect(() => {
    initializeDashboard();
  }, []);

  // 🆕 NUEVO: Efecto para seleccionar primer perro automáticamente
  useEffect(() => {
    if (dogs.length > 0 && !selectedDogId) {
      setSelectedDogId(dogs[0].id);
    }
  }, [dogs, selectedDogId]);

  const initializeDashboard = async () => {
    try {
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', '11111111-1111-1111-1111-111111111111')
        .eq('role', 'padre')
        .single();

      if (userError) {
        console.error('❌ Error finding user:', userError);
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      console.log('✅ Usuario padre encontrado:', user);
      await fetchUserDogs(user.id);
      
    } catch (error) {
      console.error('❌ Error initializing dashboard:', error);
      setLoading(false);
    }
  };

  const fetchUserDogs = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', userId)
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('❌ Error fetching dogs:', error);
        setLoading(false);
        return;
      }

      console.log('✅ Perros encontrados:', data);
      setDogs(data || []);
      
      if (data && data.length > 0) {
        await fetchEvaluations(data);
        await fetchDogAverages(data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error in fetchUserDogs:', error);
      setLoading(false);
    }
  };

  const fetchEvaluations = async (dogList) => {
    try {
      const dogIds = dogList.map(dog => dog.id);
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          dogs!inner(name, breed, photo_url),
          profiles!inner(full_name, role)
        `)
        .in('dog_id', dogIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching evaluations:', error);
        return;
      }

      console.log('✅ Evaluaciones encontradas:', data);
      setEvaluations(data || []);
    } catch (error) {
      console.error('❌ Error in fetchEvaluations:', error);
    }
  };

  const fetchDogAverages = async (dogList) => {
    try {
      const averages = await getMultipleDogsAverages(dogList.map(dog => dog.id));
      setDogAverages(averages);
      console.log('✅ Promedios calculados:', averages);
    } catch (error) {
      console.error('❌ Error calculating averages:', error);
    }
  };

  const handleEvaluationClick = (dog) => {
    setSelectedDog(dog);
    setShowEvaluationForm(true);
  };

  const handleEvaluationSaved = () => {
    setShowEvaluationForm(false);
    setSelectedDog(null);
    // Refrescar datos
    if (currentUser) {
      fetchUserDogs(currentUser.id);
    }
  };

  const openProgressModal = (dog) => {
    setSelectedDogForProgress(dog);
    setShowProgressModal(true);
  };

  const closeProgressModal = () => {
    setShowProgressModal(false);
    setSelectedDogForProgress(null);
  };

  // 🆕 NUEVO: Función para cambiar página
  const navigateToPage = (page) => {
    setCurrentPage(page);
  };

  // 🆕 NUEVO: Componente de navegación superior
  const NavigationBar = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-[#2C3E50]">
              {currentUser?.full_name ? `👋 ¡Hola ${currentUser.full_name}!` : '👋 ¡Hola!'}
            </h1>
            
            {/* Navegación de páginas */}
            <nav className="hidden sm:flex space-x-4">
              <button
                onClick={() => navigateToPage('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-[#56CCF2] text-white'
                    : 'text-gray-600 hover:text-[#56CCF2]'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => navigateToPage('rutinas')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'rutinas'
                    ? 'bg-[#56CCF2] text-white'
                    : 'text-gray-600 hover:text-[#56CCF2]'
                }`}
              >
                🔔 Rutinas
              </button>
              <button
                onClick={() => navigateToPage('evaluaciones')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'evaluaciones'
                    ? 'bg-[#56CCF2] text-white'
                    : 'text-gray-600 hover:text-[#56CCF2]'
                }`}
              >
                📝 Evaluaciones
              </button>
              <button
                onClick={() => navigateToPage('progreso')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'progreso'
                    ? 'bg-[#56CCF2] text-white'
                    : 'text-gray-600 hover:text-[#56CCF2]'
                }`}
              >
                📈 Progreso
              </button>
            </nav>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center space-x-2">
            <a 
              href="https://wa.me/573144329824"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Navegación móvil */}
      <div className="sm:hidden bg-gray-50 px-4 py-2">
        <div className="flex space-x-2 overflow-x-auto">
          {[
            { key: 'dashboard', icon: '📊', label: 'Dashboard' },
            { key: 'rutinas', icon: '🔔', label: 'Rutinas' },
            { key: 'evaluaciones', icon: '📝', label: 'Evaluar' },
            { key: 'progreso', icon: '📈', label: 'Progreso' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => navigateToPage(item.key)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                currentPage === item.key
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-600 hover:text-[#56CCF2]'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // 🆕 NUEVO: Renderizar contenido según página actual
  const renderPageContent = () => {
    switch (currentPage) {
      case 'rutinas':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <RoutineManager 
              currentUser={currentUser}
              dogs={dogs}
            />
          </div>
        );
      
      case 'evaluaciones':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">📝 Nueva Evaluación</h2>
              {dogs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dogs.map((dog) => (
                    <div key={dog.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-[#56CCF2] rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">🐕</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{dog.name}</h3>
                          <p className="text-sm text-gray-600">{dog.breed}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEvaluationClick(dog)}
                        className="w-full bg-[#56CCF2] text-white py-2 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors"
                      >
                        Evaluar Ahora
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🐕</div>
                  <p className="text-gray-600">No tienes perros registrados</p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'progreso':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">📈 Progreso de tus Perros</h2>
              {dogs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dogs.map((dog) => (
                    <div key={dog.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-[#56CCF2] rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">🐕</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{dog.name}</h3>
                          <p className="text-sm text-gray-600">{dog.breed}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openProgressModal(dog)}
                        className="w-full bg-[#C7EA46] text-[#2C3E50] py-2 px-4 rounded-lg hover:bg-[#FFFE8D] transition-colors"
                      >
                        Ver Progreso Completo
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📈</div>
                  <p className="text-gray-600">No hay datos de progreso disponibles</p>
                </div>
              )}
            </div>
          </div>
        );
      
      default: // dashboard
        return renderDashboardContent();
    }
  };

  // Contenido original del dashboard
  const renderDashboardContent = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#56CCF2] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl text-white">🐕</span>
          </div>
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">Cargando Dashboard</h2>
          <p className="text-gray-600">Obteniendo información de tus perros...</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de perros */}
          {dogs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {dogs.map((dog) => {
                const averages = dogAverages[dog.id] || {};
                return (
                  <div key={dog.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 bg-[#56CCF2] rounded-full flex items-center justify-center">
                          <span className="text-2xl text-white">🐕</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-[#2C3E50]">{dog.name}</h3>
                          <p className="text-gray-600">{dog.breed}</p>
                          <p className="text-sm text-gray-500">{dog.age} años</p>
                        </div>
                      </div>

                      {/* Métricas rápidas */}
                      {Object.keys(averages).length > 0 && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-[#56CCF2]">
                              {averages.energy_level?.toFixed(1) || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600">Energía</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-[#C7EA46]">
                              {averages.sociability_level?.toFixed(1) || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600">Sociabilidad</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-[#5B9BD5]">
                              {averages.obedience_level?.toFixed(1) || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600">Obediencia</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-500">
                              {averages.anxiety_level?.toFixed(1) || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600">Ansiedad</div>
                          </div>
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEvaluationClick(dog)}
                          className="flex-1 bg-[#56CCF2] text-white py-2 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors text-sm"
                        >
                          📝 Evaluar
                        </button>
                        <button
                          onClick={() => openProgressModal(dog)}
                          className="flex-1 bg-[#C7EA46] text-[#2C3E50] py-2 px-4 rounded-lg hover:bg-[#FFFE8D] transition-colors text-sm"
                        >
                          📊 Progreso
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Evaluaciones recientes */}
          {evaluations.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-[#2C3E50]">📋 Evaluaciones Recientes</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {evaluations.slice(0, 5).map((evaluation) => (
                  <div key={evaluation.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{evaluation.dogs.name}</h4>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">
                            {new Date(evaluation.created_at).toLocaleDateString()}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            evaluation.location === 'casa' ? 
                            'bg-blue-100 text-blue-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {evaluation.location === 'casa' ? '🏠 Casa' : '🏫 Colegio'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Energía:</span>
                            <span className="ml-1 font-medium">{evaluation.energy_level}/10</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Sociabilidad:</span>
                            <span className="ml-1 font-medium">{evaluation.sociability_level}/10</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Obediencia:</span>
                            <span className="ml-1 font-medium">{evaluation.obedience_level}/10</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Ansiedad:</span>
                            <span className="ml-1 font-medium">{evaluation.anxiety_level}/10</span>
                          </div>
                        </div>

                        {evaluation.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{evaluation.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acceso rápido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigateToPage('rutinas')}
              className="bg-[#56CCF2] text-white p-4 rounded-lg hover:bg-[#5B9BD5] transition-colors text-left block w-full"
            >
              <div className="text-2xl mb-2">🔔</div>
              <div className="font-semibold">Rutinas</div>
              <div className="text-sm opacity-90">Gestionar horarios</div>
            </button>
            <button
              onClick={() => navigateToPage('evaluaciones')}
              className="bg-[#C7EA46] text-[#2C3E50] p-4 rounded-lg hover:bg-[#FFFE8D] transition-colors text-left block w-full"
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="font-semibold">Evaluar</div>
              <div className="text-sm opacity-90">Nueva evaluación</div>
            </button>
            <a
              href="https://wa.me/573144329824"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left block"
            >
              <div className="text-2xl mb-2">💬</div>
              <div className="font-semibold">Contactar</div>
              <div className="text-sm opacity-90">WhatsApp Juan Pablo</div>
            </a>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      {/* Barra de navegación */}
      <NavigationBar />
      
      {/* Contenido de la página actual */}
      {renderPageContent()}

      {/* Modal de evaluación */}
      {showEvaluationForm && selectedDog && currentUser && (
        <CompleteEvaluationForm
          dogId={selectedDog.id}
          userId={currentUser.id}
          userRole="padre"
          onClose={() => {
            setShowEvaluationForm(false);
            setSelectedDog(null);
          }}
          onSave={handleEvaluationSaved}
        />
      )}

      {/* 📊 MODAL DE PROGRESO COMPLETO */}
      {showProgressModal && selectedDogForProgress && (
        <DogProgressModal
          dog={selectedDogForProgress}
          isOpen={showProgressModal}
          onClose={closeProgressModal}
        />
      )}
    </div>
  );
};

export default ParentDashboard;