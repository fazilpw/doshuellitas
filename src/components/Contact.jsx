// src/components/Contact.jsx
import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dogName: '',
    dogSize: '',
    message: '',
    plan: ''
  });

  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí eventualmente se conectará con Supabase para guardar el formulario
    console.log('Formulario enviado:', formData);
    // Mostrar mensaje de éxito
    setFormSubmitted(true);
    // Reset form after a delay
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        dogName: '',
        dogSize: '',
        message: '',
        plan: ''
      });
      setFormSubmitted(false);
    }, 5000);
  };

  return (
    <div className="bg-[#FFFBF0] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#2C3E50]">Contáctanos</h2>
          <p className="mt-4 text-lg text-gray-600">
            Estamos para resolver todas tus dudas
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2 bg-[#56CCF2] p-8 text-white">
  <h3 className="text-2xl font-semibold mb-6">Información de Contacto</h3>
  
  <div className="space-y-6">
    <div className="flex items-start">
      <svg className="w-6 h-6 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <div>
        <h4 className="font-semibold">Ubicación</h4>
        <p className="mt-1">Vereda la aurora, subida por la 7ma con 175 a 15 minutos de Bogota</p>
      </div>
    </div>
    
    <div className="flex items-start">
      <svg className="w-6 h-6 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      <div>
        <h4 className="font-semibold">Teléfono</h4>
        <p className="mt-1">
          <a href="tel:+573144329824" className="hover:underline">+57 314 432 9824</a>
        </p>
      </div>
    </div>
    
    <div className="flex items-start">
      <svg className="w-6 h-6 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <div>
        <h4 className="font-semibold">Email</h4>
        <p className="mt-1">
          <a href="mailto:clubcaninodoshuellitas@gmail.com" className="hover:underline">clubcaninodoshuellitas@gmail.com</a>
        </p>
      </div>
    </div>
    
    <div className="flex items-start">
      <svg className="w-6 h-6 mr-3 mt-1" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <div>
        <h4 className="font-semibold">WhatsApp</h4>
        <p className="mt-1">
          <a href="https://wa.me/573144329824?text=Hola,%20quiero%20información%20sobre%20Club%20Canino%20Dos%20Huellitas" target="_blank" rel="noopener noreferrer" className="hover:underline">+57 314 432 9824</a>
        </p>
      </div>
    </div>
  </div>
  
  <div className="mt-12">
    <h3 className="text-2xl font-semibold mb-6">Horario de Atención</h3>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Lunes - Viernes:</span>
        <span>7:00 AM - 6:00 PM</span>
      </div>
      <div className="flex justify-between">
        <span>Sábados:</span>
        <span>8:00 AM - 2:00 PM</span>
      </div>
      <div className="flex justify-between">
        <span>Domingos:</span>
        <span>Cerrado (excepto hotel)</span>
      </div>
    </div>
  </div>
  
  <div className="mt-12">
    <h3 className="text-xl font-semibold mb-4">Síguenos en Redes Sociales</h3>
    <div className="flex space-x-4">
      <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#FFFE8D] transition-colors">
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </a>
      <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#FFFE8D] transition-colors">
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
        </svg>
      </a>
      <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#FFFE8D] transition-colors">
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
      </a>
    </div>
  </div>
</div>

<div className="md:w-1/2 p-8">
  {formSubmitted ? (
    <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
      <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="text-xl font-semibold text-green-800 mb-2">¡Mensaje Enviado!</h3>
      <p className="text-green-700">
        Gracias por contactarnos. Nos pondremos en contacto contigo lo antes posible.
      </p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo*
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico*
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
          />
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono/WhatsApp*
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
          />
        </div>
        
        <div>
          <label htmlFor="dogName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de tu peludito*
          </label>
          <input
            type="text"
            id="dogName"
            name="dogName"
            value={formData.dogName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="dogSize" className="block text-sm font-medium text-gray-700 mb-1">
          Tamaño de tu peludito*
        </label>
        <select
          id="dogSize"
          name="dogSize"
          value={formData.dogSize}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
        >
          <option value="">Seleccionar tamaño</option>
          <option value="pequeño">Pequeño (1-10kg)</option>
          <option value="mediano">Mediano (10-25kg)</option>
          <option value="grande">Grande (25-40kg)</option>
          <option value="gigante">Gigante (más de 40kg)</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
          Plan de interés
        </label>
        <select
          id="plan"
          name="plan"
          value={formData.plan}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
        >
          <option value="">Seleccionar plan</option>
          <option value="2dias">Plan 2 días a la semana</option>
          <option value="3dias">Plan 3 días a la semana</option>
          <option value="4dias">Plan 4 días a la semana</option>
          <option value="5dias">Plan 5 días a la semana</option>
          <option value="hotel">Hotel canino</option>
          <option value="grooming">Servicio de grooming</option>
          <option value="veterinario">Servicio veterinario</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Mensaje o consulta
        </label>
        <textarea
          id="message"
          name="message"
          rows="4"
          value={formData.message}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
          placeholder="Cuéntanos un poco sobre tu peludito y en qué podemos ayudarte..."
        ></textarea>
      </div>
      
      <div className="flex items-center">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="h-4 w-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
          Acepto la política de privacidad y el tratamiento de mis datos personales*
        </label>
      </div>
      
      <div>
        <button
          type="submit"
          className="w-full py-3 px-4 bg-[#56CCF2] hover:bg-[#5B9BD5] text-white font-medium rounded-md shadow-md transition-colors duration-300"
        >
          Enviar mensaje
        </button>
      </div>
    </form>
  )}
</div>
</div>
</div>
</div>
</div>
);
};

export default Contact;