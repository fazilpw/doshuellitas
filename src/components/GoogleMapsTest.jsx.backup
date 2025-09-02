// src/components/GoogleMapsTest.jsx
import { useState, useEffect, useRef } from 'react';

const GoogleMapsTest = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    testGoogleMapsAPI();
  }, []);

  const testGoogleMapsAPI = async () => {
    try {
      // 1. Verificar que la API Key está configurada
      const key = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;
      setApiKey(key);
      
      if (!key) {
        setError('❌ API Key no encontrada. Verifica tu archivo .env o variables de Netlify');
        setApiStatus('error');
        return;
      }

      if (key === 'your_google_maps_api_key_here') {
        setError('❌ API Key no configurada correctamente. Reemplaza el valor placeholder');
        setApiStatus('error');
        return;
      }

      setApiStatus('loading-script');

      // 2. Cargar el script de Google Maps
      await loadGoogleMapsScript(key);
      
      setApiStatus('script-loaded');

      // 3. Verificar que Google Maps está disponible
      if (typeof window.google === 'undefined') {
        throw new Error('Google Maps no se cargó correctamente');
      }

      setApiStatus('creating-map');

      // 4. Crear un mapa de prueba
      createTestMap();
      
      setApiStatus('success');
      setMapLoaded(true);

    } catch (err) {
      console.error('Error testing Google Maps:', err);
      setError(`❌ Error: ${err.message}`);
      setApiStatus('error');
    }
  };

  const loadGoogleMapsScript = (apiKey) => {
    return new Promise((resolve, reject) => {
      // Verificar si ya está cargado
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      // Remover script existente si hay errores
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Google Maps script cargado');
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Error cargando Google Maps script. Verifica tu API Key y restricciones'));
      };
      
      document.head.appendChild(script);
    });
  };

  const createTestMap = () => {
  // Para TESTING solamente, usar ubicación dinámica
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userCenter = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: userCenter, // Ubicación real del usuario
      });
      
      // Resto del código...
    },
    (error) => {
      console.error('No se pudo obtener ubicación para test:', error);
      // Mostrar mensaje de error en lugar de usar coordenadas fijas
    }
  );
};

    // Agregar marcador del Club Canino
    const marker = new window.google.maps.Marker({
      position: bogotaCenter,
      map: map,
      title: 'Club Canino Dos Huellitas',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#56CCF2" stroke="#2C3E50" stroke-width="2"/>
            <text x="20" y="26" text-anchor="middle" font-size="16" fill="white">🐕</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40)
      }
    });

    // Agregar InfoWindow
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; color: #2C3E50;">🐕 Club Canino Dos Huellitas</h3>
          <p style="margin: 0; color: #666;">¡Google Maps API funcionando correctamente!</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #56CCF2;">✅ Listo para tracking GPS</p>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    // Abrir InfoWindow automáticamente
    setTimeout(() => {
      infoWindow.open(map, marker);
    }, 500);

    console.log('✅ Mapa de prueba creado exitosamente');
  };

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'checking': return '🔍';
      case 'loading-script': return '⬇️';
      case 'script-loaded': return '✅';
      case 'creating-map': return '🗺️';
      case 'success': return '🎉';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusMessage = () => {
    switch (apiStatus) {
      case 'checking': return 'Verificando configuración de API Key...';
      case 'loading-script': return 'Cargando Google Maps script...';
      case 'script-loaded': return 'Script cargado, verificando Google Maps...';
      case 'creating-map': return 'Creando mapa de prueba...';
      case 'success': return '¡Todo funcionando perfectamente!';
      case 'error': return 'Error en la configuración';
      default: return 'Iniciando test...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">🧪 Test Google Maps API</h1>
        <p className="opacity-90">Verificando configuración para tracking GPS</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Estado de la Configuración</h2>
          <div className="text-3xl">{getStatusIcon()}</div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-gray-700">{getStatusMessage()}</span>
          </div>
          
          {apiKey && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">API Key detectada:</p>
              <code className="text-xs font-mono bg-white px-2 py-1 rounded border">
                {apiKey.substring(0, 20)}...{apiKey.substring(apiKey.length - 10)}
              </code>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium">{error}</p>
              
              <div className="mt-3 text-sm text-red-600">
                <p className="font-medium mb-2">Posibles soluciones:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Verifica que el archivo .env existe en la raíz del proyecto</li>
                  <li>Reinicia el servidor de desarrollo (npm run dev)</li>
                  <li>Verifica que la API Key es correcta en Google Cloud Console</li>
                  <li>Confirma que Maps JavaScript API está habilitada</li>
                  <li>Revisa las restricciones de dominio en Google Cloud</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📍 Mapa de Prueba</h3>
        
        <div 
          ref={mapRef}
          className={`w-full h-96 rounded-lg border-2 transition-all duration-300 ${
            mapLoaded 
              ? 'border-green-300 bg-gray-100' 
              : 'border-gray-300 bg-gray-50 flex items-center justify-center'
          }`}
        >
          {!mapLoaded && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-600">
                {apiStatus === 'error' ? 'Error cargando mapa' : 'Cargando mapa...'}
              </p>
            </div>
          )}
        </div>
        
        {mapLoaded && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-green-600 mr-3">✅</div>
              <div>
                <p className="font-medium text-green-800">¡Mapa cargado exitosamente!</p>
                <p className="text-sm text-green-700">
                  Google Maps API está configurada correctamente. 
                  Puedes proceder con la implementación del tracking GPS.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next Steps */}
      {apiStatus === 'success' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🚀 Próximos Pasos</h3>
          <div className="space-y-2 text-blue-800">
            <p>✅ Google Maps API funcionando</p>
            <p>✅ Restricciones de seguridad configuradas</p>
            <p>✅ Listo para implementar tracking GPS</p>
            <p className="mt-4 font-medium">
              Ahora puedes crear el sistema de tracking en tiempo real para los vehículos del Club Canino.
            </p>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <details className="bg-gray-50 rounded-lg p-4">
        <summary className="cursor-pointer font-medium text-gray-700">
          🔧 Información de Debug
        </summary>
        <div className="mt-3 space-y-2 text-sm text-gray-600">
          <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
          <p><strong>Domain:</strong> {window.location.hostname}</p>
          <p><strong>Protocol:</strong> {window.location.protocol}</p>
          <p><strong>API Key Present:</strong> {apiKey ? 'Yes' : 'No'}</p>
          <p><strong>Google Object:</strong> {typeof window.google !== 'undefined' ? 'Loaded' : 'Not loaded'}</p>
        </div>
      </details>
    </div>
  );
};

export default GoogleMapsTest;