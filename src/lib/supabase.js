// src/lib/supabase.js - VERSIÓN COMPLETA CON TODAS LAS FUNCIONES
// ✅ CORREGIDO: Cliente unificado + todas las funciones del proyecto original

import { createClient } from '@supabase/supabase-js';

// ============================================
// 🔧 CONFIGURACIÓN BÁSICA
// ============================================
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente único de Supabase con configuración optimizada
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        try {
          return localStorage.getItem(key);
        } catch (e) {
          console.warn('⚠️ Error leyendo localStorage:', e);
          return null;
        }
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        try {
          localStorage.setItem(key, value);
        } catch (e) {
          console.warn('⚠️ Error escribiendo localStorage:', e);
        }
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('⚠️ Error eliminando localStorage:', e);
        }
      },
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

if (!supabase) {
  throw new Error('❌ Error creando cliente Supabase');
}

console.log('✅ Cliente Supabase inicializado:', {
  url: supabaseUrl.substring(0, 30) + '...',
  hasKey: !!supabaseAnonKey
});

// ============================================
// 🎯 FUNCIONES DE PERROS
// ============================================

/**
 * Obtiene los perros de un usuario específico
 */
export async function getUserDogs(userId) {
  try {
    console.log('🔍 Obteniendo perros para usuario:', userId);
    
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
      console.error('❌ Error obteniendo perros:', error);
      throw error;
    }

    console.log('✅ Perros obtenidos:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error en getUserDogs:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene todos los perros activos (para profesores/admin)
 */
export async function getAllDogs() {
  try {
    console.log('🔍 Obteniendo todos los perros activos...');
    
    const { data, error } = await supabase
      .from('dogs')
      .select(`
        *,
        profiles!dogs_owner_id_fkey(full_name, email, phone)
      `)
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('❌ Error obteniendo todos los perros:', error);
      throw error;
    }

    console.log('✅ Todos los perros obtenidos:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error en getAllDogs:', error);
    return { data: null, error };
  }
}

// ============================================
// 🎯 FUNCIONES DE EVALUACIONES
// ============================================

/**
 * Obtiene evaluaciones recientes de perros
 */
export async function getRecentEvaluations(dogIds, days = 7) {
  try {
    if (!dogIds || dogIds.length === 0) {
      return { data: [], error: null };
    }

    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    console.log('🔍 Obteniendo evaluaciones desde:', dateFrom);

    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        dogs(id, name, breed, size),
        profiles!evaluations_evaluator_id_fkey(full_name, email, role)
      `)
      .in('dog_id', dogIds)
      .gte('date', dateFrom)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo evaluaciones:', error);
      throw error;
    }

    console.log('✅ Evaluaciones obtenidas:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error en getRecentEvaluations:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene todas las evaluaciones de un perro específico
 */
export async function getDogEvaluations(dogId, limit = 50) {
  try {
    console.log('🔍 Obteniendo evaluaciones para perro:', dogId);
    
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        profiles!evaluations_evaluator_id_fkey(full_name, email, role)
      `)
      .eq('dog_id', dogId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error obteniendo evaluaciones:', error);
      throw error;
    }

    console.log('✅ Evaluaciones obtenidas:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error en getDogEvaluations:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene evaluaciones de hoy para una ubicación específica
 */
export async function getTodayEvaluations(location, evaluatorId = null) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from('evaluations')
      .select(`
        *,
        dogs(name, id, breed, size),
        profiles!evaluations_evaluator_id_fkey(full_name, email, role)
      `)
      .eq('date', today)
      .eq('location', location)
      .order('created_at', { ascending: false });

    if (evaluatorId) {
      query = query.eq('evaluator_id', evaluatorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo evaluaciones de hoy:', error);
      throw error;
    }

    console.log('✅ Evaluaciones de hoy obtenidas:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error en getTodayEvaluations:', error);
    return { data: null, error };
  }
}

/**
 * Crear nueva evaluación
 */
export async function createEvaluation(evaluationData) {
  try {
    console.log('📝 Creando evaluación:', evaluationData);
    
    const { data, error } = await supabase
      .from('evaluations')
      .insert([evaluationData])
      .select(`
        *,
        dogs(name, breed),
        profiles!evaluations_evaluator_id_fkey(full_name, email, role)
      `)
      .single();

    if (error) {
      console.error('❌ Error creando evaluación:', error);
      throw error;
    }

    console.log('✅ Evaluación creada:', data.id);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error en createEvaluation:', error);
    return { data: null, error };
  }
}

// ============================================
// 📊 FUNCIONES DE ESTADÍSTICAS Y PROMEDIOS
// ============================================

/**
 * Obtiene promedios/estadísticas de un perro específico
 */
export async function getDogAverages(dogId) {
  try {
    console.log('📊 Calculando promedios para perro:', dogId);
    
    const { data, error } = await supabase
      .from('evaluations')
      .select('energy_level, sociability_level, obedience_level, anxiety_level, location, date')
      .eq('dog_id', dogId)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo datos para promedios:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No hay evaluaciones para calcular promedios');
      return {
        data: {
          energy_percentage: 0,
          sociability_percentage: 0,
          obedience_percentage: 0,
          anxiety_percentage: 0,
          total_evaluations: 0,
          casa_evaluations: 0,
          colegio_evaluations: 0,
          last_evaluation_date: null,
          trend: 'sin_datos'
        },
        error: null
      };
    }

    // Calcular promedios generales
    const totalEvaluations = data.length;
    
    const averages = {
      energy: Math.round(data.reduce((sum, item) => sum + (item.energy_level || 0), 0) / totalEvaluations),
      sociability: Math.round(data.reduce((sum, item) => sum + (item.sociability_level || 0), 0) / totalEvaluations),
      obedience: Math.round(data.reduce((sum, item) => sum + (item.obedience_level || 0), 0) / totalEvaluations),
      anxiety: Math.round(data.reduce((sum, item) => sum + (item.anxiety_level || 0), 0) / totalEvaluations)
    };

    // Separar por ubicación
    const casaEvaluations = data.filter(item => item.location === 'casa');
    const colegioEvaluations = data.filter(item => item.location === 'colegio');

    // Calcular tendencia básica (últimas 5 vs anteriores)
    let trend = 'estable';
    if (totalEvaluations >= 10) {
      const recent = data.slice(0, 5);
      const older = data.slice(5, 10);
      
      const recentAvg = recent.reduce((sum, item) => sum + (item.energy_level || 0), 0) / recent.length;
      const olderAvg = older.reduce((sum, item) => sum + (item.energy_level || 0), 0) / older.length;
      
      if (recentAvg > olderAvg + 1) trend = 'mejorando';
      else if (recentAvg < olderAvg - 1) trend = 'empeorando';
    }

    const result = {
      energy_percentage: Math.round((averages.energy / 10) * 100),
      sociability_percentage: Math.round((averages.sociability / 10) * 100),
      obedience_percentage: Math.round((averages.obedience / 10) * 100),
      anxiety_percentage: Math.round((averages.anxiety / 10) * 100),
      total_evaluations: totalEvaluations,
      casa_evaluations: casaEvaluations.length,
      colegio_evaluations: colegioEvaluations.length,
      last_evaluation_date: data[0]?.date || null,
      trend
    };

    console.log('✅ Promedios calculados:', result);
    return { data: result, error: null };
    
  } catch (error) {
    console.error('❌ Error en getDogAverages:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene promedios para múltiples perros
 */
export async function getMultipleDogsAverages(dogIds) {
  try {
    console.log('🔢 Obteniendo promedios para múltiples perros:', dogIds?.length);
    
    if (!dogIds || dogIds.length === 0) {
      return {};
    }

    const averages = {};
    
    // Obtener promedios para cada perro
    for (const dogId of dogIds) {
      const { data, error } = await getDogAverages(dogId);
      
      if (error) {
        console.error(`❌ Error obteniendo promedios para perro ${dogId}:`, error);
        averages[dogId] = {
          energy_percentage: 0,
          sociability_percentage: 0,
          obedience_percentage: 0,
          anxiety_percentage: 0,
          total_evaluations: 0,
          trend: 'sin_datos'
        };
      } else {
        averages[dogId] = data;
      }
    }

    console.log('✅ Promedios múltiples obtenidos para', Object.keys(averages).length, 'perros');
    return averages;
  } catch (error) {
    console.error('❌ Error en getMultipleDogsAverages:', error);
    return {};
  }
}

/**
 * Obtiene estadísticas rápidas para un padre
 */
export async function getParentStats(userId) {
  try {
    console.log('📊 Obteniendo estadísticas para padre:', userId);

    // Obtener perros del usuario
    const { data: dogs, error: dogsError } = await getUserDogs(userId);
    
    if (dogsError) {
      console.error('❌ Error obteniendo perros para stats:', dogsError);
      throw dogsError;
    }

    const myDogs = dogs?.length || 0;
    let totalEvaluations = 0;
    let weekEvaluations = 0;

    if (dogs && dogs.length > 0) {
      const ids = dogs.map(dog => dog.id);
      
      // Contar evaluaciones totales
      const { count: total, error: totalError } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .in('dog_id', ids);

      if (!totalError) totalEvaluations = total || 0;

      // Contar evaluaciones de la semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: week, error: weekError } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .in('dog_id', ids)
        .gte('date', weekAgo.toISOString().split('T')[0]);

      if (!weekError) weekEvaluations = week || 0;
    }

    const result = {
      my_dogs: myDogs,
      total_evaluations: totalEvaluations,
      week_evaluations: weekEvaluations
    };

    console.log('✅ Estadísticas padre calculadas:', result);
    return { data: result, error: null };
  } catch (error) {
    console.error('❌ Error en getParentStats:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene estadísticas rápidas para un profesor
 */
export async function getTeacherStats(teacherId) {
  try {
    console.log('📊 Obteniendo estadísticas para profesor:', teacherId);
    
    const today = new Date().toISOString().split('T')[0];
    
    // Contar perros totales activos
    const { count: totalDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    if (dogsError) {
      console.error('❌ Error contando perros:', dogsError);
      throw dogsError;
    }

    // Evaluaciones de hoy por este profesor
    const { count: todayEvaluations, error: evalError } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)
      .eq('evaluator_id', teacherId);

    if (evalError) {
      console.error('❌ Error contando evaluaciones de hoy:', evalError);
    }

    // Evaluaciones totales por este profesor
    const { count: totalEvaluations, error: totalEvalError } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('evaluator_id', teacherId);

    if (totalEvalError) {
      console.error('❌ Error contando evaluaciones totales:', totalEvalError);
    }

    const result = {
      total_dogs: totalDogs || 0,
      today_evaluations: todayEvaluations || 0,
      total_evaluations: totalEvaluations || 0
    };

    console.log('✅ Estadísticas profesor calculadas:', result);
    return { data: result, error: null };
  } catch (error) {
    console.error('❌ Error en getTeacherStats:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene estadísticas completas para admin
 */
export async function getAdminStats() {
  try {
    console.log('📊 Obteniendo estadísticas para admin...');

    // Obtener conteos de todas las tablas principales
    const [usersResult, dogsResult, evaluationsResult, vehiclesResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('dogs').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('evaluations').select('*', { count: 'exact', head: true }),
      supabase.from('vehicles').select('*', { count: 'exact', head: true })
    ]);

    const result = {
      total_users: usersResult.count || 0,
      total_dogs: dogsResult.count || 0,
      total_evaluations: evaluationsResult.count || 0,
      total_vehicles: vehiclesResult.count || 0
    };

    console.log('✅ Estadísticas admin calculadas:', result);
    return { data: result, error: null };
  } catch (error) {
    console.error('❌ Error en getAdminStats:', error);
    return { data: null, error };
  }
}

// ============================================
// 👥 FUNCIONES DE USUARIOS
// ============================================

/**
 * Obtener perfil de usuario
 */
export async function getUserProfile(userId) {
  try {
    console.log('🔍 Obteniendo perfil para:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo perfil:', error);
      throw error;
    }

    console.log('✅ Perfil obtenido:', data?.email);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error en getUserProfile:', error);
    return { data: null, error };
  }
}

/**
 * Busca un usuario por email y rol
 */
export async function getUserByEmailAndRole(email, role) {
  try {
    console.log('🔍 Buscando usuario:', email, 'con rol:', role);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('role', role)
      .eq('active', true)
      .single();

    if (error) {
      console.error('❌ Error buscando usuario:', error);
      throw error;
    }

    console.log('✅ Usuario encontrado:', data?.email);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error en getUserByEmailAndRole:', error);
    return { data: null, error };
  }
}

// ============================================
// 🚐 FUNCIONES DE VEHÍCULOS
// ============================================

/**
 * Obtiene todos los vehículos
 */
export async function getVehicles() {
  try {
    console.log('🔍 Obteniendo vehículos...');
    
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        current_driver:profiles(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo vehículos:', error);
      throw error;
    }

    console.log('✅ Vehículos obtenidos:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error en getVehicles:', error);
    return { data: null, error };
  }
}

/**
 * Crea un nuevo vehículo
 */
export async function createVehicle(vehicleData) {
  try {
    console.log('🚐 Creando vehículo:', vehicleData);
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando vehículo:', error);
      throw error;
    }

    console.log('✅ Vehículo creado:', data.id);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error en createVehicle:', error);
    return { data: null, error };
  }
}

// ============================================
// 🔧 FUNCIONES DE UTILIDAD Y DIAGNÓSTICO
// ============================================

/**
 * Verificar conexión a Supabase
 */
export async function testConnection() {
  try {
    console.log('🧪 Probando conexión a Supabase...');
    
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error de conexión:', error);
      throw error;
    }

    console.log('✅ Conexión exitosa, profiles:', count);
    return { success: true, count };
  } catch (error) {
    console.error('❌ Error testConnection:', error);
    return { success: false, error };
  }
}

/**
 * Función de diagnóstico avanzada
 */
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Diagnóstico completo de Supabase...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) throw error;
    
    return { 
      success: true, 
      message: '✅ Conexión exitosa con Supabase',
      data 
    };
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return { 
      success: false, 
      message: '❌ Error de conexión con Supabase: ' + error.message,
      error 
    };
  }
}

// ============================================
// 🎯 CONSTANTES ÚTILES
// ============================================
export const ROLES = {
  PADRE: 'padre',
  PROFESOR: 'profesor',
  ADMIN: 'admin',
  CONDUCTOR: 'conductor'
};

export const LOCATIONS = {
  CASA: 'casa',
  COLEGIO: 'colegio'
};

export const DOG_SIZES = {
  PEQUEÑO: 'pequeño',
  MEDIANO: 'mediano',
  GRANDE: 'grande',
  GIGANTE: 'gigante'
};

// ============================================
// 🔧 DEBUG HELPERS PARA DESARROLLO
// ============================================
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.supabase = supabase;
  window.debugSupabase = {
    // Helper para verificar usuario actual
    async getCurrentUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('👤 Usuario actual:', user);
      console.log('❌ Error auth:', error);
      return { user, error };
    },
    
    // Helper para probar consulta simple
    async testQuery() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, role')
          .limit(1);
        
        console.log('✅ Test query exitoso:', data);
        return { data, error };
      } catch (err) {
        console.log('❌ Test query falló:', err);
        return { data: null, error: err };
      }
    },

    // Tests para todas las funciones principales
    async testGetUserDogs(userId = 'test-user-id') {
      try {
        const result = await getUserDogs(userId);
        console.log('✅ getUserDogs test:', result);
        return result;
      } catch (err) {
        console.log('❌ getUserDogs test falló:', err);
        return { data: null, error: err };
      }
    },

    async testGetDogAverages(dogId = 'test-dog-id') {
      try {
        const result = await getDogAverages(dogId);
        console.log('✅ getDogAverages test:', result);
        return result;
      } catch (err) {
        console.log('❌ getDogAverages test falló:', err);
        return { data: null, error: err };
      }
    },

    async testGetAllDogs() {
      try {
        const result = await getAllDogs();
        console.log('✅ getAllDogs test:', result);
        return result;
      } catch (err) {
        console.log('❌ getAllDogs test falló:', err);
        return { data: null, error: err };
      }
    }
  };
  
  console.log('🔧 Supabase debug disponible en window.debugSupabase');
  console.log('📝 Funciones exportadas completas - ', Object.keys({
    getUserDogs, getAllDogs, getRecentEvaluations, getDogEvaluations, 
    getTodayEvaluations, createEvaluation, getDogAverages, getMultipleDogsAverages,
    getParentStats, getTeacherStats, getAdminStats, getUserProfile, 
    getUserByEmailAndRole, getVehicles, createVehicle, testConnection, testSupabaseConnection
  }).length, 'funciones');
}

// ============================================
// 🔄 EXPORTACIONES PRINCIPALES
// ============================================

// EXPORTACIÓN DEFAULT: Cliente Supabase (para authService.js)
export default supabase;

// EXPORTACIÓN NOMBRADA: Para compatibilidad (para otros archivos)
export { supabase };

// Re-exportar createClient para casos especiales
export { createClient };

// Información del cliente
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  initialized: true
};