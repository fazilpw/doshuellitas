// src/components/tracking/RealGPSTracker.jsx - TRACKING PARA PADRES
import { useState, useEffect, useRef } from 'react';
import supabase from '../../lib/supabase.js';

const RealGPSTracker = () => {
  // ============================================
  // 🔧 ESTADOS PRINCIPALES
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
  // 🔧 REFS PARA ACTUALIZACIONES
  // ============================================
  const locationUpdateRef = useRef(null);
  const notificationRef = useRef(null);

  // ============================================
  // 🏠 UBICACIÓN DEL USUARIO (MOCK)
  // ============================================
  const userLocation = {
    latitude: 4.7200,
    longitude: -74.0600,
    address: 'Calle 123 #45-67, Chapinero'
  };

  // ============================================
  // 🐕 DATOS MOCK DE PERROS DEL USUARIO
  // ============================================
  const mockMyDogs = [
    {
      id: 'dog-001',
      name: 'Max',
      breed: 'Golden Retriever',
      pickup_time: '07:30',
      return_time: '17:00',
      status: 'en_transporte',
      vehicle_id: 'vehicle-001'
    },
    {
      id: 'dog-002',
      name: 'Luna',
      breed: 'Labrador',
      pickup_time: '07:45',
      return_time: '17:15',
      status: 'en_colegio',
      vehicle_id: 'vehicle-001'
    }
  ];

  // ============================================
  // 🚀 EFECTOS DE INICIALIZACIÓN
  // ============================================
  useEffect(() => {
    initializeTracking();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      startLocationUpdates();
    } else {
      stopLocationUpdates();
    }
  }, [selectedVehicle]);

  const initializeTracking = async () => {
    setIsLoading(true);
    
    try {
      // Cargar mis perros
      await loadMyDogs();
      
      // Cargar vehículos activos
      await loadActiveVehicles();
      
      // Configurar notificaciones en tiempo real
      setupRealtimeNotifications();
      
      setConnectionStatus('connected');
      console.log('✅ Sistema de tracking inicializado');
      
    } catch (error) {
      console.error('❌ Error inicializando tracking:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    if (locationUpdateRef.current) {
      clearInterval(locationUpdateRef.current);
    }
    if (notificationRef.current) {
      notificationRef.current.unsubscribe();
    }
  };

  // ============================================
  // 📍 FUNCIONES DE UBICACIÓN EN TIEMPO REAL
  // ============================================
  const startLocationUpdates = () => {
    console.log('🎯 Iniciando actualizaciones de ubicación para:', selectedVehicle.license_plate);
    
    // Actualización inmediata
    fetchVehicleLocation();
    
    // Actualizaciones cada 10 segundos
    locationUpdateRef.current = setInterval(() => {
      fetchVehicleLocation();
    }, 10000);
  };

  const stopLocationUpdates = () => {
    if (locationUpdateRef.current) {
      clearInterval(locationUpdateRef.current);
      locationUpdateRef.current = null;
    }
  };

  const fetchVehicleLocation = async () => {
    if (!selectedVehicle) return;

    try {
      const { data, error } = await supabase
        .from('vehicle_locations')
        .select('*')
        .eq('vehicle_id', selectedVehicle.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setVehicleLocation(data);
        setLastUpdate(new Date(data.timestamp));
        
        // Calcular ETA
        calculateETA(data);
        
        console.log('📍 Ubicación del vehículo actualizada');
      } else {
        // Si no hay datos reales, usar datos mock para demo
        simulateVehicleMovement();
      }
      
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      // Usar datos simulados como fallback
      simulateVehicleMovement();
    }
  };

  const simulateVehicleMovement = () => {
    // Simular movimiento del vehículo para demo
    const baseLocation = {
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
  };

  const calculateETA = (vehiclePos) => {
    // Calcular distancia y ETA aproximado
    const distance = calculateDistance(vehiclePos, userLocation);
    const avgSpeed = vehiclePos.speed || 30; // km/h promedio
    const etaMinutes = Math.round((distance / avgSpeed) * 60);
    
    setEstimatedArrival({
      distance: distance,
      eta_minutes: etaMinutes,
      eta_time: new Date(Date.now() + etaMinutes * 60000)
    });
  };

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
  // 📊 FUNCIONES DE DATOS
  // ============================================
  const loadMyDogs = async () => {
    try {
      // En producción, esto vendría de Supabase filtrado por usuario
      setMyDogs(mockMyDogs);
      
      // Auto-seleccionar vehículo si hay perros en transporte
      const dogsInTransport = mockMyDogs.filter(dog => 
        dog.status === 'en_transporte' || dog.status === 'recogiendo'
      );
      
      if (dogsInTransport.length > 0) {
        const vehicleId = dogsInTransport[0].vehicle_id;
        await loadVehicleDetails(vehicleId);
      }
      
    } catch (error) {
      console.error('❌ Error cargando perros:', error);
    }
  };

  const loadActiveVehicles = async () => {
    try {
      // Simular vehículos activos
      const mockVehicles = [
        {
          id: 'vehicle-001',
          license_plate: 'ABC-123',
          driver: 'Juan Carlos',
          status: 'active',
          dogs_count: 3,
          current_route: 'Ruta Norte - Recogida Mañana'
        },
        {
          id: 'vehicle-002',
          license_plate: 'DEF-456',
          driver: 'María López',
          status: 'active',
          dogs_count: 2,
          current_route: 'Ruta Sur - Recogida Tarde'
        }
      ];
      
      setActiveVehicles(mockVehicles);
      
    } catch (error) {
      console.error('❌ Error cargando vehículos:', error);
    }
  };

  const loadVehicleDetails = async (vehicleId) => {
    const vehicle = activeVehicles.find(v => v.id === vehicleId) || {
      id: vehicleId,
      license_plate: 'ABC-123',
      driver: 'Juan Carlos',
      status: 'active',
      dogs_count: 3,
      current_route: 'Ruta Norte - Recogida Mañana'
    };
    
    setSelectedVehicle(vehicle);
  };

  // ============================================
  // 🔔 NOTIFICACIONES EN TIEMPO REAL
  // ============================================
  const setupRealtimeNotifications = () => {
    // Simular notificaciones periódicas
    const notifications = [
      {
        id: 1,
        type: 'departure',
        title: '🚐 Transporte en camino',
        message: 'El vehículo ABC-123 salió del club canino',
        timestamp: new Date(Date.now() - 300000), // 5 minutos atrás
        read: false
      },
      {
        id: 2,
        type: 'proximity',
        title: '📍 Llegando pronto',
        message: 'El transporte está a 3 minutos de tu ubicación',
        timestamp: new Date(Date.now() - 180000), // 3 minutos atrás
        read: false
      }
    ];
    
    setNotifications(notifications);
    
    // En producción esto sería un subscription real a Supabase
    // notificationRef.current = supabase
    //   .channel('notifications')
    //   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, 
    //     payload => {
    //       setNotifications(prev => [payload.new, ...prev]);
    //     }
    //   )
    //   .subscribe();
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  // ============================================
  // 🎨 COMPONENTE DE RENDER
  // ============================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl text-white">📍</span>
          </div>
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">Conectando GPS</h2>
          <p className="text-gray-600">Cargando información de tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0] p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl text-white">📍</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#2C3E50]">Tracking GPS</h1>
                <p className="text-gray-600">Sigue el transporte de tu mascota</p>
              </div>
            </div>
            
            {/* Estado de conexión */}
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-400'
              }`}></div>
              <span className="text-sm text-gray-600">
                {connectionStatus === 'connected' ? 'Conectado' :
                 connectionStatus === 'connecting' ? 'Conectando...' :
                 'Error de conexión'}
              </span>
            </div>
          </div>

          {/* Mis Perros */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-[#2C3E50] mb-3">🐕 Mis Mascotas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myDogs.map(dog => (
                <div key={dog.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{dog.name}</div>
                      <div className="text-sm text-gray-600">{dog.breed}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dog.status === 'en_transporte' ? 'bg-blue-100 text-blue-800' :
                        dog.status === 'en_colegio' ? 'bg-green-100 text-green-800' :
                        dog.status === 'recogiendo' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {dog.status === 'en_transporte' ? '🚐 En transporte' :
                         dog.status === 'en_colegio' ? '🏫 En el colegio' :
                         dog.status === 'recogiendo' ? '📍 Recogiendo' :
                         '🏠 En casa'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Recogida: {dog.pickup_time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vehículo Seleccionado y Ubicación */}
        {selectedVehicle && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#2C3E50]">
                🚐 Vehículo: {selectedVehicle.license_plate}
              </h2>
              {lastUpdate && (
                <span className="text-sm text-gray-500">
                  Actualizado: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Info del Vehículo */}
              <div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conductor:</span>
                    <span className="font-medium">{selectedVehicle.driver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ruta:</span>
                    <span className="font-medium">{selectedVehicle.current_route}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Perros a bordo:</span>
                    <span className="font-medium">{selectedVehicle.dogs_count}</span>
                  </div>
                </div>
              </div>

              {/* Ubicación Actual */}
              {vehicleLocation && (
                <div>
                  <h4 className="font-semibold mb-3">📍 Ubicación Actual</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Velocidad:</span>
                      <span className="font-medium">{Math.round(vehicleLocation.speed || 0)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className={`font-medium ${vehicleLocation.is_moving ? 'text-green-600' : 'text-yellow-600'}`}>
                        {vehicleLocation.is_moving ? '🚗 En movimiento' : '⏸️ Detenido'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Lat: {vehicleLocation.latitude?.toFixed(6)}<br/>
                      Lng: {vehicleLocation.longitude?.toFixed(6)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ETA y Distancia */}
            {estimatedArrival && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-blue-800">
                      ⏱️ Tiempo estimado de llegada
                    </div>
                    <div className="text-blue-600">
                      {estimatedArrival.eta_minutes} minutos ({estimatedArrival.distance.toFixed(1)} km)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-600">Llegada aproximada:</div>
                    <div className="font-semibold text-blue-800">
                      {estimatedArrival.eta_time.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mapa Simulado */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">🗺️ Mapa en Tiempo Real</h2>
          
          {/* Placeholder del mapa */}
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-600">Vista del mapa con ubicación en tiempo real</p>
              <p className="text-sm text-gray-500 mt-1">
                En producción: Google Maps con tracking en vivo
              </p>
            </div>
            
            {/* Simular elementos del mapa */}
            {vehicleLocation && (
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                🚐 Vehículo {selectedVehicle?.license_plate}
              </div>
            )}
            
            <div className="absolute bottom-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
              🏠 Tu ubicación
            </div>
          </div>
          
          {/* Controles del mapa */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300">
                📍 Centrar en vehículo
              </button>
              <button className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300">
                🏠 Mi ubicación
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Actualización automática cada 10 segundos
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">🔔 Notificaciones</h2>
          
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">🔕</div>
              <p>No hay notificaciones nuevas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-[#2C3E50] mb-1">
                        {notification.title}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {notification.message}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 ml-4">
                      {notification.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="https://wa.me/573144329824"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="font-semibold">Contactar Conductor</div>
            <div className="text-sm opacity-90">WhatsApp directo</div>
          </a>
          
          <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center">
            <div className="text-2xl mb-2">📞</div>
            <div className="font-semibold">Llamar al Club</div>
            <div className="text-sm opacity-90">Soporte inmediato</div>
          </button>
          
          <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold">Historial</div>
            <div className="text-sm opacity-90">Ver rutas anteriores</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealGPSTracker;