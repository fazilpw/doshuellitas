// src/components/dashboard/TeacherDashboard.jsx
// 🧑‍🏫 DASHBOARD PROFESOR COMPLETO - TODOS LOS PROBLEMAS CORREGIDOS ✅

import { useState, useEffect } from 'react';
import supabase, { getDogAverages, getMultipleDogsAverages } from '../../lib/supabase.js';
import CompleteEvaluationForm from './CompleteEvaluationForm.jsx';
import DogProgressModal from './DogProgressModal.jsx';
import VaccineManager from '../routines/VaccineManager.jsx';
import MedicineManager from '../routines/MedicineManager.jsx';
import GroomingManager from '../routines/GroomingManager.jsx';
import RoutineManager from '../routines/RoutineManager.jsx';
import TeacherMedicalView from '../teacher/TeacherMedicalView.jsx';


const TeacherDashboard = ({ authUser, authProfile }) => {
  // ===============================================
  // 🎯 ESTADOS PRINCIPALES
  // ===============================================
  const [dogs, setDogs] = useState([]); // TODOS los perros del club
  const [selectedDog, setSelectedDog] = useState(null);
  const [evaluations, setEvaluations] = useState([]); // Evaluaciones del profesor
  const [loading, setLoading] = useState(true);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [dogAverages, setDogAverages] = useState({});
  
  // Estados para navegación y modales
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedDogForProgress, setSelectedDogForProgress] = useState(null);
  const [selectedDogId, setSelectedDogId] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Estados para funcionalidades médicas y administrativas
  const [vaccines, setVaccines] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [medicalAlerts, setMedicalAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayEvaluations: 0,
    activeAlerts: 0
  });

  // Estado para sidebar móvil
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ===============================================
  // 🔄 EFECTOS DE INICIALIZACIÓN
  // ===============================================
  useEffect(() => {
    if (authUser && authProfile) {
      console.log('✅ Profesor usando datos de auth recibidos como props');
      setCurrentUser(authProfile);
      initializeDashboardWithUser(authUser.id);
    } else {
      initializeDashboardWithAuthService();
    }
  }, [authUser, authProfile]);

  // ===============================================
  // 🚀 FUNCIONES DE INICIALIZACIÓN
  // ===============================================
  const initializeDashboardWithAuthService = async () => {
    try {
      console.log('🔄 Profesor inicializando con authService...');
      
      const { authService } = await import('../../lib/authService.js');
      
      if (!authService.isInitialized) {
        await authService.initialize();
      }
      
      if (!authService.isAuthenticated) {
        console.log('❌ Profesor no autenticado, redirigiendo...');
        if (typeof window !== 'undefined') {
          window.location.href = '/login/';
        }
        return;
      }
      
      setCurrentUser(authService.profile);
      await initializeDashboardWithUser(authService.user.id);
      
    } catch (error) {
      console.error('❌ Error inicializando dashboard profesor:', error);
      setLoading(false);
    }
  };

  const initializeDashboardWithUser = async (userId) => {
    try {
      await Promise.all([
        fetchAllDogs(),
        fetchTeacherEvaluations(userId),
        fetchTeacherData(userId)
      ]);
    } catch (error) {
      console.error('❌ Error cargando datos del dashboard profesor:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 📊 FUNCIONES DE CARGA DE DATOS
  // ===============================================
  const fetchAllDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          profiles!dogs_owner_id_fkey(full_name, email, phone)
        `)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      console.log('✅ Perros del club cargados:', data?.length || 0);
      setDogs(data || []);
      setStats(prev => ({ ...prev, totalStudents: data?.length || 0 }));

      // 🔧 CORREGIDO: Cargar promedios para todos los perros
      if (data && data.length > 0) {
        const dogIds = data.map(dog => dog.id);
        console.log('📊 Cargando promedios para todos los perros...');
        
        try {
          const averagesData = await getMultipleDogsAverages(dogIds);
          console.log('📊 Averages data para profesor:', averagesData);
          setDogAverages(averagesData);
        } catch (avgError) {
          console.warn('⚠️ Error cargando promedios:', avgError);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching all dogs:', error);
    }
  };

  const fetchTeacherEvaluations = async (userId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          dogs(id, name, breed, size, profiles!dogs_owner_id_fkey(full_name)),
          profiles!evaluations_evaluator_id_fkey(full_name, email, role)
        `)
        .eq('evaluator_id', userId)
        .eq('location', 'colegio') // Solo evaluaciones del colegio
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;

      console.log('✅ Evaluaciones del profesor cargadas:', data?.length || 0);
      setEvaluations(data || []);

      // Contar evaluaciones de hoy
      const todayEvals = data?.filter(evaluation => evaluation.date === today) || [];
      setStats(prev => ({ ...prev, todayEvaluations: todayEvals.length }));

    } catch (error) {
      console.error('❌ Error fetching teacher evaluations:', error);
    }
  };

  const fetchTeacherData = async (userId) => {
    try {
      // 1. Obtener vacunas próximas (READ-ONLY para profesor)
      const { data: vaccinesData, error: vaccinesError } = await supabase
        .from('dog_vaccines')
        .select(`
          *,
          dogs!inner(name, profiles!inner(full_name))
        `)
        .gte('next_due_date', new Date().toISOString().split('T')[0])
        .order('next_due_date')
        .limit(10);

      if (vaccinesError) {
        console.error('❌ Error fetching vaccines:', vaccinesError);
      } else {
        console.log('✅ Vacunas próximas encontradas:', vaccinesData?.length || 0);
        setVaccines(vaccinesData || []);
      }

      // 2. Obtener rutinas activas (READ-ONLY para profesor)
      const { data: routinesData, error: routinesError } = await supabase
        .from('dog_routines')
        .select(`
          *,
          dogs!inner(name, profiles!inner(full_name)),
          routine_schedules!inner(name, time, days_of_week)
        `)
        .eq('active', true)
        .order('created_at');

      if (routinesError) {
        console.error('❌ Error fetching routines:', routinesError);
      } else {
        console.log('✅ Rutinas activas encontradas:', routinesData?.length || 0);
        setRoutines(routinesData || []);
      }

      // 3. Obtener alertas médicas activas
      const { data: alertsData, error: alertsError } = await supabase
        .from('medical_alerts')
        .select(`
          *,
          dogs!inner(name, profiles!inner(full_name))
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (alertsError) {
        console.error('❌ Error fetching medical alerts:', alertsError);
      } else {
        console.log('✅ Alertas médicas encontradas:', alertsData?.length || 0);
        setMedicalAlerts(alertsData || []);
        setStats(prev => ({ ...prev, activeAlerts: alertsData?.length || 0 }));
      }

    } catch (error) {
      console.error('❌ Error fetching teacher data:', error);
    }
  };

  // ===============================================
  // 🎛️ FUNCIONES DE MANEJO DE EVENTOS
  // ===============================================
  const openEvaluationForm = (dog) => {
    if (!dog || !dog.id) {
      console.error('❌ Error: perro inválido para evaluación', dog);
      return;
    }
    
    console.log('✅ Profesor abriendo evaluación para:', dog.name, dog.id);
    setSelectedDog(dog);
    setShowEvaluationForm(true);
  };

  const closeEvaluationForm = () => {
    console.log('✅ Profesor cerrando formulario de evaluación');
    setShowEvaluationForm(false);
    setSelectedDog(null);
  };

  // 🔧 CORREGIDO: Función que recalcula promedios correctamente
  const onEvaluationSubmitted = async (newEvaluation) => {
    console.log('✅ Nueva evaluación del profesor enviada:', newEvaluation);
    
    // Actualizar lista de evaluaciones
    setEvaluations(prev => [newEvaluation, ...prev]);
    
    // 🔧 CORREGIDO: Recalcular promedios con estructura correcta
    if (newEvaluation.dog_id) {
      try {
        console.log('📊 Recalculando promedios para:', newEvaluation.dog_id);
        const updatedAveragesResult = await getDogAverages(newEvaluation.dog_id);
        
        if (updatedAveragesResult.data) {
          console.log('📊 Nuevos promedios:', updatedAveragesResult.data);
          setDogAverages(prev => ({
            ...prev,
            [newEvaluation.dog_id]: updatedAveragesResult.data // ← .data es importante
          }));
          console.log('📊 Estado dogAverages actualizado para profesor');
        }
      } catch (error) {
        console.warn('⚠️ Error recalculando promedios:', error);
      }
    }
    
    closeEvaluationForm();
  };

  const openProgressModal = (dog) => {
    console.log('📊 Profesor abriendo modal de progreso para:', dog.name);
    setSelectedDogForProgress(dog);
    setShowProgressModal(true);
  };

  const closeProgressModal = () => {
    console.log('📊 Profesor cerrando modal de progreso');
    setShowProgressModal(false);
    setSelectedDogForProgress(null);
  };

  const handleDataUpdated = async () => {
    console.log('🔄 Profesor refrescando datos...');
    setLoading(true);
    if (currentUser?.id) {
      await fetchTeacherData(currentUser.id);
      await fetchAllDogs();
    }
    setLoading(false);
  };

// 🆕 AGREGAR AQUÍ DESPUÉS DE handleDataUpdated:
  const testMedicalNotifications = async () => {
    try {
      if (!selectedDog?.id || !currentUser?.id) {
        alert('❌ Selecciona un perro y asegúrate de estar logueado');
        return;
      }

      console.log('🧪 Probando notificaciones médicas...');

      const { NotificationHelper } = await import('../../utils/notificationHelper.js');
      
      // Probar notificación de vacuna
      const vaccineResult = await NotificationHelper.notifyMedicalUpdate(
        selectedDog.id,
        'vaccine',
        {
          dogName: selectedDog.name,
          vaccineName: 'Rabia (PRUEBA)',
          dueDate: '15/03/2025',
          description: 'Vacuna de prueba del sistema'
        },
        currentUser.id
      );

      // Probar notificación de medicina
      const medicineResult = await NotificationHelper.notifyMedicalUpdate(
        selectedDog.id,
        'medicine',
        {
          dogName: selectedDog.name,
          medicineName: 'Antibiótico (PRUEBA)',
          dosage: '250mg',
          frequency: '12 horas',
          description: 'Medicina de prueba del sistema'
        },
        currentUser.id
      );

      // Probar notificación de grooming
      const groomingResult = await NotificationHelper.notifyMedicalUpdate(
        selectedDog.id,
        'grooming',
        {
          dogName: selectedDog.name,
          appointmentDate: '20/03/2025',
          groomingType: 'bath',
          location: 'casa',
          description: 'Sesión de grooming de prueba'
        },
        currentUser.id
      );

      console.log('✅ Pruebas completadas:', { vaccineResult, medicineResult, groomingResult });
      
      const totalNotifications = (vaccineResult.notifications?.length || 0) + 
                                (medicineResult.notifications?.length || 0) +
                                (groomingResult.notifications?.length || 0);
      
      alert(`✅ Prueba completada!\n${totalNotifications} notificaciones médicas enviadas`);

    } catch (error) {
      console.error('❌ Error en prueba médica:', error);
      alert('❌ Error: ' + error.message);
    }
  };


  const handleLogout = async () => {
    try {
      console.log('🚪 Profesor cerrando sesión...');
      const { authService } = await import('../../lib/authService.js');
      const result = await authService.signOut();
      
      if (result.success) {
        console.log('✅ Sesión cerrada correctamente');
        window.location.href = '/login/';
      } else {
        console.error('❌ Error cerrando sesión:', result.error);
      }
    } catch (error) {
      console.error('❌ Error durante logout profesor:', error);
    }
  };

  // ===============================================
  // 🎨 COMPONENTES DE RENDERIZADO
  // ===============================================

  // Mobile Header
  const renderMobileHeader = () => (
    <div className="lg:hidden bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#2C3E50]">Dashboard Profesor</h1>
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
            { key: 'dashboard', label: 'Dashboard', icon: '👨‍🏫' },
  { key: 'evaluaciones', label: 'Evaluaciones', icon: '📋' },
  { key: 'rutinas', label: 'Rutinas', icon: '📅' },
  { key: 'medico', label: 'Centro Médico', icon: '🏥' },  // ← AGREGAR ESTA LÍNEA
  { key: 'salud', label: 'Salud', icon: '🏥' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => {
                setCurrentPage(item.key);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                currentPage === item.key
                  ? 'bg-[#C7EA46] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
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
    <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-30">
      {/* Header del sidebar */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#C7EA46] to-[#56CCF2] rounded-full flex items-center justify-center">
            <span className="text-white text-lg">👨‍🏫</span>
          </div>
          <div>
            <h2 className="font-bold text-[#2C3E50]">Club Canino</h2>
            <p className="text-sm text-gray-600">Dashboard Profesor</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="p-3 space-y-2">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: '👨‍🏫' },
  { key: 'evaluaciones', label: 'Evaluaciones', icon: '📋' },
  { key: 'rutinas', label: 'Rutinas', icon: '📅' },
  { key: 'medico', label: 'Centro Médico', icon: '🏥' },  // ← AGREGAR ESTA LÍNEA
  { key: 'salud', label: 'Salud', icon: '🏥' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setCurrentPage(item.key)}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group ${
              currentPage === item.key
                ? 'bg-[#C7EA46] text-white shadow-lg transform scale-105' 
                : 'text-gray-700 hover:bg-gray-100 hover:scale-102'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
              currentPage === item.key ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'
            }`}>
              <span className="text-lg">{item.icon}</span>
            </div>
            <span className="font-medium">{item.label}</span>
            {currentPage === item.key && (
              <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Footer del sidebar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 group-hover:bg-red-200">
            <span className="text-lg">🚪</span>
          </div>
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  // ===============================================
  // 🎨 CONTENIDO PRINCIPAL
  // ===============================================
  const renderDashboardContent = () => (
    <div className="space-y-6 lg:space-y-8">
      {/* Header con bienvenida */}
      <div className="bg-gradient-to-r from-[#C7EA46] to-[#56CCF2] rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              ¡Hola {currentUser?.full_name?.split(' ')[0] || 'Profesor'}! 👨‍🏫
            </h1>
            <p className="opacity-90 text-lg">
              Tienes {stats.totalStudents} estudiantes en el club
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.todayEvaluations}</div>
              <div className="text-sm opacity-75">Evaluaciones hoy</div>
            </div>
            <div className="text-6xl lg:text-8xl opacity-20">📚</div>
          </div>
        </div>
      </div>

      {/* Grid de Estudiantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {dogs.map(dog => {
          // 🔧 CORREGIDO: Estructura correcta de dogAverages
          const averagesData = dogAverages[dog.id];
if (averagesData && !window.lastLoggedAverages?.[dog.id]) {
  console.log(`📊 Averages para ${dog.name}:`, averagesData);
  window.lastLoggedAverages = window.lastLoggedAverages || {};
  window.lastLoggedAverages[dog.id] = averagesData;
}          
          return (
            <div key={dog.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="p-6 lg:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{dog.name}</h3>
                    <p className="text-gray-600 font-medium">{dog.breed}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="inline-block px-3 py-1 bg-gradient-to-r from-[#C7EA46] to-[#56CCF2] bg-opacity-10 text-gray-700 rounded-full text-sm font-medium">
                        {dog.size}
                      </span>
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        {dog.profiles?.full_name?.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#C7EA46] to-[#56CCF2] rounded-2xl flex items-center justify-center text-2xl">
                    🐕
                  </div>
                </div>

                {/* 🔧 CORREGIDO: Métricas con estructura correcta */}
                {averagesData ? (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((averagesData.energy_percentage || 0) / 10) || '-'}
                      </div>
                      <div className="text-xs text-blue-500 font-medium">Energía</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((averagesData.sociability_percentage || 0) / 10) || '-'}
                      </div>
                      <div className="text-xs text-green-500 font-medium">Social</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round((averagesData.obedience_percentage || 0) / 10) || '-'}
                      </div>
                      <div className="text-xs text-purple-500 font-medium">Obediencia</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-xl">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round((averagesData.anxiety_percentage || 0) / 10) || '-'}
                      </div>
                      <div className="text-xs text-orange-500 font-medium">Ansiedad</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-400">-</div>
                      <div className="text-xs text-gray-400 font-medium">Energía</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-400">-</div>
                      <div className="text-xs text-gray-400 font-medium">Social</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-400">-</div>
                      <div className="text-xs text-gray-400 font-medium">Obediencia</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-400">-</div>
                      <div className="text-xs text-gray-400 font-medium">Ansiedad</div>
                    </div>
                  </div>
                )}

                {/* Acciones del Profesor */}
                <div className="space-y-3">
                  <button
                    onClick={() => openEvaluationForm(dog)}
                    className="w-full bg-gradient-to-r from-[#C7EA46] to-[#56CCF2] text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center space-x-2"
                  >
                    <span className="text-lg">📝</span>
                    <span>Evaluar en Colegio</span>
                  </button>
                  <button
                    onClick={() => openProgressModal(dog)}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span className="text-lg">📊</span>
                    <span>Ver Progreso</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Evaluaciones Recientes */}
      {evaluations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <span className="text-2xl">📋</span>
              <span>Mis Evaluaciones Recientes</span>
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {evaluations.slice(0, 5).map(evaluation => (
              <div key={evaluation.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#C7EA46] to-[#56CCF2] rounded-full flex items-center justify-center text-white font-bold">
                      {evaluation.dogs?.name?.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{evaluation.dogs?.name}</span>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>🏫 Colegio</span>
                        <span>•</span>
                        <span>{new Date(evaluation.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      E: {evaluation.energy_level}/10
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                      S: {evaluation.sociability_level}/10
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                      O: {evaluation.obedience_level}/10
                    </span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                      A: {evaluation.anxiety_level}/10
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ===============================================
  // 🎯 RENDERIZADO DE PÁGINAS
  // ===============================================
  const renderPageContent = () => {
    const contentClasses = "flex-1 lg:ml-64 min-h-screen bg-gray-50";
    const innerClasses = "p-4 lg:p-8 max-w-7xl mx-auto";

    switch (currentPage) {
      case 'evaluaciones':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <div className="bg-gradient-to-r from-[#C7EA46] to-[#56CCF2] rounded-2xl p-6 lg:p-8 text-white mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold mb-2">📋 Mis Evaluaciones</h2>
                <p className="opacity-90">Registro de todas las evaluaciones realizadas en el colegio</p>
              </div>
              
              {evaluations.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No hay evaluaciones</h3>
                  <p className="text-gray-600">Comienza evaluando a los estudiantes en el colegio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluations.map(evaluation => (
                    <div key={evaluation.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-[#C7EA46] to-[#56CCF2] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {evaluation.dogs?.name?.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{evaluation.dogs?.name}</h4>
                            <p className="text-sm text-gray-600">
                              {evaluation.dogs?.breed} • Dueño: {evaluation.dogs?.profiles?.full_name}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                🏫 Colegio
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(evaluation.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            E: {evaluation.energy_level}/10
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            S: {evaluation.sociability_level}/10
                          </span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            O: {evaluation.obedience_level}/10
                          </span>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                            A: {evaluation.anxiety_level}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

        case 'medico':
  return (
    <div className={contentClasses}>
      <div className={innerClasses}>
        <TeacherMedicalView />
      </div>
    </div>
  );
      
      case 'rutinas':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <RoutineManager currentUser={currentUser} readonly={true} />
            </div>
          </div>
        );
      
      case 'salud':
        return (
          <div className={contentClasses}>
            <div className={innerClasses}>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <VaccineManager currentUser={currentUser} readonly={true} />
                <MedicineManager currentUser={currentUser} readonly={true} />
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
          <div className="w-20 h-20 bg-gradient-to-r from-[#C7EA46] to-[#56CCF2] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-3xl">👨‍🏫</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#2C3E50] mb-4">Cargando Panel del Profesor</h2>
          <p className="text-gray-600">Accediendo a información del club...</p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C7EA46] mx-auto"></div>
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
      
      {/* 🔧 CORREGIDO: Modales con props correctas */}
      {showEvaluationForm && selectedDog && selectedDog.id && (
        <CompleteEvaluationForm
          dogId={selectedDog.id}
          userId={currentUser?.id}           // 🔧 CORREGIDO
          userRole={currentUser?.role}       // 🔧 CORREGIDO
          onClose={closeEvaluationForm}
          onSave={onEvaluationSubmitted}     // 🔧 CORREGIDO prop name
        />
      )}
      
      {showProgressModal && selectedDogForProgress && (
        <DogProgressModal
          dog={selectedDogForProgress}
          onClose={closeProgressModal}
          isOpen={showProgressModal} // 🔧 CORREGIDO: prop isOpen agregada
        />
      )}
    </div>
  );
};

export default TeacherDashboard;