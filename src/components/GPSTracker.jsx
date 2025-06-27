// src/components/GPSTracker.jsx
import { useState, useEffect, useRef } from 'react';

const GPSTracker = () => {
  // Estados con tipos implícitos
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Referencias para cleanup
  const watchIdRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Funciones principales
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este dispositivo');
      return;
    }

    setIsTracking(true);
    setError('');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );

    logEvent('📍 Tracking GPS iniciado');
  };

  const stopTracking = () => {
    setIsTracking(false);
    
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    logEvent('⏹️ Tracking GPS detenido');
  };

  const handleLocationSuccess = (position) => {
    const { latitude, longitude, speed, accuracy } = position.coords;
    
    const location = {
      latitude: parseFloat(latitude.toFixed(8)),
      longitude: parseFloat(longitude.toFixed(8)),
      speed: speed ? parseFloat((speed * 3.6).toFixed(2)) : 0,
      accuracy: accuracy || 0,
      timestamp: new Date()
    };

    setCurrentLocation(location);
    setLastUpdate(new Date());
    
    // Actualizar historial (máximo 10 ubicaciones)
    setLocationHistory(prev => {
      const newHistory = [location, ...prev];
      return newHistory.slice(0, 10);
    });

    // Actualizar mapa si existe
    updateMap(location);

    console.log('📍 Nueva ubicación:', location);
  };

  const handleLocationError = (error) => {
    const errorMessages = {
      1: 'Permiso denegado para acceder a la ubicación',
      2: 'Ubicación no disponible',
      3: 'Tiempo de espera agotado'
    };
    
    const message = errorMessages[error.code] || 'Error desconocido de GPS';
    setError(message);
    console.error('❌ Error GPS:', message);
  };

  const logEvent = (message) => {
    console.log(message);
    
    // Mostrar notificación temporal
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  const loadGoogleMaps = () => {
    const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API Key no configurada');
      return;
    }

    // Verificar si ya está cargado
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`;
    script.async = true;
    document.head.appendChild(script);

    // Función global para callback
    window.initGoogleMap = initializeMap;
  };

  const initializeMap = () => {
    const mapContainer = document.getElementById('gps-map');
    if (!mapContainer || !window.google) return;

    const center = currentLocation 
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : { lat: 4.7110, lng: -74.0721 }; // Bogotá por defecto

    mapRef.current = new window.google.maps.Map(mapContainer, {
      zoom: 15,
      center: center
    });

    markerRef.current = new window.google.maps.Marker({
      position: center,
      map: mapRef.current,
      title: 'Vehículo Club Canino',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="13" fill="#3B82F6" stroke="#fff" stroke-width="2"/>
            <text x="15" y="20" text-anchor="middle" font-size="12" fill="white">🚐</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(30, 30)
      }
    });
  };

  const updateMap = (location) => {
    if (mapRef.current && markerRef.current && window.google) {
      const position = { lat: location.latitude, lng: location.longitude };
      markerRef.current.setPosition(position);
      mapRef.current.setCenter(position);
    }
  };

  // Event handlers para botones
  const handleStartRoute = () => logEvent('🚀 Ruta iniciada');
  const handlePauseRoute = () => logEvent('⏸️ Ruta pausada');
  const handleMarkPickup = () => logEvent('📍 Recogida marcada');
  const handleEmergency = () => logEvent('🚨 Emergencia reportada');

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🚐 GPS Tracker</h1>
            <p className="text-blue-100 text-sm">Club Canino - Vehículo ABC-123</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-400' : 'bg-gray-400'}`}></div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Control de Tracking */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">📍 Estado GPS</h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isTracking ? 'Activo' : 'Inactivo'}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <button 
            onClick={isTracking ? stopTracking : startTracking}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isTracking 
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isTracking ? '⏹️ Detener Tracking' : '▶️ Iniciar Tracking'}
          </button>
          
          {currentLocation && (
            <div className="mt-4 bg-blue-50 rounded-lg p-3">
              <div className="text-sm space-y-1">
                <div><strong>Latitud:</strong> {currentLocation.latitude}</div>
                <div><strong>Longitud:</strong> {currentLocation.longitude}</div>
                <div><strong>Velocidad:</strong> {currentLocation.speed} km/h</div>
                <div><strong>Precisión:</strong> {currentLocation.accuracy}m</div>
              </div>
            </div>
          )}
          
          {lastUpdate && (
            <p className="text-xs text-gray-600 text-center mt-3">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Mapa */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">🗺️ Mapa</h3>
            <button 
              onClick={loadGoogleMaps}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors"
            >
              Cargar Mapa
            </button>
          </div>
          <div 
            id="gps-map" 
            className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center"
          >
            <p className="text-gray-600">Haz clic en "Cargar Mapa" para ver la ubicación</p>
          </div>
        </div>

        {/* Historial */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4">📋 Historial ({locationHistory.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {locationHistory.length === 0 ? (
              <p className="text-gray-600 text-sm">No hay ubicaciones registradas</p>
            ) : (
              locationHistory.map((loc, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                  <div className="font-medium">{loc.timestamp.toLocaleTimeString()}</div>
                  <div className="text-gray-600">{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</div>
                  <div className="text-gray-500">{loc.speed} km/h • {loc.accuracy}m</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">⚡ Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleStartRoute}
              className="bg-green-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              🚀 Iniciar Ruta
            </button>
            <button 
              onClick={handlePauseRoute}
              className="bg-yellow-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              ⏸️ Pausar
            </button>
            <button 
              onClick={handleMarkPickup}
              className="bg-blue-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              📍 Recogida
            </button>
            <button 
              onClick={handleEmergency}
              className="bg-red-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-red-600 transition-colors"
            >
              🚨 Emergencia
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GPSTracker;