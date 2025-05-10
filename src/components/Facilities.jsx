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
        image: '/images/facilities/play-area.jpg',
        title: 'Áreas de juego',
        description: 'Zonas diseñadas con juegos y obstáculos para estimular física y mentalmente a tu perro.'
      },
      {
        id: 3,
        image: '/images/facilities/rest-area.jpg',
        title: 'Zonas de descanso',
        description: 'Espacios cubiertos y cómodos donde los peluditos pueden relajarse después de una sesión de actividades.'
      },
      {
        id: 4,
        image: '/images/facilities/training.jpg',
        title: 'Áreas de entrenamiento',
        description: 'Zonas especiales para las sesiones de adiestramiento y educación canina.'
      }
    ],
    
    safety: [
      {
        id: 1,
        image: '/images/facilities/safety-fencing.jpg',
        title: 'Cercado seguro',
        description: 'Todo el perímetro está protegido con cercas especiales para evitar escapes y garantizar la seguridad.'
      },
      {
        id: 2,
        image: '/images/facilities/monitoring.jpg',
        title: 'Sistema de monitoreo',
        description: 'Cámaras de vigilancia en todas las áreas para supervisar constantemente el bienestar de los perros.'
      },
      {
        id: 3,
        image: '/images/facilities/vet-station.jpg',
        title: 'Estación veterinaria',
        description: 'Espacio equipado para atención veterinaria básica y de emergencia.'
      },
      {
        id: 4,
        image: '/images/facilities/safety-protocols.jpg',
        title: 'Protocolos de emergencia',
        description: 'Personal capacitado y planes de acción para cualquier situación imprevista.'
      }
    ],
    
    transport: [
      {
        id: 1,
        image: '/images/facilities/van.jpg',
        title: 'Vehículos especializados',
        description: 'Transporte diseñado específicamente para el traslado seguro y cómodo de mascotas.'
      },
      {
        id: 2,
        image: '/images/facilities/safety-transport.jpg',
        title: 'Seguridad en tránsito',
        description: 'Separadores individuales, cinturones de seguridad caninos y ventilación adecuada.'
      },
      {
        id: 3,
        image: '/images/facilities/routes.jpg',
        title: 'Rutas optimizadas',
        description: 'Recorridos planificados para minimizar el tiempo de transporte y maximizar el confort.'
      },
      {
        id: 4,
        image: '/images/facilities/pickup.jpg',
        title: 'Recogida puerta a puerta',
        description: 'Servicio personalizado de recogida y entrega de tu mascota directamente en tu domicilio.'
      }
    ],
    
    accommodation: [
      {
        id: 1,
        image: '/images/facilities/hotel.jpg',
        title: 'Habitaciones caninas',
        description: 'Espacios cómodos y seguros para el descanso nocturno de los huéspedes del hotel canino.'
      },
      {
        id: 2,
        image: '/images/facilities/bedding.jpg',
        title: 'Camas y accesorios',
        description: 'Equipamiento de calidad para garantizar un descanso confortable para tu mascota.'
      },
      {
        id: 3,
        image: '/images/facilities/climate-control.jpg',
        title: 'Control de clima',
        description: 'Sistemas de ventilación y calefacción para mantener una temperatura ideal sin importar el clima exterior.'
      },
      {
        id: 4,
        image: '/images/facilities/night-supervision.jpg',
        title: 'Supervisión nocturna',
        description: 'Personal de guardia 24/7 para atender cualquier necesidad durante la noche.'
      }
    ]
  };
  
  const featuredFacility = {
    title: "Nuestro campus de 8.000m²",
    description: "En Club Canino Dos Huellitas, nos enorgullece ofrecer un espacio amplio y seguro, diseñado específicamente para la felicidad y bienestar de tu mascota. Nuestro campus está libre de corrales, permitiendo que los perros disfruten de su instinto natural de exploración y socialización, siempre bajo la supervisión de nuestro equipo profesional.",
    image: "/images/lugar/lugar.webp",
    features: [
      {
        title: "Zonas diferenciadas",
        description: "Áreas separadas según tamaño y temperamento de los perros, para garantizar una socialización segura."
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
          <h2 className="text-3xl md:text-5xl font-dynapuff  font-bold text-[#2C3E50]">Nuestras Instalaciones</h2>
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
                    <svg className="w-5 h-5 text-[#56CCF2] mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-[#2C3E50]">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <a
                  href="https://wa.me/573144329824?text=Hola,%20me%20gustaría%20programar%20una%20visita%20para%20conocer%20las%20instalaciones"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#56CCF2] hover:bg-[#5B9BD5]"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Programa una visita
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
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
              onClick={() => setActiveTab('safety')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'safety'
                  ? 'text-[#56CCF2] border-b-2 border-[#56CCF2]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Seguridad y bienestar
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
            <button
              onClick={() => setActiveTab('accommodation')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'accommodation'
                  ? 'text-[#56CCF2] border-b-2 border-[#56CCF2]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Alojamiento
            </button>
          </div>
        </div>
        
        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        
        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl dynapuff font-bold text-[#2C3E50] mb-4">¿Quieres conocer nuestras instalaciones?</h3>
          <p className="text-gray-600 mb-8 max-w-3xl mx-auto">
            Te invitamos a programar una visita para que conozcas de primera mano nuestras instalaciones y puedas ver por ti mismo el ambiente donde tu mascota pasará su tiempo.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
 <a
   href="https://wa.me/573144329824?text=Hola,%20me%20gustaría%20programar%20una%20visita%20para%20conocer%20las%20instalaciones"
   target="_blank"
   rel="noopener noreferrer"
   className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#56CCF2] hover:bg-[#5B9BD5]"
 >
   <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
   </svg>
   Programa una visita por WhatsApp
 </a>
 <a
   href="tel:+573144329824"
   className="inline-flex items-center justify-center px-6 py-3 border border-[#56CCF2] text-base font-medium rounded-md text-[#56CCF2] bg-white hover:bg-gray-50"
 >
   <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
   </svg>
   Llámanos
 </a>
</div>
</div>
     </div>
   </div>
 );
};


export default Facilities;