// src/components/dashboard/CompleteEvaluationForm.jsx - AUTO-CIERRE CORREGIDO
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
  const [success, setSuccess] = useState(false); // 🔧 NUEVO: Estado de éxito

  useEffect(() => {
    fetchDogInfo();
  }, [dogId]);

  const fetchDogInfo = async () => {
    try {
      console.log('🔍 Buscando perro con ID:', dogId);
      
      const { data, error } = await supabase
        .from('dogs')
        .select('*') // Query simplificada sin JOIN
        .eq('id', dogId)
        .single();
      
      if (error) {
        console.error('❌ Error en query:', error);
        throw error;
      }
      
      console.log('✅ Perro encontrado:', data);
      setDog(data);
    } catch (error) {
      console.error('❌ Error fetching dog:', error);
      setError('Error al cargar información del perro: ' + error.message);
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

  const handleTextChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (step < totalSteps) {
      setStep(step + 1);
      console.log(`Avanzando al paso ${step + 1}`);
    }
  };

  const prevStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (step > 1) {
      setStep(step - 1);
      console.log(`Retrocediendo al paso ${step - 1}`);
    }
  };

  // 🔧 FUNCIÓN CORREGIDA - Auto-cierre mejorado
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (step !== totalSteps) {
      console.log(`No enviando - estamos en paso ${step}, necesitamos estar en paso ${totalSteps}`);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Enviando evaluación final...');
      
      const evaluationData = {
        dog_id: dogId,
        evaluator_id: userId,
        location: userRole === 'profesor' ? 'colegio' : 'casa',
        date: new Date().toISOString().split('T')[0],
        ...formData
      };

      console.log('📤 Datos a enviar:', evaluationData);

      const { data, error } = await supabase
        .from('evaluations')
        .insert([evaluationData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Evaluación guardada:', data);
      
      // 🔧 NUEVO: Mostrar éxito y cerrar automáticamente
      setSuccess(true);
      
      // 🔧 NUEVO: Ejecutar callbacks antes de cerrar
      if (onSave) {
        console.log('📞 Ejecutando onSave callback...');
        onSave(data);
      }
      
      // 🔧 NUEVO: Cerrar automáticamente después de 1.5 segundos
      setTimeout(() => {
  console.log('🚪 Cerrando formulario automáticamente...');
  console.log('📞 onClose función:', typeof onClose, onClose);
  if (onClose && typeof onClose === 'function') {
    console.log('✅ Ejecutando onClose...');
    onClose();
  } else {
    console.error('❌ onClose no es una función válida');
    // Fallback: recargar página
    window.location.reload();
  }
}, 1500);

    } catch (error) {
      console.error('❌ Error saving evaluation:', error);
      setError(error.message || 'Error al guardar evaluación');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Botón de envío final presionado');
    await handleSubmit(e);
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return '📊 Métricas Principales';
      case 2: return '🎭 Comportamientos Observados';
      case 3: return '🍽️ Actividades y Hábitos';
      case 4: return '📝 Notas y Observaciones';
      default: return 'Evaluación';
    }
  };

  // 🔧 NUEVO: Mostrar pantalla de éxito
  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">¡Evaluación Guardada!</h3>
          <p className="text-gray-600 mb-4">
            La evaluación de {dog?.name} se guardó correctamente.
          </p>
          <div className="text-sm text-gray-500">
            Cerrando automáticamente...
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si hay problemas cargando el perro
  if (error && !dog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Error al cargar</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
          <p>Cargando información del perro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header con progreso */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#2C3E50]">
                Evaluar a {dog.name} 🐕
              </h2>
              <p className="text-gray-600">
                {userRole === 'profesor' ? 'Evaluación en el colegio' : 'Evaluación en casa'}
              </p>
            </div>
            <button
  onClick={() => {
    console.log('🎯 Botón X presionado');
    if (onClose && typeof onClose === 'function') {
      onClose();
    } else {
      console.error('❌ onClose no funciona, recargando...');
      window.location.reload();
    }
  }}
  className="text-gray-400 hover:text-gray-600 text-2xl"
>
              ✕
            </button>
          </div>

          {/* Barra de progreso */}
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`
                  w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-medium
                  ${step >= stepNum 
                    ? 'bg-[#56CCF2] text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`
                    w-12 h-1 mx-2
                    ${step > stepNum ? 'bg-[#56CCF2]' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          
          <h3 className="text-lg font-medium mt-4 text-[#2C3E50]">
            {getStepTitle()}
          </h3>
        </div>

        {/* Contenido del formulario */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* PASO 1: Métricas Principales */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span>Muy bajo</span>
                    <span>Muy alto</span>
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
                    <span>Tímido</span>
                    <span>Muy social</span>
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
                    <span>Desobediente</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Ladra mucho?
                  </label>
                  <select
                    value={formData.barks_much}
                    onChange={(e) => handleSelectChange('barks_much', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                  >
                    <option value="poco">Poco social</option>
                    <option value="normal">Normal</option>
                    <option value="mucho">Muy social</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Actividades */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Comió bien?
                  </label>
                  <select
                    value={formData.ate_well}
                    onChange={(e) => handleSelectChange('ate_well', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas generales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleTextChange('notes', e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                  placeholder="Describe el comportamiento general del día..."
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                  placeholder="¿Algo que requiere atención?"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-white text-base border-t border-gray-200 px-3 py-2">
          <div className="flex justify-between">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-500 text-white text-sm md:tex-xl py-2 px-4 md:py-2 md:px-6 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← Anterior
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 text-gray-700  text-sm md:tex-xl py-2 px-4 md:py-2 md:px-6 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-[#56CCF2] text-white  text-sm md:tex-xl py-2 px-4 md:py-2 md:px-6 rounded-lg hover:bg-[#5B9BD5] transition-colors"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="bg-green-600 text-white text-sm md:tex-xl py-2 px-4 md:py-2 md:px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando' : '✅ Guardar '}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteEvaluationForm;