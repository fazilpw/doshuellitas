// src/lib/supabase.js - VERSIÓN CORREGIDA PARA BUILD
import { createClient } from '@supabase/supabase-js'

// Función para obtener variables de entorno de forma segura
function getEnvVar(name) {
  const value = import.meta.env[name];
  if (!value) {
    console.warn(`⚠️ Variable de entorno ${name} no configurada`);
    return null;
  }
  console.log(`✅ Variable ${name} configurada correctamente`);
  return value;
}

// Obtener variables de entorno
const supabaseUrl = getEnvVar('PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('PUBLIC_SUPABASE_ANON_KEY');

// ✅ CAMBIO CRÍTICO: No hacer throw durante el build
let supabase = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn(`
⚠️ CONFIGURACIÓN DE SUPABASE FALTANTE:

Variables de entorno requeridas:
- PUBLIC_SUPABASE_URL
- PUBLIC_SUPABASE_ANON_KEY

Para configurar en Netlify:
1. Ve a Site settings > Environment variables
2. Agrega las variables con tus credenciales de Supabase

📍 Encuentra tus credenciales en: https://supabase.com/dashboard/project/[tu-proyecto]/settings/api
  `);
  
  // ✅ Crear cliente dummy para evitar errores
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } }),
      insert: () => Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } }),
      update: () => Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } }),
      delete: () => Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } }),
      single: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }) })
    })
  };
} else {
  // Crear cliente de Supabase real
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // Por ahora no persistimos sesiones
    }
  });
}

// Función de prueba CORREGIDA
export const testConnection = async () => {
  console.log('🧪 Iniciando prueba de conexión a Supabase...');
  
  if (!supabaseUrl || !supabaseKey) {
    return { 
      success: false, 
      message: 'Variables de entorno no configuradas',
      needsConfig: true 
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(5);
    
    if (error) {
      console.log('⚠️ Error en consulta:', error.message);
      
      if (error.message.includes('relation "users" does not exist')) {
        console.log('✅ Conexión a Supabase OK (tabla users no existe aún)');
        return { success: true, message: 'Conexión OK, tablas por crear' };
      }
      
      throw error;
    }
    
    console.log('✅ Supabase conectado correctamente');
    console.log('📊 Usuarios encontrados:', data?.length || 0);
    
    return { success: true, message: 'Conexión exitosa', data };
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return { 
      success: false, 
      message: error.message || 'Error desconocido',
      error 
    };
  }
}

// Función para verificar tablas CORREGIDA
export const setupDatabase = async () => {
  console.log('🏗️ Verificando base de datos...');
  
  if (!supabaseUrl || !supabaseKey) {
    return { error: 'Supabase no configurado' };
  }
  
  try {
    const tables = ['users', 'dogs', 'evaluations'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          results[table] = `❌ ${error.message}`;
        } else {
          results[table] = `✅ Existe y funciona (${data?.length || 0} registros)`;
        }
      } catch (err) {
        results[table] = `❌ ${err.message}`;
      }
    }
    
    console.log('📋 Estado de las tablas:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
    throw error;
  }
}

// ✅ Funciones utilitarias que funcionan con o sin Supabase
export const db = {
  // Función helper para verificar si Supabase está configurado
  isConfigured: () => !!(supabaseUrl && supabaseKey),
  
  // ✅ USUARIOS - consultas con manejo de errores
  getUsers: () => {
    if (!db.isConfigured()) {
      return Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } });
    }
    return supabase.from('users').select('*');
  },
  
  getUserById: (id) => {
    if (!db.isConfigured()) {
      return Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } });
    }
    return supabase.from('users').select('*').eq('id', id).single();
  },
  
  getUserByEmail: (email) => {
    if (!db.isConfigured()) {
      return Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } });
    }
    return supabase.from('users').select('*').eq('email', email).single();
  },
  
  // ✅ PERROS - consultas con joins
  getDogs: () => {
    if (!db.isConfigured()) {
      return Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } });
    }
    return supabase.from('dogs').select(`
      *,
      users!dogs_owner_id_fkey(name, phone)
    `);
  },
  
  getDogsByOwner: (ownerId) => {
    if (!db.isConfigured()) {
      return Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } });
    }
    return supabase.from('dogs').select(`
      *,
      users!dogs_owner_id_fkey(name, phone)
    `).eq('owner_id', ownerId);
  },
  
  // ✅ EVALUACIONES - consultas completas
  getEvaluations: () => {
    if (!db.isConfigured()) {
      return Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } });
    }
    return supabase.from('evaluations').select(`
      *,
      dogs(name, breed),
      users!evaluations_evaluator_id_fkey(name, role)
    `);
  },
  
  getEvaluationsByDog: (dogId) => {
    if (!db.isConfigured()) {
      return Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } });
    }
    return supabase.from('evaluations').select(`
      *,
      dogs(name, breed),
      users!evaluations_evaluator_id_fkey(name, role)
    `).eq('dog_id', dogId).order('date', { ascending: false });
  },
  
  // ✅ EVALUACIONES DE HOY
  getTodayEvaluations: () => {
    if (!db.isConfigured()) {
      return Promise.resolve({ data: [], error: { message: 'Supabase no configurado' } });
    }
    const today = new Date().toISOString().split('T')[0];
    return supabase.from('evaluations').select(`
      *,
      dogs(name, breed),
      users!evaluations_evaluator_id_fkey(name, role)
    `).eq('date', today);
  },
  
  // ✅ CREAR EVALUACIÓN
  createEvaluation: (evaluationData) => {
    if (!db.isConfigured()) {
      return Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase no configurado - evaluación no guardada' } 
      });
    }
    return supabase
      .from('evaluations')
      .insert([evaluationData])
      .select(`
        *,
        dogs(name, breed),
        users!evaluations_evaluator_id_fkey(name, role)
      `)
      .single();
  }
}

// ✅ FUNCIÓN DE PRUEBA COMPLETA
export const runFullTest = async () => {
  console.log('🚀 Ejecutando prueba completa...');
  
  if (!db.isConfigured()) {
    return { 
      error: 'Supabase no configurado',
      needsConfig: true,
      instructions: 'Configura las variables de entorno en Netlify'
    };
  }
  
  try {
    // Probar conexión
    const connectionTest = await testConnection();
    console.log('Conexión:', connectionTest.success ? '✅' : '❌');
    
    // Verificar tablas
    const tableResults = await setupDatabase();
    
    // Probar consultas básicas
    const { data: users } = await db.getUsers();
    const { data: dogs } = await db.getDogs();
    const { data: evaluations } = await db.getEvaluations();
    
    const summary = {
      connection: connectionTest.success,
      tables: tableResults,
      data: {
        users: users?.length || 0,
        dogs: dogs?.length || 0,
        evaluations: evaluations?.length || 0
      }
    };
    
    console.log('📊 Resumen completo:', summary);
    return summary;
    
  } catch (error) {
    console.error('❌ Error en prueba completa:', error);
    return { error: error.message };
  }
}

// Log de inicialización
if (supabaseUrl && supabaseKey) {
  console.log('🚀 Supabase configurado y listo');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
} else {
  console.log('⚠️ Supabase no configurado - funcionando en modo demo');
}

export { supabase };
export default supabase;