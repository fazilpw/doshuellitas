// src/components/dogs/EnhancedDogProfile.jsx
// 🐕 PERFIL MEJORADO CON PESO Y CARACTERÍSTICAS DESTACADAS + ELIMINACIÓN DE REGISTROS

import { useState } from 'react';
import { useDogWeight } from '../../hooks/useDogWeight.js';
import WeightRegistrationModal from './WeightRegistrationModal.jsx';

const EnhancedDogProfile = ({ dog, onUpdate, userRole = 'padre' }) => {
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Estado para confirmación de eliminación
  const [deletingRecord, setDeletingRecord] = useState(null); // Estado para loading de eliminación
  
  const {
    weightStats,
    weightHistory,
    loading: weightLoading,
    addWeightRecord,
    deleteWeightRecord,    // ✅ Función para eliminar del hook
    weightTrend,
    getWeightStatus,
    hasWeightHistory
  } = useDogWeight(dog.id);

  // ============================================
  // 🎨 FUNCIONES DE UTILIDAD
  // ============================================
  const formatWeight = (weight) => {
    if (!weight) return 'Sin registrar';
    return `${parseFloat(weight).toFixed(1)} kg`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getIdealWeightRange = (size) => {
    const ranges = {
      'pequeño': '1-10 kg',
      'mediano': '10-25 kg',
      'grande': '25-45 kg',
      'gigante': '45-90 kg'
    };
    return ranges[size] || 'No especificado';
  };

  const weightStatus = getWeightStatus(dog.size);
  const lastWeightRecord = weightHistory?.[0]; // Último registro

  // ============================================
  // 📊 HANDLE WEIGHT REGISTRATION
  // ============================================
  const handleWeightRegistration = async (weightData) => {
    const result = await addWeightRecord(weightData);
    
    if (result.success) {
      setShowWeightModal(false);
      if (onUpdate) onUpdate();
    }
    
    return result;
  };

  // ============================================
  // 🗑️ HANDLE WEIGHT DELETION
  // ============================================
  const handleDeleteWeight = async (recordId) => {
    try {
      setDeletingRecord(recordId);
      console.log('🗑️ Eliminando registro de peso:', recordId);
      
      const result = await deleteWeightRecord(recordId);
      
      if (result.success) {
        console.log('✅ Registro eliminado exitosamente');
        setDeleteConfirm(null);
        
        // Actualizar datos del perro en el componente padre si es necesario
        if (onUpdate) {
          onUpdate();
        }
        
        // Mostrar feedback al usuario
        if (typeof window !== 'undefined' && window.showNotification) {
          window.showNotification('Registro de peso eliminado', 'success');
        }
      } else {
        console.error('❌ Error eliminando registro:', result.error);
        alert('Error eliminando el registro: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error en handleDeleteWeight:', error);
      alert('Error eliminando el registro');
    } finally {
      setDeletingRecord(null);
    }
  };

  const confirmDelete = (record) => {
    setDeleteConfirm(record);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // ============================================
  // 🎨 CARACTERÍSTICAS DEL PERRO
  // ============================================
  const dogCharacteristics = [
    {
      label: 'Raza',
      value: dog.breed || 'Sin especificar',
      icon: '🐕'
    },
    {
      label: 'Tamaño',
      value: dog.size || 'Sin especificar',
      icon: '📏'
    },
    {
      label: 'Edad',
      value: dog.age ? `${dog.age} años` : 'Sin especificar',
      icon: '🎂'
    },
    {
      label: 'Color',
      value: dog.color || 'Sin especificar',
      icon: '🎨'
    },
    {
      label: 'Rango Ideal',
      value: getIdealWeightRange(dog.size),
      icon: '🎯'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* ============================================ */}
      {/* 🎨 HEADER DEL PERFIL */}
      {/* ============================================ */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-blue-100 text-lg">{dog.breed || 'Raza mixta'}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                  {dog.size || 'Tamaño no especificado'}
                </span>
                {dog.age && (
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    {dog.age} años
                  </span>
                )}
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

      {/* ============================================ */}
      {/* 📊 SECCIÓN DE PESO DESTACADA */}
      {/* ============================================ */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">⚖️</span>
          Información de Peso
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PESO ACTUAL */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2 font-medium">Peso Actual</div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {weightLoading ? (
                  <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
                ) : (
                  formatWeight(weightStats?.current_weight || dog.weight)
                )}
              </div>
              {weightStatus && (
                <div className={`text-sm font-medium ${
                  weightStatus.status === 'ideal' ? 'text-green-600' :
                  weightStatus.status === 'bajo' ? 'text-orange-600' :
                  weightStatus.status === 'alto' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {weightStatus.status === 'ideal' ? '✅ Peso ideal' :
                   weightStatus.status === 'bajo' ? '⚠️ Bajo peso' :
                   weightStatus.status === 'alto' ? '🚨 Sobrepeso' : '❓ Sin datos suficientes'}
                </div>
              )}
            </div>
          </div>

          {/* ÚLTIMO PESO REGISTRADO */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2 font-medium">Último Registro</div>
              {lastWeightRecord ? (
                <>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatWeight(lastWeightRecord.weight)}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {formatDate(lastWeightRecord.date_recorded)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {lastWeightRecord.location === 'casa' ? '🏠 Casa' : '🏫 Colegio'}
                  </div>
                  {lastWeightRecord.weight_difference && (
                    <div className={`text-sm font-medium mt-2 ${
                      lastWeightRecord.weight_difference > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {lastWeightRecord.weight_difference > 0 ? '+' : ''}
                      {formatWeight(lastWeightRecord.weight_difference)} vs anterior
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-400">
                  <div className="text-xl mb-2">📝</div>
                  <div className="text-sm">Sin registros</div>
                </div>
              )}
            </div>
          </div>

          {/* TENDENCIA DE PESO */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2 font-medium">Tendencia</div>
              {weightTrend && weightStats ? (
                <>
                  <div className="text-3xl mb-2">{weightTrend.icon}</div>
                  <div className={`text-lg font-semibold ${weightTrend.color}`}>
                    {Math.abs(weightTrend.change).toFixed(1)} kg
                  </div>
                  <div className="text-xs text-gray-500">
                    {weightTrend.direction === 'subiendo' ? 'Aumentando' :
                     weightTrend.direction === 'bajando' ? 'Disminuyendo' : 'Estable'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Total de registros: {weightStats.total_records || 0}
                  </div>
                </>
              ) : (
                <div className="text-gray-400">
                  <div className="text-xl mb-2">📈</div>
                  <div className="text-sm">Sin datos suficientes</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 🎯 CARACTERÍSTICAS DEL PERRO */}
      {/* ============================================ */}
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🐕</span>
          Características
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dogCharacteristics.map((characteristic, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{characteristic.icon}</span>
                <div>
                  <div className="text-sm text-gray-600 font-medium">
                    {characteristic.label}
                  </div>
                  <div className="text-gray-900 font-semibold">
                    {characteristic.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notas adicionales */}
        {dog.notes && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <span className="mr-2">📝</span>
              Notas Adicionales
            </h3>
            <p className="text-blue-800 text-sm">
              {dog.notes}
            </p>
          </div>
        )}

        {/* Estado general */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Estado General</h3>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${dog.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-green-800 font-medium">
                {dog.active ? 'Activo en el programa' : 'Inactivo'}
              </span>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Miembro desde</h3>
            <div className="text-purple-800 font-medium">
              {formatDate(dog.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 📊 REGISTROS RECIENTES CON ELIMINACIÓN */}
      {/* ============================================ */}
      {hasWeightHistory && (
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <span className="mr-2">📋</span>
              Registros Recientes de Peso
            </h3>
            <div className="text-sm text-gray-500">
              {weightHistory.length} registro{weightHistory.length !== 1 ? 's' : ''} total{weightHistory.length !== 1 ? 'es' : ''}
            </div>
          </div>
          
          <div className="space-y-3">
            {weightHistory.slice(0, 5).map((record, index) => (
              <div 
                key={record.id} 
                className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatDate(record.date_recorded)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {record.location === 'casa' ? '🏠 Casa' : '🏫 Colegio'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {formatWeight(record.weight)}
                    </div>
                    {record.weight_difference && index === 0 && (
                      <div className={`text-sm font-medium ${
                        record.weight_difference > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {record.weight_difference > 0 ? '+' : ''}
                        {Math.abs(record.weight_difference).toFixed(1)}kg
                      </div>
                    )}
                  </div>

                  {record.notes && (
                    <div className="flex-1 max-w-xs">
                      <div className="text-sm text-gray-600 italic">
                        "{record.notes}"
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-400">
                    Por: {record.profiles?.full_name || 'Usuario desconocido'}
                  </div>
                </div>

                {/* ✅ BOTÓN DE ELIMINAR */}
                {(userRole === 'padre' || userRole === 'profesor' || userRole === 'admin') && (
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => confirmDelete(record)}
                      disabled={deletingRecord === record.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300 disabled:opacity-50"
                      title="Eliminar registro"
                    >
                      {deletingRecord === record.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        '🗑️'
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mostrar más registros */}
          {weightHistory.length > 5 && (
            <div className="mt-4 text-center">
              <button className="text-[#56CCF2] hover:text-[#5B9BD5] text-sm font-medium">
                Ver todos los registros ({weightHistory.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* 🔔 MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {/* ============================================ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Eliminar registro de peso?
              </h3>
              <p className="text-gray-600 mb-4">
                Se eliminará el registro del <strong>{formatDate(deleteConfirm.date_recorded)}</strong> 
                con peso de <strong>{formatWeight(deleteConfirm.weight)}</strong>
              </p>
              <p className="text-sm text-red-600 mb-6">
                Esta acción no se puede deshacer.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteWeight(deleteConfirm.id)}
                  disabled={deletingRecord === deleteConfirm.id}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {deletingRecord === deleteConfirm.id ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Eliminando...</span>
                    </div>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* 📱 MODAL DE REGISTRO DE PESO */}
      {/* ============================================ */}
      {showWeightModal && (
        <WeightRegistrationModal
          isOpen={showWeightModal}
          onClose={() => setShowWeightModal(false)}
          onSubmit={handleWeightRegistration}
          dogName={dog.name}
          currentWeight={weightStats?.current_weight || dog.weight}
        />
      )}
    </div>
  );
};

export default EnhancedDogProfile;