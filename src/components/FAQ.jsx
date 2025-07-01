// src/components/FAQ.jsx
import { useState } from 'react';

const FAQItem = ({ question, answer, isOpen, toggleOpen }) => {
  return (
    <div className="border-b border-gray-200 pb-4">
      <button
        className="flex w-full justify-between items-center py-4 text-left"
        onClick={toggleOpen}
      >
        <span className="text-lg font-medium text-[#2C3E50]">{question}</span>
        <svg
          className={`w-6 h-6 text-[#56CCF2] transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-2 text-gray-600">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const faqs = [
    {
      id: 1,
      question: "¿Cómo garantizan la seguridad de mi perro?",
      answer: "La seguridad es nuestra prioridad número uno. Contamos con un equipo de profesionales certificados que supervisan a los perros en todo momento. Nuestras instalaciones de 8.000m² están diseñadas pensando en la seguridad, sin corrales y con áreas delimitadas según el tamaño y temperamento de cada mascota. Realizamos una evaluación inicial de comportamiento y agrupamos a los perros según su compatibilidad. Adicionalmente, contamos con supervisión veterinaria permanente y protocolos de emergencia bien establecidos."
    },
    {
      id: 2,
      question: "¿Cómo sabré que mi perro está bien durante su estancia?",
      answer: "Entendemos la importancia de mantenerte informado. Por eso, enviamos fotos y videos diarios de tu mascota a través de WhatsApp o nuestra aplicación. Nuestro equipo te informa sobre cómo se está adaptando, sus actividades y cualquier novedad importante. Valoramos la transparencia y te comunicaremos cualquier situación relevante de manera inmediata. Además, puedes llamarnos en cualquier momento para consultar sobre tu peludito."
    },
    {
      id: 3,
      question: "¿Qué actividades realizan con los perros?",
      answer: "En Club Canino Dos Huellitas, cada día está lleno de actividades enriquecedoras: socialización supervisada, ejercicios físicos adaptados a cada perro, juegos de estimulación mental, entrenamiento básico de obediencia, tiempo de descanso controlado y mucho juego libre en nuestras amplias áreas verdes. Para perros enérgicos, incluimos actividades deportivas como agility, mientras que para los más tranquilos ofrecemos sesiones de relajación. Todo está diseñado para que tu mascota regrese feliz y equilibrada."
    },
    {
      id: 4,
      question: "¿Cómo funciona el servicio de transporte puerta a puerta?",
      answer: "Nuestro servicio de ruta recoge a tu mascota directamente en tu domicilio en horarios coordinados previamente. Contamos con vehículos especialmente acondicionados para el transporte seguro y cómodo de perros, con ventilación adecuada, separaciones individuales para evitar conflictos y cinturones de seguridad para mascotas. Nuestros conductores están capacitados en manejo canino. Te informaremos con anticipación el horario exacto de recogida y entrega."
    },
    {
      id: 5,
      question: "¿Qué requisitos debe cumplir mi perro para asistir?",
      answer: "Para garantizar un ambiente seguro y saludable para todos, requerimos: carnet de vacunación al día (incluyendo rabia, polivalente y tos de las perreras), desparasitación interna y externa reciente, y que tu perro no muestre signos de enfermedad contagiosa. Es importante que tu mascota sea sociable o al menos tolerante con otros perros. Realizamos una evaluación inicial de comportamiento para asegurar que tu perro se adaptará bien al entorno grupal."
    },
    {
      id: 6,
      question: "¿Manejan perros con problemas de comportamiento?",
      answer: "Sí, trabajamos con perros que presentan diversos desafíos de comportamiento, siempre que no representen un riesgo para otros perros o nuestro personal. Contamos con entrenadores certificados en modificación de conducta que pueden ayudar con problemas como ansiedad por separación, inseguridad, o problemas de socialización. En casos de comportamientos más complejos, diseñamos un plan de integración gradual y trabajamos con técnicas de refuerzo positivo para mejorar su comportamiento."
    },
    {
      id: 7,
      question: "¿Cuáles son los planes y costos del servicio?",
      answer: "Ofrecemos planes flexibles de 2, 3, 4 o 5 días a la semana. Los costos mensuales son: 2 días $380.000, 3 días $450.000, 4 días $500.000 y 5 días $550.000. Todos nuestros planes incluyen recreación dirigida, socialización, ejercicio, actividades formativas, servicio de ruta puerta a puerta, registro fotográfico diario y supervisión veterinaria. También ofrecemos servicios adicionales como hotel canino, grooming, consulta veterinaria y toma de muestras médicas."
    },
    {
  id: 8,
  question: "¿Dónde están ubicados y cómo puedo conocer las instalaciones?",
  answer: "Nos ubicamos en la Vereda La Aurora, a solo 15 minutos de Bogotá (subida por la 7ma con 175). Invitamos a todos los dueños de nuestros futuros peluditos a programar una visita para conocer nuestras instalaciones. Te mostraremos todas las áreas donde tu mascota pasará su tiempo y podrás conocer a nuestros entrenadores. Simplemente contáctanos por WhatsApp o llámanos al 3144329824 para agendar tu visita en el horario que más te convenga."
}
  ];

  const [openItems, setOpenItems] = useState([1]);

  const toggleItem = (id) => {
    if (openItems.includes(id)) {
      setOpenItems(openItems.filter(item => item !== id));
    } else {
      setOpenItems([...openItems, id]);
    }
  };

  return (
    <div className="bg-[#FFFBF0] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold font-dynapuff text-[#2C3E50]">Preguntas Frecuentes</h2>
          <p className="mt-4 text-lg text-gray-600">
            Resolvemos tus dudas sobre nuestro Club Canino Dos Huellitas
          </p>
        </div>
        
        <div className="space-y-2">
          {faqs.map((faq) => (
            <FAQItem
              key={faq.id}
              question={faq.question}
              answer={faq.answer}
              isOpen={openItems.includes(faq.id)}
              toggleOpen={() => toggleItem(faq.id)}
            />
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-gray-600">
            ¿Tienes más preguntas? No dudes en contactarnos.
          </p>
         <a 
            href="https://wa.me/573144329824?text=Hola,%20tengo%20una%20pregunta%20sobre%20Club%20Canino%20Dos%20Huellitas"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#56CCF2] hover:bg-[#5B9BD5]"
          >
            Contáctanos por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ; 