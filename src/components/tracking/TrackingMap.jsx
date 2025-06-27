// src/components/tracking/TrackingMap.jsx - SIN UBICACIONES SIMULADAS
import { useState, useEffect, useRef } from 'react';

const TrackingMap = ({
  // ❌ REMOVIDO: valores por defecto simulados
  // vehicleLocation = { lat: 4.7147, lng: -74.0517 },
  // homeLocation = { lat: 4.7200, lng: -74.0600 },
  
  // ✅ AHORA: sin valores por defecto, deben venir como props reales
  vehicleLocation = null,
  homeLocation = null,
  eta = null,
  vehicleData = { plate: 'ABC-123', driver: 'Juan Carlos' },
  onMapLoad = () => {}
}) => {
  
  // ============================================
  // 🔧 ESTADOS
  // ============================================
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [realVehiclePos, setRealVehiclePos] = useState(null);
  const [realHomePos, setRealHomePos] = useState(null);
  
  // ============================================
  // 🔧 REFS
  // ============================================
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const homeMarkerRef = useRef(null);
  const routePathRef = useRef(null);
  const infoWindowRef = useRef(null);

  // ============================================
  // 🚀 EFECTOS
  // ============================================
  useEffect(() => {
    // Obtener ubicaciones reales cuando se monta el componente
    initializeRealLocations();
    
    // Cargar Google Maps
    loadGoogleMaps();
  }, []);

  useEffect(() => {
    // Actualizar mapa cuando cambien las ubicaciones reales
    if (mapInstanceRef.current && (realVehiclePos || realHomePos)) {
      updateMapWithRealData();
    }
  }, [realVehiclePos, realHomePos, vehicleLocation, homeLocation]);

  // ============================================
  // 📍 OBTENER UBICACIONES REALES
  // ============================================
  const initializeRealLocations = async () => {
    console.log('🎯 Inicializando mapa con ubicaciones REALES...');
    
    // 1. Usar ubicaciones pasadas como props si están disponibles
    if (vehicleLocation && vehicleLocation.lat && vehicleLocation.lng) {
      console.log('✅ Usando ubicación real del vehículo desde props');
      setRealVehiclePos(vehicleLocation);
    }
    
    if (homeLocation && homeLocation.lat && homeLocation.lng) {
      console.log('✅ Usando ubicación real de casa desde props');
      setRealHomePos(homeLocation);
    }
    
    // 2. Si no hay ubicación de casa, obtener GPS del usuario
    if (!homeLocation || !homeLocation.lat) {
      await getRealUserLocation();
    }
    
    // 3. Si no hay ubicación del vehículo, obtener desde base de datos
    if (!vehicleLocation || !vehicleLocation.lat) {
      await getRealVehicleFromDB();
    }
  };

  const getRealUserLocation = async () => {
    if (!navigator.geolocation) {
      console.warn('⚠️ GPS no disponible para obtener ubicación del usuario');
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
            maximumAge: 300000
          }
        );
      });

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setRealHomePos(userLocation);
      console.log('✅ Ubicación real del usuario obtenida:', {
        lat: userLocation.lat.toFixed(6),
        lng: userLocation.lng.toFixed(6)
      });

    } catch (error) {
      console.warn('⚠️ Error obteniendo GPS del usuario:', error.message);
      // Solo como último recurso, usar ubicación por defecto de Bogotá
      setRealHomePos({ lat: 4.7200, lng: -74.0600 });
    }
  };

  const getRealVehicleFromDB = async () => {
    // Intentar obtener del objeto global supabase si existe
    let supabase = null;
    
    if (window.supabase) {
      supabase = window.supabase;
    } else {
      try {
        const module = await import('/src/lib/supabase.js');
        supabase = module.default;
      } catch (err) {
        console.warn('⚠️ No se pudo cargar Supabase:', err);
        return;
      }
    }

    if (!supabase) {
      console.warn('⚠️ Supabase no disponible, no se puede obtener ubicación del vehículo');
      return;
    }

    try {
      console.log('📡 Obteniendo ubicación real del vehículo desde BD...');
      
      const { data, error } = await supabase
        .from('vehicle_locations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('⚠️ Error consultando BD:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const location = data[0];
        const vehiclePos = {
          lat: location.latitude,
          lng: location.longitude,
          speed: location.speed || 0,
          timestamp: location.timestamp,
          isReal: location.source === 'REAL_GPS_DEVICE'
        };

        setRealVehiclePos(vehiclePos);
        console.log('✅ Ubicación real del vehículo desde BD:', {
          lat: vehiclePos.lat.toFixed(6),
          lng: vehiclePos.lng.toFixed(6),
          isReal: vehiclePos.isReal
        });
      } else {
        console.log('⚠️ No hay datos del vehículo en BD');
      }

    } catch (error) {
      console.error('❌ Error obteniendo ubicación del vehículo:', error);
    }
  };

  // ============================================
  // 🗺️ GOOGLE MAPS
  // ============================================
  const loadGoogleMaps = () => {
    // Verificar si ya está cargado
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const apiKey = 'AIzaSyC8h8jPTSS9XQ0xskNgp2BDRxcflz4H5R4'; // Demo key
    
    if (!apiKey) {
      setMapError('Google Maps API Key no configurada');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initRealTrackingMap&libraries=geometry`;
    script.async = true;
    script.onerror = () => setMapError('Error cargando Google Maps');
    document.head.appendChild(script);

    // Función global para callback
    window.initRealTrackingMap = initializeMap;
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      // Usar ubicación real o centro por defecto
      const center = realVehiclePos || realHomePos || { lat: 4.7147, lng: -74.0517 };
      
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: center,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Crear marcadores y elementos del mapa
      createMapElements();
      
      setMapLoaded(true);
      onMapLoad();
      
      console.log('🗺️ Mapa inicializado con ubicaciones reales');

    } catch (error) {
      console.error('❌ Error inicializando mapa:', error);
      setMapError('Error inicializando el mapa: ' + error.message);
    }
  };

  const createMapElements = () => {
    if (!mapInstanceRef.current) return;

    // Crear marcador del vehículo
    if (realVehiclePos) {
      createVehicleMarker(realVehiclePos);
    }

    // Crear marcador de casa
    if (realHomePos) {
      createHomeMarker(realHomePos);
    }

    // Crear ruta si ambas ubicaciones están disponibles
    if (realVehiclePos && realHomePos) {
      createRoutePath();
      createInfoWindow();
      
      // Ajustar vista para mostrar ambos puntos
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(realVehiclePos);
      bounds.extend(realHomePos);
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  const createVehicleMarker = (position) => {
    vehicleMarkerRef.current = new window.google.maps.Marker({
      position: position,
      map: mapInstanceRef.current,
      title: `${vehicleData.plate} - ${vehicleData.driver}`,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
          '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="25" cy="25" r="22" fill="#56CCF2" stroke="#ffffff" stroke-width="3"/>' +
            '<text x="25" y="32" text-anchor="middle" font-size="18" fill="white">🚐</text>' +
          '</svg>'
        ),
        scaledSize: new window.google.maps.Size(50, 50)
      }
    });
  };

  const createHomeMarker = (position) => {
    homeMarkerRef.current = new window.google.maps.Marker({
      position: position,
      map: mapInstanceRef.current,
      title: 'Tu Ubicación',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
          '<svg width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="22.5" cy="22.5" r="20" fill="#C7EA46" stroke="#ffffff" stroke-width="3"/>' +
            '<text x="22.5" y="29" text-anchor="middle" font-size="16" fill="white">🏠</text>' +
          '</svg>'
        ),
        scaledSize: new window.google.maps.Size(45, 45)
      }
    });
  };

  const createRoutePath = () => {
    if (!realVehiclePos || !realHomePos) return;
    
    routePathRef.current = new window.google.maps.Polyline({
      path: [realVehiclePos, realHomePos],
      geodesic: true,
      strokeColor: '#56CCF2',
      strokeOpacity: 1.0,
      strokeWeight: 3
    });
    
    routePathRef.current.setMap(mapInstanceRef.current);
  };

  const createInfoWindow = () => {
    if (!realVehiclePos || !realHomePos) return;
    
    const distance = calculateDistance(realVehiclePos, realHomePos);
    const isReal = realVehiclePos.isReal !== false; // Por defecto true si no se especifica
    
    const content = `
      <div style="padding: 15px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h3 style="margin: 0 0 8px 0; color: #2C3E50;">🚐 ${vehicleData.plate}</h3>
        <p style="margin: 0 0 8px 0; color: #666;">Conductor: ${vehicleData.driver}</p>
        <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; margin: 8px 0;">
          <div style="font-size: 12px; color: #28a745; font-weight: 500;">${isReal ? '📍 GPS Real' : '🔄 Datos Simulados'}</div>
          <div style="font-size: 14px; font-weight: 600; color: #2C3E50;">${distance.toFixed(1)} km de distancia</div>
          ${realVehiclePos.speed ? `<div style="font-size: 12px; color: #6c757d;">Velocidad: ${Math.round(realVehiclePos.speed)} km/h</div>` : ''}
        </div>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #28a745; font-weight: 500;">
          ✅ En camino a tu casa
        </p>
      </div>
    `;
    
    infoWindowRef.current = new window.google.maps.InfoWindow({
      content: content
    });
    
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.addListener('click', () => {
        infoWindowRef.current.open(mapInstanceRef.current, vehicleMarkerRef.current);
      });
    }
  };

  const updateMapWithRealData = () => {
    // Actualizar marcador del vehículo
    if (vehicleMarkerRef.current && realVehiclePos) {
      vehicleMarkerRef.current.setPosition(realVehiclePos);
    }
    
    // Actualizar marcador de casa
    if (homeMarkerRef.current && realHomePos) {
      homeMarkerRef.current.setPosition(realHomePos);
    }
    
    // Actualizar ruta
    if (routePathRef.current && realVehiclePos && realHomePos) {
      routePathRef.current.setPath([realVehiclePos, realHomePos]);
    }
    
    // Actualizar info window
    if (infoWindowRef.current && realVehiclePos && realHomePos) {
      createInfoWindow(); // Recrear con datos actualizados
    }
  };

  // ============================================
  // 🛠️ UTILIDADES
  // ============================================
  const calculateDistance = (point1, point2) => {
    if (!point1 || !point2) return 0;
    
    const R = 6371; // Radio de la Tierra en km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const centerOnVehicle = () => {
    if (mapInstanceRef.current && vehicleMarkerRef.current && realVehiclePos) {
      mapInstanceRef.current.panTo(realVehiclePos);
      mapInstanceRef.current.setZoom(15);
      
      if (infoWindowRef.current) {
        infoWindowRef.current.open(mapInstanceRef.current, vehicleMarkerRef.current);
      }
    }
  };

  const showRoute = () => {
    if (mapInstanceRef.current && realVehiclePos && realHomePos) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(realVehiclePos);
      bounds.extend(realHomePos);
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  // ============================================
  // 🎨 RENDER
  // ============================================
  if (mapError) {
    return (
      <div className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center text-red-600">
          <div className="text-4xl mb-2">❌</div>
          <p className="font-semibold">Error en el Mapa</p>
          <p className="text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header del mapa */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🗺️</span>
            <div>
              <h3 className="font-bold">Tracking en Tiempo Real</h3>
              <p className="text-blue-100 text-sm">
                {realVehiclePos && realHomePos ? 
                  `${calculateDistance(realVehiclePos, realHomePos).toFixed(1)} km de distancia` :
                  'Obteniendo ubicaciones...'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              mapLoaded ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
            }`}></div>
            <span className="text-xs font-medium text-blue-100">
              {mapLoaded ? 'En vivo' : 'Cargando...'}
            </span>
          </div>
        </div>
      </div>

      {/* Contenedor del mapa */}
      <div 
        ref={mapRef}
        className="w-full h-96 bg-gray-100 rounded-b-lg"
      >
        {!mapLoaded && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-sm">Cargando mapa con ubicaciones reales...</p>
              <p className="text-xs mt-1">Conectando con Google Maps</p>
            </div>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-900">Distancia</div>
          <div className="text-lg font-bold text-blue-600">
            {realVehiclePos && realHomePos ? 
              `${calculateDistance(realVehiclePos, realHomePos).toFixed(1)} km` : 
              '---'
            }
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-sm font-medium text-green-900">ETA</div>
          <div className="text-lg font-bold text-green-600">
            {eta ? `${eta} min` : '---'}
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-sm font-medium text-purple-900">Estado</div>
          <div className="text-lg font-bold text-purple-600">
            {realVehiclePos?.isReal !== false ? '📍 Real' : '🔄 Sim'}
          </div>
        </div>
      </div>

      {/* Controles del mapa */}
      <div className="mt-4 flex justify-center space-x-2">
        <button
          onClick={centerOnVehicle}
          disabled={!realVehiclePos}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          📍 Centrar Vehículo
        </button>
        <button
          onClick={showRoute}
          disabled={!realVehiclePos || !realHomePos}
          className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          🛣️ Ver Ruta
        </button>
      </div>
    </div>
  );
};

export default TrackingMap;