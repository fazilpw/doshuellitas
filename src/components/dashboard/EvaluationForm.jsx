// src/components/dashboard/EvaluationForm.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';

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
    } catch (error) {
      console.error('Error fetching dog:', error);
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
      const evaluationData = {
        dog_id: dogId,
        evaluator_id: userId,
        location: userRole === 'profesor' ? 'colegio' : 'casa',
        date: new Date().toISOString().split('T')[0],
        ...formData
      };

      const { data, error } = await supabase
        .from('evaluations')
        .insert([evaluationData])
        .select()
        .single();

      if (error) throw error;

      console.log('Evaluación guardada:', data);
      if (onSave) onSave(data);
      if (onClose) onClose();

    } catch (error) {
      console.error('Error saving evaluation:', error);
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
                {userRole === 'profesor' ? '🏫 Evaluación en el colegio' : '🏠 Evaluación en casa'}
              </p>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">
                📊 Métricas Principales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⚡ Nivel de Energía: {formData.energy_level}/10
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
                    <span>Muy tranquilo</span>
                    <span>Muy activo</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🤝 Socialización: {formData.sociability_level}/10
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
                    <span>Muy sociable</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Obediencia: {formData.obedience_level}/10
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
                    <span>Muy obediente</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    😰 Nivel de Ansiedad: {formData.anxiety_level}/10
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
                    <span>Muy ansioso</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">
                🎭 Comportamientos Específicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔊 ¿Ladra mucho?
                  </label>
                  <select
                    value={formData.barks_much}
                    onChange={(e) => handleSelectChange('barks_much', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                  >
                    <option value="poco">Poco</option>
                    <option value="normal">Normal</option>
                    <option value="mucho">Mucho</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🍖 ¿Pide comida?
                  </label>
                  <select
                    value={formData.begs_food}
                    onChange={(e) => handleSelectChange('begs_food', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                  >
                    <option value="nunca">Nunca</option>
                    <option value="a_veces">A veces</option>
                    <option value="siempre">Siempre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💥 ¿Es destructivo?
                  </label>
                  <select
                    value={formData.destructive}
                    onChange={(e) => handleSelectChange('destructive', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                  >
                    <option value="nunca">Nunca</option>
                    <option value="a_veces">A veces</option>
                    <option value="frecuente">Frecuente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🐕‍🦺 Social con otros perros
                  </label>
                  <select
                    value={formData.social_with_dogs}
                    onChange={(e) => handleSelectChange('social_with_dogs', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                  >
                    <option value="poco">Poco social</option>
                    <option value="normal">Normal</option>
                    <option value="mucho">Muy social</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👥 ¿Te sigue por toda la casa?
                  </label>
                  <select
                    value={formData.follows_everywhere}
                    onChange={(e) => handleSelectChange('follows_everywhere', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                  >
                    <option value="no">No</option>
                    <option value="a_veces">A veces</option>
                    <option value="siempre">Siempre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🪟 ¿Vigila por la ventana?
                  </label>
                  <select
                    value={formData.window_watching}
                    onChange={(e) => handleSelectChange('window_watching', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                  >
                    <option value="poco">Poco</option>
                    <option value="normal">Normal</option>
                    <option value="mucho">Mucho</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Notas adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                placeholder={`Describe cómo estuvo ${dog.name} ${userRole === 'profesor' ? 'en el colegio' : 'en casa'} hoy...`}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end space-x-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#56CCF2] text-white rounded-md hover:bg-[#5B9BD5] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Guardando...
                </div>
              ) : (
                'Guardar Evaluación'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluationForm;