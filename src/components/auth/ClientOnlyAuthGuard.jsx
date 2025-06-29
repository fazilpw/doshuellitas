// src/components/auth/ClientOnlyAuthGuard.jsx
// 🛡️ GUARD QUE GARANTIZA EJECUCIÓN SOLO DEL LADO DEL CLIENTE
// Solución definitiva para problemas de SSR en Astro + React

import { useState, useEffect } from 'react';

// ===============================================
// 🔧 HOOK PARA DETECTAR SI ESTAMOS EN EL CLIENTE
// ===============================================

const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // Este useEffect solo se ejecuta del lado del cliente
    setIsClient(true);
  }, []);
  
  return isClient;
};

// ===============================================
// 🛡️ COMPONENTE GUARD PARA AUTENTICACIÓN
// ===============================================

export const ClientOnlyAuthGuard = ({ children, fallback = null }) => {
  const isClient = useIsClient();
  
  // Mientras no estemos en el cliente, mostrar fallback o loading
  if (!isClient) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🐕</div>
          <div className="text-xl font-semibold text-[#2C3E50] mb-2">
            Iniciando Club Canino...
          </div>
          <div className="text-sm text-gray-600">
            Cargando sistema de autenticación
          </div>
        </div>
      </div>
    );
  }
  
  // Una vez en el cliente, renderizar children
  return children;
};

// ===============================================
// 🔐 LOGIN FORM SIN CONTEXTO (TEMPORAL)
// ===============================================

export const SimpleLoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validación básica
      if (!formData.email || !formData.password) {
        setError('Por favor ingresa email y contraseña');
        return;
      }
      
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
        let redirectPath = '/dashboard/padre/';
        
        if (profile?.role === 'profesor') {
          redirectPath = '/dashboard/profesor/';
        } else if (profile?.role === 'admin') {
          redirectPath = '/dashboard/admin/';
        }
        
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔒 Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent pr-12"
                  placeholder="••••••••"
                  disabled={loading}
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
            
            {/* Error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                <div className="text-red-700 text-sm">❌ {error}</div>
              </div>
            )}
            
            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#56CCF2] to-[#2C3E50] hover:from-[#2C3E50] hover:to-[#56CCF2] text-white p-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
            >
              {loading ? '🔄 Iniciando sesión...' : '🚀 Iniciar Sesión'}
            </button>
          </form>
          
          {/* Quick Login para Testing */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">🧪 Login rápido (testing)</p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleQuickLogin('maria@ejemplo.com')}
                className="text-sm bg-green-100 hover:bg-green-200 text-green-800 p-2 rounded-lg transition-colors"
                disabled={loading}
              >
                👩‍🦱 María (Padre)
              </button>
              <button
                onClick={() => handleQuickLogin('profesor3@clubcanino.com')}
                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 p-2 rounded-lg transition-colors"
                disabled={loading}
              >
                👨‍🏫 Carlos (Profesor)
              </button>
              <button
                onClick={() => handleQuickLogin('admin@clubcanino.com')}
                className="text-sm bg-purple-100 hover:bg-purple-200 text-purple-800 p-2 rounded-lg transition-colors"
                disabled={loading}
              >
                👑 Juan Pablo (Admin)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================================
// 🎯 PÁGINA DE LOGIN COMPLETA (SOLO CLIENTE)
// ===============================================

export const ClientOnlyLoginPage = () => {
  return (
    <ClientOnlyAuthGuard>
      <SimpleLoginForm />
    </ClientOnlyAuthGuard>
  );
};

// ===============================================
// 🛡️ WRAPPER PARA DASHBOARDS PROTEGIDOS
// ===============================================

export const ProtectedDashboard = ({ children, requiredRole }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuthenticated: false,
    user: null,
    profile: null,
    error: null
  });
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Importación dinámica para evitar SSR
        const { authService } = await import('../../lib/authService.js');
        
        // Inicializar si no está listo
        if (!authService.isInitialized) {
          await authService.initialize();
        }
        
        // Verificar autenticación
        if (authService.isAuthenticated) {
          const profile = authService.profile;
          
          // Verificar rol si es requerido
          if (requiredRole && profile?.role !== requiredRole) {
            throw new Error(`Acceso denegado. Se requiere rol: ${requiredRole}`);
          }
          
          setAuthState({
            loading: false,
            isAuthenticated: true,
            user: authService.user,
            profile: authService.profile,
            error: null
          });
        } else {
          // No autenticado, redirigir a login
          window.location.href = '/login/';
        }
      } catch (error) {
        console.error('❌ Error verificando auth:', error);
        setAuthState({
          loading: false,
          isAuthenticated: false,
          user: null,
          profile: null,
          error: error.message
        });
      }
    };
    
    checkAuth();
  }, [requiredRole]);
  
  // Loading
  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🐕</div>
          <div className="text-xl font-semibold text-[#2C3E50] mb-2">
            Verificando acceso...
          </div>
          <div className="text-sm text-gray-600">
            Cargando dashboard
          </div>
        </div>
      </div>
    );
  }
  
  // Error
  if (authState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4]">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-600 mb-4">Error de Acceso</h2>
          <p className="text-gray-600 mb-6">{authState.error}</p>
          <button 
            onClick={() => window.location.href = '/login/'}
            className="w-full bg-[#56CCF2] hover:bg-[#2C3E50] text-white p-3 rounded-lg font-semibold transition-colors"
          >
            🔐 Ir al Login
          </button>
        </div>
      </div>
    );
  }
  
  // Dashboard autenticado
  return children;
};

export default ClientOnlyAuthGuard;