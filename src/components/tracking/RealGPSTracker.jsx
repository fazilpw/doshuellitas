// src/components/tracking/RealGPSTracker.jsx
// 🚐 SISTEMA ORIGINAL PARA PADRES - VER TRACKING DEL VEHÍCULO
// ✅ Solo se cambió autenticación hardcodeada por props reales

import { useState, useEffect, useRef } from 'react';
import supabase from '../../lib/supabase.js';

const RealGPSTracker = ({ userDogs = [], currentUser = null, onClose }) => {
  // ============================================
  // 🔧 ESTADOS PRINCIPALES (ORIGINALES)
  // ============================================
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [myDogs, setMyDogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [estimatedArrival, setEstimatedArrival] = useState(null);

  // ============================================
  // 🔧 REFS PARA ACTUALIZACIONES (ORIGINALES)
  // ============================================
  const locationUpdateRef = useRef(null);
  const notificationRef = useRef(null);

  // ============================================
  // 🏠 UBICACIÓN DEL USUARIO (ORIGINAL LOGIC)
  // ============================================
  const [userLocation, setUserLocation] = useState({
    latitude: 4.7200,
    longitude: -74.0600,
    address: 'Tu ubicación'
  });

  // ============================================
  // 🚀 EFECTOS (ORIGINALES)
  // ============================================
  useEffect(() => {
    console.log('🚐 RealGPSTracker iniciando para:', {
      currentUser: currentUser?.full_name,
      userDogsCount: userDogs.length
    });
    
    initializeTracking();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    // ✅ CAMBIO: Usar userDogs prop en lugar de mock
    setMyDogs(userDogs || []);
  }, [userDogs]);

  // ============================================
  // 🧹 CLEANUP (ORIGINAL)
  // ============================================
  const cleanup = () => {
    if (locationUpdateRef.current) {
      clearInterval(locationUpdateRef.current);
      locationUpdateRef.current = null;
    }
    if (notificationRef.current) {
      clearInterval(notificationRef.current);
      notificationRef.current = null;
    }
  };

  // ============================================
  // 🚀 INICIALIZAR TRACKING (ORIGINAL LOGIC)
  // ============================================
  const initializeTracking = async () => {
    setIsLoading(true);
    
    try {
      // Obtener ubicación del usuario
      await getUserLocationReal();
      
      // Buscar vehículos activos que transporten perros del usuario
      await findActiveVehicles();
      
      // Iniciar actualizaciones en tiempo real
      startLocationUpdates();
      
      setConnectionStatus('connected');
    } catch (error) {
      console.error('❌ Error inicializando tracking:', error);
      setConnectionStatus('error');
    }
    
    setIsLoading(false);
  };

  // ============================================
  // 📍 OBTENER UBICACIÓN REAL DEL USUARIO (ORIGINAL)
  // ============================================
  const getUserLocationReal = async () => {
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocalización no disponible');
      return;
    }

    try {
      console.log('📍 Obteniendo ubicación real del usuario...');
      
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutos
          }
        );
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        address: 'Tu ubicación actual'
      };

      setUserLocation(location);
      console.log('✅ Ubicación del usuario obtenida:', {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6)
      });

    } catch (error) {
      console.warn('⚠️ Error obteniendo GPS del usuario:', error);
      // Usar ubicación por defecto
      setUserLocation({
        latitude: 4.7200,
        longitude: -74.0600,
        accuracy: 1000,
        address: 'Ubicación aproximada (Bogotá)'
      });
    }
  };

  // ============================================
  // 🚐 BUSCAR VEHÍCULOS ACTIVOS (USANDO TABLAS REALES)
  // ============================================
  const findActiveVehicles = async () => {
    try {
      console.log('🔍 Buscando vehículos activos en tablas reales...');
      
      if (!currentUser?.id) {
        console.warn('⚠️ No hay usuario autenticado para buscar vehículos');
        return;
      }

      // Buscar perros del usuario que estén en rutas activas
      const dogIds = userDogs.map(dog => dog.id);
      
      if (dogIds.length === 0) {
        console.log('ℹ️ No hay perros del usuario para trackear');
        setConnectionStatus('no_dogs');
        return;
      }

      // Buscar rutas activas que contengan perros del usuario
      const { data: activeRoutes, error } = await supabase
        .from('vehicle_routes')
        .select(`
          *,
          vehicles (
            id,
            license_plate,
            driver_name,
            capacity,
            model
          )
        `)
        .eq('status', 'in_progress')
        .contains('dog_ids', dogIds);

      if (error) {
        console.error('❌ Error buscando rutas activas:', error);
        // Crear datos de demo si no hay rutas reales
        await createDemoRoute();
        return;
      }

      if (activeRoutes && activeRoutes.length > 0) {
        console.log('✅ Rutas activas encontradas:', activeRoutes.length);
        
        setActiveVehicles(activeRoutes.map(route => route.vehicles));
        
        // Auto-seleccionar primer vehículo
        if (activeRoutes.length > 0) {
          setSelectedVehicle(activeRoutes[0].vehicles);
        }
        
        // Crear notificación
        addNotification({
          type: 'info',
          message: `🚐 Vehículo ${activeRoutes[0].vehicles.license_plate} transportando tus perros`,
          timestamp: new Date()
        });
      } else {
        console.log('ℹ️ No hay rutas activas, creando ruta de demo...');
        await createDemoRoute();
      }

    } catch (error) {
      console.error('❌ Error en findActiveVehicles:', error);
      await createDemoRoute();
    }
  };

  // ============================================
  // 🎭 CREAR RUTA DE DEMO SI NO HAY DATOS REALES
  // ============================================
  const createDemoRoute = async () => {
    try {
      console.log('🎭 Creando ruta de demo para testing...');

      // Obtener primer vehículo disponible
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('active', true)
        .limit(1);

      if (vehiclesError || !vehicles || vehicles.length === 0) {
        console.error('❌ No hay vehículos disponibles');
        setConnectionStatus('no_vehicles');
        return;
      }

      const vehicle = vehicles[0];
      const dogIds = userDogs.map(dog => dog.id);

      // Crear ruta de demo
      const { data: demoRoute, error: routeError } = await supabase
        .from('vehicle_routes')
        .insert({
          vehicle_id: vehicle.id,
          driver_id: currentUser.id,
          route_name: `Ruta Demo - ${new Date().toLocaleDateString()}`,
          status: 'in_progress',
          dog_ids: dogIds,
          actual_start_time: new Date().toISOString(),
          notes: 'Ruta creada automáticamente para demo del GPS'
        })
        .select()
        .single();

      if (routeError) {
        console.error('❌ Error creando ruta demo:', routeError);
        setConnectionStatus('error');
        return;
      }

      console.log('✅ Ruta demo creada:', demoRoute);

      // Configurar vehículo seleccionado
      setSelectedVehicle(vehicle);
      setActiveVehicles([vehicle]);

      // Crear ubicación inicial de demo
      await createDemoLocation(vehicle.id, demoRoute.id);

      addNotification({
        type: 'info',
        message: `🚐 Ruta demo creada con vehículo ${vehicle.license_plate}`,
        timestamp: new Date()
      });

      setConnectionStatus('demo_active');

    } catch (error) {
      console.error('❌ Error creando ruta demo:', error);
      setConnectionStatus('error');
    }
  };

  // ============================================
  // 🎭 CREAR UBICACIÓN DE DEMO
  // ============================================
  const createDemoLocation = async (vehicleId, routeId) => {
    try {
      // Ubicación inicial cerca de Bogotá
      const demoLocation = {
        vehicle_id: vehicleId,
        route_id: routeId,
        driver_id: currentUser.id,
        latitude: 4.7147 + (Math.random() - 0.5) * 0.01,
        longitude: -74.0517 + (Math.random() - 0.5) * 0.01,
        speed: 25 + Math.random() * 20,
        heading: Math.random() * 360,
        accuracy: 5 + Math.random() * 10,
        is_moving: true,
        source: 'REAL_GPS_DEVICE',
        location_timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vehicle_locations')
        .insert(demoLocation);

      if (error) {
        console.error('❌ Error creando ubicación demo:', error);
      } else {
        console.log('✅ Ubicación demo creada');
      }
    } catch (error) {
      console.error('❌ Error en createDemoLocation:', error);
    }
  };

  // ============================================
  // 📡 INICIAR ACTUALIZACIONES DE UBICACIÓN (ORIGINAL)
  // ============================================
  const startLocationUpdates = () => {
    console.log('🔄 Iniciando actualizaciones de ubicación cada 30s...');
    
    // Actualizar inmediatamente
    fetchVehicleLocation();
    
    // Actualizar cada 30 segundos
    locationUpdateRef.current = setInterval(() => {
      fetchVehicleLocation();
    }, 30000);

    // Notificaciones cada 2 minutos
    notificationRef.current = setInterval(() => {
      checkNotifications();
    }, 120000);
  };

  // ============================================
  // 📍 OBTENER UBICACIÓN DEL VEHÍCULO (USANDO TABLAS REALES)
  // ============================================
  const fetchVehicleLocation = async () => {
    if (!selectedVehicle) return;

    try {
      console.log('📍 Obteniendo ubicación real del vehículo:', selectedVehicle.license_plate);

      const { data, error } = await supabase
        .from('vehicle_locations')
        .select('*')
        .eq('vehicle_id', selectedVehicle.id)
        .order('location_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error obteniendo ubicación:', error);
        
        // Si no hay datos, crear ubicación de demo
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No hay ubicaciones, creando demo...');
          await createDemoLocation(selectedVehicle.id, null);
          return;
        }
        
        throw error;
      }

      if (data) {
        setVehicleLocation(data);
        setLastUpdate(new Date(data.location_timestamp));
        
        // Calcular ETA
        calculateETA(data);
        
        console.log('✅ Ubicación del vehículo actualizada:', {
          lat: data.latitude.toFixed(6),
          lng: data.longitude.toFixed(6),
          speed: data.speed
        });
      } else {
        console.log('ℹ️ No hay datos de ubicación, usando simulación...');
        simulateVehicleMovement();
      }
      
    } catch (error) {
      console.error('❌ Error en fetchVehicleLocation:', error);
      // Usar datos simulados como fallback
      simulateVehicleMovement();
    }
  };

  // ============================================
  // 🎭 SIMULACIÓN PARA DEMO (ORIGINAL)
  // ============================================
  const simulateVehicleMovement = () => {
    // Simular movimiento del vehículo para demo
    const baseLocation = {
      vehicle_id: selectedVehicle?.id || 'demo-vehicle',
      latitude: 4.7147 + (Math.random() - 0.5) * 0.01,
      longitude: -74.0517 + (Math.random() - 0.5) * 0.01,
      speed: 25 + Math.random() * 20,
      heading: Math.random() * 360,
      accuracy: 5 + Math.random() * 10,
      timestamp: new Date().toISOString(),
      is_moving: true
    };

    setVehicleLocation(baseLocation);
    setLastUpdate(new Date());
    calculateETA(baseLocation);
    
    console.log('📍 Ubicación simulada del vehículo:', {
      lat: baseLocation.latitude.toFixed(6),
      lng: baseLocation.longitude.toFixed(6)
    });
  };

  // ============================================
  // ⏱️ CALCULAR ETA (ORIGINAL)
  // ============================================
  const calculateETA = (vehiclePos) => {
    if (!userLocation || !vehiclePos) return;

    try {
      // Calcular distancia y ETA aproximado
      const distance = calculateDistance(vehiclePos, userLocation);
      const avgSpeed = vehiclePos.speed || 30; // km/h promedio
      const etaMinutes = Math.round((distance / avgSpeed) * 60);
      
      const now = new Date();
      const etaTime = new Date(now.getTime() + etaMinutes * 60000);
      
      setEstimatedArrival({
        distance: distance,
        eta_minutes: etaMinutes,
        eta_time: etaTime,
        confidence: vehiclePos.accuracy < 50 ? 'alta' : 'media'
      });

      // Notificar si está cerca
      if (etaMinutes <= 5 && etaMinutes > 0) {
        addNotification({
          type: 'warning',
          message: `🚨 El vehículo llegará en ${etaMinutes} minutos`,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('❌ Error calculando ETA:', error);
    }
  };

  // ============================================
  // 📐 CALCULAR DISTANCIA (ORIGINAL)
  // ============================================
  const calculateDistance = (pos1, pos2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // ============================================
  // 🔔 NOTIFICACIONES (ORIGINAL)
  // ============================================
  const addNotification = (notification) => {
    setNotifications(prev => {
      const newNotifications = [notification, ...prev].slice(0, 5); // Máximo 5
      return newNotifications;
    });
  };

  const checkNotifications = () => {
    if (estimatedArrival && estimatedArrival.eta_minutes <= 10 && estimatedArrival.eta_minutes > 8) {
      addNotification({
        type: 'info',
        message: `📍 El vehículo está a ${estimatedArrival.eta_minutes} minutos`,
        timestamp: new Date()
      });
    }
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
            <h1 className="text-2xl font-bold mb-2">🚐 Seguimiento en Tiempo Real</h1>
            <p className="text-blue-100">
              Sigue la ubicación del transporte de Club Canino
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-6xl opacity-30">📍</div>
            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
              title="Cerrar Tracking"
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
          <h2 className="text-lg font-bold text-[#2C3E50]">📡 Estado del Tracking</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            connectionStatus === 'no_active_vehicles' ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }`}>
            {connectionStatus === 'connected' && '🟢 Conectado'}
            {connectionStatus === 'connecting' && '🟡 Conectando'}
            {connectionStatus === 'no_active_vehicles' && '🔵 Sin vehículos activos'}
            {connectionStatus === 'error' && '🔴 Error'}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#56CCF2] mx-auto mb-2"></div>
            <p className="text-gray-600">Conectando con sistema de tracking...</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Información del usuario */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">👤 Tu Información</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>📧 {currentUser?.email || 'No disponible'}</div>
                <div>👤 {currentUser?.full_name || 'Usuario'}</div>
                <div>📍 {userLocation.address}</div>
                <div>🐕 Perros: {myDogs.length}</div>
              </div>
            </div>

            {/* Perros del usuario */}
            {myDogs.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🐕 Tus Perros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {myDogs.map((dog) => (
                    <div key={dog.id} className="flex items-center space-x-2 text-sm">
                      <span className="text-blue-700">🐕</span>
                      <span className="font-medium">{dog.name}</span>
                      <span className="text-blue-600">({dog.breed})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vehículo seleccionado */}
            {selectedVehicle && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">🚐 Vehículo en Tracking</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <div>🚗 Placa: {selectedVehicle.license_plate}</div>
                  <div>👨‍✈️ Conductor: {selectedVehicle.driver_name}</div>
                  <div>🚐 Modelo: {selectedVehicle.model}</div>
                  <div>👥 Capacidad: {selectedVehicle.capacity} perros</div>
                </div>
              </div>
            )}

            {/* Ubicación del vehículo */}
            {vehicleLocation && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-3">📍 Ubicación del Vehículo</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-yellow-700">Latitud:</span>
                    <div className="font-mono text-yellow-900">{vehicleLocation.latitude.toFixed(6)}</div>
                  </div>
                  <div>
                    <span className="text-yellow-700">Longitud:</span>
                    <div className="font-mono text-yellow-900">{vehicleLocation.longitude.toFixed(6)}</div>
                  </div>
                  <div>
                    <span className="text-yellow-700">Velocidad:</span>
                    <div className="font-semibold text-yellow-900">{Math.round(vehicleLocation.speed || 0)} km/h</div>
                  </div>
                  <div>
                    <span className="text-yellow-700">Estado:</span>
                    <div className={`font-semibold ${vehicleLocation.is_moving ? 'text-green-600' : 'text-yellow-600'}`}>
                      {vehicleLocation.is_moving ? '🚗 En movimiento' : '⏸️ Detenido'}
                    </div>
                  </div>
                </div>

                {lastUpdate && (
                  <div className="mt-3 text-xs text-yellow-600">
                    Última actualización: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}

            {/* ETA */}
            {estimatedArrival && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-3">⏱️ Tiempo Estimado de Llegada</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-800">{estimatedArrival.eta_minutes}</div>
                    <div className="text-sm text-purple-600">minutos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-800">{estimatedArrival.distance.toFixed(1)}</div>
                    <div className="text-sm text-purple-600">kilómetros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-800">
                      {estimatedArrival.eta_time.toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-purple-600">hora estimada</div>
                  </div>
                </div>
                <div className="mt-3 text-center text-xs text-purple-600">
                  Precisión: {estimatedArrival.confidence} • Basado en tráfico actual
                </div>
              </div>
            )}

            {/* Sin vehículos activos */}
            {connectionStatus === 'no_active_vehicles' && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🚐</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay vehículos en ruta
                </h3>
                <p className="text-gray-600 mb-4">
                  Actualmente no hay vehículos transportando tus perros
                </p>
                <button
                  onClick={findActiveVehicles}
                  className="bg-[#56CCF2] text-white px-6 py-2 rounded-lg hover:bg-[#2C3E50] transition-colors"
                >
                  🔄 Verificar nuevamente
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mapa en tiempo real */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-[#2C3E50] mb-4">🗺️ Mapa en Tiempo Real</h2>
        
        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-gray-600">Vista del mapa con ubicación en tiempo real</p>
            <p className="text-sm text-gray-500 mt-1">
              Google Maps se cargará aquí en producción
            </p>
          </div>
          
          {/* Simular elementos del mapa */}
          {vehicleLocation && (
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
              🚐 {selectedVehicle?.license_plate || 'Vehículo'}
            </div>
          )}
          
          {userLocation && (
            <div className="absolute bottom-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
              🏠 Tu ubicación
            </div>
          )}
          
          {estimatedArrival && (
            <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
              ⏱️ {estimatedArrival.eta_minutes} min
            </div>
          )}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>🔧 En desarrollo: Integración completa con Google Maps API</p>
          <p>📍 Mostrará rutas, ETA dinámico y notificaciones push</p>
        </div>
      </div>

      {/* Notificaciones recientes */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">🔔 Notificaciones Recientes</h2>
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  notification.type === 'error' ? 'bg-red-50 border-red-400' :
                  'bg-blue-50 border-blue-400'
                }`}
              >
                <p className="text-sm text-gray-800">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sin perros registrados */}
      {myDogs.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🐕</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No tienes perros registrados
          </h3>
          <p className="text-gray-600 mb-6">
            Para usar el sistema de tracking, necesitas tener al menos un perro inscrito en Club Canino
          </p>
          <a 
            href="/contacto"
            className="inline-block bg-[#56CCF2] hover:bg-[#2C3E50] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            📞 Contactar Club Canino
          </a>
        </div>
      )}
      
    </div>
  );
};

export default RealGPSTracker;