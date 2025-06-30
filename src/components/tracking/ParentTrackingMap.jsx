// src/components/tracking/ParentTrackingMap.jsx
// 🗺️ MAPA EN TIEMPO REAL PARA PADRES - VER UBICACIÓN DEL CONDUCTOR
// ✅ TRACKING GPS + PUNTOS DE PICKUP/DELIVERY + ACTUALIZACIONES EN VIVO

import { useState, useEffect, useRef } from 'react';
import supabase from '../../lib/supabase.js';

const ParentTrackingMap = ({ dogId, userId }) => {
  const [activeRoute, setActiveRoute] = useState(null);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [dogInfo, setDogInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [eta, setEta] = useState(null);
  const mapRef = useRef(null);
  const watcherRef = useRef(null);

  useEffect(() => {
    initializeTracking();
    return () => {
      if (watcherRef.current) {
        clearInterval(watcherRef.current);
      }
    };
  }, [dogId, userId]);

  // ===============================================
  // 🚀 INICIALIZAR TRACKING
  // ===============================================
  const initializeTracking = async () => {
    try {
      // Buscar ruta activa que incluya este perro
      const { data: routes, error: routeError } = await supabase
        .from('vehicle_routes')
        .select(`
          *,
          vehicle:vehicles(*),
          driver:profiles(*)
        `)
        .contains('dog_ids', [dogId])
        .in('status', ['in_progress', 'planned'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (routeError) throw routeError;

      if (routes && routes.length > 0) {
        const route = routes[0];
        setActiveRoute(route);

        // Obtener información del perro
        const { data: dog, error: dogError } = await supabase
          .from('dogs')
          .select(`
            *,
            owner:profiles(*)
          `)
          .eq('id', dogId)
          .single();

        if (!dogError) {
          setDogInfo(dog);
        }

        // Obtener última ubicación del vehículo
        await fetchVehicleLocation(route.vehicle_id);

        // Configurar actualizaciones en tiempo real
        startRealTimeUpdates(route.vehicle_id, route.id);
        
        // Configurar puntos de la ruta
        setupRoutePoints(route);
      }
      
    } catch (error) {
      console.error('❌ Error inicializando tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ===============================================
  // 📍 OBTENER UBICACIÓN DEL VEHÍCULO
  // ===============================================
  const fetchVehicleLocation = async (vehicleId) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_locations')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const location = data[0];
        setVehicleLocation(location);
        setLastUpdate(new Date(location.created_at));
        
        // Calcular ETA si hay puntos de destino
        calculateETA(location);
      }
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
    }
  };

  // ===============================================
  // ⏰ ACTUALIZACIONES EN TIEMPO REAL
  // ===============================================
  const startRealTimeUpdates = (vehicleId, routeId) => {
    // Suscripción a cambios en ubicaciones del vehículo
    const locationSubscription = supabase
      .channel(`vehicle_locations_${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_locations',
          filter: `vehicle_id=eq.${vehicleId}`
        },
        (payload) => {
          console.log('📍 Nueva ubicación recibida:', payload.new);
          setVehicleLocation(payload.new);
          setLastUpdate(new Date(payload.new.created_at));
          calculateETA(payload.new);
        }
      )
      .subscribe();

    // Suscripción a cambios en la ruta
    const routeSubscription = supabase
      .channel(`vehicle_routes_${routeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vehicle_routes',
          filter: `id=eq.${routeId}`
        },
        (payload) => {
          console.log('🗺️ Ruta actualizada:', payload.new);
          setActiveRoute(payload.new);
        }
      )
      .subscribe();

    // Polling como respaldo cada 30 segundos
    watcherRef.current = setInterval(() => {
      fetchVehicleLocation(vehicleId);
    }, 30000);
  };

  // ===============================================
  // 🧮 CALCULAR ETA
  // ===============================================
  const calculateETA = (currentLocation) => {
    if (!dogInfo || !activeRoute) return;

    // Simulación de cálculo de ETA (en producción usarías Google Maps API)
    const dogIndex = activeRoute.dog_ids.indexOf(dogId);
    if (dogIndex === -1) return;

    // ETA estimado basado en distancia (muy básico)
    const averageSpeed = 30; // km/h en ciudad
    const estimatedDistance = 5; // km estimados por parada
    const remainingStops = activeRoute.dog_ids.length - dogIndex;
    const etaMinutes = (remainingStops * estimatedDistance / averageSpeed) * 60;

    setEta(Math.round(etaMinutes));
  };

  // ===============================================
  // 🗺️ CONFIGURAR PUNTOS DE RUTA
  // ===============================================
  const setupRoutePoints = (route) => {
    const points = [];
    
    // Punto de inicio (colegio o base)
    points.push({
      type: 'start',
      name: 'Club Canino Dos Huellitas',
      address: 'Base de operaciones',
      icon: '🏫',
      coordinates: { lat: 4.6097, lng: -74.0817 } // Bogotá ejemplo
    });

    // Puntos de pickup/delivery
    const addresses = route.route_type === 'pickup' ? 
      route.pickup_addresses : route.delivery_addresses;
    
    if (addresses && addresses.length > 0) {
      addresses.forEach((address, index) => {
        const dogForThisStop = route.dog_ids[index];
        const isCurrentDog = dogForThisStop === dogId;
        
        points.push({
          type: route.route_type === 'pickup' ? 'pickup' : 'delivery',
          name: isCurrentDog ? dogInfo?.name : `Perro ${index + 1}`,
          address: address,
          icon: isCurrentDog ? '🎯' : '📍',
          isCurrentDog,
          coordinates: generateCoordinatesFromAddress(address) // Función helper
        });
      });
    }

    setRoutePoints(points);
  };

  // ===============================================
  // 🗺️ GENERAR COORDENADAS DESDE DIRECCIÓN (HELPER)
  // ===============================================
  const generateCoordinatesFromAddress = (address) => {
    // En producción, usarías Google Geocoding API
    // Por ahora, generar coordenadas aleatorias cerca de Bogotá
    const baseLat = 4.6097;
    const baseLng = -74.0817;
    const randomLat = baseLat + (Math.random() - 0.5) * 0.1;
    const randomLng = baseLng + (Math.random() - 0.5) * 0.1;
    
    return { lat: randomLat, lng: randomLng };
  };

  // ===============================================
  // 🎨 COMPONENTE DE MAPA SIMPLE (SIN GOOGLE MAPS)
  // ===============================================
  const SimpleMap = () => (
    <div className="relative bg-gray-100 rounded-lg h-96 overflow-hidden">
      {/* Fondo del mapa */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
        {/* Grid pattern para simular mapa */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="absolute w-full h-px bg-gray-400" style={{ top: `${i * 10}%` }} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="absolute h-full w-px bg-gray-400" style={{ left: `${i * 10}%` }} />
          ))}
        </div>
      </div>

      {/* Vehículo en movimiento */}
      {vehicleLocation && (
        <div 
          className="absolute w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg shadow-lg animate-pulse"
          style={{
            left: '45%',
            top: '40%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          🚐
        </div>
      )}

      {/* Puntos de la ruta */}
      {routePoints.map((point, index) => (
        <div
          key={index}
          className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-sm shadow-md ${
            point.isCurrentDog ? 'bg-red-500 text-white animate-bounce' : 'bg-white text-gray-700'
          }`}
          style={{
            left: `${20 + index * 15}%`,
            top: `${30 + index * 10}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {point.icon}
        </div>
      ))}

      {/* Información de ubicación */}
      {vehicleLocation && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
          <div className="text-xs text-gray-600">
            📍 Lat: {vehicleLocation.latitude.toFixed(4)}
          </div>
          <div className="text-xs text-gray-600">
            📍 Lng: {vehicleLocation.longitude.toFixed(4)}
          </div>
          <div className="text-xs text-gray-500">
            Precisión: {vehicleLocation.accuracy?.toFixed(0)}m
          </div>
        </div>
      )}
    </div>
  );

  // ===============================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ===============================================
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4 animate-pulse">🗺️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargando Tracking...</h3>
          <p className="text-gray-600">Buscando ubicación del vehículo</p>
        </div>
      </div>
    );
  }

  if (!activeRoute) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay tracking activo</h3>
          <p className="text-gray-600">
            {dogInfo ? `${dogInfo.name} no está en una ruta activa en este momento` : 'No hay rutas activas'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de tracking */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              📍 Tracking de {dogInfo?.name || 'tu mascota'}
            </h1>
            <p className="text-lg opacity-90">
              {activeRoute.route_type === 'pickup' ? 'Recogida en curso' : 'Entrega en curso'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl mb-1">🚐</div>
            <div className="text-sm opacity-80">
              {activeRoute.status === 'in_progress' ? 'En movimiento' : 'Preparándose'}
            </div>
          </div>
        </div>
      </div>

      {/* Estado de la ruta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🚐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vehículo</p>
              <p className="text-lg font-bold text-gray-900">
                {activeRoute.vehicle?.license_plate || 'En ruta'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">⏰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ETA Estimado</p>
              <p className="text-lg font-bold text-gray-900">
                {eta ? `${eta} min` : 'Calculando...'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">📍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Última Actualización</p>
              <p className="text-lg font-bold text-gray-900">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Sin datos'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa de tracking */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#2C3E50]">🗺️ Mapa en Tiempo Real</h2>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${vehicleLocation ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {vehicleLocation ? 'GPS Activo' : 'Sin señal GPS'}
            </span>
          </div>
        </div>
        
        <SimpleMap />
      </div>

      {/* Información del conductor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">👨‍💼 Información del Conductor</h2>
        
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-xl">👨‍💼</span>
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {activeRoute.driver?.full_name || 'Conductor del Club'}
            </div>
            <div className="text-sm text-gray-600">
              Conductor certificado • Vehículo {activeRoute.vehicle?.license_plate}
            </div>
          </div>
        </div>
      </div>

      {/* Puntos de la ruta */}
      {routePoints.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">📍 Puntos de la Ruta</h2>
          
          <div className="space-y-3">
            {routePoints.map((point, index) => (
              <div key={index} className={`flex items-center p-3 rounded-lg ${
                point.isCurrentDog ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-50'
              }`}>
                <div className="text-2xl mr-3">{point.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{point.name}</div>
                  <div className="text-sm text-gray-600">{point.address}</div>
                </div>
                {point.isCurrentDog && (
                  <div className="text-sm font-semibold text-red-600">
                    Tu mascota
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <div className="text-2xl mr-3">💡</div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Información del Tracking</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• La ubicación se actualiza automáticamente cada 30 segundos</li>
              <li>• Recibirás notificaciones cuando {dogInfo?.name} sea {activeRoute.route_type === 'pickup' ? 'recogido' : 'entregado'}</li>
              <li>• El tiempo estimado puede variar según el tráfico</li>
              <li>• Puedes refrescar la página para obtener la información más reciente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentTrackingMap;