// src/components/dashboard/TeacherDashboard.jsx - VERSIÓN COMPLETA ✅
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

  useEffect(() => {
    initializeTeacherDashboard();
  }, []);

  const initializeTeacherDashboard = async () => {
    try {
      // Buscar usuario profesor
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', '22222222-2222-2222-2222-222222222222') // ID específico del profesor
        .eq('role', 'profesor')
        .single();

      if (userError) {
        console.error('❌ Error finding teacher:', userError);
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      console.log('✅ Usuario profesor encontrado:', user);

      // Cargar datos
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
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          profiles!dogs_owner_id_fkey(full_name, email, phone)
        `)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      console.log('✅ Perros cargados:', data?.length || 0);
      setDogs(data || []);
      
    } catch (error) {
      console.error('❌ Error fetching dogs:', error);
      setDogs([]);
    }
  };

  const fetchTodayEvaluations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
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

      console.log('✅ Evaluaciones de hoy:', data?.length || 0);
      setTodayEvaluations(data || []);
      
    } catch (error) {
      console.error('❌ Error fetching today evaluations:', error);
      setTodayEvaluations([]);
    }
  };

  const calculateStats = async () => {
    try {
      // Total de perros activos
      const { count: totalDogs } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      // Evaluaciones de hoy en colegio
      const today = new Date().toISOString().split('T')[0];
      const { count: evaluatedToday } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('location', 'colegio');

      // Evaluaciones de esta semana
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

// Verificar si un perro fue evaluado hoy
const isEvaluatedToday = (dogId) => {
  return todayEvaluations.some(evaluation => evaluation.dogs?.id === dogId);
};

// Abrir modal de progreso específico para profesores
const openProgressModal = (dog) => {
  console.log('📊 Abriendo progreso del profesor para:', dog.name);
  setSelectedDogForProgress(dog);
  setShowProgressModal(true);
};

const closeProgressModal = () => {
  setShowProgressModal(false);
  setSelectedDogForProgress(null);
};

  // Abrir evaluación rápida
  const openQuickEvaluation = (dog) => {
    console.log('📝 Abriendo evaluación rápida para:', dog.name);
    setSelectedDogForEval(dog);
    setShowQuickEval(true);
  };

  const closeQuickEvaluation = () => {
    setShowQuickEval(false);
    setSelectedDogForEval(null);
  };

  // Manejar evaluación guardada
  const handleEvaluationSaved = async () => {
    console.log('✅ Evaluación guardada, recargando datos...');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C3E50]">
          ¡Hola {currentUser.full_name || currentUser.email}! 👨‍🏫
        </h1>
        <p className="text-gray-600 mt-2">
          Dashboard del Profesor - Evalúa y rastrea el progreso de los peluditos
        </p>
      </div>

      {/* Estadísticas Rápidas */}
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
              <p className="text-sm font-medium text-gray-500">Pendientes Hoy</p>
              <p className="text-2xl font-bold text-[#2C3E50]">{stats.pendingToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#AB5729] rounded-full flex items-center justify-center">
              <span className="text-xl text-white">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Progreso Semanal</p>
              <p className="text-2xl font-bold text-[#2C3E50]">{stats.weeklyProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Perros para Evaluar Hoy */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#2C3E50]">
            🎯 Perros para Evaluar Hoy
          </h2>
          <div className="text-sm text-gray-600">
            {stats.evaluatedToday}/{stats.totalDogs} completados
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dogs.map((dog) => {
            const evaluatedToday = isEvaluatedToday(dog.id);
            
            return (
              <div 
                key={dog.id} 
                className={`border rounded-xl p-6 transition-all ${
                  evaluatedToday 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    evaluatedToday ? 'bg-green-500' : 'bg-gradient-to-br from-[#56CCF2] to-[#5B9BD5]'
                  }`}>
                    {evaluatedToday ? '✅' : dog.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-bold text-gray-900">{dog.name}</h3>
                    <p className="text-sm text-gray-600">{dog.breed}</p>
                    <p className="text-xs text-gray-500">
                      Dueño: {dog.profiles?.full_name || 'Sin dueño'}
                    </p>
                  </div>
                </div>

                {evaluatedToday ? (
                  <div className="space-y-2">
                    <div className="flex items-center text-green-700">
                      <span className="text-sm font-medium">✅ Evaluado hoy</span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openProgressModal(dog)}
                        className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded-lg text-sm hover:bg-green-200 transition-colors"
                      >
                        📊 Ver Progreso
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      ⏳ Pendiente de evaluación
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openQuickEvaluation(dog)}
                        className="flex-1 bg-[#56CCF2] text-white py-2 px-3 rounded-lg text-sm hover:bg-[#5B9BD5] transition-colors"
                      >
                        📝 Evaluar Ahora
                      </button>
                      <button 
                        onClick={() => openProgressModal(dog)}
                        className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        📊
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluaciones de Hoy */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-[#2C3E50] mb-6">
          📋 Evaluaciones Completadas Hoy
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
            onClick={() => {
              const pendingDog = dogs.find(dog => !isEvaluatedToday(dog.id));
              if (pendingDog) {
                openQuickEvaluation(pendingDog);
              } else {
                alert('¡Excelente! Ya evaluaste todos los perros hoy 🎉');
              }
            }}
            className="bg-[#56CCF2] text-white p-4 rounded-lg hover:bg-[#5B9BD5] transition-colors text-left"
          >
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-semibold">Evaluar Siguiente</div>
            <div className="text-sm opacity-90">Siguiente perro pendiente</div>
          </button>

          <button 
            onClick={() => {
              const completedDog = dogs.find(dog => isEvaluatedToday(dog.id));
              if (completedDog) {
                openProgressModal(completedDog);
              } else {
                alert('Aún no has evaluado ningún perro hoy');
              }
            }}
            className="bg-[#C7EA46] text-[#2C3E50] p-4 rounded-lg hover:bg-[#FFFE8D] transition-colors text-left"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-semibold">Ver Progreso</div>
            <div className="text-sm opacity-90">Analíticas de cualquier perro</div>
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

      {/* Modal de Progreso para Profesores */}
      {showProgressModal && selectedDogForProgress && (
        <DogProgressModal
          dog={selectedDogForProgress}
          isOpen={showProgressModal}
          onClose={closeProgressModal}
        />
      )}

      {/* Modal de Evaluación Rápida */}
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