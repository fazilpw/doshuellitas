// public/js/tracking.js
// Sistema de Tracking para Padres - Club Canino

// Variables globales
var map;
var vehicleMarker;
var homeMarker;
var routePath;
var infoWindow;
var trackingInterval;
var currentETA = 25;
var currentDistance = 4.2;

// Ubicaciones simuladas
var vehicleLocation = { lat: 4.7147, lng: -74.0517 };
var homeLocation = { lat: 4.7200, lng: -74.0600 };

// Datos del usuario y vehículo
var userData = JSON.parse(localStorage.getItem('clubCanino_user') || '{}');
var dogData = { name: 'Max', breed: 'Golden Retriever' };
var vehicleData = { plate: 'ABC-123', driver: 'Juan Carlos', phone: '+573001234567' };

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticación
  if (!userData.authenticated) {
    window.location.href = '/login/';
    return;
  }

  if (userData.role !== 'padre') {
    alert('Acceso denegado. Esta página es solo para padres.');
    window.location.href = '/dashboard/';
    return;
  }

  // Inicializar
  initializeEventListeners();
  startTracking();
  loadGoogleMaps();
});

function initializeEventListeners() {
  var refreshBtn = document.getElementById('refresh-location');
  var callBtn = document.getElementById('call-driver');
  var shareBtn = document.getElementById('share-location');
  var emergencyBtn = document.getElementById('emergency-contact');
  var feedbackBtn = document.getElementById('feedback');
  var centerVehicleBtn = document.getElementById('center-vehicle');
  var showRouteBtn = document.getElementById('show-route');

  if (refreshBtn) refreshBtn.addEventListener('click', refreshLocation);
  if (callBtn) callBtn.addEventListener('click', callDriver);
  if (shareBtn) shareBtn.addEventListener('click', shareLocation);
  if (emergencyBtn) emergencyBtn.addEventListener('click', emergencyContact);
  if (feedbackBtn) feedbackBtn.addEventListener('click', sendFeedback);
  if (centerVehicleBtn) centerVehicleBtn.addEventListener('click', centerOnVehicle);
  if (showRouteBtn) showRouteBtn.addEventListener('click', showRoute);
}

// Funciones de tracking
function startTracking() {
  trackingInterval = setInterval(function() {
    updateVehicleLocation();
    updateETA();
  }, 30000);

  console.log('🚀 Tracking iniciado para padres');
}

function refreshLocation() {
  var refreshBtn = document.getElementById('refresh-location');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = '🔄 Actualizando...';
  }

  setTimeout(function() {
    updateVehicleLocation();
    updateETA();
    
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄 Actualizar';
    }
    
    showTempNotification('Ubicación actualizada', 'success');
  }, 2000);
}

function updateVehicleLocation() {
  // Simular movimiento del vehículo hacia la casa
  currentDistance = Math.max(0.1, currentDistance - 0.3);
  currentETA = Math.max(1, currentETA - 2);

  // Calcular nueva posición del vehículo
  var progress = Math.max(0, (4.2 - currentDistance) / 4.2);
  var startLat = 4.7147;
  var startLng = -74.0517;
  var endLat = homeLocation.lat;
  var endLng = homeLocation.lng;
  
  vehicleLocation = {
    lat: startLat + (endLat - startLat) * progress,
    lng: startLng + (endLng - startLng) * progress
  };

  // Actualizar UI
  updateDisplayValues();
  
  // Actualizar mapa si existe
  if (vehicleMarker && map) {
    vehicleMarker.setPosition(vehicleLocation);
    if (routePath) {
      routePath.setPath([vehicleLocation, homeLocation]);
    }
    if (infoWindow) {
      infoWindow.setContent(createInfoContent());
    }
  }

  // Actualizar estado según distancia
  if (currentDistance < 0.5) {
    updateTransportStatus('arriving', 'Llegando en 2-3 minutos');
    showTempNotification('🚐 Tu perro llegará muy pronto!', 'success', 5000);
  } else if (currentDistance < 0.1) {
    updateTransportStatus('arrived', 'Tu perro está en casa');
    showTempNotification('🏠 Tu perro está en casa!', 'success', 5000);
  }
}

function updateDisplayValues() {
  var etaTime = document.getElementById('eta-time');
  var distance = document.getElementById('distance');
  var timelineEta = document.getElementById('timeline-eta');

  if (etaTime) etaTime.textContent = currentETA + ' min';
  if (distance) distance.textContent = currentDistance.toFixed(1) + ' km';
  if (timelineEta) {
    var arrivalTime = new Date(Date.now() + currentETA * 60000);
    timelineEta.textContent = 'Llegada estimada: ' + arrivalTime.toLocaleTimeString();
  }
}

function updateETA() {
  var speed = 30; // km/h promedio en ciudad
  var calculatedETA = Math.round((currentDistance / speed) * 60);
  currentETA = Math.max(1, calculatedETA);
}

function updateTransportStatus(status, message) {
  var statusConfig = {
    active: { color: 'bg-green-400', text: message },
    arriving: { color: 'bg-yellow-400', text: message },
    arrived: { color: 'bg-blue-400', text: message },
    offline: { color: 'bg-gray-400', text: 'Sin conexión' }
  };

  var config = statusConfig[status] || statusConfig.offline;
  
  var transportStatus = document.getElementById('transport-status');
  if (transportStatus) {
    var indicator = transportStatus.querySelector('div');
    var text = transportStatus.querySelector('span');
    
    if (indicator) indicator.className = 'w-2 h-2 ' + config.color + ' rounded-full mr-2';
    if (text) text.textContent = config.text;
  }
}

function showTempNotification(message, type, duration) {
  type = type || 'info';
  duration = duration || 3000;
  
  var notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ' + 
    (type === 'success' ? 'bg-green-500' : 'bg-blue-500') + ' text-white';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(function() {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, duration);
}

// Google Maps
function loadGoogleMaps() {
  // Para demo, usar una API key placeholder
var apiKey = 'AIzaSyC8h8jPTSS9XQ0xskNgp2BDRxcflz4H5R4';


  
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
    document.getElementById('tracking-map').innerHTML = 
      '<div class="text-center text-gray-600">' +
        '<div class="text-4xl mb-2">🗺️</div>' +
        '<p>Mapa no disponible</p>' +
        '<p class="text-sm">API Key de Google Maps no configurada</p>' +
        '<p class="text-xs mt-2">Agrega tu API key en el archivo tracking.js</p>' +
      '</div>';
    document.getElementById('map-status').textContent = '❌ API Key no configurada';
    return;
  }

  document.getElementById('map-status').textContent = '🔄 Cargando Google Maps...';

  var script = document.createElement('script');
  script.src = 'https://maps.googleapis.com/maps/api/js?key=' + apiKey + '&callback=initParentMap&libraries=geometry';
  script.async = true;
  document.head.appendChild(script);
}

// Función global para el callback de Google Maps
window.initParentMap = function() {
  var mapContainer = document.getElementById('tracking-map');
  if (!mapContainer || !window.google) return;

  try {
    map = new google.maps.Map(mapContainer, {
      zoom: 14,
      center: vehicleLocation,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Crear marcadores
    createVehicleMarker();
    createHomeMarker();
    createRoutePath();
    createInfoWindow();

    // Ajustar vista
    var bounds = new google.maps.LatLngBounds();
    bounds.extend(vehicleLocation);
    bounds.extend(homeLocation);
    map.fitBounds(bounds);

    document.getElementById('map-status').textContent = '✅ Mapa cargado';
    console.log('🗺️ Mapa de tracking para padres cargado');

  } catch (error) {
    console.error('Error inicializando mapa:', error);
    document.getElementById('map-status').textContent = '❌ Error en el mapa';
  }
};

function createVehicleMarker() {
  vehicleMarker = new google.maps.Marker({
    position: vehicleLocation,
    map: map,
    title: 'Transporte Club Canino',
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="25" cy="25" r="22" fill="#56CCF2" stroke="#ffffff" stroke-width="3"/>' +
          '<text x="25" y="32" text-anchor="middle" font-size="18" fill="white">🚐</text>' +
        '</svg>'
      ),
      scaledSize: new google.maps.Size(50, 50)
    }
  });
}

