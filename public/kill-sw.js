// public/kill-sw.js - ELIMINAR TODOS LOS SERVICE WORKERS
console.log('🔥 DESTRUYENDO LOS SERVICE WORKERS');

async function nukeSW() {
  try {
    // 1. ELIMINAR TODAS LAS REGISTRACIONES
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`🎯 Encontrados ${registrations.length} SW para eliminar`);
      
      for (const registration of registrations) {
        console.log(`💀 Eliminando: ${registration.scope}`);
        await registration.unregister();
      }
    }
    
    // 2. LIMPIAR TODOS LOS CACHES
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`🗑️ Encontrados ${cacheNames.length} caches para eliminar`);
      
      for (const cacheName of cacheNames) {
        console.log(`💀 Eliminando cache: ${cacheName}`);
        await caches.delete(cacheName);
      }
    }
    
    // 3. LIMPIAR STORAGE RELACIONADO
    if (localStorage) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('sw-') || key.includes('cache-') || key.includes('pwa-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    console.log('✅ TODOS LOS SW ELIMINADOS - Recargando...');
    
    // 4. HARD RELOAD
    setTimeout(() => {
      window.location.href = window.location.href + '?clean=' + Date.now();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error:', error);
    // Fallback extremo
    window.location.href = window.location.origin + '?force-clean=' + Date.now();
  }
}

nukeSW();