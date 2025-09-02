// src/utils/seo.js

/**
 * Configuración SEO para el sitio Club Canino Dos Huellitas
 * Este archivo contiene las funciones y constantes relacionadas con el SEO
 */

// Constantes con palabras clave principales basadas en la investigación
export const SEO_KEYWORDS = {
  primary: [
    'guardería canina Bogotá',
    'colegio canino Bogotá',
    'hotel canino Bogotá',
    'adiestramiento canino Bogotá',
    'transporte para perros Bogotá',
  ],
  secondary: [
    'servicio veterinario perros',
    'socialización canina',
    'entrenamiento de perros',
    'cuidado diario perros',
    'guardería para perros norte de Bogotá',
    'hotel para perros',
  ],
  informational: [
    'cómo educar un perro',
    'cómo socializar un cachorro',
    'dónde dejar mi perro cuando viajo',
    'guardería canina con transporte',
    'cómo elegir una guardería para perros',
  ]
};

// Datos estructurados del negocio para schema.org
export const BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Club Canino Dos Huellitas",
  "image": [
    "https://clubcaninodoshuellitas.com/images/og-image.jpg"
  ],
  "description": "Guardería, colegio y hotel canino con servicio de ruta puerta a puerta. Más de 11.000m² de áreas libres de corrales para la recreación, socialización y formación de tu mascota.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Vereda la aurora, subida por la 7ma con 175",
    "addressLocality": "Bogotá",
    "addressRegion": "Cundinamarca",
    "postalCode": "",
    "addressCountry": "CO"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 4.7588,
    "longitude": -74.0421
  },
  "url": "https://www.clubcaninodoshuellitas.com/",
  "telephone": "+573144329824",
  "email": "clubcaninodoshuellitas@gmail.com",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "07:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "08:00",
      "closes": "14:00"
    }
  ],
  "priceRange": "$$",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Servicios para mascotas",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Guardería Canina",
          "description": "Cuidado diario de tu mascota mientras trabajas o estudias."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Hotel Canino",
          "description": "Alojamiento para tu mascota cuando necesites viajar."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Adiestramiento Canino",
          "description": "Formación en obediencia y socialización para mejorar el comportamiento de tu perro."
        }
      }
    ]
  },
  "sameAs": [
    "https://www.facebook.com/clubcaninodoshuellitas",
    "https://www.instagram.com/clubcaninodoshuellitas"
  ]
};

// Datos para schema de FAQPage
export const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Cómo garantizan la seguridad de mi perro?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "La seguridad es nuestra prioridad número uno. Contamos con un equipo de profesionales certificados que supervisan a los perros en todo momento. Nuestras instalaciones de 11.000m² están diseñadas pensando en la seguridad, sin corrales y con áreas delimitadas según el tamaño y temperamento de cada mascota. Realizamos una evaluación inicial de comportamiento y agrupamos a los perros según su compatibilidad. Adicionalmente, contamos con supervisión veterinaria permanente y protocolos de emergencia bien establecidos."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cómo sabré que mi perro está bien durante su estancia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Entendemos la importancia de mantenerte informado. Por eso, enviamos fotos y videos diarios de tu mascota a través de WhatsApp o nuestra aplicación. Nuestro equipo te informa sobre cómo se está adaptando, sus actividades y cualquier novedad importante. Valoramos la transparencia y te comunicaremos cualquier situación relevante de manera inmediata. Además, puedes llamarnos en cualquier momento para consultar sobre tu peludito."
      }
    },
    {
      "@type": "Question",
      "name": "¿Qué actividades realizan con los perros?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "En Club Canino Dos Huellitas, cada día está lleno de actividades enriquecedoras: socialización supervisada, ejercicios físicos adaptados a cada perro, juegos de estimulación mental, entrenamiento básico de obediencia, tiempo de descanso controlado y mucho juego libre en nuestras amplias áreas verdes. Para perros enérgicos, incluimos actividades deportivas como agility, mientras que para los más tranquilos ofrecemos sesiones de relajación. Todo está diseñado para que tu mascota regrese feliz y equilibrada."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cuáles son los planes y costos del servicio?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ofrecemos planes flexibles de 2, 3, 4 o 5 días a la semana. Los costos mensuales son: 2 días $380.000, 3 días $450.000, 4 días $500.000 y 5 días $550.000. Todos nuestros planes incluyen recreación dirigida, socialización, ejercicio, actividades formativas, servicio de ruta puerta a puerta, registro fotográfico diario y supervisión veterinaria. También ofrecemos servicios adicionales como hotel canino, grooming, consulta veterinaria y toma de muestras médicas."
      }
    }
  ]
};

// Configuración para generar meta tags SEO
export const generateSEOMetaTags = (page = {}) => {
  const defaults = {
    title: "Club Canino Dos Huellitas | Guardería y Colegio Canino en Bogotá",
    description: "Guardería, colegio y hotel canino con servicio de ruta puerta a puerta. Más de 11.000m² de áreas libres de corrales para la recreación, socialización y formación de tu mascota.",
    image: "/images/og-image.jpg",
    url: "https://www.clubcaninodoshuellitas.com"
  };
  
  // Combinar valores predeterminados con específicos de la página
  const meta = {
    ...defaults,
    ...page
  };
  
  return [
    { name: "description", content: meta.description },
    { name: "keywords", content: SEO_KEYWORDS.primary.join(", ") + ", " + SEO_KEYWORDS.secondary.slice(0, 5).join(", ") },
    { property: "og:title", content: meta.title },
    { property: "og:description", content: meta.description },
    { property: "og:image", content: meta.image },
    { property: "og:url", content: meta.url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Club Canino Dos Huellitas" },
    { property: "og:locale", content: "es_CO" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: meta.title },
    { name: "twitter:description", content: meta.description },
    { name: "twitter:image", content: meta.image },
    { name: "robots", content: "index, follow" },
    { name: "canonical", href: meta.url }
  ];
};

// Configuración de pages para sitemap
export const SITEMAP_PAGES = [
  {
    url: '/',
    changefreq: 'weekly',
    priority: 1.0,
    lastmod: new Date().toISOString()
  },
  {
    url: '/servicios',
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: new Date().toISOString()
  },
  {
    url: '/instalaciones',
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: new Date().toISOString()
  },
  {
    url: '/preguntas-frecuentes',
    changefreq: 'monthly',
    priority: 0.7,
    lastmod: new Date().toISOString()
  },
  {
    url: '/contacto',
    changefreq: 'monthly',
    priority: 0.9,
    lastmod: new Date().toISOString()
  },
  {
    url: '/blog',
    changefreq: 'weekly',
    priority: 0.6,
    lastmod: new Date().toISOString()
  }
];

// Función para generar sitemap.xml personalizado
export const generateSitemap = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${SITEMAP_PAGES.map(page => `
  <url>
    <loc>https://www.clubcaninodoshuellitas.com${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
  `).join('')}
</urlset>`;
};

// Función para generar robots.txt optimizado para SEO
export const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /gracias/
Disallow: /404/

Sitemap: https://www.clubcaninodoshuellitas.com/sitemap.xml`;
};