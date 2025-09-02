// src/components/Hero.jsx - SIN APLASTAR NI CORTAR IMÁGENES
import { useState, useEffect } from 'react';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      image: "/images/perros.webp",
      alt: "Perros juntos"
    }
  ];
  
  // Cambio automático de diapositivas
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [slides.length]);
  
  return (
    <div className="bg-[#FFFBF0] py-12 md:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center">
          {/* Columna de texto (izquierda) */}
          <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0">
            <div className="flex items-center mb-6">
              <div className="w-16 h-1 bg-[#56CCF2]"></div>
              <p className="ml-4 text-[#56CCF2] font-dynapuff font-normal">¡BIENVENIDOS!</p>
            </div>
            
            <h1 className="text-4xl font-dynapuff md:text-5xl lg:text-7xl font-bold text-[#2C3E50] leading-tight mb-6">
              Club Canino <br/>
              <span className="text-[#56CCF2]">Dos Huellitas</span>
            </h1>
            
            <p className="text-xl text-[#2C3E50] italic mb-6">
              Donde el cuidado y la confianza se unen
            </p>
            
            <p className="text-gray-600 mb-8 text-lg">
              En nuestro campus de más de 11.000m² libre de corrales, tu mejor amigo 
              disfrutará de socialización supervisada, actividades deportivas y 
              formación dirigida por profesionales certificados.
            </p>
            
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
                <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm md:text-base text-gray-700">Ruta puerta a puerta</span>
              </div>
              
              <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
                <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm md:text-base text-gray-700">Supervisión veterinaria</span>
              </div>
              
              <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
                <svg className="w-5 h-5 text-[#56CCF2] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm md:text-base text-gray-700">Fotos y videos diarios</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/contacto" 
                className="bg-[#56CCF2] hover:bg-[#5B9BD5] text-white font-bold py-3 px-6 rounded-lg shadow transition-colors duration-300 text-center"
              >
                Programa una visita
              </a>
              <a 
                href="https://wa.me/573144329824?text=Hola,%20quiero%20información%20sobre%20Club%20Canino%20Dos%20Huellitas" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-[#C7EA46] hover:bg-[#FFFE8D] text-[#2C3E50] font-bold py-3 px-6 rounded-lg shadow transition-colors duration-300 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
          
          {/* Columna de imagen (derecha) */}
          <div className="md:w-1/2 relative">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl ">
              {/* Las imágenes en carrusel */}
              {slides.map((slide, index) => (
                <div 
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img 
                    src={slide.image} 
                    alt={slide.alt}
                    className={`w-full h-full object-contain ${slide.className || ''}`}
                    // ☝️ CAMBIO CLAVE: object-contain + aplicar className del slide
                  />
                </div>
              ))}
              
              {/* Indicadores del carrusel */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      index === currentSlide ? 'bg-[#56CCF2]' : 'bg-white bg-opacity-70'
                    }`}
                    aria-label={`Ir a imagen ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            
            {/* Elemento decorativo */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg z-10 hidden md:block">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white" src="/images/club-huellitas-perrot-001.webp" alt="" />
                  <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white" src="/images/club-huellitas-perrot-002.webp" alt="" />
                  <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white" src="/images/club-huellitas-perrot-003.webp" alt="" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">Haciendo peluditos felices</p>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mancha decorativa */}
            <div className="absolute -z-10 top-1/2 right-1/4 w-64 h-64 bg-[#ACF0F4] rounded-full filter blur-3xl opacity-30 transform -translate-y-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;