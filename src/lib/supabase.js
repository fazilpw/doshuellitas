// src/lib/supabase.js - VERSIÓN COMPLETA CON TODAS LAS FUNCIONES ✅
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

    // Convertir a porcentajes (1-10 → 0-100%)
    const percentages = {
      energy_percentage: Math.round((averages.energy / 10) * 100),
      sociability_percentage: Math.round((averages.sociability / 10) * 100),
      obedience_percentage: Math.round((averages.obedience / 10) * 100),
      anxiety_percentage: Math.round((averages.anxiety / 10) * 100)
    };

    // Contar evaluaciones por ubicación
    const casaEvaluations = data.filter(item => item.location === 'casa').length;
    const colegioEvaluations = data.filter(item => item.location === 'colegio').length;

    // Calcular tendencia (comparar últimas 3 vs anteriores)
    let trend = 'estable';
    if (totalEvaluations >= 6) {
      const recent = data.slice(0, 3);
      const older = data.slice(3, 6);
      
      const recentAvg = recent.reduce((sum, item) => sum + (item.obedience_level || 0), 0) / 3;
      const olderAvg = older.reduce((sum, item) => sum + (item.obedience_level || 0), 0) / 3;
      
      if (recentAvg > olderAvg + 0.5) trend = 'mejorando';
      else if (recentAvg < olderAvg - 0.5) trend = 'empeorando';
    }

    return {
      data: {
        ...percentages,
        total_evaluations: totalEvaluations,
        casa_evaluations: casaEvaluations,
        colegio_evaluations: colegioEvaluations,
        last_evaluation_date: data[0]?.date || null,
        trend,
        // Datos en escala 1-10 para gráficos
        raw_averages: averages
      },
      error: null
    };

  } catch (error) {
    console.error('Error calculating dog averages:', error);
    return { data: null, error };
  }
}

/**
 * 📊 Obtiene promedios de múltiples perros de una vez
 */
export async function getMultipleDogsAverages(dogIds) {
  try {
    const results = {};
    
    // Procesar cada perro
    for (const dogId of dogIds) {
      const { data, error } = await getDogAverages(dogId);
      if (!error && data) {
        results[dogId] = data;
      }
    }

    return { data: results, error: null };
  } catch (error) {
    console.error('Error fetching multiple dog averages:', error);
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

    // Contar evaluaciones del profesor hoy
    const { count: evaluationsToday, error: evalError } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('evaluator_id', teacherId)
      .eq('date', today)
      .eq('location', 'colegio');

    if (evalError) throw evalError;

    const pendingToday = (totalDogs || 0) - (evaluationsToday || 0);

    return {
      data: {
        total_dogs: totalDogs || 0,
        evaluations_today: evaluationsToday || 0,
        pending_today: Math.max(0, pendingToday)
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    return { data: null, error };
  }
}

/**
 * Obtiene estadísticas rápidas para un padre
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

    // Contar evaluaciones totales de los perros del padre
    const { data: dogIds, error: dogIdsError } = await supabase
      .from('dogs')
      .select('id')
      .eq('owner_id', parentId)
      .eq('active', true);

    if (dogIdsError) throw dogIdsError;

    let totalEvaluations = 0;
    let weekEvaluations = 0;

    if (dogIds && dogIds.length > 0) {
      const dogIdsList = dogIds.map(dog => dog.id);
      
      // Evaluaciones totales
      const { count: total, error: totalError } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .in('dog_id', dogIdsList);

      if (!totalError) totalEvaluations = total || 0;

      // Evaluaciones de esta semana
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      
      const { count: week, error: weekError } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .in('dog_id', dogIdsList)
        .gte('date', weekAgo);

      if (!weekError) weekEvaluations = week || 0;
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
  ADMIN: 'admin'
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
// 🚀 EXPORTACIÓN PRINCIPAL
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
    }
  };
  
  console.log('🔧 Supabase debug disponible en window.debugSupabase');
}

export default supabase;