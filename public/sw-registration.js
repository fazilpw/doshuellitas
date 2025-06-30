// public/sw-registration.js - REGISTRO INTELIGENTE DE SERVICE WORKER
// 🎯 Evita problemas en PWA instalada y garantiza funcionamiento correcto

console.log('🔧 Club Canino: Iniciando registro inteligente de SW...');

// ============================================
// 📱 DETECCIÓN DE CONTEXTO
// ============================================

const PWA_CONTEXT = {
  isStandalone: false,
  isIOSPWA: false,
  isMobile: false,
  isInstalled: false,
  isFirstLaunch: false,
  shouldRegisterSW: false
};

function detectPWAContext() {
  // Detectar si está en modo standalone (PWA instalada)
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    PWA_CONTEXT.isStandalone = true;
    PWA_CONTEXT.isInstalled = true;
    console.log('📱 Detectado: PWA en modo standalone');
  }
  
  // Detectar iOS PWA
  if (window.navigator && window.navigator.standalone) {
    PWA_CONTEXT.isIOSPWA = true;
    PWA_CONTEXT.isInstalled = true;
    console.log('🍎 Detectado: PWA en iOS');
  }
  
  // Detectar dispositivo móvil
  PWA_CONTEXT.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Detectar si es el primer lanzamiento de la PWA
  PWA_CONTEXT.isFirstLaunch = !localStorage.getItem('club-canino-pwa-launched');
  
  // Decidir si registrar SW
  PWA_CONTEXT.shouldRegisterSW = determineIfShouldRegisterSW();
  
  console.log('📊 Contexto PWA detectado:', PWA_CONTEXT);
  return PWA_CONTEXT;
}

function determineIfShouldRegisterSW() {
  // En desarrollo, solo si se especifica explícitamente
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('sw') || urlParams.has('service-worker')) {
      console.log('🧪 SW habilitado en desarrollo por parámetro');
      return true;
    }
    console.log('🚧 SW deshabilitado en desarrollo');
    return false;
  }
  
  // En PWA instalada y es primera vez: NO registrar SW todavía
  if (PWA_CONTEXT.isInstalled && PWA_CONTEXT.isFirstLaunch) {
    console.log('🆕 Primera vez en PWA instalada - SW diferido');
    return false;
  }
  
  // En PWA instalada después del primer lanzamiento: SÍ registrar
  if (PWA_CONTEXT.isInstalled && !PWA_CONTEXT.isFirstLaunch) {
    console.log('✅ PWA instalada establecida - SW permitido');
    return true;
  }
  
  // En navegador normal: SÍ registrar
  if (!PWA_CONTEXT.isInstalled) {
    console.log('🌐 Navegador normal - SW permitido');
    return true;
  }
  
  return false;
}

// ============================================
// 🧹 LIMPIEZA PREVENTIVA
// ============================================

async function cleanupOldServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  
  try {
    console.log('🧹 Verificando Service Workers existentes...');
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      console.log('✅ No hay Service Workers existentes');
      return;
    }
    
    console.log(`🔍 Encontrados ${registrations.length} Service Workers`);
    
    // Si estamos en PWA instalada por primera vez, limpiar todos los SW
    if (PWA_CONTEXT.isInstalled && PWA_CONTEXT.isFirstLaunch) {
      console.log('🚑 Primera vez en PWA - Limpiando todos los SW...');
      
      const cleanupPromises = registrations.map(async (registration) => {
        try {
          const result = await registration.unregister();
          console.log('🗑️ SW eliminado (primera vez PWA):', registration.scope);
          return result;
        } catch (error) {
          console.warn('⚠️ Error eliminando SW:', error);
          return false;
        }
      });
      
      await Promise.all(cleanupPromises);
      console.log('✅ Limpieza de primera vez completada');
      
      // Marcar que ya no es primera vez
      localStorage.setItem('club-canino-pwa-launched', 'true');
      localStorage.setItem('club-canino-pwa-first-clean', new Date().toISOString());
      
      return;
    }
    
    // Si hay múltiples SW, limpiar los antiguos
    if (registrations.length > 1) {
      console.log('⚠️ Múltiples SW detectados - Limpiando antiguos...');
      
      // Mantener solo el más reciente
      const sortedRegistrations = registrations.sort((a, b) => {
        // Si no podemos determinar cuál es más nuevo, mantener el primero
        return 0;
      });
      
      const toRemove = sortedRegistrations.slice(1); // Todos excepto el primero
      
      const cleanupPromises = toRemove.map(async (registration) => {
        try {
          await registration.unregister();
          console.log('🗑️ SW duplicado eliminado:', registration.scope);
          return true;
        } catch (error) {
          console.warn('⚠️ Error eliminando SW duplicado:', error);
          return false;
        }
      });
      
      await Promise.all(cleanupPromises);
    }
    
  } catch (error) {
    console.error('❌ Error durante limpieza de SW:', error);
  }
}

// ============================================
// 🚀 REGISTRO INTELIGENTE
// ============================================

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker no soportado');
    return;
  }
  
  if (!PWA_CONTEXT.shouldRegisterSW) {
    console.log('🚫 Registro de SW omitido según contexto');
    return;
  }
  
  try {
    console.log('🆕 Registrando Service Worker v2.0.0...');
    
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('✅ SW registrado exitosamente:', registration.scope);
    
    // Configurar listeners para el SW
    setupServiceWorkerListeners(registration);
    
    // Verificar si necesita actualización
    checkForSWUpdate(registration);
    
    return registration;
    
  } catch (error) {
    console.error('❌ Error registrando SW:', error);
    
    // En PWA instalada, si falla el SW, no es crítico
    if (PWA_CONTEXT.isInstalled) {
      console.log('💡 Error de SW en PWA instalada - Continuando sin SW');
      return null;
    }
    
    throw error;
  }
}

// ============================================
// 🔄 LISTENERS DEL SERVICE WORKER
// ============================================

function setupServiceWorkerListeners(registration) {
  // Escuchar mensajes del SW
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, data } = event.data || {};
    
    switch (type) {
      case 'SW_ACTIVATED':
        console.log('📡 SW activado:', data);
        // Actualizar UI si es necesario
        updateSWStatus('active', data.version);
        break;
        
      case 'SW_ERROR':
        console.error('❌ Error del SW:', data);
        // Manejar error del SW
        handleSWError(data);
        break;
        
      default:
        console.log('📨 Mensaje del SW:', type, data);
    }
  });
  
  // Escuchar cambios de estado
  registration.addEventListener('updatefound', () => {
    console.log('🔄 Nueva versión del SW encontrada');
    
    const newWorker = registration.installing;
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        console.log('🔄 Estado del SW:', newWorker.state);
        
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nueva versión disponible
          console.log('🆕 Nueva versión del SW lista');
          promptForSWUpdate();
        }
      });
    }
  });
}

// ============================================
// 🔄 GESTIÓN DE ACTUALIZACIONES
// ============================================

function checkForSWUpdate(registration) {
  // Verificar actualizaciones cada 30 minutos en PWA instalada
  if (PWA_CONTEXT.isInstalled) {
    setInterval(() => {
      console.log('🔍 Verificando actualizaciones del SW...');
      registration.update().catch(error => {
        console.warn('⚠️ Error verificando actualizaciones:', error);
      });
    }, 30 * 60 * 1000); // 30 minutos
  }
}

function promptForSWUpdate() {
  // En PWA instalada, mostrar notificación discreta
  if (PWA_CONTEXT.isInstalled) {
    showSWUpdateNotification();
  } else {
    // En navegador, mostrar prompt más visible
    showSWUpdatePrompt();
  }
}

function showSWUpdateNotification() {
  console.log('🔔 Mostrando notificación de actualización SW (PWA)');
  
  // Crear notificación discreta en la esquina
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #56CCF2;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  `;
  
  notification.innerHTML = '🔄 Actualización disponible - Toca para aplicar';
  
  notification.onclick = () => {
    applySWUpdate();
    document.body.removeChild(notification);
  };
  
  document.body.appendChild(notification);
  
  // Auto-hide después de 10 segundos
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, 10000);
}

function showSWUpdatePrompt() {
  console.log('🔔 Mostrando prompt de actualización SW (navegador)');
  
  const shouldUpdate = confirm(
    '🔄 Nueva versión disponible\n\n' +
    'Se ha descargado una actualización de Club Canino.\n' +
    '¿Quieres aplicarla ahora?'
  );
  
  if (shouldUpdate) {
    applySWUpdate();
  }
}

function applySWUpdate() {
  console.log('🔄 Aplicando actualización del SW...');
  
  // Enviar mensaje al SW para que se active
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
  
  // Recargar la página después de un momento
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// ============================================
// 📊 UTILIDADES DE ESTADO
// ============================================

function updateSWStatus(status, version) {
  // Actualizar indicador visual si existe
  const statusElement = document.getElementById('sw-status');
  if (statusElement) {
    switch (status) {
      case 'active':
        statusElement.textContent = '✅ Activo';
        statusElement.className = 'text-green-600 font-semibold';
        break;
      case 'error':
        statusElement.textContent = '❌ Error';
        statusElement.className = 'text-red-600 font-semibold';
        break;
      default:
        statusElement.textContent = '🔧 Cargando...';
        statusElement.className = 'text-blue-600 font-semibold';
    }
  }
  
  // Guardar estado en localStorage
  localStorage.setItem('club-canino-sw-status', JSON.stringify({
    status,
    version,
    timestamp: new Date().toISOString()
  }));
}

function handleSWError(error) {
  console.error('🚨 Error crítico del SW:', error);
  updateSWStatus('error');
  
  // En PWA instalada, intentar recuperación automática
  if (PWA_CONTEXT.isInstalled) {
    console.log('🔧 Intentando recuperación automática en PWA...');
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }
}

// ============================================
// 🚀 INICIALIZACIÓN PRINCIPAL
// ============================================

async function initializePWAServiceWorker() {
  console.log('🚀 Inicializando PWA Service Worker...');
  
  try {
    // 1. Detectar contexto
    detectPWAContext();
    
    // 2. Limpiar SW antiguos si es necesario
    await cleanupOldServiceWorkers();
    
    // 3. Registrar SW si procede
    if (PWA_CONTEXT.shouldRegisterSW) {
      await registerServiceWorker();
      console.log('✅ Service Worker inicializado correctamente');
    } else {
      console.log('ℹ️ Service Worker omitido - App funcionará sin SW');
    }
    
    // 4. Marcar como lanzado si es primera vez
    if (PWA_CONTEXT.isFirstLaunch) {
      localStorage.setItem('club-canino-pwa-launched', 'true');
      localStorage.setItem('club-canino-pwa-launch-time', new Date().toISOString());
    }
    
  } catch (error) {
    console.error('❌ Error inicializando PWA SW:', error);
    
    // No fallar la app por problemas de SW
    console.log('💡 Continuando sin Service Worker...');
  }
}

// ============================================
// 🎯 EJECUTAR AL CARGAR
// ============================================

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePWAServiceWorker);
} else {
  initializePWAServiceWorker();
}

// También ejecutar en window.load como fallback
window.addEventListener('load', () => {
  console.log('🏁 Window load - Verificando estado del SW...');
  
  // Verificar que el SW esté funcionando correctamente
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    console.log('✅ Service Worker activo y controlando la página');
  } else if (PWA_CONTEXT.shouldRegisterSW) {
    console.warn('⚠️ Service Worker debería estar activo pero no lo está');
  }
});

console.log('🔧 SW Registration script cargado - Esperando inicialización...');