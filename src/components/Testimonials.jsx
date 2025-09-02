// src/components/Testimonials.jsx
import { useState } from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      content: "Dejar a Rocky en Club Canino Dos Huellitas ha sido la mejor decisión. Antes tenía problemas para socializar con otros perros, pero ahora es mucho más equilibrado y feliz. Las fotos diarias me dan tranquilidad y el servicio de transporte es impecable.",
      author: "Ana María Gutiérrez",
      role: "Mamá de Rocky",
      avatar: "/images/comentario/20252.webp",
      dogImage: "/images/comentario/20252.webp"
    },
    {
      id: 2,
      content: "Increíble equipo humano y profesional. Me encanta que no utilizan corrales y que los perros están siempre bajo supervisión. Mi Luna adora ir, apenas ve la camioneta de la ruta se emociona. Han mejorado mucho su obediencia y comportamiento general.",
      author: "Carlos Medina",
      role: "Papá de Luna",
      avatar: "/images/comentario/2025-03-27.webp",
      dogImage: "/images/comentario/2025-03-27.webp"
    },
    {
      id: 3,
      content: "Como veterinaria, soy muy exigente con el cuidado de mi mascota. Puedo decir con confianza que el nivel de atención y profesionalismo en Club Canino Dos Huellitas es excepcional. Instalaciones limpias, personal capacitado y mucho cariño hacia los peluditos.",
      author: "Dra. Laura Jiménez",
      role: "Mamá de Max",
      avatar: "/images/comentario/20252.webp",
      dogImage: "/images/comentario/20252.webp"
    },
    {
      id: 4,
      content: "Trabajo largas jornadas y me daba culpa dejar a Toby solo en casa. Ahora sé que está feliz, ejercitándose y aprendiendo en el club. La diferencia en su comportamiento es notable. Llega cansado pero contento, y yo puedo trabajar tranquilo.",
      author: "Juan Pablo Hernández",
      role: "Papá de Toby",
      avatar: "/images/comentario/2025-03-27.webp",
      dogImage: "/images/comentario/2025-03-27.webp"
    },
    {
      id: 5,
      content: "Mi Lola tenía ansiedad por separación severa. El equipo de Dos Huellitas trabajó pacientemente con ella, y ahora está mucho mejor. La comunicación constante y las actualizaciones diarias me dan muchísima tranquilidad. Son más que una guardería, son una familia.",
      author: "Marcela Rodríguez",
      role: "Mamá de Lola",
      avatar: "/images/comentario/20252.webp",
      dogImage: "/images/comentario/20252.webp"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];
  const nextTestimonialPreview = testimonials[(currentIndex + 1) % testimonials.length];
  const prevTestimonialPreview = testimonials[(currentIndex - 1 + testimonials.length) % testimonials.length];

  return (
    <div className="bg-[#56CCF2] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-6xl font-bold font-dynapuff text-[#2C3E50]">Lo Que Dicen Nuestras Familias</h2>
          <p className="mt-4 text-lg text-[#2C3E50] opacity-90">
            Historias reales de papás y mamás de nuestros peluditos
          </p>
        </div>
        
        <div className="relative">
          {/* Testimonial principal */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="md:flex">
              <div className="md:flex-shrink-0 md:w-1/3">
                <img
                  className="h-64 w-full object-cover md:h-full"
                  src={currentTestimonial.dogImage}
                  alt={`Perro de ${currentTestimonial.author}`}
                />
              </div>
              <div className="p-8 md:w-2/3">
                <div className="flex items-center mb-6">
                  <svg className="h-8 w-8 text-[#5B9BD5]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <div className="text-gray-600 italic text-lg mb-6">
                  {currentTestimonial.content}
                </div>
                <div className="flex items-center">
                  <img
                    className="h-12 w-12 rounded-full object-cover mr-4"
                    src={currentTestimonial.avatar}
                    alt={currentTestimonial.author}
                  />
                  <div>
                    <div className="font-semibold text-[#2C3E50]">{currentTestimonial.author}</div>
                    <div className="text-gray-500">{currentTestimonial.role}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Controles de navegación */}
          <div className="flex justify-between mt-8">
            <button
              onClick={prevTestimonial}
              className="bg-white p-3 rounded-full shadow-lg hover:bg-[#ACF0F4] transition-colors duration-300 focus:outline-none"
            >
              <svg className="h-6 w-6 text-[#2C3E50]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Miniaturas de navegación */}
            <div className="hidden md:flex space-x-4">
              {/* Miniatura previa */}
              <div 
                onClick={prevTestimonial}
                className="cursor-pointer transform transition-transform duration-300 hover:scale-105"
              >
                <img
                  src={prevTestimonialPreview.dogImage}
                  alt="Testimonio previo"
                  className="h-24 w-24 object-cover rounded-lg shadow-md opacity-70 hover:opacity-100"
                />
              </div>
              
              {/* Miniaturas numéricas */}
              <div className="flex items-center space-x-2">
                {testimonials.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-3 w-3 rounded-full ${
                      currentIndex === index ? 'bg-[#C7EA46]' : 'bg-white opacity-50'
                    } cursor-pointer`}
                  />
                ))}
              </div>
              
              {/* Miniatura siguiente */}
              <div 
                onClick={nextTestimonial}
                className="cursor-pointer transform transition-transform duration-300 hover:scale-105"
              >
                <img
                  src={nextTestimonialPreview.dogImage}
                  alt="Siguiente testimonio"
                  className="h-24 w-24 object-cover rounded-lg shadow-md opacity-70 hover:opacity-100"
                />
              </div>
            </div>
            
            <button
              onClick={nextTestimonial}
              className="bg-white p-3 rounded-full shadow-lg hover:bg-[#ACF0F4] transition-colors duration-300 focus:outline-none"
            >
              <svg className="h-6 w-6 text-[#2C3E50]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* CTA sección */}
        <div className="bg-white rounded-lg shadow-md p-8 mt-12 text-center">
          <h3 className="text-xl font-semibold text-[#2C3E50] mb-4">¿Quieres formar parte de nuestra comunidad?</h3>
          <p className="text-gray-600 mb-6">
            Programa una visita y conoce de primera mano nuestras instalaciones y nuestro equipo.
          </p>
          <a
            href="https://wa.me/573144329824?text=Hola,%20quiero%20programar%20una%20visita%20a%20Club%20Canino%20Dos%20Huellitas"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#56CCF2] hover:bg-[#5B9BD5]"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Programa una visita
          </a>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;