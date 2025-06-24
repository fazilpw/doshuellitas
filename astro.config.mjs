// astro.config.mjs - CONFIGURACIÓN CORREGIDA PARA NETLIFY
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

export default defineConfig({
  // 🚀 CONFIGURACIÓN PARA NETLIFY (HÍBRIDA)
  output: 'hybrid',
  adapter: netlify(),

  // 🎨 Integraciones
  integrations: [
    tailwind(),
    react()
  ],

  // 🔧 Configuración Vite corregida
  vite: {
    define: { 
      global: 'globalThis',
    },
    ssr: {
      external: ["@supabase/ssr", "@supabase/supabase-js"]
    }
  },

  // 📱 Configuración del sitio
  site: 'https://clubcaninodoshuellitas.netlify.app', // Cambia por tu dominio real
  base: '/',

  // 🛡️ Configuración de seguridad
  experimental: {
    serverIslands: false
  }
});