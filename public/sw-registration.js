// public/sw-registration.js - Registro FINAL del Service Worker
console.log('🔧 Club Canino: Registrando SW ultra-seguro...');

// ============================================
// 🛡️ CONFIGURACIÓN DE SEGURIDAD
// ============================================

const SW_CONFIG = {
  // Archivo del service worker
  swFile: '/sw.js',
  
  // Scope (alcance)
  scope: '/',
  
  // Configuración
  options: {
    updateViaCache: 'none', // Nunca cachear el SW mismo
    type: 'classic'
  },
  
  // Modo debug
  debug: true
};

// ============================================
// 🔍 VERIFICACIONES PREVIAS
// ============================================

function canRegisterSW() {
  // Verificar soporte básico
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker no soportado en este navegador');
    return false;
  }
  
  // En desarrollo, permitir solo con parámetro
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('sw')) {
      console.log('🚧 SW deshabilitado en desarrollo (usa ?sw=1 para habilitar)');
      return false;
    }
    console.log('🧪 SW habilitado en desarrollo por parámetro');
  }
  
  return true;
}

// ============================================
// 🧹 LIMPIAR SERVICE WORKERS ANTERIORES
// ============================================

async function cleanupOldServiceWorkers() {
  try {
    console.log('🧹 Limpiando SW anteriores...');
    
    // Obtener todas las registraciones
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length > 0) {
      console.log(`🔍 Encontradas ${registrations.length} registraciones SW`);
      
      // Desregistrar todas las anteriores
      const cleanupPromises = registrations.map(async (registration) => {
        try {
          const result = await registration.unregister();
          console.log('🗑️ SW desregistrado:', registration.scope, result);
          return result;
        } catch (error) {
          console.warn('⚠️ Error desregistrando SW:', error);
          return false;
        }
      });
      
      await Promise.all(cleanupPromises);
      console.log('✅ Limpieza de SW completada');
      
      // Esperar un momento para que se complete la limpieza
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Limpiar caches también
    await cleanupOldCaches();
    
  } catch (error) {
    console.error('❌ Error limpiando SW anteriores:', error);
  }
}

// ============================================
// 🧹 LIMPIAR CACHES ANTIGUOS
// ============================================

async function cleanupOldCaches() {
  try {
    console.log('🧹 Limpiando caches antiguos...');
    
    const cacheNames = await caches.keys();
    
    if (cacheNames.length > 0) {
      console.log('🔍 Caches encontrados:', cacheNames);
      
      const deletePromises = cacheNames.map(async (cacheName) => {
        try {
          const result = await caches.delete(cacheName);
          console.log('🗑️ Cache eliminado:', cacheName, result);
          return result;
        } catch (error) {
          console.warn('⚠️ Error eliminando cache:', cacheName, error);
          return false;
        }
      });
      
      await Promise.all(deletePromises);
      console.log('✅ Limpieza de caches completada');
    }
    
  } catch (error) {
    console.error('❌ Error limpiando caches:', error);
  }
}

// ============================================
// 📝 REGISTRAR SERVICE WORKER NUEVO
// ============================================

async function registerNewServiceWorker() {
  try {
    console.log('🆕 Registrando SW ultra-seguro...');
    
    const registration = await navigator.serviceWorker.register(
      SW_CONFIG.swFile, 
      {
        scope: SW_CONFIG.scope,
        ...SW_CONFIG.options
      }
    );
    
    console.log('✅ SW ultra-seguro registrado:', registration.scope);
    
    // Configurar event listeners
    setupServiceWorkerEventListeners(registration);
    
    return registration;
    
  } catch (error) {
    console.error('❌ Error registrando SW nuevo:', error);
    throw error;
  }
}

// ============================================
// 🎧 CONFIGURAR EVENT LISTENERS
// ============================================

function setupServiceWorkerEventListeners(registration) {
  // Listener para actualizaciones
  registration.addEventListener('updatefound', () => {
    console.log('🔄 Actualización de SW encontrada');
    
    const newWorker = registration.installing;
    if (!newWorker) return;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          console.log('🆕 Nueva versión de SW lista');
          notifyNewVersion();
        } else {
          console.log('✅ SW instalado por primera vez');
        }
      }
    });
  });
  
  // Listener para mensajes del SW
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, data } = event.data || {};
    
    switch (type) {
      case 'SW_ACTIVATED':
        console.log('✅ SW activado:', data);
        showSWStatus('SW Ultra-Seguro Activo', 'success');
        break;
        
      case 'SW_ERROR':
        console.error('❌ Error en SW:', data);
        showSWStatus('Error en SW', 'error');
        break;
        
      case 'CACHE_UPDATED':
        console.log('💾 Cache actualizado:', data);
        break;
        
      default:
        if (SW_CONFIG.debug) {
          console.log('📨 Mensaje SW:', type, data);
        }
    }
  });
  
  // Listener para control del SW
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Controlador SW cambió - recargando página');
    window.location.reload();
  });
}

// ============================================
// 📢 NOTIFICACIONES AL USUARIO
// ============================================

function notifyNewVersion() {
  // Crear notificación discreta
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    background: #56CCF2; color: white; padding: 16px 20px;
    border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px; max-width: 300px;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px;">🔄 Actualización disponible</div>
    <div style="margin-bottom: 12px;">Nueva versión de Club Canino lista.</div>
    <button onclick="window.location.reload()" style="
      background: rgba(255,255,255,0.2); color: white; border: none;
      padding: 6px 12px; border-radius: 4px; cursor: pointer;
      margin-right: 8px;
    ">Actualizar</button>
    <button onclick="this.parentElement.remove()" style="
      background: none; color: rgba(255,255,255,0.8); border: none;
      padding: 6px 12px; cursor: pointer;
    ">Después</button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remover después de 10 segundos
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
}

function showSWStatus(message, type = 'info') {
  if (SW_CONFIG.debug) {
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    console.log(`${prefix} SW Status: ${message}`);
  }
}

// ============================================
// 🚀 FUNCIÓN PRINCIPAL
// ============================================

async function initializeServiceWorker() {
  try {
    console.log('🚀 Inicializando SW ultra-seguro...');
    
    // Verificar si podemos registrar
    if (!canRegisterSW()) {
      return;
    }
    
    // Paso 1: Limpiar completamente
    await cleanupOldServiceWorkers();
    
    // Paso 2: Esperar un poco más para asegurar limpieza
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Paso 3: Registrar SW nuevo y limpio
    const registration = await registerNewServiceWorker();
    
    console.log('🎉 SW ultra-seguro inicializado correctamente');
    
    return registration;
    
  } catch (error) {
    console.error('💥 Error fatal inicializando SW:', error);
    
    // En caso de error crítico, intentar limpieza total
    try {
      await cleanupOldServiceWorkers();
      console.log('🧹 Limpieza de emergencia completada');
    } catch (cleanupError) {
      console.error('💥 Error en limpieza de emergencia:', cleanupError);
    }
  }
}

// ============================================
// 🎯 AUTO-INICIALIZACIÓN
// ============================================

// Esperar a que la página esté lista
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeServiceWorker);
} else {
  // Si ya está cargada, ejecutar inmediatamente
  initializeServiceWorker();
}

// También exportar para uso manual si es necesario
window.ClubCaninoSW = {
  init: initializeServiceWorker,
  cleanup: cleanupOldServiceWorkers,
  register: registerNewServiceWorker
};