// astro.config.mjs - CONFIGURACIÓN CORREGIDA PARA NETLIFY
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

export default defineConfig({
  // 🌍 MODO HÍBRIDO para Netlify (en lugar de full SSR)
  output: 'hybrid',
  adapter: netlify(),

  // 🎨 Integraciones
  integrations: [
    tailwind(),
    react()
  ],

  // 🔧 Configuración Vite
  vite: {
    define: { 
      global: 'globalThis',
    }
  },

  // 📱 Configuración del sitio
  site: 'https://clubcaninodoshuellitas.netlify.app', // Cambia por tu dominio real
  base: '/',

  // 🔄 Configuración de rutas
  experimental: {
    hybridOutput: true
  }
});