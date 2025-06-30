// src/components/tracking/TrackingMap.jsx
// 🗺️ COMPONENTE ARREGLADO - SIN ERRORES DE REACT
// ✅ Funciona con Google Maps + React sin conflictos

import { useState, useEffect, useRef, useCallback } from 'react';

const TrackingMap = ({ 
  vehicleData = { plate: 'ABC-123', driver: 'Conductor' },
  realVehiclePos = null,
  realHomePos = null,
  onMapLoad = () => {},
  eta = null
}) => {
  // ============================================
  // 🏗️ ESTADO Y REFS
  // ============================================
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // REFS - Con cleanup mejorado
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const homeMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const cleanupRef = useRef(false);

  // ============================================
  // 🧹 FUNCIÓN DE LIMPIEZA MEJORADA
  // ============================================
  const cleanupMap = useCallback(() => {
    try {
      // Marcar que estamos limpiando
      cleanupRef.current = true;

      // Cerrar info window
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }

      // Remover marcadores de forma segura
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.setMap(null);
        vehicleMarkerRef.current = null;
      }

      if (homeMarkerRef.current) {
        homeMarkerRef.current.setMap(null);
        homeMarkerRef.current = null;
      }

      // No limpiar mapInstanceRef aquí para evitar conflictos
      
    } catch (error) {
      console.warn('⚠️ Error en cleanup (ignorado):', error.message);
    }
  }, []);

  // ============================================
  // 🗺️ INICIALIZAR GOOGLE MAPS
  // ============================================
  const initializeMap = useCallback(() => {
    // Evitar inicialización si estamos limpiando
    if (cleanupRef.current || !mapRef.current || !window.google) {
      return;
    }

    try {
      setIsInitializing(true);
      
      // Centro del mapa
      const center = realHomePos || realVehiclePos || { lat: 4.7110, lng: -74.0721 };

      // Crear mapa solo si no existe
      if (!mapInstanceRef.current) {
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

        console.log('✅ Mapa de Google inicializado');
      }

      setMapLoaded(true);
      setIsInitializing(false);
      onMapLoad();
      
    } catch (error) {
      console.error('❌ Error inicializando mapa:', error);
      setMapError('Error al crear el mapa');
      setIsInitializing(false);
    }
  }, [realHomePos, realVehiclePos, onMapLoad]);

  // ============================================
  // 📍 AGREGAR MARCADORES DE FORMA SEGURA
  // ============================================
  const addVehicleMarker = useCallback((position) => {
    if (!mapInstanceRef.current || !window.google || cleanupRef.current) return;

    try {
      // Remover marcador anterior si existe
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.setMap(null);
      }

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

      vehicleMarkerRef.current = marker;

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

    } catch (error) {
      console.warn('⚠️ Error agregando marcador vehículo:', error.message);
    }
  }, [vehicleData]);

  const addHomeMarker = useCallback((position) => {
    if (!mapInstanceRef.current || !window.google || cleanupRef.current) return;

    try {
      // Remover marcador anterior si existe
      if (homeMarkerRef.current) {
        homeMarkerRef.current.setMap(null);
      }

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

    } catch (error) {
      console.warn('⚠️ Error agregando marcador casa:', error.message);
    }
  }, []);

  // ============================================
  // 📏 AJUSTAR ZOOM
  // ============================================
  const fitMapToBounds = useCallback(() => {
    if (!mapInstanceRef.current || !realVehiclePos || !realHomePos || cleanupRef.current) return;

    try {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: realVehiclePos.lat, lng: realVehiclePos.lng });
      bounds.extend({ lat: realHomePos.lat, lng: realHomePos.lng });
      
      mapInstanceRef.current.fitBounds(bounds);
      
      // Zoom mínimo
      const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current && mapInstanceRef.current.getZoom() > 15) {
          mapInstanceRef.current.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });

    } catch (error) {
      console.warn('⚠️ Error ajustando zoom:', error.message);
    }
  }, [realVehiclePos, realHomePos]);

  // ============================================
  // 📊 CALCULAR DISTANCIA
  // ============================================
  const calculateDistance = useCallback((pos1, pos2) => {
    if (!pos1 || !pos2) return 0;
    
    const R = 6371; // Radio de la Tierra en km
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // ============================================
  // ⚙️ CARGAR GOOGLE MAPS API
  // ============================================
  const loadGoogleMaps = useCallback(() => {
    // Si ya está cargado, inicializar
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const apiKey = 'AIzaSyC8h8jPTSS9XQ0xskNgp2BDRxcflz4H5R4';
    
    if (!apiKey) {
      setMapError('Google Maps API Key no configurada');
      return;
    }

    // Evitar múltiples scripts
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initRealTrackingMap&libraries=geometry`;
    script.async = true;
    script.onerror = () => setMapError('Error cargando Google Maps');
    
    // Callback global único
    window.initRealTrackingMap = initializeMap;
    
    document.head.appendChild(script);
  }, [initializeMap]);

  // ============================================
  // 🔄 ACTUALIZAR MARCADORES
  // ============================================
  const updateMarkers = useCallback(() => {
    if (!mapLoaded || cleanupRef.current) return;

    try {
      // Agregar marcadores
      if (realVehiclePos) {
        addVehicleMarker(realVehiclePos);
      }

      if (realHomePos) {
        addHomeMarker(realHomePos);
      }

      // Ajustar vista
      if (realVehiclePos && realHomePos) {
        fitMapToBounds();
      }

    } catch (error) {
      console.warn('⚠️ Error actualizando marcadores:', error.message);
    }
  }, [mapLoaded, realVehiclePos, realHomePos, addVehicleMarker, addHomeMarker, fitMapToBounds]);

  // ============================================
  // 🎯 EFFECTS CON CLEANUP MEJORADO
  // ============================================
  
  // Inicializar mapa
  useEffect(() => {
    cleanupRef.current = false;
    loadGoogleMaps();
  }, [loadGoogleMaps]);

  // Actualizar marcadores cuando cambien las posiciones
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, [cleanupMap]);

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
          <button 
            onClick={() => {
              setMapError(null);
              setMapLoaded(false);
              loadGoogleMaps();
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Reintentar
          </button>
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
      <div className="relative">
        <div 
          ref={mapRef}
          className="w-full h-96 bg-gray-100 rounded-b-lg"
          style={{ minHeight: '384px' }}
        />
        
        {/* Loading overlay */}
        {(isInitializing || !mapLoaded) && (
          <div className="absolute inset-0 bg-gray-100 rounded-b-lg flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-sm">Cargando mapa con ubicaciones reales...</p>
              <p className="text-xs mt-1">Conectando con Google Maps</p>
            </div>
          </div>
        )}

        {/* Información overlay */}
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
          <div className="text-sm font-medium text-green-900">Velocidad</div>
          <div className="text-lg font-bold text-green-600">
            {realVehiclePos ? `${Math.round(realVehiclePos.speed || 0)} km/h` : '---'}
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-sm font-medium text-purple-900">ETA</div>
          <div className="text-lg font-bold text-purple-600">
            {eta ? `${eta.minutes} min` : '---'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;