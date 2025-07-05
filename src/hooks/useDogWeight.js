// src/hooks/useDogWeight.js
// 📊 HOOK PERSONALIZADO PARA MANEJO DE PESO DE PERROS

import { useState, useEffect } from 'react';
import supabase from '../lib/supabase.js';

export const useDogWeight = (dogId) => {
  const [weightHistory, setWeightHistory] = useState([]);
  const [weightStats, setWeightStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // 📊 OBTENER ESTADÍSTICAS DE PESO
  // ============================================
  const fetchWeightStats = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!dogId) {
        setWeightStats(null);
        return;
      }

      // Usar la función SQL personalizada para obtener estadísticas
      const { data, error: rpcError } = await supabase
        .rpc('get_dog_weight_stats', { dog_id_param: dogId });

      if (rpcError) {
        console.error('Error obteniendo estadísticas de peso:', rpcError);
        throw rpcError;
      }

      const stats = data && data.length > 0 ? data[0] : null;
      setWeightStats(stats);

      console.log('📊 Estadísticas de peso obtenidas:', stats);
      
    } catch (err) {
      console.error('Error en fetchWeightStats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 📋 OBTENER HISTORIAL COMPLETO
  // ============================================
  const fetchWeightHistory = async () => {
    try {
      if (!dogId) {
        setWeightHistory([]);
        return;
      }

      const { data, error: historyError } = await supabase
        .from('dog_weight_history')
        .select(`
          id,
          weight,
          date_recorded,
          notes,
          location,
          measurement_method,
          previous_weight,
          weight_difference,
          is_initial_weight,
          recorded_by,
          created_at,
          profiles!dog_weight_history_recorded_by_fkey(full_name, role)
        `)
        .eq('dog_id', dogId)
        .order('date_recorded', { ascending: false });

      if (historyError) {
        console.error('Error obteniendo historial de peso:', historyError);
        throw historyError;
      }

      setWeightHistory(data || []);
      console.log('📋 Historial de peso obtenido:', data?.length || 0, 'registros');
      
    } catch (err) {
      console.error('Error en fetchWeightHistory:', err);
      setError(err.message);
    }
  };

  // ============================================
  // ➕ REGISTRAR NUEVO PESO
  // ============================================
  const addWeightRecord = async (weightData) => {
    try {
      setLoading(true);
      setError(null);

      // Validar datos requeridos
      if (!weightData.weight || !weightData.date_recorded) {
        throw new Error('Peso y fecha son requeridos');
      }

      if (weightData.weight <= 0 || weightData.weight > 100) {
        throw new Error('El peso debe estar entre 0.1 y 100 kg');
      }

      // Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const recordData = {
        dog_id: dogId,
        weight: parseFloat(weightData.weight),
        date_recorded: weightData.date_recorded,
        recorded_by: user.id,
        notes: weightData.notes || null,
        location: weightData.location || 'casa',
        measurement_method: weightData.measurement_method || 'balanza_casa'
      };

      console.log('📊 Registrando nuevo peso:', recordData);

      const { data, error: insertError } = await supabase
        .from('dog_weight_history')
        .insert(recordData)
        .select(`
          id,
          weight,
          date_recorded,
          notes,
          location,
          measurement_method,
          previous_weight,
          weight_difference,
          is_initial_weight,
          recorded_by,
          created_at,
          profiles!dog_weight_history_recorded_by_fkey(full_name, role)
        `)
        .single();

      if (insertError) {
        console.error('Error insertando peso:', insertError);
        throw insertError;
      }

      console.log('✅ Peso registrado exitosamente:', data);

      // Actualizar datos locales
      await Promise.all([
        fetchWeightStats(),
        fetchWeightHistory()
      ]);

      return { success: true, data };
      
    } catch (err) {
      console.error('Error en addWeightRecord:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🔄 ACTUALIZAR PESO EXISTENTE
  // ============================================
  const updateWeightRecord = async (recordId, updateData) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('dog_weight_history')
        .update({
          weight: updateData.weight ? parseFloat(updateData.weight) : undefined,
          notes: updateData.notes,
          location: updateData.location,
          measurement_method: updateData.measurement_method,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .select()
        .single();

      if (updateError) {
        console.error('Error actualizando peso:', updateError);
        throw updateError;
      }

      console.log('✅ Peso actualizado exitosamente:', data);

      // Actualizar datos locales
      await Promise.all([
        fetchWeightStats(),
        fetchWeightHistory()
      ]);

      return { success: true, data };
      
    } catch (err) {
      console.error('Error en updateWeightRecord:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🗑️ ELIMINAR REGISTRO DE PESO
  // ============================================
  const deleteWeightRecord = async (recordId) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('dog_weight_history')
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        console.error('Error eliminando peso:', deleteError);
        throw deleteError;
      }

      console.log('✅ Peso eliminado exitosamente');

      // Actualizar datos locales
      await Promise.all([
        fetchWeightStats(),
        fetchWeightHistory()
      ]);

      return { success: true };
      
    } catch (err) {
      console.error('Error en deleteWeightRecord:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 📊 UTILIDADES PARA ANÁLISIS
  // ============================================
  const getWeightTrend = () => {
    if (!weightStats) return null;

    const { weight_change, percentage_change, trend } = weightStats;
    
    return {
      direction: trend,
      change: weight_change,
      percentage: percentage_change,
      icon: trend === 'subiendo' ? '↗️' : trend === 'bajando' ? '↘️' : '➡️',
      color: trend === 'subiendo' ? 'text-green-600' : trend === 'bajando' ? 'text-red-600' : 'text-gray-600'
    };
  };

  const getWeightStatus = (dogSize) => {
    if (!weightStats) return null;

    const currentWeight = weightStats.current_weight;
    
    // Rangos ideales por tamaño
    const idealRanges = {
      'pequeño': { min: 1, max: 10 },
      'mediano': { min: 10, max: 25 },
      'grande': { min: 25, max: 45 },
      'gigante': { min: 45, max: 90 }
    };

    const range = idealRanges[dogSize] || idealRanges['mediano'];
    
    if (currentWeight < range.min) {
      return { status: 'bajo', color: 'text-orange-600', message: 'Peso por debajo del rango ideal' };
    } else if (currentWeight > range.max) {
      return { status: 'alto', color: 'text-red-600', message: 'Peso por encima del rango ideal' };
    } else {
      return { status: 'normal', color: 'text-green-600', message: 'Peso dentro del rango ideal' };
    }
  };

  const getRecentWeightData = (months = 6) => {
    if (!weightHistory.length) return [];

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    return weightHistory
      .filter(record => new Date(record.date_recorded) >= cutoffDate)
      .reverse(); // Ordenar cronológicamente para el gráfico
  };

  // ============================================
  // 🔄 EFFECTS
  // ============================================
  useEffect(() => {
    if (dogId) {
      Promise.all([
        fetchWeightStats(),
        fetchWeightHistory()
      ]);
    }
  }, [dogId]);

  // ============================================
  // 📤 RETORNO DEL HOOK
  // ============================================
  return {
    // Datos
    weightHistory,
    weightStats,
    loading,
    error,
    
    // Funciones
    addWeightRecord,
    updateWeightRecord,
    deleteWeightRecord,
    refreshData: () => Promise.all([fetchWeightStats(), fetchWeightHistory()]),
    
    // Utilidades
    getWeightTrend,
    getWeightStatus,
    getRecentWeightData,
    
    // Información derivada
    hasWeightHistory: weightHistory.length > 0,
    latestWeight: weightHistory.length > 0 ? weightHistory[0] : null,
    weightTrend: getWeightTrend(),
    chartData: getRecentWeightData()
  };
};