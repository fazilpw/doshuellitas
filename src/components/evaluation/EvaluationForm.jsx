// src/components/dashboard/EvaluationForm.jsx
// 🔔 VERSIÓN CON NOTIFICACIONES AUTOMÁTICAS INTEGRADAS

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { NotificationHelper } from '../../utils/notificationHelper.js'; // ✅ NUEVO IMPORT

const EvaluationForm = ({ dogId, userId, userRole, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    energy_level: 5,
    sociability_level: 5,
    obedience_level: 5,
    anxiety_level: 5,
    barks_much: 'normal',
    begs_food: 'a_veces',
    destructive: 'nunca',
    social_with_dogs: 'normal',
    follows_everywhere: 'a_veces',
    window_watching: 'normal',
    notes: ''
  });

  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDogInfo();
  }, [dogId]);

  const fetchDogInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', dogId)
        .single();
      
      if (error) throw error;
      setDog(data);
      console.log('✅ Datos del perro cargados:', data);
    } catch (error) {
      console.error('❌ Error fetching dog:', error);
    }
  };

  const handleSliderChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('📝 Guardando evaluación simple...');
      
      const evaluationData = {
        dog_id: dogId,
        evaluator_id: userId,
        location: userRole === 'profesor' ? 'colegio' : 'casa',
        date: new Date().toISOString().split('T')[0],
        ...formData
      };

      console.log('📤 Datos de evaluación:', evaluationData);

      // 💾 Guardar evaluación en Supabase
      const { data, error } = await supabase
        .from('evaluations')
        .insert([evaluationData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Evaluación guardada:', data);

      // 🔔 NUEVO: NOTIFICACIONES AUTOMÁTICAS
      try {
        console.log('🔔 Procesando notificaciones automáticas...');
        
        if (dog && data) {
          await NotificationHelper.checkBehaviorAlertsAfterEvaluation(
            data,     // evaluación recién guardada
            dog,      // datos del perro
            userId    // ID del evaluador
          );
          console.log('✅ Notificaciones automáticas procesadas exitosamente');
          
          // Mostrar confirmación al usuario
          alert(`✅ Evaluación de ${dog.name} guardada con notificaciones automáticas activadas!`);
          
        } else {
          console.warn('⚠️ Datos insuficientes para notificaciones automáticas');
        }
        
      } catch (notificationError) {
        console.error('❌ Error en notificaciones automáticas:', notificationError);
        // No fallar la evaluación por errores de notificación
        alert(`✅ Evaluación de ${dog?.name || 'perro'} guardada (notificaciones con problemas)`);
      }

      // 📞 Ejecutar callbacks
      if (onSave) onSave(data);
      if (onClose) onClose();

    } catch (error) {
      console.error('❌ Error saving evaluation:', error);
      setError(error.message || 'Error al guardar evaluación');
    } finally {
      setLoading(false);
    }
  };

  if (!dog) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56CCF2]"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-[#2C3E50]">
                Evaluar a {dog.name} 🐕
              </h2>
              <p className="text-gray-600">
                {userRole === 'profesor' ? 
                  '📚 Evaluación en el colegio' : 
                  '🏠 Evaluación en casa'
                }
              </p>
              <div className="mt-2 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-block">
                🔔 Notificaciones automáticas activadas
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-8">
            
            {/* Métricas principales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Métricas Principales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Energía */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⚡ Nivel de Energía
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.energy_level}
                    onChange={(e) => handleSliderChange('energy_level', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Muy bajo</span>
                    <span className="font-bold text-[#56CCF2]">{formData.energy_level}/10</span>
                    <span>Muy alto</span>
                  </div>
                </div>

                {/* Sociabilidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🐕 Sociabilidad
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.sociability_level}
                    onChange={(e) => handleSliderChange('sociability_level', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Tímido</span>
                    <span className="font-bold text-[#56CCF2]">{formData.sociability_level}/10</span>
                    <span>Muy social</span>
                  </div>
                </div>

                {/* Obediencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Obediencia
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.obedience_level}
                    onChange={(e) => handleSliderChange('obedience_level', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Desobediente</span>
                    <span className="font-bold text-[#56CCF2]">{formData.obedience_level}/10</span>
                    <span>Muy obediente</span>
                  </div>
                </div>

                {/* Ansiedad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    😰 Nivel de Ansiedad
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.anxiety_level}
                    onChange={(e) => handleSliderChange('anxiety_level', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Muy relajado</span>
                    <span className="font-bold text-[#56CCF2]">{formData.anxiety_level}/10</span>
                    <span>Muy ansioso</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comportamientos específicos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎭 Comportamientos Observados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🗣️ ¿Ladra mucho?
                  </label>
                  <select
                    value={formData.barks_much}
                    onChange={(e) => handleSelectChange('barks_much', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                  >
                    <option value="nunca">Nunca ladra</option>
                    <option value="poco">Ladra poco</option>
                    <option value="normal">Normal</option>
                    <option value="mucho">Ladra mucho</option>
                    <option value="excesivo">Excesivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🍖 ¿Mendiga comida?
                  </label>
                  <select
                    value={formData.begs_food}
                    onChange={(e) => handleSelectChange('begs_food', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                  >
                    <option value="nunca">Nunca</option>
                    <option value="a_veces">A veces</option>
                    <option value="frecuente">Frecuentemente</option>
                    <option value="siempre">Siempre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💥 Comportamiento destructivo
                  </label>
                  <select
                    value={formData.destructive}
                    onChange={(e) => handleSelectChange('destructive', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                  >
                    <option value="nunca">Nunca</option>
                    <option value="raro">Muy rara vez</option>
                    <option value="a_veces">A veces</option>
                    <option value="frecuente">Frecuentemente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🐾 Socialización con otros perros
                  </label>
                  <select
                    value={formData.social_with_dogs}
                    onChange={(e) => handleSelectChange('social_with_dogs', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                  >
                    <option value="evita">Evita otros perros</option>
                    <option value="timido">Tímido pero acepta</option>
                    <option value="normal">Normal</option>
                    <option value="amigable">Muy amigable</option>
                    <option value="dominante">Dominante/agresivo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notas adicionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Notas adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleSelectChange('notes', e.target.value)}
                placeholder="Observaciones adicionales sobre el comportamiento de hoy..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                rows={4}
              />
            </div>

            {/* Error display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">❌ {error}</p>
              </div>
            )}
          </div>

          {/* Footer con botones */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#2C3E50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Guardando...' : '✅ Guardar Evaluación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluationForm;