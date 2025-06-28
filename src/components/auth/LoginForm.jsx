// src/components/auth/LoginForm.jsx
// 🛡️ FORMULARIO DE LOGIN ROBUSTO CONTRA PROBLEMAS DE HIDRATACIÓN
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider.jsx';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Obtener contexto con protección
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('❌ Error obteniendo contexto de auth:', error);
    authContext = null;
  }

  // ============================================
  // 🛡️ PROTECCIONES DE HIDRATACIÓN
  // ============================================
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && authContext) {
      // Esperar un poco para que el AuthProvider se inicialice completamente
      const timer = setTimeout(() => {
        setAuthReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isClient, authContext]);

  useEffect(() => {
    // Si ya está autenticado, redirigir
    if (authReady && authContext?.isAuthenticated) {
      console.log('✅ Usuario ya autenticado, redirigiendo...');
      const dashboard = authContext.redirectToDashboard();
      if (typeof window !== 'undefined') {
        window.location.href = dashboard;
      }
    }
  }, [authReady, authContext?.isAuthenticated]);

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
    if (authContext?.error) authContext.clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);
    
    try {
      // Validación básica
      if (!formData.email || !formData.password) {
        setLocalError('Por favor ingresa email y contraseña');
        return;
      }

      if (!formData.email.includes('@')) {
        setLocalError('Por favor ingresa un email válido');
        return;
      }

      // Verificación robusta del contexto
      if (!authContext) {
        setLocalError('Sistema de autenticación no disponible. Recarga la página.');
        return;
      }

      if (!authContext.signIn) {
        setLocalError('Función de login no disponible. Recarga la página.');
        return;
      }

      if (typeof authContext.signIn !== 'function') {
        setLocalError('Error en el sistema de autenticación. Intenta recargar.');
        console.error('❌ signIn no es una función:', typeof authContext.signIn);
        return;
      }

      console.log('🔄 Intentando login con:', formData.email);
      
      // Intentar login
      const result = await authContext.signIn(formData.email, formData.password);
      
      if (result?.success) {
        console.log('✅ Login exitoso');
        // El AuthProvider manejará la redirección
      } else {
        setLocalError(result?.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('❌ Error en login:', err);
      setLocalError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick login para facilitar testing
  const handleQuickLogin = (email) => {
    setFormData({
      email: email,
      password: '123456'
    });
  };

  // ============================================
  // 🎨 RENDERIZADO
  // ============================================

  // Mostrar loading hasta que todo esté listo
  if (!isClient || !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="text-center">
          <div className="text-6xl mb-4">🐕</div>
          <div className="text-xl font-semibold text-[#2C3E50]">Cargando Club Canino...</div>
          <div className="mt-2 text-sm text-gray-600">
            {!isClient ? 'Iniciando aplicación...' : 'Preparando autenticación...'}
          </div>
        </div>
      </div>
    );
  }

  // Error de contexto
  if (!authContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-4">Error del Sistema</h2>
          <p className="text-gray-600 mb-6">
            No se pudo inicializar el sistema de autenticación.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            🔄 Recargar Página
          </button>
        </div>
      </div>
    );
  }

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
              Ingresa a tu cuenta del Club Canino
            </p>
          </div>

          {/* Quick Login para testing */}
          {import.meta.env.DEV && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">🚀 Login Rápido</h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleQuickLogin('admin@clubcanino.com')}
                  className="text-xs bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"
                >
                  👑 Admin
                </button>
                <button
                  onClick={() => handleQuickLogin('profesor@clubcanino.com')}
                  className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
                >
                  👨‍🏫 Profesor
                </button>
                <button
                  onClick={() => handleQuickLogin('maria@gmail.com')}
                  className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200"
                >
                  👩 Padre
                </button>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📧 Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                placeholder="tu@email.com"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔒 Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent pr-12"
                  placeholder="Tu contraseña"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isSubmitting}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error Messages */}
            {(localError || authContext?.error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="text-red-400 mr-3">⚠️</div>
                  <div className="text-sm text-red-700">
                    {localError || authContext.error}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || authContext?.loading}
              className="w-full bg-[#56CCF2] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#4BB8E8] focus:outline-none focus:ring-2 focus:ring-[#56CCF2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </span>
              ) : (
                '🚀 Ingresar'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              ¿Problemas para ingresar?{' '}
              <a href="/contacto" className="text-[#56CCF2] hover:underline">
                Contáctanos
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}