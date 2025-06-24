// astro.config.mjs - CONFIGURACIÓN ARREGLADA
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import node from '@astrojs/node'; // ✅ Descomentado

export default defineConfig({
  // 🖥️ SSR activado
  output: 'server', // ✅ Descomentado - CRÍTICO para middleware
  adapter: node({
    mode: 'standalone'
  }),

  // 🎨 Integraciones
  integrations: [
    tailwind(),
    react()
  ],

  // 🔧 Configuración Vite
  vite: {
    define: { 
      global: 'globalThis',
    },
    server: {
      host: true,
      port: 4321,
      strictPort: false
    }
  },

  // 📱 Configuración básica
  site: 'https://clubcaninodoshuellitas.com',
  base: '/'
});