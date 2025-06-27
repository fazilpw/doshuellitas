// src/components/tracking/ParentTrackingDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import TrackingMap from './TrackingMap';

const ParentTrackingDashboard = ({ user }) => {
  // ============================================
  // 🔧 ESTADOS
  // ============================================
  const [transportStatus, setTransportStatus] = useState('active');
  const [currentETA, setCurrentETA] = useState(25);
  const [currentDistance, setCurrentDistance] = useState(4.2);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Refs
  const trackingInterval = useRef(null);

  // ============================================
  // 🐕 DATOS MOCK
  // ============================================
  const dogData = {
    name: 'Max',
    breed: 'Golden Retriever',
    owner: user?.name || 'María García'
  };

  const vehicleData = {
    plate: 'ABC-123',
    driver: 'Juan Carlos',
    phone: '+573001234567'
  };

  // ============================================
  // 🚀 EFECTOS
  // ============================================
  useEffect(() => {
    startTracking();
    
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, []);

  // ============================================
  // 📍 FUNCIONES DE TRACKING
  // ============================================
  const startTracking = () => {
    // Simular actualizaciones cada 30 segundos
    trackingInterval.current = setInterval(() => {
      updateVehicleLocation();
    }, 30000);

    console.log('🚀 Tracking iniciado para padres');
  };

  const refreshLocation = async () => {
    setIsRefreshing(true);
    
    // Simular carga
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    updateVehicleLocation();
    setIsRefreshing(false);
    showTempNotification('Ubicación actualizada', 'success');
  };

  const updateVehicleLocation = () => {
    // Simular movimiento del vehículo
    setCurrentDistance(prev => Math.max(0.1, prev - 0.3));
    setCurrentETA(prev => Math.max(1, prev - 2));

    // Actualizar estado según distancia
    if (currentDistance < 0.5) {
      setTransportStatus('arriving');
      showTempNotification('🚐 Tu perro llegará muy pronto!', 'success', 5000);
    } else if (currentDistance < 0.1) {
      setTransportStatus('arrived');
      showTempNotification('🏠 Tu perro está en casa!', 'success', 5000);
    }
  };

  const showTempNotification = (message, type = 'info', duration = 3000) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, duration);
  };

  // ============================================
  // 🗺️ UBICACIONES SIMULADAS
  // ============================================
  const getVehicleLocation = () => {
    // Simular movimiento del vehículo hacia la casa
    const progress = Math.max(0, (4.2 - currentDistance) / 4.2);
    const startLat = 4.7147;
    const startLng = -74.0517;
    const endLat = 4.7200;
    const endLng = -74.0600;
    
    return {
      lat: startLat + (endLat - startLat) * progress,
      lng: startLng + (endLng - startLng) * progress
    };
  };

  const homeLocationFixed = { lat: 4.7200, lng: -74.0600 };

  // ============================================
  // 🎯 ACCIONES
  // ============================================
  const callDriver = () => {
    if (confirm(`¿Llamar al conductor ${vehicleData.driver}?`)) {
      window.open(`tel:${vehicleData.phone}`);
    }
  };

  const shareLocation = () => {
    const message = `🐕 Mi perro ${dogData.name} está en camino! ETA: ${currentETA} minutos. Puedes seguir el transporte aquí: ${window.location.href}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Ubicación del Transporte - Club Canino',
        text: message,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(message).then(() => {
        showTempNotification('Enlace copiado al portapapeles', 'success');
      });
    }
  };

  const emergencyContact = () => {
    if (confirm('¿Contactar al Club Canino por emergencia?')) {
      window.open('tel:+573144329824');
    }
  };

  const sendFeedback = () => {
    const feedback = prompt('¿Cómo fue el servicio de transporte hoy?');
    if (feedback) {
      showTempNotification('Gracias por tu comentario!', 'success');
      console.log('Feedback enviado:', feedback);
    }
  };

  // ============================================
  // 🎨 HELPERS UI
  // ============================================
  const getStatusConfig = () => {
    const configs = {
      active: { color: 'bg-green-400', text: 'Transporte en camino' },
      arriving: { color: 'bg-yellow-400', text: 'Llegando en 2-3 minutos' },
      arrived: { color: 'bg-blue-400', text: 'Tu perro está en casa' },
      offline: { color: 'bg-gray-400', text: 'Sin conexión' }
    };
    return configs[transportStatus] || configs.offline;
  };

  const statusConfig = getStatusConfig();

  // ============================================
  // 🎨 RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E50]">📍 Ubicación del Transporte</h1>
            <p className="text-[#5B9BD5] mt-1">Seguimiento en tiempo real</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${statusConfig.color}`}></div>
              <span className="text-gray-600">{statusConfig.text}</span>
            </div>
            <button 
              onClick={refreshLocation}
              disabled={isRefreshing}
              className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50"
            >
              {isRefreshing ? '🔄 Actualizando...' : '🔄 Actualizar'}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Información del Perro y ETA */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Info del Perro */}
              <div className="text-center">
                <div className="w-20 h-20 bg-[#56CCF2] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🐕</span>
                </div>
                <h3 className="font-semibold text-[#2C3E50]">{dogData.name}</h3>
                <p className="text-sm text-gray-600">{dogData.breed}</p>
                <div className="mt-2 px-3 py-1 bg-[#ACF0F4] bg-opacity-30 rounded-full">
                  <span className="text-xs font-medium text-[#2C3E50]">En ruta</span>
                </div>
              </div>

              {/* ETA */}
              <div className="text-center">
                <div className="text-3xl font-bold text-[#56CCF2] mb-2">
                  {currentETA} min
                </div>
                <p className="text-sm text-gray-600">Tiempo estimado de llegada</p>
                <div className="mt-4 text-xs text-gray-500">
                  <div>Distancia: {currentDistance.toFixed(1)} km</div>
                  <div>Velocidad: 35 km/h</div>
                </div>
              </div>

              {/* Estado del Transporte */}
              <div className="text-center">
                <div className="w-16 h-16 bg-[#C7EA46] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">🚐</span>
                </div>
                <p className="font-medium text-[#2C3E50]">{vehicleData.plate}</p>
                <p className="text-sm text-gray-600">{vehicleData.driver} - Conductor</p>
                <button 
                  onClick={callDriver}
                  className="mt-2 text-xs bg-[#56CCF2] text-white px-3 py-1 rounded-full hover:bg-[#5B9BD5] transition-colors"
                >
                  📞 Llamar
                </button>
              </div>
            </div>
          </div>

          {/* Mapa de Tracking */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#2C3E50]">🗺️ Mapa en Tiempo Real</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-xs text-gray-500">
                  <div className="w-2 h-2 bg-[#56CCF2] rounded-full mr-1"></div>
                  <span>Transporte</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <div className="w-2 h-2 bg-[#C7EA46] rounded-full mr-1"></div>
                  <span>Tu casa</span>
                </div>
              </div>
            </div>
            
            <TrackingMap
              vehicleLocation={getVehicleLocation()}
              homeLocation={homeLocationFixed}
              eta={currentETA}
              vehicleData={vehicleData}
              onMapLoad={() => setMapLoaded(true)}
            />
          </div>

          {/* Timeline de Eventos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">⏱️ Timeline del Viaje</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Transporte salió del colegio</p>
                  <p className="text-xs text-gray-500">15:45 - Hace 8 minutos</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-[#56CCF2] rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-white text-sm">🚐</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">En camino a tu casa</p>
                  <p className="text-xs text-gray-500">Llegada estimada: {new Date(Date.now() + currentETA * 60000).toLocaleTimeString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🏠</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-500">Llegada a casa</p>
                  <p className="text-xs text-gray-400">Pendiente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">⚡ Acciones Rápidas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={shareLocation}
                className="bg-[#56CCF2] text-white py-3 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors"
              >
                📤 Compartir Ubicación
              </button>
              
              <button 
                onClick={emergencyContact}
                className="bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                🚨 Contacto Emergencia
              </button>
              
              <button 
                onClick={sendFeedback}
                className="bg-[#C7EA46] text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                💬 Enviar Comentario
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ParentTrackingDashboard;