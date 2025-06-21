// src/components/DownloadApp.jsx
import { useState, useEffect } from 'react';

const DownloadApp = () => {
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detectar dispositivo
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    
    setIsMobile(mobile);
    setIsIOS(ios);
    setIsAndroid(android);
  }, []);

  const handleDownloadClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* BOTÓN PRINCIPAL */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] p-6 rounded-xl shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4">
              <svg className="w-8 h-8 text-[#56CCF2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">¡Descarga nuestra App!</h3>
              <p className="text-white opacity-90">
                {isMobile ? 'Instala la app en tu teléfono' : 'Accede desde tu móvil para descargar'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleDownloadClick}
            className="bg-white text-[#56CCF2] px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors text-lg"
          >
            📱 Descargar App
          </button>
        </div>
      </div>

      {/* MODAL CON INSTRUCCIONES */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#2C3E50]">Descargar App</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido según dispositivo */}
            {!isMobile && (
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 text-[#56CCF2] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-3">Usa tu móvil para descargar</h3>
                <p className="text-gray-600 mb-4">
                  Escanea este código QR con tu teléfono o comparte el enlace:
                </p>
                
                {/* QR Code placeholder */}
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <div className="w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded mx-auto flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Código QR</span>
                  </div>
                </div>
                
                <div className="flex items-center bg-gray-100 rounded-lg p-3 mb-4">
                  <span className="text-sm text-gray-600 flex-1">{window.location.href}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className="text-[#56CCF2] text-sm font-medium ml-2"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            {isIOS && (
              <div>
                <div className="text-center mb-4">
                  <svg className="w-16 h-16 text-[#56CCF2] mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-3 text-center">iPhone/iPad</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="bg-[#56CCF2] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <p>Toca el botón <strong>"Compartir"</strong> en Safari (cuadrado con flecha hacia arriba)</p>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-[#56CCF2] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <p>Selecciona <strong>"Agregar a pantalla de inicio"</strong></p>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-[#56CCF2] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <p>Toca <strong>"Agregar"</strong> y listo!</p>
                  </div>
                </div>
              </div>
            )}

            {isAndroid && (
              <div>
                <div className="text-center mb-4">
                  <svg className="w-16 h-16 text-[#56CCF2] mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-3 text-center">Android</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="bg-[#56CCF2] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <p>Toca el menú <strong>"⋮"</strong> en Chrome</p>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-[#56CCF2] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <p>Selecciona <strong>"Agregar a pantalla de inicio"</strong></p>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-[#56CCF2] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <p>Toca <strong>"Agregar"</strong> y listo!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botón cerrar */}
            <div className="mt-6 text-center">
              <button 
                onClick={closeModal}
                className="bg-[#56CCF2] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#5B9BD5] transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DownloadApp;