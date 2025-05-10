// src/components/Services.jsx

const ServiceCard = ({ icon, title, description }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#ACF0F4] text-[#2C3E50] mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

const Services = () => {
  const services = [
    {
      id: 1,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Guardería Canina",
      description: "Cuidado diario profesional en un ambiente seguro y divertido. Tu peludito disfrutará de actividades recreativas, socialización y ejercicio en nuestro campus de 8.000m²."
    },
    {
      id: 2,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: "Colegio Canino",
      description: "Formación y adiestramiento con métodos positivos para mejorar el comportamiento de tu mascota. Aprenderá obediencia básica y destrezas mientras socializa con otros perros."
    },
    {
      id: 3,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      title: "Hotel Canino",
      description: "Servicio de alojamiento cuando necesites viajar. Tu perro estará atendido por profesionales, con supervisión 24/7, actividades diarias y fotos constantes para tu tranquilidad."
    },
    {
      id: 4,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: "Socialización",
      description: "Ayudamos a tu perro a relacionarse de forma saludable con otros perros y personas. Ideal para cachorros o perros tímidos que necesitan ganar confianza en un entorno controlado."
    },
    {
      id: 5,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Grooming",
      description: "Servicio de baño, corte de pelo y cuidado estético completo para tu mascota. Usamos productos de alta calidad adaptados al tipo de piel y pelaje de cada perro."
    },
    {
  id: 6,
  icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  title: "Consulta Veterinaria",
  description: "Contamos con un veterinario que realiza revisiones al ingresar y salir del colegio. Además, ofrecemos servicios adicionales como consultas básicas, toma de muestras y gestión de radiografías cuando sea necesario. Un respaldo médico para la tranquilidad de los dueños. 🐾"
},
  ];

  return (
    <div className="py-16 bg-[#FFFBF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-dynapuff font-bold text-[#2C3E50]">Nuestros Servicios</h2>
          <p className="mt-4 text-lg text-gray-600">
            Todo lo que tu mejor amigo necesita en un solo lugar
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              icon={service.icon}
              title={service.title}
              description={service.description}
            />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <h3 className="text-2xl md:text-5xl font-bold font-dynapuff text-[#2C3E50] mb-4">Planes Flexibles</h3>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-lg text-[#2C3E50] mb-4">Planes Mensuales</h4>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>2 días: $380.000</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>3 días: $450.000</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>4 días: $500.000</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>5 días: $550.000</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg text-[#2C3E50] mb-4">Todos los planes incluyen</h4>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Recreación dirigida</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Socialización supervisada</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Ejercicio y actividades deportivas</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Ruta puerta a puerta</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Registro fotográfico diario</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;