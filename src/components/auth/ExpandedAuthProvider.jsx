// src/components/auth/ExpandedAuthProvider.jsx
// SISTEMA COMPLETO DE AUTENTICACIÓN Y GESTIÓN DEL CLUB CANINO
import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

// ===============================================
// 🎯 CONTEXTO DE AUTENTICACIÓN EXPANDIDO
// ===============================================

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de ExpandedAuthProvider');
  }
  return context;
};

// ===============================================
// 🚀 PROVEEDOR EXPANDIDO
// ===============================================

export const ExpandedAuthProvider = ({ children }) => {
  // Estados principales
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allDogs, setAllDogs] = useState([]);
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para la app
  const [clubStats, setClubStats] = useState({
    totalUsers: 0,
    totalDogs: 0,
    totalEvaluations: 0,
    evaluationsToday: 0
  });

  // ===============================================
  // 🏗️ INICIALIZACIÓN
  // ===============================================

  useEffect(() => {
    initializeClubSystem();
  }, []);

  const initializeClubSystem = async () => {
    setLoading(true);
    try {
      console.log('🚀 Inicializando sistema completo del Club Canino...');
      
      // Cargar todos los datos
      await Promise.all([
        loadAllUsers(),
        loadAllDogs(),
        loadAllEvaluations()
      ]);

      // Establecer usuario por defecto (María)
      await setDefaultUser();
      
      // Calcular estadísticas
      calculateClubStats();
      
      console.log('✅ Sistema inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando sistema:', error);
      setError('Error al inicializar el sistema: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 📖 FUNCIONES DE LECTURA
  // ===============================================

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      console.log('👥 Usuarios cargados:', data.length);
      setAllUsers(data || []);
      return data;
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      throw error;
    }
  };

  const loadAllDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          profiles:owner_id (
            full_name,
            role,
            email
          )
        `)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      
      console.log('🐕 Perros cargados:', data.length);
      setAllDogs(data || []);
      return data;
    } catch (error) {
      console.error('❌ Error cargando perros:', error);
      throw error;
    }
  };

  const loadAllEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          dogs (
            name,
            breed
          ),
          profiles:evaluator_id (
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Últimas 100 evaluaciones

      if (error) throw error;
      
      console.log('📊 Evaluaciones cargadas:', data.length);
      setAllEvaluations(data || []);
      return data;
    } catch (error) {
      console.error('❌ Error cargando evaluaciones:', error);
      throw error;
    }
  };

  // ===============================================
  // 🔄 GESTIÓN DE USUARIOS
  // ===============================================

  const setDefaultUser = async () => {
    const maria = allUsers.find(user => user.email === 'maria@gmail.com');
    if (maria) {
      setCurrentUser(maria);
      console.log('👤 Usuario por defecto establecido:', maria.full_name);
    }
  };

  const switchUser = async (userId) => {
    try {
      const user = allUsers.find(u => u.id === userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      setCurrentUser(user);
      console.log('🔄 Cambiado a usuario:', user.full_name, '(' + user.role + ')');
      return user;
    } catch (error) {
      console.error('❌ Error cambiando usuario:', error);
      setError('Error al cambiar usuario: ' + error.message);
      throw error;
    }
  };

  const createNewUser = async (userData) => {
    try {
      console.log('👤 Creando nuevo usuario:', userData);
      
      // Generar ID único
      const newId = crypto.randomUUID();
      
      const newUser = {
        id: newId,
        email: userData.email,
        full_name: userData.fullName,
        phone: userData.phone || null,
        role: userData.role || 'padre',
        active: true,
        club_member_since: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([newUser])
        .select()
        .single();

      if (error) throw error;

      // Actualizar lista local
      setAllUsers(prev => [...prev, data]);
      
      console.log('✅ Usuario creado:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      setError('Error al crear usuario: ' + error.message);
      throw error;
    }
  };

  const updateUserProfile = async (userId, updateData) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar listas locales
      setAllUsers(prev => prev.map(user => 
        user.id === userId ? data : user
      ));
      
      if (currentUser?.id === userId) {
        setCurrentUser(data);
      }

      console.log('✅ Usuario actualizado:', data);
      return data;
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      throw error;
    }
  };

  // ===============================================
  // 🐕 GESTIÓN DE PERROS
  // ===============================================

  const addNewDog = async (dogData) => {
    try {
      console.log('🐕 Agregando nuevo perro:', dogData);
      
      const newDog = {
        id: crypto.randomUUID(),
        name: dogData.name,
        owner_id: dogData.ownerId || currentUser?.id,
        breed: dogData.breed || '',
        size: dogData.size || 'mediano',
        age: dogData.age || null,
        weight: dogData.weight || null,
        color: dogData.color || '',
        active: true,
        notes: dogData.notes || '',
        photo_url: dogData.photoUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('dogs')
        .insert([newDog])
        .select(`
          *,
          profiles:owner_id (
            full_name,
            role,
            email
          )
        `)
        .single();

      if (error) throw error;

      // Actualizar lista local
      setAllDogs(prev => [...prev, data]);
      
      console.log('✅ Perro agregado:', data);
      return data;
    } catch (error) {
      console.error('❌ Error agregando perro:', error);
      setError('Error al agregar perro: ' + error.message);
      throw error;
    }
  };

  const updateDogInfo = async (dogId, updateData) => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', dogId)
        .select(`
          *,
          profiles:owner_id (
            full_name,
            role,
            email
          )
        `)
        .single();

      if (error) throw error;

      // Actualizar lista local
      setAllDogs(prev => prev.map(dog => 
        dog.id === dogId ? data : dog
      ));

      console.log('✅ Perro actualizado:', data);
      return data;
    } catch (error) {
      console.error('❌ Error actualizando perro:', error);
      throw error;
    }
  };

  const assignDogToUser = async (dogId, newOwnerId) => {
    try {
      return await updateDogInfo(dogId, { owner_id: newOwnerId });
    } catch (error) {
      console.error('❌ Error asignando perro:', error);
      throw error;
    }
  };

  // ===============================================
  // 📊 GESTIÓN DE EVALUACIONES
  // ===============================================

  const saveEvaluation = async (evaluationData) => {
    try {
      console.log('📊 Guardando evaluación:', evaluationData);
      
      const newEvaluation = {
        id: crypto.randomUUID(),
        dog_id: evaluationData.dog_id,
        evaluator_id: evaluationData.evaluator_id || currentUser?.id,
        date: evaluationData.date || new Date().toISOString().split('T')[0],
        location: evaluationData.location,
        ...evaluationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('evaluations')
        .insert([newEvaluation])
        .select(`
          *,
          dogs (
            name,
            breed
          ),
          profiles:evaluator_id (
            full_name,
            role
          )
        `)
        .single();

      if (error) throw error;

      // Actualizar lista local
      setAllEvaluations(prev => [data, ...prev]);
      
      // Recalcular estadísticas
      calculateClubStats();
      
      console.log('✅ Evaluación guardada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error guardando evaluación:', error);
      setError('Error al guardar evaluación: ' + error.message);
      throw error;
    }
  };

  const getEvaluationHistory = (dogId, limit = 10) => {
    return allEvaluations
      .filter(evaluation => evaluation.dog_id === dogId)
      .slice(0, limit);
  };

  const getEvaluationsByDate = (date) => {
    return allEvaluations.filter(evaluation => evaluation.date === date);
  };

  // ===============================================
  // 📈 ESTADÍSTICAS Y REPORTES
  // ===============================================

  const calculateClubStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const evaluationsToday = allEvaluations.filter(evaluation => evaluation.date === today).length;
    
    const stats = {
      totalUsers: allUsers.length,
      totalDogs: allDogs.length,
      totalEvaluations: allEvaluations.length,
      evaluationsToday
    };
    
    setClubStats(stats);
    console.log('📈 Estadísticas actualizadas:', stats);
    return stats;
  };

  const generateReport = (filters = {}) => {
    let evaluations = [...allEvaluations];
    
    // Filtros
    if (filters.dogId) {
      evaluations = evaluations.filter(evaluation => evaluation.dog_id === filters.dogId);
    }
    
    if (filters.location) {
      evaluations = evaluations.filter(evaluation => evaluation.location === filters.location);
    }
    
    if (filters.dateFrom) {
      evaluations = evaluations.filter(evaluation => evaluation.date >= filters.dateFrom);
    }
    
    if (filters.dateTo) {
      evaluations = evaluations.filter(evaluation => evaluation.date <= filters.dateTo);
    }
    
    // Calcular promedios
    if (evaluations.length === 0) {
      return { evaluations: [], averages: null, count: 0 };
    }
    
    const averages = {
      energy: Math.round(evaluations.reduce((sum, e) => sum + (e.energy_level || 0), 0) / evaluations.length),
      sociability: Math.round(evaluations.reduce((sum, e) => sum + (e.sociability_level || 0), 0) / evaluations.length),
      obedience: Math.round(evaluations.reduce((sum, e) => sum + (e.obedience_level || 0), 0) / evaluations.length),
      anxiety: Math.round(evaluations.reduce((sum, e) => sum + (e.anxiety_level || 0), 0) / evaluations.length)
    };
    
    return {
      evaluations,
      averages,
      count: evaluations.length
    };
  };

  // ===============================================
  // 🔍 FUNCIONES DE UTILIDAD
  // ===============================================

  const getUserDogs = (userId = null) => {
    const targetUserId = userId || currentUser?.id;
    return allDogs.filter(dog => dog.owner_id === targetUserId);
  };

  const getUsersByRole = (role) => {
    return allUsers.filter(user => user.role === role && user.active);
  };

  const searchDogs = (query) => {
    const lowercaseQuery = query.toLowerCase();
    return allDogs.filter(dog => 
      dog.name.toLowerCase().includes(lowercaseQuery) ||
      dog.breed.toLowerCase().includes(lowercaseQuery) ||
      dog.profiles?.full_name.toLowerCase().includes(lowercaseQuery)
    );
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAllUsers(),
        loadAllDogs(),
        loadAllEvaluations()
      ]);
      calculateClubStats();
    } catch (error) {
      console.error('❌ Error refrescando datos:', error);
      setError('Error al refrescar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🎯 VALOR DEL CONTEXTO
  // ===============================================

  const contextValue = {
    // Estados principales
    user: currentUser,
    profile: currentUser, // Alias para compatibilidad
    allUsers,
    allDogs,
    allEvaluations,
    loading,
    error,
    clubStats,
    
    // Funciones de usuario
    switchUser,
    createNewUser,
    updateUserProfile,
    getUsersByRole,
    
    // Funciones de perros
    addNewDog,
    updateDogInfo,
    assignDogToUser,
    getUserDogs,
    searchDogs,
    
    // Funciones de evaluaciones
    saveEvaluation,
    getEvaluationHistory,
    getEvaluationsByDate,
    
    // Reportes y estadísticas
    generateReport,
    calculateClubStats,
    
    // Utilidades
    refreshData,
    clearError: () => setError(''),
    
    // Compatibilidad con hooks existentes
    isAuthenticated: !!currentUser,
    hasRole: (role) => currentUser?.role === role,
    isPadre: currentUser?.role === 'padre',
    isProfesor: currentUser?.role === 'profesor',
    isAdmin: currentUser?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default ExpandedAuthProvider;