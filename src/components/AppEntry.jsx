// src/components/AppEntry.jsx
import { useState, useEffect } from 'react';

const AppEntry = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Detectar estado de conexión
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Detectar si es una PWA candidata
    const isPWACandidate = window.matchMedia('(display-mode: browser)').matches;
    if (isPWACandidate) {
      setTimeout(() => setShowInstallPrompt(true), 2000);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#56CCF2] via-[#5B9BD5] to-[#2C3E50] flex items-center justify-center p-4">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-20"></div>
        <div className="absolute top-60 right-32 w-24 h-24 bg-[#FFFE8D] rounded-full opacity-30"></div>
        <div className="absolute bottom-32 left-1/3 w-28 h-28 bg-[#ACF0F4] rounded-full opacity-25"></div>
      </div>

      <div className="relative max-w-lg w-full">
        
        {/* Banner de Estado */}
        {!isOnline && (
          <div className="bg-orange-500 text-white px-4 py-2 rounded-lg mb-4 text-center">
            <span className="font-medium">📴 Sin conexión - Algunas funciones limitadas</span>
          </div>
        )}

        {showInstallPrompt && (
          <div className="bg-[#C7EA46] text-[#2C3E50] px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2">📱</span>
              <span className="font-medium">¡Instala la app para una mejor experiencia!</span>
            </div>
            <button 
              onClick={() => setShowInstallPrompt(false)}
              className="text-[#2C3E50] hover:opacity-70"
            >
              ×
            </button>
          </div>
        )}

        {/* Logo y Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <img 
              src="/logo.svg" 
              alt="Club Canino Dos Huellitas" 
              className="h-20 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-[#2C3E50] mb-2">
              Club Canino App
            </h1>
            <p className="text-gray-600">
              Aplicación exclusiva para familias y profesores
            </p>
          </div>

          {/* Estado de la App */}
          <div className="bg-[#FFFBF0] rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Sistema Activo</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[#56CCF2]">24/7</div>
                <div className="text-xs text-gray-600">Disponible</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#C7EA46]">
                  {isOnline ? '🟢' : '🟡'}
                </div>
                <div className="text-xs text-gray-600">
                  {isOnline ? 'En línea' : 'Offline'}
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Acceso */}
          <div className="space-y-4">
            <a 
              href="/login"
              className="w-full bg-[#56CCF2] hover:bg-[#5B9BD5] text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              <span className="mr-2">🔑</span>
              Iniciar Sesión
            </a>
            
            <div className="grid grid-cols-2 gap-3">
              <a 
                href="/dashboard/padre"
                className="bg-[#C7EA46] hover:bg-[#FFFE8D] text-[#2C3E50] font-medium py-3 px-4 rounded-lg transition-colors text-center text-sm"
              >
                👨‍👩‍👧‍👦 Padres
              </a>
              <a 
                href="/dashboard/profesor"
                className="bg-[#ACF0F4] hover:bg-[#56CCF2] hover:text-white text-[#2C3E50] font-medium py-3 px-4 rounded-lg transition-colors text-center text-sm"
              >
                👨‍🏫 Profesores
              </a>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">
              ¿No tienes acceso? Contacta a Club Canino
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="https://wa.me/573144329824"
                target="_blank"
                rel="noopener noreferrer" 
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                📱 WhatsApp
              </a>
              <a 
                href="/"
                className="text-[#56CCF2] hover:text-[#5B9BD5] text-sm font-medium"
              >
                🌐 Página Web
              </a>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-white text-xs font-medium">Evaluaciones</div>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">📸</div>
            <div className="text-white text-xs font-medium">Fotos Diarias</div>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🚌</div>
            <div className="text-white text-xs font-medium">Tracking GPS</div>
          </div>
        </div>

        {/* Versión y Copyright */}
        <div className="text-center mt-6">
          <div className="text-white text-xs opacity-75">
            Club Canino App v1.0.0 | PWA Ready
          </div>
          <div className="text-white text-xs opacity-50 mt-1">
            © 2025 Club Canino Dos Huellitas
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppEntry;