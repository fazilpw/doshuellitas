// src/components/Contact.jsx - CON IMAGEN DE FONDO EN INFORMACIÓN DE CONTACTO

import { useState } from 'react';

const Contact = () => {
  const WHATSAPP_NUMBER = '573144329824';
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dogName: '',
    dogSize: '',
    message: '',
    plan: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateWhatsAppMessage = () => {
    const whatsappMessage = `¡Hola! Me interesa Club Canino Dos Huellitas 🐕

📋 *Datos de Contacto:*
• *Nombre:* ${formData.name}
• *Email:* ${formData.email}
• *Teléfono:* ${formData.phone}
• *Plan de interés:* ${formData.plan}

🐾 *Información de mi Peludito:*
• *Nombre del perro:* ${formData.dogName}
• *Tamaño:* ${formData.dogSize}

💬 *Mensaje:*
${formData.message}

¡Gracias! 🙏`;
    
    return encodeURIComponent(whatsappMessage);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Generar mensaje de WhatsApp
    const message = generateWhatsAppMessage();
    
    // Crear URL de WhatsApp
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    
    // Abrir WhatsApp en nueva ventana
    window.open(whatsappURL, '_blank', 'noopener,noreferrer');
    
    // Mostrar mensaje de éxito
    setFormSubmitted(true);
    
    // Reset form después de un delay
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
          <h2 className="text-3xl md:text-5xl font-bold font-dynapuff text-[#2C3E50]">Contáctanos</h2>
          <p className="mt-4 text-lg text-gray-600">
            Te contactaremos vía WhatsApp inmediatamente 📱
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex">
            
            {/* 📷 SECCIÓN DE INFORMACIÓN DE CONTACTO CON IMAGEN DE FONDO */}
            <div className="md:w-1/2 relative">
              {/* 🖼️ IMAGEN DE FONDO */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/images/lugar/instruc-2.webp')" // 👈 CAMBIAR POR TU IMAGEN
                }}
              ></div>
              
              {/* 🎨 OVERLAY DE COLOR PARA LEGIBILIDAD */}
              <div className="absolute inset-0 bg-[#0081ab] bg-opacity-55"></div>
              
              {/* 📝 CONTENIDO DE INFORMACIÓN */}
              <div className="relative z-10 p-8 text-white h-full">
                <h3 className="text-2xl font-semibold mb-6">Información de Contacto</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold">Ubicación</h4>
                      <p>Bogotá, Colombia</p>
                      <p className="text-sm text-blue-100">Servicio a domicilio disponible</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-6 h-6 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold">WhatsApp</h4>
                      <p>+57 314 432 9824</p>
                      <p className="text-sm text-blue-100">Respuesta inmediata</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-6 h-6 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold">Horarios</h4>
                      <p>Lun - Vie: 6:00 AM - 6:00 PM</p>
                      <p>Sábados: 7:00 AM - 5:00 PM</p>
                      <p className="text-sm text-blue-100">Domingos solo para huéspedes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-6 h-6 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <div>
                      <h4 className="font-semibold">Email</h4>
                      <p>info@clubcaninodoshuellitas.com</p>
                      <p className="text-sm text-blue-100">Para consultas detalladas</p>
                    </div>
                  </div>
                </div>
                
                {/* 🎯 CALL TO ACTION ADICIONAL */}
                <div className="mt-8 p-4 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                  <h5 className="font-semibold mb-2">🚐 Servicio de Transporte</h5>
                  <p className="text-sm text-blue-100">
                    Recogemos y llevamos a tu peludito directamente a tu puerta. 
                    ¡Sin estrés para ti ni para él!
                  </p>
                </div>
              </div>
            </div>

            {/* 📝 SECCIÓN DEL FORMULARIO */}
            <div className="md:w-1/2 p-8">
              {formSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    ¡Mensaje Enviado! 📱
                  </h3>
                  <p className="text-green-700 mb-4">
                    Se abrió WhatsApp con tu mensaje. Si no se abrió automáticamente, 
                    <a 
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${generateWhatsAppMessage()}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-800 font-semibold underline ml-1"
                    >
                      haz clic aquí
                    </a>
                  </p>
                  <div className="text-sm text-green-600">
                    <p>✅ Te contactaremos en menos de 30 minutos</p>
                  </div>
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono*
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
                      <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
                        Plan de interés*
                      </label>
                      <select
                        id="plan"
                        name="plan"
                        value={formData.plan}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                      >
                        <option value="">Seleccionar plan</option>
                        <option value="Guardería">Guardería</option>
                        <option value="Colegio">Colegio</option>
                        <option value="Hotel">Hotel</option>
                        <option value="Consulta General">Consulta General</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="dogName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del peludito
                      </label>
                      <input
                        type="text"
                        id="dogName"
                        name="dogName"
                        value={formData.dogName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="dogSize" className="block text-sm font-medium text-gray-700 mb-1">
                        Tamaño del perro
                      </label>
                      <select
                        id="dogSize"
                        name="dogSize"
                        value={formData.dogSize}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                      >
                        <option value="">Seleccionar tamaño</option>
                        <option value="Pequeño">Pequeño (hasta 10kg)</option>
                        <option value="Mediano">Mediano (10-25kg)</option>
                        <option value="Grande">Grande (25-45kg)</option>
                        <option value="Gigante">Gigante (+45kg)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje adicional
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="4"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                      placeholder="Cuéntanos más sobre tu peludito o consultas específicas..."
                    ></textarea>
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium rounded-md shadow-md transition-colors duration-300 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Enviar por WhatsApp
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