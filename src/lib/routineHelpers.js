// src/lib/routineHelpers.js - SISTEMA COMPLETO DE RUTINAS COMPLETADAS
import supabase from './supabase.js';

// ============================================
// 🎯 FUNCIONES PARA RUTINAS COMPLETADAS
// ============================================

/**
 * Marcar una rutina como completada
 */
export async function markRoutineAsCompleted(routineScheduleId, dogId, userId, notes = '') {
  try {
    const completionData = {
      routine_schedule_id: routineScheduleId,
      dog_id: dogId,
      user_id: userId,
      completed_at: new Date().toISOString(),
      notes: notes || null,
      status: 'completed'
    };

    // Verificar si ya existe una completación para hoy
    const today = new Date().toISOString().split('T')[0];
    const { data: existingCompletion, error: checkError } = await supabase
      .from('routine_completions')
      .select('*')
      .eq('routine_schedule_id', routineScheduleId)
      .eq('dog_id', dogId)
      .gte('completed_at', `${today}T00:00:00`)
      .lt('completed_at', `${today}T23:59:59`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw checkError;
    }

    if (existingCompletion) {
      // Actualizar completación existente
      const { data, error } = await supabase
        .from('routine_completions')
        .update({
          completed_at: new Date().toISOString(),
          notes: notes || existingCompletion.notes,
          status: 'completed'
        })
        .eq('id', existingCompletion.id)
        .select()
        .single();

      if (error) throw error;
      return { data, isUpdate: true };
    } else {
      // Crear nueva completación
      const { data, error } = await supabase
        .from('routine_completions')
        .insert([completionData])
        .select()
        .single();

      if (error) throw error;
      return { data, isUpdate: false };
    }
  } catch (error) {
    console.error('Error marking routine as completed:', error);
    throw error;
  }
}

/**
 * Posponer una rutina (snooze)
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

    // Verificar si ya existe un snooze para hoy
    const today = new Date().toISOString().split('T')[0];
    const { data: existingSnooze, error: checkError } = await supabase
      .from('routine_completions')
      .select('*')
      .eq('routine_schedule_id', routineScheduleId)
      .eq('dog_id', dogId)
      .eq('status', 'snoozed')
      .gte('created_at', `${today}T00:00:00`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingSnooze) {
      // Actualizar snooze existente
      const { data, error } = await supabase
        .from('routine_completions')
        .update({
          snoozed_until: snoozeData.snoozed_until,
          snooze_count: (existingSnooze.snooze_count || 0) + 1
        })
        .eq('id', existingSnooze.id)
        .select()
        .single();

      if (error) throw error;
      return { data, isUpdate: true };
    } else {
      // Crear nuevo snooze
      const { data, error } = await supabase
        .from('routine_completions')
        .insert([snoozeData])
        .select()
        .single();

      if (error) throw error;
      return { data, isUpdate: false };
    }
  } catch (error) {
    console.error('Error snoozing routine:', error);
    throw error;
  }
}

/**
 * Obtener rutinas completadas de hoy para un perro
 */
export async function getTodayCompletedRoutines(dogId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('routine_completions')
      .select(`
        *,
        routine_schedules!inner(
          *,
          dog_routines!inner(*)
        )
      `)
      .eq('dog_id', dogId)
      .gte('completed_at', `${today}T00:00:00`)
      .lt('completed_at', `${today}T23:59:59`)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching completed routines:', error);
    return { data: [], error };
  }
}

/**
 * Obtener estadísticas de completación para un perro
 */
export async function getRoutineCompletionStats(dogId, days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('routine_completions')
      .select(`
        *,
        routine_schedules!inner(
          *,
          dog_routines!inner(routine_category, name)
        )
      `)
      .eq('dog_id', dogId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .order('completed_at', { ascending: false });

    if (error) throw error;

    // Calcular estadísticas
    const totalCompleted = data?.length || 0;
    const byCategory = {};
    const byDay = {};

    data?.forEach(completion => {
      const category = completion.routine_schedules.dog_routines.routine_category;
      const day = completion.completed_at.split('T')[0];

      // Por categoría
      byCategory[category] = (byCategory[category] || 0) + 1;

      // Por día
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return {
      data: {
        totalCompleted,
        byCategory,
        byDay,
        completionRate: totalCompleted / (days * 4), // Asumiendo 4 rutinas promedio por día
        rawData: data
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching completion stats:', error);
    return { data: null, error };
  }
}

/**
 * Verificar si una rutina específica ya fue completada hoy
 */
export async function isRoutineCompletedToday(routineScheduleId, dogId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('routine_completions')
      .select('id, completed_at, status')
      .eq('routine_schedule_id', routineScheduleId)
      .eq('dog_id', dogId)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00`)
      .lt('completed_at', `${today}T23:59:59`)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { isCompleted: !!data, completionData: data };
  } catch (error) {
    console.error('Error checking routine completion:', error);
    return { isCompleted: false, completionData: null };
  }
}

/**
 * Obtener rutinas pendientes (no completadas) para hoy
 */
export async function getPendingRoutinesToday(dogId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Obtener todas las rutinas programadas para el perro
    const { data: allRoutines, error: routinesError } = await supabase
      .from('routine_schedules')
      .select(`
        *,
        dog_routines!inner(
          *
        )
      `)
      .eq('dog_routines.dog_id', dogId)
      .eq('dog_routines.active', true)
      .eq('active', true)
      .order('time');

    if (routinesError) throw routinesError;

    // Obtener completaciones de hoy
    const { data: completions, error: completionsError } = await supabase
      .from('routine_completions')
      .select('routine_schedule_id')
      .eq('dog_id', dogId)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00`)
      .lt('completed_at', `${today}T23:59:59`);

    if (completionsError) throw completionsError;

    // Filtrar rutinas pendientes
    const completedIds = new Set(completions?.map(c => c.routine_schedule_id) || []);
    const pendingRoutines = allRoutines?.filter(routine => 
      !completedIds.has(routine.id)
    ) || [];

    return { data: pendingRoutines, error: null };
  } catch (error) {
    console.error('Error fetching pending routines:', error);
    return { data: [], error };
  }
}

// ============================================
// 🔄 FUNCIONES DE ESTADO DE RUTINAS
// ============================================

/**
 * Obtener el estado actual de todas las rutinas para un perro
 */
export async function getRoutineStatusForDog(dogId) {
  try {
    const [pendingResult, completedResult, statsResult] = await Promise.all([
      getPendingRoutinesToday(dogId),
      getTodayCompletedRoutines(dogId),
      getRoutineCompletionStats(dogId, 7)
    ]);

    return {
      pending: pendingResult.data || [],
      completed: completedResult.data || [],
      stats: statsResult.data || {},
      hasError: !!(pendingResult.error || completedResult.error || statsResult.error)
    };
  } catch (error) {
    console.error('Error fetching routine status:', error);
    return {
      pending: [],
      completed: [],
      stats: {},
      hasError: true
    };
  }
}