// src/lib/supabase.js - VERSIÓN BUILD-SAFE
import { createClient } from '@supabase/supabase-js'

// ✅ CONFIGURACIÓN SEGURA PARA BUILD
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Verificar si está realmente configurado
const isConfigured = import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

let supabase;

if (isConfigured) {
  // ✅ Configuración real
  console.log('✅ Supabase configurado correctamente');
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    }
  });
} else {
  // ✅ Cliente dummy para modo demo (no falla el build)
  console.warn('⚠️ Supabase no configurado - funcionando en modo demo');
  
  supabase = {
    from: (table) => ({
      select: (query) => Promise.resolve({ 
        data: [], 
        error: { message: `Supabase no configurado - tabla: ${table}` } 
      }),
      insert: (data) => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase no configurado - no se puede insertar' } 
      }),
      update: (data) => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase no configurado - no se puede actualizar' } 
      }),
      delete: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase no configurado - no se puede eliminar' } 
      }),
      eq: function(column, value) {
        return {
          select: () => this.select(),
          single: () => Promise.resolve({ 
            data: null, 
            error: { message: 'Supabase no configurado' } 
          })
        };
      },
      single: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase no configurado' } 
      })
    })
  };
}

// ✅ FUNCIONES HELPER SEGURAS
export const db = {
  isConfigured: () => isConfigured,
  
  getUsers: () => {
    if (!isConfigured) {
      return Promise.resolve({ 
        data: [], 
        error: { message: 'Supabase no configurado' } 
      });
    }
    return supabase.from('users').select('*');
  },
  
  getDogs: () => {
    if (!isConfigured) {
      return Promise.resolve({ 
        data: [], 
        error: { message: 'Supabase no configurado' } 
      });
    }
    return supabase.from('dogs').select('*');
  },
  
  getEvaluations: () => {
    if (!isConfigured) {
      return Promise.resolve({ 
        data: [], 
        error: { message: 'Supabase no configurado' } 
      });
    }
    return supabase.from('evaluations').select(`
      *,
      dogs(name, breed),
      users!evaluations_evaluator_id_fkey(name, role)
    `);
  },
  
  createEvaluation: (evaluationData) => {
    if (!isConfigured) {
      console.warn('📝 Evaluación no guardada - Supabase no configurado:', evaluationData);
      return Promise.resolve({ 
        data: { ...evaluationData, id: Date.now() }, 
        error: null // ✅ No error para que la UI funcione
      });
    }
    return supabase
      .from('evaluations')
      .insert([evaluationData])
      .select()
      .single();
  }
};

// ✅ FUNCIÓN DE PRUEBA DE CONEXIÓN
export const testConnection = async () => {
  if (!isConfigured) {
    return { 
      success: false, 
      error: 'Variables de entorno no configuradas',
      needsConfig: true 
    };
  }
  
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Conexión exitosa' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ✅ LOG DE ESTADO
if (typeof window !== 'undefined') {
  // Solo en el cliente
  if (isConfigured) {
    console.log('🚀 Supabase listo para usar');
  } else {
    console.log(`
🎭 MODO DEMO ACTIVADO

⚠️  Supabase no configurado. Para habilitar todas las funcionalidades:

1️⃣  Ve a https://app.netlify.com
2️⃣  Selecciona tu sitio 
3️⃣  Ve a Site settings → Environment variables
4️⃣  Agrega estas variables:
    • PUBLIC_SUPABASE_URL
    • PUBLIC_SUPABASE_ANON_KEY
5️⃣  Redeploy el sitio

📍 Encuentra tus credenciales en: https://supabase.com/dashboard
    `);
  }
}

export { supabase };
export default supabase;