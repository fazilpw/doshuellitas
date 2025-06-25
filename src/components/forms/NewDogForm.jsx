// src/components/forms/NewDogForm.jsx
// FORMULARIO PARA AGREGAR NUEVOS PERROS AL SISTEMA
import { useState } from 'react';
import { useAuth } from '../auth/ExpandedAuthProvider.jsx';

const NewDogForm = ({ onClose, onDogAdded }) => {
  const { addNewDog, allUsers, user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    size: 'mediano',
    age: '',
    weight: '',
    color: '',
    ownerId: user?.id || '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Filtrar solo padres para asignar dueño
  const parentUsers = allUsers.filter(u => u.role === 'padre' && u.active);

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.ownerId) {
      newErrors.ownerId = 'Debe seleccionar un dueño';
    }
    
    if (formData.age && (isNaN(formData.age) || formData.age < 0 || formData.age > 25)) {
      newErrors.age = 'Edad debe ser un número entre 0 y 25';
    }
    
    if (formData.weight && (isNaN(formData.weight) || formData.weight < 0 || formData.weight > 100)) {
      newErrors.weight = 'Peso debe ser un número entre 0 y 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      console.log('🐕 Agregando nuevo perro:', formData);
      
      const dogData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null
      };
      
      const newDog = await addNewDog(dogData);
      
      console.log('✅ Perro agregado exitosamente:', newDog);
      
      if (onDogAdded) {
        onDogAdded(newDog);
      }
      
      // Auto-cerrar después de éxito
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error agregando perro:', error);
      setErrors({ 
        submit: 'Error al agregar perro: ' + error.message 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#C7EA46] to-[#56CCF2] text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🐕 Nuevo Perro</h2>
              <p className="opacity-90">Agregar nuevo miembro peludo al club</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del perro *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                placeholder="Ej: Max"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Raza */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raza
              </label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => handleInputChange('breed', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                placeholder="Ej: Golden Retriever"
              />
            </div>

            {/* Tamaño */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño
              </label>
              <select
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              >
                <option value="pequeño">🐕 Pequeño (hasta 10kg)</option>
                <option value="mediano">🐕 Mediano (10-25kg)</option>
                <option value="grande">🐕 Grande (25-45kg)</option>
                <option value="gigante">🐕 Gigante (más de 45kg)</option>
              </select>
            </div>

            {/* Edad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edad (años)
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                placeholder="Ej: 3"
                min="0"
                max="25"
              />
              {errors.age && (
                <p className="text-red-600 text-sm mt-1">{errors.age}</p>
              )}
            </div>

            {/* Peso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                placeholder="Ej: 25.5"
                min="0"
                max="100"
              />
              {errors.weight && (
                <p className="text-red-600 text-sm mt-1">{errors.weight}</p>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                placeholder="Ej: Dorado con blanco"
              />
            </div>
          </div>

          {/* Dueño */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dueño *
            </label>
            <select
              value={formData.ownerId}
              onChange={(e) => handleInputChange('ownerId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              <option value="">Seleccionar dueño...</option>
              {parentUsers.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {parent.full_name} - {parent.email}
                </option>
              ))}
            </select>
            {errors.ownerId && (
              <p className="text-red-600 text-sm mt-1">{errors.ownerId}</p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Información adicional sobre el perro (alergias, comportamientos especiales, etc.)"
            />
          </div>

          {/* Información */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">🎯 ¿Qué incluye el registro?</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• ✅ Dashboard personalizado para el dueño</li>
              <li>• ✅ Sistema de evaluaciones casa-colegio</li>
              <li>• ✅ Seguimiento de progreso comportamental</li>
              <li>• ✅ Reportes automáticos de evolución</li>
              <li>• ✅ Comunicación directa con profesores</li>
            </ul>
          </div>

          {/* Error de envío */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
              disabled={saving}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#C7EA46] text-[#2C3E50] rounded-lg hover:bg-[#FFFE8D] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-[#2C3E50] border-t-transparent rounded-full"></div>
                  Agregando...
                </div>
              ) : (
                '🐕 Agregar al Club'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewDogForm;