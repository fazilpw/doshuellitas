// src/pages/api/debug-data.js - DATOS DESDE EL SERVIDOR
export async function GET({ request }) {
  const url = new URL(request.url);
  const test = url.searchParams.get('test') || 'menu';
  
  const DOG_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // Max
  const USER_ID = '11111111-1111-1111-1111-111111111111'; // María
  
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  let result = {};
  let title = '';

  try {
    switch (test) {
      case 'dog':
        title = '🐕 Datos del Perro Max';
        const dogResponse = await fetch(`${supabaseUrl}/rest/v1/dogs?id=eq.${DOG_ID}&select=*,profiles!dogs_owner_id_fkey(full_name,email,role)`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!dogResponse.ok) {
          throw new Error(`Error ${dogResponse.status}: ${await dogResponse.text()}`);
        }
        
        const dogData = await dogResponse.json();
        result = {
          status: 'SUCCESS',
          found: dogData.length > 0,
          data: dogData[0] || null,
          total_dogs: dogData.length
        };
        break;

      case 'evaluations':
        title = '📊 Evaluaciones de Max';
        const evalResponse = await fetch(`${supabaseUrl}/rest/v1/evaluations?dog_id=eq.${DOG_ID}&select=*,profiles!evaluations_evaluator_id_fkey(full_name,email,role)&order=date.desc&limit=10`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!evalResponse.ok) {
          throw new Error(`Error ${evalResponse.status}: ${await evalResponse.text()}`);
        }
        
        const evalData = await evalResponse.json();
        result = {
          status: 'SUCCESS',
          total_evaluations: evalData.length,
          evaluations: evalData,
          casa_count: evalData.filter(e => e.location === 'casa').length,
          colegio_count: evalData.filter(e => e.location === 'colegio').length
        };
        break;

      case 'averages':
        title = '📈 Promedios de Max';
        // Primero obtener evaluaciones
        const avgResponse = await fetch(`${supabaseUrl}/rest/v1/evaluations?dog_id=eq.${DOG_ID}&select=energy_level,sociability_level,obedience_level,anxiety_level,location,date`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!avgResponse.ok) {
          throw new Error(`Error ${avgResponse.status}: ${await avgResponse.text()}`);
        }
        
        const avgData = await avgResponse.json();
        
        if (avgData.length === 0) {
          result = {
            status: 'NO_DATA',
            message: 'No hay evaluaciones para calcular promedios'
          };
        } else {
          const total = avgData.length;
          const avg = {
            energy: Math.round(avgData.reduce((sum, e) => sum + (e.energy_level || 0), 0) / total),
            sociability: Math.round(avgData.reduce((sum, e) => sum + (e.sociability_level || 0), 0) / total),
            obedience: Math.round(avgData.reduce((sum, e) => sum + (e.obedience_level || 0), 0) / total),
            anxiety: Math.round(avgData.reduce((sum, e) => sum + (e.anxiety_level || 0), 0) / total)
          };

          const percentages = {
            energy_percentage: Math.round((avg.energy / 10) * 100),
            sociability_percentage: Math.round((avg.sociability / 10) * 100),
            obedience_percentage: Math.round((avg.obedience / 10) * 100),
            anxiety_percentage: Math.round((avg.anxiety / 10) * 100)
          };

          result = {
            status: 'SUCCESS',
            total_evaluations: total,
            casa_evaluations: avgData.filter(e => e.location === 'casa').length,
            colegio_evaluations: avgData.filter(e => e.location === 'colegio').length,
            last_evaluation_date: avgData[0]?.date || null,
            raw_averages: avg,
            percentages: percentages,
            raw_data: avgData
          };
        }
        break;

      case 'all-dogs':
        title = '🐕‍🦺 Todos los Perros';
        const allDogsResponse = await fetch(`${supabaseUrl}/rest/v1/dogs?select=*,profiles!dogs_owner_id_fkey(full_name,email,role)&active=eq.true&order=name`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!allDogsResponse.ok) {
          throw new Error(`Error ${allDogsResponse.status}: ${await allDogsResponse.text()}`);
        }
        
        const allDogsData = await allDogsResponse.json();
        result = {
          status: 'SUCCESS',
          total_dogs: allDogsData.length,
          dogs: allDogsData.map(dog => ({
            id: dog.id,
            name: dog.name,
            breed: dog.breed,
            size: dog.size,
            age: dog.age,
            owner: dog.profiles?.full_name || 'Sin dueño'
          }))
        };
        break;

      case 'users':
        title = '👥 Usuarios del Sistema';
        const usersResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&order=created_at.desc`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!usersResponse.ok) {
          throw new Error(`Error ${usersResponse.status}: ${await usersResponse.text()}`);
        }
        
        const usersData = await usersResponse.json();
        result = {
          status: 'SUCCESS',
          total_users: usersData.length,
          users: usersData.map(user => ({
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            active: user.active
          })),
          by_role: {
            padre: usersData.filter(u => u.role === 'padre').length,
            profesor: usersData.filter(u => u.role === 'profesor').length,
            admin: usersData.filter(u => u.role === 'admin').length
          }
        };
        break;

      default:
        title = '📋 Menú de Tests';
        result = {
          status: 'MENU',
          available_tests: [
            { key: 'dog', name: '🐕 Ver datos de Max', desc: 'Información del perro Max' },
            { key: 'evaluations', name: '📊 Ver evaluaciones', desc: 'Últimas 10 evaluaciones de Max' },
            { key: 'averages', name: '📈 Calcular promedios', desc: 'Promedios y estadísticas de Max' },
            { key: 'all-dogs', name: '🐕‍🦺 Todos los perros', desc: 'Lista de todos los perros' },
            { key: 'users', name: '👥 Ver usuarios', desc: 'Lista de usuarios del sistema' }
          ],
          ids_de_prueba: {
            dog_id: DOG_ID,
            user_id: USER_ID
          }
        };
    }

  } catch (error) {
    result = {
      status: 'ERROR',
      error_message: error.message,
      error_type: error.constructor.name
    };
  }

  // HTML Response
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔍 ${title} - Club Canino</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .json-display {
      background: #0f172a;
      color: #10b981;
      font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .status-success { @apply bg-green-100 border-green-400 text-green-800; }
    .status-error { @apply bg-red-100 border-red-400 text-red-800; }
    .status-menu { @apply bg-blue-100 border-blue-400 text-blue-800; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  
  <div class="max-w-6xl mx-auto p-6">
    
    <!-- Header -->
    <div class="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white rounded-xl p-6 mb-6">
      <h1 class="text-3xl font-bold mb-2">${title}</h1>
      <p class="text-blue-100">Datos obtenidos directamente del servidor</p>
      <div class="mt-4 text-sm">
        <span class="bg-white/20 px-3 py-1 rounded-full">Test: ${test}</span>
        <span class="bg-white/20 px-3 py-1 rounded-full ml-2">Estado: ${result.status}</span>
      </div>
    </div>

    <!-- Quick Navigation -->
    ${test !== 'menu' ? `
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">🎯 Tests Disponibles</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <a href="/api/debug-data" class="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-center text-sm">
          📋 Menú
        </a>
        <a href="/api/debug-data?test=dog" class="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-center text-sm">
          🐕 Max
        </a>
        <a href="/api/debug-data?test=evaluations" class="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors text-center text-sm">
          📊 Evaluaciones
        </a>
        <a href="/api/debug-data?test=averages" class="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors text-center text-sm">
          📈 Promedios
        </a>
        <a href="/api/debug-data?test=all-dogs" class="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-center text-sm">
          🐕‍🦺 Todos
        </a>
        <a href="/api/debug-data?test=users" class="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition-colors text-center text-sm">
          👥 Usuarios
        </a>
      </div>
    </div>
    ` : ''}

    ${test === 'menu' ? `
    <!-- Menu Principal -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      ${result.available_tests?.map(t => `
        <a href="/api/debug-data?test=${t.key}" class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group">
          <div class="text-2xl mb-3">${t.name.split(' ')[0]}</div>
          <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#56CCF2]">${t.name.substring(2)}</h3>
          <p class="text-gray-600 text-sm">${t.desc}</p>
        </a>
      `).join('') || ''}
    </div>
    ` : ''}

    <!-- Results -->
    <div class="bg-white rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">📊 Resultado</h2>
      
      <!-- Status Badge -->
      <div class="mb-4">
        <span class="px-4 py-2 rounded-full text-sm font-medium status-${result.status.toLowerCase()}">
          ${result.status === 'SUCCESS' ? '✅ ÉXITO' : 
            result.status === 'ERROR' ? '❌ ERROR' : 
            result.status === 'NO_DATA' ? '⚠️ SIN DATOS' : 
            '📋 MENÚ'}
        </span>
      </div>
      
      <!-- Data Display -->
      <div class="json-display p-6 rounded-xl border border-gray-200 overflow-auto max-h-96">
${JSON.stringify(result, null, 2)}
      </div>
    </div>

    <!-- Next Steps -->
    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6">
      <h3 class="text-yellow-800 font-bold mb-3">🎯 ¿Qué hemos descubierto?</h3>
      <div class="text-yellow-700 space-y-2 text-sm">
        <p><strong>✅ Servidor:</strong> Supabase funciona perfectamente desde el servidor</p>
        <p><strong>❌ Cliente:</strong> El problema está en el JavaScript del navegador</p>
        <p><strong>🎯 Solución:</strong> Crear el modal usando datos del servidor (SSR) en lugar del cliente</p>
        <p><strong>📝 Próximo paso:</strong> Hacer una página de progreso usando estos datos</p>
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