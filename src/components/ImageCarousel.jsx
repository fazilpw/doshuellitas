import { useState, useEffect } from 'react';

const SimpleCarousel = ({ title, subtitle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    {
      src: "/images/perros/club-huellitas-Aussie-merlado.webp",
      alt: "Campus principal Club Canino Dos Huellitas"
    },
    {
      src: "/images/perros/club-huellitas-puddle.webp",
      alt: "Actividades con puddle"
    },
    {
      src: "/images/perros/club-huellitas-negro.webp",
      alt: "Áreas de juego canino"
    },
    {
      src: "/images/perros/club-huellitas-perro-002.webp",
      alt: "Zona de entrenamiento canino"
    },
    {
      src: "/images/perros/club-huellitas-perro-003.webp",
      alt: "Vehículos especializados para transporte canino"
    },
    {
      src: "/images/perros/club-huellitas-perro-004.webp",
      alt: "Habitaciones del hotel canino"
    },
    {
      src: "/images/perros/club-huellitas-perro-005.webp",
      alt: "Instalaciones especializadas"
    },
    {
      src: "/images/perros/club-huellitas-perro-006.webp",
      alt: "Zona de entrenamiento avanzado"
    },
    {
      src: "/images/perros/club-huellitas-perro-007.webp",
      alt: "Flota de vehículos especializados"
    },
    {
      src: "/images/perros/club-huellitas-perro-008.webp",
      alt: "Suites premium del hotel canino"
    },
    {
      src: "/images/perros/club-huellitas-perro-009.webp",
      alt: "Áreas de recreación"
    },
    {
      src: "/images/perros/club-huellitas-perro-010.webp",
      alt: "Espacios de socialización"
    },
    {
      src: "/images/perros/club-huellitas-perro-011.webp",
      alt: "Centro de entrenamiento especializado"
    },
    {
      src: "/images/perros/club-huellitas-perro-012.webp",
      alt: "Transporte seguro y cómodo"
    },
    {
      src: "/images/perros/club-huellitas-perro-013.webp",
      alt: "Instalaciones de lujo"
    },
    {
      src: "/images/perros/club-huellitas-perro-014.webp",
      alt: "Servicios premium"
    }
  ];

  // Auto cambio cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="bg-[#FFFBF0] py-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Layout: Carrusel IZQUIERDA + Título DERECHA */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* CARRUSEL - COLUMNA IZQUIERDA */}
          <div className="relative">
            
            {/* Foto principal */}
            <div className="flex justify-center">
              <img
                src={images[currentIndex].src}
                alt={images[currentIndex].alt}
                className="max-w-full max-h-[500px] w-auto h-auto object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* Botones */}
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[#2C3E50] w-12 h-12 rounded-full shadow-lg text-xl font-bold transition-all hover:scale-110"
            >
              ←
            </button>
            
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[#2C3E50] w-12 h-12 rounded-full shadow-lg text-xl font-bold transition-all hover:scale-110"
            >
              →
            </button>

            {/* Indicadores */}
            <div className="flex justify-center mt-6 space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex ? 'bg-[#C7EA46] scale-125' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* CONTENIDO - COLUMNA DERECHA */}
          <div className="lg:pl-8">
            
            {/* Título principal */}
            <h2 className="text-4xl lg:text-5xl font-bold text-[#2C3E50] mb-6 leading-tight">
              {title || "🐕 Nuestros Peluditos y Sus Espacios Favoritos"}
            </h2>
            
            {/* Línea decorativa */}
            <div className="w-32 h-1 bg-[#C7EA46] mb-6"></div>
            
            {/* Subtítulo */}
            {subtitle ? (
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {subtitle}
              </p>
            ) : (
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Donde nuestros amigos de cuatro patas viven, juegan y son felices todos los días 🎾
              </p>
            )}

            {/* Info general */}
            <div className="bg-white/60 rounded-lg p-6 mb-6">
              <p className="text-lg text-[#2C3E50] font-medium">
                ✨ Aquí pasan el rato nuestros peluditos favoritos
              </p>
              <p className="text-gray-600 mt-2">
                {images.length} fotos de pura diversión canina
              </p>
            </div>

            {/* Info adicional */}
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <span className="text-2xl mr-3">🐾</span>
                <span>Peluditos felices todos los días</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="text-2xl mr-3">🎾</span>
                <span>Espacios para jugar y correr</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="text-2xl mr-3">❤️</span>
                <span>Mucho amor y cuidados</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="text-2xl mr-3">📸</span>
                <span>Momentos únicos de nuestros peludos</span>
              </div>
            </div>

            {/* Botón CTA opcional */}
            <div className="mt-8">
              <button className="bg-[#C7EA46] hover:bg-[#b8d63f] text-[#2C3E50] font-bold py-3 px-8 rounded-lg transition-all hover:scale-105 shadow-lg">
                Conoce a nuestros peluditos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleCarousel;