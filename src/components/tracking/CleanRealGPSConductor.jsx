// src/components/tracking/CleanRealGPSConductor.jsx - SOLO GPS REAL, SIN SIMULACIÓN
import { useState, useEffect, useRef } from 'react';
import supabase from '../../lib/supabase.js';

const CleanRealGPSConductor = () => {
  // ============================================
  // 🔧 ESTADOS PRINCIPALES - SOLO DATOS REALES
  // ============================================
  const [isTracking, setIsTracking] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [realLocation, setRealLocation] = useState(null);
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [error, setError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [locationHistory, setLocationHistory] = useState([]);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  // ============================================
  // 🔧 REFS PARA TRACKING
  // ============================================
  const watchPositionRef = useRef(null);

  // ============================================
  // 🚐 DATOS DE VEHÍCULOS Y PERROS (SIN COORDENADAS FAKE)
  // ============================================
  const vehicles = [
    { 
      id: 'vehicle-001', 
      license_plate: 'ABC-123', 
      driver: 'Juan Carlos',
      capacity: 6
    },
    { 
      id: 'vehicle-002', 
      license_plate: 'DEF-456', 
      driver: 'María López',
      capacity: 8
    }
  ];

  const availableDogs = [
    { 
      id: 'dog-001', 
      name: 'Max', 
      breed: 'Golden Retriever', 
      owner: 'María García',
      pickup_time: '07:30',
      status: 'pending'
    },
    { 
      id: 'dog-002', 
      name: 'Luna', 
      breed: 'Labrador', 
      owner: 'Carlos Ruiz',
      pickup_time: '07:45',
      status: 'pending'
    }
  ];

  // ============================================
  // 🚀 INICIALIZACIÓN - SIN SIMULACIONES
  // ============================================
  useEffect(() => {
    initializeRealGPS();
    
    return () => {
      cleanupGPS();
    };
  }, []);

  const initializeRealGPS = async () => {
    console.log('🚀 Inicializando GPS REAL del conductor (sin simulación)...');
    
    // Verificar soporte REAL de geolocalización
    if (!navigator.geolocation) {
      setError('❌ Este dispositivo no tiene GPS. Usa un teléfono móvil o tablet.');
      return;
    }

    // Verificar permisos REALES
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(permission.state);
      
      console.log('📍 Permisos GPS reales:', permission.state);
      
      if (permission.state === 'granted') {
        setConnectionStatus('ready');
        // Obtener ubicación REAL inicial
        getRealLocationNow();
      } else if (permission.state === 'denied') {
        setError('🚫 GPS denegado. Habilita la ubicación en tu navegador.');
      } else {
        setConnectionStatus('permission_needed');
      }
      
    } catch (err) {
      console.log('ℹ️ Verificando permisos directamente...');
      setConnectionStatus('ready');
      getRealLocationNow();
    }
  };

  const cleanupGPS = () => {
    if (watchPositionRef.current) {
      navigator.geolocation.clearWatch(watchPositionRef.current);
      watchPositionRef.current = null;
    }
  };

  // ============================================
  // 📍 OBTENER UBICACIÓN REAL DEL CONDUCTOR
  // ============================================
  const getRealLocationNow = () => {
    console.log('🎯 Obteniendo ubicación GPS REAL...');
    
    const options = {
      enableHighAccuracy: true,    // GPS de alta precisión
      timeout: 20000,              // 20 segundos máximo
      maximumAge: 0                // Siempre obtener nueva ubicación
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ UBICACIÓN REAL OBTENIDA:', {
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          accuracy: Math.round(position.coords.accuracy)
        });
        
        const realLocationData = processRealGPSData(position);
        setRealLocation(realLocationData);
        setLastUpdate(new Date());
        setConnectionStatus('online');
        setError('');
        
        console.log('📍 TU UBICACIÓN REAL:', realLocationData);
      },
      (error) => {
        console.error('❌ Error GPS real:', error);
        handleRealGPSError(error);
      },
      options
    );
  };

  const startRealTimeTracking = () => {
    if (!navigator.geolocation) {
      setError('❌ GPS no disponible en este dispositivo');
      return;
    }

    if (!selectedVehicle) {
      setError('⚠️ Selecciona un vehículo primero');
      return;
    }

    if (selectedDogs.length === 0) {
      setError('⚠️ Selecciona al menos un perro');
      return;
    }

    console.log('🎯 INICIANDO TRACKING GPS REAL...');
    setIsTracking(true);
    setError('');
    setConnectionStatus('tracking');

    // Opciones de máxima precisión para vehículos
    const trackingOptions = {
      enableHighAccuracy: true,     // Usar GPS, no WiFi/cell towers
      timeout: 25000,               // 25 segundos timeout
      maximumAge: 3000              // Máximo 3 segundos de cache
    };

    // Iniciar tracking continuo REAL
    watchPositionRef.current = navigator.geolocation.watchPosition(
      handleRealLocationUpdate,
      handleRealGPSError,
      trackingOptions
    );

    console.log('✅ GPS REAL tracking iniciado, ID:', watchPositionRef.current);
  };

  const stopRealTimeTracking = () => {
    console.log('⏹️ Deteniendo GPS real...');
    
    setIsTracking(false);
    setConnectionStatus('online');

    cleanupGPS();
    
    console.log('✅ GPS real detenido');
  };

  const handleRealLocationUpdate = (position) => {
    const realCoords = position.coords;
    
    console.log('📍 NUEVA UBICACIÓN REAL:', {
      lat: realCoords.latitude.toFixed(8),
      lng: realCoords.longitude.toFixed(8),
      speed: realCoords.speed ? Math.round(realCoords.speed * 3.6) : 0,
      accuracy: Math.round(realCoords.accuracy)
    });
    
    const newRealLocation = processRealGPSData(position);
    
    // Actualizar estado con datos REALES
    setRealLocation(newRealLocation);
    setLastUpdate(new Date());
    setGpsAccuracy(Math.round(realCoords.accuracy));
    
    // Agregar al historial REAL
    setLocationHistory(prev => {
      const newHistory = [...prev, newRealLocation];
      return newHistory.slice(-20); // Mantener últimas 20 ubicaciones
    });

    // Guardar ubicación REAL en base de datos
    saveRealLocationToDatabase(newRealLocation);
  };

  const processRealGPSData = (position) => {
    const coords = position.coords;
    
    return {
      // COORDENADAS REALES del GPS del dispositivo
      latitude: parseFloat(coords.latitude.toFixed(8)),
      longitude: parseFloat(coords.longitude.toFixed(8)),
      
      // DATOS REALES del GPS
      accuracy: Math.round(coords.accuracy || 0),
      speed: coords.speed ? parseFloat((coords.speed * 3.6).toFixed(1)) : 0,
      heading: coords.heading || 0,
      timestamp: new Date().toISOString(),
      
      // METADATOS
      vehicle_id: selectedVehicle,
      is_moving: coords.speed > 0.5, // Real: > 1.8 km/h
      source: 'REAL_GPS_DEVICE' // Marcar como GPS real
    };
  };

  const handleRealGPSError = (error) => {
    console.error('❌ Error GPS REAL:', error);
    
    const realErrorMessages = {
      1: '🚫 Necesitas habilitar ubicación en tu navegador. Ve a la barra de direcciones y haz clic en el candado 🔒',
      2: '📡 Sin señal GPS. Sal al exterior para mejor recepción satelital.',
      3: '⏱️ GPS tardando mucho. Verifica que esté habilitado en tu dispositivo.'
    };
    
    const message = realErrorMessages[error.code] || `❌ Error GPS (${error.code}): ${error.message}`;
    setError(message);
    
    // Reintentar si es timeout
    if (isTracking && error.code === 3) {
      console.log('🔄 Reintentando GPS real en 15 segundos...');
      setTimeout(() => {
        if (isTracking) {
          getRealLocationNow();
        }
      }, 15000);
    }
  };

  const saveRealLocationToDatabase = async (realLocationData) => {
    if (!selectedVehicle) return;

    try {
      // Datos limpios sin campos problemáticos
      const cleanData = {
        vehicle_id: realLocationData.vehicle_id,
        latitude: realLocationData.latitude,
        longitude: realLocationData.longitude,
        speed: realLocationData.speed,
        heading: realLocationData.heading,
        accuracy: realLocationData.accuracy,
        timestamp: realLocationData.timestamp,
        is_moving: realLocationData.is_moving,
        source: realLocationData.source
      };

      const { error } = await supabase
        .from('vehicle_locations')
        .insert(cleanData);

      if (error) {
        console.warn('⚠️ No se pudo guardar (normal en demo):', error.message);
      } else {
        console.log('💾 Ubicación REAL guardada en BD');
      }
    } catch (err) {
      console.warn('⚠️ Error BD (normal en demo):', err.message);
    }
  };

  // ============================================
  // 🐕 GESTIÓN DE PERROS (SIN COORDENADAS FAKE)
  // ============================================
  const toggleDogSelection = (dog) => {
    setSelectedDogs(prev => {
      const isSelected = prev.find(d => d.id === dog.id);
      
      if (isSelected) {
        return prev.filter(d => d.id !== dog.id);
      } else {
        return [...prev, { ...dog, status: 'pending' }];
      }
    });
  };

  const markDogAsPickedUp = (dogId) => {
    setSelectedDogs(prev => 
      prev.map(dog => 
        dog.id === dogId 
          ? { ...dog, status: 'picked_up', pickup_actual_time: new Date().toISOString() }
          : dog
      )
    );
    console.log(`✅ Perro recogido: ${dogId}`);
  };

  // ============================================
  // 🎨 HELPERS VISUALES
  // ============================================
  const getGPSStatusColor = () => {
    switch (connectionStatus) {
      case 'tracking': return 'bg-green-400 animate-pulse';
      case 'online': return 'bg-blue-400';
      case 'ready': return 'bg-yellow-400';
      case 'permission_needed': return 'bg-orange-400';
      default: return 'bg-gray-400';
    }
  };

  const getGPSStatusText = () => {
    switch (connectionStatus) {
      case 'tracking': return 'GPS REAL Activo';
      case 'online': return 'GPS REAL Conectado';
      case 'ready': return 'GPS Listo';
      case 'permission_needed': return 'Permisos Requeridos';
      default: return 'GPS Desconectado';
    }
  };

  const showSuccessNotification = (message) => {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  };

  // ============================================
  // 🎨 COMPONENTE RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#FFFBF0] p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header GPS Real */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl text-white">📍</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#2C3E50]">GPS Real Conductor</h1>
                <p className="text-gray-600">📍 Ubicación real de tu dispositivo</p>
              </div>
            </div>
            
            {/* Estado GPS Real */}
            <div className="text-right">
              <div className="flex items-center justify-end mb-1">
                <div className={`w-3 h-3 rounded-full mr-2 ${getGPSStatusColor()}`}></div>
                <span className="text-sm text-gray-600">{getGPSStatusText()}</span>
              </div>
              <div className="text-xs text-gray-500">
                Permisos: {permissionStatus}
              </div>
              {gpsAccuracy && (
                <div className="text-xs text-green-600">
                  Precisión: {gpsAccuracy}m
                </div>
              )}
            </div>
          </div>

          {/* Mensaje de permisos */}
          {permissionStatus === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <span className="text-red-600 mr-2 text-lg">🚫</span>
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">GPS Bloqueado</h3>
                  <p className="text-red-700 text-sm mb-3">
                    Para usar tu ubicación real, necesitas permitir el acceso:
                  </p>
                  <ol className="text-red-700 text-sm space-y-1 list-decimal list-inside">
                    <li>Haz clic en el 🔒 en la barra de direcciones</li>
                    <li>Cambia "Ubicación" a "Permitir"</li>
                    <li>Recarga la página</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚐 Vehículo
              </label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                disabled={isTracking}
              >
                <option value="">Selecciona...</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} - {vehicle.driver}
                  </option>
                ))}
              </select>
            </div>

            {/* Control GPS */}
            <div className="flex items-end">
              <button
                onClick={isTracking ? stopRealTimeTracking : startRealTimeTracking}
                disabled={!selectedVehicle || selectedDogs.length === 0 || permissionStatus === 'denied'}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  isTracking
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400'
                }`}
              >
                {isTracking ? '⏹️ Detener GPS Real' : '▶️ Iniciar GPS Real'}
              </button>
            </div>
          </div>

          {/* Botón para obtener ubicación manual */}
          {!isTracking && (
            <div className="text-center">
              <button
                onClick={getRealLocationNow}
                disabled={permissionStatus === 'denied'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                📍 Obtener Mi Ubicación Ahora
              </button>
            </div>
          )}
        </div>

        {/* Panel de Ubicación Real */}
        {realLocation && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-[#2C3E50] mb-4">
              📍 Tu Ubicación GPS Real
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600">Latitud Real</div>
                <div className="font-mono text-sm font-bold text-green-700">
                  {realLocation?.latitude ? realLocation.latitude.toFixed(6) : '---'}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600">Longitud Real</div>
                <div className="font-mono text-sm font-bold text-green-700">
                  {realLocation?.longitude ? realLocation.longitude.toFixed(6) : '---'}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600">Velocidad GPS</div>
                <div className="font-semibold text-blue-700">{realLocation?.speed || 0} km/h</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600">Precisión GPS</div>
                <div className="font-semibold text-yellow-700">{realLocation?.accuracy || 0}m</div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${
                  realLocation?.is_moving ? 'bg-green-400' : 'bg-yellow-400'
                }`}></span>
                <span className="text-sm">
                  {realLocation?.is_moving ? '🚗 Te estás moviendo' : '⏸️ Estás detenido'}
                </span>
              </div>
              
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Actualizado: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>

            {locationHistory.length > 1 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700">
                  📊 Ubicaciones GPS reales registradas: {locationHistory.length}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de Perros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">
            🐕 Perros a Recoger ({selectedDogs.length} seleccionados)
          </h2>
          
          <div className="space-y-3">
            {availableDogs.map(dog => {
              const isSelected = selectedDogs.find(d => d.id === dog.id);
              const selectedDog = selectedDogs.find(d => d.id === dog.id);
              
              return (
                <div
                  key={dog.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => !isTracking && toggleDogSelection(dog)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="font-semibold text-[#2C3E50]">{dog.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({dog.breed})</span>
                        {selectedDog && (
                          <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                            selectedDog.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            selectedDog.status === 'picked_up' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {selectedDog.status === 'pending' ? '⏳ Pendiente' :
                             selectedDog.status === 'picked_up' ? '✅ Recogido' :
                             '🏠 Entregado'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        👤 {dog.owner} | 🕐 {dog.pickup_time}
                      </div>
                    </div>
                    
                    {isSelected && isTracking && selectedDog.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markDogAsPickedUp(dog.id);
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 ml-4"
                      >
                        📥 Marcar Recogido
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info del Sistema */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">🔧 Sistema GPS Real</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 text-green-600">✅ Características:</h3>
              <ul className="text-sm space-y-1">
                <li>• Usa GPS real de tu dispositivo</li>
                <li>• Sin simulaciones ni ubicaciones falsas</li>
                <li>• Precisión de hasta {gpsAccuracy || 5} metros</li>
                <li>• Actualizaciones solo cuando te muevas</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-blue-600">📱 Estado:</h3>
              <ul className="text-sm space-y-1">
                <li>• Geolocalización: {typeof window !== 'undefined' && navigator.geolocation ? '✅ Disponible' : '❌ No disponible'}</li>
                <li>• Permisos: {permissionStatus}</li>
                <li>• Tracking: {isTracking ? '🟢 Activo' : '🔴 Inactivo'}</li>
                <li>• Historial: {locationHistory.length} puntos</li>
                <li>• Última ubicación: {realLocation ? '✅ Obtenida' : '❌ Pendiente'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanRealGPSConductor;