// src/components/dashboard/ParentDashboard.jsx
// 👨‍👩‍👧‍👦 DASHBOARD PARA PADRES - TODOS LOS PROBLEMAS CORREGIDOS ✅

import { useState, useEffect } from 'react';
import supabase, { getDogAverages, getMultipleDogsAverages } from '../../lib/supabase.js';
import CompleteEvaluationForm from './CompleteEvaluationForm.jsx';
import DogProgressModal from './DogProgressModal.jsx';
import RoutineManager from '../routines/RoutineManager.jsx';
import VaccineManager from '../routines/VaccineManager.jsx';
import MedicineManager from '../routines/MedicineManager.jsx';
import GroomingManager from '../routines/GroomingManager.jsx';
import ParentManagementPanel from './ParentManagementPanel.jsx';

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

  // ===============================================
  // 🔄 EFECTOS DE INICIALIZACIÓN
  // ===============================================
  useEffect(() => {
    if (authUser && authProfile) {
      console.log('✅ Usando datos de auth recibidos como props');
      setCurrentUser(authProfile);
      initializeDashboardWithUser(authUser.id);
    } else {
      initializeDashboardWithAuthService();
    }
  }, [authUser, authProfile]);

  // Auto-selección del primer perro
  useEffect(() => {
    if (dogs.length > 0 && !selectedDogId && dogs[0]?.id) {
      console.log('🐕 Auto-seleccionando primer perro:', dogs[0].name, dogs[0].id);
      setSelectedDogId(dogs[0].id);
      setSelectedDog(dogs[0]);
    }
  }, [dogs, selectedDogId]);

  // ===============================================
  // 🚀 FUNCIONES DE INICIALIZACIÓN
  // ===============================================
  const initializeDashboardWithAuthService = async () => {
    try {
      console.log('🔄 Inicializando con authService...');
      
      const { authService } = await import('../../lib/authService.js');
      
      if (!authService.isInitialized) {
        await authService.initialize();
      }
      
      if (!authService.isAuthenticated) {
        console.log('❌ Usuario no autenticado, redirigiendo...');
        if (typeof window !== 'undefined') {
          window.location.href = '/login/';
        }
        return;
      }
      
      setCurrentUser(authService.profile);
      await initializeDashboardWithUser(authService.user.id);
      
    } catch (error) {
      console.error('❌ Error inicializando dashboard:', error);
      setLoading(false);
    }
  };

  const initializeDashboardWithUser = async (userId) => {
    try {
      // 🔧 CORREGIDO: Orden secuencial correcto
      await fetchUserDogs(userId);
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
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          profiles!dogs_owner_id_fkey(full_name, email, phone)
        `)
        .eq('owner_id', userId)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      console.log('✅ Perros cargados:', data?.length || 0);
      setDogs(data || []);

      // 🔧 CORREGIDO: Cargar evaluaciones y promedios DESPUÉS de tener perros
      if (data && data.length > 0) {
        const dogIds = data.map(dog => dog.id);
        console.log('🔢 Dog IDs para consultas:', dogIds);
        
        // Cargar evaluaciones usando dogIds (no userId)
        await fetchRecentEvaluations(dogIds);
        
        // Cargar promedios para cada perro
        try {
          console.log('📊 Cargando promedios para perros...');
          const averagesData = await getMultipleDogsAverages(dogIds);
          console.log('📊 Averages data recibida:', averagesData);
          setDogAverages(averagesData);
          console.log('📊 Estado dogAverages actualizado:', averagesData);
        } catch (avgError) {
          console.warn('⚠️ Error cargando promedios:', avgError);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching user dogs:', error);
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
        .in('dog_id', dogIds) // 🔧 CORREGIDO: Usar .in() en lugar de join roto
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
  // 🎛️ FUNCIONES DE MANEJO DE EVENTOS
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

  const closeEvaluationForm = () => {
    console.log('✅ Cerrando formulario de evaluación');
    setShowEvaluationForm(false);
    setSelectedDog(null);
  };

  const onEvaluationSubmitted = async (newEvaluation) => {
    console.log('✅ Nueva evaluación enviada:', newEvaluation);
    
    // Actualizar lista de evaluaciones
    setEvaluations(prev => [newEvaluation, ...prev]);
    
    // 🔧 CORREGIDO: Recalcular promedios con estructura correcta
    if (newEvaluation.dog_id) {
      try {
        const updatedAveragesResult = await getDogAverages(newEvaluation.dog_id);
        if (updatedAveragesResult.data) {
          setDogAverages(prev => ({
            ...prev,
            [newEvaluation.dog_id]: updatedAveragesResult.data // ← .data es importante
          }));
        }
      } catch (error) {
        console.warn('⚠️ Error recalculando promedios:', error);
      }
    }
    
    closeEvaluationForm();
  };

  // 🔧 CORREGIDO: Función openProgressModal
  const openProgressModal = (dog) => {
    console.log('📊 Abriendo modal de progreso para:', dog.name);
    setSelectedDogForProgress(dog);
    setShowProgressModal(true);
  };

  const closeProgressModal = () => {
    console.log('📊 Cerrando modal de progreso');
    setShowProgressModal(false);
    setSelectedDogForProgress(null);
  };

  const handleDataUpdated = async () => {
    console.log('🔄 Refrescando datos...');
    setLoading(true);
    if (currentUser?.id) {
      await fetchUserDogs(currentUser.id);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      const { authService } = await import('../../lib/authService.js');
      const result = await authService.signOut();
      
      if (result.success) {
        console.log('✅ Sesión cerrada correctamente');
        window.location.href = '/login/';
      } else {
        console.error('❌ Error cerrando sesión:', result.error);
      }
    } catch (error) {
      console.error('❌ Error durante logout:', error);
    }
  };

  // ===============================================
  // 🎨 COMPONENTES DE RENDERIZADO
  // ===============================================

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
                  ? 'bg-[#56CCF2] text-white'
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
          <div className="w-10 h-10 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🐕</span>
          </div>
          <div>
            <h2 className="font-bold text-[#2C3E50]">Club Canino</h2>
            <p className="text-sm text-gray-600">Dashboard Padre</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="p-3 space-y-2">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
          { key: 'rutinas', label: 'Rutinas', icon: '📅' },
          { key: 'salud', label: 'Salud', icon: '🏥' },
          { key: 'tracking', label: 'Tracking', icon: '📍' },
          { key: 'config', label: 'Configuración', icon: '⚙️' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setCurrentPage(item.key)}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group ${
              currentPage === item.key
                ? 'bg-[#56CCF2] text-white shadow-lg transform scale-105' 
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


              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {dogs.map(dog => {
          const averagesData = dogAverages[dog.id];
          console.log(`📊 Averages para ${dog.name}:`, averagesData);
          
          return (
            <div key={dog.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300">

                <div className="p-6 lg:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{dog.name}</h3>
                      <p className="text-gray-600 font-medium">{dog.breed}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="inline-block px-3 py-1 bg-[#56CCF2] bg-opacity-10 text-[#56CCF2] rounded-full text-sm font-medium">
                          {dog.size}
                        </span>
                        {dog.age && (
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                            {dog.age} años
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-2xl flex items-center justify-center text-2xl">
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

                  {/* Acciones */}
                  <div className="space-y-3">
                    <button
                      onClick={() => openEvaluationForm(dog)}
                      className="w-full bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center space-x-2"
                    >
                      <span className="text-lg">📝</span>
                      <span>Evaluar Comportamiento</span>
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

        {/* 🔧 CORREGIDO: Evaluaciones Recientes - Todas las métricas */}
        {evaluations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 lg:p-8 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span className="text-2xl">📋</span>
                <span>Evaluaciones Recientes</span>
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {evaluations.slice(0, 5).map(evaluation => (
                <div key={evaluation.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center text-white font-bold">
                        {evaluation.dogs?.name?.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{evaluation.dogs?.name}</span>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{evaluation.location === 'casa' ? '🏠 Casa' : '🏫 Colegio'}</span>
                          <span>•</span>
                          <span>{new Date(evaluation.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {/* 🔧 CORREGIDO: Mostrar TODAS las métricas, no solo E y S */}
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
              dogs={dogs}                    // ← AGREGAR ESTA LÍNEA
              loading={loading}              // ← AGREGAR ESTA LÍNEA TAMBIÉN
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
                dogs={dogs}                  // ← AGREGAR ESTA LÍNEA
                loading={loading}            // ← AGREGAR ESTA LÍNEA
              />
              <MedicineManager 
                currentUser={currentUser}
                dogs={dogs}                  // ← AGREGAR ESTA LÍNEA
                loading={loading}            // ← AGREGAR ESTA LÍNEA
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
                dogs={dogs}                  // ← AGREGAR ESTA LÍNEA
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
              dogs={dogs}                    // ← AGREGAR ESTA LÍNEA
              onDataUpdated={handleDataUpdated}
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
            <span className="text-3xl">🐕</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#2C3E50] mb-4">Cargando Dashboard</h2>
          <p className="text-gray-600">Conectando con datos del club...</p>
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
      
      {/* 🔧 CORREGIDO: Modales con props correctas */}
      {showEvaluationForm && selectedDog && selectedDog.id && (
  <CompleteEvaluationForm
    dogId={selectedDog.id}
    userId={currentUser?.id}           // ← CORREGIDO
    userRole={currentUser?.role}       // ← CORREGIDO
    onClose={closeEvaluationForm}
    onSave={onEvaluationSubmitted}     // ← CORREGIDO prop name
  />
)}
      {showProgressModal && selectedDogForProgress && (
        <DogProgressModal
          dog={selectedDogForProgress}
          onClose={closeProgressModal}
          isOpen={showProgressModal} // 🔧 AGREGADO: prop isOpen faltante
        />
      )}
    </div>
  );
};

export default ParentDashboard;