// src/hooks/useClubCaninoAuth.js - IMPORTS CORREGIDOS
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/auth/AuthProvider.jsx';
// 🔧 CORREGIDO: supabase como default export, funciones como named exports
import supabase, { getUserDogs, getRecentEvaluations } from '../lib/supabase.js';

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
      // 🔧 CORREGIDO: usar getUserDogs directamente sin pasar supabase
      const { data: userDogs, error } = await getUserDogs(userId);
      
      if (error) {
        console.error('Error cargando perros:', error);
        return;
      }
      
      setDogs(userDogs || []);
      
      // Seleccionar primer perro por defecto
      if (userDogs && userDogs.length > 0 && !selectedDog) {
        setSelectedDog(userDogs[0]);
      }
      
    } catch (error) {
      console.error('Error cargando perros del usuario:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const userId = baseAuth.user.id;
      
      // Obtener estadísticas básicas
      const { data: dogsData, error: dogsError } = await getUserDogs(userId);
      
      if (dogsError) {
        console.error('Error obteniendo estadísticas de perros:', dogsError);
        return;
      }

      const dogIds = dogsData?.map(dog => dog.id) || [];
      
      if (dogIds.length === 0) {
        setStats({
          totalDogs: 0,
          totalEvaluations: 0,
          lastEvaluation: null
        });
        return;
      }

      // 🔧 CORREGIDO: usar getRecentEvaluations directamente
      const { data: evaluationsData, error: evalError } = await getRecentEvaluations(dogIds, 30);
      
      if (evalError) {
        console.error('Error obteniendo evaluaciones recientes:', evalError);
        return;
      }

      setStats({
        totalDogs: dogsData?.length || 0,
        totalEvaluations: evaluationsData?.length || 0,
        lastEvaluation: evaluationsData && evaluationsData.length > 0 ? evaluationsData[0] : null
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
    console.log('🐕 Perro seleccionado:', dog?.name);
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
          dogs(name, breed),
          profiles!evaluations_evaluator_id_fkey(full_name, role)
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
      
      return { data, error: null };
      
    } catch (error) {
      console.error('Error creando evaluación:', error);
      return { data: null, error: error.message };
    }
  }, [baseAuth.user, baseAuth.profile]);

  const getEvaluationsForDog = useCallback(async (dogId, limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          profiles!evaluations_evaluator_id_fkey(full_name, role)
        `)
        .eq('dog_id', dogId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      return { data: null, error: error.message };
    }
  }, []);

  // ============================================
  // 🔄 SINCRONIZACIÓN OFFLINE (PWA)
  // ============================================

  const syncOfflineData = useCallback(async () => {
    try {
      // Aquí iría la lógica de sincronización offline con IndexedDB
      console.log('🔄 Sincronizando datos offline...');
      
      const pendingEvaluations = await getPendingOfflineEvaluations();
      
      for (const evaluation of pendingEvaluations) {
        try {
          await createEvaluation(evaluation.data);
          await removePendingEvaluation(evaluation.id);
          console.log('✅ Evaluación offline sincronizada:', evaluation.id);
        } catch (error) {
          console.error('❌ Error sincronizando evaluación:', evaluation.id, error);
        }
      }
      
      // Recargar datos después de sincronizar
      await loadUserStats();
      
    } catch (error) {
      console.error('Error en sincronización offline:', error);
    }
  }, [createEvaluation, loadUserStats]);

  // ============================================
  // 🎯 FUNCIONES DE UTILIDAD
  // ============================================

  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission);
  }, [permissions]);

  const canManageDog = useCallback((dogId) => {
    if (hasPermission('view_all_pets')) return true;
    
    const dog = dogs.find(d => d.id === dogId);
    return dog?.owner_id === baseAuth.user?.id;
  }, [dogs, baseAuth.user, hasPermission]);

  const notifyEvaluationChange = useCallback((action, evaluation) => {
    // Aquí se podría implementar un sistema de eventos global
    // o integración con notificaciones push
    console.log(`🔔 Evaluación ${action}:`, evaluation?.id);
  }, []);

  // ============================================
  // 📱 INFORMACIÓN PARA LA PWA
  // ============================================

  const getPWAInfo = useCallback(() => {
    return {
      isOfflineCapable: 'serviceWorker' in navigator,
      hasNotifications: 'Notification' in window,
      networkStatus: navigator.onLine ? 'online' : 'offline',
      storageQuota: navigator.storage?.estimate(),
    };
  }, []);

  // ============================================
  // 🎯 RETURN DEL HOOK
  // ============================================

  return {
    // Estado base del auth
    ...baseAuth,
    
    // Estado específico del club
    dogs,
    selectedDog,
    permissions,
    stats,
    loading: loading || baseAuth.loading,
    
    // Funciones de perros
    selectDog,
    addDog,
    updateDog,
    canManageDog,
    
    // Funciones de evaluaciones
    createEvaluation,
    getEvaluationsForDog,
    
    // Funciones de permisos
    hasPermission,
    
    // Funciones de utilidad
    syncOfflineData,
    getPWAInfo,
    
    // Información del club específica
    clubRole: baseAuth.profile?.role,
    clubDisplayName: baseAuth.profile?.full_name || baseAuth.user?.email,
    hasSelectedDog: !!selectedDog,
    totalDogs: stats.totalDogs,
    totalEvaluations: stats.totalEvaluations,
    lastEvaluationDate: stats.lastEvaluation?.date,
    
    // Información del club
    clubMemberSince: baseAuth.profile?.created_at,
    clubDisplayName: baseAuth.profile?.full_name
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