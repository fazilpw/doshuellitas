// src/hooks/useClubCaninoAuth.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/auth/AuthProvider.jsx';
import { supabase, getUserDogs, getRecentEvaluations } from '../lib/supabase.js';

// ============================================
// 🐕 HOOK ESPECÍFICO CLUB CANINO
// ============================================

export function useClubCaninoAuth() {
  const baseAuth = useAuth();
  const [dogs, setDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [stats, setStats] = useState({
    totalDogs: 0,
    totalEvaluations: 0,
    lastEvaluation: null
  });
  const [loading, setLoading] = useState(false);

  // ============================================
  // 🔄 EFECTOS DE INICIALIZACIÓN
  // ============================================

  useEffect(() => {
    if (baseAuth.user && baseAuth.profile) {
      initializeClubData();
      setupPermissions();
    } else {
      // Limpiar datos cuando no hay usuario
      setDogs([]);
      setSelectedDog(null);
      setPermissions([]);
      setStats({
        totalDogs: 0,
        totalEvaluations: 0,
        lastEvaluation: null
      });
    }
  }, [baseAuth.user, baseAuth.profile]);

  // ============================================
  // 🏗️ INICIALIZACIÓN DE DATOS
  // ============================================

  const initializeClubData = async () => {
    if (!baseAuth.profile) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadUserDogs(),
        loadUserStats()
      ]);
    } catch (error) {
      console.error('Error inicializando datos del club:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDogs = async () => {
    try {
      const userId = baseAuth.user.id;
      const userDogs = await getUserDogs(supabase, userId);
      
      setDogs(userDogs);
      
      // Seleccionar primer perro por defecto
      if (userDogs.length > 0 && !selectedDog) {
        setSelectedDog(userDogs[0]);
      }
      
      console.log(`🐕 Perros cargados: ${userDogs.length}`);
    } catch (error) {
      console.error('Error cargando perros:', error);
      setDogs([]);
    }
  };

  const loadUserStats = async () => {
    try {
      const userId = baseAuth.user.id;
      
      // Obtener estadísticas generales
      const [dogsResult, evaluationsResult] = await Promise.all([
        supabase
          .from('dogs')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', userId)
          .eq('active', true),
        
        supabase
          .from('evaluations')
          .select('id, date, dog_id', { count: 'exact' })
          .in('dog_id', dogs.map(d => d.id))
          .order('date', { ascending: false })
          .limit(1)
      ]);

      setStats({
        totalDogs: dogsResult.count || 0,
        totalEvaluations: evaluationsResult.count || 0,
        lastEvaluation: evaluationsResult.data?.[0] || null
      });
      
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // ============================================
  // 🔐 CONFIGURACIÓN DE PERMISOS
  // ============================================

  const setupPermissions = () => {
    const role = baseAuth.profile?.role;
    const clubPermissions = getClubPermissions(role);
    setPermissions(clubPermissions);
  };

  const getClubPermissions = (role) => {
    const allPermissions = {
      padre: [
        'view_own_pets',
        'create_evaluation',
        'view_own_evaluations',
        'edit_own_profile',
        'contact_teachers'
      ],
      profesor: [
        'view_own_pets',
        'view_all_pets',
        'create_evaluation',
        'view_own_evaluations',
        'view_all_evaluations',
        'edit_own_profile',
        'manage_daily_activities',
        'contact_parents'
      ],
      admin: [
        'view_own_pets',
        'view_all_pets',
        'create_evaluation',
        'view_own_evaluations',
        'view_all_evaluations',
        'edit_own_profile',
        'edit_all_profiles',
        'manage_daily_activities',
        'contact_parents',
        'contact_teachers',
        'manage_users',
        'manage_club_settings',
        'view_reports',
        'export_data'
      ]
    };

    return allPermissions[role] || [];
  };

  // ============================================
  // 🐕 FUNCIONES DE MANEJO DE PERROS
  // ============================================

  const selectDog = useCallback((dog) => {
    setSelectedDog(dog);
    console.log('🐕 Perro seleccionado:', dog.name);
  }, []);

  const addDog = useCallback(async (dogData) => {
    try {
      const newDog = {
        ...dogData,
        owner_id: baseAuth.user.id,
        active: true
      };

      const { data, error } = await supabase
        .from('dogs')
        .insert([newDog])
        .select()
        .single();

      if (error) throw error;

      setDogs(prev => [...prev, data]);
      
      // Seleccionar el nuevo perro
      setSelectedDog(data);
      
      console.log('✅ Perro agregado:', data.name);
      return { data, error: null };
      
    } catch (error) {
      console.error('Error agregando perro:', error);
      return { data: null, error: error.message };
    }
  }, [baseAuth.user]);

  const updateDog = useCallback(async (dogId, updates) => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .update(updates)
        .eq('id', dogId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar lista local
      setDogs(prev => prev.map(dog => 
        dog.id === dogId ? data : dog
      ));
      
      // Actualizar perro seleccionado si es el mismo
      if (selectedDog?.id === dogId) {
        setSelectedDog(data);
      }
      
      console.log('✅ Perro actualizado:', data.name);
      return { data, error: null };
      
    } catch (error) {
      console.error('Error actualizando perro:', error);
      return { data: null, error: error.message };
    }
  }, [selectedDog]);

  // ============================================
  // 📊 FUNCIONES DE EVALUACIONES
  // ============================================

  const createEvaluation = useCallback(async (evaluationData) => {
    try {
      const newEvaluation = {
        ...evaluationData,
        evaluator_id: baseAuth.user.id,
        location: baseAuth.profile.role === 'profesor' ? 'colegio' : 'casa',
        date: new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('evaluations')
        .insert([newEvaluation])
        .select(`
          *,
          dog:dogs(name, breed),
          evaluator:users!evaluations_evaluator_id_fkey(name, role)
        `)
        .single();

      if (error) throw error;

      // Actualizar estadísticas
      setStats(prev => ({
        ...prev,
        totalEvaluations: prev.totalEvaluations + 1,
        lastEvaluation: data
      }));
      
      console.log('✅ Evaluación creada:', data.id);
      
      // Notificar a otros componentes
      notifyEvaluationChange('CREATED', data);
      
      return { data, error: null };
      
    } catch (error) {
      console.error('Error creando evaluación:', error);
      return { data: null, error: error.message };
    }
  }, [baseAuth.user, baseAuth.profile]);

  const getEvaluationsForDog = useCallback(async (dogId, limit = 10) => {
    try {
      const evaluations = await getRecentEvaluations(supabase, dogId, limit);
      return evaluations;
    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      return [];
    }
  }, []);

  // ============================================
  // 🔔 NOTIFICACIONES Y EVENTOS
  // ============================================

  const notifyEvaluationChange = (event, data) => {
    try {
      const bc = new BroadcastChannel('club-canino-evaluations');
      bc.postMessage({
        type: `EVALUATION_${event}`,
        data,
        timestamp: Date.now()
      });
      bc.close();
    } catch (error) {
      console.warn('Error notificando cambio de evaluación:', error);
    }
  };

  // ============================================
  // 🔍 FUNCIONES DE PERMISOS
  // ============================================

  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission);
  }, [permissions]);

  const canManagePets = hasPermission('view_all_pets');
  const canViewAllEvaluations = hasPermission('view_all_evaluations');
  const canAdminClub = hasPermission('manage_club_settings');
  const canCreateEvaluation = hasPermission('create_evaluation');
  const canContactTeachers = hasPermission('contact_teachers');
  const canContactParents = hasPermission('contact_parents');

  // ============================================
  // 📱 FUNCIONES PWA ESPECÍFICAS
  // ============================================

  const syncOfflineData = useCallback(async () => {
    try {
      console.log('🔄 Sincronizando datos offline...');
      
      // Buscar datos pendientes en IndexedDB
      const pendingEvaluations = await getPendingOfflineEvaluations();
      
      for (const evaluation of pendingEvaluations) {
        try {
          await createEvaluation(evaluation);
          await removePendingEvaluation(evaluation.id);
          console.log('✅ Evaluación offline sincronizada');
        } catch (error) {
          console.error('Error sincronizando evaluación:', error);
        }
      }
      
    } catch (error) {
      console.error('Error en sincronización offline:', error);
    }
  }, [createEvaluation]);

  // ============================================
  // 🎁 RETURN DEL HOOK
  // ============================================

  return {
    // Datos base de autenticación
    ...baseAuth,
    
    // Datos específicos del Club Canino
    dogs,
    selectedDog,
    permissions,
    stats,
    loading: baseAuth.loading || loading,
    
    // Funciones de perros
    selectDog,
    addDog,
    updateDog,
    
    // Funciones de evaluaciones
    createEvaluation,
    getEvaluationsForDog,
    
    // Funciones de permisos específicas
    hasPermission,
    canManagePets,
    canViewAllEvaluations,
    canAdminClub,
    canCreateEvaluation,
    canContactTeachers,
    canContactParents,
    
    // Funciones PWA
    syncOfflineData,
    
    // Estados computados específicos
    hasSelectedDog: !!selectedDog,
    totalDogs: stats.totalDogs,
    totalEvaluations: stats.totalEvaluations,
    lastEvaluationDate: stats.lastEvaluation?.date,
    
    // Información del club
    clubMemberSince: baseAuth.profile?.created_at,
    clubRole: baseAuth.profile?.role,
    clubDisplayName: baseAuth.profile?.name
  };
}

// ============================================
// 🛠️ FUNCIONES AUXILIARES
// ============================================

// Estas serían implementadas con IndexedDB para PWA offline
const getPendingOfflineEvaluations = async () => {
  // TODO: Implementar con IndexedDB
  return [];
};

const removePendingEvaluation = async (id) => {
  // TODO: Implementar con IndexedDB
  console.log('Removing pending evaluation:', id);
};

export default useClubCaninoAuth;