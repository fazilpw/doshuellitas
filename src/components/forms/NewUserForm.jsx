// src/components/forms/NewUserForm.jsx
// FORMULARIO PARA AGREGAR NUEVOS USUARIOS AL SISTEMA
import { useState } from 'react';
import { useAuth } from '../auth/ExpandedAuthProvider.jsx';

const NewUserForm = ({ onClose, onUserCreated }) => {
  const { createNewUser, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'padre'
  });
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.role) {
      newErrors.role = 'Debe seleccionar un rol';
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
      console.log('👤 Creando nuevo usuario:', formData);
      
      const newUser = await createNewUser(formData);
      
      console.log('✅ Usuario creado exitosamente:', newUser);
      
      if (onUserCreated) {
        onUserCreated(newUser);
      }
      
      // Auto-cerrar después de éxito
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      setErrors({ 
        submit: 'Error al crear usuario: ' + error.message 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">👤 Nuevo Usuario</h2>
              <p className="opacity-90">Agregar nueva familia o profesor</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Ej: María García"
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Ej: maria@gmail.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Ej: 3123456789"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol en el Club *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              <option value="padre">👨‍👩‍👧‍👦 Padre de Familia</option>
              <option value="profesor">👨‍🏫 Profesor</option>
              <option value="admin">👑 Administrador</option>
            </select>
            {errors.role && (
              <p className="text-red-600 text-sm mt-1">{errors.role}</p>
            )}
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">ℹ️ Información</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Padre:</strong> Puede evaluar sus perros en casa</li>
              <li>• <strong>Profesor:</strong> Puede evaluar todos los perros en el colegio</li>
              <li>• <strong>Admin:</strong> Acceso completo al sistema</li>
            </ul>
          </div>

          {/* Error de envío */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
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
              className="px-6 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Creando...
                </div>
              ) : (
                '✅ Crear Usuario'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewUserForm;