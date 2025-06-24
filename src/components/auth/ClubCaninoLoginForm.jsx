// src/components/auth/ClubCaninoLoginForm.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider.jsx';

// ============================================
// 🔐 COMPONENTE DE LOGIN CLUB CANINO
// ============================================

export default function ClubCaninoLoginForm() {
  const { signIn, isPending, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // ============================================
  // 🔄 EFECTOS
  // ============================================

  useEffect(() => {
    // Redireccionar si ya está autenticado
    if (isAuthenticated) {
      handleSuccessfulLogin();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Cargar email guardado si existe
    const savedEmail = localStorage.getItem('club-canino-remember-email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // ============================================
  // 📝 MANEJO DEL FORMULARIO
  // ============================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar email
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    
    // Validar password
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setErrors({});
      
      await signIn({
        email: formData.email,
        password: formData.password
      });
      
      // Guardar email si "recordar" está activado
      if (rememberMe) {
        localStorage.setItem('club-canino-remember-email', formData.email);
      } else {
        localStorage.removeItem('club-canino-remember-email');
      }
      
      console.log('✅ Login exitoso');
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      setErrors({
        submit: getClubFriendlyErrorMessage(error.message)
      });
    }
  };

  // ============================================
  // 🎭 MODO DEMO
  // ============================================

  const handleDemoLogin = async (role) => {
    const demoCredentials = {
      padre: {
        email: 'maria@gmail.com',
        password: 'demo123'
      },
      profesor: {
        email: 'profesor@clubcanino.com',
        password: 'demo123'
      },
      admin: {
        email: 'admin@clubcanino.com',
        password: 'demo123'
      }
    };

    const credentials = demoCredentials[role];
    if (!credentials) return;

    setFormData(credentials);
    
    try {
      await signIn(credentials);
    } catch (error) {
      console.error('Error en login demo:', error);
      setErrors({
        submit: 'Error en modo demo. Los datos de prueba no están configurados.'
      });
    }
  };

  // ============================================
  // 🔄 REDIRECCIÓN POST-LOGIN
  // ============================================

  const handleSuccessfulLogin = () => {
    // Verificar si hay URL de redirección guardada
    const redirectUrl = localStorage.getItem('redirect_after_login');
    
    if (redirectUrl) {
      localStorage.removeItem('redirect_after_login');
      window.location.href = redirectUrl;
    } else {
      // Redirección por defecto basada en rol
      window.location.href = '/app';
    }
  };

  // ============================================
  // 🎨 RENDER DEL COMPONENTE
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header del Club Canino */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-[#56CCF2] rounded-full flex items-center justify-center mb-6 shadow-lg">
            <span className="text-4xl">🐕</span>
          </div>
          
          <h2 className="text-3xl font-bold text-[#2C3E50] mb-2">
            Bienvenido al Club Canino
          </h2>
          <p className="text-gray-600">
            Donde el cuidado y la confianza se unen
          </p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                📧 Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isPending}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent transition-colors ${
                  errors.email 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-white'
                }`}
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                🔒 Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isPending}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent transition-colors pr-12 ${
                    errors.password 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Recordar y Olvide */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Recordar email</span>
              </label>
              
              <button
                type="button"
                className="text-sm text-[#56CCF2] hover:text-[#5B9BD5] transition-colors"
                onClick={() => alert('Contacta al admin para recuperar contraseña')}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Error General */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <span className="text-red-400 mr-2">❌</span>
                  <p className="text-sm text-red-700">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isPending}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                isPending
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#56CCF2] hover:bg-[#5B9BD5] hover:shadow-lg active:transform active:scale-95'
              }`}
            >
              {isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Ingresando...
                </div>
              ) : (
                '🐾 Ingresar al Club'
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="mt-8 mb-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o prueba el modo demo</span>
            </div>
          </div>

          {/* Botones Demo */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('padre')}
              disabled={isPending}
              className="py-2 px-3 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              👨‍👩‍👧‍👦 Padre
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('profesor')}
              disabled={isPending}
              className="py-2 px-3 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              👨‍🏫 Profesor
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              disabled={isPending}
              className="py-2 px-3 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
            >
              👑 Admin
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              ¿No tienes cuenta?{' '}
              <a href="/registro" className="text-[#56CCF2] hover:text-[#5B9BD5]">
                Contacta al administrador
              </a>
            </p>
          </div>
        </div>

        {/* Info adicional */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            📱 Esta app funciona mejor instalada en tu dispositivo
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 🛠️ FUNCIONES AUXILIARES
// ============================================

function getClubFriendlyErrorMessage(errorMessage) {
  const errorMap = {
    'Invalid login credentials': 'Email o contraseña incorrectos',
    'Email not confirmed': 'Debes confirmar tu email antes de ingresar',
    'Too many requests': 'Demasiados intentos. Espera unos minutos',
    'User not found': 'Usuario no encontrado',
    'Invalid password': 'Contraseña incorrecta',
    'Network error': 'Error de conexión. Verifica tu internet',
    'Invalid email': 'Formato de email inválido'
  };

  // Buscar mensaje específico
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Mensaje genérico si no se encuentra uno específico
  return 'Error al iniciar sesión. Verifica tus datos e inténtalo de nuevo.';
}