function createHomeMarker() {
  homeMarker = new google.maps.Marker({
    position: homeLocation,
    map: map,
    title: 'Tu Casa',
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        '<svg width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="22.5" cy="22.5" r="20" fill="#C7EA46" stroke="#ffffff" stroke-width="3"/>' +
          '<text x="22.5" y="29" text-anchor="middle" font-size="16" fill="white">🏠</text>' +
        '</svg>'
      ),
      scaledSize: new google.maps.Size(45, 45)
    }
  });
}

function createRoutePath() {
  routePath = new google.maps.Polyline({
    path: [vehicleLocation, homeLocation],
    geodesic: true,
    strokeColor: '#56CCF2',
    strokeOpacity: 0.8,
    strokeWeight: 4
  });
  routePath.setMap(map);
}

function createInfoWindow() {
  infoWindow = new google.maps.InfoWindow({
    content: createInfoContent()
  });

  vehicleMarker.addListener('click', function() {
    infoWindow.open(map, vehicleMarker);
  });

  // Abrir automáticamente
  setTimeout(function() {
    infoWindow.open(map, vehicleMarker);
  }, 1000);
}

function createInfoContent() {
  return '<div style="padding: 15px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">' +
    '<h3 style="margin: 0 0 8px 0; color: #2C3E50;">🚐 Transporte ' + vehicleData.plate + '</h3>' +
    '<p style="margin: 0 0 8px 0; color: #666;">Conductor: ' + vehicleData.driver + '</p>' +
    '<div style="background: #f8f9fa; padding: 8px; border-radius: 6px;">' +
      '<p style="margin: 0; color: #56CCF2; font-weight: 500;">' +
        '📍 Distancia: ' + currentDistance.toFixed(1) + ' km<br>' +
        '⏱️ ETA: ' + currentETA + ' minutos' +
      '</p>' +
    '</div>' +
  '</div>';
}

function centerOnVehicle() {
  if (map && vehicleMarker) {
    map.panTo(vehicleLocation);
    map.setZoom(15);
    if (infoWindow) {
      infoWindow.open(map, vehicleMarker);
    }
  }
}

function showRoute() {
  if (map) {
    var bounds = new google.maps.LatLngBounds();
    bounds.extend(vehicleLocation);
    bounds.extend(homeLocation);
    map.fitBounds(bounds);
  }
}

// Acciones
function callDriver() {
  if (confirm('¿Llamar al conductor ' + vehicleData.driver + '?')) {
    window.open('tel:' + vehicleData.phone);
  }
}

function shareLocation() {
  var message = '🐕 Mi perro ' + dogData.name + ' está en camino! ETA: ' + currentETA + ' minutos. ' +
    'Puedes seguir el transporte aquí: ' + window.location.href;
  
  if (navigator.share) {
    navigator.share({
      title: 'Ubicación del Transporte - Club Canino',
      text: message,
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(message).then(function() {
      showTempNotification('Enlace copiado al portapapeles', 'success');
    });
  }
}

function emergencyContact() {
  if (confirm('¿Contactar al Club Canino por emergencia?')) {
    window.open('tel:+573144329824');
  }
}

function sendFeedback() {
  var feedback = prompt('¿Cómo fue el servicio de transporte hoy?');
  if (feedback) {
    showTempNotification('Gracias por tu comentario!', 'success');
    console.log('Feedback enviado:', feedback);
  }
}

// Cleanup
window.addEventListener('beforeunload', function() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
  }
});