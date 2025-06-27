// src/components/conductor/ConductorDashboard.jsx
import { useState, useEffect, useRef } from 'react';

const ConductorDashboard = ({ user }) => {
  // ============================================
  // 🔧 ESTADOS
  // ============================================
  const [isTracking, setIsTracking] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [routeType, setRouteType] = useState('');
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState('');
  const [eventHistory, setEventHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Refs para el tracking
  const watchId = useRef(null);

  // ============================================
  // 🐕 DATOS MOCK
  // ============================================
  const mockVehicles = [
    { id: 'abc-123', plate: 'ABC-123', driver: 'Juan Carlos' },
    { id: 'def-456', plate: 'DEF-456', driver: 'María López' },
    { id: 'ghi-789', plate: 'GHI-789', driver: 'Pedro Gómez' }
  ];

  const mockDogs = [
    { id: '1', name: 'Max', breed: 'Golden Retriever', owner: 'María García', address: 'Calle 123 #45-67' },
    { id: '2', name: 'Luna', breed: 'Labrador', owner: 'Carlos Ruiz', address: 'Carrera 78 #12-34' },
    { id: '3', name: 'Rocky', breed: 'Pastor Alemán', owner: 'Ana López', address: 'Avenida 68 #89-12' }
  ];

  // ============================================
  // 🚀 EFECTOS
  // ============================================
  useEffect(() => {
    logEvent('Sistema del conductor iniciado correctamente', 'info');
    
    // Cleanup al desmontar
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  // ============================================
  // 📍 FUNCIONES DE GPS
  // ============================================
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este dispositivo');
      return;
    }

    if (selectedDogs.length === 0) {
      setError('Selecciona al menos un perro antes de iniciar el tracking');
      return;
    }

    setIsTracking(true);
    setError('');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    watchId.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      options
    );

    logEvent(`Tracking GPS iniciado para ${selectedDogs.length} perros`, 'success');
  };

  const stopTracking = () => {
    setIsTracking(false);
    
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    logEvent('Tracking GPS detenido', 'warning');
  };

  const handleLocationUpdate = (position) => {
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
    logEvent('Ubicación actualizada correctamente', 'info');
  };

  const handleLocationError = (error) => {
    const errorMessages = {
      1: 'Permiso denegado para acceder a la ubicación',
      2: 'Ubicación no disponible',
      3: 'Tiempo de espera agotado'
    };
    
    const message = errorMessages[error.code] || 'Error desconocido de GPS';
    setError(message);
    logEvent(`Error GPS: ${message}`, 'error');
  };

  // ============================================
  // 🐕 FUNCIONES DE PERROS
  // ============================================
  const toggleDogSelection = (dogId) => {
    const dog = mockDogs.find(d => d.id === dogId);
    
    setSelectedDogs(prev => {
      const isSelected = prev.find(d => d.id === dogId);
      
      if (isSelected) {
        return prev.filter(d => d.id !== dogId);
      } else {
        return [...prev, dog];
      }
    });
  };

  const removeDogFromSelection = (dogId) => {
    setSelectedDogs(prev => prev.filter(d => d.id !== dogId));
  };

  // ============================================
  // 🛣️ FUNCIONES DE RUTA
  // ============================================
  const handleRouteAction = (action) => {
    const actions = {
      start: () => {
        logEvent('Ruta iniciada oficialmente', 'success');
      },
      pause: () => {
        logEvent('Ruta pausada temporalmente', 'warning');
      },
      pickup: () => {
        if (selectedDogs.length > 0) {
          logEvent(`Perro recogido: ${selectedDogs[0].name}`, 'success');
        }
      },
      emergency: () => {
        if (confirm('¿Confirmas que hay una emergencia?')) {
          logEvent('🚨 ALERTA DE EMERGENCIA ACTIVADA', 'error');
        }
      }
    };

    if (actions[action]) {
      actions[action]();
    }
  };

  // ============================================
  // 🎨 FUNCIONES DE UI
  // ============================================
  const logEvent = (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const newEvent = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setEventHistory(prev => [newEvent, ...prev.slice(0, 9)]);
  };

  const canStartTracking = () => {
    return selectedVehicle && routeType && selectedDogs.length > 0;
  };

  const loadAvailableDogs = () => {
    if (!selectedVehicle || !routeType) {
      setError('Selecciona vehículo y tipo de ruta primero');
      return;
    }

    setError('');
    logEvent(`Cargados ${mockDogs.length} perros para ${routeType}`, 'success');
  };

  // ============================================
  // 🎨 RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E50]">🚐 Control de Ruta</h1>
            <p className="text-[#5B9BD5] mt-1">Panel del conductor - {user?.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${isTracking ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span className="text-gray-600">{isTracking ? 'GPS Activo' : 'Desconectado'}</span>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Configuración del Vehículo */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">🚗 Configuración del Vehículo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehículo Asignado
                </label>
                <select 
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                >
                  <option value="">Seleccionar vehículo...</option>
                  {mockVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.driver}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Ruta
                </label>
                <select 
                  value={routeType}
                  onChange={(e) => setRouteType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="pickup">🏠➡️🏫 Recoger (Casa → Colegio)</option>
                  <option value="delivery">🏫➡️🏠 Entregar (Colegio → Casa)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <button 
                onClick={loadAvailableDogs}
                disabled={!selectedVehicle || !routeType}
                className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50"
              >
                📋 Cargar Lista de Perros
              </button>
              <p className="text-xs text-gray-500 mt-2">
                {!selectedVehicle || !routeType ? 'Selecciona vehículo y tipo de ruta primero' : 'Lista cargada - selecciona perros abajo'}
              </p>
            </div>
          </div>

          {/* Lista de Perros */}
          {selectedVehicle && routeType && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">🐕 Perros Asignados</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {mockDogs.map(dog => (
                  <div key={dog.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#56CCF2] transition-colors">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={selectedDogs.some(d => d.id === dog.id)}
                        onChange={() => toggleDogSelection(dog.id)}
                        className="w-4 h-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-[#2C3E50]">{dog.name}</div>
                        <div className="text-sm text-gray-600">{dog.breed}</div>
                        <div className="text-xs text-gray-500">{dog.owner}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Perros Seleccionados */}
              {selectedDogs.length > 0 && (
                <div className="bg-[#ACF0F4] bg-opacity-30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-[#2C3E50]">
                      🎯 Perros Seleccionados ({selectedDogs.length})
                    </h3>
                    <button 
                      onClick={() => setSelectedDogs([])}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Limpiar todo
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedDogs.map(dog => (
                      <div key={dog.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#56CCF2] rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{dog.name[0]}</span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{dog.name}</div>
                            <div className="text-xs text-gray-500">{dog.owner}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeDogFromSelection(dog.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Control de GPS */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">📍 Control GPS</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-red-600 mr-3">⚠️</div>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <button 
                  onClick={isTracking ? stopTracking : startTracking}
                  disabled={!canStartTracking() && !isTracking}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isTracking 
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-[#56CCF2] text-white hover:bg-[#5B9BD5] disabled:opacity-50'
                  }`}
                >
                  {isTracking ? '⏹️ Detener Tracking' : '▶️ Iniciar Tracking GPS'}
                </button>
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {!canStartTracking() ? 'Selecciona perros antes de iniciar el tracking' : 'Todo listo para iniciar el tracking'}
                </p>
              </div>
              
              {currentLocation && (
                <div className="bg-[#ACF0F4] bg-opacity-30 rounded-lg p-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Latitud:</span>
                      <span className="font-mono">{currentLocation.latitude}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Longitud:</span>
                      <span className="font-mono">{currentLocation.longitude}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Velocidad:</span>
                      <span className="font-mono">{currentLocation.speed} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Precisión:</span>
                      <span className="font-mono">{currentLocation.accuracy} m</span>
                    </div>
                  </div>
                  
                  {lastUpdate && (
                    <p className="text-xs text-gray-600 text-center mt-2">
                      Última actualización: {lastUpdate.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Acciones de Ruta */}
          {isTracking && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">🛣️ Acciones de Ruta</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => handleRouteAction('start')}
                  className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  🚀 Iniciar Ruta
                </button>
                
                <button 
                  onClick={() => handleRouteAction('pause')}
                  className="bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  ⏸️ Pausar
                </button>
                
                <button 
                  onClick={() => handleRouteAction('pickup')}
                  className="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  🐕 Perro Recogido
                </button>
                
                <button 
                  onClick={() => handleRouteAction('emergency')}
                  className="bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  🚨 Emergencia
                </button>
              </div>
            </div>
          )}

          {/* Historial de Eventos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">📝 Historial de Eventos</h2>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {eventHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  <div className="text-2xl mb-2">📋</div>
                  <p>No hay eventos registrados aún</p>
                </div>
              ) : (
                eventHistory.map(event => (
                  <div key={event.id} className={`text-xs p-3 rounded-lg border ${
                    event.type === 'success' ? 'bg-green-50 border-green-200' :
                    event.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    event.type === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-[#FFFBF0] border-[#ACF0F4]'
                  }`}>
                    <div className={`font-medium ${
                      event.type === 'success' ? 'text-green-800' :
                      event.type === 'warning' ? 'text-yellow-800' :
                      event.type === 'error' ? 'text-red-800' :
                      'text-[#2C3E50]'
                    }`}>
                      {event.timestamp.toLocaleTimeString()} - {event.message}
                    </div>
                    <div className="text-[#5B9BD5] mt-1">
                      Evento registrado automáticamente
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ConductorDashboard;