// src/components/Navbar.jsx
import { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-[#56CCF2] z-20 shadow-md fixed w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 flex items-center">
            <img 
              className="h-20 p-2 " 
              src="/logo.svg" 
              alt="Club Canino Dos Huellitas" 
            />
            
          </div>
          
          {/* Menú de navegación para pantallas medianas y grandes */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <a href="/" className="text-[#2C3E50] hover:bg-[#ACF0F4] hover:text-[#2C3E50] px-3 py-2 rounded-md font-medium">Inicio</a>
              <a href="/servicios" className="text-[#2C3E50] hover:bg-[#ACF0F4] hover:text-[#2C3E50] px-3 py-2 rounded-md font-medium">Servicios</a>
              <a href="/instalaciones" className="text-[#2C3E50] hover:bg-[#ACF0F4] hover:text-[#2C3E50] px-3 py-2 rounded-md font-medium">Instalaciones</a>
              <a href="/preguntas-frecuentes" className="text-[#2C3E50] hover:bg-[#ACF0F4] hover:text-[#2C3E50] px-3 py-2 rounded-md font-medium">Preguntas Frecuentes</a>
              <a href="/contacto" className="bg-[#C7EA46] text-[#2C3E50] hover:bg-[#FFFE8D] px-3 py-2 rounded-md font-medium">Contáctanos</a>
              <a href="/login" className="bg-[#C7EA46] text-[#2C3E50] hover:bg-[#FFFE8D] px-3 py-2 rounded-md font-medium">
  👤 Iniciar Sesión
</a>
            </div>
          </div>
          
          {/* Botón de menú para móviles */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#2C3E50] hover:bg-[#ACF0F4]"
            >
              <svg 
                className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg 
                className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Menú móvil */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#FFFBF0]">
          <a href="/" className="text-[#2C3E50] hover:bg-[#ACF0F4] block px-3 py-2 rounded-md font-medium">Inicio</a>
          <a href="/servicios" className="text-[#2C3E50] hover:bg-[#ACF0F4] block px-3 py-2 rounded-md font-medium">Servicios</a>
          <a href="/instalaciones" className="text-[#2C3E50] hover:bg-[#ACF0F4] block px-3 py-2 rounded-md font-medium">Instalaciones</a>
          <a href="/preguntas-frecuentes" className="text-[#2C3E50] hover:bg-[#ACF0F4] block px-3 py-2 rounded-md font-medium">Preguntas Frecuentes</a>
          <a href="/contacto" className="bg-[#C7EA46] text-[#2C3E50] hover:bg-[#FFFE8D] block px-3 py-2 rounded-md font-medium">Contáctanos</a>
          <a href="/login" className="bg-[#C7EA46] text-[#2C3E50] hover:bg-[#FFFE8D] block px-3 py-2 rounded-md font-medium">
  👤 Iniciar Sesión
</a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;