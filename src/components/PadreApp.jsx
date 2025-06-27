// src/components/PadreApp.jsx - COMPONENTE REACT NATIVO PARA ASTRO (CORREGIDO)
import { useState, useEffect } from 'react';
import ParentDashboard from './dashboard/ParentDashboard.jsx';

const PadreApp = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#56CCF2] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🐕</span>
          </div>
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">Cargando Dashboard</h2>
          <p className="text-gray-600">Conectando con AuthProvider...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      <ParentDashboard />
    </div>
  );
};

export default PadreApp;