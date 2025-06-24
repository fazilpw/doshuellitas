// src/components/dashboard/DogProgressModal.jsx - CORREGIDO ✅
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

  const fetchDogProgressData = async () => {
    setLoading(true);
    try {
      console.log('📊 Cargando datos de progreso para:', dog.name);
      
      // Obtener evaluaciones y promedios
      const [evaluationsResult, averagesResult] = await Promise.all([
        getDogEvaluations(dog.id, 100), // Últimas 100 evaluaciones
        getDogAverages(dog.id)
      ]);

      console.log('📊 Evaluaciones resultado:', evaluationsResult);
      console.log('📊 Promedios resultado:', averagesResult);

      if (evaluationsResult.data) {
        setEvaluations(evaluationsResult.data);
        console.log('✅ Evaluaciones cargadas:', evaluationsResult.data.length);
      }

      if (averagesResult.data) {
        setAverages(averagesResult.data);
        console.log('✅ Promedios cargados:', averagesResult.data);
      }

    } catch (error) {
      console.error('❌ Error fetching progress data:', error);
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

  // Generar insights basados en datos
  const generateInsights = () => {
    if (!averages) return [];

    const insights = [];

    // Análisis de progreso
    if (averages.trend === 'mejorando') {
      insights.push({
        type: 'success',
        icon: '📈',
        text: `${dog.name} ha mostrado mejoras consistentes en las últimas evaluaciones`
      });
    } else if (averages.trend === 'empeorando') {
      insights.push({
        type: 'warning',
        icon: '📉',
        text: `${dog.name} necesita más atención. Considera aumentar el ejercicio y entrenamiento`
      });
    }

    // Análisis de actividad
    if (averages.total_evaluations > 10) {
      insights.push({
        type: 'info',
        icon: '🎯',
        text: `${dog.name} tiene ${averages.total_evaluations} evaluaciones registradas. ¡Excelente seguimiento!`
      });
    }

    // Recomendaciones específicas
    if (averages.energy_percentage > 80) {
      insights.push({
        type: 'info',
        icon: '⚡',
        text: `${dog.name} tiene mucha energía. Asegúrate de que haga suficiente ejercicio diario.`
      });
    }

    if (averages.anxiety_percentage > 60) {
      insights.push({
        type: 'warning',
        icon: '😰',
        text: `${dog.name} muestra signos de ansiedad. Considera técnicas de relajación y rutinas calmantes.`
      });
    }

    return insights;
  };

  // Crear datos para gráfico simple
  const getChartData = () => {
    const filtered = getFilteredEvaluations().slice(0, 10).reverse();
    return filtered.map(evaluation => ({
      date: new Date(evaluation.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }),
      obedience: evaluation.obedience_level,
      energy: evaluation.energy_level,
      sociability: evaluation.sociability_level,
      anxiety: evaluation.anxiety_level
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                📊 Progreso Completo de {dog.name}
              </h2>
              <p className="opacity-90">
                {dog.breed} • {dog.size} • {dog.age} años
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Selector de tiempo */}
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-white text-sm"
              >
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="all">Todo el tiempo</option>
              </select>
              
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Navegación de pestañas */}
          <div className="flex space-x-6 mt-4">
            {[
              { id: 'overview', label: '📊 Resumen' },
              { id: 'charts', label: '📈 Gráficos' },
              { id: 'history', label: '📋 Historial' },
              { id: 'insights', label: '💡 Insights' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-white/70 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando analíticas...</p>
              </div>
            </div>
          ) : (
            <>
              {/* TAB: Resumen */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Métricas principales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <div key={metric.label} className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                            {metric.icon}
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{metric.value}%</div>
                            <div className="text-gray-600">{metric.label}</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${metric.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${metric.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comparación Casa vs Colegio */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      🏠 Casa vs 🏫 Colegio
                    </h3>
                    
                    {(() => {
                      const locationStats = getLocationStats();
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Casa */}
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-3">
                              🏠 En Casa ({locationStats.casa.count} evaluaciones)
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Energía:</span>
                                <span className="font-semibold">{locationStats.casa.energy}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Sociabilidad:</span>
                                <span className="font-semibold">{locationStats.casa.sociability}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Obediencia:</span>
                                <span className="font-semibold">{locationStats.casa.obedience}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Ansiedad:</span>
                                <span className="font-semibold">{locationStats.casa.anxiety}/10</span>
                              </div>
                            </div>
                          </div>

                          {/* Colegio */}
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="font-semibold text-green-900 mb-3">
                              🏫 En el Colegio ({locationStats.colegio.count} evaluaciones)
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Energía:</span>
                                <span className="font-semibold">{locationStats.colegio.energy}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Sociabilidad:</span>
                                <span className="font-semibold">{locationStats.colegio.sociability}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Obediencia:</span>
                                <span className="font-semibold">{locationStats.colegio.obedience}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Ansiedad:</span>
                                <span className="font-semibold">{locationStats.colegio.anxiety}/10</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Tendencia */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      📈 Tendencia General
                    </h3>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-4xl mb-2">
                          {averages?.trend === 'mejorando' ? '📈' :
                           averages?.trend === 'empeorando' ? '📉' : '➡️'}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 capitalize">
                          {averages?.trend === 'mejorando' ? 'Mejorando' :
                           averages?.trend === 'empeorando' ? 'Regresando' : 'Estable'}
                        </div>
                        <div className="text-gray-600">Tendencia general</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Gráficos */}
              {activeTab === 'charts' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      📈 Evolución de Métricas
                    </h3>
                    
                    {(() => {
                      const chartData = getChartData();
                      if (chartData.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-4">📊</div>
                            <p>No hay suficientes datos para mostrar gráficos</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-6">
                          {/* Línea de tiempo visual */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-4">Últimas 10 Evaluaciones</h4>
                            <div className="space-y-3">
                              {chartData.map((item, index) => (
                                <div key={index} className="flex items-center space-x-4">
                                  <div className="w-16 text-sm text-gray-600">{item.date}</div>
                                  
                                  {/* Barras horizontales */}
                                  <div className="flex-1 grid grid-cols-4 gap-2">
                                    <div>
                                      <div className="text-xs text-gray-500 mb-1">Obediencia</div>
                                      <div className="h-3 bg-gray-200 rounded">
                                        <div 
                                          className="h-3 bg-[#56CCF2] rounded transition-all"
                                          style={{ width: `${(item.obedience / 10) * 100}%` }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-center mt-1">{item.obedience}/10</div>
                                    </div>
                                    
                                    <div>
                                      <div className="text-xs text-gray-500 mb-1">Energía</div>
                                      <div className="h-3 bg-gray-200 rounded">
                                        <div 
                                          className="h-3 bg-[#FFFE8D] rounded transition-all"
                                          style={{ width: `${(item.energy / 10) * 100}%` }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-center mt-1">{item.energy}/10</div>
                                    </div>
                                    
                                    <div>
                                      <div className="text-xs text-gray-500 mb-1">Social</div>
                                      <div className="h-3 bg-gray-200 rounded">
                                        <div 
                                          className="h-3 bg-[#C7EA46] rounded transition-all"
                                          style={{ width: `${(item.sociability / 10) * 100}%` }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-center mt-1">{item.sociability}/10</div>
                                    </div>
                                    
                                    <div>
                                      <div className="text-xs text-gray-500 mb-1">Ansiedad</div>
                                      <div className="h-3 bg-gray-200 rounded">
                                        <div 
                                          className="h-3 bg-red-400 rounded transition-all"
                                          style={{ width: `${(item.anxiety / 10) * 100}%` }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-center mt-1">{item.anxiety}/10</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB: Historial */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      📋 Historial de Evaluaciones
                    </h3>
                    
                    {getFilteredEvaluations().length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">📝</div>
                        <p>No hay evaluaciones en el período seleccionado</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getFilteredEvaluations().map((evaluation, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {new Date(evaluation.date).toLocaleDateString('es-CO', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {evaluation.location === 'casa' ? '🏠 En casa' : '🏫 En el colegio'}
                                  {evaluation.profiles && ` • Por ${evaluation.profiles.full_name}`}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div>
                                <div className="text-xs text-gray-500">Obediencia</div>
                                <div className="font-semibold text-[#56CCF2]">{evaluation.obedience_level}/10</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Energía</div>
                                <div className="font-semibold text-orange-500">{evaluation.energy_level}/10</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Sociabilidad</div>
                                <div className="font-semibold text-green-500">{evaluation.sociability_level}/10</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Ansiedad</div>
                                <div className="font-semibold text-red-500">{evaluation.anxiety_level}/10</div>
                              </div>
                            </div>
                            
                            {evaluation.notes && (
                              <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                                <strong>Notas:</strong> {evaluation.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: Insights */}
              {activeTab === 'insights' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      💡 Análisis y Recomendaciones
                    </h3>
                    
                    {(() => {
                      const insights = generateInsights();
                      if (insights.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-4">🤔</div>
                            <p>Necesitamos más datos para generar insights personalizados</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {insights.map((insight, index) => (
                            <div 
                              key={index}
                              className={`p-4 rounded-lg border-l-4 ${
                                insight.type === 'success' ? 'bg-green-50 border-green-400' :
                                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                                'bg-blue-50 border-blue-400'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="text-2xl">{insight.icon}</div>
                                <div className="text-gray-800">{insight.text}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Recomendaciones adicionales */}
                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold text-gray-900">🎯 Recomendaciones Personalizadas:</h4>
                      
                      {averages?.energy_percentage > 80 && (
                        <div className="bg-orange-50 rounded-lg p-3">
                          <div className="font-medium text-orange-900">Alta Energía</div>
                          <div className="text-sm text-orange-700">
                            Aumenta el tiempo de ejercicio y juegos activos.
                          </div>
                        </div>
                      )}
                      
                      {averages?.anxiety_percentage > 60 && (
                        <div className="bg-purple-50 rounded-lg p-3">
                          <div className="font-medium text-purple-900">Reducir Ansiedad</div>
                          <div className="text-sm text-purple-700">
                            Crea rutinas calmantes. Considera música relajante y espacios tranquilos.
                          </div>
                        </div>
                      )}
                      
                      {averages?.sociability_percentage < 60 && (
                        <div className="bg-pink-50 rounded-lg p-3">
                          <div className="font-medium text-pink-900">Socialización</div>
                          <div className="text-sm text-pink-700">
                            Exponlo gradualmente a otros perros y personas en entornos controlados.
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

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Datos basados en {evaluations.length} evaluaciones
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.print()}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                🖨️ Imprimir Reporte
              </button>
              <button
                onClick={onClose}
                className="bg-[#56CCF2] text-white px-6 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
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