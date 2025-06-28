// src/components/auth/LoginForm.jsx
// 🔐 FORMULARIO DE LOGIN SIMPLIFICADO
import { useState } from 'react';
import { useAuth } from './AuthProvider.jsx';

export default function LoginForm() {
  const { signIn, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // ============================================
  // 📝 MANEJO DEL FORMULARIO
  // ============================================
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores al escribir
    if (localError) setLocalError('');
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    // Validación básica
    if (!formData.email || !formData.password) {
      setLocalError('Por favor ingresa email y contraseña');
      return;
    }

    if (!formData.email.includes('@')) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }

    try {
      // Intentar login con Supabase
      const result = await signIn(formData.email, formData.password);
      
      if (result.success) {
        // El AuthProvider se encargará de la redirección automática
        console.log('✅ Login exitoso');
      } else {
        // Mostrar error específico
        setLocalError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('❌ Error en login:', err);
      setLocalError('Error de conexión. Intenta nuevamente.');
    }
  };

  // ============================================
  // 🎨 RENDERIZADO
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Tarjeta principal */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🐕</div>
            <h2 className="text-3xl font-bold text-[#2C3E50] mb-2">
              ¡Hola de nuevo!
            </h2>
            <p className="text-gray-600">
              Ingresa a tu cuenta del Club Canino Dos Huellitas
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                📧 Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="tu@email.com"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                🔒 Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error Messages */}
            {(localError || error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <p className="text-red-700 text-sm font-medium">
                    {localError || error}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#56CCF2] text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-[#5B9BD5] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Ingresando...
                </div>
              ) : (
                'Ingresar 🚀'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Problemas para ingresar?{' '}
              <a 
                href="mailto:admin@clubcaninodoshuellitas.com" 
                className="text-[#56CCF2] hover:text-[#5B9BD5] font-medium"
              >
                Contáctanos
              </a>
            </p>
          </div>
        </div>

        {/* Usuarios de prueba */}
        <div className="mt-6 bg-white/80 rounded-lg p-4 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">🧪 Usuarios de prueba:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>👤 <strong>Padre:</strong> padre@test.com / 123456</div>
            <div>🧑‍🏫 <strong>Profesor:</strong> profesor@test.com / 123456</div>
            <div>⭐ <strong>Admin:</strong> admin@test.com / 123456</div>
          </div>
        </div>
      </div>
    </div>
  );
}