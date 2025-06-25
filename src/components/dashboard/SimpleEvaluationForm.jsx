// src/components/dashboard/SimpleEvaluationForm.jsx
// FORMULARIO DE EVALUACIÓN SIMPLIFICADO - FUNCIONA CON ExpandedAuthProvider
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/ExpandedAuthProvider.jsx';

const SimpleEvaluationForm = ({ dogId, onClose, onSave }) => {
  const { user, allDogs, saveEvaluation } = useAuth();
  
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
    ate_well: 'normal',
    bathroom_accidents: 'no',
    played_with_toys: 'si',
    responded_to_commands: 'bien',
    notes: '',
    highlights: '',
    concerns: ''
  });

  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Buscar perro en la lista del contexto
    const foundDog = allDogs.find(d => d.id === dogId);
    if (foundDog) {
      setDog(foundDog);
    } else {
      setError('Perro no encontrado');
    }
  }, [dogId, allDogs]);

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

  const handleTextChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const evaluationData = {
        dog_id: dogId,
        evaluator_id: user.id,
        location: user.role === 'padre' ? 'casa' : 'colegio',
        date: new Date().toISOString().split('T')[0],
        ...formData
      };

      console.log('💾 Guardando evaluación:', evaluationData);

      const savedEvaluation = await saveEvaluation(evaluationData);

      console.log('✅ Evaluación guardada:', savedEvaluation);
      setSuccess(true);
      
      // Llamar callback si existe
      if (onSave) {
        onSave(savedEvaluation);
      }

      // Auto-cerrar después de 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('❌ Error:', error);
      setError('Error al guardar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (error && !dog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="text-red-600 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-bold mb-2">Error</h3>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="text-green-600 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-bold mb-2">¡Evaluación Guardada!</h3>
            <p className="text-sm mb-4">
              La evaluación de {dog?.name} se guardó correctamente
            </p>
            <div className="text-xs text-gray-500">
              Cerrando automáticamente...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información del perro...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">📝 Evaluando a {dog.name}</h2>
              <p className="opacity-90">
                {dog.breed} • {user.role === 'padre' ? 'En Casa' : 'En el Colegio'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-75">Paso {step} de 4</div>
              <div className="w-16 h-2 bg-white/20 rounded-full mt-1">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${(step / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* PASO 1: Niveles Básicos */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                🎯 Niveles Básicos
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Energía: {formData.energy_level}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.energy_level}
                    onChange={(e) => handleSliderChange('energy_level', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Muy tranquilo</span>
                    <span>Muy energético</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sociabilidad: {formData.sociability_level}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.sociability_level}
                    onChange={(e) => handleSliderChange('sociability_level', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Tímido</span>
                    <span>Muy social</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Obediencia: {formData.obedience_level}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.obedience_level}
                    onChange={(e) => handleSliderChange('obedience_level', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Desobediente</span>
                    <span>Muy obediente</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Ansiedad: {formData.anxiety_level}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.anxiety_level}
                    onChange={(e) => handleSliderChange('anxiety_level', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Muy calmado</span>
                    <span>Muy ansioso</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Comportamientos */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                🐕 Comportamientos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Ladra mucho?
                  </label>
                  <select
                    value={formData.barks_much}
                    onChange={(e) => handleSelectChange('barks_much', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="poco">Poco</option>
                    <option value="normal">Normal</option>
                    <option value="mucho">Mucho</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Pide comida?
                  </label>
                  <select
                    value={formData.begs_food}
                    onChange={(e) => handleSelectChange('begs_food', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="nunca">Nunca</option>
                    <option value="a_veces">A veces</option>
                    <option value="siempre">Siempre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comportamiento destructivo
                  </label>
                  <select
                    value={formData.destructive}
                    onChange={(e) => handleSelectChange('destructive', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="nunca">Nunca</option>
                    <option value="a_veces">A veces</option>
                    <option value="frecuente">Frecuente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Social con otros perros
                  </label>
                  <select
                    value={formData.social_with_dogs}
                    onChange={(e) => handleSelectChange('social_with_dogs', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="poco">Poco</option>
                    <option value="normal">Normal</option>
                    <option value="mucho">Mucho</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Actividades del día */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📋 Actividades del Día
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Comió bien?
                  </label>
                  <select
                    value={formData.ate_well}
                    onChange={(e) => handleSelectChange('ate_well', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="excelente">Excelente</option>
                    <option value="normal">Normal</option>
                    <option value="poco">Poco</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accidentes de baño
                  </label>
                  <select
                    value={formData.bathroom_accidents}
                    onChange={(e) => handleSelectChange('bathroom_accidents', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="no">No</option>
                    <option value="uno">Uno</option>
                    <option value="varios">Varios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Jugó con juguetes?
                  </label>
                  <select
                    value={formData.played_with_toys}
                    onChange={(e) => handleSelectChange('played_with_toys', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="si">Sí</option>
                    <option value="poco">Poco</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Respuesta a comandos
                  </label>
                  <select
                    value={formData.responded_to_commands}
                    onChange={(e) => handleSelectChange('responded_to_commands', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="excelente">Excelente</option>
                    <option value="bien">Bien</option>
                    <option value="regular">Regular</option>
                    <option value="mal">Mal</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: Notas */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📝 Notas y Observaciones
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas generales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleTextChange('notes', e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder={`Describe cómo estuvo ${dog.name} hoy...`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspectos destacados
                  </label>
                  <textarea
                    value={formData.highlights}
                    onChange={(e) => handleTextChange('highlights', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="¿Qué hizo bien hoy?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preocupaciones
                  </label>
                  <textarea
                    value={formData.concerns}
                    onChange={(e) => handleTextChange('concerns', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="¿Algo que requiere atención?"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between border-t">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-[#56CCF2]  text-white rounded-lg hover:bg-[#5B9BD5]"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : '✅ Guardar Evaluación'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleEvaluationForm;