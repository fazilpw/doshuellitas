// src/components/dashboard/DogProgressModal.jsx - 100% MOBILE RESPONSIVE ✅
import { useState, useEffect } from 'react';
import supabase, { getDogEvaluations, getDogAverages } from '../../lib/supabase.js';

const DogProgressModal = ({ dog, onClose, isOpen }) => {
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState([]);
  const [averages, setAverages] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFrame, setTimeFrame] = useState('all'); // 'week', 'month', 'all'

  useEffect(() => {
    if (isOpen && dog) {
      fetchDogProgressData();
    }
  }, [isOpen, dog, timeFrame]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const fetchDogProgressData = async () => {
    setLoading(true);
    try {
      // Obtener evaluaciones y promedios
      const [evaluationsResult, averagesResult] = await Promise.all([
        getDogEvaluations(dog.id, 100), // Último 100 evaluaciones
        getDogAverages(dog.id)
      ]);

      if (evaluationsResult.data) {
        setEvaluations(evaluationsResult.data);
      }

      if (averagesResult.data) {
        setAverages(averagesResult.data);
      }

    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar evaluaciones por período de tiempo
  const getFilteredEvaluations = () => {
    const now = new Date();
    let cutoffDate;

    switch (timeFrame) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return evaluations;
    }

    return evaluations.filter(evaluation => new Date(evaluation.date) >= cutoffDate);
  };

  // Calcular estadísticas por ubicación
  const getLocationStats = () => {
    const filtered = getFilteredEvaluations();
    const casa = filtered.filter(evaluation => evaluation.location === 'casa');
    const colegio = filtered.filter(evaluation => evaluation.location === 'colegio');

    const calcAvg = (items, field) => {
      if (items.length === 0) return 0;
      return Math.round(items.reduce((sum, item) => sum + (item[field] || 0), 0) / items.length);
    };

    return {
      casa: {
        count: casa.length,
        energy: calcAvg(casa, 'energy_level'),
        sociability: calcAvg(casa, 'sociability_level'),
        obedience: calcAvg(casa, 'obedience_level'),
        anxiety: calcAvg(casa, 'anxiety_level')
      },
      colegio: {
        count: colegio.length,
        energy: calcAvg(colegio, 'energy_level'),
        sociability: calcAvg(colegio, 'sociability_level'),
        obedience: calcAvg(colegio, 'obedience_level'),
        anxiety: calcAvg(colegio, 'anxiety_level')
      }
    };
  };

  // Preparar datos para gráficos simples
  const getChartData = () => {
    const filtered = getFilteredEvaluations();
    return filtered
      .slice(-10) // Últimas 10 evaluaciones
      .map(evaluation => ({
        date: new Date(evaluation.date).toLocaleDateString('es-CO', { 
          month: 'short', 
          day: 'numeric' 
        }),
        obedience: evaluation.obedience_level || 0,
        energy: evaluation.energy_level || 0,
        sociability: evaluation.sociability_level || 0,
        anxiety: evaluation.anxiety_level || 0,
        location: evaluation.location
      }));
  };

  // ❌ NO RENDERIZAR SI NO ESTÁ ABIERTO
  if (!isOpen) return null;

  const locationStats = getLocationStats();
  const chartData = getChartData();

  const tabs = [
    { id: 'overview', label: 'Resumen', shortLabel: '📊', icon: '📊' },
    { id: 'charts', label: 'Evolución', shortLabel: '📈', icon: '📈' },
    { id: 'comparison', label: 'Casa vs Colegio', shortLabel: '⚖️', icon: '⚖️' },
    { id: 'recommendations', label: 'Recomendaciones', shortLabel: '💡', icon: '💡' }
  ];

  return (
    // ✅ ESTRUCTURA DE OVERLAY COMPLETA - RESPONSIVE
    <div 
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black bg-opacity-50 p-0 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        // Cerrar si hace click en el backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white w-full h-full sm:h-auto sm:rounded-xl sm:max-w-6xl sm:max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevenir cierre al hacer click dentro
      >
        
        {/* Header del Modal - RESPONSIVE */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white p-4 sm:p-6 sm:rounded-t-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold truncate">
                📊 Progreso de {dog.name}
              </h2>
              <p className="opacity-90 mt-1 text-sm sm:text-base">
                {dog.breed} • {dog.size} • {dog.age} años
              </p>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Selector de período - RESPONSIVE */}
              <select 
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-white text-xs sm:text-sm min-w-0"
              >
                <option value="all" className="text-gray-900">Todos</option>
                <option value="month" className="text-gray-900">Mes</option>
                <option value="week" className="text-gray-900">Semana</option>
              </select>
              
              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
                title="Cerrar modal"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
          </div>

          {/* Tabs - RESPONSIVE CON SCROLL HORIZONTAL */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-1 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium border whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-white text-white bg-white/20'
                      : 'border-transparent text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido del Modal - RESPONSIVE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm sm:text-base">Cargando analíticas de {dog.name}...</p>
              </div>
            </div>
          ) : (
            <>
              {/* TAB: Resumen - RESPONSIVE */}
              {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Métricas principales - RESPONSIVE GRID */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {averages && [
                      { 
                        label: 'Obediencia', 
                        value: averages.obedience_percentage, 
                        color: 'bg-[#56CCF2]',
                        icon: '🎯'
                      },
                      { 
                        label: 'Sociabilidad', 
                        value: averages.sociability_percentage, 
                        color: 'bg-[#C7EA46]',
                        icon: '🤝'
                      },
                      { 
                        label: 'Energía', 
                        value: averages.energy_percentage, 
                        color: 'bg-[#FFFE8D]',
                        icon: '⚡'
                      },
                      { 
                        label: 'Calma', 
                        value: 100 - averages.anxiety_percentage, 
                        color: 'bg-[#ACF0F4]',
                        icon: '😌'
                      }
                    ].map(metric => (
                      <div key={metric.label} className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <span className="text-lg sm:text-2xl">{metric.icon}</span>
                          <span className="text-xl sm:text-3xl font-bold text-gray-900">{metric.value}%</span>
                        </div>
                        <div className="space-y-2">
                          <div className="font-medium text-gray-900 text-sm sm:text-base">{metric.label}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${metric.color}`}
                              style={{ width: `${metric.value}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Estadísticas generales - RESPONSIVE */}
                  {averages && (
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">📈 Estadísticas Generales</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl font-bold text-[#56CCF2] mb-1">
                            {averages.total_evaluations}
                          </div>
                          <div className="text-gray-600 text-xs sm:text-sm">Evaluaciones totales</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl font-bold text-[#C7EA46] mb-1">
                            {averages.avg_score ? Math.round(averages.avg_score * 10) : 0}%
                          </div>
                          <div className="text-gray-600 text-xs sm:text-sm">Puntuación promedio</div>
                        </div>
                        <div className="text-center col-span-2 lg:col-span-1">
                          <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                            {averages.last_evaluation_date ? 
                              new Date(averages.last_evaluation_date).toLocaleDateString('es-CO', {
                                month: 'short',
                                day: 'numeric'
                              }) : 
                              'N/A'
                            }
                          </div>
                          <div className="text-gray-600 text-xs sm:text-sm">Última evaluación</div>
                        </div>
                        <div className="text-center col-span-2 lg:col-span-1">
                          <div className="text-2xl sm:text-3xl mb-1">
                            {averages.trend === 'mejorando' ? '📈' :
                             averages.trend === 'empeorando' ? '📉' : '➡️'}
                          </div>
                          <div className="text-gray-600 text-xs sm:text-sm">Tendencia</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Evolución - RESPONSIVE */}
              {activeTab === 'charts' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                      📈 Evolución de Métricas
                    </h3>
                    
                    {chartData.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">📊</div>
                        <p className="text-sm sm:text-base">No hay suficientes datos para mostrar gráficos</p>
                      </div>
                    ) : (
                      <div className="space-y-4 sm:space-y-6">
                        {/* Línea de tiempo visual - RESPONSIVE */}
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Últimas Evaluaciones</h4>
                          <div className="space-y-3">
                            {chartData.map((item, index) => (
                              <div key={index} className="space-y-3">
                                {/* Header de cada evaluación */}
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 sm:w-16 text-xs sm:text-sm text-gray-600 flex-shrink-0">{item.date}</div>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    item.location === 'casa' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {item.location === 'casa' ? '🏠' : '🏫'}
                                  </span>
                                </div>
                                
                                {/* Métricas - RESPONSIVE GRID */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Obediencia</div>
                                    <div className="h-2 sm:h-3 bg-gray-200 rounded">
                                      <div 
                                        className="h-2 sm:h-3 bg-[#56CCF2] rounded transition-all"
                                        style={{ width: `${(item.obedience / 10) * 100}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-center mt-1">{item.obedience}/10</div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Energía</div>
                                    <div className="h-2 sm:h-3 bg-gray-200 rounded">
                                      <div 
                                        className="h-2 sm:h-3 bg-[#FFFE8D] rounded transition-all"
                                        style={{ width: `${(item.energy / 10) * 100}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-center mt-1">{item.energy}/10</div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Social</div>
                                    <div className="h-2 sm:h-3 bg-gray-200 rounded">
                                      <div 
                                        className="h-2 sm:h-3 bg-[#C7EA46] rounded transition-all"
                                        style={{ width: `${(item.sociability / 10) * 100}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-center mt-1">{item.sociability}/10</div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Ansiedad</div>
                                    <div className="h-2 sm:h-3 bg-gray-200 rounded">
                                      <div 
                                        className="h-2 sm:h-3 bg-red-300 rounded transition-all"
                                        style={{ width: `${(item.anxiety / 10) * 100}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-center mt-1">{item.anxiety}/10</div>
                                  </div>
                                </div>

                                {/* Separador */}
                                {index < chartData.length - 1 && (
                                  <div className="border-b border-gray-200"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: Comparación Casa vs Colegio - RESPONSIVE */}
              {activeTab === 'comparison' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    {/* Casa */}
                    <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                      <div className="flex items-center mb-4">
                        <span className="text-2xl sm:text-3xl mr-3">🏠</span>
                        <div>
                          <h4 className="font-bold text-blue-900 text-base sm:text-lg">En Casa</h4>
                          <p className="text-blue-700 text-xs sm:text-sm">{locationStats.casa.count} evaluaciones</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700 text-sm">Obediencia:</span>
                          <span className="font-bold text-blue-900">{locationStats.casa.obedience}/10</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700 text-sm">Sociabilidad:</span>
                          <span className="font-bold text-blue-900">{locationStats.casa.sociability}/10</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700 text-sm">Energía:</span>
                          <span className="font-bold text-blue-900">{locationStats.casa.energy}/10</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700 text-sm">Ansiedad:</span>
                          <span className="font-bold text-blue-900">{locationStats.casa.anxiety}/10</span>
                        </div>
                      </div>
                    </div>

                    {/* Colegio */}
                    <div className="bg-green-50 rounded-lg p-4 sm:p-6">
                      <div className="flex items-center mb-4">
                        <span className="text-2xl sm:text-3xl mr-3">🏫</span>
                        <div>
                          <h4 className="font-bold text-green-900 text-base sm:text-lg">En el Colegio</h4>
                          <p className="text-green-700 text-xs sm:text-sm">{locationStats.colegio.count} evaluaciones</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 text-sm">Obediencia:</span>
                          <span className="font-bold text-green-900">{locationStats.colegio.obedience}/10</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 text-sm">Sociabilidad:</span>
                          <span className="font-bold text-green-900">{locationStats.colegio.sociability}/10</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 text-sm">Energía:</span>
                          <span className="font-bold text-green-900">{locationStats.colegio.energy}/10</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 text-sm">Ansiedad:</span>
                          <span className="font-bold text-green-900">{locationStats.colegio.anxiety}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Análisis de diferencias - RESPONSIVE */}
                  <div className="bg-yellow-50 rounded-lg p-4 sm:p-6">
                    <h4 className="font-bold text-yellow-900 mb-3 text-sm sm:text-base">🔍 Análisis Comparativo</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      {locationStats.casa.obedience !== locationStats.colegio.obedience && (
                        <p className="text-yellow-800">
                          <strong>Obediencia:</strong> {locationStats.casa.obedience > locationStats.colegio.obedience ? 
                            `Mejor en casa (+${locationStats.casa.obedience - locationStats.colegio.obedience})` :
                            `Mejor en colegio (+${locationStats.colegio.obedience - locationStats.casa.obedience})`
                          }
                        </p>
                      )}
                      {locationStats.casa.anxiety !== locationStats.colegio.anxiety && (
                        <p className="text-yellow-800">
                          <strong>Ansiedad:</strong> {locationStats.casa.anxiety > locationStats.colegio.anxiety ? 
                            'Más ansioso en casa' : 'Más ansioso en colegio'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Recomendaciones - RESPONSIVE */}
              {activeTab === 'recommendations' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                      💡 Recomendaciones Personalizadas
                    </h3>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {averages?.energy_percentage < 60 && (
                        <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
                          <div className="font-medium text-orange-900 text-sm sm:text-base">Aumentar Actividad</div>
                          <div className="text-xs sm:text-sm text-orange-700 mt-1">
                            {dog.name} muestra niveles bajos de energía. Aumenta el tiempo de ejercicio y juegos activos.
                          </div>
                        </div>
                      )}
                      
                      {averages?.anxiety_percentage > 60 && (
                        <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                          <div className="font-medium text-purple-900 text-sm sm:text-base">Reducir Ansiedad</div>
                          <div className="text-xs sm:text-sm text-purple-700 mt-1">
                            Crea rutinas calmantes. Considera música relajante y espacios tranquilos.
                          </div>
                        </div>
                      )}
                      
                      {averages?.sociability_percentage < 60 && (
                        <div className="bg-pink-50 rounded-lg p-3 sm:p-4">
                          <div className="font-medium text-pink-900 text-sm sm:text-base">Socialización</div>
                          <div className="text-xs sm:text-sm text-pink-700 mt-1">
                            Exponlo gradualmente a otros perros y personas en entornos controlados.
                          </div>
                        </div>
                      )}

                      {averages?.obedience_percentage > 80 && (
                        <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                          <div className="font-medium text-green-900 text-sm sm:text-base">¡Excelente Progreso!</div>
                          <div className="text-xs sm:text-sm text-green-700 mt-1">
                            {dog.name} muestra excelente obediencia. Mantén la consistencia en el entrenamiento.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer del Modal - RESPONSIVE */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 sm:rounded-b-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              Datos basados en {evaluations.length} evaluaciones
            </div>
            <div className="flex space-x-3 w-full sm:w-auto">
              <button
                onClick={() => window.print()}
                className="flex-1 sm:flex-none bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                🖨️ <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none bg-[#56CCF2] text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DogProgressModal;