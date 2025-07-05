// src/components/dashboard/CompleteEvaluationForm.jsx
// 🔔 FORMULARIO COMPLETO DE EVALUACIÓN - SOLUCIÓN FINAL ✅
// ✅ CORRECCIÓN: Usar funciones que SÍ EXISTEN en notificationHelper.js

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';
import { notifyEvaluationCompleted } from '../../utils/managerIntegrations.js';

const CompleteEvaluationForm = ({ dogId, userId, userRole, onClose, onSave }) => {
  // ===============================================
  // 🎯 ESTADOS PRINCIPALES
  // ===============================================
  const [formData, setFormData] = useState({
    // Métricas principales (Paso 1)
    energy_level: 5,
    sociability_level: 5,
    obedience_level: 5,
    anxiety_level: 5,
    
    // Comportamientos observados (Paso 2)
    barks_much: 'normal',
    begs_food: 'a_veces',
    destructive: 'nunca',
    social_with_dogs: 'normal',
    follows_everywhere: 'a_veces',
    window_watching: 'normal',
    
    // Actividades y hábitos (Paso 3)
    ate_well: 'normal',
    bathroom_accidents: 'no',
    played_with_toys: 'si',
    responded_to_commands: 'bien',
    interaction_quality: 'positiva',
    
    // Notas y observaciones (Paso 4)
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

  // ===============================================
  // 🔄 EFECTOS DE INICIALIZACIÓN
  // ===============================================
  useEffect(() => {
    if (dogId) {
      fetchDogInfo();
    }
  }, [dogId]);

  // ===============================================
  // 📊 CARGAR DATOS DEL PERRO
  // ===============================================
  const fetchDogInfo = async () => {
    try {
      setError('');
      console.log('🔍 Cargando información del perro:', dogId);
      
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          profiles!dogs_owner_id_fkey(full_name, email, role)
        `)
        .eq('id', dogId);
      
      if (error) {
        console.error('❌ Error consultando perro:', error);
        throw new Error(`Error en base de datos: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('Perro no encontrado');
      }
      
      const dogData = data[0];
      console.log('✅ Perro cargado:', dogData.name);
      setDog(dogData);
      
    } catch (error) {
      console.error('❌ Error cargando perro:', error);
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

  // ===============================================
  // 💾 GUARDAR EVALUACIÓN CON NOTIFICACIONES - ✅ CORREGIDO
  // ===============================================
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

      console.log('📊 Datos de evaluación:', evaluationData);

      // 1. GUARDAR EVALUACIÓN EN BD
      const { data: savedEvaluation, error: saveError } = await supabase
        .from('evaluations')
        .insert([evaluationData])
        .select(`
          *,
          dogs(id, name, breed, owner_id),
          profiles!evaluations_evaluator_id_fkey(full_name, email, role)
        `)
        .single();

      if (saveError) {
        console.error('❌ Error guardando evaluación:', saveError);
        throw saveError;
      }

      console.log('✅ Evaluación guardada exitosamente:', savedEvaluation);

      // 2. 🆕 PROCESAR NOTIFICACIONES AUTOMÁTICAS + CRUZADAS - ✅ CORREGIDO
      try {
        console.log('🔔 Procesando notificaciones con managerIntegrations...');
        
        const notificationResults = await notifyEvaluationCompleted(
          savedEvaluation,
          savedEvaluation.dogs || dog,
          userId
        );
        
        console.log('✅ Notificaciones procesadas:', notificationResults);
        
      } catch (notificationError) {
        console.warn('⚠️ Error procesando notificaciones (evaluación guardada exitosamente):', notificationError);
      }

      // 3. ✅ MARCAR COMO EXITOSO Y CERRAR
      setSuccess(true);
      console.log('✅ Evaluación completada exitosamente');
      
      // Callback al componente padre
      if (onSave) {
        onSave(savedEvaluation);
      }
      
      // Auto-cerrar después de 1 segundo
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      setError(`Error guardando evaluación: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🧪 FUNCIÓN DE PRUEBA CORREGIDA - ✅ USANDO FUNCIONES QUE SÍ EXISTEN
  // ===============================================
  const testCrossNotifications = async () => {
    try {
      console.log('🧪 Probando notificaciones cruzadas...');
      
      if (!dogId || !userId) {
        alert('❌ Faltan datos: dogId o userId');
        return;
      }

      // ✅ CORREGIDO: Usar funciones que SÍ existen
      const { NotificationHelper } = await import('../../utils/notificationHelper.js');
      
      // ✅ OPCIÓN 1: Usar testOptimizedNotificationFlow (que SÍ existe)
      const result = await NotificationHelper.testOptimizedNotificationFlow(
        userId, 
        dogId, 
        dog?.name || 'Max'
      );
      
      console.log('✅ Prueba completada:', result);
      alert(`✅ Prueba completada!\n- Alertas de comportamiento: ${result.behaviorAlerts?.length || 0}\n- Notificaciones cruzadas: ${result.crossRoleNotifications?.length || 0}\n- Mejoras detectadas: ${result.improvementNotifications?.length || 0}`);
      
    } catch (error) {
      console.error('❌ Error en prueba:', error);
      
      // ✅ FALLBACK: Usar createTestNotification si la función anterior falla
      try {
        console.log('🔄 Intentando con createTestNotification...');
        const { createTestNotification } = await import('../../utils/notificationHelper.js');
        
        const testResult = await createTestNotification(userId, dogId, 'behavior');
        console.log('✅ Notificación de prueba creada:', testResult);
        alert('✅ Notificación de prueba creada exitosamente!');
        
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        alert('❌ Error en la prueba: ' + error.message);
      }
    }
  };

  // ===============================================
  // 🎨 FUNCIONES DE RENDERIZADO (MANTENER IGUAL)
  // ===============================================
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Paso 1: Métricas Principales</h3>
        <p className="text-gray-600">Evalúa el comportamiento general de {dog?.name}</p>
      </div>

      {/* Nivel de Energía */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          ⚡ Nivel de Energía: {formData.energy_level}/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.energy_level}
          onChange={(e) => handleSliderChange('energy_level', e.target.value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Muy calmado</span>
          <span>Muy energético</span>
        </div>
      </div>

      {/* Sociabilidad */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          😊 Sociabilidad: {formData.sociability_level}/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.sociability_level}
          onChange={(e) => handleSliderChange('sociability_level', e.target.value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Muy tímido</span>
          <span>Muy sociable</span>
        </div>
      </div>

      {/* Obediencia */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          🎯 Obediencia: {formData.obedience_level}/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.obedience_level}
          onChange={(e) => handleSliderChange('obedience_level', e.target.value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>No obedece</span>
          <span>Muy obediente</span>
        </div>
      </div>

      {/* Ansiedad */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          😰 Nivel de Ansiedad: {formData.anxiety_level}/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.anxiety_level}
          onChange={(e) => handleSliderChange('anxiety_level', e.target.value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Muy relajado</span>
          <span>Muy ansioso</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Paso 2: Comportamientos Observados</h3>
        <p className="text-gray-600">¿Cómo se comportó {dog?.name} hoy?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ladridos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🔊 ¿Ladró mucho?
          </label>
          <select
            value={formData.barks_much}
            onChange={(e) => handleSelectChange('barks_much', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          >
            <option value="nunca">Nunca</option>
            <option value="poco">Poco</option>
            <option value="normal">Normal</option>
            <option value="mucho">Mucho</option>
            <option value="excesivo">Excesivo</option>
          </select>
        </div>

        {/* Mendicidad de comida */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🍖 ¿Pidió comida?
          </label>
          <select
            value={formData.begs_food}
            onChange={(e) => handleSelectChange('begs_food', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          >
            <option value="nunca">Nunca</option>
            <option value="a_veces">A veces</option>
            <option value="frecuentemente">Frecuentemente</option>
            <option value="constantemente">Constantemente</option>
          </select>
        </div>

        {/* Destructividad */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            💥 ¿Fue destructivo?
          </label>
          <select
            value={formData.destructive}
            onChange={(e) => handleSelectChange('destructive', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          >
            <option value="nunca">Nunca</option>
            <option value="leve">Leve</option>
            <option value="moderado">Moderado</option>
            <option value="severo">Severo</option>
          </select>
        </div>

        {/* Socialización con otros perros */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🐕 ¿Cómo se llevó con otros perros?
          </label>
          <select
            value={formData.social_with_dogs}
            onChange={(e) => handleSelectChange('social_with_dogs', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          >
            <option value="muy_bien">Muy bien</option>
            <option value="bien">Bien</option>
            <option value="normal">Normal</option>
            <option value="tímido">Tímido</option>
            <option value="agresivo">Agresivo</option>
          </select>
        </div>

        {/* Seguimiento */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            👣 ¿Te siguió a todas partes?
          </label>
          <select
            value={formData.follows_everywhere}
            onChange={(e) => handleSelectChange('follows_everywhere', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          >
            <option value="nunca">Nunca</option>
            <option value="a_veces">A veces</option>
            <option value="frecuentemente">Frecuentemente</option>
            <option value="constantemente">Constantemente</option>
          </select>
        </div>

        {/* Observación por la ventana */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🪟 ¿Vigiló por la ventana?
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
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Paso 3: Actividades y Hábitos</h3>
        <p className="text-gray-600">Rutinas diarias de {dog?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alimentación */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🍽️ ¿Comió bien?
          </label>
          <select
            value={formData.ate_well}
            onChange={(e) => handleSelectChange('ate_well', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          >
            <option value="excelente">Excelente</option>
            <option value="bien">Bien</option>
            <option value="normal">Normal</option>
            <option value="poco">Poco</option>
            <option value="nada">No comió</option>
          </select>
        </div>

        {/* Accidentes de baño */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🚽 ¿Tuvo accidentes de baño?
          </label>
          <select
            value={formData.bathroom_accidents}
            onChange={(e) => handleSelectChange('bathroom_accidents', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          >
            <option value="no">No</option>
            <option value="uno">Uno</option>
            <option value="varios">Varios</option>
            <option value="muchos">Muchos</option>
          </select>
        </div>

        {/* Juego con juguetes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🎾 ¿Jugó con juguetes?
          </label>
          <select
            value={formData.played_with_toys}
            onChange={(e) => handleSelectChange('played_with_toys', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          >
            <option value="si">Sí</option>
            <option value="poco">Poco</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Respuesta a comandos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📢 ¿Respondió a comandos?
          </label>
          <select
            value={formData.responded_to_commands}
            onChange={(e) => handleSelectChange('responded_to_commands', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          >
            <option value="excelente">Excelente</option>
            <option value="bien">Bien</option>
            <option value="regular">Regular</option>
            <option value="mal">Mal</option>
            <option value="no_respondio">No respondió</option>
          </select>
        </div>

        {/* Calidad de interacción */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            💝 Calidad general de la interacción
          </label>
          <select
            value={formData.interaction_quality}
            onChange={(e) => handleSelectChange('interaction_quality', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          >
            <option value="excelente">Excelente</option>
            <option value="muy_positiva">Muy positiva</option>
            <option value="positiva">Positiva</option>
            <option value="neutral">Neutral</option>
            <option value="negativa">Negativa</option>
            <option value="muy_negativa">Muy negativa</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Paso 4: Notas y Observaciones</h3>
        <p className="text-gray-600">Comparte detalles adicionales sobre {dog?.name}</p>
      </div>

      {/* Notas generales */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Notas generales
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleTextChange('notes', e.target.value)}
          placeholder="Describe cualquier comportamiento específico, situaciones especiales, o detalles importantes..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          rows="4"
        />
      </div>

      {/* Aspectos destacados */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          ⭐ Aspectos positivos destacados
        </label>
        <textarea
          value={formData.highlights}
          onChange={(e) => handleTextChange('highlights', e.target.value)}
          placeholder="¿Qué hizo muy bien hoy? ¿Qué comportamientos fueron excelentes?"
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          rows="3"
        />
      </div>

      {/* Preocupaciones */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          ⚠️ Preocupaciones o áreas de mejora
        </label>
        <textarea
          value={formData.concerns}
          onChange={(e) => handleTextChange('concerns', e.target.value)}
          placeholder="¿Hay algún comportamiento que necesite atención? ¿Algo preocupante?"
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          rows="3"
        />
      </div>

      {/* Resumen visual */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">📊 Resumen de la evaluación</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Energía:</span>
            <span className="font-medium ml-2">{formData.energy_level}/10</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Sociabilidad:</span>
            <span className="font-medium ml-2">{formData.sociability_level}/10</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Obediencia:</span>
            <span className="font-medium ml-2">{formData.obedience_level}/10</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Ansiedad:</span>
            <span className="font-medium ml-2">{formData.anxiety_level}/10</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ===============================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ===============================================
  if (!dogId || !userId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
       <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

          <div className="p-6 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600">Faltan datos necesarios para la evaluación</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Evaluación Completa</h2>
              <p className="opacity-90">
                {dog ? `${dog.name} - ${dog.breed}` : 'Cargando información...'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Progress indicator */}
              <div className="text-right">
                <div className="text-sm opacity-75">Paso {step} de {totalSteps}</div>
                <div className="w-24 bg-white/20 rounded-full h-2 mt-1">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300" 
                    style={{width: `${(step / totalSteps) * 100}%`}}
                  ></div>
                </div>
              </div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cerrar
              </button>
            </div>
          ) : success ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-green-900 mb-2">¡Evaluación Completada!</h3>
              <p className="text-green-600">
                La evaluación de {dog?.name} se guardó exitosamente
              </p>
            </div>
          ) : loading ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Guardando evaluación...</h3>
              <p className="text-gray-600">Procesando datos y enviando notificaciones...</p>
            </div>
          ) : !dog ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cargando...</h3>
              <p className="text-gray-600">Obteniendo información del perro...</p>
            </div>
          ) : (
<div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        {!error && dog && !success && !loading && (
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            
            {/* Botón anterior */}
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              ← Anterior
            </button>

            {/* ✅ BOTÓN DE PRUEBA CORREGIDO */}
            {process.env.NODE_ENV === 'development' && (
              <button
                type="button"
                onClick={testCrossNotifications}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                🧪 Probar Notificaciones
              </button>
            )}

            {/* Botón siguiente/enviar */}
            {step < totalSteps ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] transition-colors"
                type="button"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                type="button"
              >
                {loading ? '🔄 Guardando...' : '✅ Guardar Evaluación'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteEvaluationForm;