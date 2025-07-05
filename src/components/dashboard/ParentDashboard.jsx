// src/components/dashboard/ParentDashboard.jsx
// 👨‍👩‍👧‍👦 DASHBOARD PARA PADRES - PROPS CORREGIDAS ✅

import { useState, useEffect } from 'react';
import supabase, { getDogAverages, getMultipleDogsAverages } from '../../lib/supabase.js';
import CompleteEvaluationForm from './CompleteEvaluationForm.jsx';
import DogProgressModal from './DogProgressModal.jsx';
import RoutineManager from '../routines/RoutineManager.jsx';
import VaccineManager from '../routines/VaccineManager.jsx';
import MedicineManager from '../routines/MedicineManager.jsx';
import GroomingManager from '../routines/GroomingManager.jsx';
import ParentManagementPanel from './ParentManagementPanel.jsx';
import { LogoutButton } from '../../utils/logoutHandler.jsx';
import NotificationSystem from '../notifications/NotificationSystem.jsx';
import NotificationManagerDashboard from '../notifications/NotificationManagerDashboard.jsx';
import { createTestNotification } from '../../utils/notificationHelper.js';
import RealPushNotifications from '../notifications/RealPushNotifications.jsx';
import NotificationControlPanel from '../notifications/NotificationManagerDashboard.jsx';
// 🆕 IMPORTACIONES PARA FUNCIONALIDADES DE PESO
import { useDogWeight } from '../../hooks/useDogWeight.js';
import WeightRegistrationModal from '../dogs/WeightRegistrationModal.jsx';
import EnhancedDogProfile from '../dogs/EnhancedDogProfile.jsx';

const ParentDashboard = ({ authUser, authProfile }) => {
  // ===============================================
  // 🎯 ESTADOS PRINCIPALES
  // ===============================================
  const [dogs, setDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [dogAverages, setDogAverages] = useState({});
  
  // Estados para modales y navegación
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedDogForProgress, setSelectedDogForProgress] = useState(null);
  const [selectedDogId, setSelectedDogId] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [GPSComponent, setGPSComponent] = useState(null);
  
  // Estado para sidebar móvil
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🆕 Estados para mejoras
  const [notifications, setNotifications] = useState([]);

  // 🆕 ESTADOS PARA FUNCIONALIDADES DE PESO
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedDogForWeight, setSelectedDogForWeight] = useState(null);
  const [showDogProfileModal, setShowDogProfileModal] = useState(false);
  const [selectedDogForProfile, setSelectedDogForProfile] = useState(null);

  // ===============================================
  // 🔄 EFECTOS DE INICIALIZACIÓN - CORREGIDO
  // ===============================================
  useEffect(() => {
    console.log('🔄 ParentDashboard useEffect iniciado');
    console.log('- authUser:', authUser ? 'Existe' : 'Null');
    console.log('- authProfile:', authProfile ? 'Existe' : 'Null');
    
    if (authUser && authProfile) {
      console.log('✅ Usando datos de auth recibidos como props');
      console.log('- User ID:', authUser.id);
      console.log('- Profile Role:', authProfile.role);
      setCurrentUser(authProfile);
      initializeDashboardWithUser(authUser.id);
    } else {
      console.log('⚠️ Datos de auth incompletos, intentando con authService...');
      initializeDashboardWithAuthService();
    }
  }, [authUser, authProfile]);

  // ===============================================
  // 🔔 EFECTOS DE NOTIFICACIONES Y REALTIME
  // ===============================================
  useEffect(() => {
    if (dogs.length === 0 || !currentUser?.id) return;

    const dogIds = dogs.map(dog => dog.id);
    
    console.log('🔔 Configurando notificaciones en tiempo real para perros:', dogIds);
    
    const channel = supabase
      .channel(`evaluations_${dogIds.join(',')}_updates`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'evaluations',
          filter: `dog_id=in.(${dogIds.join(',')})`
        },
        (payload) => {
          console.log('🔔 Nueva evaluación detectada:', payload.new);
          
          fetchRecentEvaluations(dogIds);
          
          if (payload.new.evaluator_id !== currentUser?.id) {
            showNotification('Nueva evaluación disponible', 'success');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dogs, currentUser?.id]);

  // ===============================================
  // 🚀 FUNCIONES DE INICIALIZACIÓN - CORREGIDAS
  // ===============================================
  const initializeDashboardWithAuthService = async () => {
    try {
      console.log('🔄 Inicializando con authService...');
      
      const { authService } = await import('../../lib/authService.js');
      
      if (!authService.isInitialized) {
        await authService.initialize();
      }
      
      if (!authService.isAuthenticated || !authService.user) {
        console.log('❌ Usuario no autenticado, redirigiendo...');
        if (typeof window !== 'undefined') {
          window.location.href = '/login/';
        }
        return;
      }
      
      console.log('✅ Auth service válido:', {
        userId: authService.user.id,
        email: authService.user.email,
        role: authService.profile?.role
      });
      
      setCurrentUser(authService.profile);
      await initializeDashboardWithUser(authService.user.id);
      
    } catch (error) {
      console.error('❌ Error inicializando dashboard:', error);
      setLoading(false);
    }
  };

  const initializeDashboardWithUser = async (userId) => {
    try {
      console.log('🚀 Inicializando dashboard para usuario:', userId);
      
      // Cargar perros PRIMERO
      await fetchUserDogs(userId);
      
      // Después cargar GPS component
      await loadGPSComponent();
      
    } catch (error) {
      console.error('❌ Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 📊 FUNCIONES DE CARGA DE DATOS - CORREGIDAS
  // ===============================================
  const fetchUserDogs = async (userId) => {
    try {
      console.log('🔍 Cargando perros para usuario:', userId);
      
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          profiles!dogs_owner_id_fkey(full_name, email, phone)
        `)
        .eq('owner_id', userId)
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('❌ Error consultando perros:', error);
        throw error;
      }

      console.log('✅ Perros cargados desde DB:', data?.length || 0);
      console.log('📋 Lista de perros:', data?.map(d => ({ id: d.id, name: d.name })));
      
      // ✅ IMPORTANTE: Actualizar estado inmediatamente
      setDogs(data || []);
      
      // Si hay perros, seleccionar el primero por defecto
      if (data && data.length > 0) {
        console.log('🎯 Seleccionando primer perro:', data[0].name);
        setSelectedDog(data[0]);
        
        const dogIds = data.map(dog => dog.id);
        console.log('🔢 Dog IDs para consultas adicionales:', dogIds);
        
        // Cargar evaluaciones y promedios EN PARALELO
        await Promise.all([
          fetchRecentEvaluations(dogIds),
          loadDogAverages(dogIds)
        ]);
      } else {
        console.log('⚠️ No se encontraron perros para este usuario');
      }

    } catch (error) {
      console.error('❌ Error en fetchUserDogs:', error);
      // No lanzar error, permitir que la app continúe
    }
  };

  // 🔧 FUNCIÓN AUXILIAR PARA CARGAR PROMEDIOS
  const loadDogAverages = async (dogIds) => {
    try {
      console.log('📊 Cargando promedios para perros...');
      const averagesData = await getMultipleDogsAverages(dogIds);
      console.log('📊 Averages data recibida:', Object.keys(averagesData).length, 'perros');
      setDogAverages(averagesData);
    } catch (error) {
      console.warn('⚠️ Error cargando promedios:', error);
    }
  };

  // 🔧 CORREGIDO: Query de evaluaciones arreglada
  const fetchRecentEvaluations = async (dogIds) => {
    try {
      console.log('🔍 Cargando evaluaciones para dogs:', dogIds);
      
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          dogs(id, name, breed, size),
          profiles!evaluations_evaluator_id_fkey(full_name, email, role)
        `)
        .in('dog_id', dogIds) // ✅ Usar .in() es correcto
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;

      console.log('✅ Evaluaciones cargadas:', data?.length || 0);
      setEvaluations(data || []);

    } catch (error) {
      console.error('❌ Error fetching evaluations:', error);
    }
  };

  const loadGPSComponent = async () => {
    try {
      const { default: ParentTrackingDashboard } = await import('../tracking/ParentTrackingDashboard.jsx');
      setGPSComponent(() => ParentTrackingDashboard);
    } catch (error) {
      console.warn('⚠️ GPS component not available:', error);
    }
  };

  // ===============================================
  // 🎯 EVENT HANDLERS - CORREGIDOS
  // ===============================================
  const handleSelectForEvaluation = () => {
    console.log('🎯 handleSelectForEvaluation llamado');
    console.log('- selectedDog:', selectedDog ? selectedDog.name : 'NULL');
    console.log('- dogs array length:', dogs.length);
    
    if (!selectedDog) {
      console.error('❌ No hay perro seleccionado para evaluar');
      
      // Si no hay selectedDog pero hay perros, usar el primero
      if (dogs.length > 0) {
        console.log('🔄 Usando primer perro disponible:', dogs[0].name);
        setSelectedDog(dogs[0]);
        setShowEvaluationForm(true);
      } else {
        alert('No hay perros disponibles para evaluar');
      }
      return;
    }
    
    console.log('✅ Abriendo formulario de evaluación para:', selectedDog.name);
    setShowEvaluationForm(true);
  };

  const handleProgressClick = (dog) => {
    console.log('📈 handleProgressClick llamado para:', dog?.name);
    
    if (!dog) {
      console.error('❌ No se pasó perro válido al handleProgressClick');
      return;
    }
    
    console.log('✅ Abriendo modal de progreso para:', dog.name);
    setSelectedDogForProgress(dog);
    setShowProgressModal(true);
  };

  // ===============================================
  // 🎛️ FUNCIONES DE MANEJO DE EVENTOS - CORREGIDAS
  // ===============================================
  const openEvaluationForm = (dog) => {
    if (!dog || !dog.id) {
      console.error('❌ Error: perro inválido para evaluación', dog);
      return;
    }
    
    console.log('✅ Abriendo evaluación para:', dog.name, dog.id);
    setSelectedDog(dog);
    setShowEvaluationForm(true);
  };

  // 🔧 CORREGIDA: Función de cierre alineada con TeacherDashboard
  const closeEvaluationForm = () => {
    console.log('✅ Cerrando formulario de evaluación');
    setShowEvaluationForm(false);
    setSelectedDog(null);
  };

  // 🔧 CORREGIDA: Función principal para cuando se envía una evaluación - alineada con TeacherDashboard
  const onEvaluationSubmitted = async (newEvaluation) => {
    console.log('✅ Nueva evaluación enviada:', newEvaluation);
    
    try {
      // Mostrar feedback inmediato
      showNotification('Evaluación guardada exitosamente', 'success');
      
      // 🔧 SOLUCIÓN 1: Refrescar evaluaciones desde BD en lugar de usar estado local
      if (dogs.length > 0) {
        const dogIds = dogs.map(dog => dog.id);
        console.log('🔄 Refrescando evaluaciones desde BD...');
        await fetchRecentEvaluations(dogIds);
      }
      
      // 🔧 SOLUCIÓN 2: Recalcular promedios con estructura correcta  
      if (newEvaluation.dog_id) {
        try {
          const updatedAveragesResult = await getDogAverages(newEvaluation.dog_id);
          if (updatedAveragesResult.data) {
            setDogAverages(prev => ({
              ...prev,
              [newEvaluation.dog_id]: updatedAveragesResult.data
            }));
          }
        } catch (error) {
          console.warn('⚠️ Error recalculando promedios:', error);
        }
      }
      
      // 🔧 SOLUCIÓN 3: Cerrar formulario
      closeEvaluationForm();
      
      // 🔧 SOLUCIÓN 4: Notificación de éxito
      console.log('✅ Dashboard actualizado con nueva evaluación');
      
    } catch (error) {
      console.error('❌ Error actualizando dashboard:', error);
      showNotification('Error actualizando datos', 'error');
    }
  };

  // 🔧 CORREGIDAS: Funciones para modal de progreso alineadas con TeacherDashboard
  const closeProgressModal = () => {
    console.log('📊 Cerrando modal de progreso');
    setShowProgressModal(false);
    setSelectedDogForProgress(null);
  };

  // ===============================================
  // 🔔 SISTEMA DE NOTIFICACIONES
  // ===============================================
  const showNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // ===============================================
  // 🔄 FUNCIÓN DE ACTUALIZACIÓN MANUAL
  // ===============================================
  const handleDataUpdated = async () => {
    if (!currentUser?.id) return;
    
    console.log('🔄 Actualizando datos manualmente...');
    setLoading(true);
    
    try {
      await fetchUserDogs(currentUser.id);
      showNotification('Datos actualizados correctamente', 'success');
    } catch (error) {
      console.error('❌ Error actualizando datos:', error);
      showNotification('Error actualizando datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🎨 COMPONENTE MEJORADO DE TARJETA DE PERRO
  // ===============================================
  const DogCard = ({ dog, averagesData }) => {
    console.log('🎨 Renderizando DogCard para:', dog.name);
    
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
        
        {/* Header de la tarjeta */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center text-xl">
                🐕
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2C3E50]">{dog.name}</h3>
                <p className="text-sm text-gray-600">{dog.breed} • {dog.size}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {dog.age ? `${dog.age} años` : 'Edad no registrada'}
              </div>
            </div>
          </div>
        </div>

        {/* Métricas de comportamiento */}
        {averagesData ? (
          <div className="grid grid-cols-2 gap-4 p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#56CCF2] mb-1">
                {averagesData.energy_percentage || '0'}%
              </div>
              <div className="text-xs text-gray-600">Energía</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#5B9BD5] mb-1">
                {averagesData.sociability_percentage || '0'}%
              </div>
              <div className="text-xs text-gray-600">Sociabilidad</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#C7EA46] mb-1">
                {averagesData.obedience_percentage || '0'}%
              </div>
              <div className="text-xs text-gray-600">Obediencia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#AB5729] mb-1">
                {averagesData.anxiety_percentage || '0'}%
              </div>
              <div className="text-xs text-gray-600">Ansiedad</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl mb-6">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-600 text-sm">Sin evaluaciones aún</p>
          </div>
        )}

        {/* Botones de acción - CON LOGS MEJORADOS */}
        <div className="grid grid-cols-2 gap-3 p-6 pt-0">
          <button
            onClick={() => {
              console.log('🎯 Click en botón Evaluar para:', dog.name);
              setSelectedDog(dog);
              handleSelectForEvaluation();
            }}
            className="w-full bg-[#56CCF2] text-white py-3 px-4 rounded-xl hover:bg-[#5B9BD5] transition-colors text-sm font-medium"
          >
            📝 Evaluar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('📈 Click en botón Progreso para:', dog.name);
              handleProgressClick(dog);
            }}
            className="w-full bg-[#C7EA46] text-[#2C3E50] py-3 px-4 rounded-xl hover:bg-[#FFFE8D] transition-colors text-sm font-medium"
          >
            📈 Progreso
          </button>
        </div>

        {/* Información adicional */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>📊 Registros: {averagesData?.total_evaluations || 0}</span>
            <span className="text-[#56CCF2] cursor-pointer">Toca para ver perfil →</span>
          </div>
        </div>
      </div>
    );
  };

  // ===============================================
  // 🎨 COMPONENTES DE UI
  // ===============================================
  
  // 🔔 Componente de notificaciones flotantes
  const NotificationToast = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`max-w-sm w-full p-4 rounded-lg shadow-lg border transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="ml-2 text-current opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // 🔧 MEJORA: Botón de refresh en el UI
  const RefreshButton = () => (
    <button
      onClick={handleDataUpdated}
      disabled={loading}
      className="flex items-center space-x-2 px-4 py-2 bg-[#56CCF2] text-white rounded-lg hover:bg-[#4AB8E0] transition-colors disabled:opacity-50"
    >
      <span className={`text-lg ${loading ? 'animate-spin' : ''}`}>🔄</span>
      <span>Actualizar</span>
    </button>
  );

  // Mobile Header
  const renderMobileHeader = () => (
    <div className="lg:hidden bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#2C3E50]">Club Canino</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <span className="text-2xl">☰</span>
        </button>
      </div>
      
      {mobileMenuOpen && (
        <div className="mt-4 space-y-2">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
            { key: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
            { key: 'rutinas', label: 'Rutinas', icon: '📅' },
            { key: 'salud', label: 'Salud', icon: '🏥' },
            { key: 'tracking', label: 'Tracking', icon: '📍' },
            { key: 'config', label: 'Configuración', icon: '⚙️' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => {
                setCurrentPage(item.key);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                currentPage === item.key
                  ? 'bg-[#56CCF2] text-white shadow-lg transform scale-105' 
                  : 'text-gray-700 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Desktop Sidebar
  const renderDesktopSidebar = () => (
    <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl border-r border-gray-200 z-40">
      {/* Logo del Club */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🐕</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2C3E50]">Club Canino</h2>
            <p className="text-xs text-gray-500">Dos Huellitas</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="p-4 space-y-2">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
          { key: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
          { key: 'rutinas', label: 'Rutinas', icon: '📅' },
          { key: 'salud', label: 'Salud', icon: '🏥' },
          { key: 'tracking', label: 'Tracking', icon: '📍' },
          { key: 'config', label: 'Configuración', icon: '⚙️' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setCurrentPage(item.key)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentPage === item.key ?
                'bg-[#56CCF2] text-white shadow-lg transform scale-105' 
                : 'text-gray-700 hover:bg-gray-100 hover:scale-102'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
              currentPage === item.key ?
                'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'
            }`}>
              <span className="text-lg">{item.icon}</span>
            </div>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Info del usuario */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-[#56CCF2] rounded-full flex items-center justify-center">
            <span className="text-white text-sm">👤</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{currentUser?.full_name}</p>
            <p className="text-xs text-gray-500">{currentUser?.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  );

  // 🆕 MEJORAR EL RENDER DE EVALUACIONES RECIENTES
  const renderEvaluationsRecentes = () => {
    if (evaluations.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay evaluaciones aún</h3>
          <p className="text-gray-600">Las evaluaciones aparecerán aquí una vez que se registren</p>
          <button
            onClick={() => handleDataUpdated()}
            className="mt-4 bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#4AB8E0] transition-colors"
          >
            🔄 Buscar Evaluaciones
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <span className="text-2xl">📋</span>
            <span>Evaluaciones Recientes</span>
          </h3>
          
          {/* Botón de refresh */}
          <button
            onClick={handleDataUpdated}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1 bg-[#56CCF2] text-white rounded-lg hover:bg-[#4AB8E0] transition-colors disabled:opacity-50 text-sm"
          >
            <span className={`${loading ? 'animate-spin' : ''}`}>🔄</span>
            <span>Actualizar</span>
          </button>
        </div>
        
        <div className="divide-y divide-gray-100">
          {evaluations.slice(0, 5).map((evaluation, index) => (
            <div key={`${evaluation.id}-${index}`} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center text-white font-bold">
                    {evaluation.dogs?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">
                      {evaluation.dogs?.name || 'Perro sin nombre'}
                    </span>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{evaluation.location === 'casa' ? '🏠 Casa' : '🏫 Colegio'}</span>
                      <span>•</span>
                      <span>{new Date(evaluation.date).toLocaleDateString('es-CO')}</span>
                      <span>•</span>
                      <span>{evaluation.profiles?.full_name || 'Evaluador'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Métricas rápidas */}
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                    E: {evaluation.energy_level || 0}/10
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                    S: {evaluation.sociability_level || 0}/10
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                    O: {evaluation.obedience_level || 0}/10
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                    A: {evaluation.anxiety_level || 0}/10
                  </span>
                </div>
              </div>
              
              {/* Mostrar notas si existen */}
              {evaluation.notes && (
                <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  "{evaluation.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Mostrar más evaluaciones */}
        {evaluations.length > 5 && (
          <div className="p-4 bg-gray-50 text-center">
            <button
              onClick={() => setCurrentPage('evaluaciones')}
              className="text-[#56CCF2] hover:text-[#4AB8E0] font-medium"
            >
              Ver todas las evaluaciones ({evaluations.length})
            </button>
          </div>
        )}
      </div>
    );
  };

  // ===============================================
  // 🎨 CONTENIDO PRINCIPAL CORREGIDO
  // ===============================================
  const renderDashboardContent = () => {
    // 🚨 CORREGIDO: Verificar loading ANTES que dogs.length
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="text-4xl">🐕</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Cargando...</h3>
            <p className="text-gray-600 mb-8">
              Obteniendo información de tus mascotas...
            </p>
          </div>
        </div>
      );
    }

    // 🔧 CORREGIDO: Solo mostrar "sin perros" si NO está loading Y dogs está vacío
    if (!loading && dogs.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🐕</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">¡Bienvenido al Club Canino!</h3>
            <p className="text-gray-600 mb-8">
              Parece que aún no tienes perros registrados. Contacta al administrador para agregar a tu mascota.
            </p>
            <button 
              onClick={() => window.location.href = 'mailto:clubcaninodoshuellitas@gmail.com'}
              className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
            >
              📧 Contactar Administrador
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 lg:space-y-8">
        {/* Header con bienvenida */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-2xl p-6 lg:p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                ¡Hola {currentUser?.full_name?.split(' ')[0] || 'Papá'}! 👋
              </h1>
              <p className="opacity-90 text-lg">
                Tienes {dogs.length} {dogs.length === 1 ? 'perro registrado' : 'perros registrados'} en el club
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-6xl lg:text-8xl opacity-20">🐕‍🦺</div>
            </div>
          </div>
        </div>

       {/* Grid de perros */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {dogs.map(dog => {
            const averagesData = dogAverages[dog.id];
            if (averagesData && !window.lastLoggedAverages?.[dog.id]) {
              console.log(`📊 Averages para ${dog.name}:`, averagesData);
              window.lastLoggedAverages = window.lastLoggedAverages || {};
              window.lastLoggedAverages[dog.id] = averagesData;
            }
            
            return <EnhancedDogCard key={dog.id} dog={dog} averagesData={averagesData} />;
          })}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col lg:flex-row gap-4">
          <button
            onClick={() => {
              // ✅ CORREGIDO: Seleccionar primer perro si no hay uno seleccionado
              if (!selectedDog && dogs.length > 0) {
                setSelectedDog(dogs[0]);
              }
              setShowEvaluationForm(true);
            }}
            className="flex-1 bg-[#56CCF2] text-white py-4 px-6 rounded-2xl hover:bg-[#5B9BD5] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
          >
            <span className="text-2xl mr-3">📝</span>
            <span className="font-semibold">Nueva Evaluación</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('rutinas')}
            className="flex-1 bg-[#C7EA46] text-[#2C3E50] py-4 px-6 rounded-2xl hover:bg-[#FFFE8D] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
          >
            <span className="text-2xl mr-3">📅</span>
            <span className="font-semibold">Gestionar Rutinas</span>
          </button>
        </div>

        {/* Últimas evaluaciones */}
        {renderEvaluationsRecentes()}
      </div>
    );
  };

  // ===============================================
  // 🆕 COMPONENTE TARJETA DE PERRO CON PESO
  // ===============================================
  const EnhancedDogCard = ({ dog, averagesData }) => {
    const {
      weightStats,
      weightHistory,
      loading: weightLoading,
      weightTrend,
      getWeightStatus,
      hasWeightHistory
    } = useDogWeight(dog.id);

    const formatWeight = (weight) => {
      if (!weight) return '--';
      return `${parseFloat(weight).toFixed(1)}kg`;
    };

    const weightStatus = getWeightStatus(dog.size);
    const lastWeightRecord = weightHistory?.[0];

    const handleWeightClick = (e) => {
      e.stopPropagation();
      setSelectedDogForWeight(dog);
      setShowWeightModal(true);
    };

    const handleProfileClick = () => {
      setSelectedDogForProfile(dog);
      setShowDogProfileModal(true);
    };

    return (
      <div 
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
        onClick={handleProfileClick}
      >
        <div className="p-6 lg:p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{dog.name}</h3>
              <p className="text-gray-600 font-medium">{dog.breed || 'Raza mixta'}</p>
              <div className="flex items-center space-x-3 mt-2">
                <span className="inline-block px-3 py-1 bg-[#56CCF2] bg-opacity-10 text-[#56CCF2] rounded-full text-sm font-medium">
                  {dog.size || 'Mediano'}
                </span>
                {dog.age && (
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    {dog.age} años
                  </span>
                )}
              </div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-2xl flex items-center justify-center text-2xl">
              {dog.photo_url ? (
                <img src={dog.photo_url} alt={dog.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                '🐕'
              )}
            </div>
          </div>

          {/* 🆕 SECCIÓN DE PESO */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center text-sm">
                <span className="mr-2">⚖️</span>
                Información de Peso
              </h4>
              <button
                onClick={handleWeightClick}
                className="text-[#56CCF2] hover:text-[#5B9BD5] text-xs font-medium flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span>➕</span>
                <span>Registrar</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Peso Actual */}
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Peso Actual</div>
                <div className="text-lg font-bold text-gray-900">
                  {weightLoading ? (
                    <div className="w-12 h-5 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  ) : (
                    formatWeight(weightStats?.current_weight || dog.weight)
                  )}
                </div>
                {weightStatus && (
                  <div className={`text-xs mt-1 ${
                    weightStatus.status === 'ideal' ? 'text-green-600' :
                    weightStatus.status === 'bajo' ? 'text-orange-600' :
                    weightStatus.status === 'alto' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {weightStatus.status === 'ideal' ? '✅ Ideal' :
                     weightStatus.status === 'bajo' ? '⚠️ Bajo' :
                     weightStatus.status === 'alto' ? '🚨 Alto' : '❓ S/D'}
                  </div>
                )}
              </div>

              {/* Último Registro */}
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Último Registro</div>
                {lastWeightRecord ? (
                  <>
                    <div className="text-lg font-bold text-gray-900">
                      {formatWeight(lastWeightRecord.weight)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(lastWeightRecord.date_recorded).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </div>
                    {lastWeightRecord.weight_difference && (
                      <div className={`text-xs font-medium ${
                        lastWeightRecord.weight_difference > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {lastWeightRecord.weight_difference > 0 ? '↗️' : '↘️'} 
                        {Math.abs(lastWeightRecord.weight_difference).toFixed(1)}kg
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-lg text-gray-400">--</div>
                    <div className="text-xs text-gray-400">Sin datos</div>
                  </>
                )}
              </div>
            </div>

            {/* Tendencia */}
            {weightTrend && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm">{weightTrend.icon}</span>
                  <span className={`text-xs font-medium ${weightTrend.color}`}>
                    {weightTrend.direction === 'subiendo' ? 'Subiendo' :
                     weightTrend.direction === 'bajando' ? 'Bajando' : 'Estable'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Métricas de comportamiento (CÓDIGO ORIGINAL CORREGIDO) */}
          {averagesData ? (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-[#56CCF2] mb-1">
                  {averagesData.energy_percentage || '0'}%
                </div>
                <div className="text-xs text-gray-600">Energía</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-[#5B9BD5] mb-1">
                  {averagesData.sociability_percentage || '0'}%
                </div>
                <div className="text-xs text-gray-600">Sociabilidad</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-[#C7EA46] mb-1">
                  {averagesData.obedience_percentage || '0'}%
                </div>
                <div className="text-xs text-gray-600">Obediencia</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-[#AB5729] mb-1">
                  {averagesData.anxiety_percentage || '0'}%
                </div>
                <div className="text-xs text-gray-600">Ansiedad</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl mb-6">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-600 text-sm">Sin evaluaciones aún</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('🎯 Click en botón Evaluar para:', dog.name);
                setSelectedDog(dog);
                setShowEvaluationForm(true);  // ✅ CORREGIDO: ABRE EL MODAL
              }}
              className="w-full bg-[#56CCF2] text-white py-3 px-4 rounded-xl hover:bg-[#5B9BD5] transition-colors text-sm font-medium"
            >
              📝 Evaluar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('📈 Click en botón Progreso para:', dog.name);
                setSelectedDogForProgress(dog);
                setShowProgressModal(true);
              }}
              className="w-full bg-[#C7EA46] text-[#2C3E50] py-3 px-4 rounded-xl hover:bg-[#FFFE8D] transition-colors text-sm font-medium"
            >
              📈 Progreso
            </button>
          </div>

          {/* Información adicional de peso */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>📊 Registros: {weightStats?.total_records || 0}</span>
            <span className="text-[#56CCF2]">Toca para ver perfil →</span>
          </div>
        </div>
      </div>
    );
  };

  // ===============================================
  // 🧪 FUNCIÓN DE PRUEBA PARA NOTIFICACIONES
  // ===============================================
  const testNotificationSystem = async (userId, dogId) => {
    if (!userId || !dogId) {
      console.log('❌ No hay userId o dogId para probar notificaciones');
      return;
    }

    console.log('🧪 Probando sistema de notificaciones...');
    
    const testNotifications = [
      {
        type: 'behavior_alert',
        title: '🚨 Comportamiento Detectado',
        message: `Max mostró ansiedad alta hoy. Recomendamos ejercicio mental antes de salir.`,
        priority: 'high'
      },
      {
        type: 'routine_reminder', 
        title: '⏰ Recordatorio de Rutina',
        message: `Hora del paseo de Max - 20 minutos de ejercicio recomendado`,
        priority: 'medium'
      },
      {
        type: 'tip',
        title: '💡 Tip del Día',
        message: `¿Sabías que? Los perros necesitan rutina para ser felices y equilibrados`,
        priority: 'low'
      }
    ];

    for (const notif of testNotifications) {
      await createTestNotification(userId, dogId, notif);
      // Esperar 1 segundo entre notificaciones
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Notificaciones de prueba enviadas');
  };

  // ===============================================
  // 🔔 COMPONENTE SIMPLE DE LISTA DE NOTIFICACIONES
  // ===============================================
  const NotificationListSimple = ({ userId }) => {
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!userId) return;

      const fetchRecentNotifications = async () => {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

          if (error) throw error;
          setRecentNotifications(data || []);
        } catch (err) {
          console.error('Error cargando notificaciones:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchRecentNotifications();
    }, [userId]);

    if (loading) {
      return <div className="text-center py-4">Cargando notificaciones...</div>;
    }

    return (
      <div className="space-y-3">
        {recentNotifications.length > 0 ? (
          recentNotifications.map(notif => (
            <div key={notif.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                notif.priority === 'high' ? 'bg-red-500' :
                notif.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <div className="font-medium text-sm">{notif.title}</div>
                <div className="text-gray-600 text-xs">{notif.message}</div>
                <div className="text-gray-400 text-xs mt-1">
                  {new Date(notif.created_at).toLocaleString('es-ES')}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>No hay notificaciones recientes</p>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">🧪 Prueba Rápida del Sistema</h4>
          <button
            onClick={() => testNotificationSystem(currentUser?.id, dogs[0]?.id)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Probar Notificaciones Automáticas
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mt-3">
          Estos botones crean notificaciones reales que aparecerán en tu dashboard
        </p>
        
        {dogs.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">
              ⚠️ Necesitas tener al menos un perro registrado para probar las notificaciones
            </p>
          </div>
        )}
      </div>
    );
  };

  // ===============================================
  // 🎯 RENDERIZADO DE PÁGINAS
  // ===============================================
  const renderPageContent = () => {
    const contentClasses = "flex-1 lg:ml-64 min-h-screen bg-gray-50";
    const innerClasses = "p-4 lg:p-8 max-w-7xl mx-auto";

    switch (currentPage) {
      case 'rutinas':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <RoutineManager 
                currentUser={currentUser} 
                dogs={dogs}
                loading={loading}
              />
            </div>
          </div>
        );
      
      case 'salud':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <VaccineManager 
                  currentUser={currentUser}
                  dogs={dogs}
                  loading={loading}
                />
                <MedicineManager 
                  currentUser={currentUser}
                  dogs={dogs}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        );
      
      case 'tracking':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              {GPSComponent && selectedDog ? (
                <GPSComponent 
                  dogId={selectedDog.id}
                  dogs={dogs}
                />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <div className="text-4xl mb-4">📍</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Tracking GPS</h3>
                  <p className="text-gray-600">
                    {!selectedDog 
                      ? 'Selecciona un perro para ver su ubicación en tiempo real'
                      : 'Cargando componente de tracking...'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'config':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <ParentManagementPanel 
                currentUser={currentUser}
                dogs={dogs}
                onDataUpdated={handleDataUpdated}
              />
            </div>
          </div>
        );

      case 'notificaciones':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              
              {/* 🔔 SISTEMA PRINCIPAL */}
              <NotificationSystem 
                userId={currentUser?.id}
                dogs={dogs}
              />
              
              {/* 🔔 NOTIFICACIONES AUTOMÁTICAS RECIENTES */}
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  🔔 Notificaciones Automáticas Recientes
                </h3>
                <NotificationListSimple userId={currentUser?.id} />
              </div>
              
              {/* 🧪 PRUEBA RÁPIDA DEL SISTEMA */}
              <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">🧪 Prueba Rápida del Sistema</h4>
                <button
                  onClick={() => testNotificationSystem(currentUser?.id, dogs[0]?.id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Probar Notificaciones Automáticas
                </button>
              </div>

              {/* 🎛️ DASHBOARD DE GESTIÓN COMPLETO (YA EXISTE) */}
              <div className="mt-8">
                <NotificationManagerDashboard
                  userId={currentUser?.id}
                  dogs={dogs}
                  isAdmin={false}
                />
              </div>

              {/* 📱 NOTIFICACIONES PUSH REALES */}
              <RealPushNotifications 
                userId={currentUser?.id}
                userRole={currentUser?.role}
                dogs={dogs}
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
            <span className="text-4xl">🐕</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Cargando tu dashboard...</h3>
          <p className="text-gray-600 mb-8">
            Preparando el perfil de tu mascota
          </p>
          <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
            <div className="bg-[#56CCF2] h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header móvil y sidebar */}
      {renderMobileHeader()}
      {renderDesktopSidebar()}

      {/* Contenido principal */}
      {renderPageContent()}

      {/* 🆕 MODAL DE REGISTRO DE PESO */}
      {showWeightModal && selectedDogForWeight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <WeightRegistrationModal
              isOpen={showWeightModal}
              onClose={() => {
                setShowWeightModal(false);
                setSelectedDogForWeight(null);
              }}
              onSubmit={async (weightData) => {
                console.log('Peso registrado para:', selectedDogForWeight.name, weightData);
                setShowWeightModal(false);
                setSelectedDogForWeight(null);
                await handleDataUpdated();
              }}
              dogName={selectedDogForWeight.name}
              currentWeight={selectedDogForWeight.weight}
            />
          </div>
        </div>
      )}

      {/* 🆕 MODAL DE PERFIL COMPLETO */}
      {showDogProfileModal && selectedDogForProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Perfil Completo - {selectedDogForProfile.name}
              </h2>
              <button
                onClick={() => {
                  setShowDogProfileModal(false);
                  setSelectedDogForProfile(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl text-gray-500">✕</span>
              </button>
            </div>
            
            <EnhancedDogProfile
              dog={selectedDogForProfile}
              onUpdate={async () => {
                console.log('Perfil actualizado para:', selectedDogForProfile.name);
                await handleDataUpdated();
              }}
              userRole="padre"
            />
          </div>
        </div>
      )}

      {/* 🔧 MODALES CORREGIDOS - PROBLEMA #1 Y #2 SOLUCIONADOS */}
      {showEvaluationForm && selectedDog && selectedDog.id && (
        <CompleteEvaluationForm
          dogId={selectedDog.id}                 // ✅ CORREGIDO: dogId en lugar de dog
          userId={currentUser?.id}               // ✅ CORREGIDO: userId en lugar de currentUser
          userRole={currentUser?.role}           // ✅ CORREGIDO: userRole extraído del currentUser
          onClose={closeEvaluationForm}          // ✅ CORREGIDO: función de cierre correcta
          onSave={onEvaluationSubmitted}         // ✅ CORREGIDO: onSave en lugar de onEvaluationSaved
        />
      )}

      {showProgressModal && selectedDogForProgress && (
        <DogProgressModal
          dog={selectedDogForProgress}           // ✅ CORRECTO: mantiene dog object
          onClose={closeProgressModal}          // ✅ CORREGIDO: función de cierre correcta
          isOpen={showProgressModal}            // ✅ CORREGIDO: PROP ISOPEN AGREGADA - PROBLEMA #2 SOLUCIONADO
        />
      )}

      {/* NotificationToast para feedback */}
      <NotificationToast />
    </div>
  );
};

export default ParentDashboard;