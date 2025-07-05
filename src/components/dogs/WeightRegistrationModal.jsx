// src/components/dogs/WeightRegistrationModal.jsx
// ⚖️ MODAL PARA REGISTRAR PESO DE PERROS

import { useState } from 'react';

const WeightRegistrationModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  dogName, 
  currentWeight 
}) => {
  const [formData, setFormData] = useState({
    weight: '',
    date_recorded: new Date().toISOString().split('T')[0],
    location: 'casa',
    measurement_method: 'balanza_casa',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ============================================
  // 🔧 FUNCIONES DE VALIDACIÓN
  // ============================================
  const validateForm = () => {
    const newErrors = {};
    
    // Validar peso
    if (!formData.weight || formData.weight.trim() === '') {
      newErrors.weight = 'El peso es requerido';
    } else {
      const weightValue = parseFloat(formData.weight);
      if (isNaN(weightValue) || weightValue <= 0) {
        newErrors.weight = 'El peso debe ser un número mayor a 0';
      } else if (weightValue > 100) {
        newErrors.weight = 'El peso no puede ser mayor a 100 kg';
      }
    }
    
    // Validar fecha
    if (!formData.date_recorded) {
      newErrors.date_recorded = 'La fecha es requerida';
    } else {
      const selectedDate = new Date(formData.date_recorded);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.date_recorded = 'La fecha no puede ser en el futuro';
      }
    }
    
    // Validar ubicación
    if (!formData.location) {
      newErrors.location = 'La ubicación es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // 📝 MANEJAR CAMBIOS EN FORMULARIO
  // ============================================
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error al cambiar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // ============================================
  // 📊 CALCULAR DIFERENCIA DE PESO
  // ============================================
  const calculateWeightDifference = () => {
    if (!currentWeight || !formData.weight) return null;
    
    const newWeight = parseFloat(formData.weight);
    const current = parseFloat(currentWeight);
    const difference = newWeight - current;
    
    return {
      difference,
      percentage: ((difference / current) * 100).toFixed(1),
      trend: difference > 0 ? 'subiendo' : difference < 0 ? 'bajando' : 'estable'
    };
  };

  const weightDiff = calculateWeightDifference();

  // ============================================
  // 📤 ENVIAR FORMULARIO
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('⚖️ Registrando peso:', formData);
      
      const result = await onSubmit(formData);
      
      if (result.success) {
        console.log('✅ Peso registrado exitosamente');
        // Resetear formulario
        setFormData({
          weight: '',
          date_recorded: new Date().toISOString().split('T')[0],
          location: 'casa',
          measurement_method: 'balanza_casa',
          notes: ''
        });
        // Cerrar modal
        onClose();
      } else {
        console.error('❌ Error registrando peso:', result.error);
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      setErrors({ submit: 'Error inesperado. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🎨 RENDER DEL MODAL
  // ============================================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">⚖️ Registrar Peso</h2>
              <p className="text-blue-100 text-sm">{dogName}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Información actual */}
        {currentWeight && (
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-600">Peso Actual:</span>
              <span className="font-semibold text-blue-900">{currentWeight} kg</span>
            </div>
            {weightDiff && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600">Diferencia: </span>
                <span className={`font-medium ${
                  weightDiff.difference > 0 ? 'text-green-600' : 
                  weightDiff.difference < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {weightDiff.difference > 0 ? '+' : ''}{weightDiff.difference.toFixed(1)} kg
                  ({weightDiff.percentage}%)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Peso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peso (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent ${
                errors.weight ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: 25.5"
              disabled={loading}
            />
            {errors.weight && (
              <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date_recorded}
              onChange={(e) => handleInputChange('date_recorded', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent ${
                errors.date_recorded ? 'border-red-500' : 'border-gray-300'
              }`}
              max={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
            {errors.date_recorded && (
              <p className="text-red-500 text-sm mt-1">{errors.date_recorded}</p>
            )}
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value="casa">🏠 Casa</option>
              <option value="colegio">🏫 Colegio</option>
              <option value="veterinario">⚕️ Veterinario</option>
              <option value="otro">📍 Otro</option>
            </select>
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* Método de medición */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Medición
            </label>
            <select
              value={formData.measurement_method}
              onChange={(e) => handleInputChange('measurement_method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              disabled={loading}
            >
              <option value="balanza_casa">⚖️ Balanza de Casa</option>
              <option value="balanza_clinica">🏥 Balanza de Clínica</option>
              <option value="balanza_colegio">🏫 Balanza del Colegio</option>
              <option value="estimado">📏 Estimado</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Observaciones sobre el peso, condiciones especiales, etc."
              disabled={loading}
            />
          </div>

          {/* Error de submit */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Registrando...</span>
                </div>
              ) : (
                'Registrar Peso'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeightRegistrationModal;