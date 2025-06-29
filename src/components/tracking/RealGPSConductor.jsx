// src/components/tracking/RealGPSConductor.jsx 
// 🚐 GPS REAL DEL CONDUCTOR - SISTEMA ORIGINAL RESTAURADO
// ✅ Solo se cambió autenticación hardcodeada por authService
import { useState, useEffect, useRef } from 'react';
import supabase from '../../lib/supabase.js';

const RealGPSConductor = ({ currentUser, onClose }) => {
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
  // 🔧 REFS PARA TRACKING (ORIGINALES)
  // ============================================
  const watchPositionRef = useRef(null);
  const trackingStartTime = useRef(null);
  const durationIntervalRef = useRef(null);

  // ============================================
  // 🚐 CARGAR DATOS DE VEHÍCULOS REALES
  // ============================================
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Cargar vehículos reales de la base de datos
  useEffect(() => {
    loadRealVehicles();
  }, []);

  const loadRealVehicles = async () => {
    try {
      console.log('🚐 Cargando vehículos reales desde BD...');
      
      const { data: vehiclesData, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('active', true)
        .order('license_plate');

      if (error) {
        console.error('❌ Error cargando vehículos:', error);
        setLoadingVehicles(false);
        return;
      }

      if (vehiclesData && vehiclesData.length > 0) {
        console.log('✅ Vehículos reales cargados:', vehiclesData.length);
        setVehicles(vehiclesData);
      } else {
        console.log('⚠️ No hay vehículos en BD, usando datos mock');
        setVehicles([
          { 
            id: 'demo-vehicle-1', 
            license_plate: 'DEMO-001', 
            driver_name: 'Conductor Demo',
            capacity: 6,
            model: 'Vehículo Demo'
          }
        ]);
      }
      
      setLoadingVehicles(false);
    } catch (error) {
      console.error('❌ Error en loadRealVehicles:', error);
      setLoadingVehicles(false);
    }
  };

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
      address: 'Avenida 456 #89-01, La Candelaria',
      phone: '+57 302 345 6789',
      pickup_time: '08:00',
      status: 'pending'
    }
  ];

  // ============================================
  // 🚀 EFECTOS (ORIGINALES)
  // ============================================
  useEffect(() => {
    console.log('🚐 RealGPSConductor iniciando...');
    checkGPSSupport();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Auto-actualizar duración cada minuto
    if (isTracking && trackingStartTime.current) {
      const interval = setInterval(() => {
        const duration = Math.floor((new Date() - trackingStartTime.current) / 1000 / 60);
        setTrackingDuration(duration);
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  // ============================================
  // 🧹 CLEANUP (ORIGINAL)
  // ============================================
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
  // 📍 VERIFICAR SOPORTE GPS (ORIGINAL)
  // ============================================
  const checkGPSSupport = async () => {
    console.log('🔍 Verificando soporte GPS del dispositivo...');
    
    if (!navigator.geolocation) {
      setError('❌ Geolocalización no soportada en este dispositivo. Usa un teléfono móvil o tablet.');
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
        getCurrentLocationOnce();
      } else if (permission.state === 'denied') {
        setError('🚫 GPS denegado. Habilita la ubicación en tu navegador.');
      } else {
        setConnectionStatus('permission_needed');
      }
      
    } catch (err) {
      console.log('ℹ️ Verificando permisos directamente...');
      setConnectionStatus('ready');
      getCurrentLocationOnce();
    }
  };

  // ============================================
  // 📍 OBTENER UBICACIÓN UNA VEZ (ORIGINAL)
  // ============================================
  const getCurrentLocationOnce = () => {
    console.log('🎯 Obteniendo ubicación GPS inicial...');
    
    const options = {
      enableHighAccuracy: true,    // GPS de alta precisión
      timeout: 15000,              // 15 segundos máximo
      maximumAge: 60000            // Máximo 1 minuto de cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Ubicación inicial obtenida:', {
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          accuracy: Math.round(position.coords.accuracy)
        });
        
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

  // ============================================
  // 🚀 INICIAR TRACKING REAL (ORIGINAL)
  // ============================================
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

    // Opciones de alta precisión para vehículos (ORIGINALES)
    const watchOptions = {
      enableHighAccuracy: true,
      timeout: 20000, // 20 segundos de timeout
      maximumAge: 5000 // Máximo 5 segundos de cache
    };

    // Iniciar tracking continuo con watchPosition (ORIGINAL)
    watchPositionRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      watchOptions
    );

    console.log('✅ Sistema de tracking iniciado con ID:', watchPositionRef.current);
  };

  // ============================================
  // ⏹️ DETENER TRACKING (ORIGINAL)
  // ============================================
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

  // ============================================
  // 📍 MANEJAR ACTUALIZACIÓN DE UBICACIÓN (ORIGINAL)
  // ============================================
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
    
    // Agregar al historial
    setLocationHistory(prev => {
      const newHistory = [...prev, newLocation];
      return newHistory.slice(-50); // Mantener últimas 50 ubicaciones
    });

    // Guardar en base de datos
    saveLocationToDatabase(newLocation);
  };

  // ============================================
  // 🔧 PROCESAR DATOS GPS (PARA TABLAS REALES)
  // ============================================
  const processLocationData = (position) => {
    const coords = position.coords;
    
    return {
      // Coordenadas reales del GPS del dispositivo
      latitude: parseFloat(coords.latitude.toFixed(8)),
      longitude: parseFloat(coords.longitude.toFixed(8)),
      
      // Datos del GPS
      accuracy: Math.round(coords.accuracy || 0),
      speed: coords.speed ? parseFloat((coords.speed * 3.6).toFixed(1)) : 0,
      heading: coords.heading || 0,
      timestamp: new Date().toISOString(),
      
      // Metadatos
      is_moving: coords.speed > 0.5, // Real: > 1.8 km/h
      source: 'REAL_GPS_DEVICE'
    };
  };

  // ============================================
  // ❌ MANEJAR ERRORES GPS (ORIGINAL)
  // ============================================
  const handleLocationError = (error) => {
    console.error('❌ Error de geolocalización:', error);
    
    const errorMessages = {
      1: '🚫 Permiso denegado. Habilita la ubicación en tu navegador para usar el GPS.',
      2: '📡 Posición no disponible. Verifica tu conexión GPS y que estés al aire libre.',
      3: '⏱️ Tiempo de espera agotado. El GPS está tardando mucho en responder.'
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

  // ============================================
  // 💾 GUARDAR EN BASE DE DATOS (USANDO TABLAS REALES)
  // ============================================
  const saveLocationToDatabase = async (locationData) => {
    if (!selectedVehicle || !currentUser?.id) return;

    try {
      // Obtener o crear ruta activa
      let routeId = await getOrCreateActiveRoute();

      // Crear objeto limpio para las tablas reales
      const cleanLocationData = {
        vehicle_id: selectedVehicle,
        route_id: routeId,
        driver_id: currentUser.id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: locationData.speed,
        heading: locationData.heading,
        accuracy: locationData.accuracy,
        location_timestamp: locationData.timestamp,
        device_timestamp: locationData.timestamp,
        is_moving: locationData.is_moving,
        source: locationData.source
      };

      console.log('💾 Guardando ubicación real en BD:', cleanLocationData);

      const { error } = await supabase
        .from('vehicle_locations')
        .insert(cleanLocationData);

      if (error) {
        console.error('❌ Error guardando en BD:', error.message);
      } else {
        console.log('✅ Ubicación guardada en base de datos real');
      }
    } catch (err) {
      console.error('❌ Error en saveLocationToDatabase:', err.message);
    }
  };

  // ============================================
  // 🛣️ OBTENER O CREAR RUTA ACTIVA
  // ============================================
  const getOrCreateActiveRoute = async () => {
    try {
      // Buscar ruta activa existente
      const { data: existingRoute, error: routeError } = await supabase
        .from('vehicle_routes')
        .select('id')
        .eq('vehicle_id', selectedVehicle)
        .eq('driver_id', currentUser.id)
        .eq('status', 'in_progress')
        .single();

      if (existingRoute && !routeError) {
        console.log('✅ Usando ruta activa existente:', existingRoute.id);
        return existingRoute.id;
      }

      // Crear nueva ruta si no existe
      console.log('🆕 Creando nueva ruta...');
      
      const dogIds = selectedDogs.map(dog => dog.id);
      
      const { data: newRoute, error: createError } = await supabase
        .from('vehicle_routes')
        .insert({
          vehicle_id: selectedVehicle,
          driver_id: currentUser.id,
          route_name: `Ruta ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`,
          status: 'in_progress',
          dog_ids: dogIds,
          actual_start_time: new Date().toISOString(),
          notes: 'Ruta creada automáticamente desde GPS del conductor'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('❌ Error creando ruta:', createError);
        return null;
      }

      console.log('✅ Nueva ruta creada:', newRoute.id);
      return newRoute.id;

    } catch (error) {
      console.error('❌ Error en getOrCreateActiveRoute:', error);
      return null;
    }
  };

  // ============================================
  // 🐕 GESTIÓN DE PERROS (ORIGINAL)
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
  // 🎨 RENDER (ORIGINAL CON BOTÓN CLOSE)
  // ============================================
  return (
    <div className="min-h-screen bg-[#FFFBF0] p-4">
      
      {/* Header con botón de cerrar */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🚐 GPS Real del Conductor</h1>
            <p className="text-blue-100">
              Sistema de tracking en tiempo real - {currentUser?.full_name || 'Conductor'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-6xl opacity-30">📍</div>
            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
              title="Cerrar GPS"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Estado de conexión */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2C3E50]">📡 Estado del GPS</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            connectionStatus === 'tracking' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'online' ? 'bg-blue-100 text-blue-800' :
            connectionStatus === 'ready' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {connectionStatus === 'tracking' && '🟢 Tracking Activo'}
            {connectionStatus === 'online' && '🔵 GPS Online'}
            {connectionStatus === 'ready' && '🟡 Listo'}
            {connectionStatus === 'offline' && '🔴 Desconectado'}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">GPS: </span>
            <span className="font-semibold">
              {navigator.geolocation ? '✅ Soportado' : '❌ No soportado'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Permisos: </span>
            <span className="font-semibold">{permissionStatus}</span>
          </div>
          <div>
            <span className="text-gray-600">Tracking: </span>
            <span className="font-semibold">{isTracking ? '✅ Activo' : '❌ Inactivo'}</span>
          </div>
          <div>
            <span className="text-gray-600">Ubicaciones: </span>
            <span className="font-semibold">{locationHistory.length}</span>
          </div>
        </div>

        {lastUpdate && (
          <div className="mt-4 text-sm text-gray-600">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Selección de vehículo */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-[#2C3E50] mb-4">🚐 Seleccionar Vehículo</h2>
        
        {loadingVehicles ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#56CCF2] mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Cargando vehículos disponibles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((vehicle) => (
              <div 
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedVehicle === vehicle.id 
                    ? 'border-[#56CCF2] bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {vehicle.license_plate}
                    </div>
                    <div className="text-sm text-gray-600">
                      {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500">
                      Conductor: {vehicle.driver_name}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Capacidad: {vehicle.capacity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loadingVehicles && vehicles.length === 0 && (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🚐</div>
            <p className="text-gray-600">No hay vehículos disponibles</p>
            <p className="text-sm text-gray-500 mt-1">Contacta al administrador</p>
          </div>
        )}
      </div>

      {/* Selección de perros */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-[#2C3E50] mb-4">🐕 Perros para la Ruta</h2>
        <div className="space-y-3">
          {availableDogs.map((dog) => {
            const isSelected = selectedDogs.find(d => d.id === dog.id);
            const dogStatus = isSelected?.status || 'not_selected';
            
            return (
              <div 
                key={dog.id}
                className={`border rounded-lg p-4 ${
                  isSelected ? 'border-[#56CCF2] bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={() => toggleDogSelection(dog)}
                      className="w-4 h-4 text-[#56CCF2] focus:ring-[#56CCF2]"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {dog.name} ({dog.breed})
                      </div>
                      <div className="text-sm text-gray-600">
                        Dueño: {dog.owner}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dog.address} • {dog.phone}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-600">
                      {dog.pickup_time}
                    </div>
                    
                    {isSelected && (
                      <div className="flex space-x-1">
                        {dogStatus === 'pending' && (
                          <button
                            onClick={() => markDogAsPickedUp(dog.id)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                          >
                            Recoger
                          </button>
                        )}
                        {dogStatus === 'picked_up' && (
                          <button
                            onClick={() => markDogAsDelivered(dog.id)}
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                          >
                            Entregar
                          </button>
                        )}
                        {dogStatus === 'delivered' && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            ✅ Entregado
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel de control principal */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-[#2C3E50] mb-4">⚡ Control de Tracking</h2>
        
        <div className="space-y-4">
          {/* Información de duración */}
          {isTracking && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-green-800">🕐 Tracking Activo</div>
                  <div className="text-green-600">
                    Duración: {trackingDuration} minutos
                  </div>
                </div>
                <div className="text-green-600">
                  Ubicaciones registradas: {locationHistory.length}
                </div>
              </div>
            </div>
          )}

          {/* Botones de control */}
          <div className="flex space-x-4">
            <button
              onClick={isTracking ? stopRealTimeTracking : startRealTimeTracking}
              disabled={!selectedVehicle || selectedDogs.length === 0 || permissionStatus === 'denied'}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                isTracking
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
              }`}
            >
              {isTracking ? '⏹️ Detener Tracking' : '▶️ Iniciar Tracking GPS'}
            </button>
            
            {!isTracking && (
              <button
                onClick={getCurrentLocationOnce}
                disabled={permissionStatus === 'denied'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                📍 Ubicación Manual
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Panel de ubicación actual */}
      {currentLocation && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">📍 Tu Ubicación GPS Real</h2>
          
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

          {/* Estado de movimiento */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${
                currentLocation.is_moving ? 'bg-green-400' : 'bg-yellow-400'
              }`}></span>
              <span className="text-sm">
                {currentLocation.is_moving ? '🚗 En movimiento' : '⏸️ Detenido'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {lastUpdate?.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Panel de información técnica */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#2C3E50] mb-4">🔧 Información Técnica</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Estado del Sistema:</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Geolocalización: {navigator.geolocation ? '✅ Soportada' : '❌ No soportada'}</li>
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
  );
};

export default RealGPSConductor;