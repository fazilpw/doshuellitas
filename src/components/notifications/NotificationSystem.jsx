// src/components/notifications/NotificationSystem.jsx - SISTEMA COMPLETO DE NOTIFICACIONES
// 🔔 FASE 1: SERVICE WORKER HABILITADO + VAPID KEYS REALES

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const NotificationSystem = ({ userId, dogs = [] }) => {
  const [permission, setPermission] = useState('default');
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [swStatus, setSWStatus] = useState('checking');
  const [vapidKey, setVapidKey] = useState(null);

  useEffect(() => {
    // Verificar permisos existentes
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    
    // Cargar preferencias de usuario
    loadUserPreferences();
    
    // Registrar service worker - AHORA HABILITADO
    registerServiceWorker();
    
    // Obtener VAPID key del entorno
    initializeVapidKey();
  }, [userId]);

  // ============================================
  // 🔑 INICIALIZAR VAPID KEY REAL
  // ============================================
  const initializeVapidKey = () => {
    // Intentar obtener la VAPID key real del entorno
    const envVapidKey = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY;
    
    if (envVapidKey && envVapidKey !== 'your_vapid_public_key_here') {
      setVapidKey(envVapidKey);
      console.log('✅ VAPID key real cargada desde entorno');
    } else {
      // Fallback: usar key de desarrollo (no funcionará en producción)
      setVapidKey('BJqPZ7FY8nNgJYw8kQ1m6F4Q0VWz5rKh9KjKnTXrJwDgA2VmKjLo3PmNzRtYuIpL6QxBvCdE2HsJt8KlMnOpQr4');
      console.warn('⚠️ Usando VAPID key de desarrollo. Configura PUBLIC_VAPID_PUBLIC_KEY en producción');
    }
  };

  // ============================================
  // 📡 SERVICE WORKER - AHORA HABILITADO
  // ============================================
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        setSWStatus('registering');
        console.log('📡 Registrando Service Worker para notificaciones...');
        
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado:', registration);
        
        setSWStatus('registered');
        
        // Esperar a que esté listo
        await navigator.serviceWorker.ready;
        setSWStatus('ready');
        
        console.log('🚀 Service Worker listo para push notifications');
        
      } catch (error) {
        console.error('❌ Error registrando Service Worker:', error);
        setSWStatus('error');
      }
    } else {
      console.warn('⚠️ Service Worker o Push Manager no soportados');
      setSWStatus('not-supported');
    }
  };

  const loadUserPreferences = async () => {
    if (!userId || dogs.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Convertir array a objeto para fácil acceso
      const prefsMap = {};
      data.forEach(pref => {
        prefsMap[pref.dog_id] = pref;
      });
      
      setPreferences(prefsMap);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // ============================================
  // 🔔 SOLICITAR PERMISOS
  // ============================================
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('❌ Tu navegador no soporta notificaciones');
      return;
    }

    setLoading(true);
    
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        console.log('✅ Permisos de notificación concedidos');
        
        // Suscribir a push notifications
        await subscribeToPush();
        
        // Mostrar notificación de prueba local
        showLocalTestNotification();
        
      } else if (permission === 'denied') {
        alert('❌ Notificaciones bloqueadas. Ve a configuración del navegador para habilitarlas.');
      }
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 📝 SUSCRIPCIÓN A PUSH NOTIFICATIONS
  // ============================================
  const subscribeToPush = async () => {
    if (!vapidKey) {
      console.error('❌ VAPID key no disponible');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Verificar si ya existe una suscripción
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('🔔 Creando nueva suscripción push...');
        
        const subscriptionOptions = {
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        };
        
        subscription = await registration.pushManager.subscribe(subscriptionOptions);
      }
      
      // Enviar suscripción al servidor
      await sendSubscriptionToServer(subscription);
      
      console.log('✅ Suscripción push exitosa');
      
    } catch (error) {
      console.error('❌ Error en suscripción push:', error);
      
      if (error.name === 'NotSupportedError') {
        alert('❌ Push notifications no soportadas en este navegador');
      } else if (error.name === 'NotAllowedError') {
        alert('❌ Permisos denegados para notificaciones');
      } else {
        alert('❌ Error técnico en notificaciones. Intenta de nuevo.');
      }
    }
  };

  // ============================================
  // 🌐 COMUNICACIÓN CON SERVIDOR
  // ============================================
  const sendSubscriptionToServer = async (subscription) => {
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId,
          userRole: 'padre', // o detectar rol actual
          deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            vapidKey: vapidKey?.substring(0, 20) + '...' // Log parcial por seguridad
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error enviando suscripción');
      }

      const result = await response.json();
      console.log('✅ Suscripción enviada al servidor:', result.message);
      
    } catch (error) {
      console.error('❌ Error enviando suscripción:', error);
      // No fallar completamente, las notificaciones locales aún funcionan
    }
  };

  // ============================================
  // 🧪 NOTIFICACIONES DE PRUEBA
  // ============================================
  const showLocalTestNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('🐕 Club Canino Dos Huellitas', {
        body: '¡Notificaciones activadas! Te mantendremos informado sobre tu mascota.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'welcome-local',
        vibrate: [100, 50, 100]
      });
    }
  };

  const sendTestPushNotification = async () => {
    if (!userId) {
      alert('⚠️ Debes estar logueado para probar notificaciones push');
      return;
    }

    setTestNotificationSent(true);
    
    try {
      const response = await fetch('/api/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('🧪 Notificación de prueba enviada:', result.notification);
        
        // Mostrar feedback visual
        setTimeout(() => {
          alert(`✅ Notificación enviada: "${result.notification.title}"`);
        }, 1000);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Error enviando notificación de prueba:', error);
      alert('❌ Error enviando notificación de prueba. Verifica la consola.');
    } finally {
      setTimeout(() => setTestNotificationSent(false), 3000);
    }
  };

  // ============================================
  // 🛠️ UTILIDADES
  // ============================================
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'text-green-600';
      case 'registered': return 'text-blue-600';
      case 'registering': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'not-supported': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready': return '✅ Listo';
      case 'registered': return '📡 Registrado';
      case 'registering': return '🔄 Registrando...';
      case 'error': return '❌ Error';
      case 'not-supported': return '❌ No soportado';
      default: return '🔍 Verificando...';
    }
  };

  // ============================================
  // 🎨 RENDER
  // ============================================
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#2C3E50]">🔔 Notificaciones</h3>
          <p className="text-gray-600 text-sm">Mantente informado sobre tu mascota</p>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${getStatusColor(swStatus)}`}>
            Service Worker: {getStatusText(swStatus)}
          </div>
          <div className={`text-sm ${permission === 'granted' ? 'text-green-600' : permission === 'denied' ? 'text-red-600' : 'text-gray-500'}`}>
            Permisos: {permission === 'granted' ? '✅ Activados' : permission === 'denied' ? '❌ Bloqueados' : '⏳ Pendientes'}
          </div>
        </div>
      </div>

      {/* Estado de la funcionalidad */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-bold text-blue-900 mb-2">📊 Estado del Sistema</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">VAPID Key:</span>
            <span className={`ml-2 ${vapidKey ? 'text-green-600' : 'text-red-600'}`}>
              {vapidKey ? '✅ Configurada' : '❌ Faltante'}
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Navegador:</span>
            <span className={`ml-2 ${'Notification' in window ? 'text-green-600' : 'text-red-600'}`}>
              {'Notification' in window ? '✅ Compatible' : '❌ No compatible'}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="space-y-4">
        {permission === 'default' && (
          <button
            onClick={requestNotificationPermission}
            disabled={loading || swStatus === 'error'}
            className="w-full bg-[#56CCF2] text-white py-3 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Activando...' : '🔔 Activar Notificaciones'}
          </button>
        )}

        {permission === 'granted' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={showLocalTestNotification}
              className="bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 transition-colors font-medium"
            >
              🧪 Prueba Local
            </button>
            <button
              onClick={sendTestPushNotification}
              disabled={testNotificationSent || swStatus !== 'ready'}
              className="bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors font-medium disabled:opacity-50"
            >
              {testNotificationSent ? '📤 Enviando...' : '🚀 Prueba Push'}
            </button>
          </div>
        )}

        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm font-medium mb-2">
              ❌ Notificaciones bloqueadas
            </p>
            <p className="text-red-600 text-sm">
              Ve a configuración del navegador → Privacidad → Notificaciones → Permitir para este sitio
            </p>
          </div>
        )}
      </div>

      {/* Información educativa */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <h4 className="font-bold text-yellow-900 mb-2">💡 ¿Cómo funcionan?</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• <strong>Locales:</strong> Aparecen inmediatamente en tu dispositivo</li>
          <li>• <strong>Push:</strong> Te llegan aunque cierres la app</li>
          <li>• <strong>Programadas:</strong> Para recordatorios de vacunas y rutinas</li>
          <li>• <strong>En tiempo real:</strong> Cuando el transporte esté cerca</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationSystem;