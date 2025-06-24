// src/components/dashboard/TeacherProgressModal.jsx - ESPECÍFICO PARA PROFESORES ✅
import { useState, useEffect } from 'react';
import supabase, { getDogAverages } from '../../lib/supabase.js';

const TeacherProgressModal = ({ dog, onClose, isOpen }) => {
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState([]);
  const [averages, setAverages] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && dog) {
      console.log('👨‍🏫 Modal profesor abierto para:', dog.name);
      fetchDogData();
    }
  }, [isOpen, dog]);

  const fetchDogData = async () => {
    setLoading(true);
    console.log('👨‍🏫 Obteniendo datos para profesor:', dog.name);
    
    try {
      // Obtener evaluaciones (todas las ubicaciones)
      const { data: evaluationsData, error: evalError } = await supabase
        .from('evaluations')
        .select(`
          *,
          profiles!evaluations_evaluator_id_fkey(full_name, email, role)
        `)
        .eq('dog_id', dog.id)
        .order('date', { ascending: false })
        .limit(30); // Últimas 30 evaluaciones

      if (evalError) {
        console.error('❌ Error obteniendo evaluaciones:', evalError);
      } else {
        console.log('✅ Evaluaciones obtenidas:', evaluationsData?.length || 0);
        setEvaluations(evaluationsData || []);
      }

      // Obtener promedios generales
      const averagesResult = await getDogAverages(dog.id);
      if (averagesResult.data) {
        console.log('✅ Promedios obtenidos:', averagesResult.data);
        setAverages(averagesResult.data);
      }

    } catch (error) {
      console.error('❌ Error en fetchDogData:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular SOLO promedios generales (sin separar ubicaciones)
  const getGeneralAverages = () => {
    if (evaluations.length === 0) return null;

    const totalEvals = evaluations.length;
    
    return {
      obediencia: Math.round(evaluations.reduce((sum, e) => sum + (e.obedience_level || 0), 0) / totalEvals),
      energia: Math.round(evaluations.reduce((sum, e) => sum + (e.energy_level || 0), 0) / totalEvals),
      sociabilidad: Math.round(evaluations.reduce((sum, e) => sum + (e.sociability_level || 0), 0) / totalEvals),
      ansiedad: Math.round(evaluations.reduce((sum, e) => sum + (e.anxiety_level || 0), 0) / totalEvals),
      total: totalEvals
    };
  };

  // ENFOQUE ESPECIAL: Evolución en casa para profesores
  const getCasaEvolutionForTeacher = () => {
    const casaEvals = evaluations
      .filter(e => e.location === 'casa')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (casaEvals.length < 3) return null;

    // Dividir en períodos: Hace 1 mes vs Últimas 2 semanas
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    const oldPeriod = casaEvals.filter(e => new Date(e.date) < oneMonthAgo);
    const recentPeriod = casaEvals.filter(e => new Date(e.date) >= twoWeeksAgo);
    
    if (oldPeriod.length === 0 || recentPeriod.length === 0) {
      // Alternativa: Comparar primera mitad vs segunda mitad
      const midPoint = Math.floor(casaEvals.length / 2);
      const firstHalf = casaEvals.slice(0, midPoint);
      const secondHalf = casaEvals.slice(midPoint);
      
      if (firstHalf.length === 0 || secondHalf.length === 0) return null;
      
      const oldAvg = firstHalf.reduce((sum, e) => sum + e.obedience_level, 0) / firstHalf.length;
      const recentAvg = secondHalf.reduce((sum, e) => sum + e.obedience_level, 0) / secondHalf.length;
      
      return {
        mejoraCasa: recentAvg - oldAvg,
        tendenciaCasa: recentAvg > oldAvg + 0.5 ? 'mejorando' : recentAvg < oldAvg - 0.5 ? 'regresando' : 'estable',
        evaluacionesCasa: casaEvals.length,
        promedioActualCasa: Math.round(recentAvg),
        periodoComparacion: 'Primera mitad vs Segunda mitad'
      };
    }
    
    const oldAvg = oldPeriod.reduce((sum, e) => sum + e.obedience_level, 0) / oldPeriod.length;
    const recentAvg = recentPeriod.reduce((sum, e) => sum + e.obedience_level, 0) / recentPeriod.length;
    
    return {
      mejoraCasa: recentAvg - oldAvg,
      tendenciaCasa: recentAvg > oldAvg + 0.5 ? 'mejorando' : recentAvg < oldAvg - 0.5 ? 'regresando' : 'estable',
      evaluacionesCasa: casaEvals.length,
      promedioActualCasa: Math.round(recentAvg),
      periodoComparacion: 'Hace 1 mes vs Últimas 2 semanas'
    };
  };

  // Crear línea de tiempo simple
  const getTimelineData = () => {
    return evaluations.slice(0, 10).map(evaluation => ({
      fecha: new Date(evaluation.date).toLocaleDateString('es-CO', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      }),
      obediencia: evaluation.obedience_level || 0,
      energia: evaluation.energy_level || 0,
      sociabilidad: evaluation.sociability_level || 0,
      ansiedad: evaluation.anxiety_level || 0,
      ubicacion: evaluation.location,
      evaluador: evaluation.profiles?.role === 'padre' ? 'Padre' : 'Profesor',
      notas: evaluation.notes
    }));
  };

  // Consejos específicos para profesores basados en comportamiento en casa
  const generateTeacherInsights = () => {
    const general = getGeneralAverages();
    const casaEvolution = getCasaEvolutionForTeacher();
    const insights = [];

    if (!general) {
      insights.push({
        type: 'info',
        icon: '📋',
        text: `${dog.name} necesita más evaluaciones para análisis completo. Mínimo 5 evaluaciones recomendadas.`
      });
      return insights;
    }

    // Insights sobre comportamiento en casa (para informar a los padres)
    if (casaEvolution) {
      if (casaEvolution.tendenciaCasa === 'mejorando') {
        insights.push({
          type: 'success',
          icon: '🏠📈',
          text: `¡Excelente progreso en casa! ${dog.name} mejoró ${casaEvolution.mejoraCasa.toFixed(1)} puntos en obediencia. Comunica esto a los padres.`
        });
      } else if (casaEvolution.tendenciaCasa === 'regresando') {
        insights.push({
          type: 'warning',
          icon: '🏠📉',
          text: `${dog.name} necesita refuerzo en casa. Sugiere a los padres practicar comandos básicos 10 min diarios.`
        });
      } else {
        insights.push({
          type: 'info',
          icon: '🏠➡️',
          text: `${dog.name} mantiene comportamiento estable en casa. Continuar con rutina actual.`
        });
      }
    }

    // Insights sobre progreso general para el profesor
    if (general.obediencia >= 8) {
      insights.push({
        type: 'success',
        icon: '🎯✨',
        text: `${dog.name} tiene excelente obediencia general (${general.obediencia}/10). Es un ejemplo para otros perros.`
      });
    } else if (general.obediencia <= 4) {
      insights.push({
        type: 'warning',
        icon: '🎯📚',
        text: `${dog.name} necesita más trabajo en obediencia. Dedica tiempo extra durante las sesiones grupales.`
      });
    }

    // Recomendaciones específicas del profesor para los padres
    if (general.energia >= 8) {
      insights.push({
        type: 'info',
        icon: '⚡🏃',
        text: `${dog.name} tiene mucha energía. Recomienda a los padres aumentar ejercicio físico antes de entrenamientos.`
      });
    }

    if (general.ansiedad >= 7) {
      insights.push({
        type: 'warning',
        icon: '😰🧘',
        text: `${dog.name} muestra ansiedad. Sugiere técnicas de relajación y rutinas predecibles en casa.`
      });
    }

    return insights;
  };

  if (!isOpen) return null;

  const general = getGeneralAverages();
  const casaEvolution = getCasaEvolutionForTeacher();
  const timeline = getTimelineData();
  const insights = generateTeacherInsights();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#C7EA46] to-[#56CCF2] text-white px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                👨‍🏫 Análisis del Profesor - {dog.name}
              </h2>
              <p className="opacity-90">
                {dog.breed} • {dog.size} • {dog.age} años • Dueño: {dog.profiles?.full_name || 'Sin dueño'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Navegación simplificada para profesores */}
          <div className="flex space-x-6 mt-4">
            {[
              { id: 'overview', label: '📊 Promedios Generales' },
              { id: 'casa', label: '🏠 Evolución en Casa' },
              { id: 'timeline', label: '📅 Historial' },
              { id: 'recommendations', label: '💡 Para Padres' }
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C7EA46] mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando análisis del profesor...</p>
              </div>
            </div>
          ) : (
            <>
              {/* TAB: Promedios Generales */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {general ? (
                    <>
                      {/* Métricas principales SIN comparación */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { label: 'Obediencia', value: general.obediencia, color: 'bg-[#56CCF2]', icon: '🎯' },
                          { label: 'Sociabilidad', value: general.sociabilidad, color: 'bg-[#C7EA46]', icon: '🤝' },
                          { label: 'Energía', value: general.energia, color: 'bg-[#FFFE8D]', icon: '⚡' },
                          { label: 'Calma', value: 10 - general.ansiedad, color: 'bg-[#ACF0F4]', icon: '😌' }
                        ].map(metric => (
                          <div key={metric.label} className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                                {metric.icon}
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-gray-900">{metric.value}/10</div>
                                <div className="text-gray-600">{metric.label}</div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className={`${metric.color} h-3 rounded-full transition-all duration-300`}
                                style={{ width: `${(metric.value / 10) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Resumen para el profesor */}
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Resumen del Profesor</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-700">{general.total}</div>
                            <div className="text-sm text-blue-600">Total Evaluaciones</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-700">
                              {evaluations.filter(e => e.location === 'casa').length}
                            </div>
                            <div className="text-sm text-green-600">Evaluaciones en Casa</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-700">
                              {Math.round((general.obediencia + general.sociabilidad + general.energia + (10 - general.ansiedad)) / 4)}
                            </div>
                            <div className="text-sm text-purple-600">Promedio General /10</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">📋</div>
                      <p>No hay suficientes evaluaciones para mostrar promedios</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Evolución en Casa (Enfoque especial) */}
              {activeTab === 'casa' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">🏠 Progreso Específico en Casa</h3>
                    
                    {casaEvolution ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-700">{casaEvolution.evaluacionesCasa}</div>
                            <div className="text-sm text-blue-600">Evaluaciones en Casa</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-700">{casaEvolution.promedioActualCasa}/10</div>
                            <div className="text-sm text-green-600">Obediencia Actual</div>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-700">
                              {casaEvolution.mejoraCasa > 0 ? '+' : ''}{casaEvolution.mejoraCasa.toFixed(1)}
                            </div>
                            <div className="text-sm text-yellow-600">Cambio en Obediencia</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl">
                              {casaEvolution.tendenciaCasa === 'mejorando' ? '📈' :
                               casaEvolution.tendenciaCasa === 'regresando' ? '📉' : '➡️'}
                            </div>
                            <div className="text-sm text-purple-600 capitalize">{casaEvolution.tendenciaCasa}</div>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">📊 Comparación: {casaEvolution.periodoComparacion}</h4>
                          <p className="text-blue-800 text-sm">
                            {casaEvolution.tendenciaCasa === 'mejorando' && 
                              `¡Excelente! ${dog.name} está mejorando en casa. Los padres están haciendo un buen trabajo.`}
                            {casaEvolution.tendenciaCasa === 'regresando' && 
                              `${dog.name} necesita más consistencia en casa. Considera hablar con los padres sobre rutinas diarias.`}
                            {casaEvolution.tendenciaCasa === 'estable' && 
                              `${dog.name} mantiene un comportamiento consistente en casa. Continuar con el plan actual.`}
                          </p>
                        </div>

                        {/* Evaluaciones solo de casa */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">🏠 Últimas Evaluaciones en Casa</h4>
                          <div className="space-y-2">
                            {evaluations
                              .filter(e => e.location === 'casa')
                              .slice(0, 5)
                              .map((evaluation, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                                  <div>
                                    <div className="font-medium">{new Date(evaluation.date).toLocaleDateString('es-CO')}</div>
                                    <div className="text-sm text-gray-600">Por: {evaluation.profiles?.full_name || 'Padre'}</div>
                                    {evaluation.notes && (
                                      <div className="text-xs text-gray-500 mt-1">{evaluation.notes}</div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium">Obediencia: {evaluation.obedience_level}/10</div>
                                    <div className="text-xs text-gray-600">Energía: {evaluation.energy_level}/10</div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">🏠</div>
                        <p>Necesitas más evaluaciones en casa para analizar el progreso</p>
                        <p className="text-sm mt-2">Mínimo 3 evaluaciones en casa requeridas</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: Historial */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">📅 Historial de Evaluaciones</h3>
                    
                    {timeline.length > 0 ? (
                      <div className="space-y-3">
                        {timeline.map((item, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium">{item.fecha}</div>
                                <div className="text-sm text-gray-600 flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    item.ubicacion === 'casa' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                    {item.ubicacion === 'casa' ? '🏠 Casa' : '🏫 Colegio'}
                                  </span>
                                  <span>Por: {item.evaluador}</span>
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <div>🎯 Obediencia: {item.obediencia}/10</div>
                                <div>⚡ Energía: {item.energia}/10</div>
                              </div>
                            </div>
                            {item.notas && (
                              <div className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">
                                {item.notas}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">📅</div>
                        <p>No hay historial de evaluaciones</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: Recomendaciones para Padres */}
              {activeTab === 'recommendations' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Recomendaciones para los Padres</h3>
                    
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

                    {/* Plan de acción para comunicar a los padres */}
                    <div className="mt-6 p-4 bg-[#C7EA46] bg-opacity-20 rounded-lg">
                      <h4 className="font-semibold text-[#2C3E50] mb-3">📋 Plan de Acción para Comunicar</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-green-800 mb-2">✅ Fortalezas de {dog.name}:</h5>
                          <ul className="text-green-700 space-y-1">
                            {general?.obediencia >= 7 && <li>• Excelente obediencia</li>}
                            {general?.sociabilidad >= 7 && <li>• Muy sociable con otros</li>}
                            {general?.energia >= 7 && <li>• Alta energía (necesita ejercicio)</li>}
                            {general?.ansiedad <= 4 && <li>• Comportamiento tranquilo</li>}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-orange-800 mb-2">📈 Áreas de mejora:</h5>
                          <ul className="text-orange-700 space-y-1">
                            {general?.obediencia <= 5 && <li>• Practicar comandos básicos diariamente</li>}
                            {general?.ansiedad >= 7 && <li>• Trabajar en reducir ansiedad</li>}
                            {general?.energia <= 4 && <li>• Aumentar actividad física</li>}
                            {general?.sociabilidad <= 5 && <li>• Más socialización controlada</li>}
                          </ul>
                        </div>
                      </div>
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
              Vista del Profesor • {evaluations.length} evaluaciones • {evaluations.filter(e => e.location === 'casa').length} en casa
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.print()}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                🖨️ Reporte para Padres
              </button>
              <button
                onClick={onClose}
                className="bg-[#C7EA46] text-[#2C3E50] px-6 py-2 rounded-lg hover:bg-[#FFFE8D] transition-colors"
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

export default TeacherProgressModal;