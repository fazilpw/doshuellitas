// src/components/evaluation/CompleteEvaluationForm.jsx
// 🔔 VERSIÓN CON NOTIFICACIONES AUTOMÁTICAS INTEGRADAS

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';
import { NotificationHelper } from '../../utils/notificationHelper.js'; // ✅ NUEVO IMPORT

const CompleteEvaluationForm = ({ dog, userId, userRole, onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dogData, setDogData] = useState(dog); // ✅ NUEVO: Estado para datos completos del perro

  const [formData, setFormData] = useState({
    // Métricas principales (Step 1)
    energy_level: 5,
    sociability_level: 5,
    obedience_level: 5,
    anxiety_level: 5,
    
    // Comportamientos observados (Step 2)
    barks_much: 'normal',
    social_with_dogs: 'normal',
    follows_everywhere: 'a_veces',
    window_watching: 'normal',
    
    // Actividades y hábitos (Step 3)
    begs_food: 'a_veces',
    eating_speed: 'normal',
    destructive: 'nunca',
    bathroom_behavior: 'bien',
    
    // Notas y observaciones (Step 4)
    notes: '',
    highlights: '',
    concerns: ''
  });

  // ✅ NUEVO: Obtener datos completos del perro al cargar
  useEffect(() => {
    if (dog?.id && !dogData?.owner_id) {
      fetchCompleteDogData();
    }
  }, [dog?.id]);

  const fetchCompleteDogData = async () => {
    try {
      console.log('🔍 Obteniendo datos completos del perro:', dog.id);
      
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', dog.id)
        .single();

      if (error) throw error;
      
      console.log('✅ Datos del perro obtenidos:', data);
      setDogData(data);
      
    } catch (error) {
      console.error('❌ Error obteniendo datos del perro:', error);
      // Continuar con los datos básicos que ya tenemos
      setDogData(dog);
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

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Enviando evaluación completa...');
    setLoading(true);
    setError('');

    try {
      // 📝 Preparar datos de evaluación
      const evaluationData = {
        dog_id: dog.id,
        evaluator_id: userId,
        location: userRole === 'profesor' ? 'colegio' : 'casa',
        date: new Date().toISOString().split('T')[0],
        ...formData
      };

      console.log('📤 Datos a enviar:', evaluationData);

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
        
        // Asegurar que tenemos los datos del perro
        const perroParaNotificaciones = dogData || dog;
        
        if (perroParaNotificaciones && data) {
          await NotificationHelper.checkBehaviorAlertsAfterEvaluation(
            data,           // evaluación recién guardada
            perroParaNotificaciones,  // datos del perro
            userId          // ID del evaluador
          );
          console.log('✅ Notificaciones automáticas procesadas');
        } else {
          console.warn('⚠️ Datos insuficientes para notificaciones automáticas');
        }
        
      } catch (notificationError) {
        console.error('❌ Error en notificaciones automáticas:', notificationError);
        // No fallar la evaluación por errores de notificación
      }
      
      // 🔧 Mostrar éxito y cerrar automáticamente
      setSuccess(true);
      
      // 🔧 Ejecutar callbacks antes de cerrar
      if (onSave) {
        console.log('📞 Ejecutando onSave callback...');
        onSave(data);
      }
      
      // 🔧 Cerrar automáticamente después de 2 segundos
      setTimeout(() => {
        console.log('🚪 Cerrando formulario automáticamente...');
        if (onClose && typeof onClose === 'function') {
          console.log('✅ Ejecutando onClose...');
          onClose();
        } else {
          console.error('❌ onClose no es una función válida');
          window.location.reload();
        }
      }, 2000);

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

  // 🔧 Pantalla de éxito
  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">¡Evaluación Guardada!</h3>
          <p className="text-gray-600 mb-4">
            La evaluación de {dog?.name} se guardó correctamente.
          </p>
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            🔔 <strong>¡Notificaciones automáticas activadas!</strong><br/>
            Revisa tu dashboard para ver alertas personalizadas.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#2C3E50]">
              {getStepTitle()}
            </h2>
            <p className="text-gray-600">
              Evaluando a <strong>{dog?.name}</strong> • {userRole === 'profesor' ? 'En el colegio' : 'En casa'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Paso {step} de 4</span>
            <span className="text-sm text-gray-500">{Math.round((step / 4) * 100)}% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#56CCF2] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleFinalSubmit}>
          <div className="p-6">
            
            {/* STEP 1: Métricas Principales */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Nivel de Energía */}
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Muy bajo (1)</span>
                      <span className="font-bold text-[#56CCF2]">{formData.energy_level}</span>
                      <span>Muy alto (10)</span>
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Tímido (1)</span>
                      <span className="font-bold text-[#56CCF2]">{formData.sociability_level}</span>
                      <span>Muy social (10)</span>
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Desobediente (1)</span>
                      <span className="font-bold text-[#56CCF2]">{formData.obedience_level}</span>
                      <span>Muy obediente (10)</span>
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Muy relajado (1)</span>
                      <span className="font-bold text-[#56CCF2]">{formData.anxiety_level}</span>
                      <span>Muy ansioso (10)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Comportamientos Observados */}
            {step === 2 && (
              <div className="space-y-6">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👥 ¿Te sigue a todas partes?
                    </label>
                    <select
                      value={formData.follows_everywhere}
                      onChange={(e) => handleSelectChange('follows_everywhere', e.target.value)}
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
                      🪟 Vigilancia en ventanas
                    </label>
                    <select
                      value={formData.window_watching}
                      onChange={(e) => handleSelectChange('window_watching', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    >
                      <option value="nunca">Nunca</option>
                      <option value="poco">Poco</option>
                      <option value="normal">Normal</option>
                      <option value="mucho">Mucho</option>
                      <option value="obsesivo">Obsesivo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Actividades y Hábitos */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
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
                      🥘 Velocidad al comer
                    </label>
                    <select
                      value={formData.eating_speed}
                      onChange={(e) => handleSelectChange('eating_speed', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    >
                      <option value="muy_lento">Muy lento</option>
                      <option value="normal">Normal</option>
                      <option value="rapido">Rápido</option>
                      <option value="voraz">Voraz/tragón</option>
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
                      🚽 Hábitos de baño
                    </label>
                    <select
                      value={formData.bathroom_behavior}
                      onChange={(e) => handleSelectChange('bathroom_behavior', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    >
                      <option value="excelente">Excelente</option>
                      <option value="bien">Bien</option>
                      <option value="regular">Regular</option>
                      <option value="problemas">Con problemas</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Notas y Observaciones */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Notas adicionales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleTextChange('notes', e.target.value)}
                    placeholder="Observaciones generales sobre el comportamiento..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⭐ Aspectos destacados
                  </label>
                  <textarea
                    value={formData.highlights}
                    onChange={(e) => handleTextChange('highlights', e.target.value)}
                    placeholder="¿Qué hizo especialmente bien hoy?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⚠️ Preocupaciones
                  </label>
                  <textarea
                    value={formData.concerns}
                    onChange={(e) => handleTextChange('concerns', e.target.value)}
                    placeholder="¿Algo que requiera atención especial?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">❌ {error}</p>
              </div>
            )}
          </div>

          {/* Footer con botones */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between">
            
            {/* Botón anterior */}
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>

            {/* Botón siguiente/enviar */}
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#2C3E50] transition-colors"
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Guardando...' : '✅ Guardar Evaluación'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteEvaluationForm;