// src/middleware.ts - SIMPLIFICADO PARA NETLIFY
import { defineMiddleware } from 'astro:middleware';

// ===============================================
// 🎯 MIDDLEWARE SIMPLIFICADO - SOLO NAVEGACIÓN
// ===============================================

const PUBLIC_ROUTES = [
  '/', '/login', '/servicios', '/instalaciones', 
  '/contacto', '/preguntas-frecuentes', '/about'
];

const BYPASS_ROUTES = [
  '/api/', '/images/', '/_astro/', '/favicon.ico', 
  '/manifest.json', '/sw.js', '/robots.txt', '/sitemap.xml'
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url } = context;
  const pathname = url.pathname;

  // ===============================================
  // 🟢 BYPASS PARA ARCHIVOS ESTÁTICOS
  // ===============================================
  const shouldBypass = BYPASS_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  if (shouldBypass) {
    return next();
  }

  // ===============================================
  // 🟢 RUTAS PÚBLICAS - NO REQUIEREN AUTH
  // ===============================================
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || 
                       pathname.startsWith('/images/') ||
                       pathname.startsWith('/_astro/');

  if (isPublicRoute) {
    return next();
  }

  // ===============================================
  // 🟡 PARA DESARROLLO - PERMITIR TODO
  // ===============================================
  if (import.meta.env.DEV) {
    console.log(`🚀 DEV Mode - Permitiendo acceso a: ${pathname}`);
    
    // Simular usuario para desarrollo
    context.locals.profile = {
      id: 'dev-user',
      email: 'dev@clubcanino.com',
      role: 'admin',
      full_name: 'Usuario Desarrollo',
      active: true
    };
    
    return next();
  }

  // ===============================================
  // 🚀 PRODUCCIÓN - CONFIGURACIÓN PENDIENTE
  // ===============================================
  
  // Para producción, por ahora permitir acceso
  // TODO: Implementar autenticación real con Supabase
  console.log(`⚠️ Producción - Acceso temporal permitido: ${pathname}`);
  
  // Simular usuario autenticado temporalmente
  context.locals.profile = {
    id: 'temp-user',
    email: 'admin@clubcanino.com',
    role: 'admin',
    full_name: 'Juan Pablo Leal',
    active: true
  };

  return next();
});