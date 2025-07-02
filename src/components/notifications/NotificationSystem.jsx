// src/components/notifications/NotificationSystem.jsx
// 🔔 SISTEMA DE NOTIFICACIONES OPTIMIZADO - SIN MÚLTIPLES REGISTROS
// ✅ CORREGIDO: Verificación de SW existente, singleton pattern, sintaxis arreglada

import { useState, useEffect, useRef } from 'react';
import supabase from '../../lib/supabase.js';

// ============================================
// 🔧 SINGLETON PARA SERVICE WORKER
// ============================================
let swRegistrationPromise = null;
let swRegistered = false;

const NotificationSystem = ({ userId, dogs = [] }) => {
  const [permission, setPermission] = useState('default');
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(false);
  const [swStatus, setSWStatus] = useState('checking');
  const [vapidKey, setVapidKey] = useState(null);
  
  // Ref para evitar re-ejecuciones
  const initializedRef = useRef(false);
  const preferencesLoadedRef = useRef(false);

  // ============================================
  // 🔄 INICIALIZACIÓN ÚNICA
  // ============================================
  useEffect(() => {
    // Evitar re-ejecución en Strict Mode
    if (initializedRef.current) {
      console.log('🔄 NotificationSystem ya inicializado, saltando...');
      return;
    }

    console.log('🔔 NotificationSystem: Inicializando por primera vez');
    initializedRef.current = true;

    const initializeSystem = async () => {
      try {
        // 1. Verificar permisos existentes
        if ('Notification' in window) {
          setPermission(Notification.permission);
        }
        
        // 2. Inicializar VAPID key
        initializeVapidKey();
        
        // 3. Registrar Service Worker (solo si no existe)
        await registerServiceWorkerSingleton();
        
      } catch (error) {
        console.error('❌ Error inicializando NotificationSystem:', error);
        setSWStatus('error');
      }
    };

    initializeSystem();
  }, []); // Sin dependencias para que solo se ejecute una vez

  // ============================================
  // 📥 CARGAR PREFERENCIAS (CON CACHE)
  // ============================================
  useEffect(() => {
    if (userId && dogs.length > 0 && !preferencesLoadedRef.current) {
      console.log('🔄 Cargando preferencias de notificación...');
      preferencesLoadedRef.current = true;
      loadUserPreferences();
    }
  }, [userId, dogs.length]);

  // ============================================
  // 🔑 INICIALIZAR VAPID KEY
  // ============================================
  const initializeVapidKey = () => {
    const envVapidKey = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY;
    
    if (envVapidKey && envVapidKey !== 'your_vapid_public_key_here') {
      setVapidKey(envVapidKey);
      console.log('✅ VAPID key real cargada desde entorno');
    } else {
      // Fallback: usar key de desarrollo
      setVapidKey('BJqPZ7FY8nNgJYw8kQ1m6F4Q0VWz5rKh9KjKnTXrJwDgA2VmKjLo3PmNzRtYuIpL6QxBvCdE2HsJt8KlMnOpQr4');
      console.warn('⚠️ Usando VAPID key de desarrollo. Configura PUBLIC_VAPID_PUBLIC_KEY en producción');
    }
  };

  // ============================================
  // 📡 SERVICE WORKER SINGLETON
  // ============================================
  const registerServiceWorkerSingleton = async () => {
    // Si ya está registrado o en proceso, usar la instancia existente
    if (swRegistered) {
      console.log('✅ Service Worker ya registrado, usando instancia existente');
      setSWStatus('ready');
      return swRegistrationPromise;
    }

    if (swRegistrationPromise) {
      console.log('🔄 Service Worker en proceso de registro, esperando...');
      setSWStatus('registering');
      try {
        await swRegistrationPromise;
        setSWStatus('ready');
        return swRegistrationPromise;
      } catch (error) {
        console.error('❌ Error esperando registro de SW:', error);
        setSWStatus('error');
        return null;
      }
    }

    // Verificar soporte
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('⚠️ Service Worker o Push Manager no soportados');
      setSWStatus('not-supported');
      return null;
    }

    // Verificar si ya hay un SW activo
    try {
      const existingRegistration = await navigator.serviceWorker.getRegistration('/');
      if (existingRegistration && existingRegistration.active) {
        console.log('✅ Service Worker ya activo:', existingRegistration.scope);
        swRegistered = true;
        swRegistrationPromise = Promise.resolve(existingRegistration);
        setSWStatus('ready');
        return existingRegistration;
      }
    } catch (error) {
      console.warn('⚠️ Error verificando SW existente:', error);
    }

    // Registrar nuevo SW
    console.log('📡 Registrando nuevo Service Worker...');
    setSWStatus('registering');
    
    swRegistrationPromise = navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    }).then(async (registration) => {
      console.log('✅ Service Worker registrado exitosamente:', registration.scope);
      
      // Esperar a que esté activo
      if (registration.installing) {
        await new Promise((resolve) => {
          registration.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') {
              resolve();
            }
          });
        });
      } else if (registration.waiting) {
        // Activar SW en espera
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        await new Promise((resolve) => {
          registration.addEventListener('controllerchange', resolve);
        });
      }
      
      swRegistered = true;
      console.log('🚀 Service Worker listo para push notifications');
      return registration;
    }).catch((error) => {
      console.error('❌ Error registrando Service Worker:', error);
      swRegistrationPromise = null;
      throw error;
    });

    try {
      await swRegistrationPromise;
      setSWStatus('ready');
    } catch (error) {
      setSWStatus('error');
    }

    return swRegistrationPromise;
  };

  // ============================================
  // 📥 CARGAR PREFERENCIAS DE USUARIO
  // ============================================
  const loadUserPreferences = async () => {
    if (!userId || dogs.length === 0) return;
    
    try {
      console.log('📥 Cargando preferencias para usuario:', userId);
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Convertir array a objeto para fácil acceso
      const prefsMap = {};
      data?.forEach(pref => {
        prefsMap[pref.dog_id] = pref;
      });
      
      setPreferences(prefsMap);
      console.log('✅ Preferencias cargadas:', Object.keys(prefsMap).length, 'perros');
      
    } catch (error) {
      console.error('❌ Error cargando preferencias:', error);
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

    if (permission === 'granted') {
      console.log('✅ Permisos ya concedidos');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔔 Solicitando permisos de notificación...');
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        console.log('✅ Permisos de notificación concedidos');
        
        // Suscribir a push notifications
        await subscribeToPush();
        
        // Mostrar notificación de prueba
        showLocalTestNotification();
        
      } else if (newPermission === 'denied') {
        alert('❌ Notificaciones bloqueadas. Ve a configuración del navegador para habilitarlas.');
      } else {
        console.log('⚠️ Permisos no concedidos');
      }
      
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      alert('Error solicitando permisos de notificación');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 📬 SUSCRIPCIÓN A PUSH
  // ============================================
  const subscribeToPush = async () => {
    if (!vapidKey) {
      console.error('❌ VAPID key no disponible');
      return;
    }

    try {
      const registration = await swRegistrationPromise;
      if (!registration) {
        throw new Error('Service Worker no disponible');
      }

      console.log('📬 Suscribiendo a push notifications...');
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });

      console.log('✅ Suscripción a push exitosa:', subscription.endpoint);
      
      // Guardar suscripción en la base de datos
      await savePushSubscription(subscription);
      
    } catch (error) {
      console.error('❌ Error suscribiendo a push:', error);
    }
  };

  // ============================================
  // 💾 GUARDAR SUSCRIPCIÓN - CORREGIDO
  // ============================================
  const savePushSubscription = async (subscription) => {
    try {
      // 🔍 DEBUG: Verificar estructura de la suscripción
      console.log('🔍 Estructura completa de subscription:', subscription);
      console.log('🔑 Keys disponibles:', subscription.keys);
      console.log('📱 p256dh:', subscription.keys?.p256dh);
      console.log('🔐 auth:', subscription.keys?.auth);
      
      // ✅ VALIDACIÓN antes de guardar
      if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
        throw new Error('Claves VAPID faltantes en la suscripción');
      }
      
      const subscriptionData = {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,    // ✅ Sin ? porque ya validamos arriba
        auth_key: subscription.keys.auth,        // ✅ Sin ? porque ya validamos arriba
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        browser_name: getBrowserName(),
        is_active: true,
        last_used_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      console.log('💾 Guardando suscripción:', subscriptionData);

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert([subscriptionData], { 
          onConflict: 'endpoint'  // ✅ Tu schema tiene UNIQUE en endpoint
        });

      if (error) throw error;
      
      console.log('✅ Suscripción guardada en base de datos');
      
    } catch (error) {
      console.error('❌ Error guardando suscripción:', error);
      throw error; // Re-lanzar para que se maneje arriba
    }
  };

  // ============================================
  // 🔧 HELPER FUNCTIONS
  // ============================================
  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|iphone|android/i.test(ua)) return 'mobile';
    return 'desktop';
  };

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  // ============================================
  // 🧪 NOTIFICACIÓN DE PRUEBA
  // ============================================
  const showLocalTestNotification = () => {
    if (permission === 'granted') {
      try {
        new Notification('🐕 Club Canino Dos Huellitas', {
          body: '¡Notificaciones activadas correctamente!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'test-notification'
        });
        
        console.log('✅ Notificación de prueba enviada');
      } catch (error) {
        console.error('❌ Error enviando notificación de prueba:', error);
      }
    }
  };

  // ============================================
  // 🎨 RENDERIZADO
  // ============================================
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          🔔 Notificaciones
        </h2>
        
        {/* Estado del Service Worker */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          swStatus === 'ready' ? 'bg-green-100 text-green-800' :
          swStatus === 'registering' ? 'bg-yellow-100 text-yellow-800' :
          swStatus === 'error' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {swStatus === 'ready' ? '✅ Activo' :
           swStatus === 'registering' ? '🔄 Registrando' :
           swStatus === 'error' ? '❌ Error' :
           '🔍 Verificando'}
        </div>
      </div>

      {/* Estado de permisos */}
      <div className="mb-4">
        <div className={`flex items-center gap-2 text-sm ${
          permission === 'granted' ? 'text-green-600' :
          permission === 'denied' ? 'text-red-600' :
          'text-yellow-600'
        }`}>
          <span className="text-lg">
            {permission === 'granted' ? '✅' : permission === 'denied' ? '❌' : '⚠️'}
          </span>
          <span>
            {permission === 'granted' ? 'Notificaciones habilitadas' :
             permission === 'denied' ? 'Notificaciones bloqueadas' :
             'Permisos pendientes'}
          </span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="space-y-3">
        {permission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            disabled={loading}
            className="w-full bg-[#56CCF2] hover:bg-[#2C3E50] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '🔄 Solicitando permisos...' : '🔔 Habilitar Notificaciones'}
          </button>
        )}

        {permission === 'granted' && (
          <button
            onClick={showLocalTestNotification}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            🧪 Enviar Notificación de Prueba
          </button>
        )}
      </div>

      {/* Información para el usuario */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Las notificaciones te ayudarán a recibir actualizaciones 
          sobre las evaluaciones de tus perros y recordatorios importantes.
        </p>
      </div>
    </div>
  );
};

export default NotificationSystem;