// src/components/Commands.jsx
// Componente de comandos siguiendo la arquitectura del proyecto
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function Commands() {
  // Estados principales
  const [supabase, setSupabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [commands, setCommands] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar Supabase (solo una vez)
  useEffect(() => {
    // Verificar si ya existe una instancia global
    if (window.clubCaninoSupabase) {
      setSupabase(window.clubCaninoSupabase);
      loadData(window.clubCaninoSupabase);
      setLoading(false);
      return;
    }

    const initSupabase = async () => {
      try {
        const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
        const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Variables de entorno de Supabase no configuradas');
        }

        const client = createClient(supabaseUrl, supabaseKey);
        setSupabase(client);
        
        // Guardar instancia global para evitar duplicados
        window.clubCaninoSupabase = client;
        
        // Cargar datos
        await loadData(client);
        
      } catch (err) {
        console.error('Error inicializando Supabase:', err);
        setError(err.message);
        loadFallbackData(); // TODO: Implementar después
      } finally {
        setLoading(false);
      }
    };

    initSupabase();
  }, []);

  // Cargar categorías y comandos
  const loadData = async (client) => {
    try {
      // Cargar categorías
      console.log('🔄 Iniciando carga de categorías...');
      const { data: categoriesData, error: categoriesError } = await client
        .from('command_categories')
        .select('*')
        .eq('active', true)
        .order('order_priority');

      console.log('📊 Categories Error:', categoriesError);
      console.log('📊 Categories Data:', categoriesData);

      if (categoriesError) {
        console.error('❌ Error categorías:', categoriesError);
        throw categoriesError;
      }

      // Cargar comandos (sin JOIN por ahora)
      console.log('🔄 Iniciando carga de comandos...');
      const { data: commandsData, error: commandsError } = await client
        .from('commands')
        .select('*')
        .eq('active', true)
        .order('difficulty_level, order_in_category');

      console.log('📋 Commands Error:', commandsError);
      console.log('📋 Commands Data:', commandsData);

      if (commandsError) {
        console.error('❌ Error comandos:', commandsError);
        throw commandsError;
      }

      setCategories(categoriesData || []);
      setCommands(commandsData || []);
      
      // Debug temporal
      console.log('Categorías cargadas:', categoriesData?.length || 0);
      console.log('Comandos cargados:', commandsData?.length || 0);
      
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err.message);
      loadFallbackData(); // TODO: Implementar después
    }
  };

  // TODO: Implementar datos de fallback después
  const loadFallbackData = () => {
    console.log('🔄 Modo offline - datos de fallback próximamente');
    setCategories([]);
    setCommands([]);
  };

  // Filtrar comandos por categoría
  const getFilteredCommands = () => {
    if (activeCategory === 'all') return commands;
    return commands.filter(cmd => cmd.category_id === activeCategory);
  };

  // Abrir modal de comando
  const openCommandModal = (command) => {
    setSelectedCommand(command);
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedCommand(null);
  };

  // Renderizar stars de dificultad
  const renderDifficultyStars = (level) => {
    return '⭐'.repeat(level);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🐕</div>
          <div className="text-xl font-bold text-gray-900 mb-2">Cargando comandos...</div>
          <div className="text-gray-600">Conectando con la base de datos</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && commands.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl font-bold text-red-900 mb-2">Error de conexión</div>
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              📚 Comandos y Entrenamiento
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Guías completas, videos demostrativos y seguimiento personalizado para entrenar a tu perro exitosamente
            </p>
            <div className="mt-6 text-sm opacity-80">
              <p>🎯 Comandos profesionales en <strong>inglés</strong> con explicaciones en español</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de categorías */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-4 space-x-6">
            {/* Botón "Todos" */}
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-[#56CCF2] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">📚</span>
              <span className="font-medium">Todos</span>
            </button>

            {/* Botones de categorías */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-[#56CCF2] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Login prompt para usuarios no autenticados */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">¡Haz seguimiento de tu progreso!</h3>
            <p className="text-blue-700 mb-4">
              Próximamente: Inicia sesión para ver el progreso personalizado de tu perro en cada comando
            </p>
            <button className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors">
              Funcionalidad próximamente
            </button>
          </div>
        </div>

        {/* Grid de comandos */}
        {commands.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay comandos disponibles</h3>
            <p className="text-gray-600">Verifica tu conexión a la base de datos.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Agrupar comandos por categoría */}
            {categories.map((category) => {
              const categoryCommands = getFilteredCommands().filter(
                cmd => cmd.category_id === category.id
              );

              if (categoryCommands.length === 0 && activeCategory !== 'all') return null;
              if (activeCategory !== 'all' && activeCategory !== category.id) return null;

              return (
                <div key={category.id} className="mb-12">
                  <div className="flex items-center mb-6">
                    <span className="text-3xl mr-3">{category.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                      <p className="text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryCommands.map((command) => (
                      <div
                        key={command.id}
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => openCommandModal(command)}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{command.name}</h3>
                                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {command.command_word}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                <span>Dificultad: {renderDifficultyStars(command.difficulty_level)}</span>
                                <span>•</span>
                                <span>{command.duration_minutes} min</span>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-4 line-clamp-2">{command.description}</p>
                          
                          <div className="flex flex-wrap gap-1 mb-4">
                            {(command.helps_with || []).slice(0, 3).map((help, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {help.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex space-x-2">
                            <button className="flex-1 bg-[#56CCF2] text-white py-2 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors text-sm">
                              Ver Guía Completa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer con consejos generales */}
        <div className="mt-12 bg-gradient-to-r from-[#C7EA46] to-[#FFFE8D] rounded-xl p-8">
          <h3 className="text-2xl font-bold text-[#2C3E50] mb-4 text-center">
            💡 Consejos Generales para el Entrenamiento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-70 rounded-lg p-4">
              <div className="text-2xl mb-2">⏰</div>
              <h4 className="font-bold text-[#2C3E50] mb-2">Sesiones Cortas</h4>
              <p className="text-sm text-gray-700">5-10 minutos por sesión. Los perros aprenden mejor con práctica frecuente y breve.</p>
            </div>
            <div className="bg-white bg-opacity-70 rounded-lg p-4">
              <div className="text-2xl mb-2">🎁</div>
              <h4 className="font-bold text-[#2C3E50] mb-2">Refuerzo Positivo</h4>
              <p className="text-sm text-gray-700">Siempre premia el comportamiento correcto. Nunca uses castigos físicos.</p>
            </div>
            <div className="bg-white bg-opacity-70 rounded-lg p-4">
              <div className="text-2xl mb-2">🔄</div>
              <h4 className="font-bold text-[#2C3E50] mb-2">Consistencia</h4>
              <p className="text-sm text-gray-700">Toda la familia debe usar las mismas palabras y señales para cada comando.</p>
            </div>
          </div>
        </div>

        {/* Recomendaciones Clave */}
        <div className="bg-white py-8 border-t border-gray-200 mt-8 rounded-xl">
          <div className="max-w-4xl mx-auto px-4">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">📋 Recomendaciones Clave del Club Canino</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Solo dar órdenes cuando el perro preste atención</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Felicitar con muchas ganas cuando obedezcan</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Comprender el nivel de obediencia de cada perro</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Recordar que algunos perros son más rápidos que otros</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>No dar órdenes en momentos de agresión, distracción o estrés</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>No premiar errores o comportamientos incorrectos</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Solo utilizar regaño cuando sea estrictamente necesario</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-bold">💡</span>
                  <span><strong>Frases de felicitación:</strong> "Muy bien", "Super", "Ese es mi chico", "Vamos campeón"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de comando (próximamente) */}
      {showModal && selectedCommand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCommand.name}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      Comando: "{selectedCommand.command_word}"
                    </span>
                    <span>Dificultad: {renderDifficultyStars(selectedCommand.difficulty_level)}</span>
                    <span>⏰ {selectedCommand.duration_minutes} min</span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="prose max-w-none">
                <p className="text-lg text-gray-700 mb-6">{selectedCommand.description}</p>
                
                {selectedCommand.instructions && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">📋 Instrucciones paso a paso:</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {selectedCommand.instructions.split('\n').map((step, index) => (
                        step.trim() && (
                          <p key={index} className="mb-2">
                            <strong>Paso {index + 1}:</strong> {step.trim()}
                          </p>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {selectedCommand.common_mistakes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3 text-red-800">⚠️ Errores comunes:</h3>
                    <div className="bg-red-50 rounded-lg p-4">
                      {selectedCommand.common_mistakes.split('\n').map((mistake, index) => (
                        mistake.trim() && (
                          <p key={index} className="mb-2 text-red-700">{mistake.trim()}</p>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {selectedCommand.tips && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3 text-yellow-800">💡 Consejos adicionales:</h3>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      {selectedCommand.tips.split('\n').map((tip, index) => (
                        tip.trim() && (
                          <p key={index} className="mb-2 text-yellow-700">{tip.trim()}</p>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}