// public/js/conductor.js
// Sistema de GPS del Conductor - Club Canino - VERSIÓN CORREGIDA

// Variables globales
let isTracking = false;
let watchId = null;
let selectedDogs = [];
let currentLocation = null;

// Datos mock
const mockDogs = [
  { id: '1', name: 'Max', breed: 'Golden Retriever', owner: 'María García', address: 'Calle 123 #45-67' },
  { id: '2', name: 'Luna', breed: 'Labrador', owner: 'Carlos Ruiz', address: 'Carrera 78 #12-34' },
  { id: '3', name: 'Rocky', breed: 'Pastor Alemán', owner: 'Ana López', address: 'Avenida 68 #89-12' }
];

// Función de debug
function debugLog(message, data) {
  console.log(`🔍 [DEBUG] ${message}`, data || '');
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  debugLog('Inicializando sistema del conductor...');
  
  // Verificar autenticación
  const userData = localStorage.getItem('clubCanino_user');
  debugLog('userData found:', !!userData);
  
  if (!userData) {
    debugLog('No hay usuario logueado, redirigiendo...');
    window.location.href = '/login/';
    return;
  }

  try {
    const user = JSON.parse(userData);
    debugLog('Usuario:', user);
    
    if (user.role !== 'conductor' && user.role !== 'admin') {
      alert('Acceso denegado. Esta página es solo para conductores.');
      window.location.href = '/dashboard/';
      return;
    }

    // Inicializar eventos
    initializeEventListeners();
    logEvent('Sistema del conductor iniciado correctamente', 'info');
    updateConnectionStatus('online');
    debugLog('Inicialización completada');
    
  } catch (error) {
    debugLog('Error parseando userData:', error);
  }
});

function initializeEventListeners() {
  debugLog('Configurando event listeners...');
  
  const vehicleSelect = document.getElementById('vehicle-select');
  const routeType = document.getElementById('route-type');
  const loadDogsBtn = document.getElementById('load-dogs');
  const toggleTrackingBtn = document.getElementById('toggle-tracking');

  debugLog('Elementos encontrados:', {
    vehicleSelect: !!vehicleSelect,
    routeType: !!routeType,
    loadDogsBtn: !!loadDogsBtn,
    toggleTrackingBtn: !!toggleTrackingBtn
  });

  if (vehicleSelect) vehicleSelect.addEventListener('change', validateForm);
  if (routeType) routeType.addEventListener('change', validateForm);
  if (loadDogsBtn) loadDogsBtn.addEventListener('click', loadAvailableDogs);
  if (toggleTrackingBtn) toggleTrackingBtn.addEventListener('click', function() {
    debugLog('Toggle tracking clicked, current state:', isTracking);
    toggleTracking();
  });
  
  validateForm();
}

// Gestión de perros
function loadAvailableDogs() {
  debugLog('Cargando perros disponibles...');
  
  const vehicleSelect = document.getElementById('vehicle-select');
  const routeType = document.getElementById('route-type');

  if (!vehicleSelect || !routeType || !vehicleSelect.value || !routeType.value) {
    showError('Selecciona vehículo y tipo de ruta primero');
    return;
  }

  displayDogs(mockDogs);
  hideError();
  logEvent(`Cargados ${mockDogs.length} perros para ${routeType.value}`, 'success');
  
  const dogsSection = document.getElementById('dogs-section');
  if (dogsSection) {
    dogsSection.classList.remove('hidden');
    debugLog('Sección de perros mostrada');
  }
}

