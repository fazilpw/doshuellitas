// src/components/pwa/PWAPrompt.jsx
import { useState, useEffect } from 'react';

const PWAPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Mostrar prompt solo en iOS si no está instalada
    if (iOS && !window.navigator.standalone) {
      setTimeout(() => setShowPrompt(true), 3000);
    }
  }, []);

  if (!showPrompt || !isIOS) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#56CCF2] text-white p-4 z-50 shadow-lg">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center">
          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="font-medium">Instala la App</p>
            <p className="text-sm opacity-90">Toca compartir y "Agregar a pantalla de inicio"</p>
          </div>
        </div>
        <button 
          onClick={() => setShowPrompt(false)}
          className="text-white hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PWAPrompt;
