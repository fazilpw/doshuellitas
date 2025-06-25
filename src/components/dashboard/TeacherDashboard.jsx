// src/components/dashboard/TeacherDashboard.jsx - CON SELECTOR DE PERROS + DATOS REALES
import { useState, useEffect } from 'react';
import supabase, { getDogAverages } from '../../lib/supabase.js';
import DogProgressModal from './DogProgressModal.jsx';
import CompleteEvaluationForm from './CompleteEvaluationForm.jsx';

const TeacherDashboard = () => {
  const [dogs, setDogs] = useState([]);
  const [todayEvaluations, setTodayEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalDogs: 0,
    evaluatedToday: 0,
    pendingToday: 0,
    weeklyProgress: 0
  });
  
  // Estados para modales
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedDogForProgress, setSelectedDogForProgress] = useState(null);
  const [showQuickEval, setShowQuickEval] = useState(false);
  const [selectedDogForEval, setSelectedDogForEval] = useState(null);

  // 🆕 NUEVO: Estado para el selector de perros (DATOS REALES)
  const [selectedDogId, setSelectedDogId] = useState('');

  useEffect(() => {
    initializeTeacherDashboard();
  }, []);

  // 🆕 NUEVO: Auto-seleccionar primer perro cuando cargan los datos reales
  useEffect(() => {
    if (dogs.length > 0 && !selectedDogId) {
      setSelectedDogId(dogs[0].id);
    }
  }, [dogs, selectedDogId]);

  const initializeTeacherDashboard = async () => {
    try {
      // Buscar usuario profesor REAL de Supabase
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', '22222222-2222-2222-2222-222222222222') // Carlos (profesor real)
        .eq('role', 'profesor')
        .single();

      if (userError) {
        console.error('❌ Error finding teacher:', userError);
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      console.log('✅ Usuario profesor encontrado:', user);

      // Cargar TODOS los datos reales de Supabase
      await Promise.all([
        fetchAllDogs(),
        fetchTodayEvaluations(),
        calculateStats()
      ]);
      
    } catch (error) {
      console.error('❌ Error initializing teacher dashboard:', error);
      setLoading(false);
    }
  };

  const fetchAllDogs = async () => {
    try {
      // DATOS REALES: Cargar todos los perros activos del club
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          profiles!dogs_owner_id_fkey(full_name, email, phone)
        `)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      console.log('✅ Perros cargados de Supabase:', data?.length || 0);
      setDogs(data || []);
      
    } catch (error) {
      console.error('❌ Error fetching dogs:', error);
      setDogs([]);
    }
  };

  const fetchTodayEvaluations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // DATOS REALES: Evaluaciones de hoy en el colegio
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          dogs(id, name, breed),
          profiles!evaluations_evaluator_id_fkey(full_name, role)
        `)
        .eq('date', today)
        .eq('location', 'colegio')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Evaluaciones de hoy de Supabase:', data?.length || 0);
      setTodayEvaluations(data || []);
      
    } catch (error) {
      console.error('❌ Error fetching today evaluations:', error);
      setTodayEvaluations([]);
    }
  };

  const calculateStats = async () => {
    try {
      // DATOS REALES: Estadísticas calculadas de Supabase
      const { count: totalDogs } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      const today = new Date().toISOString().split('T')[0];
      const { count: evaluatedToday } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('location', 'colegio');

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { count: weeklyEvals } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .gte('date', weekAgo)
        .eq('location', 'colegio');

      setStats({
        totalDogs: totalDogs || 0,
        evaluatedToday: evaluatedToday || 0,
        pendingToday: (totalDogs || 0) - (evaluatedToday || 0),
        weeklyProgress: Math.round(((weeklyEvals || 0) / (totalDogs || 1) / 7) * 100)
      });

    } catch (error) {
      console.error('❌ Error calculating stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 NUEVAS FUNCIONES PARA EL SELECTOR (DATOS REALES)
  const handleDogSelection = (dogId) => {
    setSelectedDogId(dogId);
    console.log('🐕 Profesor seleccionó perro:', dogId);
  };

  const openEvaluationFormForSelected = () => {
    if (!selectedDogId) {
      alert('Por favor selecciona un perro para evaluar');
      return;
    }
    // DATOS REALES: Buscar perro real en la lista cargada de Supabase
    const dog = dogs.find(d => d.id === selectedDogId);
    if (dog) {
      console.log('📝 Evaluando perro real en colegio:', dog.name);
      openQuickEvaluation(dog);
    }
  };

  const getSelectedDog = () => {
    return dogs.find(dog => dog.id === selectedDogId);
  };

  const getSelectedDogEvaluationsToday = () => {
    if (!selectedDogId) return [];
    // DATOS REALES: Filtrar evaluaciones del perro seleccionado
    return todayEvaluations.filter(evaluation => evaluation.dogs?.id === selectedDogId);
  };

  const getSelectedDogRecentEvaluations = async () => {
    if (!selectedDogId) return [];
    try {
      // DATOS REALES: Cargar evaluaciones recientes del perro seleccionado
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          profiles!evaluations_evaluator_id_fkey(full_name, role)
        `)
        .eq('dog_id', selectedDogId)
        .eq('location', 'colegio')
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching dog evaluations:', error);
      return [];
    }
  };

  // Verificar si un perro fue evaluado hoy (DATOS REALES)
  const isEvaluatedToday = (dogId) => {
    return todayEvaluations.some(evaluation => evaluation.dogs?.id === dogId);
  };

  // Abrir modal de progreso específico para profesores (DATOS REALES)
  const openProgressModal = (dog) => {
    console.log('📊 Abriendo progreso del profesor para:', dog.name);
    setSelectedDogForProgress(dog);
    setShowProgressModal(true);
  };

  const closeProgressModal = () => {
    setShowProgressModal(false);
    setSelectedDogForProgress(null);
  };

  // Abrir evaluación rápida (DATOS REALES)
  const openQuickEvaluation = (dog) => {
    console.log('📝 Abriendo evaluación rápida para:', dog.name);
    setSelectedDogForEval(dog);
    setShowQuickEval(true);
  };

  const closeQuickEvaluation = () => {
    setShowQuickEval(false);
    setSelectedDogForEval(null);
  };

  // Manejar evaluación guardada (DATOS REALES)
  const handleEvaluationSaved = async () => {
    console.log('✅ Evaluación guardada en Supabase, recargando datos...');
    // Recargar datos reales de Supabase
    await Promise.all([
      fetchTodayEvaluations(),
      calculateStats()
    ]);
    closeQuickEvaluation();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
            Cargando Dashboard del Profesor
          </h2>
          <p className="text-gray-600">
            Preparando información de los peluditos...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👨‍🏫</div>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
            Usuario profesor no encontrado
          </h2>
          <p className="text-gray-600 mb-6">
            Necesitas crear los datos de prueba para usar el dashboard del profesor
          </p>
          <a 
            href="/crear-datos-prueba" 
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ✨ Crear Datos de Prueba
          </a>
        </div>
      </div>
    );
  }

  const selectedDogForDisplay = getSelectedDog();
  const selectedDogTodayEvals = getSelectedDogEvaluationsToday();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C3E50]">
          ¡Hola {currentUser.full_name || currentUser.email}! 👨‍🏫
        </h1>
        <p className="text-gray-600 mt-2">
          Dashboard del Profesor - Evalúa y rastrea el progreso de los peluditos en el colegio
        </p>
      </div>

      {/* 🆕 NUEVO SELECTOR DE PERROS - DATOS REALES DE SUPABASE */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Selector de perro */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona perro para evaluar en el colegio:
            </label>
            <select
              value={selectedDogId}
              onChange={(e) => handleDogSelection(e.target.value)}
              className="w-full md:w-80 border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              <option value="">Seleccionar perro...</option>
              {dogs.map(dog => (
                <option key={dog.id} value={dog.id}>
                  🐕 {dog.name} ({dog.breed}) - Dueño: {dog.profiles?.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Botón de evaluación */}
          <div className="flex-shrink-0">
            <button
              onClick={openEvaluationFormForSelected}
              disabled={!selectedDogId}
              className="w-full md:w-auto bg-[#C7EA46] text-[#2C3E50] px-8 py-3 rounded-lg font-semibold hover:bg-[#FFFE8D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📝 Evaluar en Colegio
            </button>
          </div>
        </div>

        {/* Información del perro seleccionado - DATOS REALES */}
        {selectedDogForDisplay && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#C7EA46] rounded-full flex items-center justify-center">
                  <span className="text-2xl text-[#2C3E50]">🐕</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#2C3E50]">{selectedDogForDisplay.name}</h3>
                  <p className="text-gray-600">
                    {selectedDogForDisplay.breed} • {selectedDogForDisplay.size} • Dueño: {selectedDogForDisplay.profiles?.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    📧 {selectedDogForDisplay.profiles?.email} • 📱 {selectedDogForDisplay.profiles?.phone}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500">Evaluado hoy:</div>
                <div className="text-2xl font-bold text-[#C7EA46]">
                  {isEvaluatedToday(selectedDogForDisplay.id) ? '✅' : '⏳'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🆕 EVALUACIONES DEL PERRO SELECCIONADO HOY - DATOS REALES */}
      {selectedDogForDisplay && selectedDogTodayEvals.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4">
            📝 Evaluación de Hoy - {selectedDogForDisplay.name}
          </h2>
          <div className="space-y-4">
            {selectedDogTodayEvals.map((evaluation, index) => (
              <div key={evaluation.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        {new Date(evaluation.created_at).toLocaleTimeString('es-CO')} - Evaluado en el colegio
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🏫 Colegio
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
                      <div className="mt-3 p-3 bg-white rounded-lg">
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

      {/* Estadísticas Rápidas - DATOS REALES DE SUPABASE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#56CCF2] rounded-full flex items-center justify-center">
              <span className="text-xl text-white">🐕</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Perros</p>
              <p className="text-2xl font-bold text-[#2C3E50]">{stats.totalDogs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#C7EA46] rounded-full flex items-center justify-center">
              <span className="text-xl text-[#2C3E50]">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Evaluados Hoy</p>
              <p className="text-2xl font-bold text-[#2C3E50]">{stats.evaluatedToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#FFFE8D] rounded-full flex items-center justify-center">
              <span className="text-xl text-[#2C3E50]">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-[#2C3E50]">{stats.pendingToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#ACF0F4] rounded-full flex items-center justify-center">
              <span className="text-xl text-[#2C3E50]">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Progreso Semanal</p>
              <p className="text-2xl font-bold text-[#2C3E50]">{stats.weeklyProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluaciones Completadas Hoy - DATOS REALES DE SUPABASE */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-[#2C3E50] mb-6">
          📋 Evaluaciones Completadas Hoy ({todayEvaluations.length})
        </h2>
        
        {todayEvaluations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p>No hay evaluaciones completadas hoy</p>
            <p className="text-sm mt-2">¡Empieza evaluando a los peluditos!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayEvaluations.map((evalItem) => (
              <div key={evalItem.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center">
                      {evalItem.dogs?.name || 'Perro desconocido'}
                      <span className="ml-2 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                        🏫 Colegio
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600">
                      Evaluado por: {evalItem.profiles?.full_name || 'Profesor'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(evalItem.created_at).toLocaleTimeString('es-CO')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm space-y-1">
                      <div>⚡ Energía: {evalItem.energy_level}/10</div>
                      <div>🤝 Social: {evalItem.sociability_level}/10</div>
                      <div>🎯 Obediencia: {evalItem.obedience_level}/10</div>
                      <div>😰 Ansiedad: {evalItem.anxiety_level}/10</div>
                    </div>
                  </div>
                </div>
                {evalItem.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                    <strong>Notas:</strong> {evalItem.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-[#2C3E50] mb-4">
          🚀 Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={openEvaluationFormForSelected}
            disabled={!selectedDogId}
            className="bg-[#C7EA46] text-[#2C3E50] p-4 rounded-lg hover:bg-[#FFFE8D] transition-colors text-left disabled:opacity-50"
          >
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-semibold">Evaluar Seleccionado</div>
            <div className="text-sm opacity-90">
              {selectedDogForDisplay ? `Evaluar a ${selectedDogForDisplay.name}` : 'Selecciona un perro arriba'}
            </div>
          </button>

          <button 
            onClick={() => {
              if (selectedDogForDisplay) {
                openProgressModal(selectedDogForDisplay);
              } else {
                alert('Selecciona un perro arriba para ver su progreso');
              }
            }}
            className="bg-[#56CCF2] text-white p-4 rounded-lg hover:bg-[#5B9BD5] transition-colors text-left"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-semibold">Ver Progreso</div>
            <div className="text-sm opacity-90">
              {selectedDogForDisplay ? `Progreso de ${selectedDogForDisplay.name}` : 'Analíticas de cualquier perro'}
            </div>
          </button>

          <a 
            href="https://wa.me/573144329824?text=Hola%20Juan%20Pablo%2C%20reporte%20del%20día%20desde%20el%20dashboard%20del%20profesor"
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left block"
          >
            <div className="text-2xl mb-2">📱</div>
            <div className="font-semibold">Reportar</div>
            <div className="text-sm opacity-90">WhatsApp con Juan Pablo</div>
          </a>
        </div>
      </div>

      {/* Modal de Progreso para Profesores - DATOS REALES */}
      {showProgressModal && selectedDogForProgress && (
        <DogProgressModal
          dog={selectedDogForProgress}
          isOpen={showProgressModal}
          onClose={closeProgressModal}
        />
      )}

      {/* Modal de Evaluación Rápida - DATOS REALES */}
      {showQuickEval && selectedDogForEval && currentUser && (
        <CompleteEvaluationForm
          dogId={selectedDogForEval.id}
          userId={currentUser.id}
          userRole="profesor"
          onClose={closeQuickEvaluation}
          onSave={handleEvaluationSaved}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;