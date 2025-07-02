// src/lib/supabase.js
// 🔧 CLIENTE UNIFICADO DE SUPABASE - CLUB CANINO DOS HUELLITAS
// ✅ CORREGIDO: Un solo cliente, exportación consistente

import { createClient } from '@supabase/supabase-js';

// ============================================
// 🔧 CONFIGURACIÓN Y CLIENTE
// ============================================

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Validación crítica
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno faltantes:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('SUPABASE_URL y SUPABASE_ANON_KEY son requeridas');
}

// Cliente único de Supabase con configuración optimizada
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configuración para persistencia mejorada
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Storage personalizado más robusto
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

// Validar cliente
if (!supabase) {
  throw new Error('❌ Error creando cliente Supabase');
}

console.log('✅ Cliente Supabase inicializado:', {
  url: supabaseUrl.substring(0, 30) + '...',
  hasKey: !!supabaseAnonKey
});

// ============================================
// 🎯 FUNCIONES ESPECÍFICAS DEL NEGOCIO
// ============================================

/**
 * Obtiene perros de un usuario
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
 * Obtiene evaluaciones recientes
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
 * Obtiene perfil de usuario
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

/**
 * 🔍 Obtiene todas las evaluaciones de un perro específico
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
 * 📊 Obtiene promedios/estadísticas de un perro específico
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
 * 🔢 Obtiene promedios para múltiples perros
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
// 🔄 EXPORTACIONES
// ============================================

// ============================================
// 🔄 EXPORTACIONES (COMPATIBLES CON ESTRUCTURA ACTUAL)
// ============================================

// EXPORTACIÓN DEFAULT: Cliente Supabase (para authService.js)
export default supabase;

// EXPORTACIÓN NOMBRADA: Para compatibilidad (para otros archivos)
export { supabase };

// Re-exportar createClient para casos especiales
export { createClient };

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

    // Test específico para getUserDogs
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

    // Test específico para getRecentEvaluations
    async testGetRecentEvaluations(dogIds = ['test-dog-id']) {
      try {
        const result = await getRecentEvaluations(dogIds);
        console.log('✅ getRecentEvaluations test:', result);
        return result;
      } catch (err) {
        console.log('❌ getRecentEvaluations test falló:', err);
        return { data: null, error: err };
      }
    },

    // Test para getDogAverages
    async testGetDogAverages(dogId = 'test-dog-id') {
      try {
        const result = await getDogAverages(dogId);
        console.log('✅ getDogAverages test:', result);
        return result;
      } catch (err) {
        console.log('❌ getDogAverages test falló:', err);
        return { data: null, error: err };
      }
    }
  };
  
  console.log('🔧 Supabase debug disponible en window.debugSupabase');
  console.log('📝 Funciones exportadas: getUserDogs, getRecentEvaluations, getDogEvaluations, getDogAverages, createEvaluation, getMultipleDogsAverages, testConnection');
}