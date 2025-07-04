// src/components/dashboard/CompleteEvaluationForm.jsx
// 🚀 VERSIÓN COMPLETAMENTE CORREGIDA - RESPONSIVE SCROLL FUNCIONAL
// ✅ SOLUCIONA: Modal sin scroll en móviles, altura dinámica, sticky elements

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';
import { NotificationHelper } from '../../utils/notificationHelper.js';

const CompleteEvaluationForm = ({ 
  dogId, 
  userId, 
  userRole, 
  onClose, 
  onSave,
  dog 
}) => {
  // ===============================================
  // 🎯 ESTADOS PRINCIPALES
  // ===============================================
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentDog, setCurrentDog] = useState(dog);

  // ===============================================
  // 📱 ESTADO RESPONSIVE CRÍTICO - NUEVO
  // ===============================================
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isSmallViewport, setIsSmallViewport] = useState(window.innerHeight < 600);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // ===============================================
  // 📊 DATOS DEL FORMULARIO
  // ===============================================
  const [formData, setFormData] = useState({
    // Métricas principales
    energy_level: 5,
    sociability_level: 5,
    obedience_level: 5,
    anxiety_level: 5,
    
    // Comportamientos observados
    showed_aggression: false,
    was_fearful: false,
    showed_playfulness: false,
    was_withdrawn: false,
    showed_excitement: false,
    was_calm: false,
    destructive_behavior: false,
    excessive_barking: false,
    
    // Actividades y hábitos
    ate_well: false,
    drank_water: false,
    responded_to_commands: 'bien',
    played_with_toys: false,
    interaction_quality: 'positiva',
    bathroom_behavior: 'bien',
    
    // Notas
    notes: '',
    highlights: '',
    concerns: ''
  });

  // ===============================================
  // 🔧 HOOK RESPONSIVE PARA ALTURA - CRÍTICO NUEVO
  // ===============================================
  useEffect(() => {
    const handleResize = () => {
      const newHeight = window.innerHeight;
      const newIsSmall = newHeight < 600;
      const heightDifference = Math.abs(viewportHeight - newHeight);
      
      // Detectar teclado virtual (cambio significativo de altura)
      const keyboardVisible = heightDifference > 150 && newHeight < viewportHeight;
      
      setViewportHeight(newHeight);
      setIsSmallViewport(newIsSmall);
      setIsKeyboardVisible(keyboardVisible);
      
      console.log('📱 Viewport actualizado:', {
        height: newHeight,
        isSmall: newIsSmall,
        keyboard: keyboardVisible
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [viewportHeight]);

  // ===============================================
  // 🐕 CARGAR DATOS DEL PERRO
  // ===============================================
  useEffect(() => {
    const fetchDogData = async () => {
      if (!dogId || currentDog) return;

      try {
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .eq('id', dogId)
          .single();

        if (error) throw error;
        setCurrentDog(data);
      } catch (err) {
        console.error('Error cargando perro:', err);
        setError('Error cargando información del perro');
      }
    };

    fetchDogData();
  }, [dogId, currentDog]);

  // ===============================================
  // 🎛️ FUNCIONES DE MANEJO DE DATOS
  // ===============================================
  const handleSliderChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
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

  // ===============================================
  // 🔄 NAVEGACIÓN ENTRE PASOS
  // ===============================================
  const totalSteps = 4;
  const canGoNext = step < totalSteps;
  const canGoPrev = step > 1;

  const nextStep = () => {
    if (canGoNext) {
      setStep(prev => prev + 1);
      // Scroll al inicio del contenido en móviles
      const contentElement = document.getElementById('evaluation-content');
      if (contentElement) {
        contentElement.scrollTop = 0;
      }
    }
  };

  const prevStep = () => {
    if (canGoPrev) {
      setStep(prev => prev - 1);
      // Scroll al inicio del contenido en móviles
      const contentElement = document.getElementById('evaluation-content');
      if (contentElement) {
        contentElement.scrollTop = 0;
      }
    }
  };

  // ===============================================
  // 💾 ENVÍO DEL FORMULARIO
  // ===============================================
  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const evaluationData = {
        dog_id: dogId,
        evaluator_id: userId,
        location: userRole === 'profesor' ? 'colegio' : 'casa',
        date: today,
        ...formData
      };

      console.log('💾 Guardando evaluación:', evaluationData);

      const { data, error } = await supabase
        .from('evaluations')
        .insert([evaluationData])
        .select()
        .single();

      if (error) throw error;

      // Procesar notificaciones automáticas
      try {
        if (currentDog && data) {
          await NotificationHelper.checkBehaviorAlertsAfterEvaluation(
            data,
            currentDog,
            userId
          );
        }
      } catch (notificationError) {
        console.warn('⚠️ Error en notificaciones:', notificationError);
      }

      setSuccess(true);
      
      // Callback
      if (onSave) onSave(data);
      
      // Cerrar después de 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('❌ Error guardando evaluación:', err);
      setError(err.message || 'Error al guardar la evaluación');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🎨 FUNCIONES DE RENDERIZADO DE PASOS
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
  // 🚨 ESTADOS ESPECIALES
  // ===============================================
  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 md:p-8 text-center max-w-md mx-auto">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            ¡Evaluación Completada!
          </h3>
          <p className="text-gray-600 mb-4">
            La evaluación de {currentDog?.name} se guardó exitosamente.
          </p>
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            🔔 <strong>Notificaciones activadas</strong><br/>
            Se enviaron alertas automáticas según el comportamiento detectado.
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 md:p-8 text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // ===============================================
  // 🎯 CÁLCULO DINÁMICO DE ALTURA - CRÍTICO
  // ===============================================
  const getModalHeight = () => {
    if (isSmallViewport || isKeyboardVisible) {
      // En pantallas pequeñas o con teclado: fullscreen
      return 'h-screen';
    } else {
      // En pantallas normales: altura máxima optimizada
      return 'max-h-[95vh]';
    }
  };

  const getModalClasses = () => {
    const baseClasses = "bg-white rounded-2xl  w-full flex flex-col";
    const heightClasses = getModalHeight();
    const widthClasses = isSmallViewport ? "max-w-full mx-0 " : "max-w-4xl mx-auto";
    
    return `${baseClasses} ${heightClasses} ${widthClasses}`;
  };

  const getContainerClasses = () => {
    return `fixed inset-0 bg-black  bg-opacity-50 z-50 flex items-center justify-center ${
      isSmallViewport ? 'p-0' : 'p-4'
    }`;
  };

  // ===============================================
  // 🎨 RENDERIZADO PRINCIPAL CORREGIDO
  // ===============================================
  return (
    <div className={getContainerClasses()}>
      <div className={getModalClasses()}>
        
        {/* ✅ HEADER OPTIMIZADO - FUERA DEL SCROLL CONTAINER */}
        <div className="flex-shrink-0 bg-gradient-to-r rounded-t-2xl from-[#56CCF2] to-[#5B9BD5] text-white">
          <div className="px-4 md:px-6 py-3 md:py-4">
            
            {/* Header superior */}
            <div className="flex justify-between items-center mb-2 md:mb-3">
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-bold">
                  Evaluación de {currentDog?.name || 'Cargando...'}
                </h2>
                <p className="text-sm md:text-base opacity-90">
                  {userRole === 'profesor' ? 'En el colegio' : 'En casa'} • 
                  Paso {step} de {totalSteps}
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 ml-4"
                type="button"
              >
                <span className="text-xl md:text-2xl">✕</span>
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-1.5 md:h-2">
              <div 
                className="bg-white h-1.5 md:h-2 rounded-full transition-all duration-300" 
                style={{width: `${(step / totalSteps) * 100}%`}}
              />
            </div>
          </div>
        </div>

        {/* ✅ CONTENIDO CON SCROLL FUNCIONAL - ID PARA NAVEGACIÓN */}
        <div 
          id="evaluation-content"
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{
            // Altura dinámica crítica
            height: isSmallViewport 
              ? `calc(100vh - ${isKeyboardVisible ? '200px' : '140px'})` 
              : 'auto'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="text-4xl mb-4">🔄</div>
                <p className="text-gray-600">Guardando evaluación...</p>
              </div>
            </div>
          ) : !currentDog ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="text-4xl mb-4">🔄</div>
                <p className="text-gray-600">Cargando información...</p>
              </div>
            </div>
          ) : (
            <>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </>
          )}
        </div>

        {/* ✅ FOOTER OPTIMIZADO - FUERA DEL SCROLL, COMPACTO EN MÓVILES */}
        {!loading && currentDog && (
          <div className="flex-shrink-0 rounded-b-2xl bg-gray-50 border-t border-gray-200">
            <div className="px-4 md:px-6 py-3 md:py-4">
              <div className="flex justify-between items-center">
                
                {/* Botón anterior */}
                <button
                  onClick={prevStep}
                  disabled={!canGoPrev}
                  className="px-3 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
                  type="button"
                >
                  <span className="hidden md:inline">← Anterior</span>
                  <span className="md:hidden">←</span>
                </button>

                {/* Indicador de paso - solo en desktop */}
                <div className="hidden md:flex items-center text-sm text-gray-500">
                  <span>Paso {step} de {totalSteps}</span>
                  <div className="mx-3 w-16 bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-[#56CCF2] h-1 rounded-full transition-all duration-300"
                      style={{width: `${(step / totalSteps) * 100}%`}}
                    />
                  </div>
                  <span>{Math.round((step / totalSteps) * 100)}%</span>
                </div>

                {/* Botón siguiente/enviar */}
                {step < totalSteps ? (
                  <button
                    onClick={nextStep}
                    className="px-3 md:px-6 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] transition-colors text-sm md:text-base"
                    type="button"
                  >
                    <span className="hidden md:inline">Siguiente →</span>
                    <span className="md:hidden">→</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 md:px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm md:text-base font-medium"
                    type="button"
                  >
                    <span className="hidden md:inline">
                      {loading ? '🔄 Guardando...' : '✅ Guardar Evaluación'}
                    </span>
                    <span className="md:hidden">
                      {loading ? '🔄' : '✅ Guardar'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteEvaluationForm;