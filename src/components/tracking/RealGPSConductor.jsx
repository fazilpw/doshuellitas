// src/components/tracking/RealGPSConductor.jsx - GPS REAL DEL CONDUCTOR
import { useState, useEffect, useRef } from 'react';
import supabase from '../../lib/supabase.js';

const RealGPSConductor = () => {
  // ============================================
  // 🔧 ESTADOS PRINCIPALES
  // ============================================
  const [isTracking, setIsTracking] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [error, setError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [locationHistory, setLocationHistory] = useState([]);
  const [trackingDuration, setTrackingDuration] = useState(0);

  // ============================================
  // 🔧 REFS PARA TRACKING
  // ============================================
  const watchPositionRef = useRef(null);
  const trackingStartTime = useRef(null);
  const durationIntervalRef = useRef(null);

  // ============================================
  // 🚐 DATOS DE VEHÍCULOS Y PERROS
  // ============================================
  const vehicles = [
    { 
      id: 'vehicle-001', 
      license_plate: 'ABC-123', 
      driver: 'Juan Carlos',
      capacity: 6,
      model: 'Toyota Hiace 2020'
    },
    { 
      id: 'vehicle-002', 
      license_plate: 'DEF-456', 
      driver: 'María López',
      capacity: 8,
      model: 'Chevrolet N300 2021'
    }
  ];

  const availableDogs = [
    { 
      id: 'dog-001', 
      name: 'Max', 
      breed: 'Golden Retriever', 
      owner: 'María García',
      address: 'Calle 123 #45-67, Chapinero',
      phone: '+57 300 123 4567',
      pickup_time: '07:30',
      status: 'pending'
    },
    { 
      id: 'dog-002', 
      name: 'Luna', 
      breed: 'Labrador', 
      owner: 'Carlos Ruiz',
      address: 'Carrera 78 #12-34, Zona Rosa',
      phone: '+57 301 234 5678',
      pickup_time: '07:45',
      status: 'pending'
    },
    { 
      id: 'dog-003', 
      name: 'Rocky', 
      breed: 'Pastor Alemán', 
      owner: 'Ana López',
      address: 'Avenida 68 #89-12, Chapinero Alto',
      phone: '+57 302 345 6789',
      pickup_time: '08:00',
      status: 'pending'
    }
  ];

  // ============================================
  // 🚀 EFECTOS DE INICIALIZACIÓN
  // ============================================
  useEffect(() => {
    initializeConductorSystem();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeConductorSystem = async () => {
    console.log('🚀 Inicializando sistema GPS del conductor...');
    
    // Verificar soporte de geolocalización
    if (!navigator.geolocation) {
      setError('❌ Geolocalización no soportada en este dispositivo');
      return;
    }

    // Verificar permisos
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(permission.state);
      
      permission.addEventListener('change', () => {
        setPermissionStatus(permission.state);
      });

      console.log('📍 Estado de permisos GPS:', permission.state);
      
      if (permission.state === 'denied') {
        setError('🚫 Permisos de ubicación denegados. Habilita la ubicación en tu navegador.');
      } else if (permission.state === 'granted') {
        setConnectionStatus('ready');
        // Obtener ubicación inicial para verificar
        getCurrentLocationOnce();
      } else {
        setConnectionStatus('permission_needed');
      }
      
    } catch (err) {
      console.log('ℹ️ No se pudieron verificar permisos, intentando acceso directo');
      setConnectionStatus('ready');
      getCurrentLocationOnce();
    }
  };

  const cleanup = () => {
    if (watchPositionRef.current) {
      navigator.geolocation.clearWatch(watchPositionRef.current);
      watchPositionRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  // ============================================
  // 📍 OBTENER UBICACIÓN REAL DEL CONDUCTOR
  // ============================================
  const getCurrentLocationOnce = () => {
    console.log('🎯 Obteniendo ubicación actual del conductor...');
    
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Ubicación inicial obtenida:', position.coords);
        setConnectionStatus('online');
        setError('');
        
        const location = processLocationData(position);
        setCurrentLocation(location);
        setLastUpdate(new Date());
      },
      (error) => {
        console.error('❌ Error obteniendo ubicación inicial:', error);
        handleLocationError(error);
      },
      options
    );
  };

  const startRealTimeTracking = () => {
    if (!navigator.geolocation) {
      setError('❌ Geolocalización no soportada');
      return;
    }

    if (!selectedVehicle) {
      setError('⚠️ Selecciona un vehículo primero');
      return;
    }

    if (selectedDogs.length === 0) {
      setError('⚠️ Selecciona al menos un perro para la ruta');
      return;
    }

    console.log('🎯 Iniciando tracking GPS en tiempo real...');
    setIsTracking(true);
    setError('');
    setConnectionStatus('tracking');
    trackingStartTime.current = new Date();
    
    // Iniciar contador de duración
    durationIntervalRef.current = setInterval(() => {
      if (trackingStartTime.current) {
        const duration = Math.floor((new Date() - trackingStartTime.current) / 1000 / 60);
        setTrackingDuration(duration);
      }
    }, 60000); // Actualizar cada minuto

    // Opciones de alta precisión para vehículos
    const watchOptions = {
      enableHighAccuracy: true,
      timeout: 20000, // 20 segundos de timeout
      maximumAge: 5000 // Máximo 5 segundos de cache
    };

    // Iniciar tracking continuo con watchPosition
    watchPositionRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      watchOptions
    );

    console.log('✅ Sistema de tracking iniciado con ID:', watchPositionRef.current);
  };

  const stopRealTimeTracking = () => {
    console.log('⏹️ Deteniendo tracking GPS...');
    
    setIsTracking(false);
    setConnectionStatus('online');
    setTrackingDuration(0);

    // Limpiar watchers e intervalos
    cleanup();

    // Guardar datos finales si es necesario
    if (locationHistory.length > 0) {
      console.log(`📊 Tracking completado: ${locationHistory.length} puntos registrados`);
    }
    
    console.log('✅ Tracking detenido correctamente');
  };

  const handleLocationUpdate = (position) => {
    console.log('📍 Nueva ubicación recibida del GPS:', {
      lat: position.coords.latitude.toFixed(6),
      lng: position.coords.longitude.toFixed(6),
      accuracy: Math.round(position.coords.accuracy),
      speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0
    });
    
    const newLocation = processLocationData(position);
    
    // Actualizar estado
    setCurrentLocation(newLocation);
    setLastUpdate(new Date());
    setError(''); // Limpiar errores si la ubicación es exitosa
    
    // Agregar al historial
    setLocationHistory(prev => {
      const newHistory = [...prev, newLocation];
      // Mantener solo las últimas 50 ubicaciones para performance
      return newHistory.slice(-50);
    });

    // Guardar en base de datos (opcional)
    saveLocationToDatabase(newLocation);
  };

  const processLocationData = (position) => {
    const coords = position.coords;
    
    return {
      latitude: parseFloat(coords.latitude.toFixed(8)),
      longitude: parseFloat(coords.longitude.toFixed(8)),
      accuracy: Math.round(coords.accuracy || 0),
      speed: coords.speed ? parseFloat((coords.speed * 3.6).toFixed(1)) : 0, // m/s a km/h
      heading: coords.heading || 0,
      timestamp: new Date().toISOString(),
      vehicle_id: selectedVehicle,
      is_moving: coords.speed > 0.5, // Movimiento si > 0.5 m/s (1.8 km/h)
      driver_id: 'conductor-001' // En producción viene del usuario logueado
      // Remover altitude para evitar errores de BD
    };
  };

  const handleLocationError = (error) => {
    console.error('❌ Error de geolocalización:', error);
    
    const errorMessages = {
      1: '🚫 Permisos de ubicación denegados. Ve a Configuración > Privacidad > Ubicación y habilita el acceso para este sitio.',
      2: '📡 Señal GPS no disponible. Sal al exterior o muévete a un área con mejor cobertura satelital.',
      3: '⏱️ Tiempo de espera agotado. Verifica que el GPS esté habilitado en tu dispositivo.'
    };
    
    const message = errorMessages[error.code] || `❌ Error GPS desconocido (código: ${error.code})`;
    setError(message);
    
    // Si estamos tracking y hay error, intentar reconectar
    if (isTracking && error.code === 3) {
      console.log('🔄 Reintentando conexión GPS en 10 segundos...');
      setTimeout(() => {
        if (isTracking) {
          console.log('🔄 Reintentando obtener ubicación...');
          getCurrentLocationOnce();
        }
      }, 10000);
    }
  };

  const saveLocationToDatabase = async (locationData) => {
    // Solo intentar guardar si tenemos configuración de Supabase
    if (!selectedVehicle) return;

    try {
      // Crear objeto limpio solo con campos que existen en la tabla
      const cleanLocationData = {
        vehicle_id: locationData.vehicle_id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: locationData.speed,
        heading: locationData.heading,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp,
        is_moving: locationData.is_moving
        // Remover 'altitude' y otros campos que pueden no existir
      };

      const { error } = await supabase
        .from('vehicle_locations')
        .insert(cleanLocationData);

      if (error) {
        console.warn('⚠️ No se pudo guardar en BD (normal en demo):', error.message);
      } else {
        console.log('💾 Ubicación guardada en base de datos');
      }
    } catch (err) {
      console.warn('⚠️ Error de BD (normal en demo):', err.message);
    }
  };

  // ============================================
  // 🐕 GESTIÓN DE PERROS
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

  const markDogAsDelivered = (dogId) => {
    setSelectedDogs(prev => 
      prev.map(dog => 
        dog.id === dogId 
          ? { ...dog, status: 'delivered', delivery_time: new Date().toISOString() }
          : dog
      )
    );

    console.log(`🏠 Perro entregado: ${dogId}`);
  };

  // ============================================
  // 🎨 HELPER FUNCTIONS
  // ============================================
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'tracking': return 'bg-green-400 animate-pulse';
      case 'online': return 'bg-blue-400';
      case 'ready': return 'bg-yellow-400';
      case 'permission_needed': return 'bg-orange-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'tracking': return 'GPS Activo - Tracking';
      case 'online': return 'GPS Conectado';
      case 'ready': return 'Listo para iniciar';
      case 'permission_needed': return 'Permisos requeridos';
      default: return 'Desconectado';
    }
  };

  // ============================================
  // 🎨 COMPONENTE DE RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#FFFBF0] p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header del Conductor */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl text-white">🚐</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#2C3E50]">GPS Conductor</h1>
                <p className="text-gray-600">Ubicación real en tiempo real</p>
              </div>
            </div>
            
            {/* Estado GPS */}
            <div className="text-right">
              <div className="flex items-center justify-end mb-1">
                <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor()}`}></div>
                <span className="text-sm text-gray-600">{getStatusText()}</span>
              </div>
              <div className="text-xs text-gray-500">
                Permisos: {permissionStatus}
              </div>
              {isTracking && trackingDuration > 0 && (
                <div className="text-xs text-blue-600">
                  Tracking: {trackingDuration} min
                </div>
              )}
            </div>
          </div>

          {/* Instrucciones de Permisos */}
          {permissionStatus === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <span className="text-red-600 mr-2 text-lg">🚫</span>
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">Permisos de Ubicación Requeridos</h3>
                  <p className="text-red-700 text-sm mb-3">
                    Para usar el tracking GPS, necesitas habilitar los permisos de ubicación:
                  </p>
                  <ol className="text-red-700 text-sm space-y-1 list-decimal list-inside">
                    <li>Haz clic en el icono de candado 🔒 en la barra de direcciones</li>
                    <li>Selecciona "Permitir" para Ubicación</li>
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

          {/* Configuración Inicial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚐 Seleccionar Vehículo
              </label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isTracking}
              >
                <option value="">Selecciona vehículo...</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} - {vehicle.driver}
                  </option>
                ))}
              </select>
            </div>

            {/* Control Principal */}
            <div className="flex items-end">
              <button
                onClick={isTracking ? stopRealTimeTracking : startRealTimeTracking}
                disabled={!selectedVehicle || selectedDogs.length === 0 || permissionStatus === 'denied'}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  isTracking
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                }`}
              >
                {isTracking ? '⏹️ Detener Tracking' : '▶️ Iniciar Tracking GPS'}
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Ubicación Actual */}
        {currentLocation && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-[#2C3E50] mb-4">📍 Tu Ubicación Actual (GPS Real)</h2>
            
            {/* Datos GPS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Latitud</div>
                <div className="font-mono text-sm font-semibold">{currentLocation.latitude.toFixed(6)}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Longitud</div>
                <div className="font-mono text-sm font-semibold">{currentLocation.longitude.toFixed(6)}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Velocidad</div>
                <div className="font-semibold">{currentLocation.speed} km/h</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Precisión GPS</div>
                <div className="font-semibold">{currentLocation.accuracy} metros</div>
              </div>
            </div>

            {/* Estado de Movimiento */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${
                  currentLocation.is_moving ? 'bg-green-400' : 'bg-yellow-400'
                }`}></span>
                <span className="text-sm">
                  {currentLocation.is_moving ? '🚗 En movimiento' : '⏸️ Detenido'}
                </span>
              </div>
              
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Actualizado: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Historial de Ubicaciones */}
            {locationHistory.length > 1 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  📊 Puntos GPS registrados: {locationHistory.length}
                </div>
                <div className="text-xs text-gray-500">
                  Última actualización hace {Math.round((new Date() - lastUpdate) / 1000)} segundos
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de Perros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">
            🐕 Perros para Recoger ({selectedDogs.length} seleccionados)
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
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => !isTracking && toggleDogSelection(dog)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="font-semibold text-[#2C3E50]">{dog.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({dog.breed})</span>
                        {selectedDog && (
                          <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                            selectedDog.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            selectedDog.status === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {selectedDog.status === 'pending' ? '⏳ Pendiente' :
                             selectedDog.status === 'picked_up' ? '🚐 Recogido' :
                             '✅ Entregado'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>👤 {dog.owner} | 📞 {dog.phone}</div>
                        <div>📍 {dog.address}</div>
                        <div>🕐 Horario: {dog.pickup_time}</div>
                      </div>
                    </div>
                    
                    {isSelected && isTracking && (
                      <div className="ml-4 flex space-x-2">
                        {selectedDog.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markDogAsPickedUp(dog.id);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            📥 Recoger
                          </button>
                        )}
                        {selectedDog.status === 'picked_up' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markDogAsDelivered(dog.id);
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            🏠 Entregar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ayuda y Debug Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">🔧 Información del Sistema</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Estado GPS:</h3>
              <ul className="text-sm space-y-1">
                <li>• Geolocalización: {typeof window !== 'undefined' && navigator.geolocation ? '✅ Soportada' : '❌ No soportada'}</li>
                <li>• Permisos: {permissionStatus}</li>
                <li>• Tracking activo: {isTracking ? '✅ Sí' : '❌ No'}</li>
                <li>• Ubicaciones registradas: {locationHistory.length}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Consejos para mejor GPS:</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Mantén el dispositivo al aire libre</li>
                <li>• Evita áreas con edificios altos</li>
                <li>• Verifica que el GPS esté habilitado</li>
                <li>• Dale tiempo al GPS para obtener señal</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealGPSConductor;