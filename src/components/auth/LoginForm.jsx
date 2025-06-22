// src/components/auth/LoginForm.jsx
import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        throw new Error('Usuario no encontrado');
      }

      localStorage.setItem('user', JSON.stringify(user));
      
      if (user.role === 'padre') {
        window.location.href = '/dashboard/padre';
      } else if (user.role === 'profesor') {
        window.location.href = '/dashboard/profesor';
      } else if (user.role === 'admin') {
        window.location.href = '/dashboard/admin';
      }

    } catch (error) {
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    setLoading(true);
    
    const demoUsers = {
      padre: { 
        id: '1', 
        email: 'maria@gmail.com', 
        name: 'María García', 
        role: 'padre' 
      },
      profesor: { 
        id: '2', 
        email: 'profesor@clubcanino.com', 
        name: 'Carlos Profesor', 
        role: 'profesor' 
      },
      admin: { 
        id: '3', 
        email: 'admin@clubcanino.com', 
        name: 'Juan Pablo Leal', 
        role: 'admin' 
      }
    };

    const user = demoUsers[role];
    localStorage.setItem('user', JSON.stringify(user));
    
    setTimeout(() => {
      window.location.href = `/dashboard/${role}`;
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <img 
            src="/logo.svg" 
            alt="Club Canino Dos Huellitas" 
            className="mx-auto h-20 w-auto"
          />
          <h2 className="mt-6 text-3xl font-bold text-[#2C3E50]">
            Bienvenido de vuelta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accede a tu panel de control
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#56CCF2] focus:border-[#56CCF2] focus:z-10 sm:text-sm"
                placeholder="tu@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#56CCF2] focus:border-[#56CCF2] focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#56CCF2] hover:bg-[#5B9BD5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#56CCF2] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Ingresando...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#FFFBF0] text-gray-500">Acceso demo</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <button
              onClick={() => handleDemoLogin('padre')}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-[#56CCF2] text-sm font-medium rounded-md text-[#56CCF2] bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              👨‍👩‍👧‍👦 Acceder como Padre
            </button>
            
            <button
              onClick={() => handleDemoLogin('profesor')}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-[#C7EA46] text-sm font-medium rounded-md text-[#2C3E50] bg-[#C7EA46] hover:bg-[#FFFE8D] disabled:opacity-50"
            >
              👨‍🏫 Acceder como Profesor
            </button>
            
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-[#AB5729] text-sm font-medium rounded-md text-white bg-[#AB5729] hover:bg-opacity-90 disabled:opacity-50"
            >
              ⚙️ Acceder como Admin
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <a 
              href="https://wa.me/573144329824?text=Hola,%20quiero%20crear%20una%20cuenta%20en%20Club%20Canino" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-[#56CCF2] hover:text-[#5B9BD5]"
            >
              Contáctanos por WhatsApp
            </a>
          </p>
          
          <p className="mt-2 text-sm text-gray-600">
            <a href="/" className="font-medium text-[#56CCF2] hover:text-[#5B9BD5]">
              ← Volver al inicio
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;