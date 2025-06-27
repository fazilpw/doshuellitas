// public/js/tracking.js - SOLUCIÓN RÁPIDA
// En lugar de inicializar Supabase manualmente, usar el que ya existe en tu proyecto

// Variables globales
var map;
var vehicleMarker;
var homeMarker;
var routePath;
var infoWindow;
var trackingInterval;

// USAR EL SUPABASE QUE YA ESTÁ CONFIGURADO EN TU PROYECTO
var supabase = null;

// UBICACIÓN REAL DEL USUARIO (PADRE)
var homeLocation = null;

// UBICACIÓN REAL DEL CONDUCTOR
var realVehicleLocation = null;

// Datos del usuario
var userData = JSON.parse(localStorage.getItem('clubCanino_user') || '{}');
var dogData = { name: 'Max', breed: 'Golden Retriever' };
var vehicleData = { plate: 'ABC-123', driver: 'Juan Carlos', phone: '+573001234567' };

// ============================================
// 🚀 INICIALIZACIÓN SIMPLIFICADA
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Inicializando tracking REAL para padres (versión simplificada)...');
  
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

  // Inicializar sistema real simplificado
  initializeSimplifiedTracking();
});

async function initializeSimplifiedTracking() {
  try {
    // 1. Usar Supabase que ya existe en el proyecto
    await getProjectSupabase();
    
    // 2. Obtener ubicación real del padre
    await getRealHomeLocation();
    
    // 3. Inicializar listeners
    initializeEventListeners();
    
    // 4. Iniciar tracking REAL
    startRealTracking();
    
    // 5. Cargar mapa
    loadGoogleMaps();
    
    console.log('✅ Sistema de tracking REAL inicializado (simplificado)');
    
  } catch (error) {
    console.error('❌ Error inicializando tracking real:', error);
    showTempNotification('Error conectando con GPS real', 'error');
  }
}

// ============================================
// 📍 USAR SUPABASE DEL PROYECTO
// ============================================
async function getProjectSupabase() {
  // MÉTODO 1: Usar el supabase que ya está en window (del proyecto)
  if (window.supabase) {
    supabase = window.supabase;
    console.log('✅ Usando Supabase del proyecto (window.supabase)');
    return;
  }
  
  // MÉTODO 2: Importar desde el proyecto
  try {
    const module = await import('/src/lib/supabase.js');
    supabase = module.default;
    console.log('✅ Supabase importado desde /src/lib/supabase.js');
    return;
  } catch (err) {
    console.warn('⚠️ No se pudo importar supabase del proyecto:', err);
  }
  
  // MÉTODO 3: Obtener configuración desde la API del proyecto
  try {
    const response = await fetch('/api/supabase-config');
    if (response.ok) {
      const config = await response.json();
      
      // Cargar Supabase library si no está disponible
      if (typeof window.supabase === 'undefined') {
        await loadSupabaseLibrary();
      }
      
      supabase = window.supabase.createClient(config.url, config.anonKey);
      console.log('✅ Supabase configurado desde API del proyecto');
      return;
    }
  } catch (err) {
    console.warn('⚠️ No se pudo obtener config desde API:', err);
  }
  
  // Si ningún método funciona, mostrar error claro
  throw new Error('No se pudo obtener configuración válida de Supabase del proyecto');
}

async function loadSupabaseLibrary() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.0/dist/umd/supabase.min.js';
    script.onload = () => {
      console.log('✅ Supabase library cargada');
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ============================================
// 📍 OBTENER UBICACIÓN REAL DEL PADRE
// ============================================
async function getRealHomeLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('⚠️ GPS no disponible, usando ubicación por defecto');
      homeLocation = { lat: 4.7200, lng: -74.0600 }; // Bogotá por defecto
      resolve();
      return;
    }

    console.log('📍 Obteniendo ubicación real del padre...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        homeLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        console.log('✅ Ubicación real del padre obtenida:', {
          lat: homeLocation.lat.toFixed(6),
          lng: homeLocation.lng.toFixed(6)
        });
        
        // Verificar que el elemento existe antes de actualizar
        const homeElement = document.getElementById('home-coords');
        if (homeElement) {
          homeElement.textContent = `Lat: ${homeLocation.lat.toFixed(4)}, Lng: ${homeLocation.lng.toFixed(4)}`;
        }
        
        resolve();
      },
      (error) => {
        console.warn('⚠️ Error GPS padre, usando ubicación por defecto:', error);
        homeLocation = { lat: 4.7200, lng: -74.0600 };
        resolve();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  });
}

// ============================================
// 💾 OBTENER UBICACIÓN REAL DEL CONDUCTOR
// ============================================
async function getRealVehicleLocation() {
  if (!supabase) {
    console.warn('⚠️ Supabase no inicializado, usando ubicación simulada');
    return getSimulatedLocation();
  }

  try {
    console.log('📡 Obteniendo ubicación REAL del conductor desde BD...');
    
    // Obtener la ubicación más reciente del vehículo
    const { data, error } = await supabase
      .from('vehicle_locations')
      .select('*')
      .eq('vehicle_id', 'vehicle-001') // ID del vehículo
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('⚠️ Error BD:', error.message);
      console.log('🔄 Usando ubicación simulada como fallback');
      return getSimulatedLocation();
    }

    if (data && data.length > 0) {
      const location = data[0];
      
      console.log('✅ Ubicación REAL del conductor obtenida desde BD:', {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        speed: location.speed,
        timestamp: location.timestamp,
        source: location.source || 'BD'
      });
      
      return {
        lat: location.latitude,
        lng: location.longitude,
        speed: location.speed || 0,
        heading: location.heading || 0,
        timestamp: location.timestamp,
        source: location.source,
        isReal: location.source === 'REAL_GPS_DEVICE'
      };
    } else {
      console.warn('⚠️ No hay datos del conductor en BD, usando simulación');
      return getSimulatedLocation();
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo ubicación real:', error);
    return getSimulatedLocation();
  }
}

function getSimulatedLocation() {
  // Solo como fallback si no hay datos reales
  console.log('🔄 Usando ubicación simulada como fallback');
  
  return {
    lat: 4.7147 + (Math.random() - 0.5) * 0.01,
    lng: -74.0517 + (Math.random() - 0.5) * 0.01,
    speed: 20 + Math.random() * 30,
    isReal: false,
    source: 'FALLBACK_SIMULATION'
  };
}

// ============================================
// 🔄 TRACKING EN TIEMPO REAL
// ============================================
function startRealTracking() {
  console.log('🎯 Iniciando tracking REAL cada 15 segundos...');
  
  // Actualización inmediata
  updateRealVehicleLocation();
  
  // Actualizar cada 15 segundos
  trackingInterval = setInterval(updateRealVehicleLocation, 15000);
}

async function updateRealVehicleLocation() {
  try {
    // Obtener ubicación real del conductor
    realVehicleLocation = await getRealVehicleLocation();
    
    // Actualizar UI
    updateDisplayValues();
    
    // Actualizar mapa si existe
    updateMapWithRealLocation();
    
    // Calcular ETA real
    calculateRealETA();
    
    const statusText = realVehicleLocation.isReal ? 'REAL desde BD' : 'SIMULADA (fallback)';
    console.log(`📍 Ubicación actualizada: ${statusText}`);
    
  } catch (error) {
    console.error('❌ Error actualizando ubicación:', error);
  }
}

function updateMapWithRealLocation() {
  if (!map || !vehicleMarker || !realVehicleLocation) return;
  
  // Actualizar posición del marcador
  vehicleMarker.setPosition(realVehicleLocation);
  
  // Actualizar ruta
  if (routePath && homeLocation) {
    routePath.setPath([realVehicleLocation, homeLocation]);
  }
  
  // Actualizar info window
  if (infoWindow) {
    infoWindow.setContent(createRealInfoContent());
  }
}

