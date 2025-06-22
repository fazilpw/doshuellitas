// src/components/dashboard/CompleteEvaluationForm.jsx - VERSIÓN CORREGIDA
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';

const CompleteEvaluationForm = ({ dogId, userId, userRole, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    // Métricas principales (1-10)
    energy_level: 5,
    sociability_level: 5,
    obedience_level: 5,
    anxiety_level: 5,
    
    // Comportamientos específicos
    barks_much: 'normal',
    begs_food: 'a_veces',
    destructive: 'nunca',
    social_with_dogs: 'normal',
    follows_everywhere: 'a_veces',
    window_watching: 'normal',
    
    // Nuevos campos específicos por contexto
    ate_well: 'normal',
    bathroom_accidents: 'no',
    played_with_toys: 'si',
    responded_to_commands: 'bien',
    interaction_quality: 'positiva',
    
    // Notas
    notes: '',
    highlights: '',
    concerns: ''
  });

  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [totalSteps] = useState(4);

  useEffect(() => {
    fetchDogInfo();
  }, [dogId]);

  const fetchDogInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          users!dogs_owner_id_fkey(name, email, phone)
        `)
        .eq('id', dogId)
        .single();
      
      if (error) throw error;
      setDog(data);
    } catch (error) {
      console.error('Error fetching dog:', error);
      setError('Error al cargar información del perro');
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

  // 🔧 FUNCIÓN CORREGIDA - Solo navegar, NO enviar
  const nextStep = (e) => {
    e.preventDefault(); // ✅ Prevenir submit
    e.stopPropagation(); // ✅ Detener propagación
    
    if (step < totalSteps) {
      setStep(step + 1);
      console.log(`Avanzando al paso ${step + 1}`);
    }
  };

  // 🔧 FUNCIÓN CORREGIDA - Solo navegar, NO enviar
  const prevStep = (e) => {
    e.preventDefault(); // ✅ Prevenir submit
    e.stopPropagation(); // ✅ Detener propagación
    
    if (step > 1) {
      setStep(step - 1);
      console.log(`Retrocediendo al paso ${step - 1}`);
    }
  };

  // 🔧 FUNCIÓN CORREGIDA - Solo enviar en paso final
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // ✅ SOLO ENVIAR SI ESTAMOS EN EL PASO FINAL
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
      alert('✅ Evaluación guardada exitosamente');
      
      if (onSave) onSave(data);
      if (onClose) onClose();

    } catch (error) {
      console.error('❌ Error saving evaluation:', error);
      setError(error.message || 'Error al guardar evaluación');
    } finally {
      setLoading(false);
    }
  };

  // 🔧 FUNCIÓN PARA MANEJAR SOLO EL ENVÍO FINAL
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
        {/* 🔧 FORM SIN onSubmit automático */}
        <div>
          {/* Header con progreso */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#2C3E50]">
                  Evaluar a {dog.name} 🐕
                </h2>
                <p className="text-gray-600">
                  {userRole === 'profesor' ? '🏫 Evaluación en el colegio' : '🏠 Evaluación en casa'} • 
                  {dog.users?.name} • {new Date().toLocaleDateString()}
                </p>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Barra de progreso */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{getStepTitle()}</span>
              <span className="text-sm text-gray-500">Paso {step} de {totalSteps}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#56CCF2] h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="p-6">
            {/* PASO 1: Métricas Principales */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-[#2C3E50] mb-2">📊 ¿Cómo estuvo {dog.name} hoy?</h3>
                  <p className="text-gray-600">Evalúa el comportamiento general usando las escalas</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Energía */}
                  <div className="bg-blue-50 p-6 rounded-xl">
                    <label className="block text-lg font-semibold text-[#2C3E50] mb-3">
                      ⚡ Nivel de Energía
                    </label>
                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-[#56CCF2]">{formData.energy_level}</span>
                      <span className="text-lg text-gray-600">/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.energy_level}
                      onChange={(e) => handleSliderChange('energy_level', e.target.value)}
                      className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer mb-3"
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Muy tranquilo</span>
                      <span>Normal</span>
                      <span>Muy activo</span>
                    </div>
                  </div>

                  {/* Socialización */}
                  <div className="bg-green-50 p-6 rounded-xl">
                    <label className="block text-lg font-semibold text-[#2C3E50] mb-3">
                      🤝 Socialización
                    </label>
                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-[#C7EA46]">{formData.sociability_level}</span>
                      <span className="text-lg text-gray-600">/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.sociability_level}
                      onChange={(e) => handleSliderChange('sociability_level', e.target.value)}
                      className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer mb-3"
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Tímido</span>
                      <span>Normal</span>
                      <span>Muy sociable</span>
                    </div>
                  </div>

                  {/* Obediencia */}
                  <div className="bg-purple-50 p-6 rounded-xl">
                    <label className="block text-lg font-semibold text-[#2C3E50] mb-3">
                      🎯 Obediencia
                    </label>
                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-[#5B9BD5]">{formData.obedience_level}</span>
                      <span className="text-lg text-gray-600">/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.obedience_level}
                      onChange={(e) => handleSliderChange('obedience_level', e.target.value)}
                      className="w-full h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer mb-3"
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Desobediente</span>
                      <span>Normal</span>
                      <span>Muy obediente</span>
                    </div>
                  </div>

                  {/* Ansiedad */}
                  <div className="bg-orange-50 p-6 rounded-xl">
                    <label className="block text-lg font-semibold text-[#2C3E50] mb-3">
                      😰 Nivel de Ansiedad
                    </label>
                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-[#AB5729]">{formData.anxiety_level}</span>
                      <span className="text-lg text-gray-600">/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.anxiety_level}
                      onChange={(e) => handleSliderChange('anxiety_level', e.target.value)}
                      className="w-full h-3 bg-orange-200 rounded-lg appearance-none cursor-pointer mb-3"
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Muy relajado</span>
                      <span>Normal</span>
                      <span>Muy ansioso</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: Comportamientos */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-[#2C3E50] mb-2">🎭 Comportamientos Observados</h3>
                  <p className="text-gray-600">¿Cómo se comportó {dog.name} en diferentes situaciones?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-[#2C3E50] mb-3">
                      🔊 ¿Ladró mucho?
                    </label>
                    <select
                      value={formData.barks_much}
                      onChange={(e) => handleSelectChange('barks_much', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#56CCF2] focus:border-[#56CCF2] text-lg"
                    >
                      <option value="poco">😴 Poco</option>
                      <option value="normal">😐 Normal</option>
                      <option value="mucho">🔊 Mucho</option>
                    </select>
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-[#2C3E50] mb-3">
                      🍖 ¿Pidió comida?
                    </label>
                    <select
                      value={formData.begs_food}
                      onChange={(e) => handleSelectChange('begs_food', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#56CCF2] focus:border-[#56CCF2] text-lg"
                    >
                      <option value="nunca">😇 Nunca</option>
                      <option value="a_veces">🤔 A veces</option>
                      <option value="siempre">🥺 Siempre</option>
                    </select>
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-[#2C3E50] mb-3">
                      💥 ¿Fue destructivo?
                    </label>
                    <select
                      value={formData.destructive}
                      onChange={(e) => handleSelectChange('destructive', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#56CCF2] focus:border-[#56CCF2] text-lg"
                    >
                      <option value="nunca">😇 Nunca</option>
                      <option value="a_veces">🤏 A veces</option>
                      <option value="frecuente">💥 Frecuente</option>
                    </select>
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-[#2C3E50] mb-3">
                      🐕‍🦺 Social con otros perros
                    </label>
                    <select
                      value={formData.social_with_dogs}
                      onChange={(e) => handleSelectChange('social_with_dogs', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#56CCF2] focus:border-[#56CCF2] text-lg"
                    >
                      <option value="poco">😟 Poco social</option>
                      <option value="normal">😊 Normal</option>
                      <option value="mucho">🤗 Muy social</option>
                    </select>
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-[#2C3E50] mb-3">
                      👥 ¿Te siguió por todos lados?
                    </label>
                    <select
                      value={formData.follows_everywhere}
                      onChange={(e) => handleSelectChange('follows_everywhere', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#56CCF2] focus:border-[#56CCF2] text-lg"
                    >
                      <option value="no">🚶 No</option>
                      <option value="a_veces">🚶‍♂️ A veces</option>
                      <option value="siempre">👥 Siempre</option>
                    </select>
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-[#2C3E50] mb-3">
                      🪟 ¿Vigiló por la ventana?
                    </label>
                    <select
                      value={formData.window_watching}
                      onChange={(e) => handleSelectChange('window_watching', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#56CCF2] focus:border-[#56CCF2] text-lg"
                    >
                      <option value="poco">😴 Poco</option>
                      <option value="normal">👀 Normal</option>
                      <option value="mucho">🔍 Mucho</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: Actividades y Hábitos */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-[#2C3E50] mb-2">🍽️ Actividades y Hábitos</h3>
                  <p className="text-gray-600">¿Cómo fue {dog.name} con las actividades básicas?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                      <label className="block text-lg font-semibold text-[#2C3E50] mb-4">
                        🍽️ ¿Comió bien?
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="ate_well"
                            value="excelente"
                            checked={formData.ate_well === 'excelente'}
                            onChange={(e) => handleSelectChange('ate_well', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>🤤 Excelente - Se lo comió todo</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="ate_well"
                            value="normal"
                            checked={formData.ate_well === 'normal'}
                            onChange={(e) => handleSelectChange('ate_well', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>😊 Normal - Comió bien</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="ate_well"
                            value="poco"
                            checked={formData.ate_well === 'poco'}
                            onChange={(e) => handleSelectChange('ate_well', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>😕 Poco - Apenas probó</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                      <label className="block text-lg font-semibold text-[#2C3E50] mb-4">
                        🚽 ¿Tuvo accidentes de baño?
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="bathroom_accidents"
                            value="no"
                            checked={formData.bathroom_accidents === 'no'}
                            onChange={(e) => handleSelectChange('bathroom_accidents', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>✅ No - Perfecto</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="bathroom_accidents"
                            value="uno"
                            checked={formData.bathroom_accidents === 'uno'}
                            onChange={(e) => handleSelectChange('bathroom_accidents', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>⚠️ Uno - Un accidente menor</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="bathroom_accidents"
                            value="varios"
                            checked={formData.bathroom_accidents === 'varios'}
                            onChange={(e) => handleSelectChange('bathroom_accidents', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>❌ Varios - Necesita trabajar</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                      <label className="block text-lg font-semibold text-[#2C3E50] mb-4">
                        🎾 ¿Jugó con juguetes?
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="played_with_toys"
                            value="mucho"
                            checked={formData.played_with_toys === 'mucho'}
                            onChange={(e) => handleSelectChange('played_with_toys', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>🎉 Mucho - Le encantó jugar</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="played_with_toys"
                            value="si"
                            checked={formData.played_with_toys === 'si'}
                            onChange={(e) => handleSelectChange('played_with_toys', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>😊 Sí - Jugó normal</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="played_with_toys"
                            value="poco"
                            checked={formData.played_with_toys === 'poco'}
                            onChange={(e) => handleSelectChange('played_with_toys', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>😐 Poco - No le interesó</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                      <label className="block text-lg font-semibold text-[#2C3E50] mb-4">
                        🎯 ¿Respondió a comandos?
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="responded_to_commands"
                            value="excelente"
                            checked={formData.responded_to_commands === 'excelente'}
                            onChange={(e) => handleSelectChange('responded_to_commands', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>⭐ Excelente - Obedeció rápido</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="responded_to_commands"
                            value="bien"
                            checked={formData.responded_to_commands === 'bien'}
                            onChange={(e) => handleSelectChange('responded_to_commands', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>👍 Bien - Respondió normal</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="responded_to_commands"
                            value="regular"
                            checked={formData.responded_to_commands === 'regular'}
                            onChange={(e) => handleSelectChange('responded_to_commands', e.target.value)}
                            className="mr-3 text-[#56CCF2]"
                          />
                          <span>🤔 Regular - Distraído</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 4: Notas y Observaciones */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-[#2C3E50] mb-2">📝 Notas y Observaciones</h3>
                  <p className="text-gray-600">Comparte detalles específicos sobre {dog.name}</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <label className="block text-lg font-semibold text-[#2C3E50] mb-3">
                      ⭐ Lo mejor del día
                    </label>
                    <textarea
                      value={formData.highlights}
                      onChange={(e) => handleTextChange('highlights', e.target.value)}
                      rows="3"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-[#56CCF2] focus:border-[#56CCF2] text-lg"
                      placeholder={`¿Qué fue lo más destacado de ${dog.name} hoy? Algo que hizo muy bien o un momento especial...`}
                    />
                  </div>

                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                    <label className="block text-lg font-semibold text-[#2C3E50] mb-3">
                      ⚠️ Preocupaciones o áreas de mejora
                    </label>
                    <textarea
                      value={formData.concerns}
                      onChange={(e) => handleTextChange('concerns', e.target.value)}
                      rows="3"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-[#56CCF2] focus:border-[#56CCF2] text-lg"
                      placeholder={`¿Algo que necesite atención especial? Comportamientos que trabajar o cosas a mejorar...`}
                    />
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <label className="block text-lg font-semibold text-[#2C3E50] mb-3">
                      💬 Notas generales
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleTextChange('notes', e.target.value)}
                      rows="4"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-[#56CCF2] focus:border-[#56CCF2] text-lg"
                      placeholder={`Descripción general de cómo estuvo ${dog.name} ${userRole === 'profesor' ? 'en el colegio' : 'en casa'} hoy. Incluye anécdotas, interacciones especiales, o cualquier detalle importante...`}
                    />
                  </div>
                </div>

                {/* Resumen de la evaluación */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-[#2C3E50] mb-4">📋 Resumen de la Evaluación</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#56CCF2]">{formData.energy_level}/10</div>
                      <div className="text-gray-600">Energía</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#C7EA46]">{formData.sociability_level}/10</div>
                      <div className="text-gray-600">Social</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#5B9BD5]">{formData.obedience_level}/10</div>
                      <div className="text-gray-600">Obediencia</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#AB5729]">{formData.anxiety_level}/10</div>
                      <div className="text-gray-600">Ansiedad</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-6">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* 🔧 FOOTER CORREGIDO - Botones que NO envían */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
            <div className="flex space-x-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ← Anterior
                </button>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              
              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] transition-colors"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Guardando...
                    </div>
                  ) : (
                    '✅ Guardar Evaluación'
                  )}
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