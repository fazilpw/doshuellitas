// src/components/AppPromotion.jsx
import { useState } from 'react';

const AppPromotion = () => {
  const [showModal, setShowModal] = useState(false);

  // ✅ ACTUALIZADO: 5 secciones para padres (SIN fotos)
  const appFeatures = [
    {
      icon: "📊",
      title: "Seguimiento de Progreso", // ✅ CAMBIADO: Era "Seguimiento Diario"
      description: "Recibe evaluaciones detalladas del progreso de tu peludito",
      userType: "padres"
    },
    {
      icon: "🔔",
      title: "Notificaciones Inteligentes",
      description: "Recordatorios de rutinas, consejos de cuidado y actualizaciones",
      userType: "padres"
    },
    {
      icon: "💉",
      title: "Control de Vacunas", // ✅ NUEVA SECCIÓN
      description: "Seguimiento completo del esquema de vacunación de tu peludito con recordatorios automáticos",
      userType: "padres"
    },
    {
      icon: "💊",
      title: "Gestión de Medicinas", // ✅ NUEVA SECCIÓN
      description: "Control de medicamentos, dosis y tratamientos veterinarios con alertas personalizadas",
      userType: "padres"
    },
    {
      icon: "🚌",
      title: "Tracking del Transporte",
      description: "Sigue en tiempo real la ubicación de la ruta de tu perro con información veterinaria integrada",
      userType: "padres"
    },
    // ❌ ELIMINADO: "Fotos en Tiempo Real" ya no existe
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
    "👨‍⚕️ **Seguimiento Veterinario**: Historial médico y de comportamiento completo",
    "💉 **Control de Vacunas**: Nunca olvides una vacuna con nuestros recordatorios",
    "💊 **Gestión Médica**: Administra medicamentos y tratamientos fácilmente",
    "🚌 **GPS en Tiempo Real**: Ubicación exacta del transporte y estado de salud",
    "🚀 **Siempre Actualizada**: Sin descargas, siempre la última versión"
  ];

  return (
    <div className="bg-[#FFFBF0] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Principal */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-[#56CCF2] bg-opacity-20 rounded-full px-4 py-2 mb-4">
            <span className="text-[#2C3E50] text-sm font-medium">🆕 EXCLUSIVO PARA NUESTRAS FAMILIAS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#2C3E50] mb-4">
            Club Canino <span className="text-[#56CCF2]">App</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            La aplicación móvil exclusiva para padres y profesores de Club Canino Dos Huellitas. 
            Mantente conectado con tu peludito las 24 horas.
          </p>
        </div>

        {/* Grid de características por tipo de usuario */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          
          {/* Para Padres - 5 SECCIONES */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#56CCF2] bg-opacity-20 rounded-full mb-4">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <h3 className="text-2xl font-bold text-[#2C3E50] mb-2">Para Padres</h3>
              <p className="text-[#56CCF2] font-medium">Todo sobre tu peludito en tiempo real</p>
            </div>
            
            <div className="space-y-6">
              {appFeatures.filter(feature => feature.userType === 'padres').map((feature, index) => (
                <div key={index} className="flex items-start">
                  <div className="text-2xl mr-4 mt-1">{feature.icon}</div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#2C3E50] mb-2">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Para Profesores */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#5B9BD5] bg-opacity-20 rounded-full mb-4">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <h3 className="text-2xl font-bold text-[#2C3E50] mb-2">Para Profesores</h3>
              <p className="text-[#5B9BD5] font-medium">Herramientas profesionales de seguimiento</p>
            </div>
            
            <div className="space-y-6">
              {appFeatures.filter(feature => feature.userType === 'profesores').map((feature, index) => (
                <div key={index} className="flex items-start">
                  <div className="text-2xl mr-4 mt-1">{feature.icon}</div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#2C3E50] mb-2">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Beneficios principales */}
        <div className="bg-white rounded-2xl p-8 mb-12 shadow-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-[#2C3E50] text-center mb-8">¿Por qué elegir nuestra App?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start">
                <div className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: benefit }}></div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Principal */}
        <div className="text-center">
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#56CCF2] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#5B9BD5] transition-colors shadow-lg transform hover:scale-105"
          >
            📱 Conocer más sobre la App
          </button>
          <p className="text-gray-600 text-sm mt-4">
            Disponible para familias inscritas en Club Canino Dos Huellitas
          </p>
        </div>
      </div>

      {/* Modal de información */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#2C3E50]">Club Canino App</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-[#56CCF2] bg-opacity-10 rounded-lg p-6">
                  <h4 className="font-bold text-[#2C3E50] mb-3">📱 ¿Qué es una PWA?</h4>
                  <p className="text-gray-600 text-sm">
                    Una Progressive Web App que se instala como cualquier aplicación nativa, 
                    pero funciona desde tu navegador. Sin App Store, sin ocupar espacio, 
                    siempre actualizada.
                  </p>
                </div>

                <div className="bg-[#C7EA46] bg-opacity-10 rounded-lg p-6">
                  <h4 className="font-bold text-[#2C3E50] mb-3">🎯 Acceso Exclusivo</h4>
                  <p className="text-gray-600 text-sm">
                    Solo disponible para familias inscritas en Club Canino. 
                    Recibirás el acceso después de completar la inscripción de tu peludito.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white rounded-lg p-6">
                  <h4 className="font-bold mb-3">🚀 Próximamente</h4>
                  <p className="text-sm opacity-90">
                    Estamos finalizando los últimos detalles. La app estará disponible 
                    para nuestras familias muy pronto. ¡Te notificaremos!
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
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