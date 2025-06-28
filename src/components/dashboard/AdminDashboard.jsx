// src/components/dashboard/AdminDashboard.jsx
// 🔐 DASHBOARD DE ADMINISTRACIÓN COMPLETO PARA CLUB CANINO
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import supabase from '../../lib/supabase.js';
import { UserModal, DogModal, EvaluationDetailModal } from './AdminModals.jsx';

// ============================================
// 🚀 COMPONENTE PRINCIPAL ADMIN DASHBOARD
// ============================================

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  
  // Estados principales
  const [currentPage, setCurrentPage] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDogs: 0,
    totalEvaluations: 0,
    activeUsers: 0
  });
  
  // Datos
  const [users, setUsers] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [systemHealth, setSystemHealth] = useState('good');

  // Estados modales
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDogModal, setShowDogModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDog, setSelectedDog] = useState(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  // ============================================
  // 🔄 EFECTOS DE INICIALIZACIÓN
  // ============================================

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      initializeAdminData();
    }
  }, [user, profile]);

  const initializeAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSystemStats(),
        fetchUsers(),
        fetchDogs(),
        fetchRecentEvaluations()
      ]);
    } catch (error) {
      console.error('❌ Error inicializando datos admin:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 📊 FUNCIONES DE DATOS
  // ============================================

  const fetchSystemStats = async () => {
    try {
      const [usersResult, dogsResult, evaluationsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('dogs').select('*', { count: 'exact' }),
        supabase.from('evaluations').select('*', { count: 'exact' })
      ]);

      const activeUsersResult = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('active', true);

      setStats({
        totalUsers: usersResult.count || 0,
        totalDogs: dogsResult.count || 0,
        totalEvaluations: evaluationsResult.count || 0,
        activeUsers: activeUsersResult.count || 0
      });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    }
  };

  const fetchDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          owner:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error('❌ Error fetching dogs:', error);
    }
  };

  const fetchRecentEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          dog:dogs(name),
          evaluator:profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setEvaluations(data || []);
    } catch (error) {
      console.error('❌ Error fetching evaluations:', error);
    }
  };

  // ============================================
  // 🔄 FUNCIONES DE GESTIÓN
  // ============================================

  const handleUserStatusToggle = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      await fetchUsers();
      await fetchSystemStats();
    } catch (error) {
      console.error('❌ Error toggling user status:', error);
    }
  };

  const handleUserEdit = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDogEdit = (dog) => {
    setSelectedDog(dog);
    setShowDogModal(true);
  };

  const handleEvaluationView = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setShowEvaluationModal(true);
  };

  // ============================================
  // 🎨 COMPONENTES DE UI
  // ============================================

  const NavigationBar = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-[#2C3E50]">
              ⚡ Panel de Administración
            </h1>
            
            {/* Navegación de páginas */}
            <nav className="hidden sm:flex space-x-4">
              {[
                { id: 'overview', label: '📊 Resumen', icon: '📊' },
                { id: 'users', label: '👥 Usuarios', icon: '👥' },
                { id: 'dogs', label: '🐕 Perros', icon: '🐕' },
                { id: 'evaluations', label: '📋 Evaluaciones', icon: '📋' },
                { id: 'reports', label: '📈 Reportes', icon: '📈' }
              ].map((page) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPage(page.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPage === page.id
                      ? 'bg-[#56CCF2] text-white shadow-md'
                      : 'text-gray-600 hover:text-[#56CCF2] hover:bg-gray-50'
                  }`}
                >
                  {page.label}
                </button>
              ))}
            </nav>
          </div>

          {/* User info */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {profile?.full_name || 'Admin'}
              </div>
              <div className="text-xs text-gray-500">
                Administrador del Sistema
              </div>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold">⚡</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const StatsCards = () => {
    const roleStats = {
      admin: users.filter(u => u.role === 'admin').length,
      profesor: users.filter(u => u.role === 'profesor').length,
      padre: users.filter(u => u.role === 'padre').length,
      conductor: users.filter(u => u.role === 'conductor').length
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { 
            title: 'Total Usuarios', 
            value: stats.totalUsers, 
            icon: '👥', 
            color: 'blue',
            subtitle: `${stats.activeUsers} activos`
          },
          { 
            title: 'Total Perros', 
            value: stats.totalDogs, 
            icon: '🐕', 
            color: 'green',
            subtitle: 'Registrados'
          },
          { 
            title: 'Por Roles', 
            value: `${roleStats.padre}P ${roleStats.profesor}Pr ${roleStats.conductor}C`, 
            icon: '🎭', 
            color: 'purple',
            subtitle: 'Padres/Profesores/Conductores'
          },
          { 
            title: 'Sistema', 
            value: systemHealth === 'good' ? 'Operativo' : 'Alerta', 
            icon: systemHealth === 'good' ? '✅' : '⚠️', 
            color: systemHealth === 'good' ? 'green' : 'red',
            subtitle: 'Estado general'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`text-3xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const UsersManagement = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">👥 Gestión de Usuarios</h3>
        <button
          onClick={() => setShowUserModal(true)}
          className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
        >
          ➕ Nuevo Usuario
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-600">
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'profesor' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'conductor' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'admin' ? '⚡ Admin' :
                     user.role === 'profesor' ? '🧑‍🏫 Profesor' :
                     user.role === 'conductor' ? '🚐 Conductor' :
                     '👤 Padre'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.active ? '✅ Activo' : '⏸️ Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUserEdit(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleUserStatusToggle(user.id, user.active)}
                      className={`${user.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {user.active ? '⏸️' : '▶️'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const DogsManagement = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">🐕 Gestión de Perros</h3>
        <button
          onClick={() => setShowDogModal(true)}
          className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
        >
          ➕ Nuevo Perro
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Perro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dueño
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Raza/Tamaño
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dogs.map((dog) => (
              <tr key={dog.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm">🐕</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{dog.name}</div>
                      <div className="text-sm text-gray-500">
                        {dog.age ? `${dog.age} años` : 'Edad no especificada'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {dog.owner?.full_name || 'Sin asignar'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {dog.owner?.email || ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{dog.breed || 'No especificada'}</div>
                  <div className="text-sm text-gray-500">{dog.size || 'Tamaño no especificado'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    dog.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {dog.active ? '✅ Activo' : '⏸️ Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDogEdit(dog)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      ✏️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const EvaluationsOverview = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">📋 Evaluaciones Recientes</h3>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {evaluations.map((evaluation) => (
            <div 
              key={evaluation.id} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleEvaluationView(evaluation)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">📊</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {evaluation.dog?.name || 'Perro desconocido'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Evaluado por {evaluation.evaluator?.full_name || 'Usuario'} • {evaluation.location}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-900">
                  {new Date(evaluation.date).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">
                  Energía: {evaluation.energy_level}/10 • Click para detalles
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================
  // 🎯 RENDERIZADO PRINCIPAL
  // ============================================

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚡</div>
          <div className="text-xl font-semibold text-[#2C3E50]">Cargando Panel de Administración...</div>
          <div className="mt-2 text-sm text-gray-600">Preparando datos del sistema</div>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">Esta página es solo para administradores del Club Canino</p>
          <a 
            href="/dashboard/padre" 
            className="bg-[#56CCF2] text-white py-3 px-6 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            🏠 Ir a Mi Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - siempre visibles */}
        <StatsCards />

        {/* Contenido por página */}
        {currentPage === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <EvaluationsOverview />
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Acciones Rápidas</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setCurrentPage('users')}
                    className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">👥</span>
                      <div>
                        <div className="font-medium">Gestionar Usuarios</div>
                        <div className="text-sm text-gray-600">Crear, editar y administrar usuarios</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setCurrentPage('dogs')}
                    className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🐕</span>
                      <div>
                        <div className="font-medium">Gestionar Perros</div>
                        <div className="text-sm text-gray-600">Administrar mascotas registradas</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setCurrentPage('reports')}
                    className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📈</span>
                      <div>
                        <div className="font-medium">Ver Reportes</div>
                        <div className="text-sm text-gray-600">Analytics y estadísticas</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'users' && (
          <div className="space-y-8">
            <UsersManagement />
          </div>
        )}

        {currentPage === 'dogs' && (
          <div className="space-y-8">
            <DogsManagement />
          </div>
        )}

        {currentPage === 'evaluations' && (
          <div className="space-y-8">
            <EvaluationsOverview />
          </div>
        )}

        {currentPage === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Reportes del Sistema</h3>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🚧</div>
              <div className="text-lg font-medium text-gray-600">Módulo de Reportes</div>
              <div className="text-sm text-gray-500 mt-2">En desarrollo - Próximamente disponible</div>
            </div>
          </div>
        )}
      </div>

      {/* Modales funcionales */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={() => {
          fetchUsers();
          fetchSystemStats();
        }}
      />

      <DogModal
        isOpen={showDogModal}
        onClose={() => {
          setShowDogModal(false);
          setSelectedDog(null);
        }}
        dog={selectedDog}
        users={users}
        onSave={() => {
          fetchDogs();
          fetchSystemStats();
        }}
      />
      <EvaluationDetailModal
        isOpen={showEvaluationModal}
        onClose={() => {
          setShowEvaluationModal(false);
          setSelectedEvaluation(null);
        }}
        evaluation={selectedEvaluation}
      />
    </div>
  );
}