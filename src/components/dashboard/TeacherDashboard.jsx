// src/components/dashboard/TeacherDashboard.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import CompleteEvaluationForm from './CompleteEvaluationForm.jsx';

const TeacherDashboard = () => {
  const [dogs, setDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [view, setView] = useState('today');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      // Buscar usuario profesor (Carlos Profesor)
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'profesor@clubcanino.com')
        .eq('role', 'profesor')
        .single();

      if (userError) {
        console.error('Error finding teacher:', userError);
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      console.log('✅ Profesor encontrado:', user);

      // Cargar datos del dashboard
      await Promise.all([
        fetchAllDogs(),
        fetchTodayEvaluations()
      ]);
      
    } catch (error) {
      console.error('Error initializing teacher dashboard:', error);
      setLoading(false);
    }
  };

  const fetchAllDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          users!dogs_owner_id_fkey(name, phone)
        `)
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      console.log('✅ Perros encontrados:', data);
      setDogs(data || []);
    } catch (error) {
      console.error('Error fetching dogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayEvaluations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          dogs(name),
          users!evaluations_evaluator_id_fkey(name)
        `)
        .eq('date', today)
        .eq('location', 'colegio')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('✅ Evaluaciones de hoy:', data);
      setEvaluations(data || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    }
  };

  const handleEvaluationSaved = () => {
    setShowEvaluationForm(false);
    fetchTodayEvaluations();
  };

  const getQuickStats = () => {
    const totalDogs = dogs.length;
    const evaluatedToday = evaluations.length;
    const pendingToday = totalDogs - evaluatedToday;
    
    return { totalDogs, evaluatedToday, pendingToday };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56CCF2]"></div>
        <span className="ml-3 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  // Si no hay usuario profesor, mostrar mensaje para crear datos
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
            Datos de prueba no encontrados
          </h2>
          <p className="text-gray-600 mb-6">
            Necesitas crear los datos de prueba para usar el dashboard del profesor
          </p>
          <div className="space-x-4">
            <a 
              href="/crear-datos-prueba" 
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ✨ Crear Datos de Prueba
            </a>
            <a 
              href="/diagnostico" 
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              🔧 Diagnóstico
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { totalDogs, evaluatedToday, pendingToday } = getQuickStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C3E50]">
          Panel del Profesor {currentUser.name} 👨‍🏫
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona las evaluaciones y el progreso de los peluditos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#56CCF2] rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">🐕</span>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-[#2C3E50]">{totalDogs}</h3>
              <p className="text-gray-600">Perros Activos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#C7EA46] rounded-full flex items-center justify-center">
              <span className="text-2xl text-[#2C3E50]">✅</span>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-[#2C3E50]">{evaluatedToday}</h3>
              <p className="text-gray-600">Evaluados Hoy</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#FFFE8D] rounded-full flex items-center justify-center">
              <span className="text-2xl text-[#2C3E50]">⏳</span>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-[#2C3E50]">{pendingToday}</h3>
              <p className="text-gray-600">Pendientes Hoy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setView('today')}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === 'today'
                ? 'bg-[#56CCF2] text-white'
                : 'bg-white text-[#2C3E50] border border-gray-300 hover:bg-gray-50'
            }`}
          >
            📋 Evaluaciones de Hoy
          </button>
          <button
            onClick={() => setView('dogs')}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === 'dogs'
                ? 'bg-[#56CCF2] text-white'
                : 'bg-white text-[#2C3E50] border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🐕 Lista de Perros
          </button>
          <button
            onClick={() => setView('evaluations')}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === 'evaluations'
                ? 'bg-[#56CCF2] text-white'
                : 'bg-white text-[#2C3E50] border border-gray-300 hover:bg-gray-50'
            }`}
          >
            📊 Historial
          </button>
        </div>
      </div>

      {view === 'today' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#2C3E50]">
              Evaluaciones de Hoy ({new Date().toLocaleDateString()})
            </h2>
            <div className="text-sm text-gray-600">
              {evaluatedToday}/{totalDogs} completadas
            </div>
          </div>

          {evaluations.length > 0 ? (
            <div className="space-y-4">
              {evaluations.map((evaluationItem) => (
                <div key={evaluationItem.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-[#2C3E50]">
                        {evaluationItem.dogs?.name}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <div>
                          <span className="text-xs text-gray-600">Energía</span>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-[#56CCF2] h-2 rounded-full" 
                                style={{ width: `${(evaluationItem.energy_level || 0) * 10}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{evaluationItem.energy_level}/10</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-xs text-gray-600">Social</span>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-[#C7EA46] h-2 rounded-full" 
                                style={{ width: `${(evaluationItem.sociability_level || 0) * 10}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{evaluationItem.sociability_level}/10</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-xs text-gray-600">Obediencia</span>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-[#5B9BD5] h-2 rounded-full" 
                                style={{ width: `${(evaluationItem.obedience_level || 0) * 10}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{evaluationItem.obedience_level}/10</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-xs text-gray-600">Ansiedad</span>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-[#AB5729] h-2 rounded-full" 
                                style={{ width: `${(evaluationItem.anxiety_level || 0) * 10}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{evaluationItem.anxiety_level}/10</span>
                          </div>
                        </div>
                      </div>
                      
                      {evaluationItem.highlights && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-800">⭐ {evaluationItem.highlights}</p>
                        </div>
                      )}

                      {evaluationItem.notes && (
                        <div className="mt-3 p-3 bg-[#FFFBF0] rounded-lg">
                          <p className="text-sm text-gray-700">{evaluationItem.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <span className="text-xs text-gray-500">
                        {new Date(evaluationItem.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p>No hay evaluaciones registradas para hoy</p>
              <p className="text-sm mt-2">¡Evalúa a los peluditos para empezar!</p>
            </div>
          )}
        </div>
      )}

      {view === 'dogs' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#2C3E50]">
              Lista de Perros ({dogs.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dogs.map((dog) => {
              const hasEvaluationToday = evaluations.some(e => e.dog_id === dog.id);
              
              return (
                <div key={dog.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-[#2C3E50]">{dog.name}</h3>
                      <p className="text-sm text-gray-600">{dog.breed}</p>
                      <p className="text-xs text-gray-500">
                        {dog.users?.name} • {dog.users?.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        hasEvaluationToday 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {hasEvaluationToday ? '✅ Evaluado' : '⏳ Pendiente'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDog(dog);
                        setShowEvaluationForm(true);
                      }}
                      className="flex-1 bg-[#56CCF2] text-white py-2 px-3 rounded-md text-sm hover:bg-[#5B9BD5] transition-colors"
                    >
                      📝 Evaluar
                    </button>
                    <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-md text-sm hover:bg-gray-200 transition-colors">
                      📊 Historial
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {dogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🐕</div>
              <p>No hay perros registrados</p>
              <p className="text-sm mt-2">Crea datos de prueba para empezar</p>
              <a 
                href="/crear-datos-prueba" 
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-4"
              >
                ✨ Crear Datos de Prueba
              </a>
            </div>
          )}
        </div>
      )}

      {view === 'evaluations' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-6">
            Historial de Evaluaciones
          </h2>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <p>Vista de historial en desarrollo...</p>
          </div>
        </div>
      )}

      {showEvaluationForm && selectedDog && currentUser && (
        <CompleteEvaluationForm
          dogId={selectedDog.id}
          userId={currentUser.id}
          userRole="profesor"
          onClose={() => {
            setShowEvaluationForm(false);
            setSelectedDog(null);
          }}
          onSave={handleEvaluationSaved}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;