function displayDogs(dogs) {
  debugLog('Mostrando perros:', dogs);
  
  const container = document.getElementById('dogs-container');
  if (!container) {
    debugLog('ERROR: No se encontró dogs-container');
    return;
  }
  
  const html = dogs.map(function(dog) {
    const dogDataStr = JSON.stringify(dog).replace(/"/g, '&quot;');
    return `
      <div class="border border-gray-200 rounded-lg p-4 hover:border-[#56CCF2] transition-colors">
        <div class="flex items-center space-x-3">
          <input 
            type="checkbox" 
            value="${dog.id}" 
            onchange="window.toggleDogSelection('${dog.id}', this.checked, ${dogDataStr})"
            class="w-4 h-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded"
          />
          <div class="flex-1">
            <div class="font-semibold text-[#2C3E50]">${dog.name}</div>
            <div class="text-sm text-gray-600">${dog.breed}</div>
            <div class="text-xs text-gray-500">${dog.owner}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
  debugLog('HTML de perros insertado');
}

function toggleDogSelection(dogId, isSelected, dogData) {
  debugLog('Toggle dog selection:', { dogId, isSelected, dogData });
  
  if (isSelected) {
    const exists = selectedDogs.find(function(dog) { return dog.id === dogId; });
    if (!exists) {
      selectedDogs.push(dogData);
      debugLog('Perro agregado, total seleccionados:', selectedDogs.length);
    }
  } else {
    selectedDogs = selectedDogs.filter(function(dog) { return dog.id !== dogId; });
    debugLog('Perro removido, total seleccionados:', selectedDogs.length);
  }
  
  updateSelectedDogsList();
  validateForm();
}

function updateSelectedDogsList() {
  const selectedCount = document.getElementById('selected-count');
  const selectedDogsContainer = document.getElementById('selected-dogs');
  const selectedList = document.getElementById('selected-list');

  if (selectedCount) {
    selectedCount.textContent = selectedDogs.length.toString();
  }

  if (selectedDogs.length > 0) {
    if (selectedDogsContainer) selectedDogsContainer.classList.remove('hidden');
    if (selectedList) {
      const html = selectedDogs.map(function(dog) {
        return `
          <div class="flex items-center justify-between bg-white rounded-lg p-3">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-[#56CCF2] rounded-full flex items-center justify-center">
                <span class="text-white text-xs font-bold">${dog.name[0]}</span>
              </div>
              <div>
                <div class="font-medium text-sm">${dog.name}</div>
                <div class="text-xs text-gray-500">${dog.owner}</div>
              </div>
            </div>
            <button 
              onclick="window.removeDogFromSelection('${dog.id}')"
              class="text-red-600 hover:text-red-700 text-sm"
            >
              ✕
            </button>
          </div>
        `;
      }).join('');
      selectedList.innerHTML = html;
    }
  } else {
    if (selectedDogsContainer) selectedDogsContainer.classList.add('hidden');
  }
}

function removeDogFromSelection(dogId) {
  debugLog('Removiendo perro:', dogId);
  
  const checkbox = document.querySelector(`input[value="${dogId}"]`);
  if (checkbox) checkbox.checked = false;
  
  selectedDogs = selectedDogs.filter(function(dog) { return dog.id !== dogId; });
  updateSelectedDogsList();
  validateForm();
}

function clearAllSelections() {
  debugLog('Limpiando todas las selecciones');
  
  selectedDogs = [];
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(function(checkbox) { checkbox.checked = false; });
  updateSelectedDogsList();
  validateForm();
}

// Control de GPS
function toggleTracking() {
  debugLog('toggleTracking llamado, estado actual:', isTracking);
  
  if (isTracking) {
    stopTracking();
  } else {
    startTracking();
  }
}

function startTracking() {
  debugLog('Iniciando tracking...');
  
  // Verificar soporte de geolocalización
  if (!navigator.geolocation) {
    const error = 'Geolocalización no soportada en este dispositivo';
    debugLog('ERROR:', error);
    showError(error);
    return;
  }

  // Verificar que hay perros seleccionados
  if (selectedDogs.length === 0) {
    const error = 'Selecciona al menos un perro antes de iniciar el tracking';
    debugLog('ERROR:', error);
    showError(error);
    return;
  }

  debugLog('Perros seleccionados:', selectedDogs.length);
  debugLog('Iniciando geolocalización...');

  isTracking = true;
  updateTrackingUI();
  hideError();

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000
  };

  // Usar watchPosition para tracking continuo
  watchId = navigator.geolocation.watchPosition(
    function(position) {
      debugLog('Posición recibida:', position);
      handleLocationUpdate(position);
    },
    function(error) {
      debugLog('Error de geolocalización:', error);
      handleLocationError(error);
    },
    options
  );

  debugLog('watchPosition iniciado con ID:', watchId);

  const routeActions = document.getElementById('route-actions');
  if (routeActions) {
    routeActions.classList.remove('hidden');
    debugLog('Acciones de ruta mostradas');
  }
  
  logEvent(`Tracking GPS iniciado para ${selectedDogs.length} perros`, 'success');
}

function stopTracking() {
  debugLog('Deteniendo tracking...');
  
  isTracking = false;
  updateTrackingUI();

  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    debugLog('watchPosition detenido, ID era:', watchId);
    watchId = null;
  }

  logEvent('Tracking GPS detenido', 'warning');
}

function handleLocationUpdate(position) {
  debugLog('Actualizando ubicación...', position.coords);
  
  const coords = position.coords;
  
  currentLocation = {
    latitude: parseFloat(coords.latitude.toFixed(8)),
    longitude: parseFloat(coords.longitude.toFixed(8)),
    speed: coords.speed ? parseFloat((coords.speed * 3.6).toFixed(2)) : 0,
    accuracy: coords.accuracy || 0,
    timestamp: new Date()
  };

  debugLog('Ubicación procesada:', currentLocation);

  updateLocationDisplay();
  logEvent('Ubicación actualizada correctamente', 'info');
}

function handleLocationError(error) {
  debugLog('Error de geolocalización:', error);
  
  const errorMessages = {
    1: 'Permiso denegado para acceder a la ubicación',
    2: 'Ubicación no disponible',
    3: 'Tiempo de espera agotado'
  };
  
  const message = errorMessages[error.code] || 'Error desconocido de GPS';
  showError(message);
  logEvent(`Error GPS: ${message}`, 'error');
  
  // Detener tracking en caso de error
  isTracking = false;
  updateTrackingUI();
}

function updateLocationDisplay() {
  debugLog('Actualizando display de ubicación...');
  
  if (!currentLocation) {
    debugLog('No hay ubicación actual');
    return;
  }

  const latDisplay = document.getElementById('lat-display');
  const lngDisplay = document.getElementById('lng-display');
  const speedDisplay = document.getElementById('speed-display');
  const accuracyDisplay = document.getElementById('accuracy-display');
  const updateTime = document.getElementById('update-time');
  const locationInfo = document.getElementById('location-info');

  if (latDisplay) latDisplay.textContent = currentLocation.latitude.toString();
  if (lngDisplay) lngDisplay.textContent = currentLocation.longitude.toString();
  if (speedDisplay) speedDisplay.textContent = `${currentLocation.speed} km/h`;
  if (accuracyDisplay) accuracyDisplay.textContent = `${currentLocation.accuracy} m`;
  if (updateTime) updateTime.textContent = currentLocation.timestamp.toLocaleTimeString();

  if (locationInfo) {
    locationInfo.classList.remove('hidden');
    debugLog('Panel de ubicación mostrado');
  }
}

// Acciones de ruta
function handleRouteAction(action) {
  debugLog('Acción de ruta:', action);
  
  const actions = {
    start: function() {
      logEvent('Ruta iniciada oficialmente', 'success');
      updateConnectionStatus('active');
    },
    pause: function() {
      logEvent('Ruta pausada temporalmente', 'warning');
      updateConnectionStatus('paused');
    },
    pickup: function() {
      if (selectedDogs.length > 0) {
        logEvent(`Perro recogido: ${selectedDogs[0].name}`, 'success');
      }
    },
    emergency: function() {
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

// Funciones de UI
function updateTrackingUI() {
  debugLog('Actualizando UI de tracking, estado:', isTracking);
  
  const toggleButton = document.getElementById('toggle-tracking');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  if (toggleButton) {
    toggleButton.textContent = isTracking ? '⏹️ Detener Tracking' : '▶️ Iniciar Tracking GPS';
    toggleButton.className = isTracking 
      ? 'w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors'
      : 'w-full bg-[#56CCF2] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#5B9BD5] transition-colors';
    debugLog('Botón actualizado:', toggleButton.textContent);
  }

  if (statusIndicator) {
    statusIndicator.className = isTracking 
      ? 'w-4 h-4 bg-green-400 rounded-full' 
      : 'w-4 h-4 bg-gray-400 rounded-full';
  }

  if (statusText) {
    statusText.textContent = isTracking ? 'GPS Activo' : 'GPS Inactivo';
  }
}

function updateConnectionStatus(status) {
  const statusConfig = {
    online: { color: 'bg-blue-400', text: 'En línea' },
    active: { color: 'bg-green-400', text: 'Ruta activa' },
    paused: { color: 'bg-yellow-400', text: 'Pausado' },
    emergency: { color: 'bg-red-400', text: '🚨 Emergencia' },
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

function validateForm() {
  const vehicleSelect = document.getElementById('vehicle-select');
  const routeType = document.getElementById('route-type');
  const loadDogsBtn = document.getElementById('load-dogs');
  const toggleTracking = document.getElementById('toggle-tracking');
  const trackingHelp = document.getElementById('tracking-help');

  const vehicleSelected = vehicleSelect ? vehicleSelect.value : '';
  const routeSelected = routeType ? routeType.value : '';
  const hasSelectedDogs = selectedDogs.length > 0;

  debugLog('Validando formulario:', {
    vehicleSelected: !!vehicleSelected,
    routeSelected: !!routeSelected,
    hasSelectedDogs,
    selectedDogsCount: selectedDogs.length
  });

  if (loadDogsBtn) {
    loadDogsBtn.disabled = !vehicleSelected || !routeSelected;
  }

  if (toggleTracking) {
    toggleTracking.disabled = !hasSelectedDogs;
    debugLog('Botón tracking disabled:', !hasSelectedDogs);
  }

  if (trackingHelp) {
    if (!vehicleSelected || !routeSelected) {
      trackingHelp.textContent = 'Selecciona un vehículo primero';
    } else if (!hasSelectedDogs) {
      trackingHelp.textContent = 'Selecciona perros antes de iniciar el tracking';
    } else {
      trackingHelp.textContent = 'Todo listo para iniciar el tracking';
    }
  }
}

function showError(message) {
  debugLog('Mostrando error:', message);
  
  const errorContainer = document.getElementById('error-container');
  const errorMessage = document.getElementById('error-message');
  
  if (errorMessage) errorMessage.textContent = message;
  if (errorContainer) errorContainer.classList.remove('hidden');
}

function hideError() {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) errorContainer.classList.add('hidden');
}

function logEvent(message, type) {
  type = type || 'info';
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${type.toUpperCase()}] ${timestamp} - ${message}`);
  
  const eventHistory = document.getElementById('event-history');
  if (!eventHistory) return;

  const typeConfig = {
    info: { bg: 'bg-[#FFFBF0]', border: 'border-[#ACF0F4]', text: 'text-[#2C3E50]' },
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' }
  };
  
  const config = typeConfig[type] || typeConfig.info;
  
  const eventDiv = document.createElement('div');
  eventDiv.className = `text-xs p-3 ${config.bg} border ${config.border} rounded-lg`;
  eventDiv.innerHTML = `
    <div class="font-medium ${config.text}">
      ${timestamp} - ${message}
    </div>
    <div class="text-[#5B9BD5] mt-1">
      Evento registrado automáticamente
    </div>
  `;
  
  eventHistory.insertBefore(eventDiv, eventHistory.firstChild);
  
  // Mantener solo los últimos 10 eventos
  const events = eventHistory.children;
  if (events.length > 10) {
    eventHistory.removeChild(events[events.length - 1]);
  }
}

// Hacer funciones disponibles globalmente
window.toggleDogSelection = toggleDogSelection;
window.removeDogFromSelection = removeDogFromSelection;
window.handleRouteAction = handleRouteAction;
window.clearAllSelections = clearAllSelections;

debugLog('Todas las funciones registradas globalmente');