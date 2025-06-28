// src/components/dashboard/AdminModals.jsx
// 📝 FORMULARIOS Y MODALES PARA ADMINISTRACIÓN
import { useState } from 'react';
import supabase from '../../lib/supabase.js';

// ============================================
// 👤 MODAL PARA USUARIOS
// ============================================

export const UserModal = ({ isOpen, onClose, user = null, onSave }) => {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'padre',
    active: user?.active ?? true,
    avatar_url: user?.avatar_url || '',
    club_member_since: user?.club_member_since ? user.club_member_since.split('T')[0] : new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (user) {
        // Actualizar usuario existente
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            role: formData.role,
            active: formData.active,
            avatar_url: formData.avatar_url,
            club_member_since: formData.club_member_since
          })
          .eq('id', user.id);

        if (error) throw error;
      } else {
        // Crear nuevo usuario (requiere auth)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: 'ClubCanino2024!', // Password temporal
          options: {
            data: {
              full_name: formData.full_name,
              role: formData.role,
              phone: formData.phone
            }
          }
        });

        if (authError) throw authError;

        // Crear perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            active: formData.active,
            avatar_url: formData.avatar_url,
            club_member_since: formData.club_member_since
          });

        if (profileError) throw profileError;
      }

      onSave && onSave();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            {user ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
              required
            />
          </div>

          {/* Email (solo para nuevos usuarios) */}
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
                required
              />
            </div>
          )}

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
              placeholder="+57 300 123 4567"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
              required
            >
              <option value="padre">👤 Padre de familia</option>
              <option value="profesor">🧑‍🏫 Profesor</option>
              <option value="conductor">🚐 Conductor</option>
              <option value="admin">⚡ Administrador</option>
            </select>
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foto de perfil (URL)
            </label>
            <input
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
              placeholder="https://ejemplo.com/foto.jpg"
            />
          </div>

          {/* Fecha de ingreso al club */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miembro del club desde
            </label>
            <input
              type="date"
              value={formData.club_member_since}
              onChange={(e) => setFormData(prev => ({ ...prev, club_member_since: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
            />
          </div>

          {/* Foto del perro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foto del perro (URL)
            </label>
            <input
              type="url"
              value={formData.photo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
              placeholder="https://ejemplo.com/foto-perro.jpg"
            />
          </div>

          {/* Estado activo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="h-4 w-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
              Usuario activo
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Password info para nuevos usuarios */}
          {!user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700 text-sm">
                ℹ️ Se enviará un email con la contraseña temporal: <code>ClubCanino2024!</code>
              </p>
            </div>
          )}

          {/* Buttons */}
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
              className="px-4 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (user ? 'Actualizar' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// 🐕 MODAL PARA PERROS
// ============================================

export const DogModal = ({ isOpen, onClose, dog = null, onSave, users = [] }) => {
  const [formData, setFormData] = useState({
    name: dog?.name || '',
    breed: dog?.breed || '',
    size: dog?.size || 'mediano',
    age: dog?.age || '',
    weight: dog?.weight || '',
    color: dog?.color || '',
    owner_id: dog?.owner_id || '',
    notes: dog?.notes || '',
    photo_url: dog?.photo_url || '',
    active: dog?.active ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtrar solo padres para el selector de dueño
  const parentUsers = users.filter(u => u.role === 'padre' && u.active);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dogData = {
        name: formData.name,
        breed: formData.breed,
        size: formData.size,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight || null,
        color: formData.color || null,
        owner_id: formData.owner_id || null,
        notes: formData.notes,
        photo_url: formData.photo_url || null,
        active: formData.active
      };

      if (dog) {
        // Actualizar perro existente
        const { error } = await supabase
          .from('dogs')
          .update(dogData)
          .eq('id', dog.id);

        if (error) throw error;
      } else {
        // Crear nuevo perro
        const { error } = await supabase
          .from('dogs')
          .insert(dogData);

        if (error) throw error;
      }

      onSave && onSave();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            {dog ? '✏️ Editar Perro' : '➕ Nuevo Perro'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del perro *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
              required
              placeholder="Ej: Max, Luna, Rocky"
            />
          </div>

          {/* Dueño */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dueño
            </label>
            <select
              value={formData.owner_id}
              onChange={(e) => setFormData(prev => ({ ...prev, owner_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
            >
              <option value="">Sin asignar</option>
              {parentUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Raza y Color en la misma fila */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raza
              </label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
                placeholder="Ej: Labrador"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
                placeholder="Ej: Dorado"
              />
            </div>
          </div>

          {/* Tamaño */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tamaño
            </label>
            <select
              value={formData.size}
              onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
            >
              <option value="pequeño">🐕 Pequeño (hasta 10kg)</option>
              <option value="mediano">🐕‍🦺 Mediano (10-25kg)</option>
              <option value="grande">🐕‍🦮 Grande (25kg+)</option>
            </select>
          </div>

          {/* Edad y Peso en la misma fila */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Edad (años)
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
                min="0"
                max="25"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas adicionales
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2]"
              rows={3}
              placeholder="Información adicional sobre el perro..."
            />
          </div>

          {/* Estado activo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="dog-active"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="h-4 w-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded"
            />
            <label htmlFor="dog-active" className="ml-2 block text-sm text-gray-700">
              Perro activo en el club
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
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
              className="px-4 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (dog ? 'Actualizar' : 'Crear Perro')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// 📊 MODAL DE EVALUACIÓN DETALLADA
// ============================================

export const EvaluationDetailModal = ({ isOpen, onClose, evaluation }) => {
  if (!isOpen || !evaluation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            📊 Detalle de Evaluación
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Info básica */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Perro</label>
              <p className="text-lg">{evaluation.dog?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Evaluador</label>
              <p className="text-lg">{evaluation.evaluator?.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Fecha</label>
              <p className="text-lg">{new Date(evaluation.date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Ubicación</label>
              <p className="text-lg">{evaluation.location}</p>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {evaluation.energy_level}/10
              </div>
              <div className="text-sm text-gray-600">Energía</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {evaluation.sociability}/10
              </div>
              <div className="text-sm text-gray-600">Sociabilidad</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {evaluation.obedience}/10
              </div>
              <div className="text-sm text-gray-600">Obediencia</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {evaluation.anxiety_level}/10
              </div>
              <div className="text-sm text-gray-600">Ansiedad</div>
            </div>
          </div>

          {/* Notas */}
          {(evaluation.highlights || evaluation.concerns || evaluation.notes) && (
            <div className="space-y-3">
              {evaluation.highlights && (
                <div>
                  <label className="text-sm font-medium text-green-600">✅ Aspectos Positivos</label>
                  <p className="text-gray-700 bg-green-50 p-3 rounded-lg">{evaluation.highlights}</p>
                </div>
              )}
              {evaluation.concerns && (
                <div>
                  <label className="text-sm font-medium text-orange-600">⚠️ Preocupaciones</label>
                  <p className="text-gray-700 bg-orange-50 p-3 rounded-lg">{evaluation.concerns}</p>
                </div>
              )}
              {evaluation.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">📝 Notas Adicionales</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{evaluation.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};