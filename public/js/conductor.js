// public/js/conductor.js - LIMPIO SOLO GPS REAL
// Sistema GPS Real del Conductor - Sin simulaciones

// Variables globales
let isTracking = false;
let watchId = null;
let selectedDogs = [];
let realLocation = null;
let supabase = null;

// Datos de perros (sin coordenadas fake)
const availableDogs = [
  { id: '1', name: 'Max', breed: 'Golden Retriever', owner: 'María García', address: 'Calle 123 #45-67' },
  { id: '2', name: 'Luna', breed: 'Labrador', owner: 'Carlos Ruiz', address: 'Carrera 78 #12-34' },
  { id: '3', name: 'Rocky', breed: 'Pastor Alemán', owner: 'Ana López', address: 'Avenida 68 #89-12' }
];

// ============================================
// 🚀 INICIALIZACIÓN REAL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Inicializando conductor con GPS REAL...');
  
  // Verificar autenticación
  const userData = localStorage.getItem('clubCanino_user');
  
  if (!userData) {
    console.log('❌ No hay usuario logueado');
    window.location.href = '/login/';
    return;
  }

  try {
    const user = JSON.parse(userData);
    
    if (user.role !== 'conductor' && user.role !== 'admin') {
      alert('Acceso denegado. Esta página es solo para conductores.');
      window.location.href = '/dashboard/';
      return;
    }

    // Inicializar sistema REAL
    initializeRealConductorSystem();
    
  } catch (error) {
    console.error('❌ Error parseando userData:', error);
  }
});

async function initializeRealConductorSystem() {
  try {
    // 1. Inicializar Supabase
    await initializeSupabase();
    
    // 2. Configurar eventos
    initializeEventListeners();
    
    // 3. Verificar GPS
    await checkRealGPSAvailability();
    
    // 4. Cargar perros
    loadDogsData();
    
    logEvent('✅ Sistema GPS REAL del conductor iniciado', 'success');
    updateConnectionStatus('ready');
    
  } catch (error) {
    console.error('❌ Error inicializando sistema real:', error);
    logEvent('❌ Error inicializando GPS real', 'error');
  }
}

// ============================================
// 💾 CONFIGURAR SUPABASE REAL
// ============================================
async function initializeSupabase() {
  // USAR EL SUPABASE QUE YA ESTÁ CONFIGURADO EN TU PROYECTO
  
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
      console.log('✅ Supabase configurado desde API del proyecto para conductor');
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
// 📍 VERIFICAR GPS REAL
// ============================================
async function checkRealGPSAvailability() {
  if (!navigator.geolocation) {
    logEvent('❌ GPS no disponible en este dispositivo', 'error');
    return false;
  }

  try {
    // Verificar permisos
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    console.log('📍 Permisos GPS:', permission.state);
    
    if (permission.state === 'denied') {
      logEvent('🚫 Permisos GPS denegados. Habilita la ubicación.', 'error');
      return false;
    }
    
    // Probar obtener ubicación
    await getCurrentRealLocation();
    return true;
    
  } catch (error) {
    console.warn('⚠️ Error verificando GPS:', error);
    return false;
  }
}

function getCurrentRealLocation() {
  return new Promise((resolve, reject) => {
    console.log('📍 Obteniendo ubicación GPS real...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const realCoords = {
          latitude: parseFloat(position.coords.latitude.toFixed(8)),
          longitude: parseFloat(position.coords.longitude.toFixed(8)),
          accuracy: Math.round(position.coords.accuracy),
          speed: position.coords.speed ? parseFloat((position.coords.speed * 3.6).toFixed(1)) : 0,
          timestamp: new Date().toISOString()
        };
        
        realLocation = realCoords;
        updateLocationDisplay(realCoords);
        
        console.log('✅ Ubicación GPS real obtenida:', {
          lat: realCoords.latitude.toFixed(6),
          lng: realCoords.longitude.toFixed(6),
          accuracy: realCoords.accuracy + 'm'
        });
        
        logEvent('📍 Ubicación GPS real obtenida', 'success');
        resolve(realCoords);
      },
      (error) => {
        console.error('❌ Error GPS real:', error);
        
        const errorMessages = {
          1: '🚫 Permisos GPS denegados',
          2: '📡 Señal GPS no disponible',
          3: '⏱️ Timeout GPS'
        };
        
        const message = errorMessages[error.code] || 'Error GPS desconocido';
        logEvent(message, 'error');
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}

// ============================================
// 🎯 TRACKING GPS REAL
// ============================================
function startRealTracking() {
  if (!navigator.geolocation) {
    logEvent('❌ GPS no disponible', 'error');
    return;
  }

  if (selectedDogs.length === 0) {
    logEvent('⚠️ Selecciona al menos un perro', 'warning');
    return;
  }

  console.log('🎯 INICIANDO TRACKING GPS REAL...');
  isTracking = true;
  updateTrackingUI();

  // Opciones de máxima precisión
  const trackingOptions = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 5000
  };

  // Iniciar tracking continuo REAL
  watchId = navigator.geolocation.watchPosition(
    handleRealLocationUpdate,
    handleRealLocationError,
    trackingOptions
  );

  logEvent(`🚀 Tracking GPS real iniciado para ${selectedDogs.length} perros`, 'success');
  updateConnectionStatus('tracking');
  
  // Mostrar acciones de ruta
  const routeActions = document.getElementById('route-actions');
  if (routeActions) {
    routeActions.classList.remove('hidden');
  }
}

function stopRealTracking() {
  console.log('⏹️ Deteniendo tracking GPS real...');
  
  isTracking = false;
  updateTrackingUI();
  updateConnectionStatus('online');

  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  logEvent('⏹️ Tracking GPS real detenido', 'warning');
}

function handleRealLocationUpdate(position) {
  const coords = position.coords;
  
  console.log('📍 NUEVA UBICACIÓN GPS REAL:', {
    lat: coords.latitude.toFixed(6),
    lng: coords.longitude.toFixed(6),
    speed: coords.speed ? Math.round(coords.speed * 3.6) : 0,
    accuracy: Math.round(coords.accuracy)
  });
  
  const newRealLocation = {
    latitude: parseFloat(coords.latitude.toFixed(8)),
    longitude: parseFloat(coords.longitude.toFixed(8)),
    accuracy: Math.round(coords.accuracy || 0),
    speed: coords.speed ? parseFloat((coords.speed * 3.6).toFixed(1)) : 0,
    heading: coords.heading || 0,
    timestamp: new Date().toISOString(),
    vehicle_id: getSelectedVehicle(),
    is_moving: coords.speed > 0.5,
    source: 'REAL_GPS_DEVICE'
  };

  realLocation = newRealLocation;
  updateLocationDisplay(newRealLocation);
  saveRealLocationToDatabase(newRealLocation);
  
  logEvent('📍 Ubicación GPS real actualizada', 'info');
}

function handleRealLocationError(error) {
  console.error('❌ Error GPS real:', error);
  
  const errorMessages = {
    1: '🚫 Permisos GPS denegados. Habilita ubicación en el navegador.',
    2: '📡 Sin señal GPS. Ve a un área abierta.',
    3: '⏱️ GPS tardando mucho. Verifica configuración.'
  };
  
  const message = errorMessages[error.code] || `Error GPS: ${error.message}`;
  logEvent(message, 'error');
  
  // Reintentar si es timeout
  if (isTracking && error.code === 3) {
    console.log('🔄 Reintentando GPS en 10 segundos...');
    setTimeout(() => {
      if (isTracking) {
        getCurrentRealLocation();
      }
    }, 10000);
  }
}

// ============================================
// 💾 GUARDAR UBICACIÓN REAL
// ============================================
async function saveRealLocationToDatabase(locationData) {
  if (!supabase || !locationData.vehicle_id) return;

  try {
    // Datos limpios para la BD
    const cleanData = {
      vehicle_id: locationData.vehicle_id,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      speed: locationData.speed,
      heading: locationData.heading,
      accuracy: locationData.accuracy,
      timestamp: locationData.timestamp,
      is_moving: locationData.is_moving,
      source: locationData.source
    };

    const { error } = await supabase
      .from('vehicle_locations')
      .insert(cleanData);

    if (error) {
      console.warn('⚠️ No se pudo guardar en BD:', error.message);
    } else {
      console.log('💾 Ubicación GPS real guardada en BD');
    }
  } catch (err) {
    console.warn('⚠️ Error BD:', err.message);
  }
}

// ============================================
// 🐕 GESTIÓN DE PERROS
// ============================================
function loadDogsData() {
  const dogsContainer = document.getElementById('dogs-container');
  if (!dogsContainer) return;

  dogsContainer.innerHTML = '';
  
  availableDogs.forEach(dog => {
    const dogElement = createDogElement(dog);
    dogsContainer.appendChild(dogElement);
  });
  
  // Mostrar sección de perros
  const dogsSection = document.getElementById('dogs-section');
  if (dogsSection) {
    dogsSection.classList.remove('hidden');
  }
}

function createDogElement(dog) {
  const dogDiv = document.createElement('div');
  dogDiv.className = 'border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors';
  dogDiv.dataset.dogId = dog.id;
  
  dogDiv.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <h4 class="font-semibold text-gray-900">${dog.name}</h4>
        <p class="text-sm text-gray-600">${dog.breed}</p>
        <p class="text-xs text-gray-500">${dog.owner}</p>
      </div>
      <div class="text-right">
        <input type="checkbox" class="w-5 h-5 text-blue-600" onchange="toggleDogSelection('${dog.id}', this.checked)">
      </div>
    </div>
  `;
  
  return dogDiv;
}

function toggleDogSelection(dogId, isSelected) {
  const dog = availableDogs.find(d => d.id === dogId);
  if (!dog) return;

  if (isSelected) {
    selectedDogs.push({...dog, status: 'pending'});
  } else {
    selectedDogs = selectedDogs.filter(d => d.id !== dogId);
  }
  
  updateSelectedDogsDisplay();
  updateTrackingButtonState();
  
  console.log('🐕 Perros seleccionados:', selectedDogs.length);
}

function updateSelectedDogsDisplay() {
  const selectedContainer = document.getElementById('selected-dogs');
  const dogsCount = document.getElementById('selected-count');
  
  if (selectedDogs.length > 0) {
    if (selectedContainer) selectedContainer.classList.remove('hidden');
    if (dogsCount) dogsCount.textContent = selectedDogs.length;
  } else {
    if (selectedContainer) selectedContainer.classList.add('hidden');
  }
}

// ============================================
// 🎮 UI Y CONTROLES
// ============================================
function initializeEventListeners() {
  const vehicleSelect = document.getElementById('vehicle-select');
  const routeType = document.getElementById('route-type');
  const loadDogsBtn = document.getElementById('load-dogs');
  const toggleTrackingBtn = document.getElementById('toggle-tracking');

  if (vehicleSelect) {
    vehicleSelect.addEventListener('change', validateForm);
  }
  
  if (routeType) {
    routeType.addEventListener('change', validateForm);
  }
  
  if (loadDogsBtn) {
    loadDogsBtn.addEventListener('click', loadDogsData);
  }
  
  if (toggleTrackingBtn) {
    toggleTrackingBtn.addEventListener('click', () => {
      if (isTracking) {
        stopRealTracking();
      } else {
        startRealTracking();
      }
    });
  }
}

function validateForm() {
  const vehicleSelect = document.getElementById('vehicle-select');
  const routeType = document.getElementById('route-type');
  const loadDogsBtn = document.getElementById('load-dogs');

  const vehicleSelected = vehicleSelect ? vehicleSelect.value : '';
  const routeSelected = routeType ? routeType.value : '';

  if (loadDogsBtn) {
    loadDogsBtn.disabled = !vehicleSelected || !routeSelected;
  }
}

function updateTrackingButtonState() {
  const toggleBtn = document.getElementById('toggle-tracking');
  const trackingHelp = document.getElementById('tracking-help');
  
  if (toggleBtn) {
    toggleBtn.disabled = selectedDogs.length === 0;
  }
  
  if (trackingHelp) {
    trackingHelp.textContent = selectedDogs.length === 0 
      ? 'Selecciona perros antes de iniciar el tracking'
      : `Listo para iniciar tracking con ${selectedDogs.length} perros`;
  }
}

function updateTrackingUI() {
  const toggleButton = document.getElementById('toggle-tracking');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  if (toggleButton) {
    toggleButton.textContent = isTracking ? '⏹️ Detener GPS Real' : '▶️ Iniciar GPS Real';
    toggleButton.className = isTracking 
      ? 'w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors'
      : 'w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400';
  }

  if (statusIndicator) {
    statusIndicator.className = isTracking 
      ? 'w-4 h-4 bg-green-400 rounded-full animate-pulse' 
      : 'w-4 h-4 bg-gray-400 rounded-full';
  }

  if (statusText) {
    statusText.textContent = isTracking ? 'GPS Real Activo' : 'GPS Real Inactivo';
  }
}

function updateLocationDisplay(location) {
  if (!location) return;

  const elements = {
    'lat-display': location.latitude.toFixed(6),
    'lng-display': location.longitude.toFixed(6),
    'speed-display': `${location.speed} km/h`,
    'accuracy-display': `${location.accuracy} m`,
    'update-time': new Date().toLocaleTimeString()
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  // Mostrar panel de ubicación
  const locationInfo = document.getElementById('location-info');
  if (locationInfo) {
    locationInfo.classList.remove('hidden');
  }
}

function updateConnectionStatus(status) {
  const statusConfig = {
    ready: { color: 'bg-blue-400', text: 'GPS Listo' },
    tracking: { color: 'bg-green-400', text: 'GPS Real Activo' },
    online: { color: 'bg-blue-400', text: 'En línea' },
    offline: { color: 'bg-gray-400', text: 'Desconectado' }
  };

  const config = statusConfig[status] || statusConfig.offline;
  
  const connectionStatus = document.getElementById('connection-status');
  if (connectionStatus) {
    const indicator = connectionStatus.querySelector('div');
    const text = connectionStatus.querySelector('span');
    
    if (indicator) indicator.className = `w-2 h-2 ${config.color} rounded-full mr-2`;
    if (text) text.textContent = config.text;
  }
}

// ============================================
// 📝 SISTEMA DE EVENTOS
// ============================================
function logEvent(message, type = 'info') {
  const eventHistory = document.getElementById('event-history');
  if (!eventHistory) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    return;
  }

  // Limpiar placeholder si existe
  const placeholder = eventHistory.querySelector('.text-gray-500');
  if (placeholder) {
    eventHistory.innerHTML = '';
  }

  const eventDiv = document.createElement('div');
  eventDiv.className = `flex items-center justify-between p-3 rounded-lg ${getEventTypeClass(type)}`;
  
  eventDiv.innerHTML = `
    <div class="flex items-center">
      <span class="mr-3">${getEventIcon(type)}</span>
      <span class="text-sm">${message}</span>
    </div>
    <span class="text-xs opacity-75">${new Date().toLocaleTimeString()}</span>
  `;

  eventHistory.insertBefore(eventDiv, eventHistory.firstChild);
  
  // Mantener solo los últimos 10 eventos
  while (eventHistory.children.length > 10) {
    eventHistory.removeChild(eventHistory.lastChild);
  }
  
  console.log(`[${type.toUpperCase()}] ${message}`);
}

function getEventTypeClass(type) {
  const classes = {
    success: 'bg-green-50 border border-green-200',
    error: 'bg-red-50 border border-red-200',
    warning: 'bg-yellow-50 border border-yellow-200',
    info: 'bg-blue-50 border border-blue-200'
  };
  return classes[type] || classes.info;
}

function getEventIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type] || icons.info;
}

// ============================================
// 🛣️ ACCIONES DE RUTA
// ============================================
function handleRouteAction(action) {
  const actions = {
    start: () => {
      logEvent('🚀 Ruta GPS real iniciada', 'success');
      updateConnectionStatus('tracking');
    },
    pause: () => {
      logEvent('⏸️ Ruta pausada temporalmente', 'warning');
    },
    pickup: () => {
      if (selectedDogs.length > 0) {
        const dog = selectedDogs.find(d => d.status === 'pending');
        if (dog) {
          dog.status = 'picked_up';
          dog.pickup_time = new Date().toISOString();
          logEvent(`🐕 Perro recogido: ${dog.name}`, 'success');
          updateSelectedDogsDisplay();
        }
      }
    },
    emergency: () => {
      if (confirm('¿Confirmas que hay una emergencia?')) {
        logEvent('🚨 ALERTA DE EMERGENCIA ACTIVADA', 'error');
        updateConnectionStatus('emergency');
      }
    }
  };

  if (actions[action]) {
    actions[action]();
  }
}

// ============================================
// 🛠️ UTILIDADES
// ============================================
function getSelectedVehicle() {
  const vehicleSelect = document.getElementById('vehicle-select');
  return vehicleSelect ? vehicleSelect.value : '';
}

// Exponer funciones globales para HTML onclick
window.handleRouteAction = handleRouteAction;
window.toggleDogSelection = toggleDogSelection;

console.log('🔧 Sistema conductor GPS REAL cargado - Sin simulaciones');