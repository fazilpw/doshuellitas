// src/components/dashboard/AdminDashboard.jsx
// 👑 DASHBOARD PARA ADMINISTRADORES - GESTIÓN COMPLETA DEL CLUB CANINO
// ✅ CORREGIDO: Error de 'eval' en línea 173

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const AdminDashboard = ({ authUser, authProfile }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard'); // dashboard, usuarios, perros, profesores, conductores, reportes
  
  // Estados para datos
  const [allUsers, setAllUsers] = useState([]);
  const [allDogs, setAllDogs] = useState([]);
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [stats, setStats] = useState({});
  
  // Estados para formularios
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showNewDogForm, setShowNewDogForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDog, setEditingDog] = useState(null);
  
  // Estado para formulario de nuevo usuario
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'padre'
  });
  
  // Estado para formulario de nuevo perro
  const [newDogForm, setNewDogForm] = useState({
    name: '',
    breed: '',
    size: 'mediano',
    age: '',
    weight: '',
    color: '',
    owner_id: '',
    notes: ''
  });

  useEffect(() => {
    if (authUser && authProfile) {
      console.log('✅ Admin usando datos de auth recibidos como props');
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
      console.log('🔄 Admin inicializando dashboard con authService...');
      
      const { authService } = await import('../../lib/authService.js');
      
      if (!authService.isInitialized) {
        await authService.initialize();
      }
      
      if (!authService.isAuthenticated) {
        console.error('❌ Admin usuario no autenticado');
        window.location.href = '/login/';
        return;
      }
      
      if (authService.profile?.role !== 'admin') {
        console.error('❌ Admin acceso denegado - se requiere rol admin');
        window.location.href = '/login/';
        return;
      }
      
      console.log('✅ Admin usuario autenticado:', {
        email: authService.user?.email,
        role: authService.profile?.role,
        name: authService.profile?.full_name
      });
      
      setCurrentUser(authService.profile);
      await fetchAdminData(authService.user.id);
      
    } catch (error) {
      console.error('❌ Admin error inicializando dashboard:', error);
      setLoading(false);
      window.location.href = '/login/';
    }
  };

  // ===============================================
  // 🎯 INICIALIZACIÓN CON USER ID DIRECTO
  // ===============================================
  const initializeDashboardWithUser = async (userId) => {
    try {
      console.log('🔄 Admin inicializando dashboard para user ID:', userId);
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

      if (usersError) throw usersError;

      // Obtener todos los perros con información del dueño
      const { data: dogsData, error: dogsError } = await supabase
        .from('dogs')
        .select(`
          *,
          owner:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (dogsError) throw dogsError;

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

      if (evaluationsError) throw evaluationsError;

      // Obtener vehículos
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          *,
          current_driver:profiles(*)
        `);

      if (vehiclesError) throw vehiclesError;

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
        // ✅ CORREGIDO: Cambio 'eval' por 'evaluation'
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
  // 👥 GESTIÓN DE USUARIOS
  // ===============================================
  const createNewUser = async (e) => {
    e.preventDefault();
    
    try {
      console.log('👤 Creando nuevo usuario:', newUserForm);
      
      // Crear usuario en auth.users usando admin
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Crear perfil en profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newUserForm.email,
          full_name: newUserForm.full_name,
          phone: newUserForm.phone,
          role: newUserForm.role
        });

      if (profileError) throw profileError;

      // Resetear formulario
      setNewUserForm({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'padre'
      });
      setShowNewUserForm(false);
      
      // Refrescar datos
      await fetchAdminData(currentUser.id);
      alert('✅ Usuario creado exitosamente');
      
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      alert(`Error creando usuario: ${error.message}`);
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      
      await fetchAdminData(currentUser.id);
      alert('✅ Usuario actualizado exitosamente');
      
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      alert(`Error actualizando usuario: ${error.message}`);
    }
  };

  const deactivateUser = async (userId) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: false })
        .eq('id', userId);

      if (error) throw error;
      
      await fetchAdminData(currentUser.id);
      alert('✅ Usuario desactivado exitosamente');
      
    } catch (error) {
      console.error('❌ Error desactivando usuario:', error);
      alert(`Error desactivando usuario: ${error.message}`);
    }
  };

  // ===============================================
  // 🐕 GESTIÓN DE PERROS
  // ===============================================
  const createNewDog = async (e) => {
    e.preventDefault();
    
    try {
      console.log('🐕 Creando nuevo perro:', newDogForm);
      
      const { error } = await supabase
        .from('dogs')
        .insert({
          name: newDogForm.name,
          breed: newDogForm.breed,
          size: newDogForm.size,
          age: newDogForm.age ? parseInt(newDogForm.age) : null,
          weight: newDogForm.weight ? parseFloat(newDogForm.weight) : null,
          color: newDogForm.color,
          owner_id: newDogForm.owner_id,
          notes: newDogForm.notes
        });

      if (error) throw error;

      // Resetear formulario
      setNewDogForm({
        name: '',
        breed: '',
        size: 'mediano',
        age: '',
        weight: '',
        color: '',
        owner_id: '',
        notes: ''
      });
      setShowNewDogForm(false);
      
      // Refrescar datos
      await fetchAdminData(currentUser.id);
      alert('✅ Perro agregado exitosamente');
      
    } catch (error) {
      console.error('❌ Error creando perro:', error);
      alert(`Error creando perro: ${error.message}`);
    }
  };

  // ===============================================
  // 🎨 RENDERIZADO DE NAVEGACIÓN
  // ===============================================
  const renderNavigation = () => (
    <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentPage === 'dashboard'
                ? 'border-[#56CCF2] text-[#56CCF2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👑 Dashboard
          </button>
          <button
            onClick={() => setCurrentPage('usuarios')}
            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentPage === 'usuarios'
                ? 'border-[#56CCF2] text-[#56CCF2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👥 Usuarios
          </button>
          <button
            onClick={() => setCurrentPage('perros')}
            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentPage === 'perros'
                ? 'border-[#56CCF2] text-[#56CCF2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🐕 Perros
          </button>
          <button
            onClick={() => setCurrentPage('evaluaciones')}
            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentPage === 'evaluaciones'
                ? 'border-[#56CCF2] text-[#56CCF2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Evaluaciones
          </button>
          <button
            onClick={() => setCurrentPage('vehiculos')}
            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentPage === 'vehiculos'
                ? 'border-[#56CCF2] text-[#56CCF2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🚐 Vehículos
          </button>
          <button
            onClick={() => setCurrentPage('reportes')}
            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentPage === 'reportes'
                ? 'border-[#56CCF2] text-[#56CCF2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Reportes
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
              ¡Hola {currentUser?.full_name || 'Administrador'}! 👑
            </h1>
            <p className="text-lg opacity-90">
              Panel de control del Club Canino Dos Huellitas
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-2">🏢</div>
            <p className="text-sm opacity-80">Administración General</p>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
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
              <p className="text-sm font-medium text-gray-600">Total Perros</p>
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
                   size === 'gigante' ? '🐻 Gigantes' : size}
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
  // 👥 RENDERIZADO PÁGINA DE USUARIOS
  // ===============================================
  const renderUsersPage = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#2C3E50]">👥 Gestión de Usuarios</h2>
        <button
          onClick={() => setShowNewUserForm(true)}
          className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
        >
          ➕ Agregar Usuario
        </button>
      </div>

      {/* Formulario nuevo usuario */}
      {showNewUserForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">➕ Nuevo Usuario</h3>
            <button
              onClick={() => setShowNewUserForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={createNewUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                required
                minLength="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm({...newUserForm, full_name: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm({...newUserForm, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              >
                <option value="padre">👨‍👩‍👧‍👦 Padre</option>
                <option value="profesor">👨‍🏫 Profesor</option>
                <option value="conductor">🚐 Conductor</option>
                <option value="admin">👑 Administrador</option>
              </select>
            </div>
            
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ Crear Usuario
              </button>
              <button
                type="button"
                onClick={() => setShowNewUserForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'profesor' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'conductor' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'padre' ? '👨‍👩‍👧‍👦 Padre' : 
                       user.role === 'profesor' ? '👨‍🏫 Profesor' :
                       user.role === 'admin' ? '👑 Admin' : 
                       user.role === 'conductor' ? '🚐 Conductor' : user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.phone || 'Sin teléfono'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => setEditingUser(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      ✏️ Editar
                    </button>
                    {user.active && user.role !== 'admin' && (
                      <button 
                        onClick={() => deactivateUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        🚫 Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ===============================================
  // 🐕 RENDERIZADO PÁGINA DE PERROS
  // ===============================================
  const renderDogsPage = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#2C3E50]">🐕 Gestión de Perros</h2>
        <button
          onClick={() => setShowNewDogForm(true)}
          className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
        >
          ➕ Agregar Perro
        </button>
      </div>

      {/* Formulario nuevo perro */}
      {showNewDogForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">➕ Nuevo Perro</h3>
            <button
              onClick={() => setShowNewDogForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={createNewDog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Perro</label>
              <input
                type="text"
                value={newDogForm.name}
                onChange={(e) => setNewDogForm({...newDogForm, name: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dueño</label>
              <select
                value={newDogForm.owner_id}
                onChange={(e) => setNewDogForm({...newDogForm, owner_id: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              >
                <option value="">Seleccionar dueño</option>
                {allUsers.filter(u => u.role === 'padre' && u.active).map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raza</label>
              <input
                type="text"
                value={newDogForm.breed}
                onChange={(e) => setNewDogForm({...newDogForm, breed: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
              <select
                value={newDogForm.size}
                onChange={(e) => setNewDogForm({...newDogForm, size: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              >
                <option value="pequeño">🐕‍🦺 Pequeño</option>
                <option value="mediano">🐕 Mediano</option>
                <option value="grande">🐺 Grande</option>
                <option value="gigante">🐻 Gigante</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edad (años)</label>
              <input
                type="number"
                value={newDogForm.age}
                onChange={(e) => setNewDogForm({...newDogForm, age: e.target.value})}
                min="0"
                max="25"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input
                type="number"
                value={newDogForm.weight}
                onChange={(e) => setNewDogForm({...newDogForm, weight: e.target.value})}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                value={newDogForm.color}
                onChange={(e) => setNewDogForm({...newDogForm, color: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={newDogForm.notes}
                onChange={(e) => setNewDogForm({...newDogForm, notes: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
            
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ Agregar Perro
              </button>
              <button
                type="button"
                onClick={() => setShowNewDogForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de perros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dueño</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Características</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allDogs.map((dog) => (
                <tr key={dog.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#56CCF2] rounded-full flex items-center justify-center mr-3">
                        <span className="text-white">🐕</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{dog.name}</div>
                        <div className="text-sm text-gray-500">{dog.breed}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{dog.owner?.full_name}</div>
                    <div className="text-sm text-gray-500">{dog.owner?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{dog.size} • {dog.age ? `${dog.age} años` : 'Edad no especificada'}</div>
                    <div className="text-gray-500">{dog.weight ? `${dog.weight} kg` : ''} {dog.color}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dog.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {dog.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => setEditingDog(dog)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-900"
                    >
                      📋 Ver Evaluaciones
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ===============================================
  // 🎯 RENDERIZADO PRINCIPAL POR PÁGINA
  // ===============================================
  const renderPageContent = () => {
    switch (currentPage) {
      case 'usuarios':
        return renderUsersPage();
      
      case 'perros':
        return renderDogsPage();
      
      case 'evaluaciones':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">📋 Gestión de Evaluaciones</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600 text-center py-8">
                Vista de evaluaciones en desarrollo...
              </p>
            </div>
          </div>
        );
      
      case 'vehiculos':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">🚐 Gestión de Vehículos</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600 text-center py-8">
                Gestión de vehículos en desarrollo...
              </p>
            </div>
          </div>
        );
      
      case 'reportes':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">📊 Reportes y Estadísticas</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600 text-center py-8">
                Reportes avanzados en desarrollo...
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
            <span className="text-2xl">👑</span>
          </div>
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">Cargando Dashboard Admin</h2>
          <p className="text-gray-600">Accediendo a datos del sistema...</p>
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

export default AdminDashboard;