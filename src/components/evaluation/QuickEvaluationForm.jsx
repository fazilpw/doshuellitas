// src/components/dashboard/QuickEvaluationForm.jsx
// 🔔 VERSIÓN CON NOTIFICACIONES AUTOMÁTICAS INTEGRADAS

import { useState } from 'react';
import supabase from '../../lib/supabase.js';
import { NotificationHelper } from '../../utils/notificationHelper.js'; // ✅ NUEVO IMPORT

const QuickEvaluationForm = ({ dog, userId, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    energy_level: 5,
    sociability_level: 5,
    obedience_level: 5,
    anxiety_level: 5,
    notes: '',
    highlights: '',
    concerns: ''
  });

  const handleSliderChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  const handleTextChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('📝 Guardando evaluación rápida para:', dog.name);
      
      const today = new Date().toISOString().split('T')[0];
      
      const evaluationData = {
        dog_id: dog.id,
        evaluator_id: userId,
        location: 'colegio', // Siempre colegio para profesores
        date: today,
        ...formData
      };

      console.log('📤 Datos de evaluación rápida:', evaluationData);

      // 💾 Guardar evaluación en Supabase
      const { data, error } = await supabase
        .from('evaluations')
        .insert([evaluationData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error guardando evaluación:', error);
        alert('❌ Error al guardar la evaluación. Inténtalo de nuevo.');
        return;
      }

      console.log('✅ Evaluación rápida guardada exitosamente:', data);

      // 🔔 NUEVO: NOTIFICACIONES AUTOMÁTICAS
      try {
        console.log('🔔 Procesando notificaciones automáticas...');
        
        if (dog && data) {
          await NotificationHelper.checkBehaviorAlertsAfterEvaluation(
            data,     // evaluación recién guardada
            dog,      // datos del perro
            userId    // ID del evaluador
          );
          console.log('✅ Notificaciones automáticas procesadas para evaluación rápida');
          
          // Mensaje especial para evaluación rápida
          alert(`✅ Evaluación rápida de ${dog.name} completada!\n🔔 Notificaciones automáticas enviadas a los padres.`);
          
        } else {
          console.warn('⚠️ Datos insuficientes para notificaciones automáticas');
          alert(`✅ Evaluación de ${dog.name} guardada (datos incompletos para notificaciones)`);
        }
        
      } catch (notificationError) {
        console.error('❌ Error en notificaciones automáticas:', notificationError);
        // No fallar la evaluación por errores de notificación
        alert(`✅ Evaluación de ${dog.name} guardada (notificaciones con problemas técnicos)`);
      }

      // 📞 Ejecutar callbacks
      if (onSave) {
        onSave(data);
      }

      // Cerrar formulario después de un breve delay
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);

    } catch (error) {
      console.error('❌ Error en submit de evaluación rápida:', error);
      alert('❌ Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#2C3E50] text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">⚡ Evaluación Rápida</h2>
              <p className="text-blue-100 mt-1">
                {dog?.name} • Colegio • {new Date().toLocaleDateString('es-CO')}
              </p>
              <div className="mt-2 bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm inline-block">
                🔔 Notificaciones automáticas activadas
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            
            {/* Métricas rápidas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Evaluación Rápida de Hoy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Energía */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⚡ Energía
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
                    <span>Bajo</span>
                    <span className="font-bold text-[#56CCF2] text-lg">{formData.energy_level}</span>
                    <span>Alto</span>
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
                    <span className="font-bold text-[#56CCF2] text-lg">{formData.sociability_level}</span>
                    <span>Social</span>
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
                    <span>Rebelde</span>
                    <span className="font-bold text-[#56CCF2] text-lg">{formData.obedience_level}</span>
                    <span>Obediente</span>
                  </div>
                </div>

                {/* Ansiedad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    😰 Ansiedad
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
                    <span>Relajado</span>
                    <span className="font-bold text-[#56CCF2] text-lg">{formData.anxiety_level}</span>
                    <span>Ansioso</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones rápidas */}
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Notas del día
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleTextChange('notes', e.target.value)}
                  placeholder="¿Cómo se comportó hoy? Observaciones generales..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⭐ Lo mejor del día
                  </label>
                  <textarea
                    value={formData.highlights}
                    onChange={(e) => handleTextChange('highlights', e.target.value)}
                    placeholder="¿Qué hizo especialmente bien?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⚠️ Aspectos a mejorar
                  </label>
                  <textarea
                    value={formData.concerns}
                    onChange={(e) => handleTextChange('concerns', e.target.value)}
                    placeholder="¿Algo que requiere atención?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Preview de notificaciones que se enviarán */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🔔 Vista previa de notificaciones automáticas:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                {formData.anxiety_level >= 8 && (
                  <div>• 🚨 Alerta de ansiedad alta → Se enviará recomendación de ejercicios de relajación</div>
                )}
                {formData.obedience_level <= 3 && (
                  <div>• 📚 Alerta de obediencia baja → Se enviará sugerencia de comandos de entrenamiento</div>
                )}
                {formData.energy_level >= 9 && (
                  <div>• ⚡ Alerta de energía muy alta → Se enviará recomendación de más ejercicio</div>
                )}
                {formData.obedience_level >= 8 && (
                  <div>• ✅ Felicitación por excelente obediencia → Se enviará mensaje positivo</div>
                )}
                {formData.sociability_level >= 8 && (
                  <div>• 🐕 Felicitación por excelente socialización → Se enviará mensaje positivo</div>
                )}
                {formData.anxiety_level < 8 && formData.obedience_level > 3 && formData.energy_level < 9 && formData.obedience_level < 8 && formData.sociability_level < 8 && (
                  <div>• 📊 Resumen general del día → Se enviará evaluación estándar</div>
                )}
              </div>
            </div>
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
              className="px-8 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Guardando...' : '⚡ Guardar y Notificar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickEvaluationForm;