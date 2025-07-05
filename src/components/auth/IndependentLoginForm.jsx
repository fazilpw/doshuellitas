// src/components/auth/IndependentLoginForm.jsx
// 🔐 FORMULARIO DE LOGIN INDEPENDIENTE - SIN CONTEXTO AUTH
// Esta implementación NO depende de useAuth() y maneja su propio estado

import { useState } from 'react';

const IndependentLoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ============================================
  // 🔄 MANEJO DEL FORMULARIO
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('🔐 Iniciando login independiente...');
      
      // Importación dinámica de Supabase para evitar SSR
      const { authService } = await import('../../lib/authService.js');
      
      // Inicializar si no está listo
      if (!authService.isInitialized) {
        await authService.initialize();
      }
      
      // Intentar login
      const result = await authService.signIn(formData.email, formData.password);
      
      if (result.success) {
        console.log('✅ Login exitoso, redirigiendo...');
        
        // Redirección manual basada en el rol
        const profile = result.profile;
        const roleRedirectMap = {
          'padre': '/dashboard/padre/',
          'profesor': '/dashboard/profesor/',
          'admin': '/dashboard/admin/',
          'conductor': '/dashboard/conductor/'
        };

        const redirectPath = roleRedirectMap[profile?.role] || '/dashboard/padre/';
        console.log(`🔄 Redirigiendo ${profile?.role} a: ${redirectPath}`);

        // Redirección forzada
        window.location.href = redirectPath;
      } else {
        setError(result.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error('❌ Error en login:', err);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email) => {
    setFormData({ email, password: '123456' });
  };

  // ============================================
  // 🎨 RENDER DEL FORMULARIO
  // ============================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#2C3E50] p-6 text-white text-center">
          <div className="text-4xl mb-2">🐕</div>
          <h1 className="text-2xl font-bold">Club Canino</h1>
          <p className="text-blue-100">Dos Huellitas</p>
        </div>
        
        {/* Formulario */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📧 Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent transition-all"
                placeholder="tu@email.com"
                disabled={loading}
                required
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔒 Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent transition-all pr-12"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm font-medium">❌ {error}</p>
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#56CCF2] to-[#2C3E50] text-white p-3 rounded-lg font-semibold hover:from-[#2C3E50] hover:to-[#56CCF2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">🔄</span>
                  Iniciando sesión...
                </span>
              ) : (
                '🚀 Iniciar Sesión'
              )}
            </button>
          </form>
          
          {/* Quick Login para Testing */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center font-medium">
              🧪 Login rápido (testing)
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleQuickLogin('maria@ejemplo.com')}
                className="text-sm bg-green-100 hover:bg-green-200 text-green-800 p-2 rounded-lg transition-colors font-medium"
                disabled={loading}
              >
                👩‍🦱 María (Padre)
              </button>
              <button
                onClick={() => handleQuickLogin('profesor3@clubcanino.com')}
                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 p-2 rounded-lg transition-colors font-medium"
                disabled={loading}
              >
                👨‍🏫 Carlos (Profesor)
              </button>
              <button
                onClick={() => handleQuickLogin('admin@clubcanino.com')}
                className="text-sm bg-purple-100 hover:bg-purple-200 text-purple-800 p-2 rounded-lg transition-colors font-medium"
                disabled={loading}
              >
                👑 Juan Pablo (Admin)
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              ¿Problemas? Contacta al administrador
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default IndependentLoginForm;