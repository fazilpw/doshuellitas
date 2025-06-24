// src/components/dashboard/TeacherDashboard.jsx - ERRORES DE 'eval' CORREGIDOS
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
      // Buscar en tabla 'profiles' en lugar de 'users'
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'profesor@clubcanino.com')
        .eq('role', 'profesor')
        .single();

      if (userError) {
        console.error('❌ Error finding teacher:', userError);
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
      console.error('❌ Error initializing teacher dashboard:', error);
      setLoading(false);
    }
  };

  const fetchAllDogs = async () => {
    try {
      // Usar 'profiles' en lugar de 'users'
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          profiles!dogs_owner_id_fkey(full_name, email, phone)
        `)
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('❌ Error fetching dogs:', error);
        throw error;
      }

      console.log('✅ Perros cargados:', data);
      setDogs(data || []);
      
    } catch (error) {
      console.error('❌ Error fetching dogs:', error);
      setDogs([]);
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
          dogs(name, id),
          profiles!evaluations_evaluator_id_fkey(full_name, email)
        `)
        .eq('date', today)
        .eq('location', 'colegio')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching today evaluations:', error);
        throw error;
      }

      console.log('✅ Evaluaciones de hoy:', data);
      setEvaluations(data || []);
      
    } catch (error) {
      console.error('❌ Error fetching evaluations:', error);
      setEvaluations([]);
    }
  };

  const handleEvaluationSaved = async (newEvaluation) => {
    console.log('✅ Nueva evaluación guardada:', newEvaluation);
    
    // Recargar evaluaciones de hoy
    await fetchTodayEvaluations();
    
    // Mostrar mensaje de éxito
    alert('✅ Evaluación guardada exitosamente');
  };

  const getQuickStats = () => {
    const totalDogs = dogs.length;
    const evaluatedToday = evaluations.length;
    const pendingToday = totalDogs - evaluatedToday;
    
    return { totalDogs, evaluatedToday, pendingToday };
  };

  // 🔧 CORREGIDO: eval → evaluation
  const isDogEvaluatedToday = (dogId) => {
    return evaluations.some(evaluation => evaluation.dog_id === dogId);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
            Cargando Dashboard del Profesor
          </h2>
          <p className="text-gray-600">
            Obteniendo datos de los peluditos...
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
            Usuario profesor no encontrado
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
          Panel del Profesor {currentUser.full_name || 'Carlos'} 👨‍🏫
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona las evaluaciones y el progreso de los peluditos
        </p>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#56CCF2] rounded-full flex items-center justify-center">
              <span className="text-xl text-white">🐕</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Perros Total</p>
              <p className="text-2xl font-bold text-[#2C3E50]">{totalDogs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#C7EA46] rounded-full flex items-center justify-center">
              <span className="text-xl text-[#2C3E50]">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Evaluadas Hoy</p>
              <p className="text-2xl font-bold text-[#2C3E50]">{evaluatedToday}</p>
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
              <p className="text-2xl font-bold text-[#2C3E50]">{pendingToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de vistas */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setView('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'today'
                ? 'bg-[#56CCF2] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📅 Hoy ({pendingToday} pendientes)
          </button>
          <button
            onClick={() => setView('evaluations')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'evaluations'
                ? 'bg-[#56CCF2] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Historial
          </button>
        </div>

        {/* Vista de evaluaciones de hoy */}
        {view === 'today' && (
          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-6">
              Perros para evaluar hoy 📝
            </h2>
            
            {dogs.length === 0 ? (
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dogs.map((dog) => {
                  const hasEvaluationToday = isDogEvaluatedToday(dog.id);
                  
                  return (
                    <div key={dog.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {dog.name.charAt(0)}
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="font-bold text-gray-900">{dog.name}</h3>
                          <p className="text-sm text-gray-600">
                            {dog.breed} • {dog.size}
                          </p>
                          {dog.profiles && (
                            <p className="text-xs text-gray-500">
                              Dueño: {dog.profiles.full_name || dog.profiles.email}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className={`
                          inline-block px-2 py-1 rounded-full text-xs font-medium
                          ${hasEvaluationToday 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                          }
                        `}>
                          {hasEvaluationToday ? '✅ Evaluado hoy' : '⏳ Pendiente'}
                        </span>
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
            )}
          </div>
        )}

        {/* Vista de historial */}
        {view === 'evaluations' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#2C3E50] mb-6">
              Historial de Evaluaciones
            </h2>
            
            {evaluations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p>No hay evaluaciones registradas hoy</p>
                <p className="text-sm mt-2">Las evaluaciones aparecerán aquí una vez que comiences a evaluar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {evaluation.dogs?.name || 'Perro desconocido'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Evaluado por: {evaluation.profiles?.full_name || evaluation.profiles?.email || 'Evaluador desconocido'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(evaluation.created_at).toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm space-y-1">
                          <div>Energía: {evaluation.energy_level}/10</div>
                          <div>Sociabilidad: {evaluation.sociability_level}/10</div>
                          <div>Obediencia: {evaluation.obedience_level}/10</div>
                        </div>
                      </div>
                    </div>
                    {evaluation.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                        <strong>Notas:</strong> {evaluation.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-[#2C3E50] mb-4">
          🚀 Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setView('today')}
            className="bg-[#56CCF2] text-white p-4 rounded-lg hover:bg-[#5B9BD5] transition-colors text-left"
          >
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-semibold">Evaluar Ahora</div>
            <div className="text-sm opacity-90">Ver perros pendientes</div>
          </button>

          <a 
            href="/reportes"
            className="bg-[#C7EA46] text-[#2C3E50] p-4 rounded-lg hover:bg-[#FFFE8D] transition-colors text-left block"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-semibold">Reportes</div>
            <div className="text-sm opacity-90">Ver estadísticas</div>
          </a>

          <a 
            href="https://wa.me/573144329824?text=Hola%20Juan%20Pablo%2C%20necesito%20ayuda%20con%20el%20sistema%20de%20evaluaciones"
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left block"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="font-semibold">Contactar Admin</div>
            <div className="text-sm opacity-90">WhatsApp Juan Pablo</div>
          </a>
        </div>
      </div>

      {/* Modal de evaluación */}
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