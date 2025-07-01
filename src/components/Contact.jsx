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

  // NÚMERO DE WHATSAPP DEL CLUB CANINO (Cambiar por el número real)
  const WHATSAPP_NUMBER = '573123456789'; // Formato: 57 + número sin +

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const generateWhatsAppMessage = () => {
    const { name, email, phone, dogName, dogSize, message, plan } = formData;
    
    let whatsappMessage = `¡Hola! 🐕 Me interesa el Club Canino Dos Huellitas\n\n`;
    whatsappMessage += `👤 *Datos del propietario:*\n`;
    whatsappMessage += `• Nombre: ${name}\n`;
    whatsappMessage += `• Email: ${email}\n`;
    whatsappMessage += `• Teléfono: ${phone}\n\n`;
    
    if (dogName) {
      whatsappMessage += `🐾 *Datos del peludito:*\n`;
      whatsappMessage += `• Nombre: ${dogName}\n`;
      if (dogSize) whatsappMessage += `• Tamaño: ${dogSize}\n`;
      whatsappMessage += `\n`;
    }
    
    if (plan) {
      whatsappMessage += `📋 *Plan de interés:* ${plan}\n\n`;
    }
    
    if (message) {
      whatsappMessage += `💬 *Mensaje:*\n${message}\n\n`;
    }
    
    whatsappMessage += `Quedo atent@ a su respuesta. ¡Gracias! 🙏`;
    
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
    
    // Log para debug (opcional)
    console.log('Formulario enviado vía WhatsApp:', formData);
    
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
                    <p>Bogotá, Colombia</p>
                    <p className="text-sm text-blue-100">Servicio a domicilio disponible</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-6 h-6 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold">WhatsApp</h4>
                    <p>+57 313 8839001</p>
                    <p className="text-sm text-blue-100">Respuesta inmediata</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-6 h-6 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold">Horario de Atención</h4>
                    <p>Lunes a Viernes: 6:00 AM - 7:00 PM</p>
                    <p>Sábados: 8:00 AM - 5:00 PM</p>
                    <p className="text-sm text-blue-100">Domingos: Solo emergencias</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="font-semibold mb-4">Síguenos en Redes Sociales</h4>
                <div className="flex space-x-4">
                  <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#FFFE8D] transition-colors">
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.33-1.297C4.198 14.897 3.708 13.746 3.708 12.45s.49-2.448 1.297-3.33c.882-.807 2.033-1.297 3.33-1.297s2.448.49 3.33 1.297c.807.882 1.297 2.033 1.297 3.33s-.49 2.448-1.297 3.33c-.882.808-2.033 1.298-3.33 1.298zm7.718-1.297c-.882.807-2.033 1.297-3.33 1.297s-2.448-.49-3.33-1.297c-.807-.882-1.297-2.033-1.297-3.33s.49-2.448 1.297-3.33c.882-.807 2.033-1.297 3.33-1.297s2.448.49 3.33 1.297c.807.882 1.297 2.033 1.297 3.33s-.49 2.448-1.297 3.33z"/>
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
                  <h3 className="text-xl font-semibold text-green-800 mb-2">¡WhatsApp Abierto! 📱</h3>
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
                        Nombre del peludito
                      </label>
                      <input
                        type="text"
                        id="dogName"
                        name="dogName"
                        value={formData.dogName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#56CCF2] focus:border-[#56CCF2]"
                        placeholder="Ej: Max, Luna, Rocky..."
                      />
                    </div>
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
                      <option value="">Selecciona el tamaño</option>
                      <option value="Pequeño (menos de 10kg)">Pequeño (menos de 10kg)</option>
                      <option value="Mediano (10-25kg)">Mediano (10-25kg)</option>
                      <option value="Grande (25-40kg)">Grande (25-40kg)</option>
                      <option value="Gigante (más de 40kg)">Gigante (más de 40kg)</option>
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
                      <option value="">Selecciona un plan</option>
                      <option value="Plan 1 día a la semana">Plan 1 día a la semana</option>
                      <option value="Plan 2 días a la semana">Plan 2 días a la semana</option>
                      <option value="Plan 3 días a la semana">Plan 3 días a la semana</option>
                      <option value="Plan 4 días a la semana">Plan 4 días a la semana</option>
                      <option value="Plan 5 días a la semana">Plan 5 días a la semana</option>
                      <option value="Hotel canino">Hotel canino</option>
                      <option value="Grooming">Servicio de grooming</option>
                      <option value="Veterinario">Servicio veterinario</option>
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
                      className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium rounded-md shadow-md transition-colors duration-300 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
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