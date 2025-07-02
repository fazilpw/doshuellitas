// src/components/notifications/RealPushNotifications.jsx
// 📱 VERSIÓN CORREGIDA PARA EL ESQUEMA EXISTENTE

import { useState, useEffect, useRef } from 'react';
import supabase from '../../lib/supabase.js';

const RealPushNotifications = ({ userId, userRole, dogs = [] }) => {
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swReady, setSWReady] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [lastNotificationSent, setLastNotificationSent] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  
  const initializationRef = useRef(false);
  const swRegistrationRef = useRef(null);

  // VAPID Public Key
  const vapidPublicKey = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY || 
    'BJqPZ7FY8nNgJYw8kQ1m6F4Q0VWz5rKh9KjKnTXrJwDgA2VmKjLo3PmNzRtYuIpL6QxBvCdE2HsJt8KlMnOpQr4';

  // ============================================
  // 🚀 INICIALIZACIÓN
  // ============================================
  useEffect(() => {
    if (!initializationRef.current && userId) {
      initializationRef.current = true;
      initializeRealPushNotifications();
    }
  }, [userId]);

  const initializeRealPushNotifications = async () => {
    addDebugInfo('🚀 Inicializando push notifications reales...');
    
    try {
      if (!checkPushSupport()) return;
      detectDeviceInfo();
      updatePermissionState();
      await initializeServiceWorker();
      await checkExistingSubscription();
      addDebugInfo('✅ Inicialización completada');
    } catch (error) {
      console.error('❌ Error inicializando push notifications:', error);
      addDebugInfo(`❌ Error: ${error.message}`);
    }
  };

  const checkPushSupport = () => {
    const checks = {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window,
      promises: 'Promise' in window
    };
    
    const supported = Object.values(checks).every(Boolean);
    addDebugInfo(`📱 Soporte: ${Object.entries(checks).map(([key, value]) => 
      `${key}: ${value ? '✅' : '❌'}`).join(', ')}`);
    
    if (!supported) {
      addDebugInfo('❌ Push notifications no soportadas en este dispositivo');
      return false;
    }
    return true;
  };

  const detectDeviceInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isAndroid: /Android/.test(navigator.userAgent),
      isChrome: /Chrome/.test(navigator.userAgent),
      isFirefox: /Firefox/.test(navigator.userAgent),
      isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    };
    
    setDeviceInfo(info);
    addDebugInfo(`📱 Dispositivo: ${info.isMobile ? 'Móvil' : 'Desktop'} - ${info.isIOS ? 'iOS' : info.isAndroid ? 'Android' : 'Otro'}`);
    return info;
  };

  const initializeServiceWorker = async () => {
    addDebugInfo('📡 Inicializando Service Worker...');
    
    try {
      let registration = await navigator.serviceWorker.getRegistration('/');
      
      if (!registration) {
        addDebugInfo('📡 Registrando nuevo Service Worker...');
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
      }
      
      await navigator.serviceWorker.ready;
      swRegistrationRef.current = registration;
      setSWReady(true);
      addDebugInfo('✅ Service Worker listo');
      setupServiceWorkerListeners(registration);
      return registration;
    } catch (error) {
      addDebugInfo(`❌ Error SW: ${error.message}`);
      throw error;
    }
  };

  const setupServiceWorkerListeners = (registration) => {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data || {};
      
      switch (type) {
        case 'SW_ACTIVATED':
          addDebugInfo(`📡 SW activado: v${data.version}`);
          break;
        case 'NOTIFICATION_CLICKED':
          addDebugInfo('👆 Usuario hizo click en notificación');
          break;
        default:
          console.log('📬 Mensaje SW:', type, data);
      }
    });
    
    registration.addEventListener('updatefound', () => {
      addDebugInfo('🔄 Actualización de SW disponible');
    });
  };

  const updatePermissionState = () => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      addDebugInfo(`🔔 Permisos: ${currentPermission}`);
    }
  };

  const requestNotificationPermission = async () => {
    setLoading(true);
    addDebugInfo('🔔 Solicitando permisos de notificación...');
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        addDebugInfo('✅ Permisos concedidos');
        await subscribeToPush();
      } else {
        addDebugInfo(`❌ Permisos denegados: ${result}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Error solicitando permisos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    if (!swRegistrationRef.current) {
      throw new Error('Service Worker no disponible');
    }
    
    addDebugInfo('📬 Suscribiendo a push notifications...');
    setLoading(true);
    
    try {
      const subscription = await swRegistrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      addDebugInfo('✅ Suscripción creada localmente');
      await savePushSubscription(subscription);
      setSubscription(subscription);
      setSubscribed(true);
      addDebugInfo('✅ Suscripción guardada en BD');
    } catch (error) {
      addDebugInfo(`❌ Error suscribiendo: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 💾 GUARDAR SUSCRIPCIÓN - CORREGIDO PARA TU ESQUEMA
  // ============================================
  const savePushSubscription = async (subscription) => {
    try {
      // 🔧 CORREGIDO: Usar nombres de columnas de tu esquema
      const subscriptionData = {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys?.p256dh || null,    // ← Corregido
        auth_key: subscription.keys?.auth || null,        // ← Corregido
        user_agent: deviceInfo.userAgent || navigator.userAgent,
        device_name: getDeviceName(),
        device_type: getDeviceType(),
        browser_name: getBrowserName(),
        is_active: true,
        last_used_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      console.log('💾 Guardando suscripción con estructura:', subscriptionData);

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert([subscriptionData], { 
          onConflict: 'endpoint',  // Tu esquema tiene UNIQUE en endpoint
          ignoreDuplicates: false
        });

      if (error) throw error;
      addDebugInfo('✅ Suscripción guardada en BD con esquema correcto');
      
    } catch (error) {
      console.error('❌ Error guardando suscripción:', error);
      addDebugInfo(`❌ Error BD: ${error.message}`);
      throw error;
    }
  };

  // ============================================
  // 🔧 HELPERS PARA DETECTAR DISPOSITIVO
  // ============================================
  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) {
      const match = ua.match(/Android.*?;\s*([^)]+)/);
      return match ? match[1].trim() : 'Android Device';
    }
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/Mac/.test(ua)) return 'Mac';
    return 'Unknown Device';
  };

  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      return 'mobile';
    }
    if (/iPad|Tablet/i.test(ua)) {
      return 'tablet';
    }
    return 'desktop';
  };

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (/Chrome/.test(ua) && !/Edge/.test(ua)) return 'Chrome';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
    if (/Edge/.test(ua)) return 'Edge';
    if (/Opera/.test(ua)) return 'Opera';
    return 'Unknown Browser';
  };

  // ============================================
  // 🔍 VERIFICAR SUSCRIPCIÓN EXISTENTE - CORREGIDO
  // ============================================
  const checkExistingSubscription = async () => {
    if (!swRegistrationRef.current) return;
    
    try {
      const existingSubscription = await swRegistrationRef.current.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setSubscribed(true);
        addDebugInfo('✅ Suscripción existente encontrada');
        
        // Verificar en BD con nombres correctos
        const { data: dbSubscription } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('endpoint', existingSubscription.endpoint)
          .eq('is_active', true)
          .single();

        if (!dbSubscription) {
          addDebugInfo('⚠️ Suscripción local existe pero no en BD - guardando...');
          await savePushSubscription(existingSubscription);
        } else {
          addDebugInfo('✅ Suscripción sincronizada con BD');
        }
      } else {
        addDebugInfo('ℹ️ No hay suscripción existente');
      }
    } catch (error) {
      addDebugInfo(`❌ Error verificando suscripción: ${error.message}`);
    }
  };

  // ============================================
  // 🧪 ENVIAR NOTIFICACIÓN DE PRUEBA
  // ============================================
  const sendTestNotification = async () => {
    if (!subscribed) {
      alert('❌ Primero debes suscribirte a las notificaciones');
      return;
    }
    
    setLoading(true);
    addDebugInfo('🧪 Enviando notificación de prueba...');
    
    try {
      const testData = {
        title: '🧪 Prueba - Club Canino',
        body: `¡Hola! Esta es una notificación push real enviada a tu ${deviceInfo.isMobile ? 'móvil' : 'dispositivo'}.`,
        icon: '/icon-192.png',
        data: {
          type: 'test',
          userId: userId,
          timestamp: new Date().toISOString(),
          dogName: dogs[0]?.name || 'tu perro'
        }
      };
      
      const response = await fetch('/.netlify/functions/send-push-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          notification: testData
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        addDebugInfo('✅ Notificación enviada exitosamente');
        setLastNotificationSent(new Date().toLocaleTimeString());
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      addDebugInfo(`❌ Error enviando notificación: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showLocalTestNotification = () => {
    if (permission !== 'granted') {
      alert('❌ Permisos de notificación no concedidos');
      return;
    }
    
    addDebugInfo('🧪 Mostrando notificación local...');
    
    try {
      new Notification('🐕 Club Canino - Prueba Local', {
        body: 'Esta es una notificación local (no push). Si la ves, ¡las notificaciones básicas funcionan!',
        icon: '/icon-192.png',
        tag: 'local-test',
        requireInteraction: false
      });
      
      addDebugInfo('✅ Notificación local mostrada');
    } catch (error) {
      addDebugInfo(`❌ Error notificación local: ${error.message}`);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return;
    
    setLoading(true);
    addDebugInfo('🗑️ Desuscribiendo...');
    
    try {
      await subscription.unsubscribe();
      
      // Marcar como inactiva en BD
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false, last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint);
      
      if (error) throw error;
      
      setSubscribed(false);
      setSubscription(null);
      addDebugInfo('✅ Desuscripción exitosa');
    } catch (error) {
      addDebugInfo(`❌ Error desuscribiendo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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

  const addDebugInfo = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
    console.log(`[PushNotifications] ${message}`);
  };

  // ============================================
  // 🎨 RENDER (IGUAL QUE ANTES)
  // ============================================
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <span className="text-2xl">📱</span>
          <span>Push Notifications Reales</span>
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          Recibe notificaciones en tu celular aunque la app esté cerrada
        </p>
      </div>

      {/* Estado actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Permisos */}
        <div className={`p-4 rounded-lg border-2 ${
          permission === 'granted' ? 'bg-green-50 border-green-200' :
          permission === 'denied' ? 'bg-red-50 border-red-200' :
          'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="text-center">
            <div className="text-2xl mb-2">
              {permission === 'granted' ? '✅' : permission === 'denied' ? '❌' : '⚠️'}
            </div>
            <div className="font-semibold text-sm">
              {permission === 'granted' ? 'Permisos OK' :
               permission === 'denied' ? 'Sin Permisos' :
               'Permisos Pendientes'}
            </div>
          </div>
        </div>

        {/* Service Worker */}
        <div className={`p-4 rounded-lg border-2 ${
          swReady ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="text-center">
            <div className="text-2xl mb-2">{swReady ? '📡' : '⏳'}</div>
            <div className="font-semibold text-sm">
              {swReady ? 'SW Listo' : 'SW Cargando'}
            </div>
          </div>
        </div>

        {/* Suscripción */}
        <div className={`p-4 rounded-lg border-2 ${
          subscribed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="text-center">
            <div className="text-2xl mb-2">{subscribed ? '📬' : '📭'}</div>
            <div className="font-semibold text-sm">
              {subscribed ? 'Suscrito' : 'No Suscrito'}
            </div>
          </div>
        </div>
      </div>

      {/* Información del dispositivo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📱 Tu Dispositivo:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• <strong>Tipo:</strong> {deviceInfo.isMobile ? 'Móvil' : 'Desktop'}</div>
          <div>• <strong>SO:</strong> {deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Otro'}</div>
          <div>• <strong>Navegador:</strong> {getBrowserName()}</div>
          <div>• <strong>Dispositivo:</strong> {getDeviceName()}</div>
          <div>• <strong>Online:</strong> {deviceInfo.online ? '✅' : '❌'}</div>
        </div>
      </div>

      {/* Acciones */}
      <div className="space-y-3">
        
        {/* Solicitar permisos */}
        {permission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Solicitando...' : '🔔 Habilitar Notificaciones Push'}
          </button>
        )}

        {/* Suscribirse */}
        {permission === 'granted' && !subscribed && swReady && (
          <button
            onClick={subscribeToPush}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Suscribiendo...' : '📬 Suscribirse a Push Notifications'}
          </button>
        )}

        {/* Botones de prueba */}
        {subscribed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={showLocalTestNotification}
              className="bg-purple-100 text-purple-700 py-2 px-4 rounded-lg hover:bg-purple-200 transition-colors font-medium"
            >
              🧪 Notificación Local
            </button>
            
            <button
              onClick={sendTestNotification}
              disabled={loading}
              className="bg-orange-100 text-orange-700 py-2 px-4 rounded-lg hover:bg-orange-200 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? '⏳ Enviando...' : '🚀 Push Real'}
            </button>
          </div>
        )}

        {/* Desuscribirse */}
        {subscribed && (
          <button
            onClick={unsubscribeFromPush}
            disabled={loading}
            className="w-full bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? '⏳ Desuscribiendo...' : '🗑️ Desuscribirse'}
          </button>
        )}
      </div>

      {/* Última notificación enviada */}
      {lastNotificationSent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-green-800 text-sm">
            <strong>✅ Última notificación enviada:</strong> {lastNotificationSent}
          </div>
        </div>
      )}

      {/* Debug info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">🔧 Debug Info:</h4>
        <div className="text-xs text-gray-600 space-y-1 max-h-40 overflow-y-auto">
          {debugInfo.map((info, index) => (
            <div key={index} className="font-mono">{info}</div>
          ))}
        </div>
      </div>

      {/* Información sobre el esquema */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="text-green-800 text-sm">
          <strong>✅ Esquema de BD:</strong> Compatible con tu base de datos existente
          <br />
          <strong>📊 Columnas:</strong> p256dh_key, auth_key, device_type, browser_name
        </div>
      </div>
    </div>
  );
};

export default RealPushNotifications;