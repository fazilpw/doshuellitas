// src/components/dashboard/ParentDashboard.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import CompleteEvaluationForm from './CompleteEvaluationForm.jsx';
import EvaluationDisplay from './EvaluationDisplay.jsx';

const ParentDashboard = () => {
  const [dogs, setDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      // Buscar usuario padre (María García) - ID fijo para la demo
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', '11111111-1111-1111-1111-111111111111') // ID específico de María
        .eq('role', 'padre')
        .single();

      if (userError) {
        console.error('Error finding user:', userError);
        // Si no encontramos el usuario, mostrar mensaje para crear datos
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      console.log('✅ Usuario encontrado:', user);

      // Buscar perros del usuario CON FILTRO ESTRICTO
      await fetchUserDogs(user.id);
      
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      setLoading(false);
    }
  };

  const fetchUserDogs = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', userId)
        .eq('active', true);
      
      if (error) throw error;
      
      console.log('✅ Perros encontrados:', data);
      setDogs(data || []);
      
      if (data && data.length > 0) {
        setSelectedDog(data[0]);
        fetchEvaluations(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching dogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluations = async (dogId) => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('dog_id', dogId)
        .order('date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      console.log('✅ Evaluaciones encontradas:', data);
      setEvaluations(data || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    }
  };

  const handleDogSelect = (dog) => {
    setSelectedDog(dog);
    fetchEvaluations(dog.id);
  };

  const handleEvaluationSaved = () => {
    setShowEvaluationForm(false);
    if (selectedDog) {
      fetchEvaluations(selectedDog.id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56CCF2]"></div>
        <span className="ml-3 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  // Si no hay usuario, mostrar mensaje para crear datos
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
            Datos de prueba no encontrados
          </h2>
          <p className="text-gray-600 mb-6">
            Necesitas crear los datos de prueba para usar el dashboard
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C3E50]">
          Panel de {currentUser.name} 🐾
        </h1>
        <p className="text-gray-600 mt-2">
          Seguimiento del progreso de tus peluditos
        </p>
      </div>

      {/* Selector de Perros */}
      {dogs.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona tu peludito:
          </label>
          <div className="flex space-x-4">
            {dogs.map((dog) => (
              <button
                key={dog.id}
                onClick={() => handleDogSelect(dog)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedDog?.id === dog.id
                    ? 'bg-[#56CCF2] text-white'
                    : 'bg-white text-[#2C3E50] border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {dog.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDog ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Perro */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-[#ACF0F4] rounded-full flex items-center justify-center">
                <span className="text-2xl">🐕</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-[#2C3E50]">{selectedDog.name}</h2>
                <p className="text-gray-600">{selectedDog.breed}</p>
                <p className="text-sm text-gray-500">
                  {selectedDog.age} años • {selectedDog.size}
                </p>
              </div>
            </div>
            
            {selectedDog.notes && (
              <div className="bg-[#FFFBF0] p-3 rounded-lg">
                <p className="text-sm text-gray-700">{selectedDog.notes}</p>
              </div>
            )}
          </div>

          {/* Métricas Recientes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4">
              Últimas Métricas
            </h3>
            
            {evaluations.length > 0 ? (
              <div className="space-y-4">
                {evaluations.slice(0, 1).map((evaluationItem) => (
                  <div key={evaluationItem.id}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Energía</p>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#56CCF2] h-2 rounded-full" 
                              style={{ width: `${(evaluationItem.energy_level || 0) * 10}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm font-medium">
                            {evaluationItem.energy_level || 0}/10
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Socialización</p>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#C7EA46] h-2 rounded-full" 
                              style={{ width: `${(evaluationItem.sociability_level || 0) * 10}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm font-medium">
                            {evaluationItem.sociability_level || 0}/10
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Obediencia</p>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#5B9BD5] h-2 rounded-full" 
                              style={{ width: `${(evaluationItem.obedience_level || 0) * 10}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm font-medium">
                            {evaluationItem.obedience_level || 0}/10
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Ansiedad</p>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#AB5729] h-2 rounded-full" 
                              style={{ width: `${(evaluationItem.anxiety_level || 0) * 10}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm font-medium">
                            {evaluationItem.anxiety_level || 0}/10
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-[#FFFBF0] rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">
                        {evaluationItem.location === 'casa' ? '🏠 En casa' : '🏫 En el colegio'} • 
                        {new Date(evaluationItem.date).toLocaleDateString()}
                      </p>
                      {evaluationItem.highlights && (
                        <p className="text-sm text-green-700 font-medium mb-1">
                          ⭐ {evaluationItem.highlights}
                        </p>
                      )}
                      {evaluationItem.notes && (
                        <p className="text-sm text-gray-700">{evaluationItem.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Aún no hay evaluaciones registradas
              </p>
            )}
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4">
              Acciones Rápidas
            </h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowEvaluationForm(true)}
                className="w-full bg-[#56CCF2] text-white py-3 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors font-medium text-lg"
              >
                📝 Evaluar a {selectedDog.name}
              </button>
              
              <button className="w-full bg-[#C7EA46] text-[#2C3E50] py-2 px-4 rounded-lg hover:bg-[#FFFE8D] transition-colors">
                📊 Ver Historial Completo
              </button>
              
              <button className="w-full bg-white border border-[#56CCF2] text-[#56CCF2] py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                📸 Fotos del Día
              </button>
              
              <a 
                href="https://wa.me/573144329824" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-center block"
              >
                💬 Contactar Colegio
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐕</div>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
            No tienes perros registrados
          </h2>
          <p className="text-gray-600 mb-6">
            Los datos de prueba incluyen a Max, Luna y Rocky
          </p>
          <a 
            href="/crear-datos-prueba" 
            className="inline-flex items-center px-6 py-3 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            ✨ Crear Datos de Prueba
          </a>
        </div>
      )}

      {/* Mostrar todas las evaluaciones */}
      {selectedDog && evaluations.length > 0 && (
        <div className="mt-8">
          <EvaluationDisplay 
            evaluations={evaluations} 
            dogName={selectedDog.name} 
          />
        </div>
      )}
      
      {/* Modal de Evaluación */}
      {showEvaluationForm && selectedDog && currentUser && (
        <CompleteEvaluationForm
          dogId={selectedDog.id}
          userId={currentUser.id}
          userRole="padre"
          onClose={() => setShowEvaluationForm(false)}
          onSave={handleEvaluationSaved}
        />
      )}
    </div>
  );
};

export default ParentDashboard;