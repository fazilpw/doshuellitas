// src/components/dashboard/TeacherDashboard.jsx - 100% INDEPENDIENTE
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

// ✅ IMPORTS MÉDICOS ACTIVADOS
import MedicalQuickView from '../teacher/MedicalQuickView.jsx';
import TeacherMedicalView from '../teacher/TeacherMedicalView.jsx';

// ============================================
// 🏥 COMPONENTE AUXILIAR - INDICADORES MÉDICOS
// ============================================
const MedicalIndicators = ({ dogId }) => {
  const [indicators, setIndicators] = useState({
    hasOverdueVaccines: false,
    hasActiveMedicines: false,
    hasCriticalAlerts: false,
    loading: true,
    tablesExist: false
  });

  useEffect(() => {
    fetchMedicalIndicators();
  }, [dogId]);

  const fetchMedicalIndicators = async () => {
    try {
      let hasAnyData = false;

      // Verificar vacunas vencidas (con manejo de errores)
      let overdueVaccines = [];
      try {
        const { data } = await supabase
          .from('vaccines')
          .select('id')
          .eq('dog_id', dogId)
          .lt('next_due_date', new Date().toISOString().split('T')[0])
          .limit(1);
        
        overdueVaccines = data || [];
        hasAnyData = true;
      } catch (error) {
        console.log('Tabla vaccines no disponible');
      }

      // Verificar medicinas activas (con manejo de errores)
      let activeMedicines = [];
      try {
        const { data } = await supabase
          .from('medicines')
          .select('id')
          .eq('dog_id', dogId)
          .eq('is_ongoing', true)
          .limit(1);
        
        activeMedicines = data || [];
        hasAnyData = true;
      } catch (error) {
        console.log('Tabla medicines no disponible');
      }

      // Verificar alertas críticas (con manejo de errores)
      let criticalAlerts = [];
      try {
        const { data } = await supabase
          .from('medical_alerts')
          .select('id')
          .eq('dog_id', dogId)
          .in('severity', ['critical', 'high'])
          .eq('is_active', true)
          .limit(1);
        
        criticalAlerts = data || [];
        hasAnyData = true;
      } catch (error) {
        console.log('Tabla medical_alerts no disponible');
      }

      setIndicators({
        hasOverdueVaccines: overdueVaccines.length > 0,
        hasActiveMedicines: activeMedicines.length > 0,
        hasCriticalAlerts: criticalAlerts.length > 0,
        loading: false,
        tablesExist: hasAnyData
      });

    } catch (error) {
      console.error('❌ Error fetching medical indicators:', error);
      setIndicators(prev => ({ 
        ...prev, 
        loading: false,
        tablesExist: false
      }));
    }
  };

  if (indicators.loading) {
    return (
      <div className="flex space-x-1">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  // Si las tablas médicas no existen
  if (!indicators.tablesExist) {
    return (
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-blue-600 text-xs">🏥 Sistema médico listo</span>
        <span className="text-gray-400 text-xs">(configurar BD)</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-xs">
      {indicators.hasCriticalAlerts && (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center">
          🚨 Alerta
        </span>
      )}
      {indicators.hasOverdueVaccines && (
        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center">
          💉 Vacuna
        </span>
      )}
      {indicators.hasActiveMedicines && (
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
          💊 Medicina
        </span>
      )}
      {!indicators.hasCriticalAlerts && !indicators.hasOverdueVaccines && !indicators.hasActiveMedicines && (
        <span className="text-green-600 text-xs">✅ Todo bien</span>
      )}
    </div>
  );
};

const TeacherDashboard = () => {
  // ============================================
  // 🔄 ESTADOS
  // ============================================
  const [dogs, setDogs] = useState([]);
  const [todayEvaluations, setTodayEvaluations] = useState([]);
  const [stats, setStats] = useState({
    totalDogs: 0,
    evaluatedToday: 0,
    pendingToday: 0,
    weeklyProgress: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Estados de modales
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedDogForProgress, setSelectedDogForProgress] = useState(null);
  const [showQuickEval, setShowQuickEval] = useState(false);
  const [selectedDogForEval, setSelectedDogForEval] = useState(null);

  // ✅ ESTADOS MÉDICOS (temporalmente deshabilitados)
  const [showMedicalView, setShowMedicalView] = useState(false);
  const [selectedDogForMedical, setSelectedDogForMedical] = useState(null);

  // ============================================
  // 🔄 EFECTOS Y FUNCIONES DE DATOS
  // ============================================
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDogs(),
        fetchTodayEvaluations()
      ]);
    } catch (error) {
      console.error('❌ Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          profiles!dogs_owner_id_fkey(full_name, phone, email)
        `)
        .order('name');

      if (error) throw error;
      
      setDogs(data || []);
      calculateStats(data || []);
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
          dogs!evaluations_dog_id_fkey(id, name, breed),
          profiles!evaluations_evaluator_id_fkey(full_name, role)
        `)
        .eq('date', today)
        .eq('location', 'colegio')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodayEvaluations(data || []);
    } catch (error) {
      console.error('❌ Error fetching today evaluations:', error);
      setTodayEvaluations([]);
    }
  };

  const calculateStats = (dogsData) => {
    const totalDogs = dogsData.length;
    const evaluatedToday = todayEvaluations.length;
    const pendingToday = totalDogs - evaluatedToday;
    
    const weeklyProgress = totalDogs > 0 ? Math.round((evaluatedToday / totalDogs) * 100) : 0;

    setStats({
      totalDogs,
      evaluatedToday,
      pendingToday,
      weeklyProgress
    });
  };

  useEffect(() => {
    if (dogs.length > 0) {
      calculateStats(dogs);
    }
  }, [todayEvaluations, dogs]);

  // ✅ FUNCIONES MÉDICAS ACTIVADAS
  const openMedicalView = (dog = null) => {
    console.log('🏥 Abriendo vista médica:', dog?.name || 'vista general');
    setSelectedDogForMedical(dog);
    setShowMedicalView(true);
  };

  // ============================================
  // 📝 FUNCIONES DE EVALUACIÓN
  // ============================================
  const isEvaluatedToday = (dogId) => {
    return todayEvaluations.some(evaluation => evaluation.dogs?.id === dogId);
  };

  const openProgressModal = (dog) => {
    console.log('📊 Abriendo progreso simplificado para:', dog.name);
    setSelectedDogForProgress(dog);
    setShowProgressModal(true);
  };

  const closeProgressModal = () => {
    setShowProgressModal(false);
    setSelectedDogForProgress(null);
  };

  const openQuickEvaluation = (dog) => {
    console.log('📝 Abriendo evaluación rápida para:', dog.name);
    setSelectedDogForEval(dog);
    setShowQuickEval(true);
  };

  const closeQuickEvaluation = () => {
    setShowQuickEval(false);
    setSelectedDogForEval(null);
  };

  const handleEvaluationSaved = async () => {
    console.log('✅ Evaluación guardada, recargando datos...');
    await fetchTodayEvaluations();
    closeQuickEvaluation();
  };

  // ✅ VISTA MÉDICA ACTIVADA
  if (showMedicalView) {
    return (
      <TeacherMedicalView 
        selectedDog={selectedDogForMedical}
        onClose={() => setShowMedicalView(false)}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando dashboard del profesor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* 🎯 HEADER CON NAVEGACIÓN */}
      {/* ============================================ */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white p-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">👨‍🏫 Dashboard Profesor</h1>
            <p className="opacity-90">Bienvenido de vuelta, gestiona evaluaciones y cuidado</p>
          </div>
          <div className="flex space-x-3">
            {/* ✅ BOTÓN MÉDICO (PLACEHOLDER) */}
            <button
              onClick={() => openMedicalView()}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>🏥</span>
              <span>Centro Médico</span>
            </button>
            
            <button
              onClick={fetchInitialData}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 📊 ESTADÍSTICAS RÁPIDAS */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 mx-4 md:mx-10 lg:grid-cols-4 gap-6">
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

      {/* ============================================ */}
      {/* 📋 EVALUACIONES COMPLETADAS HOY */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl mx-4 md:mx-10 shadow-lg p-6">
        <h2 className="text-xl font-bold text-[#2C3E50] mb-6">
          📋 Evaluaciones Completadas Hoy ({todayEvaluations.length})
        </h2>
        
        {todayEvaluations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay evaluaciones completadas hoy</h3>
            <p className="text-gray-600">Las evaluaciones aparecerán aquí conforme las completes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayEvaluations.map(evaluation => {
              const dog = dogs.find(d => d.id === evaluation.dogs?.id);
              
              return (
                <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-bold text-gray-900">{evaluation.dogs?.name}</h3>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-600">{evaluation.dogs?.breed}</span>
                      
                      {/* ✅ BOTÓN MÉDICO ACTIVADO */}
                      <button
                        onClick={() => openMedicalView(dog)}
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200 transition-colors flex items-center space-x-1"
                        title="Ver información médica completa"
                      >
                        <span>🏥</span>
                        <span>Médico</span>
                      </button>
                    </div>
                    
                    <span className="text-xs text-gray-500">
                      {new Date(evaluation.date).toLocaleDateString('es-CO')}
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
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* 🐕 PERROS DE HOY */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl mx-4 md:mx-10 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#2C3E50]">
            🐕 Perros de Hoy ({dogs.length})
          </h2>
          <div className="text-sm text-gray-600">
            {todayEvaluations.length} evaluados • {dogs.length - todayEvaluations.length} pendientes
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dogs.map(dog => {
            const evaluated = isEvaluatedToday(dog.id);
            
            return (
              <div key={dog.id} className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                evaluated ? 'border-green-300 bg-green-50' : 'border-gray-200'
              }`}>
                
                {/* Info básica del perro */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{dog.name}</h3>
                    <p className="text-sm text-gray-600">{dog.breed} • {dog.age} años</p>
                    <p className="text-xs text-gray-500">👤 {dog.profiles?.full_name}</p>
                  </div>
                  <div className="flex space-x-2">
                    {/* ✅ BOTÓN MÉDICO DIRECTO ACTIVADO */}
                    <button
                      onClick={() => openMedicalView(dog)}
                      className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Ver información médica completa"
                    >
                      🏥
                    </button>
                    
                    <button
                      onClick={() => openProgressModal(dog)}
                      className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Ver progreso"
                    >
                      📊
                    </button>
                  </div>
                </div>

                    {/* ✅ INDICADORES MÉDICOS ACTIVADOS */}
                    <div className="mb-3">
                      <MedicalIndicators dogId={dog.id} />
                    </div>

                {/* Estado de evaluación y botón */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    evaluated 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {evaluated ? '✅ Evaluado' : '⏰ Pendiente'}
                  </span>
                  
                  <button
                    onClick={() => openQuickEvaluation(dog)}
                    className="bg-[#56CCF2] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#5B9BD5] transition-colors"
                  >
                    {evaluated ? 'Ver' : 'Evaluar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================ */}
      {/* 🎭 MODALES INTEGRADOS */}
      {/* ============================================ */}

      {/* Modal de progreso simplificado */}
      {showProgressModal && selectedDogForProgress && (
        <SimpleProgressModal
          dog={selectedDogForProgress}
          onClose={closeProgressModal}
        />
      )}

      {/* Modal de evaluación rápida */}
      {showQuickEval && selectedDogForEval && (
        <SimpleQuickEvaluationModal
          dog={selectedDogForEval}
          onClose={closeQuickEvaluation}
          onSave={handleEvaluationSaved}
        />
      )}
    </div>
  );
};

// ============================================
// 📊 MODAL DE PROGRESO SIMPLIFICADO INTEGRADO
// ============================================
const SimpleProgressModal = ({ dog, onClose }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDogEvaluations();
  }, [dog.id]);

  const fetchDogEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('dog_id', dog.id)
        .eq('location', 'colegio')
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setEvaluations(data || []);
    } catch (error) {
      console.error('❌ Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAverage = (field) => {
    if (evaluations.length === 0) return 0;
    const sum = evaluations.reduce((acc, evaluation) => acc + (evaluation[field] || 0), 0);
    return Math.round((sum / evaluations.length) * 10) / 10;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-[#56CCF2] text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">📊 Progreso de {dog.name}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
            >
              ✕
            </button>
          </div>
          <p className="opacity-90 mt-1">{dog.breed} • {evaluations.length} evaluaciones</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
              <p>Cargando progreso...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Promedios generales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{getAverage('obedience_level')}/10</div>
                  <div className="text-sm text-blue-800">Obediencia</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{getAverage('sociability_level')}/10</div>
                  <div className="text-sm text-green-800">Sociabilidad</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{getAverage('energy_level')}/10</div>
                  <div className="text-sm text-yellow-800">Energía</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{getAverage('anxiety_level')}/10</div>
                  <div className="text-sm text-purple-800">Ansiedad</div>
                </div>
              </div>

              {/* Evaluaciones recientes */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3">📋 Evaluaciones Recientes</h4>
                {evaluations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay evaluaciones registradas</p>
                ) : (
                  <div className="space-y-2">
                    {evaluations.slice(0, 5).map(evaluation => (
                      <div key={evaluation.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{new Date(evaluation.date).toLocaleDateString('es-CO')}</span>
                          <span className="text-sm text-gray-500">Colegio</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>Ob: {evaluation.obedience_level}/10</div>
                          <div>Soc: {evaluation.sociability_level}/10</div>
                          <div>En: {evaluation.energy_level}/10</div>
                          <div>Ans: {evaluation.anxiety_level}/10</div>
                        </div>
                        {evaluation.notes && (
                          <p className="text-sm text-gray-600 mt-2">{evaluation.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// 📝 MODAL DE EVALUACIÓN RÁPIDA INTEGRADO
// ============================================
const SimpleQuickEvaluationModal = ({ dog, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    energy_level: 5,
    sociability_level: 5,
    obedience_level: 5,
    anxiety_level: 5,
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const evaluationData = {
        dog_id: dog.id,
        date: new Date().toISOString().split('T')[0],
        location: 'colegio',
        evaluator_id: (await supabase.auth.getUser()).data.user?.id,
        ...formData
      };

      const { error } = await supabase
        .from('evaluations')
        .insert([evaluationData]);

      if (error) throw error;

      console.log('✅ Evaluación guardada exitosamente');
      onSave();
    } catch (error) {
      console.error('❌ Error saving evaluation:', error);
      alert('Error al guardar la evaluación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="bg-[#56CCF2] text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">📝 Evaluación Rápida</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
            >
              ✕
            </button>
          </div>
          <p className="opacity-90 mt-1">{dog.name} - {dog.breed}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {['energy_level', 'sociability_level', 'obedience_level', 'anxiety_level'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field === 'energy_level' ? '⚡ Energía' :
                 field === 'sociability_level' ? '🤝 Sociabilidad' :
                 field === 'obedience_level' ? '🎯 Obediencia' :
                 '😰 Ansiedad'} ({formData[field]}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData[field]}
                onChange={(e) => setFormData(prev => ({ ...prev, [field]: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Notas (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="Observaciones del día..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherDashboard;