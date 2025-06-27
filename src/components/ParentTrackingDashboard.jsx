// Archivo: src/components/ParentTrackingDashboard.jsx
import { useState } from 'react';
import TrackingMap from './TrackingMap';
import { useRealtimeTracking } from '../hooks/useRealtimeTracking';

const ParentTrackingDashboard = ({ dogId }) => {
  const { vehicleLocation, eta, routeStatus } = useRealtimeTracking('vehicle-1', dogId);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      
      {/* Header con estado */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🚐 Transporte en Vivo</h2>
            <p className="text-gray-600">Siguiendo el vehículo de Max</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              routeStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {routeStatus === 'active' ? '🟢 En ruta' : '⚪ Inactivo'}
            </div>
          </div>
        </div>
      </div>

      {/* ETA Card */}
      {eta && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">⏱️ Tiempo Estimado de Llegada</h3>
              <p className="text-blue-100">Basado en tráfico actual</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{eta.eta} min</div>
              <div className="text-blue-200 text-sm">{eta.distance}</div>
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📍 Ubicación en Tiempo Real</h3>
        <TrackingMap 
          vehicleLocation={vehicleLocation} 
          dogId={dogId}
          showRoute={true}
        />
      </div>

      {/* Timeline de eventos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Eventos del Viaje</h3>
        <div className="space-y-3">
          <div className="flex items-center text-green-600">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span>14:30 - Vehículo salió del colegio</span>
          </div>
          <div className="flex items-center text-blue-600">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <span>14:45 - En camino a tu dirección</span>
          </div>
          <div className="flex items-center text-gray-400">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
            <span>15:00 - Llegada estimada</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentTrackingDashboard;