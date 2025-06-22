// 🚨 SCRIPT PARA DESHABILITAR SERVICE WORKER TEMPORALMENTE
// Coloca este script en public/sw-disable.js y llámalo desde Layout.astro

console.log('🧹 LIMPIANDO SERVICE WORKERS - Club Canino');

async function disableServiceWorkers() {
  try {
    if ('serviceWorker' in navigator) {
      console.log('🔍 Buscando Service Workers...');
      
      // 1. Obtener todas las registraciones
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`📋 Encontrados ${registrations.length} Service Workers`);
      
      // 2. Eliminar todas las registraciones
      const promises = registrations.map(async (registration) => {
        console.log(`🗑️ Eliminando SW: ${registration.scope}`);
        await registration.unregister();
        return registration.scope;
      });
      
      const removed = await Promise.all(promises);
      console.log('✅ Service Workers eliminados:', removed);
      
      // 3. Limpiar TODOS los caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`🗂️ Encontrados ${cacheNames.length} caches`);
        
        const cachePromises = cacheNames.map(async (cacheName) => {
          console.log(`🗑️ Eliminando cache: ${cacheName}`);
          await caches.delete(cacheName);
          return cacheName;
        });
        
        const removedCaches = await Promise.all(cachePromises);
        console.log('✅ Caches eliminados:', removedCaches);
      }
      
      // 4. Forzar reload sin cache
      console.log('🔄 Recargando página sin cache...');
      window.location.reload(true);
      
    } else {
      console.log('ℹ️ Service Worker no soportado');
    }
    
  } catch (error) {
    console.error('❌ Error limpiando SW:', error);
    
    // Fallback: reload forzado
    console.log('🔄 Reload de emergencia...');
    window.location.href = window.location.href + '?nocache=' + Date.now();
  }
}

// Ejecutar inmediatamente
disableServiceWorkers();

// También limpiar storage si es necesario
try {
  if ('localStorage' in window) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('club-canino') || key.includes('cache'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Eliminado localStorage: ${key}`);
    });
  }
  
  if ('sessionStorage' in window) {
    sessionStorage.clear();
    console.log('🗑️ SessionStorage limpiado');
  }
} catch (error) {
  console.warn('⚠️ Error limpiando storage:', error);
}

console.log('🎯 LIMPIEZA COMPLETADA - Sin Service Workers activos');