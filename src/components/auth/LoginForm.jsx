// src/components/auth/LoginForm.jsx - VERSIÓN SIMPLIFICADA SIN AUTHPROVIDER
import { useState } from 'react';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Usuarios mock para desarrollo
  const mockUsers = {
    'maria@gmail.com': { password: '123456', role: 'padre', name: 'María García' },
    'profesor@clubcanino.com': { password: '123456', role: 'profesor', name: 'Carlos Profesor' },
    'admin@clubcanino.com': { password: '123456', role: 'admin', name: 'Juan Pablo' },
    'conductor@clubcanino.com': { password: '123456', role: 'conductor', name: 'Juan Carlos' }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);

    try {
      // Simular delay de autenticación
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar credenciales mock
      const user = mockUsers[formData.email.toLowerCase()];
      
      if (!user || user.password !== formData.password) {
        setError('Email o contraseña incorrectos');
        setLoading(false);
        return;
      }

      // Guardar usuario en localStorage para mock
      const userData = {
        authenticated: true,
        email: formData.email,
        name: user.name,
        role: user.role,
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem('clubCanino_user', JSON.stringify(userData));

      // Redirigir según el rol
      const redirectUrls = {
        padre: '/app-padre',
        profesor: '/app-maestro',
        admin: '/dashboard/admin',
        conductor: '/dashboard/conductor'
      };

      window.location.href = redirectUrls[user.role] || '/app-padre';

    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Limpiar error al escribir
    if (error) setError('');
  };

  const fillDemoCredentials = (userType) => {
    const credentials = {
      padre: { email: 'maria@gmail.com', password: '123456' },
      profesor: { email: 'profesor@clubcanino.com', password: '123456' },
      admin: { email: 'admin@clubcanino.com', password: '123456' }
    };
    
    setFormData(credentials[userType]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-4">🐕</div>
          <h2 className="text-3xl font-bold text-[#2C3E50]">
            Club Canino Dos Huellitas
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Iniciar Sesión
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-400 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error de Autenticación
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Buttons */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-3">🎯 Acceso Rápido Demo:</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('padre')}
              className="bg-blue-600 text-white px-3 py-2 rounded text-xs hover:bg-blue-700 transition-colors"
            >
              👨‍👩‍👧‍👦 Padre
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('profesor')}
              className="bg-green-600 text-white px-3 py-2 rounded text-xs hover:bg-green-700 transition-colors"
            >
              👨‍🏫 Profesor
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('admin')}
              className="bg-purple-600 text-white px-3 py-2 rounded text-xs hover:bg-purple-700 transition-colors"
            >
              👑 Admin
            </button>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                placeholder="usuario@ejemplo.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#56CCF2] focus:border-[#56CCF2] pr-10"
                  placeholder="Tu contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <span className="text-gray-400 text-sm">
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#56CCF2] hover:bg-[#5B9BD5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#56CCF2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                '🔑 Iniciar Sesión'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿Problemas para acceder?{' '}
            <a href="https://wa.me/573144329824" target="_blank" rel="noopener noreferrer" className="text-[#56CCF2] hover:text-[#5B9BD5]">
              Contacta por WhatsApp
            </a>
          </p>
        </div>

        {/* Credentials Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">📋 Credenciales de Prueba:</h4>
          <div className="text-xs space-y-1 text-gray-600">
            <div><strong>Padre:</strong> maria@gmail.com / 123456</div>
            <div><strong>Profesor:</strong> profesor@clubcanino.com / 123456</div>
            <div><strong>Admin:</strong> admin@clubcanino.com / 123456</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;