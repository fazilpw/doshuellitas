// src/lib/supabase.js - VERSIÓN CORREGIDA
import { createClient } from '@supabase/supabase-js'

// Función para obtener variables de entorno de forma segura
function getEnvVar(name) {
  const value = import.meta.env[name];
  if (!value) {
    console.error(`❌ Variable de entorno ${name} no configurada`);
    return null;
  }
  console.log(`✅ Variable ${name} configurada correctamente`);
  return value;
}

// Obtener variables de entorno
const supabaseUrl = getEnvVar('PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('PUBLIC_SUPABASE_ANON_KEY');

// Validar configuración
if (!supabaseUrl || !supabaseKey) {
  console.error(`
🚨 ERROR DE CONFIGURACIÓN SUPABASE:

1. Crea un archivo .env en la raíz del proyecto
2. Agrega tus credenciales de Supabase:

PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima

3. Reinicia el servidor de desarrollo

📍 Encuentra tus credenciales en: https://supabase.com/dashboard/project/[tu-proyecto]/settings/api
  `);
  throw new Error('❌ Configuración de Supabase incompleta');
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Por ahora no persistimos sesiones
  }
});

// Función de prueba CORREGIDA
export const testConnection = async () => {
  console.log('🧪 Iniciando prueba de conexión a Supabase...');
  
  try {
    // ✅ CONSULTA CORREGIDA - ya no usar count(*)
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(5);
    
    if (error) {
      console.log('⚠️ Error en consulta:', error.message);
      
      // Si la tabla no existe, aún podemos confirmar que la conexión funciona
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
  
  try {
    const tables = ['users', 'dogs', 'evaluations'];
    const results = {};
    
    for (const table of tables) {
      try {
        // ✅ CONSULTA SIMPLE SIN COUNT
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

// Funciones utilitarias MEJORADAS
export const db = {
  // ✅ USUARIOS - consultas simplificadas
  getUsers: () => supabase.from('users').select('*'),
  getUserById: (id) => supabase.from('users').select('*').eq('id', id).single(),
  getUserByEmail: (email) => supabase.from('users').select('*').eq('email', email).single(),
  
  // ✅ PERROS - consultas con joins
  getDogs: () => supabase.from('dogs').select(`
    *,
    users!dogs_owner_id_fkey(name, phone)
  `),
  getDogsByOwner: (ownerId) => supabase.from('dogs').select(`
    *,
    users!dogs_owner_id_fkey(name, phone)
  `).eq('owner_id', ownerId),
  
  // ✅ EVALUACIONES - consultas completas
  getEvaluations: () => supabase.from('evaluations').select(`
    *,
    dogs(name, breed),
    users!evaluations_evaluator_id_fkey(name, role)
  `),
  getEvaluationsByDog: (dogId) => supabase.from('evaluations').select(`
    *,
    dogs(name, breed),
    users!evaluations_evaluator_id_fkey(name, role)
  `).eq('dog_id', dogId).order('date', { ascending: false }),
  
  // ✅ EVALUACIONES DE HOY
  getTodayEvaluations: () => {
    const today = new Date().toISOString().split('T')[0];
    return supabase.from('evaluations').select(`
      *,
      dogs(name, breed),
      users!evaluations_evaluator_id_fkey(name, role)
    `).eq('date', today);
  },
  
  // ✅ CREAR EVALUACIÓN
  createEvaluation: (evaluationData) => supabase
    .from('evaluations')
    .insert([evaluationData])
    .select(`
      *,
      dogs(name, breed),
      users!evaluations_evaluator_id_fkey(name, role)
    `)
    .single()
}

// ✅ FUNCIÓN DE PRUEBA COMPLETA
export const runFullTest = async () => {
  console.log('🚀 Ejecutando prueba completa...');
  
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
console.log('🚀 Supabase configurado y listo');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);

export default supabase;