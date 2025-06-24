// src/components/dashboard/ParentDashboard.jsx - VERSIÓN CORREGIDA ✅
import { useState, useEffect } from 'react';
import supabase, { getDogAverages, getMultipleDogsAverages } from '../../lib/supabase.js';
import CompleteEvaluationForm from './CompleteEvaluationForm.jsx';
import DogProgressModal from './DogProgressModal.jsx';

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

  useEffect(() => {
    initializeDashboard();
  }, []);

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
        console.error('❌ Error fetching user dogs:', error);
        throw error;
      }

      console.log('✅ Perros del usuario:', data);
      setDogs(data || []);
      
      if (data && data.length > 0) {
        await Promise.all([
          fetchRecentEvaluations(data.map(dog => dog.id)),
          fetchDogsAverages(data.map(dog => dog.id))
        ]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching dogs:', error);
      setDogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDogsAverages = async (dogIds) => {
    try {
      console.log('📊 Calculando promedios para perros:', dogIds);
      
      const { data, error } = await getMultipleDogsAverages(dogIds);
      
      if (error) {
        console.error('❌ Error fetching dog averages:', error);
        return;
      }
      
      console.log('✅ Promedios calculados:', data);
      setDogAverages(data || {});
      
    } catch (error) {
      console.error('❌ Error calculating averages:', error);
    }
  };

  const fetchRecentEvaluations = async (dogIds) => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          dogs(name, id),
          profiles!evaluations_evaluator_id_fkey(full_name, email, role)
        `)
        .in('dog_id', dogIds)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching evaluations:', error);
        throw error;
      }

      console.log('✅ Evaluaciones recientes:', data);
      setEvaluations(data || []);
      
    } catch (error) {
      console.error('❌ Error fetching evaluations:', error);
      setEvaluations([]);
    }
  };

  const handleEvaluationSaved = async (newEvaluation) => {
    console.log('✅ Nueva evaluación guardada:', newEvaluation);
    
    try {
      if (dogs.length > 0) {
        await fetchRecentEvaluations(dogs.map(dog => dog.id));
      }
      
      if (newEvaluation.dog_id) {
        console.log('📊 Recalculando promedios para:', newEvaluation.dog_id);
        
        const { data, error } = await getDogAverages(newEvaluation.dog_id);
        
        if (!error && data) {
          setDogAverages(prev => ({
            ...prev,
            [newEvaluation.dog_id]: data
          }));
          console.log('✅ Promedios actualizados para perro:', newEvaluation.dog_id);
        }
      }
      
    } catch (error) {
      console.error('❌ Error updating after evaluation:', error);
    }
  };

  // 📊 FUNCIÓN CORREGIDA: Abrir modal de progreso
  const openProgressModal = (dog) => {
    console.log('📊 === DEBUG MODAL PROGRESO ===');
    console.log('📊 Perro seleccionado:', dog);
    console.log('📊 ID del perro:', dog?.id);
    console.log('📊 Nombre del perro:', dog?.name);
    console.log('📊 DogProgressModal componente:', DogProgressModal);
    console.log('📊 Tipo de DogProgressModal:', typeof DogProgressModal);
    
    console.log('📊 Estado showProgressModal antes:', showProgressModal);
    console.log('📊 Estado selectedDogForProgress antes:', selectedDogForProgress);
    
    try {
      setSelectedDogForProgress(dog);
      setShowProgressModal(true);
      
      console.log('✅ Estados actualizados correctamente');
      
    } catch (error) {
      console.error('❌ Error al actualizar estados:', error);
    }
    
    setTimeout(() => {
      console.log('📊 === VERIFICACIÓN POST-ACTUALIZACIÓN ===');
      console.log('📊 showProgressModal final:', showProgressModal);
      console.log('📊 selectedDogForProgress final:', selectedDogForProgress);
    }, 100);
  };

  const closeProgressModal = () => {
    console.log('📊 Cerrando modal de progreso');
    setShowProgressModal(false);
    setSelectedDogForProgress(null);
  };

  const getLastEvaluation = (dogId, location) => {
    return evaluations
      .filter(evaluation => evaluation.dog_id === dogId && evaluation.location === location)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  };

  const getDogStats = (dogId) => {
    const dogEvaluations = evaluations.filter(evaluation => evaluation.dog_id === dogId);
    const averagesData = dogAverages[dogId];
    
    if (averagesData) {
      return {
        avg_energy: averagesData.raw_averages?.energy || 0,
        avg_sociability: averagesData.raw_averages?.sociability || 0,
        avg_obedience: averagesData.raw_averages?.obedience || 0,
        total_evaluations: averagesData.total_evaluations || 0,
        energy_percentage: averagesData.energy_percentage || 0,
        sociability_percentage: averagesData.sociability_percentage || 0,
        obedience_percentage: averagesData.obedience_percentage || 0,
        anxiety_percentage: averagesData.anxiety_percentage || 0,
        trend: averagesData.trend || 'sin_datos'
      };
    }
    
    if (dogEvaluations.length === 0) {
      return { 
        avg_energy: 0, 
        avg_sociability: 0, 
        avg_obedience: 0,
        total_evaluations: 0,
        energy_percentage: 0,
        sociability_percentage: 0,
        obedience_percentage: 0,
        anxiety_percentage: 0,
        trend: 'sin_datos'
      };
    }

    const avg_energy = Math.round(
      dogEvaluations.reduce((sum, evaluation) => sum + (evaluation.energy_level || 0), 0) / dogEvaluations.length
    );
    
    const avg_sociability = Math.round(
      dogEvaluations.reduce((sum, evaluation) => sum + (evaluation.sociability_level || 0), 0) / dogEvaluations.length
    );

    const avg_obedience = Math.round(
      dogEvaluations.reduce((sum, evaluation) => sum + (evaluation.obedience_level || 0), 0) / dogEvaluations.length
    );

    return {
      avg_energy,
      avg_sociability,
      avg_obedience,
      total_evaluations: dogEvaluations.length,
      energy_percentage: Math.round((avg_energy / 10) * 100),
      sociability_percentage: Math.round((avg_sociability / 10) * 100),
      obedience_percentage: Math.round((avg_obedience / 10) * 100),
      trend: 'estable'
    };
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
            Cargando Dashboard del Padre
          </h2>
          <p className="text-gray-600">
            Obteniendo información de tus peluditos...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
            Usuario padre no encontrado
          </h2>
          <p className="text-gray-600 mb-6">
            Necesitas crear los datos de prueba para usar el dashboard del padre
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C3E50]">
          ¡Hola {currentUser.full_name || currentUser.email}! 👨‍👩‍👧‍👦
        </h1>
        <p className="text-gray-600 mt-2">
          Aquí puedes ver el progreso de tus peluditos y evaluar su comportamiento en casa
        </p>
      </div>

      {dogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐕</div>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
            No tienes perros registrados
          </h2>
          <p className="text-gray-600 mb-6">
            Contacta al administrador para registrar a tu peludito
          </p>
          <a 
            href="https://wa.me/573144329824?text=Hola%20Juan%20Pablo%2C%20quiero%20registrar%20a%20mi%20perro%20en%20el%20club"
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📱 Contactar por WhatsApp
          </a>
        </div>
      ) : (
        <>
          {/* Resumen rápido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#56CCF2] rounded-full flex items-center justify-center">
                  <span className="text-xl text-white">🐕</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Mis Perros</p>
                  <p className="text-2xl font-bold text-[#2C3E50]">{dogs.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#C7EA46] rounded-full flex items-center justify-center">
                  <span className="text-xl text-[#2C3E50]">📝</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Evaluaciones</p>
                  <p className="text-2xl font-bold text-[#2C3E50]">{evaluations.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#FFFE8D] rounded-full flex items-center justify-center">
                  <span className="text-xl text-[#2C3E50]">📅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Esta Semana</p>
                  <p className="text-2xl font-bold text-[#2C3E50]">
                    {evaluations.filter(evaluation => 
                      new Date(evaluation.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Progreso */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-[#2C3E50] mb-6">
              📈 Progreso de tus Peluditos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dogs.map((dog) => {
                const stats = getDogStats(dog.id);
                
                return (
                  <div key={dog.id} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {dog.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-bold text-gray-900">{dog.name}</h3>
                        <p className="text-sm text-gray-600">{dog.breed}</p>
                        {stats.trend !== 'sin_datos' && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            stats.trend === 'mejorando' ? 'bg-green-100 text-green-700' :
                            stats.trend === 'empeorando' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {stats.trend === 'mejorando' ? '📈 Mejorando' :
                             stats.trend === 'empeorando' ? '📉 Necesita atención' :
                             '➡️ Estable'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ✅ CONDICIÓN CORREGIDA: Siempre muestra el botón */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Obediencia</span>
                          <span className="font-bold text-[#56CCF2]">{stats.obedience_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#56CCF2] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${stats.obedience_percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Sociabilidad</span>
                          <span className="font-bold text-[#C7EA46]">{stats.sociability_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#C7EA46] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${stats.sociability_percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Energía</span>
                          <span className="font-bold text-[#FFFE8D]">{stats.energy_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#FFFE8D] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${stats.energy_percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 pt-2 border-t">
                        {stats.total_evaluations} evaluaciones • Última: {
                          dogAverages[dog.id]?.last_evaluation_date ? 
                          new Date(dogAverages[dog.id].last_evaluation_date).toLocaleDateString('es-CO') :
                          'Sin datos'
                        }
                      </div>

                      {/* 📊 BOTÓN SIEMPRE VISIBLE */}
                      <button 
                        onClick={() => openProgressModal(dog)}
                        className="w-full text-[#56CCF2] hover:text-white text-sm font-medium py-2 border border-[#56CCF2] rounded-lg hover:bg-[#56CCF2] transition-colors"
                      >
                        📈 Ver Progreso Completo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-[#2C3E50] mb-4">
              🚀 Acciones Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => {
                  if (dogs.length === 1) {
                    setSelectedDog(dogs[0]);
                    setShowEvaluationForm(true);
                  } else {
                    alert('Selecciona un perro específico arriba para evaluarlo');
                  }
                }}
                className="bg-[#56CCF2] text-white p-4 rounded-lg hover:bg-[#5B9BD5] transition-colors text-left"
              >
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-semibold">Evaluar Ahora</div>
                <div className="text-sm opacity-90">Evalúa comportamiento en casa</div>
              </button>

              <button 
                onClick={() => {
                  if (dogs.length === 1) {
                    openProgressModal(dogs[0]);
                  } else {
                    alert('Selecciona un perro específico arriba para ver su progreso');
                  }
                }}
                className="bg-[#C7EA46] text-[#2C3E50] p-4 rounded-lg hover:bg-[#FFFE8D] transition-colors text-left"
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="font-semibold">Ver Progreso</div>
                <div className="text-sm opacity-90">Evolución de tus perros</div>
              </button>

              <a 
                href="https://wa.me/573144329824?text=Hola%20Juan%20Pablo%2C%20tengo%20una%20consulta%20sobre%20mi%20perro"
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left block"
              >
                <div className="text-2xl mb-2">💬</div>
                <div className="font-semibold">Contactar</div>
                <div className="text-sm opacity-90">WhatsApp Juan Pablo</div>
              </a>
            </div>
          </div>
        </>
      )}

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

      {/* 📊 MODAL DE PROGRESO COMPLETO - BIEN UBICADO */}
      {showProgressModal && selectedDogForProgress && (
        <div>
          {/* Debug visual */}
          <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'black',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 9999
          }}>
            DEBUG: Modal abierto para {selectedDogForProgress?.name}
          </div>
          
          <DogProgressModal
            dog={selectedDogForProgress}
            isOpen={showProgressModal}
            onClose={closeProgressModal}
          />
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;