// src/components/auth/SimpleLoginForm.jsx
// LOGIN SIMPLE SIN CONTEXT - FUNCIONA INMEDIATAMENTE
import { useState } from 'react';
import supabase from '../../lib/supabase.js';

const SimpleLoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Para demo, no validar contraseña real
      const testUsers = {
        'maria@gmail.com': { role: 'padre', name: 'María García' },
        'profesor@clubcanino.com': { role: 'profesor', name: 'Carlos Profesor' },
        'admin@clubcanino.com': { role: 'admin', name: 'Juan Pablo Leal' }
      };

      const user = testUsers[formData.email.toLowerCase()];
      
      if (!user) {
        throw new Error('Usuario no encontrado. Usa uno de los emails de prueba.');
      }

      // Simular login exitoso
      console.log('✅ Login exitoso:', user);
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('clubCanino_user', JSON.stringify({
        email: formData.email,
        role: user.role,
        name: user.name,
        authenticated: true
      }));

      // Redirigir según rol
      const dashboards = {
        padre: '/dashboard/padre/',
        profesor: '/dashboard/profesor/', 
        admin: '/dashboard/admin/'
      };

      window.location.href = dashboards[user.role] || '/dashboard/padre/';
      
    } catch (err) {
      console.error('❌ Error login:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const fillDemoUser = (email) => {
    setFormData({ email, password: 'demo123' });
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>

        {/* Demo Users - CLICKEABLES */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-3">👥 Usuarios de Prueba (Click para usar):</h4>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fillDemoUser('maria@gmail.com')}
              className="w-full text-left p-2 text-sm bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
              disabled={loading}
            >
              <strong>👨‍👩‍👧‍👦 Padre:</strong> maria@gmail.com
            </button>
            <button
              type="button"
              onClick={() => fillDemoUser('profesor@clubcanino.com')}
              className="w-full text-left p-2 text-sm bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
              disabled={loading}
            >
              <strong>👨‍🏫 Profesor:</strong> profesor@clubcanino.com
            </button>
            <button
              type="button"
              onClick={() => fillDemoUser('admin@clubcanino.com')}
              className="w-full text-left p-2 text-sm bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
              disabled={loading}
            >
              <strong>👑 Admin:</strong> admin@clubcanino.com
            </button>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            Click en cualquier usuario para llenar el formulario automáticamente
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <a
            href="/"
            className="text-sm text-[#56CCF2] hover:text-[#5B9BD5] transition-colors"
          >
            ← Volver al inicio
          </a>
        </div>

      </div>
    </div>
  );
};

export default SimpleLoginForm;