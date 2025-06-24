// astro.config.mjs - CONFIGURACIÓN ESTÁTICA PARA NETLIFY
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  // 🌍 MODO ESTÁTICO - Sin SSR para evitar problemas
  output: 'static',

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
  base: '/'
});