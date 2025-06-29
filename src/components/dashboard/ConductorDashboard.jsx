// src/components/dashboard/ConductorDashboard.jsx
// 🚐 DASHBOARD PARA CONDUCTORES - GESTIÓN DE RUTAS Y VEHÍCULOS
// ✅ CORREGIDO: Siguiendo patrón del proyecto con props

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const ConductorDashboard = ({ authUser, authProfile }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRoute, setActiveRoute] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [dogList, setDogList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard'); // dashboard, rutas, historial, vehiculo

  useEffect(() => {
    if (authUser && authProfile) {
      console.log('✅ Conductor usando datos de auth recibidos como props');
      setCurrentUser(authProfile);
      initializeDashboardWithUser(authUser.id);
    } else {
      initializeDashboardWithAuthService();
    }
  }, [authUser, authProfile]);

  // ===============================================
  // 🚀 INICIALIZACIÓN CON AUTH SERVICE
  // ===============================================
  const initializeDashboardWithAuthService = async () => {
    try {
      console.log('🔄 Conductor inicializando dashboard con authService...');
      
      const { authService } = await import('../../lib/authService.js');
      
      if (!authService.isInitialized) {
        await authService.initialize();
      }
      
      if (!authService.isAuthenticated) {
        console.error('❌ Conductor usuario no autenticado');
        window.location.href = '/login/';
        return;
      }
      
      if (authService.profile?.role !== 'conductor' && authService.profile?.role !== 'admin') {
        console.error('❌ Conductor acceso denegado - se requiere rol conductor');
        window.location.href = '/login/';
        return;
      }
      
      console.log('✅ Conductor usuario autenticado:', {
        email: authService.user?.email,
        role: authService.profile?.role,
        name: authService.profile?.full_name
      });
      
      setCurrentUser(authService.profile);
      await fetchConductorData(authService.user.id);
      
    } catch (error) {
      console.error('❌ Conductor error inicializando dashboard:', error);
      setLoading(false);
      window.location.href = '/login/';
    }
  };

  // ===============================================
  // 🎯 INICIALIZACIÓN CON USER ID DIRECTO
  // ===============================================
  const initializeDashboardWithUser = async (userId) => {
    try {
      console.log('🔄 Conductor inicializando dashboard para user ID:', userId);
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
      console.log('🔍 Conductor buscando datos...');
      
      // Obtener vehículos asignados
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('current_driver_id', userId)
        .eq('active', true)
        .maybeSingle();

      if (vehiclesError && vehiclesError.code !== 'PGRST116') {
        throw vehiclesError;
      }

      // Obtener rutas programadas
      const { data: routesData, error: routesError } = await supabase
        .from('vehicle_routes')
        .select(`
          *,
          vehicle:vehicles(*),
          driver:profiles(*)
        `)
        .eq('driver_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (routesError) {
        throw routesError;
      }

      // Obtener horarios del día
      const today = new Date().toISOString().split('T')[0];
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('route_schedules')
        .select('*')
        .eq('driver_id', userId)
        .eq('route_date', today);

      if (schedulesError) {
        throw schedulesError;
      }

      // Obtener perros para las rutas de hoy
      const { data: dogsData, error: dogsError } = await supabase
        .from('dogs')
        .select(`
          *,
          owner:profiles(*)
        `)
        .eq('active', true);

      if (dogsError) {
        throw dogsError;
      }

      // Obtener notificaciones recientes
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('vehicle_notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      setVehicle(vehiclesData);
      setActiveRoute(routesData?.[0] || null);
      setSchedules(schedulesData || []);
      setDogList(dogsData || []);
      setNotifications(notificationsData || []);
      
      console.log('✅ Datos del conductor cargados:', {
        vehicle: vehiclesData?.license_plate,
        routes: routesData?.length,
        schedules: schedulesData?.length,
        dogs: dogsData?.length
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo datos del conductor:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🚀 ACCIONES DEL CONDUCTOR
  // ===============================================
  const startRoute = async (scheduleId) => {
    try {
      const { error } = await supabase
        .from('route_schedules')
        .update({ 
          status: 'in_progress',
          start_time: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (error) throw error;
      
      // Refrescar datos
      await fetchConductorData(currentUser.id);
      
      // Mostrar notificación
      alert('🚀 Ruta iniciada exitosamente');
      
    } catch (error) {
      console.error('❌ Error iniciando ruta:', error);
      alert('Error iniciando la ruta');
    }
  };

  const completeRoute = async (scheduleId) => {
    try {
      const { error } = await supabase
        .from('route_schedules')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (error) throw error;
      
      // Refrescar datos
      await fetchConductorData(currentUser.id);
      
      alert('✅ Ruta completada exitosamente');
      
    } catch (error) {
      console.error('❌ Error completando ruta:', error);
      alert('Error completando la ruta');
    }
  };

  // ===============================================
  // 🎨 RENDERIZADO DE NAVEGACIÓN
  // ===============================================
  const renderNavigation = () => (
    <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              currentPage === 'dashboard'
                ? 'border-[#56CCF2] text-[#56CCF2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🚐 Dashboard
          </button>
          <button
            onClick={() => setCurrentPage('rutas')}
            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              currentPage === 'rutas'
                ? 'border-[#56CCF2] text-[#56CCF2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🗺️ Rutas
          </button>
          <button
            onClick={() => setCurrentPage('vehiculo')}
            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              currentPage === 'vehiculo'
                ? 'border-[#56CCF2] text-[#56CCF2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🚗 Mi Vehículo
          </button>
          <button
            onClick={() => setCurrentPage('historial')}
            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
              currentPage === 'historial'
                ? 'border-[#56CCF2] text-[#56CCF2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Historial
          </button>
        </div>
      </div>
    </div>
  );

  // ===============================================
  // 🏠 CONTENIDO PRINCIPAL DEL DASHBOARD
  // ===============================================
  const renderDashboardContent = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header con bienvenida */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Hola {currentUser?.full_name || 'Conductor'}! 🚐
            </h1>
            <p className="text-lg opacity-90">
              {vehicle ? `Vehículo asignado: ${vehicle.license_plate}` : 'Sin vehículo asignado'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-2">🐕</div>
            <p className="text-sm opacity-80">Panel de Conductor</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado actual de la ruta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">🗺️ Estado de Ruta</h2>
          
          {activeRoute ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-green-800">Ruta Activa</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activeRoute.status === 'in_progress' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {activeRoute.status === 'in_progress' ? 'En Progreso' : 'Planificada'}
                  </span>
                </div>
                <p className="text-green-700 text-sm">
                  {activeRoute.route_name}
                </p>
                <p className="text-green-600 text-xs">
                  Perros: {activeRoute.dog_ids?.length || 0}
                </p>
              </div>
              
              <div className="flex gap-2">
                {activeRoute.status !== 'in_progress' && (
                  <button
                    onClick={() => startRoute(activeRoute.id)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    🚀 Iniciar Ruta
                  </button>
                )}
                {activeRoute.status === 'in_progress' && (
                  <button
                    onClick={() => completeRoute(activeRoute.id)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ✅ Completar Ruta
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🛤️</div>
              <p className="text-gray-600">No hay rutas activas</p>
              <p className="text-sm text-gray-500">Las rutas aparecerán aquí cuando sean asignadas</p>
            </div>
          )}
        </div>

        {/* Información del vehículo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">🚗 Mi Vehículo</h2>
          
          {vehicle ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Placa:</span>
                <span className="font-semibold">{vehicle.license_plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modelo:</span>
                <span className="font-semibold">{vehicle.model || 'No especificado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Color:</span>
                <span className="font-semibold">{vehicle.color || 'No especificado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacidad:</span>
                <span className="font-semibold">{vehicle.capacity} perros</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  vehicle.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {vehicle.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🚫</div>
              <p className="text-gray-600">Sin vehículo asignado</p>
              <p className="text-sm text-gray-500">Contacta al administrador</p>
            </div>
          )}
        </div>
      </div>

      {/* Horarios del día */}
      <div className="mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-4">📅 Horarios de Hoy</h2>
          
          {schedules.length > 0 ? (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold">{schedule.shift_type === 'morning' ? '🌅 Recogida' : '🌇 Entrega'}</p>
                    <p className="text-sm text-gray-600">{schedule.start_time} - {schedule.end_time}</p>
                    <p className="text-xs text-gray-500">{schedule.assigned_dog_ids?.length || 0} perros</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    schedule.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : schedule.status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {schedule.status === 'completed' ? 'Completado' : 
                     schedule.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-gray-600">No hay horarios programados para hoy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ===============================================
  // 🎯 RENDERIZADO PRINCIPAL POR PÁGINA
  // ===============================================
  const renderPageContent = () => {
    switch (currentPage) {
      case 'rutas':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">🗺️ Gestión de Rutas</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600 text-center py-8">
                Funcionalidad de rutas en desarrollo...
              </p>
            </div>
          </div>
        );
      
      case 'vehiculo':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">🚗 Información del Vehículo</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600 text-center py-8">
                Detalles del vehículo en desarrollo...
              </p>
            </div>
          </div>
        );
      
      case 'historial':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">📊 Historial de Rutas</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600 text-center py-8">
                Historial de rutas en desarrollo...
              </p>
            </div>
          </div>
        );
      
      default:
        return renderDashboardContent();
    }
  };

  // ===============================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ===============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#56CCF2] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🚐</span>
          </div>
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">Cargando Dashboard Conductor</h2>
          <p className="text-gray-600">Accediendo a información de rutas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      {renderNavigation()}
      {renderPageContent()}
    </div>
  );
};

export default ConductorDashboard;