// src/test-supabase.js
import { supabase } from './lib/supabase.js'

async function testSupabase() {
  console.log('🧪 Probando conexión a Supabase...')
  
  try {
    // Probar consulta simple
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
    
    if (error) {
      console.error('❌ Error:', error)
    } else {
      console.log('✅ Usuarios encontrados:', users.length)
      console.log('👤 Primer usuario:', users[0])
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error)
  }
}

// Ejecutar prueba
testSupabase()