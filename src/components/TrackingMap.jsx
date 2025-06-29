// src/components/tracking/TrackingMap.jsx
// 🗺️ MAPA ORIGINAL COMPARTIDO - SIN UBICACIONES SIMULADAS
// ✅ Sistema original restaurado

import { useState, useEffect, useRef } from 'react';

const TrackingMap = ({
  vehicleLocation = null,
  homeLocation = null,
  eta = null,
  vehicleData = { plate: 'ABC-123', driver: 'Juan Carlos' },
  onMapLoad = () => {}
}) => {
  
  // ============================================
  // 🔧 ESTADOS (ORIGINALES)
  // ============================================
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [realVehiclePos, setRealVehiclePos] = useState(null);
  const [realHomePos, setRealHomePos] = useState(null);
  
  // ============================================
  // 🔧 REFS (ORIGINALES)
  // ============================================
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const homeMarkerRef = useRef(null);
  const routePathRef = useRef(null);
  const infoWindowRef = useRef(null);

  // ============================================
  // 🚀 EFECTOS (ORIGINALES)
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
  // 📍 OBTENER UBICACIONES REALES (ORIGINAL)
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

  // ============================================
  // 📍 OBTENER UBICACIÓN REAL DEL USUARIO (ORIGINAL)
  // ============================================
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

  // ============================================
  // 🚐 OBTENER UBICACIÓN REAL DEL VEHÍCULO (ORIGINAL)
  // ============================================
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
  // 🗺️ GOOGLE MAPS (ORIGINAL)
  // ============================================
  const loadGoogleMaps = () => {
    // Verificar si ya está cargado
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;
    
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

  // ============================================
  // 🗺️ INICIALIZAR MAPA (ORIGINAL)
  // ============================================
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      // Usar ubicación real o centro por defecto
      const center = realHomePos || realVehiclePos || { lat: 4.7110, lng: -74.0721 };

      // Crear mapa
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: center,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMapLoaded(true);
      console.log('✅ Mapa de Google inicializado');
      
      // Notificar que el mapa está listo
      onMapLoad();
      
    } catch (error) {
      console.error('❌ Error inicializando mapa:', error);
      setMapError('Error al crear el mapa');
    }
  };

  // ============================================
  // 🔄 ACTUALIZAR MAPA CON DATOS REALES (ORIGINAL)
  // ============================================
  const updateMapWithRealData = () => {
    if (!mapInstanceRef.current || !window.google) return;

    try {
      // Limpiar marcadores anteriores
      clearMarkers();

      // Agregar marcador del vehículo si existe
      if (realVehiclePos) {
        addVehicleMarker(realVehiclePos);
      }

      // Agregar marcador de casa si existe
      if (realHomePos) {
        addHomeMarker(realHomePos);
      }

      // Ajustar zoom para mostrar ambos puntos
      if (realVehiclePos && realHomePos) {
        fitMapToBounds();
      }

      console.log('✅ Mapa actualizado con datos reales');
      
    } catch (error) {
      console.error('❌ Error actualizando mapa:', error);
    }
  };

  // ============================================
  // 📍 AGREGAR MARCADORES (ORIGINAL)
  // ============================================
  const addVehicleMarker = (position) => {
    if (!mapInstanceRef.current) return;

    const marker = new window.google.maps.Marker({
      position: { lat: position.lat, lng: position.lng },
      map: mapInstanceRef.current,
      title: `Vehículo ${vehicleData.plate}`,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="#FFFFFF" stroke-width="3"/>
            <text x="16" y="20" font-family="Arial" font-size="14" fill="white" text-anchor="middle">🚐</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32)
      }
    });

    // Info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0;">🚐 ${vehicleData.plate}</h3>
          <p style="margin: 0;"><strong>Conductor:</strong> ${vehicleData.driver}</p>
          <p style="margin: 4px 0 0 0;"><strong>Velocidad:</strong> ${Math.round(position.speed || 0)} km/h</p>
          ${position.isReal ? '<p style="margin: 4px 0 0 0; color: green;"><strong>📍 GPS Real</strong></p>' : ''}
        </div>
      `
    });

    marker.addListener('click', () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      infoWindow.open(mapInstanceRef.current, marker);
      infoWindowRef.current = infoWindow;
    });

    vehicleMarkerRef.current = marker;
  };

  const addHomeMarker = (position) => {
    if (!mapInstanceRef.current) return;

    const marker = new window.google.maps.Marker({
      position: { lat: position.lat, lng: position.lng },
      map: mapInstanceRef.current,
      title: 'Tu ubicación',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#10B981" stroke="#FFFFFF" stroke-width="3"/>
            <text x="16" y="20" font-family="Arial" font-size="14" fill="white" text-anchor="middle">🏠</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32)
      }
    });

    homeMarkerRef.current = marker;
  };

  // ============================================
  // 🧹 LIMPIAR MARCADORES (ORIGINAL)
  // ============================================
  const clearMarkers = () => {
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setMap(null);
      vehicleMarkerRef.current = null;
    }
    if (homeMarkerRef.current) {
      homeMarkerRef.current.setMap(null);
      homeMarkerRef.current = null;
    }
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }
  };

  // ============================================
  // 🔍 AJUSTAR ZOOM (ORIGINAL)
  // ============================================
  const fitMapToBounds = () => {
    if (!mapInstanceRef.current || !realVehiclePos || !realHomePos) return;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: realVehiclePos.lat, lng: realVehiclePos.lng });
    bounds.extend({ lat: realHomePos.lat, lng: realHomePos.lng });
    
    mapInstanceRef.current.fitBounds(bounds);
    
    // Asegurar zoom mínimo
    const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
      if (mapInstanceRef.current.getZoom() > 15) {
        mapInstanceRef.current.setZoom(15);
      }
      window.google.maps.event.removeListener(listener);
    });
  };

  // ============================================
  // 🎨 RENDER (ORIGINAL)
  // ============================================
  return (
    <div className="w-full h-96 bg-gray-200 rounded-lg relative">
      {mapError ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl mb-2">❌</div>
            <p className="text-red-600 font-semibold">{mapError}</p>
            <p className="text-sm text-gray-600 mt-2">
              Verifica la configuración de Google Maps API
            </p>
          </div>
        </div>
      ) : !mapLoaded ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      ) : null}
      
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ display: mapLoaded ? 'block' : 'none' }}
      />
      
      {/* Overlay de información */}
      {mapLoaded && (realVehiclePos || realHomePos) && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
          <div className="text-sm space-y-1">
            {realVehiclePos && (
              <div className="flex items-center text-blue-600">
                <span className="mr-2">🚐</span>
                <span>Vehículo: {vehicleData.plate}</span>
                {realVehiclePos.isReal && <span className="ml-1 text-green-600">📍</span>}
              </div>
            )}
            {realHomePos && (
              <div className="flex items-center text-green-600">
                <span className="mr-2">🏠</span>
                <span>Tu ubicación</span>
              </div>
            )}
            {eta && (
              <div className="flex items-center text-purple-600">
                <span className="mr-2">⏱️</span>
                <span>ETA: {eta.minutes} min</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingMap;