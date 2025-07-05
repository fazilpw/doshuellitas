// src/components/dogs/CompactDogCard.jsx
// 🃏 TARJETA COMPACTA PARA DASHBOARD CON PESO Y CARACTERÍSTICAS

import { useDogWeight } from '../../hooks/useDogWeight.js';

const CompactDogCard = ({ dog, onClick, userRole = 'padre' }) => {
  const {
    weightStats,
    weightHistory,
    loading: weightLoading,
    getWeightStatus,
    hasWeightHistory
  } = useDogWeight(dog.id);

  // ============================================
  // 🎨 FUNCIONES DE UTILIDAD
  // ============================================
  const formatWeight = (weight) => {
    if (!weight) return '--';
    return `${parseFloat(weight).toFixed(1)}kg`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const weightStatus = getWeightStatus(dog.size);
  const lastWeightRecord = weightHistory?.[0];

  // ============================================
  // 🎨 RENDER TARJETA COMPACTA
  // ============================================
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
    >
      {/* Header con foto y nombre */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center text-white text-xl">
            {dog.photo_url ? (
              <img 
                src={dog.photo_url} 
                alt={dog.name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              '🐕'
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">{dog.name}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{dog.breed || 'Mixto'}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span className="text-sm text-gray-600">{dog.size || 'N/A'}</span>
              {dog.age && (
                <>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="text-sm text-gray-600">{dog.age}a</span>
                </>
              )}
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${dog.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
      </div>

      {/* Información de peso */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Peso Actual */}
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Peso Actual</div>
            <div className="text-xl font-bold text-gray-900">
              {weightLoading ? (
                <div className="w-12 h-6 bg-gray-200 rounded animate-pulse mx-auto"></div>
              ) : (
                formatWeight(weightStats?.current_weight || dog.weight)
              )}
            </div>
            {weightStatus && (
              <div className={`text-xs mt-1 ${
                weightStatus.status === 'ideal' ? 'text-green-600' :
                weightStatus.status === 'bajo' ? 'text-orange-600' :
                weightStatus.status === 'alto' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {weightStatus.status === 'ideal' ? '✅ Ideal' :
                 weightStatus.status === 'bajo' ? '⚠️ Bajo' :
                 weightStatus.status === 'alto' ? '🚨 Alto' : '❓ S/D'}
              </div>
            )}
          </div>

          {/* Último Registro */}
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Último Registro</div>
            {lastWeightRecord ? (
              <>
                <div className="text-lg font-bold text-gray-900">
                  {formatWeight(lastWeightRecord.weight)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatDate(lastWeightRecord.date_recorded)}
                </div>
                {lastWeightRecord.weight_difference && (
                  <div className={`text-xs font-medium ${
                    lastWeightRecord.weight_difference > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {lastWeightRecord.weight_difference > 0 ? '↗️' : '↘️'} 
                    {Math.abs(lastWeightRecord.weight_difference).toFixed(1)}kg
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-lg text-gray-400">--</div>
                <div className="text-xs text-gray-400">Sin datos</div>
              </>
            )}
          </div>
        </div>

        {/* Características rápidas */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              dog.size === 'pequeño' ? 'bg-green-100 text-green-800' :
              dog.size === 'mediano' ? 'bg-blue-100 text-blue-800' :
              dog.size === 'grande' ? 'bg-purple-100 text-purple-800' :
              dog.size === 'gigante' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {dog.size || 'S/E'}
            </span>
            {dog.color && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                {dog.color}
              </span>
            )}
          </div>
          
          {/* Indicador de registros */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500">
              {hasWeightHistory ? (
                <>📊 {weightStats?.total_records || 0}</>
              ) : (
                '📝 Sin registros'
              )}
            </span>
          </div>
        </div>

        {/* Progreso/Estado */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Estado General:</span>
            <span className={`text-xs font-medium ${
              dog.active ? 'text-green-600' : 'text-red-600'
            }`}>
              {dog.active ? '✅ Activo' : '⭕ Inactivo'}
            </span>
          </div>
          
          {weightStats && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-600">Seguimiento:</span>
              <span className="text-xs text-blue-600 font-medium">
                {weightStats.days_since_last || 0} días atrás
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer con acción rápida */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Click para ver perfil completo
          </div>
          <div className="text-xs text-[#56CCF2] font-medium">
            Ver más →
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactDogCard;