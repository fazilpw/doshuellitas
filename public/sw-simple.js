// SW ultra-simple sin conflictos
console.log('🐕 Club Canino SW v1.0');

self.addEventListener('install', (event) => {
  console.log('✅ SW instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ SW activado');
  event.waitUntil(self.clients.claim());
});

// Solo manejo básico de fetch sin cache
self.addEventListener('fetch', (event) => {
  // No interceptar nada, solo pasar al network
  event.respondWith(fetch(event.request));
});