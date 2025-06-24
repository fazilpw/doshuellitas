// src/components/dashboard/QuickEvaluationForm.jsx - EVALUACIÓN RÁPIDA ✅
import { useState } from 'react';
import supabase from '../../lib/supabase.js';

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

      const { data, error } = await supabase
        .from('evaluations')
        .insert([evaluationData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error guardando evaluación:', error);
        alert('Error al guardar la evaluación. Inténtalo de nuevo.');
        return;
      }

      console.log('✅ Evaluación guardada exitosamente:', data);
      alert(`✅ Evaluación de ${dog.name} guardada exitosamente`);
      
      if (onSave) {
        onSave(data);
      }

    } catch (error) {
      console.error('❌ Error en submit:', error);
      alert('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getSliderColor = (value) => {
    if (value <= 3) return 'text-red-600';
    if (value <= 6) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSliderBg = (value) => {
    if (value <= 3) return 'bg-red-500';
    if (value <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#C7EA46] text-white px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">📝 Evaluación Rápida - {dog.name}</h2>
              <p className="opacity-90 text-sm">
                {dog.breed} • {dog.size} • Evaluación en Colegio
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl"
              disabled={loading}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            
            {/* Métricas principales con sliders */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">📊 Comportamiento en el Colegio</h3>
              
              {/* Energía */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⚡ Nivel de Energía
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Bajo</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.energy_level}
                      onChange={(e) => handleSliderChange('energy_level', e.target.value)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                      style={{
                        background: `linear-gradient(to right, ${getSliderBg(formData.energy_level)} 0%, ${getSliderBg(formData.energy_level)} ${formData.energy_level * 10}%, #e5e7eb ${formData.energy_level * 10}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">Alto</span>
                  <span className={`text-lg font-bold min-w-[3rem] ${getSliderColor(formData.energy_level)}`}>
                    {formData.energy_level}/10
                  </span>
                </div>
              </div>

              {/* Sociabilidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🤝 Sociabilidad
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Tímido</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.sociability_level}
                      onChange={(e) => handleSliderChange('sociability_level', e.target.value)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                      style={{
                        background: `linear-gradient(to right, ${getSliderBg(formData.sociability_level)} 0%, ${getSliderBg(formData.sociability_level)} ${formData.sociability_level * 10}%, #e5e7eb ${formData.sociability_level * 10}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">Social</span>
                  <span className={`text-lg font-bold min-w-[3rem] ${getSliderColor(formData.sociability_level)}`}>
                    {formData.sociability_level}/10
                  </span>
                </div>
              </div>

              {/* Obediencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 Obediencia
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Rebelde</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.obedience_level}
                      onChange={(e) => handleSliderChange('obedience_level', e.target.value)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                      style={{
                        background: `linear-gradient(to right, ${getSliderBg(formData.obedience_level)} 0%, ${getSliderBg(formData.obedience_level)} ${formData.obedience_level * 10}%, #e5e7eb ${formData.obedience_level * 10}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">Obediente</span>
                  <span className={`text-lg font-bold min-w-[3rem] ${getSliderColor(formData.obedience_level)}`}>
                    {formData.obedience_level}/10
                  </span>
                </div>
              </div>

              {/* Ansiedad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  😰 Nivel de Ansiedad
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Calmado</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.anxiety_level}
                      onChange={(e) => handleSliderChange('anxiety_level', e.target.value)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                      style={{
                        background: `linear-gradient(to right, ${getSliderBg(10 - formData.anxiety_level)} 0%, ${getSliderBg(10 - formData.anxiety_level)} ${formData.anxiety_level * 10}%, #e5e7eb ${formData.anxiety_level * 10}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">Ansioso</span>
                  <span className={`text-lg font-bold min-w-[3rem] ${getSliderColor(10 - formData.anxiety_level)}`}>
                    {formData.anxiety_level}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Notas rápidas */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">📝 Observaciones del Día</h3>
              
              {/* Aspectos destacados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ✨ Aspectos destacados
                </label>
                <textarea
                  value={formData.highlights}
                  onChange={(e) => handleTextChange('highlights', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#56CCF2] resize-none"
                  rows="2"
                  placeholder="Ej: Jugó muy bien con otros perros, respondió excelente a comandos..."
                />
              </div>

              {/* Preocupaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ⚠️ Preocupaciones o áreas de mejora
                </label>
                <textarea
                  value={formData.concerns}
                  onChange={(e) => handleTextChange('concerns', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#56CCF2] resize-none"
                  rows="2"
                  placeholder="Ej: Estuvo un poco ansioso al inicio, necesita trabajar en el comando 'quieto'..."
                />
              </div>

              {/* Notas generales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📋 Notas generales del día
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleTextChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#56CCF2] resize-none"
                  rows="3"
                  placeholder="Comportamiento general, interacciones, aprendizajes del día..."
                />
              </div>
            </div>

            {/* Resumen visual */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">📊 Resumen de la Evaluación</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>⚡ Energía:</span>
                    <span className={`font-bold ${getSliderColor(formData.energy_level)}`}>
                      {formData.energy_level}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🤝 Sociabilidad:</span>
                    <span className={`font-bold ${getSliderColor(formData.sociability_level)}`}>
                      {formData.sociability_level}/10
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>🎯 Obediencia:</span>
                    <span className={`font-bold ${getSliderColor(formData.obedience_level)}`}>
                      {formData.obedience_level}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>😰 Ansiedad:</span>
                    <span className={`font-bold ${getSliderColor(10 - formData.anxiety_level)}`}>
                      {formData.anxiety_level}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer con botones */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Evaluación para {dog.name} • Fecha: {new Date().toLocaleDateString('es-CO')}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#56CCF2] text-white px-6 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  '✅ Guardar Evaluación'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickEvaluationForm;