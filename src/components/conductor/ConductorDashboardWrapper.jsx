// src/components/conductor/ConductorDashboardWrapper.jsx
// WRAPPER QUE CONECTA AuthContext CON ConductorDashboard

import { useAuth } from '../auth/AuthContext.jsx';
import ConductorDashboard from './ConductorDashboard.jsx';

const ConductorDashboardWrapper = () => {
  const { user, profile, loading, error } = useAuth();

  // Mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#56CCF2] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🚐</span>
          </div>
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">Cargando Dashboard</h2>
          <p className="text-gray-600">Conectando con sistema del conductor...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-800 mb-4">Error de Conexión</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Verificar autorización
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">Acceso Requerido</h2>
          <p className="text-gray-600 mb-6">Necesitas iniciar sesión para acceder al dashboard del conductor</p>
          <a 
            href="/login" 
            className="bg-[#56CCF2] text-white py-3 px-6 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            🔑 Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  // Verificar rol de conductor
  if (profile && profile.role !== 'conductor' && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">Esta página es solo para conductores del Club Canino</p>
          <a 
            href="/dashboard/padre" 
            className="bg-[#56CCF2] text-white py-3 px-6 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            🏠 Ir a Mi Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Preparar datos del usuario para el componente
  const userData = {
    id: user.id,
    email: user.email,
    name: profile?.full_name || user.email?.split('@')[0] || 'Conductor',
    role: profile?.role || 'conductor',
    phone: profile?.phone || null,
    avatar: profile?.avatar_url || null
  };

  // Renderizar dashboard
  return <ConductorDashboard user={userData} />;
};

export default ConductorDashboardWrapper;