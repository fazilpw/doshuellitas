// Archivo: src/hooks/useRealtimeTracking.js
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export function useRealtimeTracking(vehicleId, dogId) {
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [routeStatus, setRouteStatus] = useState('inactive');

  useEffect(() => {
    // Suscribirse a actualizaciones de ubicación en tiempo real
    const subscription = supabase
      .channel(`vehicle-${vehicleId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'vehicle_locations',
        filter: `vehicle_id=eq.${vehicleId}`
      }, (payload) => {
        const newLocation = payload.new;
        setVehicleLocation(newLocation);
        
        // Calcular nuevo ETA
        calculateETAForDog(newLocation, dogId);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [vehicleId, dogId]);

  const calculateETAForDog = async (vehicleLocation, dogId) => {
    // Obtener dirección del perro
    const { data: dog } = await supabase
      .from('dogs')
      .select('home_address, home_latitude, home_longitude')
      .eq('id', dogId)
      .single();

    if (dog && dog.home_latitude && dog.home_longitude) {
      const etaData = await calculateETA(
        `${vehicleLocation.latitude},${vehicleLocation.longitude}`,
        `${dog.home_latitude},${dog.home_longitude}`
      );
      
      setEta(etaData);
    }
  };

  return { vehicleLocation, eta, routeStatus };
}