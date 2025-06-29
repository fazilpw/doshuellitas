// src/components/GPSTracker.jsx
// 🚐 SISTEMA GPS TRACKER - RUTA DE IMPORTACIÓN CORREGIDA ✅

import { useState, useEffect, useRef } from 'react';
// ✅ CORRECCIÓN: Cambiar de ../../lib/supabase.js a ../lib/supabase.js
import supabase from '../lib/supabase.js';

const GPSTracker = ({ userDogs = [], currentUser = null, onClose }) => {
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
  // 🏠 UBICACIÓN DEL USUARIO
  // ============================================
  const [userLocation, setUserLocation] = useState({
    latitude: 4.7200,
    longitude: -74.0600,
    address: 'Tu ubicación'
  });

  // ============================================
  // 🚀 EFECTOS PRINCIPALES
  // ============================================
  useEffect(() => {
    console.log('🚐 GPSTracker iniciando para:', {
      currentUser: currentUser?.full_name,
      userDogsCount: userDogs.length
    });
    
    initializeTracking();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    setMyDogs(userDogs || []);
  }, [userDogs]);

  // ============================================
  // 🚀 FUNCIONES PRINCIPALES
  // ============================================
  
  const initializeTracking = async () => {
    try {
      setConnectionStatus('connecting');
      
      // 1. Verificar Supabase connection
      if (!supabase) {
        throw new Error('Supabase no está disponible');
      }

      // 2. Obtener ubicación del usuario
      await getUserLocation();
      
      // 3. Cargar vehículos activos
      await loadActiveVehicles();
      
      // 4. Configurar listeners en tiempo real
      setupRealTimeListeners();
      
      // 5. Inicializar notificaciones
      initializeNotifications();
      
      setConnectionStatus('connected');
      setIsLoading(false);
      
      console.log('✅ GPS Tracker inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando GPS Tracker:', error);
      setConnectionStatus('error');
      setIsLoading(false);
      
      // Mostrar mensaje de error al usuario
      addNotification('Error conectando con el sistema GPS', 'error');
    }
  };

  const getUserLocation = async () => {
    try {
      if ('geolocation' in navigator) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true
          });
        });

        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'Tu ubicación actual'
        });

        console.log('📍 Ubicación del usuario obtenida:', {
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6)
        });
      }
    } catch (error) {
      console.warn('⚠️ No se pudo obtener ubicación del usuario:', error);
      // Usar ubicación por defecto (Bogotá)
    }
  };

  const loadActiveVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('active', true)
        .eq('status', 'en_ruta');

      if (error) throw error;

      setActiveVehicles(data || []);
      
      // Si hay vehículos activos, seleccionar el primero automáticamente
      if (data && data.length > 0) {
        setSelectedVehicle(data[0]);
        await loadVehicleLocation(data[0].id);
      }

      console.log('🚐 Vehículos activos cargados:', data?.length || 0);
      
    } catch (error) {
      console.error('❌ Error cargando vehículos:', error);
      addNotification('Error cargando información de vehículos', 'error');
    }
  };

  const loadVehicleLocation = async (vehicleId) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_locations')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const location = data[0];
        setVehicleLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed || 0,
          timestamp: location.timestamp,
          accuracy: location.accuracy || 0
        });

        setLastUpdate(new Date(location.timestamp));
        
        // Calcular ETA si hay ubicación del usuario
        if (userLocation.latitude && userLocation.longitude) {
          calculateETA(location, userLocation);
        }

        console.log('📍 Ubicación del vehículo actualizada:', {
          lat: location.latitude.toFixed(6),
          lng: location.longitude.toFixed(6),
          speed: location.speed
        });
      }
      
    } catch (error) {
      console.error('❌ Error cargando ubicación del vehículo:', error);
    }
  };

  const calculateETA = (vehiclePos, userPos) => {
    try {
      // Calcular distancia usando fórmula de Haversine
      const R = 6371; // Radio de la Tierra en km
      const dLat = (userPos.latitude - vehiclePos.latitude) * Math.PI / 180;
      const dLon = (userPos.longitude - vehiclePos.longitude) * Math.PI / 180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(vehiclePos.latitude * Math.PI / 180) * 
                Math.cos(userPos.latitude * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c; // Distancia en km

      // Estimar tiempo basado en velocidad promedio urbana (30 km/h)
      const avgSpeed = vehiclePos.speed > 0 ? vehiclePos.speed : 30;
      const estimatedMinutes = Math.round((distance / avgSpeed) * 60);

      setEstimatedArrival({
        distance: distance,
        minutes: estimatedMinutes,
        calculatedAt: new Date()
      });

      console.log('⏰ ETA calculado:', {
        distance: distance.toFixed(2) + ' km',
        eta: estimatedMinutes + ' minutos'
      });
      
    } catch (error) {
      console.error('❌ Error calculando ETA:', error);
    }
  };

  const setupRealTimeListeners = () => {
    if (!selectedVehicle) return;

    // Listener para actualizaciones de ubicación del vehículo
    const locationChannel = supabase
      .channel('vehicle-locations')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'vehicle_locations',
          filter: `vehicle_id=eq.${selectedVehicle.id}`
        }, 
        (payload) => {
          console.log('📡 Actualización de ubicación en tiempo real:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newLocation = payload.new;
            setVehicleLocation({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              speed: newLocation.speed || 0,
              timestamp: newLocation.timestamp,
              accuracy: newLocation.accuracy || 0
            });

            setLastUpdate(new Date(newLocation.timestamp));
            
            // Recalcular ETA
            if (userLocation.latitude && userLocation.longitude) {
              calculateETA(newLocation, userLocation);
            }

            // Generar notificación si está cerca
            checkProximityNotification(newLocation);
          }
        }
      )
      .subscribe();

    // Cleanup en el ref
    locationUpdateRef.current = locationChannel;
  };

  const checkProximityNotification = (vehiclePos) => {
    if (!userLocation.latitude || !vehicleLocation) return;

    // Calcular distancia
    const R = 6371;
    const dLat = (userLocation.latitude - vehiclePos.latitude) * Math.PI / 180;
    const dLon = (userLocation.longitude - vehiclePos.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(vehiclePos.latitude * Math.PI / 180) * 
              Math.cos(userLocation.latitude * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000; // Distancia en metros

    // Notificar si está a menos de 500m
    if (distance < 500) {
      addNotification(
        `🚐 El vehículo está cerca! Llegará en aproximadamente ${estimatedArrival?.minutes || 5} minutos`,
        'info'
      );
    }
  };

  const initializeNotifications = () => {
    // Notificación inicial
    addNotification('GPS Tracker conectado correctamente', 'success');
    
    // Si hay perros, mostrar información
    if (myDogs.length > 0) {
      const dogNames = myDogs.map(dog => dog.name).join(', ');
      addNotification(`Siguiendo el transporte de: ${dogNames}`, 'info');
    }
  };

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Máximo 10 notificaciones
    
    // Auto-remove después de 5 segundos si es success o info
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    }
  };

  const cleanup = () => {
    // Cleanup listeners
    if (locationUpdateRef.current) {
      locationUpdateRef.current.unsubscribe();
    }
    if (notificationRef.current) {
      notificationRef.current.unsubscribe();
    }
  };

  // ============================================
  // 🎨 RENDER DEL COMPONENTE
  // ============================================

  if (isLoading) {
    return (
      <div className="gps-tracker bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600">Conectando con GPS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="gps-tracker bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🚐</div>
            <div>
              <h3 className="text-lg font-semibold">GPS Tracker</h3>
              <p className="text-blue-100 text-sm">
                Estado: <span className={`font-medium ${
                  connectionStatus === 'connected' ? 'text-green-200' : 
                  connectionStatus === 'connecting' ? 'text-yellow-200' : 
                  'text-red-200'
                }`}>
                  {connectionStatus === 'connected' ? 'Conectado' :
                   connectionStatus === 'connecting' ? 'Conectando...' :
                   'Error de conexión'}
                </span>
              </p>
            </div>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        
        {/* Vehicle Info */}
        {selectedVehicle && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Vehículo Activo</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Placa:</span>
                <span className="font-medium ml-2">{selectedVehicle.license_plate}</span>
              </div>
              <div>
                <span className="text-gray-600">Conductor:</span>
                <span className="font-medium ml-2">{selectedVehicle.driver_name || 'No asignado'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Location Info */}
        {vehicleLocation && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-3">Ubicación Actual</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Latitud:</span>
                <span className="font-mono">{vehicleLocation.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Longitud:</span>
                <span className="font-mono">{vehicleLocation.longitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Velocidad:</span>
                <span className="font-medium">{vehicleLocation.speed} km/h</span>
              </div>
              {lastUpdate && (
                <div className="flex justify-between">
                  <span className="text-green-700">Última actualización:</span>
                  <span className="font-medium">{lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ETA */}
        {estimatedArrival && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Tiempo Estimado de Llegada</h4>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{estimatedArrival.minutes}</div>
                <div className="text-xs text-blue-500">minutos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{estimatedArrival.distance.toFixed(1)}</div>
                <div className="text-xs text-blue-500">km de distancia</div>
              </div>
            </div>
          </div>
        )}

        {/* My Dogs */}
        {myDogs.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Mis Perros en Transporte</h4>
            <div className="space-y-1">
              {myDogs.map(dog => (
                <div key={dog.id} className="flex items-center space-x-2 text-sm">
                  <span className="text-yellow-600">🐕</span>
                  <span className="font-medium">{dog.name}</span>
                  <span className="text-gray-500">({dog.breed})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Notificaciones Recientes</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 rounded text-sm ${
                    notification.type === 'error' ? 'bg-red-100 text-red-800' :
                    notification.type === 'success' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span>{notification.message}</span>
                    <span className="text-xs opacity-75">
                      {notification.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Vehicle Message */}
        {!selectedVehicle && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🚐</div>
            <p>No hay vehículos activos en este momento</p>
            <p className="text-sm">El tracking se activará cuando haya transporte disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPSTracker;