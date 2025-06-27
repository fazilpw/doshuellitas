// Archivo: src/components/TrackingMap.jsx
import { useState, useEffect } from 'react';

const TrackingMap = ({ dogId }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [route, setRoute] = useState(null);

  // Cargar Google Maps
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  return (
    <div className="w-full h-96 bg-gray-200 rounded-lg">
      {mapLoaded ? (
        <div id="tracking-map" className="w-full h-full rounded-lg">
          {/* Mapa se renderiza aquí */}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingMap;