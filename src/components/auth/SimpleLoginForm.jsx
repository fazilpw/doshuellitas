// src/components/auth/SimpleLoginForm.jsx
// LOGIN SIMPLE ACTUALIZADO CON CONDUCTOR
import { useState } from 'react';

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
      // Usuarios de prueba actualizados con conductor
      const testUsers = {
        'maria@gmail.com': { role: 'padre', name: 'María García' },
        'profesor@clubcanino.com': { role: 'profesor', name: 'Carlos Profesor' },
        'conductor@clubcanino.com': { role: 'conductor', name: 'Juan Carlos Conductor' },
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
        authenticated: true,
        loginTime: new Date().toISOString()
      }));

      // Redirigir según rol
      const dashboards = {
        padre: '/app-padre/',
        profesor: '/app-maestro/', 
        conductor: '/dashboard/conductor/',
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
        <div>
          <div className="text-center">
            <img className="mx-auto h-16 w-auto" src="/images/logo.png" alt="Club Canino" />
            <h2 className="mt-6 text-3xl font-extrabold text-[#2C3E50]">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Accede a tu panel personalizado
            </p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-red-600 mr-3">⚠️</div>
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#56CCF2] focus:border-[#56CCF2] focus:z-10 sm:text-sm"
                placeholder="tu@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#56CCF2] focus:border-[#56CCF2] pr-10 sm:text-sm"
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="text-gray-400 hover:text-gray-600">
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#56CCF2] hover:bg-[#5B9BD5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#56CCF2] disabled:opacity-50 transition-colors"
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

          {/* Usuarios de Demo */}
          <div className="mt-6">
            <div className="text-sm text-center text-gray-600 mb-4">
              <span>Usuarios de demo:</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillDemoUser('maria@gmail.com')}
                className="text-left p-3 border border-gray-200 rounded-lg hover:border-[#56CCF2] hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👩</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">María García (Padre)</div>
                    <div className="text-xs text-gray-500">maria@gmail.com</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => fillDemoUser('profesor@clubcanino.com')}
                className="text-left p-3 border border-gray-200 rounded-lg hover:border-[#56CCF2] hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👨‍🏫</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Carlos Profesor</div>
                    <div className="text-xs text-gray-500">profesor@clubcanino.com</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => fillDemoUser('conductor@clubcanino.com')}
                className="text-left p-3 border border-gray-200 rounded-lg hover:border-[#56CCF2] hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🚐</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Juan Carlos (Conductor)</div>
                    <div className="text-xs text-gray-500">conductor@clubcanino.com</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => fillDemoUser('admin@clubcanino.com')}
                className="text-left p-3 border border-gray-200 rounded-lg hover:border-[#56CCF2] hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👑</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Juan Pablo Leal (Admin)</div>
                    <div className="text-xs text-gray-500">admin@clubcanino.com</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Para demo: cualquier contraseña funciona
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleLoginForm;