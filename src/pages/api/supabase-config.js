// src/pages/api/supabase-config.js
// Endpoint para obtener la configuración correcta de Supabase

export async function GET({ request }) {
  try {
    // Obtener las variables de entorno correctas
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    // Verificar que las variables estén configuradas
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        error: 'Variables de entorno de Supabase no configuradas',
        missing: {
          url: !supabaseUrl,
          key: !supabaseAnonKey
        }
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Devolver la configuración correcta
    return new Response(JSON.stringify({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      timestamp: new Date().toISOString(),
      source: 'environment_variables'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}