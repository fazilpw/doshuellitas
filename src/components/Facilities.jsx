// src/components/Facilities.jsx
import { useState } from 'react';

const Facilities = () => {
  const [activeTab, setActiveTab] = useState('areas');
  
  const facilities = {
    areas: [
      {
        id: 1,
        image: '/images/lugar/lugar.webp',
        title: 'Campus principal',
        description: 'Más de 8.000m² de áreas verdes donde tu mascota puede correr, jugar y socializar libremente.'
      },
      {
        id: 2,
        image: '/images/lugar/pic-dos-huellitas-juego.webp',
        title: 'Áreas de juego',
        description: 'Zonas diseñadas con juegos y obstáculos para estimular física y mentalmente a tu perro.'
      },
      {
        id: 3,
        image: '/images/lugar/pic-dos-huellitas-entrenamiento.webp',
        title: 'Áreas de entrenamiento',
        description: 'Zonas especiales para las sesiones de adiestramiento y educación canina.'
      }
    ],
    

    
    transport: [
      {
        id: 1,
        image: '/images/transporte/pic-dos-huellitas-carro.webp',
        title: 'Vehículos especializados',
        description: 'Transporte diseñado específicamente para el traslado seguro y cómodo de mascotas.'
      },
      {
        id: 2,
        image: '/images/transporte/pic-dos-huellitas-puerta.webp',
        title: 'Rutas optimizadas',
        description: 'Recorridos planificados para minimizar el tiempo de transporte y maximizar el confort.'
      },
      {
        id: 3,
        image: '/images/transporte/pic-dos-huellitas-ruta.webp',
        title: 'Recogida puerta a puerta',
        description: 'Servicio personalizado de recogida y entrega de tu mascota directamente en tu domicilio.'
      }
    ]
  };

  // Instalación destacada (Campus principal)
  const featuredFacility = {
    title: "Campus de 8.000m² libre de corrales",
    description: "Nuestro campus principal es un espacio diseñado completamente libre de corrales, donde tu mascota puede vivir una experiencia natural de socialización y ejercicio en un ambiente seguro y controlado.",
    image: "/images/lugar/lugar.webp",
    features: [
      {
        title: "Amplitud sin límites",
        description: "Más de 8.000m² de espacios abiertos para que tu mascota explore y se ejercite libremente."
      },
      {
        title: "Supervisión profesional",
        description: "Personal capacitado que supervisa constantemente las actividades y el bienestar de todos los peluditos."
      },
      {
        title: "Zonas temáticas",
        description: "Diferentes áreas especializadas según las necesidades de ejercicio, juego y descanso."
      },
      {
        title: "Superficies variadas",
        description: "Terrenos con césped, arena y diferentes texturas para enriquecimiento sensorial."
      },
      {
        title: "Sombra y protección",
        description: "Amplias zonas cubiertas para proteger a las mascotas del sol y la lluvia."
      },
      {
        title: "Fuentes de agua",
        description: "Acceso constante a agua fresca y limpia en todo el campus."
      }
    ]
  };

  return (
    <div className="bg-[#FFFBF0] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-dynapuff font-bold text-[#2C3E50]">Nuestras Instalaciones</h2>
          <p className="mt-4 text-lg text-gray-600">
            Un espacio diseñado pensando en la seguridad, comodidad y felicidad de tu mascota
          </p>
        </div>
        
        {/* Featured Facility */}
        <div className="bg-white rounded-xl overflow-hidden shadow-xl mb-16">
          <div className="md:flex">
            <div className="md:flex-1">
              <img 
                src={featuredFacility.image} 
                alt={featuredFacility.title}
                className="h-64 w-full object-cover md:h-full"
              />
            </div>
            <div className="p-8 md:flex-1">
              <h3 className="text-2xl font-bold text-[#2C3E50] mb-4">{featuredFacility.title}</h3>
              <p className="text-gray-600 mb-6">{featuredFacility.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredFacility.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-[#56CCF2] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-[#2C3E50] text-sm">{feature.title}</h4>
                      <p className="text-gray-600 text-xs">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 justify-center">
              <button
                onClick={() => setActiveTab('areas')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'areas'
                    ? 'text-[#56CCF2] border-b-2 border-[#56CCF2]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Áreas de juego y recreación
              </button>
              <button
                onClick={() => setActiveTab('transport')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'transport'
                    ? 'text-[#56CCF2] border-b-2 border-[#56CCF2]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Transporte
              </button>
            </nav>
          </div>
        </div>
        
        {/* Image Gallery */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities[activeTab].map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <div className="h-56 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-[#2C3E50] mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-dynapuff font-bold text-[#2C3E50] mb-4">¿Quieres conocer nuestras instalaciones?</h3>
          <p className="text-gray-600 mb-8 max-w-3xl mx-auto">
            Te invitamos a programar una visita para que conozcas de primera mano nuestras instalaciones y puedas ver por ti mismo el ambiente donde tu mascota pasará su tiempo.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="https://wa.me/573144329824?text=Hola,%20me%20gustaría%20programar%20una%20visita%20para%20conocer%20las%20instalaciones"
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#56CCF2] hover:bg-[#5B9BD5] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Programa una visita
            </a>
            <a 
              href="/contacto"
              className="inline-flex items-center justify-center px-6 py-3 border border-[#56CCF2] text-base font-medium rounded-md text-[#56CCF2] bg-white hover:bg-gray-50 transition-colors"
            >
              Más información
            </a>
          </div>
        </div>

        {/* Nueva Sección: Hotel Canino - Solo Texto */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#56CCF2] bg-opacity-20 rounded-full mb-4">
              <span className="text-3xl">🏨</span>
            </div>
            <h3 className="text-2xl font-dynapuff font-bold text-[#2C3E50] mb-4">Hotel Canino - Servicios de Alojamiento</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Cuando necesites viajar, tu peludito tendrá un hogar temporal lleno de amor y cuidados profesionales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Habitaciones caninas */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#56CCF2] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🛏️</span>
              </div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3">Habitaciones Caninas</h4>
              <p className="text-gray-600 text-sm">
                Espacios cómodos y seguros para el descanso nocturno de los huéspedes del hotel canino.
              </p>
            </div>

            {/* Comodidades especiales */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#5B9BD5] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">⭐</span>
              </div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3">Comodidades Especiales</h4>
              <p className="text-gray-600 text-sm">
                Camas ortopédicas, calefacción, música relajante y todos los elementos para el bienestar de tu mascota.
              </p>
            </div>

            {/* Cuidado nocturno */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#C7EA46] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🌙</span>
              </div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3">Cuidado Nocturno</h4>
              <p className="text-gray-600 text-sm">
                Supervisión profesional durante las horas de descanso para garantizar la tranquilidad de tu peludito.
              </p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-8 bg-[#FFFBF0] rounded-lg p-6">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-[#56CCF2] rounded-full flex items-center justify-center mr-4 mt-1">
                <span className="text-white text-sm">💡</span>
              </div>
              <div>
                <h5 className="font-semibold text-[#2C3E50] mb-2">¿Necesitas que cuidemos a tu peludito por unos días?</h5>
                <p className="text-gray-600 text-sm">
                  Nuestro hotel canino ofrece la misma atención y cariño que tu mascota recibe en casa. 
                  Actividades diarias, socialización, alimentación personalizada y mucho amor las 24 horas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Facilities;