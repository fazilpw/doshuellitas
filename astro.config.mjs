// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  integrations: [
    tailwind(),
    react()
  ],
  vite: {
    define: { 
      global: 'globalThis',
    }
  },
  site: 'https://doshuellitas.netlify.app',
  base: '/'
});