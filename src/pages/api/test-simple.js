// src/pages/api/test-simple.js - TEST SIN SUPABASE
export async function GET({ request }) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'env';

  let result = {};

  try {
    switch (action) {
      case 'env':
        // Verificar variables de entorno
        result = {
          status: 'SUCCESS',
          env_check: {
            supabase_url: import.meta.env.PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
            supabase_key: import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING',
            mode: import.meta.env.MODE,
            dev: import.meta.env.DEV
          },
          actual_values: {
            url: import.meta.env.PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
            key: import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
          }
        };
        break;

      case 'network':
        // Test básico de red
        try {
          const response = await fetch('https://httpbin.org/get');
          const data = await response.json();
          result = {
            status: 'NETWORK_OK',
            test_url: 'https://httpbin.org/get',
            response_ok: response.ok,
            origin: data.origin
          };
        } catch (error) {
          result = {
            status: 'NETWORK_ERROR',
            error: error.message
          };
        }
        break;

      case 'supabase-direct':
        // Test directo a Supabase (servidor)
        const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
        const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          result = {
            status: 'ENV_MISSING',
            message: 'Variables de entorno de Supabase no encontradas'
          };
          break;
        }

        try {
          // Test manual sin SDK
          const testResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          });

          result = {
            status: testResponse.ok ? 'SUPABASE_OK' : 'SUPABASE_ERROR',
            response_status: testResponse.status,
            response_headers: Object.fromEntries(testResponse.headers.entries()),
            url_tested: `${supabaseUrl}/rest/v1/profiles`
          };

          if (testResponse.ok) {
            const data = await testResponse.text();
            result.data_preview = data.substring(0, 200);
          } else {
            const errorText = await testResponse.text();
            result.error_response = errorText;
          }

        } catch (error) {
          result = {
            status: 'FETCH_ERROR',
            error: error.message,
            error_type: error.constructor.name
          };
        }
        break;

      default:
        result = {
          status: 'INVALID_ACTION',
          available_actions: ['env', 'network', 'supabase-direct']
        };
    }

  } catch (error) {
    result = {
      status: 'SERVER_ERROR',
      error: error.message,
      stack: error.stack
    };
  }

  // HTML Response
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔧 Test Básico - Club Canino</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
  
  <div class="max-w-4xl mx-auto p-6">
    
    <!-- Header -->
    <div class="bg-blue-500 text-white rounded-lg p-6 mb-6">
      <h1 class="text-3xl font-bold mb-2">🔧 Test Básico</h1>
      <p class="text-blue-100">Diagnóstico sin dependencias externas</p>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">🎯 Tests Disponibles</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <a href="/api/test-simple?action=env" 
           class="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors text-center">
          🌍 Variables Entorno
        </a>
        
        <a href="/api/test-simple?action=network" 
           class="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors text-center">
          🌐 Test Red
        </a>
        
        <a href="/api/test-simple?action=supabase-direct" 
           class="bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition-colors text-center">
          🚀 Test Supabase Directo
        </a>
      </div>
    </div>

    <!-- Results -->
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">📊 Resultado: ${action}</h2>
      
      <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto">
        <pre>${JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>

    <!-- Next Steps -->
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
      <h3 class="text-yellow-800 font-bold mb-2">🎯 Próximos Pasos</h3>
      <div class="text-yellow-700 space-y-2">
        <p><strong>1.</strong> Ejecuta "Variables Entorno" para verificar configuración</p>
        <p><strong>2.</strong> Ejecuta "Test Red" para verificar conectividad</p>
        <p><strong>3.</strong> Ejecuta "Test Supabase Directo" para verificar BD</p>
      </div>
    </div>

  </div>

</body>
</html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}