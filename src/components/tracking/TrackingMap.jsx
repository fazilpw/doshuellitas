// src/components/tracking/TrackingMap.jsx
import { useState, useEffect, useRef } from 'react';

const TrackingMap = ({ 
  vehicleLocation = { lat: 4.7147, lng: -74.0517 }, 
  homeLocation = { lat: 4.7200, lng: -74.0600 },
  eta = 25,
  vehicleData = { plate: 'ABC-123', driver: 'Juan Carlos' },
  onMapLoad = () => {}
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiError, setApiError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const homeMarkerRef = useRef(null);
  const routePathRef = useRef(null);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    loadGoogleMaps();
    
    return () => {
      // Cleanup si es necesario
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  // Actualizar posición del vehículo cuando cambie
  useEffect(() => {
    if (mapLoaded && vehicleMarkerRef.current && window.google) {
      updateVehiclePosition();
    }
  }, [vehicleLocation, mapLoaded]);

  const loadGoogleMaps = () => {
    // Verificar si ya está cargado
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      setApiError('API Key de Google Maps no configurada');
      return;
    }

    // Crear callback único para este componente
    const callbackName = `initTrackingMap_${Date.now()}`;
    window[callbackName] = initializeMap;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      setApiError('Error cargando Google Maps. Verifica tu API Key.');
      console.error('Error loading Google Maps script');
    };

    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) {
      console.error('Map container or Google Maps not available');
      return;
    }

    try {
      // Crear el mapa
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: vehicleLocation,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      });

      mapInstanceRef.current = map;

      // Crear marcador del vehículo
      createVehicleMarker(map);
      
      // Crear marcador de casa
      createHomeMarker(map);
      
      // Crear ruta
      createRoutePath(map);
      
      // Crear info window
      createInfoWindow(map);

      // Ajustar vista para mostrar ambos puntos
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(vehicleLocation);
      bounds.extend(homeLocation);
      map.fitBounds(bounds);

      // Asegurar zoom mínimo
      const listener = window.google.maps.event.addListener(map, "idle", function() {
        if (map.getZoom() > 16) map.setZoom(16);
        window.google.maps.event.removeListener(listener);
      });

      setMapLoaded(true);
      onMapLoad();
      console.log('✅ Mapa de tracking inicializado correctamente');

    } catch (error) {
      console.error('Error inicializando mapa:', error);
      setApiError('Error inicializando el mapa');
    }
  };

  const createVehicleMarker = (map) => {
    const vehicleIcon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="25" r="22" fill="#56CCF2" stroke="#ffffff" stroke-width="3"/>
          <circle cx="25" cy="25" r="18" fill="#4A90E2"/>
          <text x="25" y="32" text-anchor="middle" font-size="18" fill="white" font-weight="bold">🚐</text>
          <circle cx="25" cy="25" r="3" fill="#ffffff" opacity="0.8"/>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(50, 50),
      anchor: new window.google.maps.Point(25, 25)
    };

    vehicleMarkerRef.current = new window.google.maps.Marker({
      position: vehicleLocation,
      map: map,
      title: `Transporte ${vehicleData.plate}`,
      icon: vehicleIcon,
      animation: window.google.maps.Animation.DROP,
      zIndex: 1000
    });
  };

  const createHomeMarker = (map) => {
    const homeIcon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22.5" cy="22.5" r="20" fill="#C7EA46" stroke="#ffffff" stroke-width="3"/>
          <circle cx="22.5" cy="22.5" r="16" fill="#A4D63A"/>
          <text x="22.5" y="29" text-anchor="middle" font-size="16" fill="white" font-weight="bold">🏠</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(45, 45),
      anchor: new window.google.maps.Point(22.5, 22.5)
    };

    homeMarkerRef.current = new window.google.maps.Marker({
      position: homeLocation,
      map: map,
      title: 'Tu Casa',
      icon: homeIcon,
      zIndex: 999
    });
  };

  const createRoutePath = (map) => {
    routePathRef.current = new window.google.maps.Polyline({
      path: [vehicleLocation, homeLocation],
      geodesic: true,
      strokeColor: '#56CCF2',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      zIndex: 100
    });

    routePathRef.current.setMap(map);
  };

  const createInfoWindow = (map) => {
    const distance = calculateDistance(vehicleLocation, homeLocation);
    
    infoWindowRef.current = new window.google.maps.InfoWindow({
      content: createInfoWindowContent(distance),
      disableAutoPan: false
    });

    // Mostrar info window automáticamente
    setTimeout(() => {
      if (vehicleMarkerRef.current && infoWindowRef.current) {
        infoWindowRef.current.open(map, vehicleMarkerRef.current);
      }
    }, 1000);

    // Click listener para el marcador del vehículo
    vehicleMarkerRef.current.addListener('click', () => {
      infoWindowRef.current.open(map, vehicleMarkerRef.current);
    });
  };

  const createInfoWindowContent = (distance) => {
    return `
      <div style="padding: 15px; min-width: 200px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="margin-bottom: 10px;">
          <span style="font-size: 24px;">🚐</span>
        </div>
        <h3 style="margin: 0 0 8px 0; color: #2C3E50; font-size: 16px; font-weight: 600;">
          Transporte ${vehicleData.plate}
        </h3>
        <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">
          Conductor: ${vehicleData.driver}
        </p>
        <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; margin: 8px 0;">
          <p style="margin: 0; color: #56CCF2; font-size: 14px; font-weight: 500;">
            📍 Distancia: ${distance.toFixed(1)} km
          </p>
          <p style="margin: 3px 0 0 0; color: #56CCF2; font-size: 14px; font-weight: 500;">
            ⏱️ ETA: ${eta} minutos
          </p>
        </div>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #28a745; font-weight: 500;">
          ✅ En camino a tu casa
        </p>
      </div>
    `;
  };

  const updateVehiclePosition = () => {
    if (!vehicleMarkerRef.current || !window.google) return;

    // Animar movimiento del marcador
    vehicleMarkerRef.current.setPosition(vehicleLocation);
    
    // Actualizar ruta
    if (routePathRef.current) {
      routePathRef.current.setPath([vehicleLocation, homeLocation]);
    }

    // Actualizar info window
    if (infoWindowRef.current) {
      const distance = calculateDistance(vehicleLocation, homeLocation);
      infoWindowRef.current.setContent(createInfoWindowContent(distance));
    }

    // Centrar mapa en nueva posición si está muy lejos
    if (mapInstanceRef.current) {
      const bounds = mapInstanceRef.current.getBounds();
      if (bounds && !bounds.contains(vehicleLocation)) {
        mapInstanceRef.current.panTo(vehicleLocation);
      }
    }
  };

  const calculateDistance = (point1, point2) => {
    if (!window.google) return 0;
    
    const service = new window.google.maps.DistanceMatrixService();
    
    // Cálculo simple usando fórmula haversine para demo
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
    if (mapInstanceRef.current && vehicleMarkerRef.current) {
      mapInstanceRef.current.panTo(vehicleLocation);
      mapInstanceRef.current.setZoom(15);
      
      // Mostrar info window
      if (infoWindowRef.current) {
        infoWindowRef.current.open(mapInstanceRef.current, vehicleMarkerRef.current);
      }
    }
  };

  const centerOnRoute = () => {
    if (mapInstanceRef.current && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(vehicleLocation);
      bounds.extend(homeLocation);
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  if (apiError) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-600 p-6">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-lg font-semibold mb-2">Mapa no disponible</h3>
          <p className="text-sm">{apiError}</p>
          <p className="text-xs mt-2 text-gray-500">
            Verifica la configuración de Google Maps API
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={centerOnVehicle}
          className="bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-lg shadow-md border border-gray-200 transition-colors"
          title="Centrar en vehículo"
        >
          <span className="text-lg">🚐</span>
        </button>
        
        <button
          onClick={centerOnRoute}
          className="bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-lg shadow-md border border-gray-200 transition-colors"
          title="Ver ruta completa"
        >
          <span className="text-lg">🗺️</span>
        </button>
      </div>

      {/* Indicador de estado */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${mapLoaded ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-xs font-medium text-gray-700">
              {mapLoaded ? 'En vivo' : 'Cargando...'}
            </span>
          </div>
        </div>
      </div>

      {/* Contenedor del mapa */}
      <div 
        ref={mapRef}
        className="w-full h-96 bg-gray-100 rounded-lg"
      >
        {!mapLoaded && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-sm">Cargando mapa...</p>
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
            {calculateDistance(vehicleLocation, homeLocation).toFixed(1)} km
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-sm font-medium text-green-900">ETA</div>
          <div className="text-lg font-bold text-green-600">{eta} min</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-sm font-medium text-purple-900">Estado</div>
          <div className="text-lg font-bold text-purple-600">En ruta</div>
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;