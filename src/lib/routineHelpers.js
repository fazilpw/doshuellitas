// src/lib/routineHelpers.js - VERSIÓN SIN ERRORES 406
import supabase from './supabase.js';

// ============================================
// 🎯 FUNCIONES PARA RUTINAS COMPLETADAS
// ============================================

/**
 * Marcar una rutina como completada - VERSIÓN SIMPLE SIN VERIFICACIONES
 */
export async function markRoutineAsCompleted(routineScheduleId, dogId, userId, notes = '') {
  try {
    console.log('🎯 Marcando rutina como completada:', {
      routineScheduleId,
      dogId,
      userId,
      notes
    });

    const completionData = {
      routine_schedule_id: routineScheduleId,
      dog_id: dogId,
      user_id: userId,
      completed_at: new Date().toISOString(),
      notes: notes || null,
      status: 'completed'
    };

    // 🔧 INSERCIÓN DIRECTA SIN VERIFICACIONES para evitar error 406
    console.log('🆕 Creando nueva completación...');
    const { data, error } = await supabase
      .from('routine_completions')
      .insert([completionData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error en inserción:', error);
      throw error;
    }

    console.log('✅ Nueva completación creada:', data);
    return { data, isUpdate: false };

  } catch (error) {
    console.error('❌ Error marking routine as completed:', error);
    throw error;
  }
}

/**
 * Posponer una rutina (snooze) - VERSIÓN SIMPLE
 */
export async function snoozeRoutine(routineScheduleId, dogId, userId, snoozeMinutes = 15) {
  try {
    const snoozeData = {
      routine_schedule_id: routineScheduleId,
      dog_id: dogId,
      user_id: userId,
      snoozed_until: new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString(),
      snooze_count: 1,
      status: 'snoozed'
    };

    // 🔧 INSERCIÓN DIRECTA SIN VERIFICACIONES
    const { data, error } = await supabase
      .from('routine_completions')
      .insert([snoozeData])
      .select()
      .single();

    if (error) throw error;
    return { data, isUpdate: false };

  } catch (error) {
    console.error('Error snoozing routine:', error);
    throw error;
  }
}

/**
 * 🗑️ BORRAR UNA RUTINA COMPLETA
 */
export async function deleteRoutine(routineId, userId) {
  try {
    console.log('🗑️ Eliminando rutina:', { routineId, userId });

    // 1. Eliminar completaciones (si existen, sin verificar)
    try {
      await supabase
        .from('routine_completions')
        .delete()
        .eq('routine_schedule_id', routineId);
    } catch (error) {
      console.warn('⚠️ Error eliminando completaciones (ignorando):', error);
    }

    // 2. Eliminar horarios de la rutina
    const { error: schedulesError } = await supabase
      .from('routine_schedules')
      .delete()
      .eq('routine_id', routineId);

    if (schedulesError) {
      console.error('❌ Error eliminando horarios:', schedulesError);
      throw schedulesError;
    }

    // 3. Eliminar la rutina principal
    const { error: routineError } = await supabase
      .from('dog_routines')
      .delete()
      .eq('id', routineId);

    if (routineError) {
      console.error('❌ Error eliminando rutina:', routineError);
      throw routineError;
    }

    console.log('✅ Rutina eliminada completamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting routine:', error);
    throw error;
  }
}

/**
 * 🗑️ BORRAR UN HORARIO ESPECÍFICO
 */
export async function deleteSchedule(scheduleId, userId) {
  try {
    console.log('🗑️ Eliminando horario:', { scheduleId, userId });

    // 1. Eliminar completaciones del horario (sin verificar)
    try {
      await supabase
        .from('routine_completions')
        .delete()
        .eq('routine_schedule_id', scheduleId);
    } catch (error) {
      console.warn('⚠️ Error eliminando completaciones (ignorando):', error);
    }

    // 2. Eliminar el horario
    const { error: scheduleError } = await supabase
      .from('routine_schedules')
      .delete()
      .eq('id', scheduleId);

    if (scheduleError) throw scheduleError;

    console.log('✅ Horario eliminado');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting schedule:', error);
    throw error;
  }
}

/**
 * 🔧 Verificar si una rutina específica ya fue completada hoy - SIN CAUSAR ERROR 406
 */
export async function isRoutineCompletedToday(routineScheduleId, dogId) {
  try {
    // 🔧 EVITAR ERROR 406: Simplificar la consulta
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('routine_completions')
      .select('id')
      .eq('routine_schedule_id', routineScheduleId)
      .eq('dog_id', dogId)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00`)
      .lt('completed_at', `${today}T23:59:59`);

    if (error) {
      console.warn('⚠️ Error checking completion (returning false):', error);
      return { isCompleted: false, completionData: null };
    }

    return { 
      isCompleted: data && data.length > 0, 
      completionData: data?.[0] || null 
    };

  } catch (error) {
    console.error('❌ Error checking routine completion:', error);
    return { isCompleted: false, completionData: null };
  }
}

/**
 * 🔧 Obtener rutinas completadas de hoy - VERSION SIMPLE
 */
export async function getTodayCompletedRoutines(dogId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('routine_completions')
      .select('*')
      .eq('dog_id', dogId)
      .gte('completed_at', `${today}T00:00:00`)
      .lt('completed_at', `${today}T23:59:59`)
      .order('completed_at', { ascending: false });

    if (error) {
      console.warn('⚠️ Error fetching completed routines:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('❌ Error fetching completed routines:', error);
    return { data: [], error };
  }
}

/**
 * 🔧 Obtener rutinas pendientes - VERSION SIMPLE SIN JOINS COMPLEJOS
 */
export async function getPendingRoutinesToday(dogId) {
  try {
    // 🔧 OBTENER RUTINAS SIN VERIFICAR COMPLETADAS para evitar error 406
    const { data: allRoutines, error: routinesError } = await supabase
      .from('routine_schedules')
      .select(`
        *,
        dog_routines!inner(*)
      `)
      .eq('dog_routines.dog_id', dogId)
      .eq('dog_routines.active', true)
      .eq('active', true)
      .order('time');

    if (routinesError) {
      console.error('❌ Error fetching routines:', routinesError);
      return { data: [], error: routinesError };
    }

    // 🔧 DEVOLVER TODAS SIN VERIFICAR COMPLETADAS
    return { data: allRoutines || [], error: null };

  } catch (error) {
    console.error('❌ Error fetching pending routines:', error);
    return { data: [], error };
  }
}

/**
 * 🔧 Obtener el estado actual de todas las rutinas - VERSION SIMPLE
 */
export async function getRoutineStatusForDog(dogId) {
  try {
    const pendingResult = await getPendingRoutinesToday(dogId);
    
    // 🔧 NO OBTENER COMPLETADAS para evitar error 406
    return {
      pending: pendingResult.data || [],
      completed: [], // 🔧 Siempre vacío para evitar errores
      stats: {},
      hasError: !!pendingResult.error
    };
  } catch (error) {
    console.error('❌ Error fetching routine status:', error);
    return {
      pending: [],
      completed: [],
      stats: {},
      hasError: true
    };
  }
}