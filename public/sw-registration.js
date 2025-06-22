// sw-registration.js - Registro Inteligente del Service Worker
console.log('🔍 Analizando dispositivo para Service Worker...');

// ============================================
// 🔍 DETECCIÓN DE DISPOSITIVO Y COMPATIBILIDAD
// ============================================

function detectDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  return {
    isMobile: /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
    isIOS: /iphone|ipad|ipod/i.test(userAgent),
    isAndroid: /android/i.test(userAgent),
    isChrome: /chrome/i.test(userAgent) && !/edg/i.test(userAgent),
    isSafari: /safari/i.test(userAgent) && !/chrome/i.test(userAgent),
    isFirefox: /firefox/i.test(userAgent),
    isEdge: /edg/i.test(userAgent)
  };
}

function getIOSVersion() {
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  if (match) {
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3] || '0', 10)
    };
  }
  return null;
}

function shouldEnableServiceWorker() {
  // Verificar soporte básico
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker no soportado');
    return false;
  }
  
  const device = detectDevice();
  
  // ✅ DESKTOP - Siempre habilitado (excepto Safari muy viejo)
  if (!device.isMobile) {
    console.log('💻 Desktop detectado - SW habilitado');
    return true;
  }
  
  // 📱 MÓVILES - Verificaciones específicas
  console.log('📱 Móvil detectado:', device);
  
  // iOS Safari - Solo versiones recientes y estables
  if (device.isIOS) {
    const iosVersion = getIOSVersion();
    
    if (!iosVersion || iosVersion.major < 11) {
      console.log('❌ iOS muy antigua para SW');
      return false;
    }
    
    if (iosVersion.major >= 14) {
      console.log('✅ iOS moderna - SW habilitado');
      return true;
    }
    
    console.log('⚠️ iOS intermedia - SW básico');
    return 'basic'; // SW simplificado
  }
  
  // Android Chrome - Generalmente compatible
  if (device.isAndroid && device.isChrome) {
    console.log('✅ Android Chrome - SW habilitado');
    return true;
  }
  
  // Android otros navegadores - más cauteloso
  if (device.isAndroid) {
    console.log('⚠️ Android no-Chrome - SW básico');
    return 'basic';
  }
  
  // Otros móviles - deshabilitar por seguridad
  console.log('❌ Móvil no compatible - SW deshabilitado');
  return false;
}

// ============================================
// 📝 REGISTRO CONDICIONAL
// ============================================

async function registerServiceWorker() {
  const enableSW = shouldEnableServiceWorker();
  
  if (!enableSW) {
    console.log('🚫 Service Worker deshabilitado para este dispositivo');
    return;
  }
  
  try {
    // Verificar si ya hay un SW registrado
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    
    if (existingRegistration) {
      console.log('🔄 SW existente encontrado, verificando actualización...');
      
      // Forzar actualización si es necesario
      await existingRegistration.update();
      
      // Verificar si hay un SW esperando
      if (existingRegistration.waiting) {
        console.log('⏳ SW actualizado esperando, activando...');
        existingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } else {
      console.log('🆕 Registrando nuevo Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Siempre verificar actualizaciones
      });
      
      console.log('✅ Service Worker registrado:', registration.scope);
      
      // Manejar actualizaciones
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Actualización de SW encontrada');
        
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('🆕 Nueva versión de SW disponible');
              notifyUserOfUpdate();
            } else {
              console.log('✅ SW instalado por primera vez');
            }
          }
        });
      });
    }
    
    // Escuchar mensajes del SW
    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    
    // Verificar estado del SW cada 30 segundos
    setInterval(checkSWHealth, 30000);
    
  } catch (error) {
    console.error('❌ Error registrando Service Worker:', error);
    
    // Si falla, intentar limpiar y re-registrar
    if (error.name === 'SecurityError' || error.name === 'TypeError') {
      console.log('🧹 Error crítico, limpiando SW...');
      await cleanupServiceWorker();
    }
  }
}

// ============================================
// 🧹 LIMPIEZA Y MANTENIMIENTO
// ============================================

async function cleanupServiceWorker() {
  try {
    console.log('🧹 Limpiando Service Workers...');
    
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
    
    // Recargar página después de limpieza
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
  }
}

async function checkSWHealth() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      console.warn('⚠️ SW perdido, re-registrando...');
      await registerServiceWorker();
      return;
    }
    
    if (!registration.active) {
      console.warn('⚠️ SW inactivo, reactivando...');
      await registration.update();
    }
    
  } catch (error) {
    console.warn('⚠️ Error verificando salud del SW:', error);
  }
}

// ============================================
// 📬 MANEJO DE MENSAJES
// ============================================

function handleSWMessage(event) {
  const { type, message } = event.data;
  
  switch (type) {
    case 'SW_ACTIVATED':
      console.log('✅ SW activado:', message);
      showSWStatus('Service Worker activo', 'success');
      break;
      
    case 'SYNC_COMPLETE':
      console.log('🔄 Sincronización completada:', message);
      break;
      
    case 'CACHE_ERROR':
      console.warn('⚠️ Error de cache:', message);
      break;
      
    case 'SKIP_WAITING':
      window.location.reload();
      break;
      
    default:
      console.log('📨 Mensaje SW:', type, message);
  }
}

function notifyUserOfUpdate() {
  // Mostrar notificación discreta de actualización
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="
      position: fixed; top: 20px; right: 20px; 
      background: #56CCF2; color: white; 
      padding: 12px 20px; border-radius: 8px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000; font-family: system-ui, sans-serif;
      max-width: 300px;
    ">
      <div style="font-weight: 600; margin-bottom: 4px;">
        🆕 Actualización disponible
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        Nueva versión de Club Canino lista
      </div>
      <button onclick="window.location.reload()" style="
        background: white; color: #56CCF2; border: none;
        padding: 6px 12px; border-radius: 4px; margin-top: 8px;
        cursor: pointer; font-weight: 600;
      ">
        Actualizar
      </button>
      <button onclick="this.parentElement.remove()" style="
        background: transparent; color: white; border: none;
        padding: 6px 8px; cursor: pointer; float: right;
        margin-top: 8px;
      ">
        ×
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remover después de 10 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 10000);
}

function showSWStatus(message, type = 'info') {
  console.log(`${type === 'success' ? '✅' : 'ℹ️'} ${message}`);
  
  // Mostrar en DevTools y opcionalmente en UI
  if (window.location.search.includes('debug=sw')) {
    const status = document.createElement('div');
    status.textContent = message;
    status.style.cssText = `
      position: fixed; bottom: 20px; left: 20px;
      background: ${type === 'success' ? '#10B981' : '#3B82F6'};
      color: white; padding: 8px 12px; border-radius: 4px;
      font-size: 12px; z-index: 10000;
    `;
    document.body.appendChild(status);
    
    setTimeout(() => {
      if (status.parentNode) {
        status.parentNode.removeChild(status);
      }
    }, 3000);
  }
}

// ============================================
// 🚀 INICIALIZACIÓN
// ============================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerServiceWorker);
} else {
  registerServiceWorker();
}

// Exportar funciones para uso manual si es necesario
window.clubCaninoSW = {
  register: registerServiceWorker,
  cleanup: cleanupServiceWorker,
  checkHealth: checkSWHealth,
  getInfo: () => detectDevice()
};

console.log('🔧 Sistema de registro de SW inicializado');