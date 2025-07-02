// src/components/dashboard/AdminDashboard.jsx
// 👑 ADMIN CON GESTIÓN COMPLETA DE VEHÍCULOS + ESTILO PARENTDASHBOARD
// ✅ FUNCIONALIDAD COMPLETA + DISEÑO MODERNO

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';
import NotificationManagerDashboard from '../notifications/NotificationManagerDashboard.jsx';


const AdminDashboard = ({ authUser, authProfile }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Estados para datos
  const [allUsers, setAllUsers] = useState([]);
  const [allDogs, setAllDogs] = useState([]);
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [stats, setStats] = useState({});
  
  // Estados para formularios
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showNewDogForm, setShowNewDogForm] = useState(false);
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDog, setEditingDog] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // ✨ NUEVO: Estado para formulario de vehículo
  const [newVehicleForm, setNewVehicleForm] = useState({
    license_plate: '',
    driver_name: '',
    capacity: 6,
    model: '',
    color: '',
    current_driver_id: '',
    notes: ''
  });

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
      
      if (authService.profile?.role !== 'admin') {
        window.location.href = '/login/';
        return;
      }
      
      setCurrentUser(authService.profile);
      await fetchAdminData(authService.user.id);
      
    } catch (error) {
      console.error('❌ Admin error inicializando dashboard:', error);
      setLoading(false);
      window.location.href = '/login/';
    }
  };

  const initializeDashboardWithUser = async (userId) => {
    try {
      await fetchAdminData(userId);
    } catch (error) {
      console.error('❌ Admin error inicializando dashboard:', error);
      setLoading(false);
    }
  };

  // ===============================================
  // 📊 OBTENER DATOS DE ADMINISTRACIÓN
  // ===============================================
  const fetchAdminData = async (userId) => {
    try {
      console.log('🔍 Admin buscando datos...');
      
      // Obtener todos los usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Obtener todos los perros con información del dueño
      const { data: dogsData, error: dogsError } = await supabase
        .from('dogs')
        .select(`
          *,
          owner:profiles(*)
        `)
        .order('created_at', { ascending: false });

      // Obtener todas las evaluaciones
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('evaluations')
        .select(`
          *,
          dog:dogs(*),
          evaluator:profiles(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // ✨ NUEVO: Obtener vehículos con conductor asignado
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          *,
          current_driver:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (usersError) console.error('Error usuarios:', usersError);
      if (dogsError) console.error('Error perros:', dogsError);
      if (evaluationsError) console.error('Error evaluaciones:', evaluationsError);
      if (vehiclesError) console.error('Error vehículos:', vehiclesError);

      // Calcular estadísticas
      const statistics = {
        totalUsers: usersData?.length || 0,
        totalDogs: dogsData?.length || 0,
        totalEvaluations: evaluationsData?.length || 0,
        totalVehicles: vehiclesData?.length || 0,
        usersByRole: usersData?.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}),
        dogsBySize: dogsData?.reduce((acc, dog) => {
          acc[dog.size] = (acc[dog.size] || 0) + 1;
          return acc;
        }, {}),
        vehiclesByStatus: vehiclesData?.reduce((acc, vehicle) => {
          const status = vehicle.active ? 'active' : 'inactive';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        recentEvaluations: evaluationsData?.filter(evaluation => {
          const evalDate = new Date(evaluation.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return evalDate >= weekAgo;
        }).length || 0
      };

      setAllUsers(usersData || []);
      setAllDogs(dogsData || []);
      setAllEvaluations(evaluationsData || []);
      setAllVehicles(vehiclesData || []);
      setStats(statistics);
      
      console.log('✅ Datos del admin cargados:', {
        users: usersData?.length,
        dogs: dogsData?.length,
        evaluations: evaluationsData?.length,
        vehicles: vehiclesData?.length
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo datos del admin:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🚐 GESTIÓN DE VEHÍCULOS (NUEVO)
  // ===============================================
  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    
    try {
      const vehicleData = {
        license_plate: newVehicleForm.license_plate.toUpperCase(),
        driver_name: newVehicleForm.driver_name,
        capacity: parseInt(newVehicleForm.capacity),
        model: newVehicleForm.model,
        color: newVehicleForm.color,
        current_driver_id: newVehicleForm.current_driver_id || null,
        notes: newVehicleForm.notes,
        active: true
      };

      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();

      if (error) throw error;

      alert('✅ Vehículo creado exitosamente');
      setShowNewVehicleForm(false);
      setNewVehicleForm({
        license_plate: '',
        driver_name: '',
        capacity: 6,
        model: '',
        color: '',
        current_driver_id: '',
        notes: ''
      });
      
      // Refrescar datos
      await fetchAdminData(currentUser.id);
      
    } catch (error) {
      console.error('❌ Error creando vehículo:', error);
      alert('Error creando el vehículo: ' + error.message);
    }
  };

  const handleUpdateVehicle = async (vehicleId, updates) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', vehicleId);

      if (error) throw error;

      alert('✅ Vehículo actualizado exitosamente');
      setEditingVehicle(null);
      await fetchAdminData(currentUser.id);
      
    } catch (error) {
      console.error('❌ Error actualizando vehículo:', error);
      alert('Error actualizando el vehículo: ' + error.message);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ active: false })
        .eq('id', vehicleId);

      if (error) throw error;

      alert('✅ Vehículo desactivado exitosamente');
      await fetchAdminData(currentUser.id);
      
    } catch (error) {
      console.error('❌ Error eliminando vehículo:', error);
      alert('Error eliminando el vehículo: ' + error.message);
    }
  };

  // ===============================================
  // 🎨 SIDEBAR DESKTOP (ESTILO PARENTDASHBOARD)
  // ===============================================
  const renderDesktopSidebar = () => (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Logo Header */}
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-lg font-bold">👑</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#2C3E50]">Admin</h1>
                <p className="text-xs text-gray-500">Panel de Control</p>
              </div>
            </div>
          </div>
          
          {/* User Info */}
          <div className="px-4 mb-6">
            <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-lg p-4 text-white">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xl">👑</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {currentUser?.full_name || 'Administrador'}
                  </h3>
                  <p className="text-xs opacity-90">
                    Acceso completo al sistema
                  </p>
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
              <span className="mr-3 text-lg">👑</span>
              Dashboard
            </button>
            
            <button
              onClick={() => setCurrentPage('usuarios')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'usuarios'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">👥</span>
              Usuarios
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
              Perros
            </button>
            
            <button
  onClick={() => setCurrentPage('vehiculos')}
  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
    currentPage === 'vehiculos'
      ? 'bg-[#56CCF2] text-white'
      : 'text-gray-700 hover:bg-gray-100'
  }`}
>
  <span className="mr-3 text-lg">🚐</span>
  Vehículos
</button>

{/* ✅ AGREGAR ESTE BOTÓN AQUÍ: */}
<button
  onClick={() => setCurrentPage('notificaciones')}
  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
    currentPage === 'notificaciones'
      ? 'bg-[#56CCF2] text-white'
      : 'text-gray-700 hover:bg-gray-100'
  }`}
>
  <span className="mr-3 text-lg">🔔</span>
  Notificaciones
</button>
            
            <button
              onClick={() => setCurrentPage('evaluaciones')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'evaluaciones'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">📋</span>
              Evaluaciones
            </button>
            
            <button
              onClick={() => setCurrentPage('reportes')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'reportes'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">📊</span>
              Reportes
            </button>
          </nav>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">En línea</span>
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
            <span className="text-white text-lg">👑</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#2C3E50]">Admin</h1>
            <p className="text-xs text-gray-500">{currentUser?.full_name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={currentPage}
            onChange={(e) => setCurrentPage(e.target.value)}
            className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm"
          >
            <option value="dashboard">👑 Dashboard</option>
            <option value="usuarios">👥 Usuarios</option>
            <option value="perros">🐕 Perros</option>
            <option value="vehiculos">🚐 Vehículos</option>
            <option value="evaluaciones">📋 Evaluaciones</option>
            <option value="reportes">📊 Reportes</option>
          </select>
        </div>
      </div>
    </div>
  );

  // ===============================================
  // 🚐 PÁGINA DE GESTIÓN DE VEHÍCULOS (NUEVO)
  // ===============================================
  const renderVehiclesPage = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🚐 Gestión de Vehículos</h1>
            <p className="text-lg opacity-90">Administrar flota del Club Canino</p>
          </div>
          <button 
            onClick={() => setShowNewVehicleForm(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ➕ Nuevo Vehículo
          </button>
        </div>
      </div>

      {/* Estadísticas de Vehículos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🚐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Vehículos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.vehiclesByStatus?.active || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.vehiclesByStatus?.inactive || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">👨‍💼</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conductores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.usersByRole?.conductor || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario Nuevo Vehículo */}
      {showNewVehicleForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#2C3E50]">➕ Nuevo Vehículo</h3>
            <button 
              onClick={() => setShowNewVehicleForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleCreateVehicle} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Placa *</label>
              <input
                type="text"
                value={newVehicleForm.license_plate}
                onChange={(e) => setNewVehicleForm(prev => ({...prev, license_plate: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2]"
                placeholder="ABC-123"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conductor Actual</label>
              <select
                value={newVehicleForm.current_driver_id}
                onChange={(e) => setNewVehicleForm(prev => ({...prev, current_driver_id: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2]"
              >
                <option value="">Sin conductor asignado</option>
                {allUsers.filter(user => user.role === 'conductor').map(conductor => (
                  <option key={conductor.id} value={conductor.id}>
                    {conductor.full_name} ({conductor.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
              <input
                type="text"
                value={newVehicleForm.model}
                onChange={(e) => setNewVehicleForm(prev => ({...prev, model: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2]"
                placeholder="Toyota Hiace"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <input
                type="text"
                value={newVehicleForm.color}
                onChange={(e) => setNewVehicleForm(prev => ({...prev, color: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2]"
                placeholder="Blanco"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacidad (perros)</label>
              <input
                type="number"
                value={newVehicleForm.capacity}
                onChange={(e) => setNewVehicleForm(prev => ({...prev, capacity: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2]"
                min="1"
                max="20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Conductor</label>
              <input
                type="text"
                value={newVehicleForm.driver_name}
                onChange={(e) => setNewVehicleForm(prev => ({...prev, driver_name: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2]"
                placeholder="Carlos Mendoza"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
              <textarea
                value={newVehicleForm.notes}
                onChange={(e) => setNewVehicleForm(prev => ({...prev, notes: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2]"
                rows="3"
                placeholder="Información adicional del vehículo..."
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNewVehicleForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#5B9BD5]"
              >
                ✅ Crear Vehículo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Vehículos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-[#2C3E50]">
            🚐 Vehículos Registrados ({allVehicles.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehículo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-lg">🚐</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vehicle.license_plate}</div>
                        <div className="text-sm text-gray-500">
                          {vehicle.model} {vehicle.color && `• ${vehicle.color}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vehicle.current_driver ? vehicle.current_driver.full_name : vehicle.driver_name || 'Sin asignar'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {vehicle.current_driver?.email || 'Sin email'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vehicle.capacity || 6} perros</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vehicle.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {vehicle.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => setEditingVehicle(vehicle)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {allVehicles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🚐</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay vehículos registrados</h3>
            <p className="text-gray-600 mb-4">Comienza agregando el primer vehículo del club</p>
            <button 
              onClick={() => setShowNewVehicleForm(true)}
              className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5]"
            >
              ➕ Agregar Vehículo
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ===============================================
  // 🏠 CONTENIDO DASHBOARD (ORIGINAL CON MEJOR DISEÑO)
  // ===============================================
  const renderDashboardContent = () => (
    <div className="space-y-6">
      {/* Header con bienvenida */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Hola {currentUser?.full_name || 'Administrador'}! 👑
            </h1>
            <p className="text-lg opacity-90">
              Panel de administración del Club Canino
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-2">🐕</div>
            <p className="text-sm opacity-80">Control Total</p>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">🐕</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Perros</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDogs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Evaluaciones</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEvaluations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🚐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vehículos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen por roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">👥 Usuarios por Rol</h3>
          <div className="space-y-3">
            {Object.entries(stats.usersByRole || {}).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">
                  {role === 'padre' ? '👨‍👩‍👧‍👦 Padres' : 
                   role === 'profesor' ? '👨‍🏫 Profesores' :
                   role === 'admin' ? '👑 Administradores' : 
                   role === 'conductor' ? '🚐 Conductores' : role}
                </span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">🐕 Perros por Tamaño</h3>
          <div className="space-y-3">
            {Object.entries(stats.dogsBySize || {}).map(([size, count]) => (
              <div key={size} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">
                  {size === 'pequeño' ? '🐕‍🦺 Pequeños' :
                   size === 'mediano' ? '🐕 Medianos' :
                   size === 'grande' ? '🐺 Grandes' :
                   size === 'gigante' ? '🦣 Gigantes' : size}
                </span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
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
      case 'vehiculos':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              {renderVehiclesPage()}
            </div>
          </div>
        );
      
      case 'usuarios':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">👥 Gestión de Usuarios</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-center py-8">
                  Vista de usuarios en desarrollo...
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'perros':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">🐕 Gestión de Perros</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-center py-8">
                  Vista de perros en desarrollo...
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'evaluaciones':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">📋 Gestión de Evaluaciones</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-center py-8">
                  Vista de evaluaciones en desarrollo...
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'reportes':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">📊 Reportes y Estadísticas</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-center py-8">
                  Reportes en desarrollo...
                </p>
              </div>
            </div>
          </div>
        );

        {/* ✅ AGREGAR ESTE CASE AQUÍ: */}
case 'notificaciones':
  return (
    <div className={contentClasses}>
      <div className={innerClasses}>
        <NotificationManagerDashboard
          userId={currentUser?.id}
          dogs={allDogs}
          isAdmin={true}
        />
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
            <span className="text-3xl">👑</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#2C3E50] mb-4">Cargando Panel de Administración</h2>
          <p className="text-gray-600">Conectando con datos del club...</p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#56CCF2] mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // ===============================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ===============================================
  
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

  // ===============================================
  // 🖥️ SIDEBAR DESKTOP
  // ===============================================
  
  function renderDesktopSidebar() {
    return (
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Header */}
          <div className="flex items-center flex-shrink-0 px-4 py-6">
            <div className="w-10 h-10 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-xl flex items-center justify-center mr-3">
              <span className="text-white text-xl font-bold">👑</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2C3E50]">Panel Admin</h1>
              <p className="text-sm text-gray-500">{currentUser?.full_name}</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors mb-2 ${
                currentPage === 'dashboard'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">👑</span>
              Dashboard
            </button>
            
            <button
              onClick={() => setCurrentPage('usuarios')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors mb-2 ${
                currentPage === 'usuarios'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">👥</span>
              Usuarios
            </button>
            
            <button
              onClick={() => setCurrentPage('perros')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors mb-2 ${
                currentPage === 'perros'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">🐕</span>
              Perros
            </button>
            
            <button
              onClick={() => setCurrentPage('vehiculos')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors mb-2 ${
                currentPage === 'vehiculos'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">🚐</span>
              Vehículos
            </button>
            
            <button
              onClick={() => setCurrentPage('evaluaciones')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors mb-2 ${
                currentPage === 'evaluaciones'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">📋</span>
              Evaluaciones
            </button>
            
            <button
              onClick={() => setCurrentPage('reportes')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors mb-2 ${
                currentPage === 'reportes'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">📊</span>
              Reportes
            </button>

            {/* ✅ NUEVO: Botón de Notificaciones */}
            <button
              onClick={() => setCurrentPage('notificaciones')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors mb-2 ${
                currentPage === 'notificaciones'
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">🔔</span>
              Notificaciones
            </button>
          </nav>
          
          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <span className="text-xs text-gray-600">En línea</span>
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
  }

  // ===============================================
  // 📱 HEADER MÓVIL
  // ===============================================
  
  function renderMobileHeader() {
    return (
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-lg">👑</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#2C3E50]">Admin</h1>
              <p className="text-xs text-gray-500">{currentUser?.full_name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select 
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm"
            >
              <option value="dashboard">👑 Dashboard</option>
              <option value="usuarios">👥 Usuarios</option>
              <option value="perros">🐕 Perros</option>
              <option value="vehiculos">🚐 Vehículos</option>
              <option value="evaluaciones">📋 Evaluaciones</option>
              <option value="reportes">📊 Reportes</option>
              {/* ✅ NUEVO: Opción de Notificaciones */}
              <option value="notificaciones">🔔 Notificaciones</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  // ===============================================
  // 🎯 CONTENIDO POR PÁGINA
  // ===============================================
  
  function renderPageContent() {
    const contentClasses = "flex-1 lg:ml-64";
    const innerClasses = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6";

    switch (currentPage) {
      case 'vehiculos':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              {renderVehiclesPage()}
            </div>
          </div>
        );
      
      case 'usuarios':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">👥 Gestión de Usuarios</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-center py-8">
                  Vista de usuarios en desarrollo...
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'perros':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">🐕 Gestión de Perros</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-center py-8">
                  Vista de perros en desarrollo...
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'evaluaciones':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">📋 Gestión de Evaluaciones</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-center py-8">
                  Vista de evaluaciones en desarrollo...
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'reportes':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">📊 Reportes y Estadísticas</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-center py-8">
                  Reportes en desarrollo...
                </p>
              </div>
            </div>
          </div>
        );

      {/* ✅ NUEVO: Case para Notificaciones */}
      case 'notificaciones':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <NotificationManagerDashboard
                userId={currentUser?.id}
                dogs={allDogs}
                isAdmin={true}
              />
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
  }

  // ===============================================
  // 📊 DASHBOARD CONTENT (función que ya tienes)
  // ===============================================
  
  function renderDashboardContent() {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-2xl p-6 lg:p-8 text-white">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">
            👑 Panel de Administración
          </h2>
          <p className="opacity-90">
            Gestión completa del Club Canino Dos Huellitas
          </p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">🐕</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Perros</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Evaluaciones</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvaluations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">🚐</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vehículos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen por roles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">👥 Usuarios por Rol</h3>
            <div className="space-y-3">
              {Object.entries(stats.usersByRole || {}).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">
                    {role === 'padre' ? '👨‍👩‍👧‍👦 Padres' : 
                     role === 'profesor' ? '👨‍🏫 Profesores' :
                     role === 'admin' ? '👑 Administradores' : 
                     role === 'conductor' ? '🚐 Conductores' : role}
                  </span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">🐕 Perros por Tamaño</h3>
            <div className="space-y-3">
              {Object.entries(stats.dogsBySize || {}).map(([size, count]) => (
                <div key={size} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">
                    {size === 'pequeño' ? '🐕‍🦺 Pequeños' :
                     size === 'mediano' ? '🐕 Medianos' :
                     size === 'grande' ? '🐺 Grandes' :
                     size === 'gigante' ? '🦣 Gigantes' : size}
                  </span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===============================================
  // 🚐 VEHICLES PAGE (función que ya tienes)
  // ===============================================
  
  function renderVehiclesPage() {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#2C3E50]">🚐 Gestión de Vehículos</h2>
          <button
            onClick={() => setShowNewVehicleForm(true)}
            className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors font-medium"
          >
            ➕ Nuevo Vehículo
          </button>
        </div>

        {/* Lista de vehículos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-2xl">🚐</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{vehicle.license_plate}</h3>
                    <p className="text-sm text-gray-500">{vehicle.driver_name}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setEditingVehicle(vehicle)}
                    className="p-2 text-gray-400 hover:text-blue-500"
                  >
                    ✏️
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacidad:</span>
                  <span className="font-medium">{vehicle.capacity} perros</span>
                </div>
                {vehicle.model && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modelo:</span>
                    <span className="font-medium">{vehicle.model}</span>
                  </div>
                )}
                {vehicle.color && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color:</span>
                    <span className="font-medium">{vehicle.color}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-medium ${vehicle.active ? 'text-green-600' : 'text-red-600'}`}>
                    {vehicle.active ? '🟢 Activo' : '🔴 Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {allVehicles.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🚐</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay vehículos registrados</h3>
            <p className="text-gray-600 mb-6">Comienza agregando el primer vehículo del club</p>
            <button
              onClick={() => setShowNewVehicleForm(true)}
              className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors font-medium"
            >
              ➕ Agregar Vehículo
            </button>
          </div>
        )}
      </div>
    );
  }
};

export default AdminDashboard;