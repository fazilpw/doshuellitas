// src/components/dogs/DogProfileComplete.jsx
// 🐕 PERFIL COMPLETO DEL PERRO CON PESO Y CARACTERÍSTICAS

import { useState } from 'react';
import { useDogWeight } from '../../hooks/useDogWeight.js';
import WeightRegistrationModal from './WeightRegistrationModal.jsx';
import WeightHistoryChart from './WeightHistoryChart.jsx';

const DogProfileComplete = ({ dog, onUpdate, userRole = 'padre' }) => {
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showWeightHistory, setShowWeightHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const {
    weightStats,
    weightHistory,
    loading: weightLoading,
    addWeightRecord,
    weightTrend,
    getWeightStatus,
    hasWeightHistory,
    chartData
  } = useDogWeight(dog.id);

  // ============================================
  // 🎨 FUNCIONES DE UTILIDAD
  // ============================================
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatWeight = (weight) => {
    if (!weight) return 'Sin registrar';
    return `${parseFloat(weight).toFixed(1)} kg`;
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return dog.age || 'Sin especificar';
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    return years;
  };

  const getIdealWeightRange = (size) => {
    const ranges = {
      'pequeño': '1-10 kg',
      'mediano': '10-25 kg',
      'grande': '25-45 kg',
      'gigante': '45-90 kg'
    };
    return ranges[size] || ranges['mediano'];
  };

  const weightStatus = getWeightStatus(dog.size);

  // ============================================
  // 📊 HANDLE WEIGHT REGISTRATION
  // ============================================
  const handleWeightRegistration = async (weightData) => {
    const result = await addWeightRecord(weightData);
    
    if (result.success) {
      setShowWeightModal(false);
      // Callback para actualizar datos del perro en el componente padre
      if (onUpdate) {
        onUpdate();
      }
    }
    
    return result;
  };

  // ============================================
  // 🎨 RENDER COMPONENTE
  // ============================================
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header del perfil */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl">
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
            <div>
              <h1 className="text-2xl font-bold">{dog.name}</h1>
              <p className="text-blue-100 text-lg">{dog.breed}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                  {dog.size}
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                  {calculateAge()} años
                </span>
              </div>
            </div>
          </div>
          
          {/* Botón de registrar peso */}
          {(userRole === 'padre' || userRole === 'profesor' || userRole === 'admin') && (
            <button
              onClick={() => setShowWeightModal(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>⚖️</span>
              <span>Registrar Peso</span>
            </button>
          )}
        </div>
      </div>

      {/* Sección de peso destacada */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Peso actual */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Peso Actual</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {weightLoading ? '...' : formatWeight(weightStats?.current_weight)}
            </div>
            {weightStatus && (
              <div className={`text-sm ${weightStatus.color}`}>
                {weightStatus.message}
              </div>
            )}
          </div>

          {/* Cambio de peso */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Último Cambio</div>
            {weightTrend && weightStats ? (
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">{weightTrend.icon}</span>
                <div>
                  <div className={`text-xl font-semibold ${weightTrend.color}`}>
                    {weightTrend.change > 0 ? '+' : ''}{formatWeight(weightTrend.change)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {weightStats.days_since_last_record} días atrás
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Sin datos</div>
            )}
          </div>

          {/* Rango ideal */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Rango Ideal</div>
            <div className="text-xl font-semibold text-gray-700">
              {getIdealWeightRange(dog.size)}
            </div>
            <div className="text-sm text-gray-600">
              Para {dog.size}s
            </div>
          </div>
        </div>

        {/* Gráfico de peso */}
        {hasWeightHistory && (
          <div className="mt-6">
            <button
              onClick={() => setShowWeightHistory(!showWeightHistory)}
              className="text-[#56CCF2] hover:text-[#5B9BD5] text-sm font-medium flex items-center space-x-2"
            >
              <span>📊</span>
              <span>{showWeightHistory ? 'Ocultar' : 'Ver'} Historial de Peso</span>
            </button>
            
            {showWeightHistory && (
              <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                <WeightHistoryChart data={chartData} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs de información */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'general', label: 'General', icon: '📋' },
            { id: 'fisico', label: 'Físico', icon: '🏃‍♂️' },
            { id: 'comportamiento', label: 'Comportamiento', icon: '🧠' },
            { id: 'medico', label: 'Médico', icon: '⚕️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-[#56CCF2] text-[#56CCF2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de tabs */}
      <div className="p-6">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-semibold">{dog.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Raza:</span>
                <span className="font-semibold">{dog.breed || 'Sin especificar'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Edad:</span>
                <span className="font-semibold">{calculateAge()} años</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tamaño:</span>
                <span className="font-semibold capitalize">{dog.size}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estado:</span>
                <span className={`font-semibold ${dog.active ? 'text-green-600' : 'text-red-600'}`}>
                  {dog.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Miembro desde:</span>
                <span className="font-semibold">{formatDate(dog.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Última actualización:</span>
                <span className="font-semibold">{formatDate(dog.updated_at)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fisico' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Peso Actual:</span>
                  <span className="font-semibold text-lg">
                    {formatWeight(weightStats?.current_weight)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Color:</span>
                  <span className="font-semibold">{dog.color || 'Sin especificar'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tamaño:</span>
                  <span className="font-semibold capitalize">{dog.size}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rango Ideal:</span>
                  <span className="font-semibold">{getIdealWeightRange(dog.size)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estado del Peso:</span>
                  <span className={`font-semibold ${weightStatus?.color || 'text-gray-600'}`}>
                    {weightStatus?.status === 'normal' ? 'Ideal' : 
                     weightStatus?.status === 'bajo' ? 'Bajo' : 
                     weightStatus?.status === 'alto' ? 'Alto' : 'Sin datos'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Registros de Peso:</span>
                  <span className="font-semibold">{weightStats?.total_records || 0}</span>
                </div>
              </div>
            </div>
            
            {/* Historial de peso resumido */}
            {hasWeightHistory && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Registros Recientes</h3>
                <div className="space-y-2">
                  {weightHistory.slice(0, 3).map((record, index) => (
                    <div key={record.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {formatDate(record.date_recorded)} - {record.location}
                      </span>
                      <span className="font-medium">
                        {formatWeight(record.weight)}
                        {index === 0 && record.weight_difference && (
                          <span className={`ml-2 text-sm ${
                            record.weight_difference > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ({record.weight_difference > 0 ? '+' : ''}{formatWeight(record.weight_difference)})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comportamiento' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Notas de Comportamiento</h3>
              <p className="text-blue-800">
                {dog.notes || 'Sin notas específicas sobre comportamiento registradas.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">🌟 Fortalezas</h4>
                <p className="text-green-800 text-sm">
                  Ver evaluaciones recientes para detalles específicos sobre comportamiento positivo.
                </p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">🎯 Áreas de Mejora</h4>
                <p className="text-yellow-800 text-sm">
                  Revisar evaluaciones para identificar patrones de comportamiento a trabajar.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medico' && (
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">⚕️ Información Médica</h3>
              <p className="text-red-800 text-sm">
                Consulta las secciones de Vacunas y Medicinas para información médica detallada.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">💉 Vacunas</h4>
                <p className="text-purple-800 text-sm">
                  Estado de vacunación y próximas fechas importantes.
                </p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-2">💊 Medicamentos</h4>
                <p className="text-orange-800 text-sm">
                  Tratamientos actuales y historial médico.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para registrar peso */}
      {showWeightModal && (
        <WeightRegistrationModal
          isOpen={showWeightModal}
          onClose={() => setShowWeightModal(false)}
          onSubmit={handleWeightRegistration}
          dogName={dog.name}
          currentWeight={weightStats?.current_weight}
        />
      )}
    </div>
  );
};

export default DogProfileComplete;