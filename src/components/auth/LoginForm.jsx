// src/components/auth/LoginForm.jsx - VERSIÓN CON AUTENTICACIÓN REAL
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

const LoginForm = () => {
  const { signIn, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showRegisteredMessage, setShowRegisteredMessage] = useState(false);

  // ============================================
  // 🔄 EFFECT PARA DETECTAR REGISTRO EXITOSO
  // ============================================
  
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('registered') === 'true') {
        setShowRegisteredMessage(true);
      }
    }
  }, []);

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
        // El AuthContext se encargará de la redirección automática
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
  // 🎯 UTILIDADES DE UI
  // ============================================
  
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const getErrorMessage = () => {
    return localError || error;
  };

  // ============================================
  // 🎨 RENDERIZADO
  // ============================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <img className="mx-auto h-20 w-auto" src="/images/logo.png" alt="Club Canino Dos Huellitas" />
          <h2 className="mt-6 text-3xl font-bold text-[#2C3E50]">
            Bienvenido de vuelta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión en tu cuenta de Club Canino
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="tu@email.com"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
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
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <span>{showPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
            </div>

            {/* Mensaje de error */}
            {getErrorMessage() && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">
                  {getErrorMessage()}
                </p>
              </div>
            )}

            {/* Mensaje de registro exitoso */}
            {new URLSearchParams(window.location.search).get('registered') === 'true' && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-800">
                  🎉 ¡Registro exitoso! Revisa tu email para confirmar tu cuenta y luego inicia sesión.
                </p>
              </div>
            )}

            {/* Botón de submit */}
            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#56CCF2] hover:bg-[#2C3E50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>

            {/* Enlaces adicionales */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta? 
                <a href="/register" className="font-medium text-[#56CCF2] hover:text-[#2C3E50] transition-colors ml-1">
                  Regístrate aquí
                </a>
              </p>
              
              <a href="/forgot-password" className="text-sm text-gray-500 hover:text-[#56CCF2] transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

          </form>
        </div>

        {/* Credenciales de prueba para desarrollo */}
        {typeof window !== 'undefined' && import.meta.env.MODE === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">🧪 Cuentas de Prueba:</h4>
            <div className="text-xs text-yellow-700 space-y-1">
              <div><strong>Admin:</strong> admin@clubcanino.com / 123456</div>
              <div><strong>Profesor:</strong> profesor@clubcanino.com / 123456</div>
              <div><strong>Padre:</strong> maria@gmail.com / 123456</div>
            </div>
          </div>
        )}

        {/* Info adicional */}
        <div className="text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl">🐕</span>
            </div>
            <p className="text-sm text-blue-800 font-medium">
              Club Canino Dos Huellitas
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Plataforma integral para el bienestar de tu mascota
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginForm;