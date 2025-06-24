// src/components/auth/LoginForm.jsx - VERSIÓN SIMPLE QUE FUNCIONA
import { useState } from 'react';

const LoginForm = () => {
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = (role) => {
    setLoading(true);
    
    // Simular login guardando en localStorage
    const demoUser = {
      email: role === 'padre' ? 'maria@gmail.com' : 
             role === 'profesor' ? 'profesor@clubcanino.com' : 'admin@clubcanino.com',
      role: role,
      id: Date.now().toString()
    };
    
    localStorage.setItem('club_canino_user', JSON.stringify(demoUser));
    
    // Redirigir después de un breve delay
    setTimeout(() => {
      window.location.href = `/dashboard/${role}`;
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#56CCF2] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🐕</span>
          </div>
          <h2 className="text-3xl font-bold text-[#2C3E50]">Club Canino</h2>
          <p className="text-gray-600">Donde el cuidado y la confianza se unen</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-center text-lg font-semibold text-gray-700 mb-6">
            Acceso Demo
          </h3>
          
          <div className="space-y-4">
            <button
              onClick={() => handleDemoLogin('padre')}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-[#56CCF2] text-[#56CCF2] bg-white hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="mr-2">👨‍👩‍👧‍👦</span>
              Acceder como Padre
            </button>
            
            <button
              onClick={() => handleDemoLogin('profesor')}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-[#C7EA46] text-[#2C3E50] bg-[#C7EA46] hover:bg-[#FFFE8D] rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="mr-2">👨‍🏫</span>
              Acceder como Profesor
            </button>
            
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-[#AB5729] text-white bg-[#AB5729] hover:bg-opacity-90 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="mr-2">⚙️</span>
              Acceder como Admin
            </button>
          </div>

          {loading && (
            <div className="mt-4 text-center">
              <p className="text-gray-600">Redirigiendo...</p>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <a href="/" className="text-[#56CCF2] hover:text-[#5B9BD5]">
              ← Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;