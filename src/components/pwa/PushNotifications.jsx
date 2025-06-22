// src/components/pwa/PushNotifications.jsx
import { useState, useEffect } from 'react';

const PushNotifications = ({ userId, userRole }) => {
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);

  // VAPID Public Key - Reemplazar con tu clave real
  const vapidPublicKey = 'BJqPZ7FY8nNgJYw8kQ1m6F4Q0VWz5rKh9KjKnTXrJwDgA2VmKjLo3PmNzRtYuIpL6QxBvCdE2HsJt8KlMnOpQr4';

  useEffect(() => {
    initializeNotifications();
    listenForMessages();
  }, []);

  // ============================================
  // 🚀 INICIALIZACIÓN
  // ============================================
  async function initializeNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('❌ Notificaciones no soportadas');
      return;
    }

    // Verificar estado actual
    setPermission(Notification.permission);
    
    // Verificar si ya hay una suscripción activa
    await checkExistingSubscription();
    
    // Auto-solicitar permisos después de 10 segundos si el usuario interactúa
    setTimeout(() => {
      if (Notification.permission === 'default') {
        showPermissionPrompt();
      }
    }, 10000);
  }

  async function checkExistingSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setSubscribed(true);
        console.log('✅ Suscripción existente encontrada');
      }
    } catch (error) {
      console.error('❌ Error verificando suscripción:', error);
    }
  }

  // ============================================
  // 🔔 GESTIÓN DE PERMISOS
  // ============================================
  function showPermissionPrompt() {
    // Solo mostrar si no se ha decidido antes
    if (Notification.permission === 'default') {
      const shouldAsk = confirm(
        '🐕 ¿Quieres recibir notificaciones sobre el estado de tu mascota?\n\n' +
        '✅ Te notificaremos cuando:\n' +
        '• Tu mascota llegue/salga del colegio\n' +
        '• Haya nuevas evaluaciones disponibles\n' +
        '• El transporte esté en camino\n' +
        '• Tengamos actualizaciones importantes'
      );
      
      if (shouldAsk) {
        requestPermission();
      }
    }
  }

  async function requestPermission() {
    setIsLoading(true);
    
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeUser();
        showTestNotification();
      } else {
        console.log('❌ Permisos de notificación denegados');
      }
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================
  // 📝 SUSCRIPCIÓN PUSH
  // ============================================
  async function subscribeUser() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscriptionOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      };
      
      const pushSubscription = await registration.pushManager.subscribe(subscriptionOptions);
      setSubscription(pushSubscription);
      setSubscribed(true);
      
      // Enviar suscripción al servidor
      await sendSubscriptionToServer(pushSubscription);
      
      console.log('✅ Usuario suscrito a notificaciones push');
      
    } catch (error) {
      console.error('❌ Error suscribiendo usuario:', error);
      setSubscribed(false);
    }
  }

  async function unsubscribeUser() {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        await removeSubscriptionFromServer(subscription);
        setSubscribed(false);
        setSubscription(null);
        console.log('✅ Usuario desuscrito de notificaciones');
      }
    } catch (error) {
      console.error('❌ Error desuscribiendo usuario:', error);
    }
  }

  // ============================================
  // 🌐 COMUNICACIÓN CON SERVIDOR
  // ============================================
  async function sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId,
          userRole,
          deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: Date.now()
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Error enviando suscripción al servidor');
      }

      console.log('✅ Suscripción enviada al servidor');
    } catch (error) {
      console.error('❌ Error enviando suscripción:', error);
    }
  }

  async function removeSubscriptionFromServer(subscription) {
    try {
      await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      });
    } catch (error) {
      console.error('❌ Error removiendo suscripción:', error);
    }
  }

  // ============================================
  // 🧪 NOTIFICACIONES DE PRUEBA
  // ============================================
  function showTestNotification() {
    new Notification('🐕 Club Canino Dos Huellitas', {
      body: '¡Notificaciones activadas! Te mantendremos informado sobre tu mascota.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'welcome',
      vibrate: [100, 50, 100]
    });
  }

  async function sendTestPush() {
    try {
      await fetch('/api/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      console.log('🧪 Notificación de prueba enviada');
    } catch (error) {
      console.error('❌ Error enviando notificación de prueba:', error);
    }
  }

  // ============================================
  // 📱 TIPOS DE NOTIFICACIONES AUTOMÁTICAS
  // ============================================
  async function scheduleSmartNotifications() {
    const notifications = getSmartNotifications(userRole);
    
    notifications.forEach(notification => {
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: notification.tag,
            data: notification.data
          });
        }
      }, notification.delay);
    });
  }

  function getSmartNotifications(role) {
    const baseNotifications = [
      {
        title: '🎓 Tip Educativo',
        body: 'Enséñale "quieto" con premio, 5 min diarios son suficientes',
        delay: 2 * 60 * 60 * 1000, // 2 horas
        tag: 'educational-tip',
        data: { type: 'tip', category: 'training' }
      },
      {
        title: '🎾 Hora del Ejercicio',
        body: 'Es hora del paseo diario - 20 min de ejercicio le harán bien',
        delay: 8 * 60 * 60 * 1000, // 8 horas
        tag: 'exercise-reminder',
        data: { type: 'reminder', category: 'exercise' }
      },
      {
        title: '🧠 Estimulación Mental',
        body: 'Prueba esconder premios para estimular su mente',
        delay: 24 * 60 * 60 * 1000, // 1 día
        tag: 'mental-stimulation',
        data: { type: 'tip', category: 'mental' }
      }
    ];

    if (role === 'padre') {
      return [
        ...baseNotifications,
        {
          title: '📊 Revisa el Progreso',
          body: 'Nuevas evaluaciones disponibles de tu mascota',
          delay: 6 * 60 * 60 * 1000, // 6 horas
          tag: 'progress-check',
          data: { type: 'reminder', category: 'progress' }
        }
      ];
    }

    return baseNotifications;
  }

  // ============================================
  // 📨 ESCUCHAR MENSAJES DEL SERVICE WORKER
  // ============================================
  function listenForMessages() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NOTIFICATION_RECEIVED') {
          setLastNotification({
            title: event.data.title,
            body: event.data.body,
            timestamp: Date.now()
          });
        }
      });
    }
  }

  // ============================================
  // 🛠️ UTILIDADES
  // ============================================
  function urlBase64ToUint8Array(base64String) {
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
  }

  // ============================================
  // 🎨 RENDER COMPONENT
  // ============================================
  if (!('Notification' in window)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <span className="text-yellow-600 mr-2">⚠️</span>
          <span className="text-yellow-800">
            Tu navegador no soporta notificaciones push
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#2C3E50]">
          🔔 Notificaciones Push
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          permission === 'granted' ? 'bg-green-100 text-green-800' :
          permission === 'denied' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {permission === 'granted' ? 'Activadas' :
           permission === 'denied' ? 'Bloqueadas' : 'Pendientes'}
        </div>
      </div>

      {permission === 'default' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Recibe notificaciones instantáneas sobre el estado de tu mascota
          </p>
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="w-full bg-[#56CCF2] text-white py-3 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors font-medium disabled:opacity-50"
          >
            {isLoading ? '⏳ Activando...' : '🔔 Activar Notificaciones'}
          </button>
        </div>
      )}

      {permission === 'granted' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-green-600 font-medium">
              ✅ Notificaciones activas
            </span>
            <button
              onClick={unsubscribeUser}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Desactivar
            </button>
          </div>
          
          {/* Controles de prueba */}
          <div className="border-t pt-4">
            <button
              onClick={sendTestPush}
              className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 transition-colors"
            >
              🧪 Enviar Prueba
            </button>
          </div>

          {lastNotification && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-800">
                Última notificación:
              </div>
              <div className="text-sm text-blue-600">
                {lastNotification.title} - {lastNotification.body}
              </div>
            </div>
          )}
        </div>
      )}

      {permission === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">
            Las notificaciones están bloqueadas. Para activarlas:
          </p>
          <ol className="list-decimal list-inside text-sm text-red-600 mt-2">
            <li>Haz clic en el ícono de candado en la barra de direcciones</li>
            <li>Cambia "Notificaciones" a "Permitir"</li>
            <li>Recarga la página</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default PushNotifications;