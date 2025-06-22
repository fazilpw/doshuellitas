// src/components/dashboard/EvaluationDisplay.jsx
import { useState } from 'react';

const EvaluationDisplay = ({ evaluations, dogName }) => {
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [view, setView] = useState('recent'); // 'recent', 'comparison', 'trends'

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-bold text-[#2C3E50] mb-2">
          No hay evaluaciones aún
        </h3>
        <p className="text-gray-600">
          Las evaluaciones aparecerán aquí una vez que se registren
        </p>
      </div>
    );
  }

  const recentEvaluations = evaluations.slice(0, 5);
  const homeEvaluations = evaluations.filter(e => e.location === 'casa');
  const schoolEvaluations = evaluations.filter(e => e.location === 'colegio');

  const getScoreColor = (score, isAnxiety = false) => {
    if (isAnxiety) {
      if (score <= 3) return 'text-green-600';
      if (score <= 6) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (score <= 3) return 'text-red-600';
      if (score <= 6) return 'text-yellow-600';
      return 'text-green-600';
    }
  };

  const getScoreBgColor = (score, isAnxiety = false) => {
    if (isAnxiety) {
      if (score <= 3) return 'bg-green-100';
      if (score <= 6) return 'bg-yellow-100';
      return 'bg-red-100';
    } else {
      if (score <= 3) return 'bg-red-100';
      if (score <= 6) return 'bg-yellow-100';
      return 'bg-green-100';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAverageScore = (evaluationsList, field) => {
    if (evaluationsList.length === 0) return 0;
    const sum = evaluationsList.reduce((acc, evalItem) => acc + (evalItem[field] || 0), 0);
    return (sum / evaluationsList.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Navegación de vistas */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setView('recent')}
          className={`px-4 py-2 font-medium ${
            view === 'recent'
              ? 'text-[#56CCF2] border-b-2 border-[#56CCF2]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Evaluaciones Recientes
        </button>
        <button
          onClick={() => setView('comparison')}
          className={`px-4 py-2 font-medium ${
            view === 'comparison'
              ? 'text-[#56CCF2] border-b-2 border-[#56CCF2]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏠🏫 Casa vs Colegio
        </button>
        <button
          onClick={() => setView('trends')}
          className={`px-4 py-2 font-medium ${
            view === 'trends'
              ? 'text-[#56CCF2] border-b-2 border-[#56CCF2]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📈 Tendencias
        </button>
      </div>

      {/* Vista: Evaluaciones Recientes */}
      {view === 'recent' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-[#2C3E50]">
            Últimas evaluaciones de {dogName}
          </h3>
          
          {recentEvaluations.map((evaluationItem) => (
            <div 
              key={evaluationItem.id} 
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-[#2C3E50]">
                      {evaluationItem.location === 'casa' ? '🏠 En casa' : '🏫 En el colegio'}
                    </h4>
                    <p className="text-gray-600">{formatDate(evaluationItem.date)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedEvaluation(evaluationItem)}
                    className="text-[#56CCF2] hover:text-[#5B9BD5] text-sm font-medium"
                  >
                    Ver detalles →
                  </button>
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${getScoreBgColor(evaluationItem.energy_level)}`}>
                    <div className="text-xs text-gray-600 mb-1">Energía</div>
                    <div className={`text-2xl font-bold ${getScoreColor(evaluationItem.energy_level)}`}>
                      {evaluationItem.energy_level || '-'}/10
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getScoreBgColor(evaluationItem.sociability_level)}`}>
                    <div className="text-xs text-gray-600 mb-1">Social</div>
                    <div className={`text-2xl font-bold ${getScoreColor(evaluationItem.sociability_level)}`}>
                      {evaluationItem.sociability_level || '-'}/10
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getScoreBgColor(evaluationItem.obedience_level)}`}>
                    <div className="text-xs text-gray-600 mb-1">Obediencia</div>
                    <div className={`text-2xl font-bold ${getScoreColor(evaluationItem.obedience_level)}`}>
                      {evaluationItem.obedience_level || '-'}/10
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getScoreBgColor(evaluationItem.anxiety_level, true)}`}>
                    <div className="text-xs text-gray-600 mb-1">Ansiedad</div>
                    <div className={`text-2xl font-bold ${getScoreColor(evaluationItem.anxiety_level, true)}`}>
                      {evaluationItem.anxiety_level || '-'}/10
                    </div>
                  </div>
                </div>

                {/* Destacados */}
                {evaluationItem.highlights && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-3">
                    <div className="text-sm font-medium text-green-800 mb-1">⭐ Lo mejor del día:</div>
                    <div className="text-sm text-green-700">{evaluationItem.highlights}</div>
                  </div>
                )}

                {/* Notas breves */}
                {evaluationItem.notes && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-700 line-clamp-2">
                      {evaluationItem.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista: Comparación Casa vs Colegio */}
      {view === 'comparison' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-[#2C3E50]">
            Comparación: Casa vs Colegio
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Casa */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🏠</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#2C3E50]">En Casa</h4>
                  <p className="text-gray-600">{homeEvaluations.length} evaluaciones</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Energía promedio:</span>
                  <span className="font-bold text-[#56CCF2]">
                    {getAverageScore(homeEvaluations, 'energy_level')}/10
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Socialización promedio:</span>
                  <span className="font-bold text-[#C7EA46]">
                    {getAverageScore(homeEvaluations, 'sociability_level')}/10
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Obediencia promedio:</span>
                  <span className="font-bold text-[#5B9BD5]">
                    {getAverageScore(homeEvaluations, 'obedience_level')}/10
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ansiedad promedio:</span>
                  <span className="font-bold text-[#AB5729]">
                    {getAverageScore(homeEvaluations, 'anxiety_level')}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Colegio */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🏫</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#2C3E50]">En el Colegio</h4>
                  <p className="text-gray-600">{schoolEvaluations.length} evaluaciones</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Energía promedio:</span>
                  <span className="font-bold text-[#56CCF2]">
                    {getAverageScore(schoolEvaluations, 'energy_level')}/10
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Socialización promedio:</span>
                  <span className="font-bold text-[#C7EA46]">
                    {getAverageScore(schoolEvaluations, 'sociability_level')}/10
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Obediencia promedio:</span>
                  <span className="font-bold text-[#5B9BD5]">
                    {getAverageScore(schoolEvaluations, 'obedience_level')}/10
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ansiedad promedio:</span>
                  <span className="font-bold text-[#AB5729]">
                    {getAverageScore(schoolEvaluations, 'anxiety_level')}/10
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista: Tendencias (Placeholder) */}
      {view === 'trends' && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-xl font-bold text-[#2C3E50] mb-2">
            Gráficos de Tendencias
          </h3>
          <p className="text-gray-600">
            Los gráficos de progreso se mostrarán aquí cuando tengamos más datos
          </p>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedEvaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#2C3E50]">
                  Evaluación Detallada
                </h3>
                <button
                  onClick={() => setSelectedEvaluation(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Info básica */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Ubicación:</span> 
                      {selectedEvaluation.location === 'casa' ? ' 🏠 Casa' : ' 🏫 Colegio'}
                    </div>
                    <div>
                      <span className="font-medium">Fecha:</span> 
                      {formatDate(selectedEvaluation.date)}
                    </div>
                  </div>
                </div>

                {/* Métricas detalladas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-[#56CCF2]">
                      {selectedEvaluation.energy_level}/10
                    </div>
                    <div className="text-sm text-gray-600">Energía</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-[#C7EA46]">
                      {selectedEvaluation.sociability_level}/10
                    </div>
                    <div className="text-sm text-gray-600">Socialización</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-[#5B9BD5]">
                      {selectedEvaluation.obedience_level}/10
                    </div>
                    <div className="text-sm text-gray-600">Obediencia</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-[#AB5729]">
                      {selectedEvaluation.anxiety_level}/10
                    </div>
                    <div className="text-sm text-gray-600">Ansiedad</div>
                  </div>
                </div>

                {/* Comportamientos */}
                <div>
                  <h4 className="font-bold text-[#2C3E50] mb-3">🎭 Comportamientos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Ladridos:</span> {selectedEvaluation.barks_much}
                    </div>
                    <div>
                      <span className="font-medium">Pide comida:</span> {selectedEvaluation.begs_food}
                    </div>
                    <div>
                      <span className="font-medium">Destructivo:</span> {selectedEvaluation.destructive}
                    </div>
                    <div>
                      <span className="font-medium">Social con perros:</span> {selectedEvaluation.social_with_dogs}
                    </div>
                    <div>
                      <span className="font-medium">Te sigue:</span> {selectedEvaluation.follows_everywhere}
                    </div>
                    <div>
                      <span className="font-medium">Vigila ventana:</span> {selectedEvaluation.window_watching}
                    </div>
                  </div>
                </div>

                {/* Actividades */}
                {(selectedEvaluation.ate_well || selectedEvaluation.played_with_toys) && (
                  <div>
                    <h4 className="font-bold text-[#2C3E50] mb-3">🍽️ Actividades</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {selectedEvaluation.ate_well && (
                        <div>
                          <span className="font-medium">Comió:</span> {selectedEvaluation.ate_well}
                        </div>
                      )}
                      {selectedEvaluation.bathroom_accidents && (
                        <div>
                          <span className="font-medium">Accidentes:</span> {selectedEvaluation.bathroom_accidents}
                        </div>
                      )}
                      {selectedEvaluation.played_with_toys && (
                        <div>
                          <span className="font-medium">Jugó:</span> {selectedEvaluation.played_with_toys}
                        </div>
                      )}
                      {selectedEvaluation.responded_to_commands && (
                        <div>
                          <span className="font-medium">Comandos:</span> {selectedEvaluation.responded_to_commands}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Destacados */}
                {selectedEvaluation.highlights && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <h5 className="font-semibold text-green-800 mb-2">⭐ Lo mejor del día:</h5>
                    <p className="text-green-700">{selectedEvaluation.highlights}</p>
                  </div>
                )}

                {/* Preocupaciones */}
                {selectedEvaluation.concerns && (
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                    <h5 className="font-semibold text-orange-800 mb-2">⚠️ Áreas de atención:</h5>
                    <p className="text-orange-700">{selectedEvaluation.concerns}</p>
                  </div>
                )}

                {/* Notas generales */}
                {selectedEvaluation.notes && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <h5 className="font-semibold text-blue-800 mb-2">💬 Notas generales:</h5>
                    <p className="text-blue-700">{selectedEvaluation.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationDisplay;