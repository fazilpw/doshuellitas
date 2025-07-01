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
        image: '/images/transporte/pic-dos-huellitas-ruta.webp',
        title: 'Rutas optimizadas',
        description: 'Recorridos planificados para minimizar el tiempo de transporte y maximizar el confort.'
      },
      {
        id: 3,
        image: '/images/transporte/pic-dos-huellitas-puerta.webp',
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
        
       

        {/* Nueva Sección: Hotel Canino - Solo Texto */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#56CCF2] bg-opacity-20 rounded-full mb-4">
              <span className="text-3xl">🏨</span>
            </div>
            <h3 className="text-2xl md:text-4xl  font-dynapuff font-bold text-[#2C3E50] mb-4">Hotel Canino - Servicios de Alojamiento</h3>
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