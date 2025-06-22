// public/sw-registration-fixed.js - Registro Corregido SIN conflictos

console.log('🔧 Registrando SW corregido para Club Canino...');

// ============================================
// 🛡️ VERIFICACIONES DE SEGURIDAD
// ============================================

function shouldEnableServiceWorker() {
  // No SW en desarrollo si hay problemas
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    console.log('🚧 Desarrollo detectado');
    
    // Solo habilitar si está en URL de parámetro
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('enable-sw')) {
      console.log('❌ SW deshabilitado en desarrollo (usa ?enable-sw=1 para habilitar)');
      return false;
    }
  }
  
  // Verificar soporte
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker no soportado');
    return false;
  }
  
  // Verificar si Supabase está funcionando
  if (window.location.pathname.includes('/dashboard/') || 
      window.location.pathname.includes('/login')) {
    console.log('⚠️ En zona crítica - SW en modo seguro');
    return 'safe-mode';
  }
  
  return true;
}

// ============================================
// 📝 REGISTRO SEGURO
// ============================================

async function registerServiceWorkerSafe() {
  const enableSW = shouldEnableServiceWorker();
  
  if (!enableSW) {
    console.log('🚫 Service Worker deshabilitado');
    return;
  }
  
  try {
    console.log('🔍 Verificando SW existente...');
    
    // Verificar registración existente
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    
    if (existingRegistration) {
      console.log('🔄 SW existente encontrado, verificando versión...');
      
      // Actualizar si es necesario
      await existingRegistration.update();
      
      // Verificar que no esté causando problemas
      if (await checkSWHealth(existingRegistration)) {
        console.log('✅ SW existente funcionando correctamente');
        return existingRegistration;
      } else {
        console.log('⚠️ SW existente problemático, re-registrando...');
        await existingRegistration.unregister();
      }
    }
    
    console.log('🆕 Registrando SW corregido...');
    
    const registration = await navigator.serviceWorker.register('/sw-fixed.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('✅ SW corregido registrado:', registration.scope);
    
    // Configurar listeners de eventos
    setupSWEventListeners(registration);
    
    return registration;
    
  } catch (error) {
    console.error('❌ Error registrando SW corregido:', error);
    
    // En caso de error, limpiar completamente
    console.log('🧹 Error crítico, limpiando SW...');
    await cleanupServiceWorkers();
  }
}

// ============================================
// 🔍 VERIFICACIÓN DE SALUD DEL SW
// ============================================

async function checkSWHealth(registration) {
  try {
    // Verificar que el SW esté activo
    if (!registration.active) {
      console.warn('⚠️ SW no activo');
      return false;
    }
    
    // Verificar que no esté interceptando APIs críticas
    const testUrl = '/api/test-sw-health';
    const response = await fetch(testUrl, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    // Si el SW interfiere, esto fallaría o daría respuesta cacheada
    if (response.headers.get('service-worker-intercepted')) {
      console.warn('⚠️ SW interceptando APIs críticas');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.warn('⚠️ Error verificando salud SW:', error);
    return false;
  }
}

// ============================================
// 📡 CONFIGURAR LISTENERS
// ============================================

function setupSWEventListeners(registration) {
  // Listener para actualizaciones
  registration.addEventListener('updatefound', () => {
    console.log('🔄 Actualización de SW encontrada');
    
    const newWorker = registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          console.log('🆕 Nueva versión disponible');
          showUpdateNotification();
        } else {
          console.log('✅ SW instalado por primera vez');
        }
      }
    });
  });
  
  // Listener para mensajes del SW
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, message } = event.data || {};
    
    switch (type) {
      case 'SW_ACTIVATED':
        console.log('✅ SW activado:', message);
        showSWStatus('Service Worker activo', 'success');
        break;
        
      case 'SW_ERROR':
        console.error('❌ Error en SW:', message);
        showSWStatus('Error en Service Worker', 'error');
        break;
        
      case 'CACHE_UPDATED':
        console.log('💾 Cache actualizado:', message);
        break;
        
      default:
        console.log('📢 Mensaje SW:', type, message);
    }
  });
  
  // Verificación periódica de salud (cada 2 minutos)
  setInterval(async () => {
    const isHealthy = await checkSWHealth(registration);
    if (!isHealthy) {
      console.warn('⚠️ SW no saludable, considerando reinicio...');
    }
  }, 120000);
}

// ============================================
// 🧹 LIMPIEZA DE EMERGENCIA
// ============================================

async function cleanupServiceWorkers() {
  try {
    console.log('🧹 Limpieza de emergencia de SW...');
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    await Promise.all(
      registrations.map(registration => {
        console.log('🗑️ Eliminando SW:', registration.scope);
        return registration.unregister();
      })
    );
    
    // Limpiar caches
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name.includes('club-canino'))
        .map(name => {
          console.log('🗑️ Eliminando cache:', name);
          return caches.delete(name);
        })
    );
    
    console.log('✅ Limpieza completada');
    
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
  }
}

// ============================================
// 🎨 NOTIFICACIONES VISUALES
// ============================================

function showSWStatus(message, type = 'info') {
  // Solo mostrar si estamos en modo debug
  if (!window.location.search.includes('debug=sw')) return;
  
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
    color: white; padding: 12px 16px; border-radius: 8px;
    font-size: 14px; z-index: 10000; max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 4000);
}

function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span>🆕 Nueva versión disponible</span>
      <button onclick="window.location.reload()" style="
        background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
        color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer;
      ">Actualizar</button>
    </div>
  `;
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: #F59E0B; color: white; padding: 12px 16px; border-radius: 8px;
    font-size: 14px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  document.body.appendChild(notification);
  
  // Auto-dismiss después de 10 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 10000);
}

// ============================================
// 🚀 INICIALIZACIÓN
// ============================================

// Registrar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerServiceWorkerSafe);
} else {
  registerServiceWorkerSafe();
}

// Exportar funciones para debugging manual
window.clubCaninoSW = {
  register: registerServiceWorkerSafe,
  cleanup: cleanupServiceWorkers,
  checkHealth: (reg) => checkSWHealth(reg || navigator.serviceWorker.controller),
  status: () => {
    console.log('📊 Estado del SW:', {
      supported: 'serviceWorker' in navigator,
      registered: !!navigator.serviceWorker.controller,
      scope: navigator.serviceWorker.controller?.scriptURL
    });
  }
};

console.log('🔧 Sistema de registro SW corregido inicializado');