// src/components/SmartNotifications.jsx
import { useState, useEffect } from 'react';

const SmartNotifications = ({ userRole = 'padre', dogName = 'tu peludito' }) => {
  const [notifications, setNotifications] = useState([]);
  const [currentTip, setCurrentTip] = useState(null);
  const [permission, setPermission] = useState('default');

  // Consejos educativos por día de la semana
  const educationalTips = {
    1: { // Lunes
      icon: '🎯',
      title: 'Tip de Entrenamiento',
      message: `Enséñale a ${dogName} el comando "quieto" con premio, solo 5 minutos diarios son suficientes`,
      type: 'training',
      time: '18:00'
    },
    2: { // Martes
      icon: '🏃‍♂️',
      title: 'Ejercicio Diario',
      message: `${dogName} necesita al menos 30 minutos de ejercicio activo para mantenerse saludable`,
      type: 'exercise',
      time: '19:00'
    },
    3: { // Miércoles  
      icon: '🧠',
      title: 'Estimulación Mental',
      message: `Juego recomendado: Esconder premios por casa para estimular la mente de ${dogName}`,
      type: 'mental',
      time: '17:30'
    },
    4: { // Jueves
      icon: '🦴',
      title: 'Alimentación Saludable',
      message: `Recuerda: las rutinas de comida son clave para el bienestar de ${dogName}`,
      type: 'nutrition',
      time: '18:30'
    },
    5: { // Viernes
      icon: '❤️',
      title: '¿Sabías que?',
      message: `Los perros necesitan rutina para ser felices. ${dogName} se siente más seguro con horarios fijos`,
      type: 'education',
      time: '20:00'
    },
    6: { // Sábado
      icon: '🎾',
      title: 'Tiempo de Juego',
      message: `Fin de semana perfecto para juegos más largos con ${dogName}. ¡Diversión garantizada!`,
      type: 'play',
      time: '10:00'
    },
    0: { // Domingo
      icon: '🛌',
      title: 'Descanso y Relajación',
      message: `Domingo de relax: ${dogName} también necesita tiempo tranquilo para recargar energías`,
      type: 'rest',
      time: '16:00'
    }
  };

  // Notificaciones basadas en progreso
  const progressBasedNotifications = {
    lowEnergy: {
      icon: '⚡',
      title: 'Nivel de Energía Bajo',
      message: `${dogName} necesita más ejercicio. Prueba juegos de buscar o una caminata extra`,
      action: 'Crear Rutina',
      type: 'suggestion'
    },
    lowObedience: {
      icon: '🎯',
      title: 'Refuerzo de Entrenamiento',
      message: `Practica comandos básicos con ${dogName} 10 minutos antes de cada comida`,
      action: 'Ver Guía',
      type: 'training'
    },
    highAnxiety: {
      icon: '💆‍♂️',
      title: 'Reduce la Ansiedad',
      message: `${dogName} muestra signos de estrés. Prueba ejercicios de relajación`,
      action: 'Técnicas de Calma',
      type: 'wellness'
    },
    goodProgress: {
      icon: '🎉',
      title: '¡Excelente Progreso!',
      message: `${dogName} está mejorando mucho. ¡Sigue con estas rutinas!`,
      action: 'Ver Estadísticas',
      type: 'celebration'
    }
  };

  // Notificaciones de transporte
  const transportNotifications = {
    departed: {
      icon: '🚌',
      title: 'Transporte en Ruta',
      message: `El transporte salió a recoger a ${dogName}`,
      action: 'Ver Ubicación',
      time: '5 min',
      type: 'transport'
    },
    arriving: {
      icon: '📍',
      title: 'Llegando Pronto',
      message: `Llegamos en 5 minutos por ${dogName}`,
      action: 'Preparar',
      time: 'Ahora',
      type: 'transport'
    },
    pickedUp: {
      icon: '✅',
      title: 'Recogida Exitosa',
      message: `${dogName} ya está en el colegio. ¡Que tenga buen día!`,
      action: 'Ver Estado',
      time: 'Recién',
      type: 'transport'
    },
    returning: {
      icon: '🏠',
      title: 'Regresando a Casa',
      message: `${dogName} viene de camino. Llegada estimada: 20 minutos`,
      action: 'Rastrear',
      time: '20 min',
      type: 'transport'
    }
  };

  useEffect(() => {
    // Solicitar permisos de notificación
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setPermission(permission);
      });
    }

    // Obtener tip del día actual
    const today = new Date().getDay();
    setCurrentTip(educationalTips[today]);

    // Simular notificaciones (en producción vendrían del backend)
    const mockNotifications = [
      {
        id: 1,
        ...transportNotifications.arriving,
        timestamp: new Date(),
        read: false
      },
      {
        id: 2,
        ...progressBasedNotifications.goodProgress,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // hace 30 min
        read: false
      }
    ];

    setNotifications(mockNotifications);
  }, [dogName]);

  const sendNotification = (notification) => {
    if (permission === 'granted') {
      new Notification(`Club Canino: ${notification.title}`, {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'club-canino',
        vibrate: [200, 100, 200],
        data: {
          url: '/dashboard/padre',
          action: notification.action
        }
      });
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const getNotificationColor = (type) => {
    const colors = {
      transport: 'bg-blue-50 border-blue-200 text-blue-800',
      training: 'bg-purple-50 border-purple-200 text-purple-800',
      exercise: 'bg-green-50 border-green-200 text-green-800',
      wellness: 'bg-orange-50 border-orange-200 text-orange-800',
      celebration: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      suggestion: 'bg-red-50 border-red-200 text-red-800'
    };
    return colors[type] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  return (
    <div className="space-y-4">
      
      {/* Tip Educativo del Día */}
      {currentTip && (
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <span className="text-2xl mr-3">{currentTip.icon}</span>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{currentTip.title}</h3>
                <p className="opacity-90 mt-1">{currentTip.message}</p>
                <div className="flex items-center mt-3">
                  <span className="text-sm opacity-75 mr-4">⏰ Recomendado a las {currentTip.time}</span>
                  <button 
                    onClick={() => sendNotification(currentTip)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-sm font-medium transition-all"
                  >
                    🔔 Recordar más tarde
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Notificaciones */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-700 flex items-center">
          <span className="mr-2">🔔</span>
          Notificaciones Recientes
        </h4>
        
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔕</div>
            <p>No hay notificaciones nuevas</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`border rounded-lg p-4 ${getNotificationColor(notification.type)} ${
                !notification.read ? 'shadow-md' : 'opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{notification.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h5 className="font-semibold">{notification.title}</h5>
                      {!notification.read && (
                        <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="mt-1 text-sm">{notification.message}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs opacity-75">
                        {notification.time ? `⏱️ ${notification.time}` : '📅 ' + notification.timestamp.toLocaleTimeString()}
                      </span>
                      
                      {notification.action && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm font-medium hover:underline"
                        >
                          {notification.action} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {!notification.read && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Centro de Configuración de Notificaciones */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-700 mb-3 flex items-center">
          <span className="mr-2">⚙️</span>
          Configurar Notificaciones
        </h5>
        
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center text-sm">
            <input type="checkbox" className="mr-2" defaultChecked />
            🚌 Transporte
          </label>
          <label className="flex items-center text-sm">
            <input type="checkbox" className="mr-2" defaultChecked />
            📊 Evaluaciones
          </label>
          <label className="flex items-center text-sm">
            <input type="checkbox" className="mr-2" defaultChecked />
            💡 Tips educativos
          </label>
          <label className="flex items-center text-sm">
            <input type="checkbox" className="mr-2" defaultChecked />
            📸 Fotos nuevas
          </label>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">
            Estado de permisos: 
            <span className={`ml-1 font-medium ${
              permission === 'granted' ? 'text-green-600' : 
              permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {permission === 'granted' ? '✅ Permitidas' : 
               permission === 'denied' ? '❌ Bloqueadas' : '⏳ Pendientes'}
            </span>
          </p>
          
          {permission !== 'granted' && (
            <button 
              onClick={() => Notification.requestPermission().then(setPermission)}
              className="bg-[#56CCF2] text-white px-3 py-1 rounded text-sm hover:bg-[#5B9BD5] transition-colors"
            >
              🔔 Activar Notificaciones
            </button>
          )}
        </div>
      </div>

      {/* Horarios Personalizados */}
      <div className="bg-[#FFFBF0] border border-[#C7EA46] rounded-lg p-4">
        <h5 className="font-semibold text-[#2C3E50] mb-3 flex items-center">
          <span className="mr-2">⏰</span>
          Rutinas Personalizadas para {dogName}
        </h5>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span>🌅 Hora de despertar:</span>
            <input type="time" defaultValue="07:00" className="border rounded px-2 py-1" />
          </div>
          <div className="flex justify-between items-center">
            <span>🍽️ Comida matutina:</span>
            <input type="time" defaultValue="08:00" className="border rounded px-2 py-1" />
          </div>
          <div className="flex justify-between items-center">
            <span>🚶‍♂️ Paseo nocturno:</span>
            <input type="time" defaultValue="20:00" className="border rounded px-2 py-1" />
          </div>
        </div>
        
        <p className="text-xs text-gray-600 mt-3 italic">
          💡 Las rutinas fijas ayudan a {dogName} a sentirse más seguro y equilibrado
        </p>
      </div>
    </div>
  );
};

export default SmartNotifications;