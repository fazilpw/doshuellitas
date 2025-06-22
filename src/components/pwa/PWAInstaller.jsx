// src/components/pwa/PWAInstaller.jsx - Sistema de Instalación Avanzado
import { useState, useEffect } from 'react';

const PWAInstaller = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPromptShown, setInstallPromptShown] = useState(false);
  const [deviceType, setDeviceType] = useState('unknown');
  const [browserType, setBrowserType] = useState('unknown');
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    detectDevice();
    detectBrowser();
    checkInstallationStatus();
    setupEventListeners();
  }, []);

  // ============================================
  // 🔍 DETECCIÓN DE DISPOSITIVO Y NAVEGADOR
  // ============================================
  function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/windows/.test(userAgent)) {
      setDeviceType('windows');
    } else if (/mac/.test(userAgent)) {
      setDeviceType('mac');
    } else {
      setDeviceType('desktop');
    }
  }

  function detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      setBrowserType('chrome');
    } else if (userAgent.includes('firefox')) {
      setBrowserType('firefox');
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      setBrowserType('safari');
    } else if (userAgent.includes('edg')) {
      setBrowserType('edge');
    } else {
      setBrowserType('other');
    }
  }

  // ============================================
  // 📱 VERIFICACIÓN DE ESTADO DE INSTALACIÓN
  // ============================================
  function checkInstallationStatus() {
    // Verificar si ya está instalada (modo standalone)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Verificar si está ejecutándose como PWA
    if (window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Verificar localStorage para estado de instalación
    const installedBefore = localStorage.getItem('club-canino-pwa-installed');
    if (installedBefore === 'true') {
      setIsInstalled(true);
    }
  }

  // ============================================
  // 🎯 EVENT LISTENERS
  // ============================================
  function setupEventListeners() {
    // Evento beforeinstallprompt (Android/Chrome)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Evento appinstalled
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }

  function handleBeforeInstallPrompt(e) {
    console.log('📱 PWA instalable detectada');
    e.preventDefault();
    setDeferredPrompt(e);
    setIsInstallable(true);
    
    // Mostrar prompt automático después de 15 segundos de interacción
    setTimeout(() => {
      if (!installPromptShown && !isInstalled) {
        showAutoInstallPrompt();
      }
    }, 15000);
  }

  function handleAppInstalled() {
    console.log('✅ PWA instalada exitosamente');
    setIsInstalled(true);
    setIsInstallable(false);
    setDeferredPrompt(null);
    localStorage.setItem('club-canino-pwa-installed', 'true');
    
    showSuccessMessage();
  }

  // ============================================
  // 🚀 INSTALACIÓN AUTOMÁTICA
  // ============================================
  async function showAutoInstallPrompt() {
    if (installPromptShown || isInstalled) return;
    
    setInstallPromptShown(true);
    
    const shouldInstall = confirm(
      `🐕 ¡Convierte Club Canino en una app!\n\n` +
      `✅ Acceso más rápido desde tu pantalla de inicio\n` +
      `✅ Funciona sin conexión a internet\n` +
      `✅ Notificaciones push en tiempo real\n` +
      `✅ Experiencia como app nativa\n\n` +
      `¿Quieres instalar Club Canino ahora?`
    );
    
    if (shouldInstall) {
      await installPWA();
    } else {
      // Preguntar de nuevo en una semana
      localStorage.setItem('club-canino-install-declined', Date.now().toString());
    }
  }

  async function installPWA() {
    if (!deferredPrompt) {
      setShowManualInstructions(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`🎯 Resultado instalación: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('✅ Usuario aceptó instalar la PWA');
      } else {
        console.log('❌ Usuario rechazó instalar la PWA');
        localStorage.setItem('club-canino-install-declined', Date.now().toString());
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      
    } catch (error) {
      console.error('❌ Error durante instalación:', error);
      setShowManualInstructions(true);
    }
  }

  // ============================================
  // 📱 INSTRUCCIONES MANUALES POR DISPOSITIVO
  // ============================================
  function getManualInstructions() {
    const instructions = {
      ios: {
        icon: '🍎',
        title: 'Instalar en iPhone/iPad',
        steps: [
          'Toca el botón "Compartir" ⬆️ en Safari',
          'Selecciona "Agregar a pantalla de inicio"',
          'Toca "Agregar" en la esquina superior derecha',
          '¡Listo! Busca el ícono en tu pantalla de inicio'
        ]
      },
      android: {
        icon: '🤖',
        title: 'Instalar en Android',
        steps: [
          'Toca el menú de Chrome (⋮) en la esquina superior',
          'Selecciona "Agregar a pantalla de inicio"',
          'Toca "Agregar" en el diálogo que aparece',
          '¡Listo! La app aparecerá en tu launcher'
        ]
      },
      desktop: {
        icon: '💻',
        title: 'Instalar en Escritorio',
        steps: [
          'Busca el ícono de instalación (⬇️) en la barra de direcciones',
          'Haz clic en "Instalar Club Canino"',
          'Confirma la instalación en el diálogo',
          '¡Listo! La app aparecerá en tu escritorio y menú'
        ]
      }
    };

    return instructions[deviceType] || instructions.desktop;
  }

  // ============================================
  // 🎉 MENSAJES DE ÉXITO
  // ============================================
  function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl p-6 max-w-sm w-full text-center animate-bounce">
          <div class="text-6xl mb-4">🎉</div>
          <h3 class="text-xl font-bold text-green-600 mb-2">
            ¡App Instalada!
          </h3>
          <p class="text-gray-600 mb-4">
            Club Canino ya está en tu dispositivo. Búscala en tu pantalla de inicio.
          </p>
          <button onclick="this.parentElement.parentElement.remove()" 
                  class="bg-green-500 text-white px-6 py-2 rounded-lg font-medium">
            ¡Genial!
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 5000);
  }

  // ============================================
  // 🎨 RENDER COMPONENT
  // ============================================
  
  // Si ya está instalada, mostrar mensaje de éxito
  if (isInstalled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
        <div className="flex items-center">
          <span className="text-green-600 text-2xl mr-3">✅</span>
          <div>
            <h4 className="font-bold text-green-800">¡App Instalada!</h4>
            <p className="text-green-700 text-sm">
              Club Canino está funcionando como aplicación nativa
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Modal de instrucciones manuales
  if (showManualInstructions) {
    const instructions = getManualInstructions();
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <div className="text-center mb-4">
            <span className="text-4xl">{instructions.icon}</span>
            <h3 className="text-xl font-bold text-[#2C3E50] mt-2">
              {instructions.title}
            </h3>
          </div>
          
          <div className="space-y-3 mb-6">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-start">
                <span className="bg-[#56CCF2] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-gray-700">{step}</span>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowManualInstructions(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg"
            >
              Cerrar
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-[#56CCF2] text-white py-2 px-4 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Banner de instalación
  if (isInstallable && !installPromptShown) {
    return (
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white rounded-xl p-4 mb-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📱</span>
            <div>
              <h4 className="font-bold">¡Instala la App!</h4>
              <p className="text-sm opacity-90">
                Acceso rápido y notificaciones
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={installPWA}
              className="bg-white text-[#56CCF2] px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100"
            >
              Instalar
            </button>
            <button
              onClick={() => setInstallPromptShown(true)}
              className="text-white opacity-75 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Botón de instalación manual para casos especiales
  if (browserType === 'safari' || browserType === 'firefox') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-blue-600 text-xl mr-3">💡</span>
            <div>
              <h4 className="font-medium text-blue-800">Instalar App</h4>
              <p className="text-blue-600 text-sm">
                Agrega Club Canino a tu pantalla de inicio
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowManualInstructions(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            Ver cómo
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstaller;