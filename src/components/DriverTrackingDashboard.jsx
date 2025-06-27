// src/components/DriverTrackingDashboard.jsx
import { useState, useEffect, useRef } from 'react';

// Crear cliente Supabase directamente
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

// Importar dinámicamente para evitar SSR issues
if (typeof window !== 'undefined') {
  import('@supabase/supabase-js').then(({ createClient }) => {
    supabase = createClient(supabaseUrl, supabaseKey);
  });
}

const DriverTrackingDashboard = () => {
  // Estados principales
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);

  // Ref para el tracking interval
  const trackingIntervalRef = useRef(null);
  const watchPositionRef = useRef(null);

  // Cargar vehículos al iniciar
  useEffect(() => {
    loadVehicles();
    getBatteryLevel();
    return () => {
      // Cleanup al desmontar
      stopTracking();
    };
  }, []);

  // Cargar ruta activa cuando se selecciona vehículo
  useEffect(() => {
    if (selectedVehicle) {
      loadActiveRoute();
    }
  }, [selectedVehicle]);

  // ===============================================
  // 🚐 FUNCIONES DE VEHÍCULOS
  // ===============================================

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('active', true)
        .order('license_plate');

      if (error) throw error;
      setVehicles(data || []);
      
      // Seleccionar primer vehículo por defecto
      if (data && data.length > 0) {
        setSelectedVehicle(data[0]);
      }
    } catch (err) {
      setError(`Error cargando vehículos: ${err.message}`);
      console.error('Error loading vehicles:', err);
    }
  };

  const loadActiveRoute = async () => {
    if (!selectedVehicle) return;

    try {
      // Buscar ruta activa de hoy
      const { data: routeData, error: routeError } = await supabase
        .from('transport_routes')
        .select('*')
        .eq('vehicle_id', selectedVehicle.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .in('status', ['planned', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (routeError) throw routeError;

      if (routeData && routeData.length > 0) {
        setActiveRoute(routeData[0]);
        
        // Cargar paradas de la ruta
        const { data: stopsData, error: stopsError } = await supabase
          .from('route_stops')
          .select(`
            *,
            dogs:dog_id (
              name,
              owner_id,
              profiles:owner_id (
                full_name,
                phone
              )
            )
          `)
          .eq('route_id', routeData[0].id)
          .order('stop_order');

        if (stopsError) throw stopsError;
        setRouteStops(stopsData || []);
      } else {
        setActiveRoute(null);
        setRouteStops([]);
      }
    } catch (err) {
      setError(`Error cargando ruta: ${err.message}`);
      console.error('Error loading route:', err);
    }
  };

  // ===============================================
  // 📍 FUNCIONES DE TRACKING GPS
  // ===============================================

  const startTracking = () => {
    if (!selectedVehicle) {
      setError('Selecciona un vehículo primero');
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este dispositivo');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Opciones de geolocalización de alta precisión
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // 30 segundos
    };

    // Tracking continuo
    watchPositionRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      options
    );

    // También actualizar cada 30 segundos como backup
    trackingIntervalRef.current = setInterval(() => {
      getCurrentLocationOnce();
    }, 30000);

    console.log('🚀 Tracking iniciado para vehículo:', selectedVehicle.license_plate);
  };

  const stopTracking = () => {
    setIsTracking(false);

    // Limpiar watch position
    if (watchPositionRef.current) {
      navigator.geolocation.clearWatch(watchPositionRef.current);
      watchPositionRef.current = null;
    }

    // Limpiar interval
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    console.log('⏹️ Tracking detenido');
  };

  const getCurrentLocationOnce = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      handleLocationUpdate,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleLocationUpdate = async (position) => {
    const { latitude, longitude, heading, speed, accuracy } = position.coords;
    
    const locationData = {
      latitude: parseFloat(latitude.toFixed(8)),
      longitude: parseFloat(longitude.toFixed(8)),
      heading: heading || 0,
      speed: speed ? parseFloat((speed * 3.6).toFixed(2)) : 0, // Convertir m/s a km/h
      accuracy: accuracy || 0,
      is_moving: speed > 1, // Consideramos movimiento si > 1 m/s
      timestamp: new Date().toISOString()
    };

    setCurrentLocation(locationData);
    
    // Guardar en base de datos
    await saveLocationToDatabase(locationData);
    
    setLastUpdate(new Date());
    console.log('📍 Ubicación actualizada:', locationData);
  };

  const handleLocationError = (error) => {
    console.error('Error de geolocalización:', error);
    
    const errorMessages = {
      1: 'Permiso denegado. Habilita la ubicación en tu navegador.',
      2: 'Posición no disponible. Verifica tu conexión GPS.',
      3: 'Tiempo de espera agotado. Intenta de nuevo.'
    };
    
    setError(errorMessages[error.code] || 'Error desconocido de GPS');
  };

  const saveLocationToDatabase = async (locationData) => {
    if (!selectedVehicle) return;

    try {
      const { error } = await supabase
        .from('vehicle_locations')
        .insert({
          vehicle_id: selectedVehicle.id,
          ...locationData
        });

      if (error) throw error;
      
      console.log('✅ Ubicación guardada en BD');
    } catch (err) {
      console.error('❌ Error guardando ubicación:', err);
      // No mostramos error al usuario para no interrumpir el tracking
    }
  };

  // ===============================================
  // 🔋 FUNCIÓN DE BATERÍA
  // ===============================================

  const getBatteryLevel = async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }
    } catch (err) {
      console.log('Info de batería no disponible');
    }
  };

  // ===============================================
  // 🎯 FUNCIONES DE EVENTOS
  // ===============================================

  const markStopAsCompleted = async (stopId) => {
    try {
      const { error } = await supabase
        .from('route_stops')
        .update({
          status: 'completed',
          actual_time: new Date().toISOString()
        })
        .eq('id', stopId);

      if (error) throw error;

      // Recargar paradas
      loadActiveRoute();
      
      // Crear evento de tracking
      await createTrackingEvent('arrived_at_stop', stopId);
      
      console.log('✅ Parada marcada como completada');
    } catch (err) {
      setError(`Error actualizando parada: ${err.message}`);
    }
  };

  const createTrackingEvent = async (eventType, stopId = null) => {
    if (!selectedVehicle || !currentLocation) return;

    try {
      const { error } = await supabase
        .from('tracking_events')
        .insert({
          vehicle_id: selectedVehicle.id,
          route_id: activeRoute?.id,
          stop_id: stopId,
          event_type: eventType,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          description: `Evento ${eventType} registrado`,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      console.log('📝 Evento registrado:', eventType);
    } catch (err) {
      console.error('Error creando evento:', err);
    }
  };

  // ===============================================
  // 🎨 RENDER DEL COMPONENTE
  // ===============================================

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🚐 Control de Ruta</h1>
            <p className="text-blue-100 text-sm">
              {selectedVehicle ? selectedVehicle.license_plate : 'Sin vehículo'}
            </p>
          </div>
          <div className="text-right">
            {batteryLevel && (
              <div className="text-sm">
                🔋 {batteryLevel}%
              </div>
            )}
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-400' : 'bg-gray-400'}`}></div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Selector de Vehículo */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Vehículo
          </label>
          <select 
            value={selectedVehicle?.id || ''} 
            onChange={(e) => {
              const vehicle = vehicles.find(v => v.id === e.target.value);
              setSelectedVehicle(vehicle);
            }}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona un vehículo</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.license_plate} - {vehicle.driver_name}
              </option>
            ))}
          </select>
        </div>

        {/* Control de Tracking */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">📍 Tracking GPS</h3>
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

          <div className="space-y-3">
            <button
              onClick={isTracking ? stopTracking : startTracking}
              disabled={!selectedVehicle}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isTracking 
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300'
              }`}
            >
              {isTracking ? '⏹️ Detener Tracking' : '▶️ Iniciar Tracking'}
            </button>

            {currentLocation && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm space-y-1">
                  <div><strong>Lat:</strong> {currentLocation.latitude}</div>
                  <div><strong>Lng:</strong> {currentLocation.longitude}</div>
                  <div><strong>Velocidad:</strong> {currentLocation.speed} km/h</div>
                  <div><strong>Precisión:</strong> {currentLocation.accuracy}m</div>
                </div>
              </div>
            )}

            {lastUpdate && (
              <p className="text-xs text-gray-600 text-center">
                Última actualización: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Ruta Activa */}
        {activeRoute && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">🛣️ Ruta de Hoy</h3>
            
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="text-sm space-y-1">
                <div><strong>Tipo:</strong> {activeRoute.route_type === 'pickup' ? 'Recoger' : 'Entregar'}</div>
                <div><strong>Estado:</strong> {activeRoute.status}</div>
                <div><strong>Paradas:</strong> {routeStops.length}</div>
              </div>
            </div>

            {/* Lista de Paradas */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Paradas:</h4>
              {routeStops.map((stop, index) => (
                <div key={stop.id} className={`border rounded-lg p-3 ${
                  stop.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {index + 1}. {stop.dogs?.name || 'Perro sin nombre'}
                      </div>
                      <div className="text-xs text-gray-600">{stop.address}</div>
                      {stop.dogs?.profiles?.phone && (
                        <div className="text-xs text-blue-600">📞 {stop.dogs.profiles.phone}</div>
                      )}
                    </div>
                    
                    {stop.status !== 'completed' && isTracking && (
                      <button
                        onClick={() => markStopAsCompleted(stop.id)}
                        className="bg-green-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-600"
                      >
                        ✅ Completar
                      </button>
                    )}
                    
                    {stop.status === 'completed' && (
                      <div className="text-green-600 text-xs font-medium">
                        ✅ Completado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        {isTracking && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">⚡ Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => createTrackingEvent('route_started')}
                className="bg-green-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-green-600"
              >
                🚀 Iniciar Ruta
              </button>
              <button
                onClick={() => createTrackingEvent('route_paused')}
                className="bg-yellow-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-yellow-600"
              >
                ⏸️ Pausar Ruta
              </button>
              <button
                onClick={() => createTrackingEvent('driver_break')}
                className="bg-blue-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-600"
              >
                ☕ Descanso
              </button>
              <button
                onClick={() => createTrackingEvent('emergency_stop')}
                className="bg-red-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-red-600"
              >
                🚨 Emergencia
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverTrackingDashboard;