// src/components/dashboard/ConductorDashboard.jsx
// 🚐 DASHBOARD CONDUCTOR - SISTEMA REAL DE TRACKING GPS
// ✅ SIN MODO DEMO + TRACKING COMPLETO + PUNTOS DE PICKUP/DELIVERY

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const ConductorDashboard = ({ authUser, authProfile }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRoute, setActiveRoute] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Estado para gestión de perros y tracking
  const [allDogs, setAllDogs] = useState([]);
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [availableDogs, setAvailableDogs] = useState([]);
  const [routeType, setRouteType] = useState('');
  const [selectedDogsWithAddresses, setSelectedDogsWithAddresses] = useState([]);
  
  // Estado de tracking GPS
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeProgress, setRouteProgress] = useState([]);
  const [currentDogIndex, setCurrentDogIndex] = useState(0);
  
  // Estado de navegación
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    if (authUser && authProfile) {
      setCurrentUser(authProfile);
      initializeDashboardWithUser(authUser.id);
    } else {
      initializeDashboardWithAuthService();
    }
  }, [authUser, authProfile]);

  // ===============================================
  // 🚀 INICIALIZACIÓN
  // ===============================================
  const initializeDashboardWithAuthService = async () => {
    try {
      const { authService } = await import('../../lib/authService.js');
      
      if (!authService.isInitialized) {
        await authService.initialize();
      }
      
      if (!authService.isAuthenticated) {
        window.location.href = '/login/';
        return;
      }
      
      if (authService.profile?.role !== 'conductor' && authService.profile?.role !== 'admin') {
        window.location.href = '/login/';
        return;
      }
      
      setCurrentUser(authService.profile);
      await fetchConductorData(authService.user.id);
      
    } catch (error) {
      console.error('❌ Conductor error inicializando dashboard:', error);
      setLoading(false);
      window.location.href = '/login/';
    }
  };

  const initializeDashboardWithUser = async (userId) => {
    try {
      await fetchConductorData(userId);
    } catch (error) {
      console.error('❌ Conductor error inicializando dashboard:', error);
      setLoading(false);
    }
  };

  // ===============================================
  // 📊 OBTENER DATOS DEL CONDUCTOR
  // ===============================================
  const fetchConductorData = async (userId) => {
    try {
      console.log('🔍 Conductor buscando datos para userId:', userId);
      
      // ✅ CREAR VEHÍCULO AUTOMÁTICAMENTE SI NO EXISTE
      let vehiclesData = null;
      try {
        const vehicleQuery = await supabase
          .from('vehicles')
          .select('*')
          .eq('current_driver_id', userId)
          .eq('active', true);
          
        if (vehicleQuery.data && vehicleQuery.data.length > 0) {
          vehiclesData = vehicleQuery.data[0];
        } else {
          // 🚀 CREAR VEHÍCULO AUTOMÁTICAMENTE
          console.log('🚗 Creando vehículo automático para conductor...');
          const newVehicle = {
            license_plate: `VEH-${userId.substring(0, 6).toUpperCase()}`,
            driver_name: currentUser?.full_name || 'Conductor',
            capacity: 6,
            model: 'Vehículo del Club',
            color: 'Blanco',
            current_driver_id: userId,
            active: true,
            notes: 'Vehículo creado automáticamente para conductor'
          };
          
          const { data: createdVehicle, error: createError } = await supabase
            .from('vehicles')
            .insert([newVehicle])
            .select()
            .single();
            
          if (createError) {
            console.error('❌ Error creando vehículo:', createError);
          } else {
            vehiclesData = createdVehicle;
            console.log('✅ Vehículo creado:', vehiclesData.license_plate);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error con vehículos:', error);
      }

      // Obtener rutas del conductor
      let routesData = [];
      try {
        const routeQuery = await supabase
          .from('vehicle_routes')
          .select('*')
          .eq('driver_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
          
        routesData = routeQuery.data || [];
      } catch (error) {
        console.warn('⚠️ Error con rutas:', error);
      }

      // Obtener horarios
      let schedulesData = [];
      try {
        const scheduleQuery = await supabase
          .from('route_schedules')
          .select('*')
          .eq('driver_id', userId)
          .eq('route_date', new Date().toISOString().split('T')[0])
          .order('start_time', { ascending: true });
          
        schedulesData = scheduleQuery.data || [];
      } catch (error) {
        console.warn('⚠️ Error con horarios:', error);
      }

      // Obtener perros con direcciones de los dueños
      let dogsData = [];
      try {
        const dogQuery = await supabase
          .from('dogs')
          .select(`
            *,
            owner:profiles(*)
          `)
          .eq('active', true)
          .order('name', { ascending: true });
          
        dogsData = dogQuery.data || [];
      } catch (error) {
        console.warn('⚠️ Error con perros:', error);
      }

      // Obtener notificaciones
      let notificationsData = [];
      try {
        const notificationQuery = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);
          
        notificationsData = notificationQuery.data || [];
      } catch (error) {
        console.warn('⚠️ Error con notificaciones:', error);
      }

      // Establecer datos
      setVehicle(vehiclesData);
      setActiveRoute(routesData?.[0] || null);
      setSchedules(schedulesData);
      setAllDogs(dogsData);
      setNotifications(notificationsData);
      
      console.log('✅ Datos del conductor cargados:', {
        vehicle: vehiclesData?.license_plate || 'Sin vehículo',
        routes: routesData?.length || 0,
        schedules: schedulesData?.length || 0,
        dogs: dogsData?.length || 0,
        notifications: notificationsData?.length || 0
      });
      
    } catch (error) {
      console.error('❌ Error general obteniendo datos del conductor:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🗺️ SISTEMA DE TRACKING GPS
  // ===============================================
  const initializeGPSTracking = () => {
    if (!navigator.geolocation) {
      alert('❌ Tu dispositivo no soporta GPS');
      return false;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        
        setCurrentLocation(location);
        
        // Guardar ubicación en tiempo real
        saveLocationUpdate(location);
      },
      (error) => {
        console.error('❌ Error GPS:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return watchId;
  };

  const saveLocationUpdate = async (location) => {
    if (!vehicle || !activeRoute) return;

    try {
      const locationData = {
        vehicle_id: vehicle.id,
        route_id: activeRoute.id,
        driver_id: currentUser.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        is_moving: true,
        source: 'REAL_GPS_DEVICE',
        location_timestamp: location.timestamp,
        device_timestamp: location.timestamp
      };

      await supabase
        .from('vehicle_locations')
        .insert([locationData]);

    } catch (error) {
      console.error('❌ Error guardando ubicación:', error);
    }
  };

  // ===============================================
  // 🐕 GESTIÓN DE PERROS CON DIRECCIONES
  // ===============================================
  const loadAvailableDogs = () => {
    if (!routeType) {
      alert('⚠️ Selecciona el tipo de ruta primero');
      return;
    }
    
    // Filtrar perros disponibles
    const available = allDogs.filter(dog => dog.active);
    setAvailableDogs(available);
    console.log(`📋 Perros disponibles para ${routeType}:`, available.length);
  };

  const toggleDogSelection = (dogId) => {
    setSelectedDogs(prev => {
      if (prev.includes(dogId)) {
        return prev.filter(id => id !== dogId);
      } else {
        const maxCapacity = vehicle?.capacity || 6;
        if (prev.length >= maxCapacity) {
          alert(`⚠️ Capacidad máxima del vehículo: ${maxCapacity} perros`);
          return prev;
        }
        return [...prev, dogId];
      }
    });
  };

  const setDogAddress = (dogId, address) => {
    setSelectedDogsWithAddresses(prev => {
      const updated = prev.filter(item => item.dogId !== dogId);
      return [...updated, { dogId, address, status: 'pending' }];
    });
  };

  // ===============================================
  // 🚀 CREAR Y INICIAR RUTA REAL
  // ===============================================
  const createRouteWithDogs = async () => {
    if (selectedDogs.length === 0) {
      alert('⚠️ Selecciona al menos un perro para la ruta');
      return;
    }

    if (!vehicle) {
      alert('⚠️ Se requiere un vehículo asignado');
      return;
    }

    // Verificar que todos los perros tengan direcciones
    const dogsWithoutAddresses = selectedDogs.filter(dogId => 
      !selectedDogsWithAddresses.find(item => item.dogId === dogId)?.address
    );

    if (dogsWithoutAddresses.length > 0) {
      alert('⚠️ Todos los perros deben tener una dirección asignada');
      return;
    }

    try {
      // Preparar direcciones para la ruta
      const addresses = selectedDogsWithAddresses
        .filter(item => selectedDogs.includes(item.dogId))
        .map(item => item.address);

      const routeData = {
        vehicle_id: vehicle.id, // ✅ CORREGIDO: Ahora siempre hay vehículo
        driver_id: currentUser.id,
        route_name: `Ruta ${routeType} - ${new Date().toLocaleDateString()}`,
        route_type: routeType,
        status: 'planned',
        dog_ids: selectedDogs,
        planned_start_time: new Date().toISOString(),
        pickup_addresses: routeType === 'pickup' ? addresses : [],
        delivery_addresses: routeType === 'delivery' ? addresses : [],
        notes: `Ruta creada por conductor ${currentUser.full_name}`
      };

      const { data, error } = await supabase
        .from('vehicle_routes')
        .insert([routeData])
        .select()
        .single();

      if (error) throw error;

      setActiveRoute(data);
      alert(`✅ Ruta creada exitosamente con ${selectedDogs.length} perros`);
      
      // Limpiar selección
      setSelectedDogs([]);
      setAvailableDogs([]);
      setSelectedDogsWithAddresses([]);
      setRouteType('');
      
      // Cambiar a página principal para iniciar ruta
      setCurrentPage('dashboard');
      
    } catch (error) {
      console.error('❌ Error creando ruta:', error);
      alert('Error creando la ruta: ' + error.message);
    }
  };

  const startActiveRoute = async () => {
    if (!activeRoute) {
      alert('⚠️ No hay ruta activa para iniciar');
      return;
    }

    try {
      // Actualizar estado de la ruta
      const { error } = await supabase
        .from('vehicle_routes')
        .update({ 
          status: 'in_progress',
          actual_start_time: new Date().toISOString()
        })
        .eq('id', activeRoute.id);

      if (error) throw error;

      // Iniciar tracking GPS
      const watchId = initializeGPSTracking();
      if (watchId) {
        setIsTrackingActive(true);
        setCurrentDogIndex(0);
        
        // Enviar notificaciones a padres
        await notifyParentsRouteStarted();
        
        alert('🚀 Ruta iniciada! Los padres pueden seguir el vehículo en tiempo real');
      }
      
      // Refrescar datos
      await fetchConductorData(currentUser.id);
      
    } catch (error) {
      console.error('❌ Error iniciando ruta:', error);
      alert('Error iniciando la ruta: ' + error.message);
    }
  };

  const completeCurrentStop = async () => {
    if (!activeRoute || !isTrackingActive) return;

    try {
      const dogId = selectedDogs[currentDogIndex];
      const dog = allDogs.find(d => d.id === dogId);
      
      if (!dog) return;

      // Marcar perro como recogido/entregado
      const stopData = {
        route_id: activeRoute.id,
        dog_id: dogId,
        location: currentLocation,
        timestamp: new Date().toISOString(),
        action: routeType === 'pickup' ? 'picked_up' : 'delivered',
        notes: `${dog.name} ${routeType === 'pickup' ? 'recogido' : 'entregado'} exitosamente`
      };

      // Guardar en historial de paradas (necesitarías crear esta tabla)
      console.log('📍 Parada completada:', stopData);

      // Notificar al padre específico
      await notifyParentDogUpdate(dog, stopData.action);

      // Avanzar al siguiente perro
      if (currentDogIndex < selectedDogs.length - 1) {
        setCurrentDogIndex(prev => prev + 1);
        alert(`✅ ${dog.name} ${stopData.action}. Siguiente parada cargada.`);
      } else {
        // Completar ruta
        await completeActiveRoute();
      }

    } catch (error) {
      console.error('❌ Error completando parada:', error);
    }
  };

  const completeActiveRoute = async () => {
    if (!activeRoute) return;

    try {
      const { error } = await supabase
        .from('vehicle_routes')
        .update({ 
          status: 'completed',
          actual_end_time: new Date().toISOString()
        })
        .eq('id', activeRoute.id);

      if (error) throw error;

      setIsTrackingActive(false);
      setCurrentLocation(null);
      setCurrentDogIndex(0);
      
      // Notificar a padres que la ruta terminó
      await notifyParentsRouteCompleted();
      
      alert('🏁 Ruta completada exitosamente!');
      
      // Refrescar datos
      await fetchConductorData(currentUser.id);
      
    } catch (error) {
      console.error('❌ Error completando ruta:', error);
    }
  };

  // ===============================================
  // 📱 NOTIFICACIONES A PADRES
  // ===============================================
  const notifyParentsRouteStarted = async () => {
    try {
      const notifications = selectedDogs.map(dogId => {
        const dog = allDogs.find(d => d.id === dogId);
        return {
          user_id: dog?.owner_id,
          title: '🚐 Ruta Iniciada',
          message: `El transporte ha comenzado la ruta. Puedes seguir la ubicación de ${dog?.name} en tiempo real.`,
          type: 'info'
        };
      });

      await supabase
        .from('notifications')
        .insert(notifications);

    } catch (error) {
      console.error('❌ Error enviando notificaciones:', error);
    }
  };

  const notifyParentDogUpdate = async (dog, action) => {
    try {
      const actionText = action === 'picked_up' ? 'recogido' : 'entregado';
      
      await supabase
        .from('notifications')
        .insert([{
          user_id: dog.owner_id,
          title: `📍 ${dog.name} ${actionText}`,
          message: `${dog.name} ha sido ${actionText} exitosamente a las ${new Date().toLocaleTimeString()}.`,
          type: 'success'
        }]);

    } catch (error) {
      console.error('❌ Error enviando notificación individual:', error);
    }
  };

  const notifyParentsRouteCompleted = async () => {
    try {
      const notifications = selectedDogs.map(dogId => {
        const dog = allDogs.find(d => d.id === dogId);
        return {
          user_id: dog?.owner_id,
          title: '🏁 Ruta Completada',
          message: `La ruta ha sido completada exitosamente. ${dog?.name} ha llegado a su destino.`,
          type: 'success'
        };
      });

      await supabase
        .from('notifications')
        .insert(notifications);

    } catch (error) {
      console.error('❌ Error enviando notificaciones finales:', error);
    }
  };

  // ===============================================
  // 🎨 SIDEBAR DESKTOP
  // ===============================================
  const renderDesktopSidebar = () => (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Logo Header */}
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-lg font-bold">🚐</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#2C3E50]">Conductor</h1>
                <p className="text-xs text-gray-500">Panel de Control</p>
              </div>
            </div>
          </div>
          
          {/* User Info */}
          <div className="px-4 mb-6">
            <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-lg p-4 text-white">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xl">👨‍💼</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {currentUser?.full_name || 'Conductor'}
                  </h3>
                  <p className="text-xs opacity-90">
                    {vehicle ? `Vehículo: ${vehicle.license_plate}` : 'Configurando vehículo...'}
                  </p>
                  {isTrackingActive && (
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                      <span className="text-xs">GPS Activo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 px-4 space-y-2">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'dashboard'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">🚐</span>
              Dashboard
              {isTrackingActive && (
                <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </button>
            
            <button
              onClick={() => setCurrentPage('perros')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'perros'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">🐕</span>
              Gestionar Perros
            </button>
            
            <button
              onClick={() => setCurrentPage('tracking')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'tracking'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              disabled={!isTrackingActive}
            >
              <span className="mr-3 text-lg">📍</span>
              Tracking GPS
              {isTrackingActive && (
                <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </button>
            
            <button
              onClick={() => setCurrentPage('vehiculo')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'vehiculo'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">🚗</span>
              Mi Vehículo
            </button>
            
            <button
              onClick={() => setCurrentPage('historial')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'historial'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">📊</span>
              Historial
            </button>
          </nav>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isTrackingActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-600">
                {isTrackingActive ? 'Tracking Activo' : 'Desconectado'}
              </span>
            </div>
            <button 
              onClick={() => window.location.href = '/login/'}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ===============================================
  // 📱 HEADER MÓVIL
  // ===============================================
  const renderMobileHeader = () => (
    <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-lg">🚐</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#2C3E50]">Conductor</h1>
            <p className="text-xs text-gray-500">{currentUser?.full_name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isTrackingActive && (
            <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
              <span className="text-xs text-green-800">GPS</span>
            </div>
          )}
          <select 
            value={currentPage}
            onChange={(e) => setCurrentPage(e.target.value)}
            className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm"
          >
            <option value="dashboard">🚐 Dashboard</option>
            <option value="perros">🐕 Perros</option>
            <option value="tracking" disabled={!isTrackingActive}>📍 Tracking</option>
            <option value="vehiculo">🚗 Vehículo</option>
            <option value="historial">📊 Historial</option>
          </select>
        </div>
      </div>
    </div>
  );

  // ===============================================
  // 🐕 PÁGINA DE GESTIÓN DE PERROS CON DIRECCIONES
  // ===============================================
  const renderDogsPage = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🐕 Gestión de Perros</h1>
        <p className="text-lg opacity-90">Selecciona perros y configura direcciones</p>
      </div>

      {/* Configuración de Ruta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">🚗 Configuración de Ruta</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehículo Asignado
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              {vehicle ? (
                <div>
                  <div className="font-semibold text-[#2C3E50]">{vehicle.license_plate}</div>
                  <div className="text-sm text-gray-600">Capacidad: {vehicle.capacity} perros</div>
                </div>
              ) : (
                <div>
                  <div className="font-semibold text-orange-600">Configurando...</div>
                  <div className="text-sm text-gray-600">Creando vehículo automáticamente</div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Ruta
            </label>
            <select 
              value={routeType}
              onChange={(e) => setRouteType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2]"
            >
              <option value="">Seleccionar tipo...</option>
              <option value="pickup">🏠➡️🏫 Recoger (Casa → Colegio)</option>
              <option value="delivery">🏫➡️🏠 Entregar (Colegio → Casa)</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={loadAvailableDogs}
              disabled={!vehicle || !routeType}
              className="w-full bg-[#56CCF2] text-white p-3 rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50"
            >
              📋 Cargar Perros
            </button>
          </div>
        </div>

        {/* Resumen de Selección */}
        {selectedDogs.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-green-800 font-semibold">
                  ✅ {selectedDogs.length} perros seleccionados
                </span>
                <span className="text-green-600 ml-2">
                  (Direcciones: {selectedDogsWithAddresses.length}/{selectedDogs.length})
                </span>
              </div>
              <button 
                onClick={createRouteWithDogs}
                disabled={selectedDogsWithAddresses.length !== selectedDogs.length}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                🚀 Crear Ruta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Perros Disponibles */}
      {availableDogs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-[#2C3E50]">
              📋 Perros Disponibles ({availableDogs.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Selecciona perros y configura sus direcciones
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {availableDogs.map((dog) => (
              <div key={dog.id} className={`border rounded-lg p-4 ${selectedDogs.includes(dog.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDogs.includes(dog.id)}
                      onChange={() => toggleDogSelection(dog.id)}
                      className="h-4 w-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded mr-3"
                    />
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-lg">🐕</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{dog.name}</div>
                        <div className="text-sm text-gray-500">{dog.breed} • {dog.owner?.full_name}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedDogs.includes(dog.id) && (
                  <div className="ml-7">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📍 Dirección de {routeType === 'pickup' ? 'recogida' : 'entrega'}:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Calle 123 #45-67, Bogotá"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2]"
                      onChange={(e) => setDogAddress(dog.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mostrar todos los perros si no hay disponibles cargados */}
      {availableDogs.length === 0 && allDogs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🐕</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {allDogs.length} perros registrados en el club
            </h3>
            <p className="text-gray-600">
              Configura el tipo de ruta para cargar los perros disponibles
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // ===============================================
  // 📍 PÁGINA DE TRACKING GPS
  // ===============================================
  const renderTrackingPage = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">📍 Tracking GPS</h1>
        <p className="text-lg opacity-90">
          {isTrackingActive ? 'Ruta en progreso - Los padres pueden seguirte' : 'No hay tracking activo'}
        </p>
      </div>

      {isTrackingActive && activeRoute && (
        <>
          {/* Estado actual */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">🗺️ Estado Actual</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">📍 Ubicación Actual</h3>
                {currentLocation ? (
                  <div className="space-y-2 text-sm">
                    <div>Latitud: {currentLocation.latitude.toFixed(6)}</div>
                    <div>Longitud: {currentLocation.longitude.toFixed(6)}</div>
                    <div>Precisión: {currentLocation.accuracy?.toFixed(0)}m</div>
                    <div>Actualizado: {new Date(currentLocation.timestamp).toLocaleTimeString()}</div>
                  </div>
                ) : (
                  <div className="text-gray-500">Obteniendo ubicación GPS...</div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">🐕 Progreso de Ruta</h3>
                <div className="space-y-2">
                  <div>Perros en ruta: {selectedDogs.length}</div>
                  <div>Parada actual: {currentDogIndex + 1} de {selectedDogs.length}</div>
                  {selectedDogs[currentDogIndex] && (
                    <div className="text-sm text-gray-600">
                      Siguiente: {allDogs.find(d => d.id === selectedDogs[currentDogIndex])?.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controles de ruta */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">🎮 Controles de Ruta</h2>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={completeCurrentStop}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ Completar Parada Actual
              </button>
              
              <button 
                onClick={completeActiveRoute}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🏁 Finalizar Ruta
              </button>
              
              <button 
                onClick={() => setIsTrackingActive(false)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                ⏸️ Pausar Tracking
              </button>
            </div>
          </div>
        </>
      )}

      {!isTrackingActive && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay tracking activo</h3>
            <p className="text-gray-600 mb-4">
              Crea una ruta e inicia el tracking para que los padres puedan seguirte
            </p>
            <button 
              onClick={() => setCurrentPage('perros')}
              className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5]"
            >
              🐕 Gestionar Perros
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ===============================================
  // 🏠 CONTENIDO DASHBOARD
  // ===============================================
  const renderDashboardContent = () => (
    <div className="space-y-6">
      {/* Header con bienvenida */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Hola {currentUser?.full_name || 'Conductor'}! 🚐
            </h1>
            <p className="text-lg opacity-90">
              {vehicle ? `Vehículo: ${vehicle.license_plate}` : 'Configurando vehículo...'}
            </p>
            {isTrackingActive && (
              <div className="flex items-center mt-2">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm">Tracking GPS activo - Los padres pueden seguirte</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-4xl mb-2">🐕</div>
            <p className="text-sm opacity-80">Sistema de Tracking</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado actual de la ruta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">🗺️ Estado de Ruta</h2>
          
          {activeRoute ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Ruta Activa:</span>
                <span className="font-semibold text-[#2C3E50]">{activeRoute.route_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activeRoute.status === 'completed' ? 'bg-green-100 text-green-800' :
                  activeRoute.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {activeRoute.status === 'completed' ? 'Completada' : 
                   activeRoute.status === 'in_progress' ? 'En Progreso' : 'Planificada'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Perros:</span>
                <span className="font-semibold text-[#2C3E50]">{activeRoute.dog_ids?.length || 0}</span>
              </div>
              
              {activeRoute.status === 'planned' && (
                <div className="pt-4">
                  <button 
                    onClick={startActiveRoute}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    🚀 Iniciar Ruta y Tracking GPS
                  </button>
                </div>
              )}
              
              {activeRoute.status === 'in_progress' && (
                <div className="pt-4 space-y-2">
                  <button 
                    onClick={() => setCurrentPage('tracking')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📍 Ver Tracking Detallado
                  </button>
                  <button 
                    onClick={completeActiveRoute}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    🏁 Finalizar Ruta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-gray-600 mb-4">No hay rutas activas</p>
              <button 
                onClick={() => setCurrentPage('perros')}
                className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
              >
                🐕 Crear Nueva Ruta
              </button>
            </div>
          )}
        </div>

        {/* Información del vehículo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">🚗 Mi Vehículo</h2>
          
          {vehicle ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Placa:</span>
                <span className="font-semibold text-[#2C3E50]">{vehicle.license_plate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Capacidad:</span>
                <span className="font-semibold text-[#2C3E50]">{vehicle.capacity} perros</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estado GPS:</span>
                <span className={`font-semibold ${isTrackingActive ? 'text-green-600' : 'text-gray-600'}`}>
                  {isTrackingActive ? '🟢 Tracking Activo' : '🔴 Desconectado'}
                </span>
              </div>
              {vehicle.model && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Modelo:</span>
                  <span className="font-semibold text-[#2C3E50]">{vehicle.model}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🚗</div>
              <p className="text-gray-600">Configurando vehículo automáticamente...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ===============================================
  // 🎯 CONTENIDO POR PÁGINA
  // ===============================================
  const renderPageContent = () => {
    const contentClasses = "flex-1 lg:ml-64";
    const innerClasses = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6";

    switch (currentPage) {
      case 'perros':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              {renderDogsPage()}
            </div>
          </div>
        );
      
      case 'tracking':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              {renderTrackingPage()}
            </div>
          </div>
        );
      
      case 'vehiculo':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">🚗 Información del Vehículo</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {vehicle ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">Placa:</span>
                        <span className="font-semibold text-[#2C3E50] ml-2">{vehicle.license_plate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Modelo:</span>
                        <span className="font-semibold text-[#2C3E50] ml-2">{vehicle.model || 'No especificado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Color:</span>
                        <span className="font-semibold text-[#2C3E50] ml-2">{vehicle.color || 'No especificado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Capacidad:</span>
                        <span className="font-semibold text-[#2C3E50] ml-2">{vehicle.capacity || 6} perros</span>
                      </div>
                    </div>
                    
                    {vehicle.notes && (
                      <div>
                        <span className="text-gray-600">Notas:</span>
                        <p className="text-gray-800 mt-1">{vehicle.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🚗</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Configurando Vehículo</h3>
                    <p className="text-gray-600">
                      El sistema está creando automáticamente un vehículo para ti
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'historial':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">📊 Historial de Rutas</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-center py-8">
                  Historial de rutas en desarrollo...
                </p>
              </div>
            </div>
          </div>
        );
      
      default: // dashboard
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              {renderDashboardContent()}
            </div>
          </div>
        );
    }
  };

  // ===============================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ===============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-3xl">🚐</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#2C3E50] mb-4">Cargando Sistema de Tracking</h2>
          <p className="text-gray-600">Inicializando GPS y vehículo...</p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#56CCF2] mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {renderDesktopSidebar()}
      
      {/* Mobile Header */}
      {renderMobileHeader()}
      
      {/* Main Content */}
      {renderPageContent()}
    </div>
  );
};

export default ConductorDashboard;