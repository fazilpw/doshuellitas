// src/components/WebsiteAppBanner.jsx
import { useState, useEffect } from 'react';

const WebsiteAppBanner = ({ type = 'website' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const bannerConfig = {
    website: {
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
      icon: '🌐',
      title: 'Página Web Informativa',
      description: 'Conoce nuestros servicios y programar visitas',
      ctaText: '📱 Acceder a la App',
      ctaLink: '/app',
      ctaStyle: 'bg-white text-blue-600 hover:bg-blue-50'
    },
    app: {
      bgColor: 'bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5]',
      icon: '📱',
      title: 'Club Canino App',
      description: 'Aplicación exclusiva para familias registradas',
      ctaText: '🌐 Ver Página Web',
      ctaLink: '/',
      ctaStyle: 'bg-white font-dynapuff text-[#56CCF2] hover:bg-gray-50'
    }
  };

  const config = bannerConfig[type];

  // No mostrar en ciertas páginas
  const hideOnPages = ['/login', '/dashboard'];
  const shouldHide = hideOnPages.some(page => currentPath.startsWith(page));

  if (!isVisible || shouldHide) return null;

  return (
    <div className={`${config.bgColor} text-white py-2 px-4 relative z-30`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <div className="font-semibold text-sm">{config.title}</div>
            <div className="text-xs opacity-90">{config.description}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <a 
            href={config.ctaLink}
            className={`${config.ctaStyle} px-4 py-1 rounded-full text-sm font-medium transition-colors duration-200`}
          >
            {config.ctaText}
          </a>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-gray-200 ml-2"
            aria-label="Cerrar banner"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebsiteAppBanner;