// src/utils/logoutHandler.jsx
// ✅ CORREGIDO: Extensión .jsx para JSX content

import { useState } from 'react';

// Función universal de logout
export const universalLogout = async () => {
  try {
    console.log('🚪 Iniciando logout universal...');
    
    // Confirmación del usuario
    const confirmed = confirm('¿Estás seguro de que quieres cerrar sesión?');
    if (!confirmed) {
      console.log('❌ Logout cancelado por el usuario');
      return { success: false, cancelled: true };
    }

    // Importar authService dinámicamente
    const { authService } = await import('../lib/authService.js');
    
    if (!authService) {
      throw new Error('AuthService no disponible');
    }

    console.log('🔄 Ejecutando signOut...');
    
    // Ejecutar logout
    const result = await authService.signOut();
    
    if (result?.success) {
      console.log('✅ SignOut exitoso');
      
      // Limpiar todo el storage local
      try {
        if (typeof window !== 'undefined') {
          // Limpiar Supabase
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('sb-supabase-auth-token');
          
          // Limpiar cache de Club Canino
          localStorage.removeItem('club-canino-cache');
          localStorage.removeItem('club-canino-user');
          
          // Limpiar todo sessionStorage
          sessionStorage.clear();
          
          console.log('✅ Storage limpiado');
        }
      } catch (e) {
        console.warn('⚠️ No se pudo limpiar storage:', e);
      }
      
      // Pausa para asegurar que todo se procese
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Redireccionar con fuerza
      if (typeof window !== 'undefined') {
        console.log('🔄 Redirigiendo a login...');
        
        try {
          window.location.replace('/login/');
        } catch (e) {
          window.location.href = '/login/';
        }
      }
      
      return { success: true };
    } else {
      console.error('❌ Error en signOut:', result?.error);
      throw new Error(result?.error || 'Error en signOut');
    }
    
  } catch (error) {
    console.error('❌ Error crítico en logout:', error);
    
    // FALLBACK EXTREMO: Limpiar TODO y redireccionar
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        console.log('🧹 Limpieza completa de emergencia realizada');
      }
    } catch (e) {
      console.error('❌ Error en limpieza de emergencia:', e);
    }
    
    alert('Ocurrió un error al cerrar sesión, pero serás desconectado por seguridad.');
    
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        try {
          window.location.replace('/login/');
        } catch (e) {
          window.location.href = '/login/';
        }
      }, 500);
    }
    
    return { success: false, error: error.message };
  }
};

// Hook personalizado para logout
export const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) {
      console.log('⚠️ Logout ya en progreso, ignorando...');
      return;
    }
    
    setIsLoggingOut(true);
    console.log('🔄 Hook useLogout ejecutando...');
    
    try {
      const result = await universalLogout();
      return result;
    } finally {
      setTimeout(() => {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          setIsLoggingOut(false);
        }
      }, 1000);
    }
  };

  return { logout, isLoggingOut };
};

// Componente botón logout universal
export const LogoutButton = ({ 
  className = '', 
  children,
  title = 'Cerrar sesión',
  showText = false,
  variant = 'default' 
}) => {
  const { logout, isLoggingOut } = useLogout();

  // Estilos según variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'header':
        return 'p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors';
      case 'mobile':
        return 'p-2 rounded-lg hover:bg-gray-100 transition-colors';
      case 'sidebar':
        return 'w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors';
      default:
        return 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors';
    }
  };

  // Contenido del botón según variante
  const getButtonContent = () => {
    if (isLoggingOut) {
      return <span className="animate-spin">⏳</span>;
    }

    if (children) {
      return children;
    }

    if (variant === 'sidebar') {
      return (
        <>
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </>
      );
    }

    if (showText) {
      return (
        <>
          <span>🚪</span>
          <span className="ml-2">Cerrar sesión</span>
        </>
      );
    }

    return '🚪';
  };

  return (
    <button
      onClick={logout}
      disabled={isLoggingOut}
      className={`
        ${getVariantStyles()}
        ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      title={title}
    >
      {getButtonContent()}
    </button>
  );
};