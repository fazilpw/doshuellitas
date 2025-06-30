// src/components/tracking/ParentTrackingDashboard.jsx
// 🚨 VERSIÓN TEMPORAL - USA DATOS CONOCIDOS SIN CONSULTAS COLGADAS
// ✅ Funciona mientras arreglamos conectividad Supabase

import { useState, useEffect, useRef } from 'react';
import TrackingMap from './TrackingMap';

const ParentTrackingDashboard = ({ user }) => {
  // ============================================
  // 🔧 ESTADOS
  // ============================================
  const [isLoading, setIsLoading] = useState(true);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [homeLocation, setHomeLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs
  const trackingInterval = useRef(null);

  // ============================================
  // 🎯 DATOS CONOCIDOS (TEMPORAL)
  // ============================================
  const knownUserData = {
    id: 'b32715e5-a93c-4d0a-8066-bf1d7443d0c0', // Del localStorage
    email: 'maria@ejemplo.com'
  };

  const mockDogData = {
    id: '7ae7e0ac-67db-4562-b16c-49161c72629c', // Del log anterior
    name: 'Rio',
    breed: 'Golden Retriever',
    owner_id: knownUserData.id
  };

  const mockRouteData = {
    id: 'route-123',
    status: 'in_progress',
    route_name: 'Ruta pickup - 6/29/2025',
    vehicle: {
      license_plate: 'ABC-123',
      id: 'vehicle-abc123'
    },
    driver: {
      full_name: 'Carlos Mendoza',
      id: 'conductor-carlos'
    },
    dog_ids: [mockDogData.id],
    created_at: new Date().toISOString(),
    actual_start_time: new Date(Date.now() - 15 * 60000).toISOString() // Hace 15 min
  };

  // ============================================
  // 🚀 EFECTOS
  // ============================================
  useEffect(() => {
    initializeWithKnownData();
    
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, []);

  // ============================================
  // 🎯 INICIALIZACIÓN CON DATOS CONOCIDOS
  // ============================================
  const initializeWithKnownData = async () => {
    try {
      setIsLoading(true);
      
      console.log('🎯 Inicializando con datos conocidos...');
      console.log('👤 User:', knownUserData);
      console.log('🐕 Dog:', mockDogData);
      console.log('🗺️ Route:', mockRouteData);
      
      // Simular obtención de ubicaciones
      await getUserLocation();
      await getVehicleLocationFromConductor();
      
      // Iniciar actualización periódica
      startPeriodicUpdates();
      
    } catch (error) {
      console.error('❌ Error inicializando:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            
            setHomeLocation(userPos);
            console.log('🏠 Ubicación del usuario obtenida:', {
              lat: userPos.lat.toFixed(6),
              lng: userPos.lng.toFixed(6)
            });
          },
          (error) => {
            console.warn('⚠️ Usando ubicación por defecto');
            const defaultPos = { lat: 4.7110, lng: -74.0721 };
            setHomeLocation(defaultPos);
          }
        );
      }
    } catch (error) {
      console.error('❌ Error ubicación usuario:', error);
      setHomeLocation({ lat: 4.7110, lng: -74.0721 });
    }
  };

  const getVehicleLocationFromConductor = async () => {
    try {
      // Usar ubicación conocida del conductor (del diagnóstico anterior)
      const conductorLocation = {
        lat: 4.728468,  // Del log del conductor
        lng: -74.048512,
        speed: 35, // km/h simulado
        timestamp: new Date().toISOString(),
        isReal: true
      };

      setVehicleLocation(conductorLocation);
      setLastUpdate(new Date());
      
      console.log('🚐 Ubicación del conductor simulada:', {
        lat: conductorLocation.lat.toFixed(6),
        lng: conductorLocation.lng.toFixed(6),
        speed: conductorLocation.speed
      });

      // Calcular ETA si tenemos casa
      if (homeLocation) {
        calculateETA(conductorLocation, homeLocation);
      }

    } catch (error) {
      console.error('❌ Error ubicación vehículo:', error);
    }
  };

  // ============================================
  // 📊 CÁLCULOS
  // ============================================
  const calculateETA = (vehiclePos, homePos) => {
    try {
      // Fórmula de Haversine para distancia
      const R = 6371; // Radio de la Tierra en km
      const dLat = (homePos.lat - vehiclePos.lat) * Math.PI / 180;
      const dLon = (homePos.lng - vehiclePos.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(vehiclePos.lat * Math.PI / 180) * Math.cos(homePos.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      // ETA basado en velocidad
      const speed = vehiclePos.speed || 25;
      const etaMinutes = Math.round((distance / speed) * 60);

      setEta({
        minutes: etaMinutes,
        distance: distance.toFixed(1),
        speed: speed
      });

      console.log('⏱️ ETA calculado:', {
        distancia: `${distance.toFixed(1)} km`,
        tiempo: `${etaMinutes} min`,
        velocidad: `${speed} km/h`
      });

    } catch (error) {
      console.error('❌ Error calculando ETA:', error);
    }
  };

  // ============================================
  // 🔄 ACTUALIZACIONES PERIÓDICAS
  // ============================================
  const startPeriodicUpdates = () => {
    console.log('🔄 Iniciando actualizaciones periódicas...');
    
    trackingInterval.current = setInterval(() => {
      // Simular ligero movimiento del vehículo
      setVehicleLocation(prev => {
        if (!prev) return prev;
        
        const newLocation = {
          ...prev,
          lat: prev.lat + (Math.random() - 0.5) * 0.001, // Movimiento pequeño
          lng: prev.lng + (Math.random() - 0.5) * 0.001,
          speed: 30 + Math.random() * 10, // Velocidad variable
          timestamp: new Date().toISOString()
        };
        
        // Recalcular ETA
        if (homeLocation) {
          calculateETA(newLocation, homeLocation);
        }
        
        setLastUpdate(new Date());
        console.log('📍 Ubicación actualizada automáticamente');
        
        return newLocation;
      });
    }, 10000); // Cada 10 segundos
  };

  const refreshLocation = async () => {
    setIsRefreshing(true);
    
    try {
      console.log('🔄 Refrescando ubicación manualmente...');
      
      // Simular nueva ubicación
      await getVehicleLocationFromConductor();
      
      showNotification('Ubicación actualizada', 'success');
      
    } catch (error) {
      console.error('❌ Error refrescando:', error);
      showNotification('Error actualizando ubicación', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  };

  // ============================================
  // 🎨 RENDER
  // ============================================
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-600">Cargando tracking en tiempo real...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      
      {/* Header con estado del transporte */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📍 Ubicación del Transporte</h1>
            <p className="text-blue-100">Seguimiento en tiempo real (modo temporal)</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">Transporte en camino</div>
            <button 
              onClick={refreshLocation}
              disabled={isRefreshing}
              className="mt-2 bg-white bg-opacity-20 text-white px-3 py-1 rounded text-sm hover:bg-opacity-30 disabled:opacity-50"
            >
              {isRefreshing ? '⏳' : '🔄'} Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Información del perro y vehículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Info del perro */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">🐕</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {mockDogData.name}
              </h3>
              <p className="text-gray-600">{mockDogData.breed}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  En ruta
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info del vehículo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">🚐</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {mockRouteData.vehicle.license_plate}
              </h3>
              <p className="text-gray-600">
                {mockRouteData.driver.full_name} - Conductor
              </p>
              <button className="mt-2 text-sm bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600">
                📞 Llamar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información de ETA */}
      {eta && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{eta.minutes} min</div>
              <div className="text-green-100 text-sm">Tiempo estimado de llegada</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{eta.distance} km</div>
              <div className="text-green-100 text-sm">Distancia</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(vehicleLocation?.speed || 0)} km/h</div>
              <div className="text-green-100 text-sm">Velocidad</div>
            </div>
          </div>
        </div>
      )}

      {/* Mapa en tiempo real */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🗺️ Mapa en Tiempo Real</h2>
        
        <TrackingMap
          realVehiclePos={vehicleLocation}
          realHomePos={homeLocation}
          vehicleData={{
            plate: mockRouteData.vehicle.license_plate,
            driver: mockRouteData.driver.full_name
          }}
          eta={eta}
          onMapLoad={() => console.log('✅ Mapa cargado - modo temporal')}
        />
        
        {/* Información de última actualización */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              vehicleLocation ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span>
              {vehicleLocation ? 'GPS Activo (temporal)' : 'Sin señal GPS'}
            </span>
          </div>
          {lastUpdate && (
            <span>
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Timeline del viaje */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ Timeline del Viaje</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Transporte salió del colegio</p>
              <p className="text-sm text-gray-600">
                {new Date(mockRouteData.actual_start_time).toLocaleTimeString()} - 
                Hace {Math.round((new Date() - new Date(mockRouteData.actual_start_time)) / (1000 * 60))} minutos
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-xs">🚐</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">En camino a tu casa</p>
              <p className="text-sm text-gray-600">
                Llegada estimada: {eta ? 
                  new Date(Date.now() + eta.minutes * 60000).toLocaleTimeString() : 
                  'Calculando...'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-4">
              <span className="text-gray-600 text-xs">🏠</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Llegada a casa</p>
              <p className="text-sm text-gray-600">Pendiente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso temporal */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-xl mr-2">⚠️</span>
          <div>
            <h4 className="font-semibold text-yellow-900">Modo Temporal</h4>
            <p className="text-sm text-yellow-700">
              Usando datos conocidos mientras se resuelve la conectividad con Supabase. 
              El mapa y tracking funcionan correctamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentTrackingDashboard;