// src/components/dashboard/CompleteEvaluationForm.jsx
// 🔔 FORMULARIO COMPLETO DE EVALUACIÓN CON NOTIFICACIONES CRUZADAS
// ✅ Todas las funcionalidades integradas + sistema de notificaciones automáticas

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

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
  // 💾 GUARDAR EVALUACIÓN CON NOTIFICACIONES CRUZADAS
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

      // 2. 🆕 PROCESAR NOTIFICACIONES AUTOMÁTICAS + CRUZADAS
      try {
        console.log('🔔 Procesando notificaciones automáticas y cruzadas...');
        
        // Importar el helper de notificaciones
        const { NotificationHelper } = await import('../../utils/notificationHelper.js');
        
        // Procesar todas las notificaciones (comportamiento + cruzadas)
        const notificationResults = await NotificationHelper.processEvaluationNotifications(
          savedEvaluation,
          savedEvaluation.dogs, // Datos del perro con owner_id
          userId // ID del evaluador
        );
        
        console.log('✅ Notificaciones procesadas:', notificationResults);
        
        // Log detallado para debugging
        if (notificationResults.behaviorAlerts?.length > 0) {
          console.log(`📨 ${notificationResults.behaviorAlerts.length} alertas de comportamiento enviadas`);
        }
        
        if (notificationResults.crossRoleNotifications?.length > 0) {
          console.log(`🔄 ${notificationResults.crossRoleNotifications.length} notificaciones cruzadas enviadas`);
        }

      } catch (notificationError) {
        // No fallar la evaluación si las notificaciones fallan
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
  // 🧪 FUNCIÓN DE PRUEBA PARA NOTIFICACIONES CRUZADAS
  // ===============================================
  const testCrossNotifications = async () => {
    try {
      console.log('🧪 Probando notificaciones cruzadas...');
      
      if (!dogId || !userId) {
        alert('❌ Faltan datos: dogId o userId');
        return;
      }

      const { NotificationHelper } = await import('../../utils/notificationHelper.js');
      
      const result = await NotificationHelper.testCrossRoleNotifications(dogId, userId, dog?.name || 'Max');
      
      console.log('✅ Prueba completada:', result);
      alert(`✅ Prueba completada!\n- Alertas de comportamiento: ${result.behaviorAlerts?.length || 0}\n- Notificaciones cruzadas: ${result.crossRoleNotifications?.length || 0}`);
      
    } catch (error) {
      console.error('❌ Error en prueba:', error);
      alert('❌ Error en la prueba: ' + error.message);
    }
  };

  // ===============================================
  // 🎨 FUNCIONES DE RENDERIZADO
  // ===============================================
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          📊 Métricas Principales
        </h3>
        <p className="text-gray-600">
          Evalúa el comportamiento general de {dog?.name}
        </p>
      </div>

      {/* Nivel de Energía */}
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

      {/* Nivel de Sociabilidad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🤝 Nivel de Sociabilidad: {formData.sociability_level}/10
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

      {/* Nivel de Obediencia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📚 Nivel de Obediencia: {formData.obedience_level}/10
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

      {/* Nivel de Ansiedad */}
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
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🐕 Comportamientos Observados
        </h3>
        <p className="text-gray-600">
          Comportamientos específicos de {dog?.name}
        </p>
      </div>

      {/* Ladridos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🔊 ¿Ladra mucho?
        </label>
        <select
          value={formData.barks_much}
          onChange={(e) => handleSelectChange('barks_much', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          <option value="poco">Poco</option>
          <option value="normal">Normal</option>
          <option value="mucho">Mucho</option>
        </select>
      </div>

      {/* Socialización con otros perros */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🐾 Socialización con otros perros
        </label>
        <select
          value={formData.social_with_dogs}
          onChange={(e) => handleSelectChange('social_with_dogs', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          <option value="poco">Poco sociable</option>
          <option value="normal">Normal</option>
          <option value="mucho">Muy sociable</option>
        </select>
      </div>

      {/* Sigue a todas partes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          👣 ¿Te sigue a todas partes?
        </label>
        <select
          value={formData.follows_everywhere}
          onChange={(e) => handleSelectChange('follows_everywhere', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          <option value="no">No</option>
          <option value="a_veces">A veces</option>
          <option value="siempre">Siempre</option>
        </select>
      </div>

      {/* Observar por la ventana */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🪟 ¿Observa por la ventana?
        </label>
        <select
          value={formData.window_watching}
          onChange={(e) => handleSelectChange('window_watching', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          <option value="poco">Poco</option>
          <option value="normal">Normal</option>
          <option value="mucho">Mucho</option>
        </select>
      </div>

      {/* Pedir comida */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🍖 ¿Pide comida?
        </label>
        <select
          value={formData.begs_food}
          onChange={(e) => handleSelectChange('begs_food', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          <option value="nunca">Nunca</option>
          <option value="a_veces">A veces</option>
          <option value="siempre">Siempre</option>
        </select>
      </div>

      {/* Destructivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💥 ¿Es destructivo?
        </label>
        <select
          value={formData.destructive}
          onChange={(e) => handleSelectChange('destructive', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          <option value="nunca">Nunca</option>
          <option value="a_veces">A veces</option>
          <option value="frecuente">Frecuentemente</option>
        </select>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🎯 Actividades y Hábitos
        </h3>
        <p className="text-gray-600">
          Actividades específicas de hoy
        </p>
      </div>

      {/* Comió bien */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🍽️ ¿Comió bien?
        </label>
        <select
          value={formData.ate_well}
          onChange={(e) => handleSelectChange('ate_well', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          <option value="excelente">Excelente</option>
          <option value="normal">Normal</option>
          <option value="poco">Poco</option>
        </select>
      </div>

      {/* Accidentes de baño */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🚽 Accidentes de baño
        </label>
        <select
          value={formData.bathroom_accidents}
          onChange={(e) => handleSelectChange('bathroom_accidents', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          <option value="no">No</option>
          <option value="uno">Uno</option>
          <option value="varios">Varios</option>
        </select>
      </div>

      {/* Jugó con juguetes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🧸 ¿Jugó con juguetes?
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

      {/* Respondió a comandos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        </select>
      </div>

      {/* Calidad de interacción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💝 Calidad de interacción
        </label>
        <select
          value={formData.interaction_quality}
          onChange={(e) => handleSelectChange('interaction_quality', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          <option value="excelente">Excelente</option>
          <option value="positiva">Positiva</option>
          <option value="neutra">Neutra</option>
          <option value="negativa">Negativa</option>
        </select>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          📝 Notas y Observaciones
        </h3>
        <p className="text-gray-600">
          Comentarios adicionales sobre {dog?.name}
        </p>
      </div>

      {/* Destacados */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ⭐ Lo mejor del día
        </label>
        <textarea
          value={formData.highlights}
          onChange={(e) => handleTextChange('highlights', e.target.value)}
          placeholder="¿Qué fue lo mejor que hizo hoy?"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          rows={3}
        />
      </div>

      {/* Preocupaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ⚠️ Áreas de atención
        </label>
        <textarea
          value={formData.concerns}
          onChange={(e) => handleTextChange('concerns', e.target.value)}
          placeholder="¿Algo que necesita atención o mejora?"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          rows={3}
        />
      </div>

      {/* Notas generales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💬 Notas generales
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleTextChange('notes', e.target.value)}
          placeholder="Cualquier observación adicional..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          rows={4}
        />
      </div>
    </div>
  );

  // ===============================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ===============================================
  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            ¡Evaluación Guardada!
          </h2>
          <p className="text-gray-600 mb-6">
            La evaluación de {dog?.name} se guardó exitosamente y las notificaciones automáticas fueron enviadas.
          </p>
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Cerrando automáticamente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                Evaluación de {dog?.name || 'Cargando...'}
              </h2>
              <p className="opacity-90">
                Paso {step} de {totalSteps} - {userRole === 'profesor' ? 'Colegio' : 'Casa'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-xl font-bold text-red-800 mb-2">Error</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <div className="space-x-3">
                  <button
                    onClick={() => setError('')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          ) : !dog ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cargando...</h3>
              <p className="text-gray-600">Obteniendo información del perro...</p>
            </div>
          ) : (
            <div className="p-6">
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
        {!error && dog && (
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

            {/* Botones de prueba (solo en desarrollo) */}
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