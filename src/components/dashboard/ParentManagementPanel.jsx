// src/components/dashboard/ParentManagementPanel.jsx
// 👨‍👩‍👧‍👦 PANEL DE GESTIÓN PARA PADRES - AGREGAR USUARIOS Y PERROS

import { useState } from 'react';
import supabase from '../../lib/supabase.js';

const ParentManagementPanel = ({ currentUser, onDataUpdated }) => {
  const [activeTab, setActiveTab] = useState('perros'); // perros, familia
  const [showNewDogForm, setShowNewDogForm] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para formulario de nuevo perro
  const [newDogForm, setNewDogForm] = useState({
    name: '',
    breed: '',
    size: 'mediano',
    age: '',
    weight: '',
    color: '',
    notes: ''
  });

  // Estados para formulario de nuevo usuario familiar
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'padre', // Solo pueden crear padres
    relationship: 'familiar' // familiar, cuidador, etc.
  });

  // ===============================================
  // 🐕 GESTIÓN DE PERROS
  // ===============================================
  const createNewDog = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🐕 Padre creando nuevo perro:', newDogForm);

      // Validaciones básicas
      if (!newDogForm.name.trim()) {
        alert('El nombre del perro es requerido');
        return;
      }

      const dogData = {
        name: newDogForm.name.trim(),
        breed: newDogForm.breed || null,
        size: newDogForm.size,
        age: newDogForm.age ? parseInt(newDogForm.age) : null,
        weight: newDogForm.weight ? parseFloat(newDogForm.weight) : null,
        color: newDogForm.color || null,
        owner_id: currentUser.id, // Asignar al padre actual
        notes: newDogForm.notes || null,
        active: true
      };

      const { data, error } = await supabase
        .from('dogs')
        .insert(dogData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Perro creado exitosamente:', data);

      // Resetear formulario
      setNewDogForm({
        name: '',
        breed: '',
        size: 'mediano',
        age: '',
        weight: '',
        color: '',
        notes: ''
      });
      setShowNewDogForm(false);

      // Notificar al componente padre para actualizar datos
      if (onDataUpdated) {
        onDataUpdated();
      }

      alert('✅ ¡Perro agregado exitosamente! Ahora aparecerá en tu lista de mascotas.');

    } catch (error) {
      console.error('❌ Error creando perro:', error);
      alert(`Error agregando perro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 👥 GESTIÓN DE USUARIOS FAMILIARES
  // ===============================================
  const createNewFamilyUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('👥 Padre creando nuevo usuario familiar:', newUserForm);

      // Validaciones
      if (!newUserForm.email.trim() || !newUserForm.password.trim() || !newUserForm.full_name.trim()) {
        alert('Email, contraseña y nombre completo son requeridos');
        return;
      }

      if (newUserForm.password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      // Crear usuario en auth.users (requiere admin o función especial)
      // Nota: Esta funcionalidad puede requerir una función de Edge Function
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          data: {
            full_name: newUserForm.full_name,
            invited_by: currentUser.id,
            relationship: newUserForm.relationship
          }
        }
      });

      if (authError) throw authError;

      // El perfil se crea automáticamente via trigger
      console.log('✅ Usuario familiar creado exitosamente:', authData);

      // Resetear formulario
      setNewUserForm({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'padre',
        relationship: 'familiar'
      });
      setShowNewUserForm(false);

      alert('✅ ¡Usuario familiar creado exitosamente! Se ha enviado un email de confirmación.');

    } catch (error) {
      console.error('❌ Error creando usuario familiar:', error);
      
      // Mensajes de error más amigables
      let errorMessage = 'Error creando usuario';
      if (error.message.includes('email')) {
        errorMessage = 'Este email ya está registrado en el sistema';
      } else if (error.message.includes('password')) {
        errorMessage = 'La contraseña no cumple los requisitos mínimos';
      } else {
        errorMessage = error.message;
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🎨 RENDERIZADO DE NAVEGACIÓN DE TABS
  // ===============================================
  const renderTabNavigation = () => (
    <div className="flex space-x-4 border-b border-gray-200 mb-6">
      <button
        onClick={() => setActiveTab('perros')}
        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'perros'
            ? 'border-[#56CCF2] text-[#56CCF2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        🐕 Mis Perros
      </button>
      <button
        onClick={() => setActiveTab('familia')}
        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'familia'
            ? 'border-[#56CCF2] text-[#56CCF2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        👨‍👩‍👧‍👦 Familia
      </button>
    </div>
  );

  // ===============================================
  // 🐕 RENDERIZADO TAB DE PERROS
  // ===============================================
  const renderDogsTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#2C3E50]">🐕 Gestión de Mis Perros</h3>
          <p className="text-sm text-gray-600">Agrega y administra las mascotas de tu familia</p>
        </div>
        <button
          onClick={() => setShowNewDogForm(true)}
          className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
        >
          ➕ Agregar Perro
        </button>
      </div>

      {/* Formulario nuevo perro */}
      {showNewDogForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">➕ Agregar Nuevo Perro</h4>
            <button
              onClick={() => setShowNewDogForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={createNewDog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Perro *
              </label>
              <input
                type="text"
                value={newDogForm.name}
                onChange={(e) => setNewDogForm({...newDogForm, name: e.target.value})}
                required
                placeholder="Ej: Max, Luna, Rocky..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raza
              </label>
              <input
                type="text"
                value={newDogForm.breed}
                onChange={(e) => setNewDogForm({...newDogForm, breed: e.target.value})}
                placeholder="Ej: Golden Retriever, Mestizo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamaño
              </label>
              <select
                value={newDogForm.size}
                onChange={(e) => setNewDogForm({...newDogForm, size: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              >
                <option value="pequeño">🐕‍🦺 Pequeño (hasta 10kg)</option>
                <option value="mediano">🐕 Mediano (10-25kg)</option>
                <option value="grande">🐺 Grande (25-45kg)</option>
                <option value="gigante">🐻 Gigante (más de 45kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Edad (años)
              </label>
              <input
                type="number"
                value={newDogForm.age}
                onChange={(e) => setNewDogForm({...newDogForm, age: e.target.value})}
                min="0"
                max="25"
                placeholder="Ej: 3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                value={newDogForm.weight}
                onChange={(e) => setNewDogForm({...newDogForm, weight: e.target.value})}
                min="0"
                max="100"
                step="0.1"
                placeholder="Ej: 25.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                value={newDogForm.color}
                onChange={(e) => setNewDogForm({...newDogForm, color: e.target.value})}
                placeholder="Ej: Dorado, Marrón, Negro..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas especiales
              </label>
              <textarea
                value={newDogForm.notes}
                onChange={(e) => setNewDogForm({...newDogForm, notes: e.target.value})}
                rows="3"
                placeholder="Información adicional: temperamento, alergias, cuidados especiales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? '⏳ Agregando...' : '✅ Agregar Perro'}
              </button>
              <button
                type="button"
                onClick={() => setShowNewDogForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">💡</span>
          <h4 className="font-semibold text-blue-800">Consejos para agregar perros</h4>
        </div>
        <ul className="text-sm text-blue-700 space-y-1 ml-8">
          <li>• Proporciona toda la información posible para mejores evaluaciones</li>
          <li>• El peso y edad ayudan a personalizar las recomendaciones</li>
          <li>• Incluye información sobre alergias o condiciones especiales en las notas</li>
          <li>• Puedes editar esta información después desde el perfil del perro</li>
        </ul>
      </div>
    </div>
  );

  // ===============================================
  // 👨‍👩‍👧‍👦 RENDERIZADO TAB DE FAMILIA
  // ===============================================
  const renderFamilyTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#2C3E50]">👨‍👩‍👧‍👦 Gestión Familiar</h3>
          <p className="text-sm text-gray-600">Invita a familiares para que también puedan evaluar y ver el progreso</p>
        </div>
        <button
          onClick={() => setShowNewUserForm(true)}
          className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
        >
          ➕ Invitar Familiar
        </button>
      </div>

      {/* Formulario nuevo usuario familiar */}
      {showNewUserForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">➕ Invitar Nuevo Familiar</h4>
            <button
              onClick={() => setShowNewUserForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={createNewFamilyUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                required
                placeholder="familiar@ejemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña temporal *
              </label>
              <input
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                required
                minLength="6"
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm({...newUserForm, full_name: e.target.value})}
                required
                placeholder="Ej: María García Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm({...newUserForm, phone: e.target.value})}
                placeholder="Ej: 3001234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relación Familiar
              </label>
              <select
                value={newUserForm.relationship}
                onChange={(e) => setNewUserForm({...newUserForm, relationship: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              >
                <option value="familiar">👨‍👩‍👧‍👦 Familiar</option>
                <option value="conyuge">💑 Cónyuge</option>
                <option value="hijo">👧👦 Hijo/a</option>
                <option value="padre">👨👩 Padre/Madre</option>
                <option value="hermano">👫 Hermano/a</option>
                <option value="cuidador">👥 Cuidador</option>
                <option value="otro">🤝 Otro</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">📧 Nota:</span> Se enviará un email de confirmación al familiar. 
                  Podrán ver y evaluar los mismos perros que tienes registrados.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? '⏳ Enviando invitación...' : '📧 Enviar Invitación'}
              </button>
              <button
                type="button"
                onClick={() => setShowNewUserForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Información sobre gestión familiar */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">🏠</span>
          <h4 className="font-semibold text-green-800">Beneficios de la gestión familiar</h4>
        </div>
        <ul className="text-sm text-green-700 space-y-1 ml-8">
          <li>• Múltiples familiares pueden evaluar las mascotas</li>
          <li>• Diferentes perspectivas mejoran el seguimiento</li>
          <li>• Comparación entre evaluaciones de casa vs colegio</li>
          <li>• Mejor comunicación con los profesores del club</li>
          <li>• Todos reciben notificaciones y recomendaciones</li>
        </ul>
      </div>
    </div>
  );

  // ===============================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ===============================================
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">🛠️ Panel de Gestión</h2>
        <p className="text-gray-600">Administra tus perros y familiares desde aquí</p>
      </div>

      {renderTabNavigation()}

      {activeTab === 'perros' ? renderDogsTab() : renderFamilyTab()}
    </div>
  );
};

export default ParentManagementPanel;