function calculateRealETA() {
  if (!realVehicleLocation || !homeLocation) {
    console.log('⚠️ No se puede calcular ETA: faltan ubicaciones');
    return;
  }
  
  try {
    // Calcular distancia real
    const distance = calculateDistance(realVehicleLocation, homeLocation);
    const speed = realVehicleLocation.speed || 30; // km/h
    const etaMinutes = Math.round((distance / speed) * 60);
    
    // Actualizar UI de forma segura
    const distanceElement = document.getElementById('distance');
    if (distanceElement) {
      distanceElement.textContent = `${distance.toFixed(1)} km`;
    }
    
    const etaElement = document.getElementById('eta');
    if (etaElement) {
      etaElement.textContent = `${etaMinutes} minutos`;
    }
    
    // Mostrar estado
    const statusText = realVehicleLocation.isReal ? 
      `📍 GPS Real - ${etaMinutes} min` : 
      `🔄 Simulado - ${etaMinutes} min`;
      
    const statusElement = document.getElementById('transport-status');
    if (statusElement) {
      statusElement.textContent = statusText;
    }
    
    console.log(`📊 ETA calculado: ${etaMinutes} min (${distance.toFixed(1)} km)`);
    
  } catch (error) {
    console.error('❌ Error calculando ETA:', error);
  }
}

// ============================================
// 🗺️ GOOGLE MAPS (SIMPLIFICADO)
// ============================================
function loadGoogleMaps() {
  const apiKey = 'AIzaSyC8h8jPTSS9XQ0xskNgp2BDRxcflz4H5R4';
  
  if (!apiKey) {
    showMapError('API Key de Google Maps no configurada');
    return;
  }

  updateDisplayValue('map-status', '🔄 Cargando Google Maps...');

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initRealParentMap&libraries=geometry`;
  script.async = true;
  script.onerror = () => showMapError('Error cargando Google Maps');
  document.head.appendChild(script);
}

window.initRealParentMap = function() {
  const mapContainer = document.getElementById('tracking-map');
  if (!mapContainer || !window.google) return;

  try {
    const center = realVehicleLocation || { lat: 4.7147, lng: -74.0517 };
    
    map = new google.maps.Map(mapContainer, {
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

    createRealVehicleMarker();
    createRealHomeMarker();
    createRealRoutePath();
    createRealInfoWindow();

    if (realVehicleLocation && homeLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(realVehicleLocation);
      bounds.extend(homeLocation);
      map.fitBounds(bounds);
    }

    updateDisplayValue('map-status', '✅ Mapa con GPS real cargado');
    console.log('🗺️ Mapa de tracking REAL cargado');

  } catch (error) {
    console.error('❌ Error inicializando mapa:', error);
    showMapError('Error en el mapa: ' + error.message);
  }
};

function createRealVehicleMarker() {
  const position = realVehicleLocation || { lat: 4.7147, lng: -74.0517 };
  
  vehicleMarker = new google.maps.Marker({
    position: position,
    map: map,
    title: 'Transporte GPS Real',
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

function createRealHomeMarker() {
  if (!homeLocation) return;
  
  homeMarker = new google.maps.Marker({
    position: homeLocation,
    map: map,
    title: 'Tu Ubicación Real',
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

function createRealRoutePath() {
  if (!realVehicleLocation || !homeLocation) return;
  
  routePath = new google.maps.Polyline({
    path: [realVehicleLocation, homeLocation],
    geodesic: true,
    strokeColor: '#56CCF2',
    strokeOpacity: 1.0,
    strokeWeight: 3
  });
  
  routePath.setMap(map);
}

function createRealInfoContent() {
  if (!realVehicleLocation || !homeLocation) return 'Cargando...';
  
  const distance = calculateDistance(realVehicleLocation, homeLocation);
  const statusIcon = realVehicleLocation.isReal ? '📍' : '🔄';
  const statusText = realVehicleLocation.isReal ? 'GPS Real' : 'Simulado';
  
  return `
    <div style="padding: 15px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h3 style="margin: 0 0 8px 0; color: #2C3E50;">🚐 ${vehicleData.plate}</h3>
      <p style="margin: 0 0 8px 0; color: #666;">Conductor: ${vehicleData.driver}</p>
      <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; margin: 8px 0;">
        <div style="font-size: 12px; color: #28a745; font-weight: 500;">${statusIcon} ${statusText}</div>
        <div style="font-size: 14px; font-weight: 600; color: #2C3E50;">${distance.toFixed(1)} km de distancia</div>
        <div style="font-size: 12px; color: #6c757d;">Velocidad: ${Math.round(realVehicleLocation.speed || 0)} km/h</div>
      </div>
      <p style="margin: 5px 0 0 0; font-size: 12px; color: #28a745; font-weight: 500;">
        ✅ En camino a tu casa
      </p>
    </div>
  `;
}

function createRealInfoWindow() {
  infoWindow = new google.maps.InfoWindow({
    content: createRealInfoContent()
  });
  
  if (vehicleMarker) {
    vehicleMarker.addListener('click', () => {
      infoWindow.open(map, vehicleMarker);
    });
  }
}

// ============================================
// 🛠️ UTILIDADES AUXILIARES
// ============================================
function calculateDistance(point1, point2) {
  if (!point1 || !point2) return 0;
  
  const R = 6371; // Radio de la Tierra en km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function updateDisplayValue(elementId, value) {
  try {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    } else {
      console.warn(`⚠️ Elemento con ID '${elementId}' no encontrado en la página`);
    }
  } catch (error) {
    console.error(`❌ Error actualizando elemento ${elementId}:`, error);
  }
}

function updateDisplayValues() {
  if (!realVehicleLocation) {
    console.log('⚠️ No hay ubicación del vehículo para mostrar');
    return;
  }
  
  // Actualizar coordenadas del vehículo de forma segura
  const vehicleElement = document.getElementById('vehicle-coords');
  if (vehicleElement) {
    vehicleElement.textContent = `Lat: ${realVehicleLocation.lat.toFixed(4)}, Lng: ${realVehicleLocation.lng.toFixed(4)}`;
  }
    
  // Actualizar estado GPS de forma segura
  const statusElement = document.getElementById('gps-status');
  if (statusElement) {
    const statusIcon = realVehicleLocation.isReal ? '📍' : '🔄';
    statusElement.textContent = `${statusIcon} ${realVehicleLocation.isReal ? 'GPS Real' : 'Simulado'}`;
  }
  
  // Actualizar otros elementos si existen
  const speedElement = document.getElementById('speed-display');
  if (speedElement) {
    speedElement.textContent = `${Math.round(realVehicleLocation.speed || 0)} km/h`;
  }
  
  const accuracyElement = document.getElementById('accuracy-display');
  if (accuracyElement) {
    accuracyElement.textContent = `${Math.round(realVehicleLocation.accuracy || 0)}m`;
  }
}

function showMapError(message) {
  const mapContainer = document.getElementById('tracking-map');
  if (mapContainer) {
    mapContainer.innerHTML = 
      '<div class="text-center text-gray-600 p-8">' +
        '<div class="text-4xl mb-2">🗺️</div>' +
        '<p>Mapa no disponible</p>' +
        '<p class="text-sm">' + message + '</p>' +
      '</div>';
  }
  updateDisplayValue('map-status', '❌ ' + message);
}

function showTempNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.style.cssText = 'position:fixed;top:20px;right:20px;z-index:1000;padding:12px 20px;border-radius:8px;color:white;font-weight:500;';
  notification.className = (type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500') + ' text-white';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, duration);
}

// ============================================
// 📱 EVENT LISTENERS SIMPLIFICADOS
// ============================================
function initializeEventListeners() {
  const refreshBtn = document.getElementById('refresh-location');
  const centerVehicleBtn = document.getElementById('center-vehicle');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '🔄 Actualizando...';
      
      await updateRealVehicleLocation();
      
      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄 Actualizar GPS';
      
      showTempNotification('Ubicación GPS actualizada', 'success');
    });
  }
  
  if (centerVehicleBtn) {
    centerVehicleBtn.addEventListener('click', () => {
      if (map && vehicleMarker && realVehicleLocation) {
        map.panTo(realVehicleLocation);
        map.setZoom(15);
        if (infoWindow) {
          infoWindow.open(map, vehicleMarker);
        }
      }
    });
  }
}