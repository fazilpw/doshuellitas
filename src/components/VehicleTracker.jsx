// Archivo: src/components/VehicleTracker.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const VehicleTracker = ({ vehicleId }) => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  // Función para obtener ubicación del dispositivo
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada en este dispositivo');
      return;
    }

    setIsTracking(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        
        // Guardar en base de datos
        const { error } = await supabase
          .from('vehicle_locations')
          .insert({
            vehicle_id: vehicleId,
            latitude,
            longitude,
            heading: heading || 0,
            speed: speed || 0,
            accuracy: position.coords.accuracy
          });

        if (!error) {
          setLocation({ latitude, longitude });
          // Enviar notificación push a padres
          await notifyParents(vehicleId, latitude, longitude);
        }
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  // Tracking automático cada 30 segundos
  useEffect(() => {
    const interval = setInterval(getCurrentLocation, 30000);
    return () => clearInterval(interval);
  }, [vehicleId]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-bold mb-4">🚐 Control del Conductor</h3>
      
      <button 
        onClick={getCurrentLocation}
        disabled={isTracking}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg disabled:opacity-50"
      >
        {isTracking ? '📍 Actualizando...' : '📍 Actualizar Ubicación'}
      </button>

      {location && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ Ubicación actualizada: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
};