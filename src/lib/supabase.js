// src/lib/supabase.js - VERSIÓN COMPLETA CON EXPORTS CORREGIDOS ✅
import { createClient } from '@supabase/supabase-js';

// ============================================
// 🔧 CONFIGURACIÓN BÁSICA
// ============================================
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente principal de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// 🎯 FUNCIONES DE DATOS PARA CLUB CANINO
// ============================================

/**
 * Obtiene los perros de un usuario específico
 * 🔧 CORREGIDO: Función independiente que no necesita parámetro supabase
 */
export async function getUserDogs(userId) {
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
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user dogs:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene evaluaciones recientes de perros
 * 🔧 CORREGIDO: Función independiente que no necesita parámetro supabase
 */
export async function getRecentEvaluations(dogIds, days = 7) {
  try {
    if (!dogIds || dogIds.length === 0) {
      return { data: [], error: null };
    }

    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

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

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching recent evaluations:', error);
    return { data: null, error };
  }
}

/**
 * 🔍 FUNCIÓN QUE FALTABA: Obtiene todas las evaluaciones de un perro específico
 */
export async function getDogEvaluations(dogId, limit = 50) {
  try {
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

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching dog evaluations:', error);
    return { data: null, error };
  }
}

/**
 * Crea una nueva evaluación
 */
export async function createEvaluation(evaluationData) {
  try {
    const { data, error } = await supabase
      .from('evaluations')
      .insert([evaluationData])
      .select(`
        *,
        dogs(name, breed),
        profiles!evaluations_evaluator_id_fkey(full_name, email, role)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating evaluation:', error);
    return { data: null, error };
  }
}

/**
 * 📊 Obtiene promedios/estadísticas de un perro específico
 */
export async function getDogAverages(dogId) {
  try {
    const { data, error } = await supabase
      .from('evaluations')
      .select('energy_level, sociability_level, obedience_level, anxiety_level, location, date')
      .eq('dog_id', dogId)
      .order('date', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
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
    const casaEvaluations = data.filter(e => e.location === 'casa');
    const colegioEvaluations = data.filter(e => e.location === 'colegio');

    // Calcular tendencia (últimas 3 vs anteriores)
    const recent = data.slice(0, 3);
    const older = data.slice(3, 6);
    
    let trend = 'estable';
    if (recent.length >= 2 && older.length >= 2) {
      const recentAvg = recent.reduce((sum, e) => sum + (e.energy_level || 0), 0) / recent.length;
      const olderAvg = older.reduce((sum, e) => sum + (e.energy_level || 0), 0) / older.length;
      
      if (recentAvg > olderAvg + 1) trend = 'mejorando';
      else if (recentAvg < olderAvg - 1) trend = 'decreciendo';
    }

    return {
      data: {
        energy_percentage: Math.round((averages.energy / 10) * 100),
        sociability_percentage: Math.round((averages.sociability / 10) * 100),
        obedience_percentage: Math.round((averages.obedience / 10) * 100),
        anxiety_percentage: Math.round((averages.anxiety / 10) * 100),
        total_evaluations: totalEvaluations,
        casa_evaluations: casaEvaluations.length,
        colegio_evaluations: colegioEvaluations.length,
        last_evaluation_date: data[0].date,
        trend
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching dog averages:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene estadísticas rápidas para un profesor
 */
export async function getTeacherStats(teacherId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Contar perros totales activos
    const { count: totalDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    if (dogsError) throw dogsError;

    // Evaluaciones de hoy por este profesor
    const { count: todayEvaluations, error: evalError } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('evaluator_id', teacherId)
      .eq('date', today);

    if (evalError) throw evalError;

    // Evaluaciones totales del profesor
    const { count: totalEvaluations, error: totalError } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('evaluator_id', teacherId);

    if (totalError) throw totalError;

    return {
      data: {
        total_dogs: totalDogs || 0,
        today_evaluations: todayEvaluations || 0,
        total_evaluations: totalEvaluations || 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene estadísticas para un padre
 */
export async function getParentStats(parentId) {
  try {
    // Contar perros del padre
    const { count: myDogs, error: dogsError } = await supabase
      .from('dogs')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', parentId)
      .eq('active', true);

    if (dogsError) throw dogsError;

    // Evaluaciones totales de mis perros
    let totalEvaluations = 0;
    let weekEvaluations = 0;

    if (myDogs && myDogs > 0) {
      // Obtener IDs de mis perros
      const { data: dogIds, error: idsError } = await supabase
        .from('dogs')
        .select('id')
        .eq('owner_id', parentId)
        .eq('active', true);

      if (!idsError && dogIds) {
        const ids = dogIds.map(d => d.id);
        
        // Total evaluaciones
        const { count: total, error: totalError } = await supabase
          .from('evaluations')
          .select('*', { count: 'exact', head: true })
          .in('dog_id', ids);

        if (!totalError) totalEvaluations = total || 0;

        // Evaluaciones de esta semana
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        const { count: week, error: weekError } = await supabase
          .from('evaluations')
          .select('*', { count: 'exact', head: true })
          .in('dog_id', ids)
          .gte('date', weekAgo);

        if (!weekError) weekEvaluations = week || 0;
      }
    }

    return {
      data: {
        my_dogs: myDogs || 0,
        total_evaluations: totalEvaluations,
        week_evaluations: weekEvaluations
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching parent stats:', error);
    return { data: null, error };
  }
}

/**
 * Busca un usuario por email y rol
 */
export async function getUserByEmailAndRole(email, role) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('role', role)
      .eq('active', true)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user by email and role:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene todos los perros activos (para profesores/admin)
 */
export async function getAllDogs() {
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
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all dogs:', error);
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

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching today evaluations:', error);
    return { data: null, error };
  }
}

/**
 * Función de diagnóstico - verifica conexión con Supabase
 */
export async function testSupabaseConnection() {
  try {
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
    console.error('Error testing Supabase connection:', error);
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

    // Helper para probar routine_completions
    async testRoutineCompletions() {
      try {
        const { data, error } = await supabase
          .from('routine_completions')
          .select('*')
          .limit(3);
        
        console.log('✅ routine_completions query exitoso:', data);
        return { data, error };
      } catch (err) {
        console.log('❌ routine_completions query falló:', err);
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
    }
  };
  
  console.log('🔧 Supabase debug disponible en window.debugSupabase');
  console.log('📝 Funciones exportadas: getUserDogs, getRecentEvaluations, getDogEvaluations, createEvaluation');
}

// ============================================
// 🚀 EXPORTACIÓN PRINCIPAL
// ============================================
export default supabase;