// src/components/dashboard/SimpleTeacherTest.jsx
// 🧪 COMPONENTE SIMPLE PARA TESTEAR PROFESOR

import { useState, useEffect } from 'react';

const SimpleTeacherTest = () => {
  const [status, setStatus] = useState('Iniciando...');
  const [authInfo, setAuthInfo] = useState(null);

  useEffect(() => {
    const testAuth = async () => {
      try {
        setStatus('⏳ Importando authService...');
        
        const { authService } = await import('../../lib/authService.js');
        
        setStatus('✅ AuthService importado');
        
        if (!authService.isInitialized) {
          setStatus('⏳ Inicializando authService...');
          await authService.initialize();
        }
        
        setStatus('✅ AuthService inicializado');
        
        const authData = {
          isAuthenticated: authService.isAuthenticated,
          user: authService.user ? {
            id: authService.user.id,
            email: authService.user.email
          } : null,
          profile: authService.profile ? {
            role: authService.profile.role,
            full_name: authService.profile.full_name
          } : null
        };
        
        setAuthInfo(authData);
        
        if (authService.isAuthenticated) {
          setStatus('✅ Usuario autenticado');
        } else {
          setStatus('❌ Usuario NO autenticado');
        }
        
      } catch (error) {
        setStatus(`❌ Error: ${error.message}`);
        console.error('Error en test:', error);
      }
    };
    
    testAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 mx-4">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🧪</div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Test Profesor Dashboard</h1>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Estado:</h3>
            <p className="text-sm">{status}</p>
          </div>
          
          {authInfo && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Info de Auth:</h3>
              <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                {JSON.stringify(authInfo, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-[#56CCF2] text-white p-2 rounded-lg text-sm hover:bg-[#5B9BD5] transition-colors"
            >
              🔄 Reintentar
            </button>
            <button 
              onClick={() => window.location.href = '/login/'}
              className="flex-1 bg-gray-500 text-white p-2 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              🔐 Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTeacherTest;