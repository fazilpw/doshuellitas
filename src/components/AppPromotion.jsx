// src/components/AppPromotion.jsx
import { useState } from 'react';

const AppPromotion = () => {
  const [showModal, setShowModal] = useState(false);

  const appFeatures = [
    {
      icon: "📊",
      title: "Seguimiento Diario",
      description: "Recibe evaluaciones detalladas del progreso de tu peludito",
      userType: "padres"
    },
    {
      icon: "📸",
      title: "Fotos en Tiempo Real",
      description: "Ve fotos y videos de tu mascota durante su día en el colegio",
      userType: "padres"
    },
    {
      icon: "🔔",
      title: "Notificaciones Inteligentes",
      description: "Recordatorios de rutinas, consejos de cuidado y actualizaciones",
      userType: "padres"
    },
    {
      icon: "🚌",
      title: "Tracking del Transporte",
      description: "Sigue en tiempo real la ubicación de la ruta de tu perro",
      userType: "padres"
    },
    {
      icon: "📋",
      title: "Evaluaciones Profesionales",
      description: "Registra y comparte evaluaciones desde el colegio",
      userType: "profesores"
    },
    {
      icon: "📈",
      title: "Reportes de Progreso",
      description: "Analiza la evolución comportamental de cada perro",
      userType: "profesores"
    }
  ];

  const benefits = [
    "🏠 **Tranquilidad Total**: Saber exactamente cómo está tu peludito",
    "📱 **App Nativa**: Instala como cualquier app desde tu navegador",
    "🔄 **Sincronización Casa-Colegio**: Coordinación perfecta entre ambos entornos",
    "🎯 **Rutinas Personalizadas**: Recordatorios adaptados a tu mascota",
    "👨‍⚕️ **Seguimiento Veterinario**: Historial médico y de comportamiento",
    "🚀 **Siempre Actualizada**: Sin descargas, siempre la última versión"
  ];

  return (
    <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Principal */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2 mb-4">
            <span className="text-white text-sm font-medium">🆕 EXCLUSIVO PARA NUESTRAS FAMILIAS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Club Canino <span className="text-[#FFFE8D]">App</span>
          </h2>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            La aplicación móvil exclusiva para padres y profesores de Club Canino Dos Huellitas. 
            Mantente conectado con tu peludito las 24 horas.
          </p>
        </div>

        {/* Mockup de la App */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          
          {/* Imagen/Mockup de la App */}
          <div className="relative">
            <div className="relative mx-auto w-64 h-[500px]">
              {/* Frame del teléfono */}
              <div className="absolute inset-0 bg-gray-900 rounded-[2.5rem] p-2">
                <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
                  
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-lg z-10"></div>
                  
                  {/* Contenido de la App */}
                  <div className="pt-8 px-4 h-full bg-[#FFFBF0]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-[#2C3E50]">Mi Dashboard</h3>
                      <div className="w-8 h-8 bg-[#56CCF2] rounded-full"></div>
                    </div>
                    
                    {/* Card de perro */}
                    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-[#ACF0F4] rounded-full flex items-center justify-center mr-3">
                          <span className="text-xl">🐕</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-[#2C3E50]">Max</h4>
                          <p className="text-xs text-gray-600">Golden Retriever</p>
                        </div>
                      </div>
                      
                      {/* Métricas */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Energía</span>
                          <div className="flex items-center">
                            <div className="w-12 h-1 bg-gray-200 rounded-full mr-1">
                              <div className="w-8 h-1 bg-[#56CCF2] rounded-full"></div>
                            </div>
                            <span className="text-xs">8/10</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Social</span>
                          <div className="flex items-center">
                            <div className="w-12 h-1 bg-gray-200 rounded-full mr-1">
                              <div className="w-10 h-1 bg-[#C7EA46] rounded-full"></div>
                            </div>
                            <span className="text-xs">9/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notificaciones */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center">
                        <span className="text-green-600 mr-2">🚌</span>
                        <div>
                          <p className="text-xs font-medium text-green-800">En camino</p>
                          <p className="text-xs text-green-600">Llegamos en 5 min</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botones */}
                    <div className="space-y-2">
                      <button className="w-full bg-[#56CCF2] text-white py-2 px-4 rounded-lg text-xs font-medium">
                        📸 Ver Fotos del Día
                      </button>
                      <button className="w-full bg-white border border-[#56CCF2] text-[#56CCF2] py-2 px-4 rounded-lg text-xs font-medium">
                        📊 Evaluar en Casa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Efectos decorativos */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#FFFE8D] rounded-full opacity-50 blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#ACF0F4] rounded-full opacity-50 blur-xl"></div>
            </div>
          </div>

          {/* Beneficios Principales */}
          <div className="text-white">
            <h3 className="text-2xl font-bold mb-6">¿Por qué usar la Club Canino App?</h3>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <div className="text-2xl mr-3 mt-1">{benefit.split(' ')[0]}</div>
                  <div>
                    <p className="text-lg">{benefit.substring(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <button 
                onClick={() => setShowModal(true)}
                className="bg-[#FFFE8D] text-[#2C3E50] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#C7EA46] transition-colors shadow-lg"
              >
                📱 Ver Cómo Funciona
              </button>
            </div>
          </div>
        </div>

        {/* Características por Usuario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Para Padres */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#FFFE8D] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Para Padres</h3>
              <p className="text-white opacity-90">Todo sobre tu peludito en tiempo real</p>
            </div>
            
            <div className="space-y-3">
              {appFeatures.filter(f => f.userType === 'padres').map((feature, index) => (
                <div key={index} className="flex items-start bg-white bg-opacity-10 rounded-lg p-3">
                  <span className="text-2xl mr-3">{feature.icon}</span>
                  <div>
                    <h4 className="font-semibold text-white">{feature.title}</h4>
                    <p className="text-sm text-white opacity-80">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Para Profesores */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#C7EA46] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-[#2C3E50]">👨‍🏫</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Para Profesores</h3>
              <p className="text-white opacity-90">Herramientas profesionales de evaluación</p>
            </div>
            
            <div className="space-y-3">
              {appFeatures.filter(f => f.userType === 'profesores').map((feature, index) => (
                <div key={index} className="flex items-start bg-white bg-opacity-10 rounded-lg p-3">
                  <span className="text-2xl mr-3">{feature.icon}</span>
                  <div>
                    <h4 className="font-semibold text-white">{feature.title}</h4>
                    <p className="text-sm text-white opacity-80">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-8">
          <h3 className="text-2xl font-bold text-white mb-4">¿Ya eres parte de nuestra familia?</h3>
          <p className="text-white opacity-90 mb-6 max-w-2xl mx-auto">
            Si tu peludito ya asiste a Club Canino Dos Huellitas, tienes acceso gratuito a nuestra aplicación. 
            Inicia sesión y descubre todas las funcionalidades.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/login"
              className="bg-[#FFFE8D] text-[#2C3E50] px-8 py-3 rounded-lg font-bold hover:bg-[#C7EA46] transition-colors"
            >
              🔑 Iniciar Sesión
            </a>
            <a 
              href="/contacto"
              className="bg-white bg-opacity-20 text-white border-2 border-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-[#2C3E50] transition-colors"
            >
              📞 Solicitar Acceso
            </a>
          </div>
          
          <p className="text-white opacity-75 text-sm mt-4">
            ¿No tienes mascota con nosotros? <a href="/contacto" className="underline hover:opacity-100">Conoce nuestros planes</a>
          </p>
        </div>
      </div>

      {/* Modal con más información */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#2C3E50]">🚀 Próximas Funcionalidades</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2C3E50] mb-4">📱 PWA (App Instalable)</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-green-500 mr-2">✅</span>
                      <span>Instalar como app nativa desde el navegador</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-500 mr-2">✅</span>
                      <span>Notificaciones push inteligentes</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-500 mr-2">✅</span>
                      <span>Funcionamiento offline para evaluaciones</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-500 mr-2">✅</span>
                      <span>Recordatorios de rutinas personalizados</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2C3E50] mb-4">🚌 Tracking GPS</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-2">🔄</span>
                      <span>Seguimiento en tiempo real del transporte</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-2">🔄</span>
                      <span>Notificaciones de recogida y entrega</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-2">🔄</span>
                      <span>ETA estimado de llegada</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-2">🔄</span>
                      <span>Historial de rutas y horarios</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-[#FFFBF0] rounded-lg">
                <h4 className="font-bold text-[#2C3E50] mb-2">💡 ¿Sabías que?</h4>
                <p className="text-gray-700">
                  Una PWA (Progressive Web App) funciona como una app nativa pero no necesita ser descargada de una tienda de aplicaciones. 
                  Se instala directamente desde tu navegador y siempre está actualizada automáticamente.
                </p>
              </div>
              
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setShowModal(false)}
                  className="bg-[#56CCF2] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#5B9BD5] transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppPromotion;