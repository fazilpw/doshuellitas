// src/components/dashboard/CompleteEvaluationForm.jsx - QUERY CORREGIDO
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const CompleteEvaluationForm = ({ dogId, userId, userRole, onClose, onSave }) => {
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
    interaction_quality: 'positiva',
    notes: '',
    highlights: '',
    concerns: ''
  });

  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [totalSteps] = useState(4);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (dogId) {
      fetchDogInfo();
    }
  }, [dogId]);

  // ===============================================
  // 🔧 QUERY ARREGLADO - SIN .single()
  // ===============================================

  const fetchDogInfo = async () => {
    try {
      setError(''); // Limpiar error anterior
      console.log('🔍 Buscando perro con ID:', dogId);
      
      // Query SIN .single() para evitar el error
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', dogId);
      
      if (error) {
        console.error('❌ Error en query:', error);
        throw new Error(`Error consultando base de datos: ${error.message}`);
      }
      
      console.log('📊 Resultados encontrados:', data?.length || 0);
      
      if (!data || data.length === 0) {
        throw new Error('Perro no encontrado en la base de datos');
      }
      
      if (data.length > 1) {
        console.warn('⚠️ Múltiples perros encontrados, usando el primero');
      }
      
      const dogData = data[0]; // Usar el primer resultado
      console.log('✅ Perro encontrado:', dogData);
      setDog(dogData);
      
    } catch (error) {
      console.error('❌ Error fetching dog:', error);
      setError(error.message);
    }
  };

  // ===============================================
  // 🎛️ HANDLERS DE FORMULARIO
  // ===============================================

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
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // ===============================================
  // 💾 GUARDAR EVALUACIÓN
  // ===============================================

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const evaluationData = {
        dog_id: dogId,
        evaluator_id: userId,
        location: userRole === 'padre' ? 'casa' : 'colegio',
        date: new Date().toISOString().split('T')[0],
        ...formData
      };

      console.log('💾 Guardando evaluación:', evaluationData);

      const { data, error } = await supabase
        .from('evaluations')
        .insert(evaluationData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Evaluación guardada:', data);
      setSuccess(true);

      // Llamar callback si existe
      if (onSave) {
        onSave(data);
      }

      // Auto-cerrar después de 2 segundos
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('❌ Error guardando evaluación:', error);
      setError('Error guardando evaluación: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🚪 FUNCIÓN DE CIERRE MEJORADA
  // ===============================================

  const handleClose = () => {
    setError(''); // Limpiar errores
    setSuccess(false);
    setStep(1);
    
    if (onClose) {
      onClose();
    }
  };

  // ===============================================
  // 🎨 RENDER DEL COMPONENTE
  // ===============================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#56CCF2] text-white p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            type="button"
          >
            ×
          </button>
          
          <h2 className="text-2xl font-bold">
            {dog ? `Evaluar a ${dog.name}` : 'Evaluación Canina'}
          </h2>
          
          {dog && (
            <p className="text-[#ACF0F4] mt-1">
              {dog.breed} • {dog.size} • {dog.age} años
            </p>
          )}
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Paso {step} de {totalSteps}</span>
              <span>{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex">
                  <div className="text-red-400 text-xl mr-3">⚠️</div>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Error al cargar
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600 text-xl font-bold ml-4"
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-green-400 text-xl mr-3">✅</div>
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    ¡Evaluación Guardada!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    La evaluación se ha guardado correctamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Steps */}
          {!error && dog && (
            <div>
              {/* Aquí irían los pasos del formulario */}
              {step === 1 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Paso 1: Niveles Básicos</h3>
                  {/* Contenido del paso 1 */}
                  <div className="space-y-4">
                    
                    {/* Energía */}
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
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Muy tranquilo</span>
                        <span>Muy energético</span>
                      </div>
                    </div>

                    {/* Sociabilidad */}
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
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Muy tímido</span>
                        <span>Muy sociable</span>
                      </div>
                    </div>

                    {/* Obediencia */}
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
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>No obedece</span>
                        <span>Muy obediente</span>
                      </div>
                    </div>

                    {/* Ansiedad */}
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
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Muy relajado</span>
                        <span>Muy ansioso</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Más pasos aquí... */}
              {step > 1 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">Paso {step} en desarrollo...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!error && dog && (
          <div className="bg-gray-50 px-6 py-4 flex justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Anterior
            </button>
            
            {step < totalSteps ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] transition-colors"
                type="button"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                type="button"
              >
                {loading ? 'Guardando...' : 'Guardar Evaluación'}
              </button>
            )}
          </div>
        )}

        {/* Cerrar solo con error */}
        {error && (
          <div className="bg-gray-50 px-6 py-4 text-center">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              type="button"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteEvaluationForm;