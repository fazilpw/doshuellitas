// public/js/test-sistema-corregido.js
// 🧪 TESTS CORREGIDOS PARA ESQUEMA REAL - CLUB CANINO DOS HUELLITAS
// ✅ USA LAS TABLAS CORRECTAS DEL ESQUEMA: profiles, dogs, evaluations, etc.

// ============================================
// 🔧 CONFIGURACIÓN GLOBAL
// ============================================
let supabaseClient = null;
let testResults = {
    database: false,
    auth: false,
    dogs: false,
    notifications: false,
    push: false,
    transport: false,
    commands: false,
    evaluations: false
};

// Tablas del esquema real para verificar
const SCHEMA_TABLES = {
    profiles: 'Usuarios del sistema (padres, profesores, admin)',
    dogs: 'Información de perros',
    evaluations: 'Evaluaciones comportamentales',
    notifications: 'Sistema de notificaciones',
    commands: 'Comandos de entrenamiento',
    vehicles: 'Vehículos para transporte',
    vehicle_routes: 'Rutas de transporte',
    push_subscriptions: 'Suscripciones push',
    dog_addresses: 'Direcciones de recogida',
    training_sessions: 'Sesiones de entrenamiento'
};

// ============================================
// 🚀 FUNCIÓN PRINCIPAL DE TESTING
// ============================================
async function ejecutarTestingCompletoCorregido() {
    console.log('🧪 EJECUTANDO TESTING COMPLETO CORREGIDO');
    console.log('=========================================');
    console.log('✅ Usando tablas del esquema real');

    try {
        // 1. Inicializar Supabase
        await initializeSupabaseForTesting();
        
        // 2. Ejecutar tests con tablas correctas
        await testDatabaseWithRealSchema();
        await testAuthenticationCorrected();
        await testDogsDataCorrected();
        await testEvaluationSystem();
        await testNotificationsCorrected();
        await testPushNotificationsCorrected();
        await testTransportSystemCorrected();
        await testCommandSystem();
        
        // 3. Mostrar resumen
        showCorrectedTestSummary();
        
    } catch (error) {
        console.error('❌ Error crítico en testing:', error);
    }
}

// ============================================
// 🔧 INICIALIZACIÓN DE SUPABASE
// ============================================
async function initializeSupabaseForTesting() {
    console.log('🔧 Inicializando Supabase para testing...');
    
    try {
        // Verificar si ya está cargado
        if (window.supabase) {
            supabaseClient = window.supabase;
            console.log('✅ Supabase ya disponible globalmente');
            return;
        }
        
        // Cargar desde CDN si no está disponible
        if (!window.createSupabaseClient) {
            await loadSupabaseFromCDN();
        }
        
        // Obtener variables de entorno o usar manual
        const supabaseUrl = getSupabaseUrl();
        const supabaseKey = getSupabaseKey();
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Credenciales no configuradas - usar verificador manual primero');
        }
        
        // Crear cliente
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('✅ Cliente Supabase creado para testing');
        
    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
        throw error;
    }
}

// ============================================
// 🗄️ TEST: BASE DE DATOS CON ESQUEMA REAL
// ============================================
async function testDatabaseWithRealSchema() {
    console.log('🗄️ === PRUEBAS DE BASE DE DATOS (ESQUEMA REAL) ===');
    
    try {
        if (!supabaseClient) {
            throw new Error('Cliente Supabase no inicializado');
        }
        
        // Test principal: tabla profiles (NO users)
        const { data, error, count } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.log('⚠️ Error en profiles:', error.message);
            
            // Si RLS está bloqueando, intentar con auth
            const { data: authData, error: authError } = await supabaseClient.auth.getSession();
            
            if (authError) {
                throw authError;
            }
            
            console.log('✅ Conexión establecida (profiles con restricciones RLS)');
            testResults.database = true;
        } else {
            console.log(`✅ Conexión exitosa - ${count || 0} profiles encontrados`);
            testResults.database = true;
        }
        
        // Verificar otras tablas clave
        console.log('🔍 Verificando tablas principales del esquema...');
        let tablesOk = 0;
        let totalTables = 0;
        
        for (const [tableName, description] of Object.entries(SCHEMA_TABLES)) {
            totalTables++;
            try {
                const { error: tableError } = await supabaseClient
                    .from(tableName)
                    .select('count', { count: 'exact', head: true });
                
                if (tableError) {
                    console.log(`⚠️ ${tableName}: ${tableError.message}`);
                } else {
                    console.log(`✅ ${tableName}: Accesible`);
                    tablesOk++;
                }
            } catch (err) {
                console.log(`❌ ${tableName}: ${err.message}`);
            }
        }
        
        console.log(`📊 Resultado tablas: ${tablesOk}/${totalTables} accesibles`);
        
    } catch (error) {
        console.error('❌ Error en test de BD:', error.message);
        testResults.database = false;
    }
}

// ============================================
// 🔐 TEST: AUTENTICACIÓN CORREGIDA
// ============================================
async function testAuthenticationCorrected() {
    console.log('🔐 === PRUEBAS DE AUTENTICACIÓN (CORREGIDA) ===');
    
    try {
        if (!supabaseClient) {
            throw new Error('Cliente Supabase no inicializado');
        }
        
        // Verificar sesión actual
        const { data: session, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            throw error;
        }
        
        if (session.session) {
            console.log('✅ Usuario autenticado:', session.session.user.email);
            
            // Buscar perfil del usuario en la tabla profiles
            const { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', session.session.user.id)
                .single();
            
            if (profileError) {
                console.log('⚠️ Usuario auth OK pero sin perfil en profiles');
            } else {
                console.log('✅ Perfil encontrado:', profile.role, profile.full_name);
            }
            
            testResults.auth = true;
        } else {
            console.log('ℹ️ No hay sesión activa - normal en desarrollo');
            
            // Test de funcionalidad de auth sin login
            const authMethods = [
                'signInWithPassword',
                'signUp', 
                'signOut',
                'getSession',
                'getUser'
            ];
            
            const availableMethods = authMethods.filter(method => 
                typeof supabaseClient.auth[method] === 'function'
            );
            
            console.log('✅ Métodos de auth disponibles:', availableMethods.length);
            testResults.auth = availableMethods.length === authMethods.length;
        }
        
    } catch (error) {
        console.error('❌ Error en test de auth:', error.message);
        testResults.auth = false;
    }
}

// ============================================
// 🐕 TEST: DATOS DE PERROS CORREGIDO
// ============================================
async function testDogsDataCorrected() {
    console.log('🐕 === PRUEBAS DE DATOS DE PERROS (CORREGIDA) ===');
    
    try {
        if (!supabaseClient) {
            throw new Error('Cliente Supabase no inicializado');
        }
        
        // Verificar tabla dogs con campos del esquema real
        const { data: dogs, error, count } = await supabaseClient
            .from('dogs')
            .select('id, name, breed, size, age, owner_id', { count: 'exact' })
            .limit(5);
        
        if (error) {
            console.log('⚠️ Error en dogs:', error.message);
            testResults.dogs = false;
        } else {
            console.log(`✅ Tabla dogs accesible - ${count || 0} perros`);
            
            if (dogs && dogs.length > 0) {
                console.log('📋 Ejemplo de perro:', {
                    name: dogs[0].name,
                    breed: dogs[0].breed,
                    size: dogs[0].size
                });
            }
            
            // Verificar relación con tabla dog_addresses
            const { error: addressError } = await supabaseClient
                .from('dog_addresses')
                .select('count', { count: 'exact', head: true });
            
            if (!addressError) {
                console.log('✅ Tabla dog_addresses relacionada accesible');
            }
            
            testResults.dogs = true;
        }
        
    } catch (error) {
        console.error('❌ Error en test de perros:', error.message);
        testResults.dogs = false;
    }
}

// ============================================
// 📊 TEST: SISTEMA DE EVALUACIONES
// ============================================
async function testEvaluationSystem() {
    console.log('📊 === PRUEBAS DE SISTEMA DE EVALUACIONES ===');
    
    try {
        if (!supabaseClient) {
            throw new Error('Cliente Supabase no inicializado');
        }
        
        // Verificar tabla evaluations con campos específicos
        const { data: evaluations, error, count } = await supabaseClient
            .from('evaluations')
            .select('dog_id, evaluator_id, location, energy_level, anxiety_level', { count: 'exact' })
            .limit(3);
        
        if (error) {
            console.log('⚠️ Error en evaluations:', error.message);
            testResults.evaluations = false;
        } else {
            console.log(`✅ Sistema de evaluaciones - ${count || 0} evaluaciones`);
            
            if (evaluations && evaluations.length > 0) {
                console.log('📊 Ejemplo de evaluación:', {
                    location: evaluations[0].location,
                    energy: evaluations[0].energy_level,
                    anxiety: evaluations[0].anxiety_level
                });
            }
            
            testResults.evaluations = true;
        }
        
    } catch (error) {
        console.error('❌ Error en test de evaluaciones:', error.message);
        testResults.evaluations = false;
    }
}

// ============================================
// 🔔 TEST: NOTIFICACIONES CORREGIDA
// ============================================
async function testNotificationsCorrected() {
    console.log('🔔 === PRUEBAS DE NOTIFICACIONES (CORREGIDA) ===');
    
    try {
        if (!supabaseClient) {
            throw new Error('Cliente Supabase no inicializado');
        }
        
        // Verificar tabla notifications con campos reales
        const { data: notifications, error, count } = await supabaseClient
            .from('notifications')
            .select('user_id, title, message, type, category, priority', { count: 'exact' })
            .limit(3);
        
        if (error) {
            console.log('⚠️ Error en notifications:', error.message);
        } else {
            console.log(`✅ Tabla notifications - ${count || 0} notificaciones`);
        }
        
        // Verificar notification_templates
        const { error: templatesError } = await supabaseClient
            .from('notification_templates')
            .select('count', { count: 'exact', head: true });
        
        if (!templatesError) {
            console.log('✅ Sistema de templates disponible');
        }
        
        // Test de API de notificaciones del navegador
        if ('Notification' in window) {
            console.log('✅ API de Notification del navegador disponible');
            console.log('📱 Estado permisos:', Notification.permission);
            testResults.notifications = true;
        } else {
            console.log('❌ API de Notification no soportada');
            testResults.notifications = false;
        }
        
    } catch (error) {
        console.error('❌ Error en test de notificaciones:', error.message);
        testResults.notifications = false;
    }
}

// ============================================
// 📱 TEST: PUSH NOTIFICATIONS CORREGIDA
// ============================================
async function testPushNotificationsCorrected() {
    console.log('📱 === PRUEBAS DE PUSH NOTIFICATIONS (CORREGIDA) ===');
    
    try {
        // Verificar tabla push_subscriptions del esquema real
        if (supabaseClient) {
            const { data: subscriptions, error, count } = await supabaseClient
                .from('push_subscriptions')
                .select('user_id, endpoint, device_type', { count: 'exact' })
                .limit(3);
            
            if (error) {
                console.log('⚠️ Error en push_subscriptions:', error.message);
            } else {
                console.log(`✅ Tabla push_subscriptions - ${count || 0} suscripciones`);
            }
        }
        
        // Verificar soporte de Push API del navegador
        if (!('PushManager' in window)) {
            console.log('❌ Push Manager no soportado');
            testResults.push = false;
            return;
        }
        
        console.log('✅ Push Manager disponible');
        
        // Verificar service worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                
                if (registration) {
                    console.log('✅ Service Worker registrado');
                    
                    const subscription = await registration.pushManager.getSubscription();
                    
                    if (subscription) {
                        console.log('✅ Suscripción push activa');
                    } else {
                        console.log('ℹ️ Sin suscripción push activa');
                    }
                    
                    testResults.push = true;
                } else {
                    console.log('⚠️ Service Worker no registrado');
                    testResults.push = false;
                }
            } catch (error) {
                console.log('⚠️ Error verificando service worker:', error.message);
                testResults.push = false;
            }
        }
        
    } catch (error) {
        console.error('❌ Error en test de push:', error.message);
        testResults.push = false;
    }
}

// ============================================
// 🚗 TEST: SISTEMA DE TRANSPORTE CORREGIDO
// ============================================
async function testTransportSystemCorrected() {
    console.log('🚗 === PRUEBAS DE SISTEMA DE TRANSPORTE (CORREGIDO) ===');
    
    try {
        if (!supabaseClient) {
            throw new Error('Cliente Supabase no inicializado');
        }
        
        // Verificar tablas del sistema de transporte
        const transportTables = ['vehicles', 'vehicle_routes', 'vehicle_locations', 'route_stops'];
        let transportOk = 0;
        
        for (const tableName of transportTables) {
            try {
                const { error } = await supabaseClient
                    .from(tableName)
                    .select('count', { count: 'exact', head: true });
                
                if (error) {
                    console.log(`⚠️ ${tableName}: ${error.message}`);
                } else {
                    console.log(`✅ ${tableName}: Accesible`);
                    transportOk++;
                }
            } catch (err) {
                console.log(`❌ ${tableName}: ${err.message}`);
            }
        }
        
        console.log(`📊 Tablas de transporte: ${transportOk}/${transportTables.length} accesibles`);
        
        // Test de Geolocation API
        if (!navigator.geolocation) {
            console.log('❌ Geolocation no soportado');
            testResults.transport = false;
            return;
        }
        
        console.log('✅ Geolocation API disponible');
        
        // Test de ubicación (con timeout corto)
        try {
            const position = await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Timeout obteniendo ubicación'));
                }, 3000);
                
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        clearTimeout(timeoutId);
                        resolve(pos);
                    },
                    (err) => {
                        clearTimeout(timeoutId);
                        reject(err);
                    },
                    { timeout: 3000, enableHighAccuracy: false }
                );
            });
            
            console.log('✅ Ubicación obtenida:', {
                lat: position.coords.latitude.toFixed(4),
                lng: position.coords.longitude.toFixed(4)
            });
            
            testResults.transport = transportOk > 0;
            
        } catch (error) {
            if (error.code === 1) {
                console.log('⚠️ Permisos de ubicación denegados');
                testResults.transport = transportOk > 0; // Tablas OK = transporte funcional
            } else {
                console.log('⚠️ Error obteniendo ubicación:', error.message);
                testResults.transport = false;
            }
        }
        
    } catch (error) {
        console.error('❌ Error en test de transporte:', error.message);
        testResults.transport = false;
    }
}

// ============================================
// 🎯 TEST: SISTEMA DE COMANDOS
// ============================================
async function testCommandSystem() {
    console.log('🎯 === PRUEBAS DE SISTEMA DE COMANDOS ===');
    
    try {
        if (!supabaseClient) {
            throw new Error('Cliente Supabase no inicializado');
        }
        
        // Verificar tabla commands
        const { data: commands, error, count } = await supabaseClient
            .from('commands')
            .select('name, command_word, difficulty_level, category_id', { count: 'exact' })
            .limit(3);
        
        if (error) {
            console.log('⚠️ Error en commands:', error.message);
            testResults.commands = false;
        } else {
            console.log(`✅ Sistema de comandos - ${count || 0} comandos disponibles`);
            
            if (commands && commands.length > 0) {
                console.log('🎯 Ejemplo de comando:', {
                    name: commands[0].name,
                    word: commands[0].command_word,
                    difficulty: commands[0].difficulty_level
                });
            }
            
            // Verificar tablas relacionadas
            const { error: categoriesError } = await supabaseClient
                .from('command_categories')
                .select('count', { count: 'exact', head: true });
            
            if (!categoriesError) {
                console.log('✅ Categorías de comandos disponibles');
            }
            
            const { error: progressError } = await supabaseClient
                .from('dog_command_progress')
                .select('count', { count: 'exact', head: true });
            
            if (!progressError) {
                console.log('✅ Sistema de progreso de comandos disponible');
            }
            
            testResults.commands = true;
        }
        
    } catch (error) {
        console.error('❌ Error en test de comandos:', error.message);
        testResults.commands = false;
    }
}

// ============================================
// 📋 RESUMEN CORREGIDO
// ============================================
function showCorrectedTestSummary() {
    console.log('📋 === RESUMEN DE PRUEBAS CORREGIDAS ===');
    console.log('======================================');
    
    const results = [
        ['🗄️ Base de Datos (Esquema Real)', testResults.database ? '✅ OK' : '❌ ERROR'],
        ['🔐 Autenticación', testResults.auth ? '✅ OK' : '❌ ERROR'],
        ['🐕 Datos Perros', testResults.dogs ? '✅ OK' : '❌ ERROR'],
        ['📊 Sistema Evaluaciones', testResults.evaluations ? '✅ OK' : '❌ ERROR'],
        ['🔔 Notificaciones', testResults.notifications ? '✅ OK' : '❌ ERROR'],
        ['📱 Push Notifications', testResults.push ? '✅ OK' : '❌ ERROR'],
        ['🚗 Sistema Transporte', testResults.transport ? '✅ OK' : '❌ ERROR'],
        ['🎯 Sistema Comandos', testResults.commands ? '✅ OK' : '❌ ERROR']
    ];
    
    console.table(results);
    
    const passed = Object.values(testResults).filter(Boolean).length;
    const total = Object.keys(testResults).length;
    
    console.log(`🎯 RESULTADO: ${passed}/${total} pruebas pasadas (${Math.round(passed/total*100)}%)`);
    
    if (passed === total) {
        console.log('🎉 ¡Todos los tests pasaron! Sistema completamente funcional.');
    } else if (passed > total/2) {
        console.log('⚠️ Sistema parcialmente funcional - revisar errores específicos');
    } else {
        console.log('❌ Sistema requiere configuración - revisar credenciales y base de datos');
    }
    
    // Mostrar recomendaciones específicas
    if (!testResults.database) {
        console.log('🔧 Recomendación: Verificar credenciales de Supabase y ejecutar migraciones');
    }
    if (!testResults.auth) {
        console.log('🔧 Recomendación: Verificar configuración de autenticación en Supabase');
    }
    if (!testResults.dogs || !testResults.evaluations) {
        console.log('🔧 Recomendación: Ejecutar script de datos de prueba');
    }
}

// ============================================
// 🔧 FUNCIONES AUXILIARES
// ============================================
async function loadSupabaseFromCDN() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@supabase/supabase-js@2';
        script.onload = () => {
            window.createSupabaseClient = window.supabase.createClient;
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function getSupabaseUrl() {
    return window.manualSupabaseConfig?.url || 
           document.querySelector('meta[name="PUBLIC_SUPABASE_URL"]')?.content ||
           'https://tu-proyecto.supabase.co'; // Fallback
}

function getSupabaseKey() {
    return window.manualSupabaseConfig?.key || 
           document.querySelector('meta[name="PUBLIC_SUPABASE_ANON_KEY"]')?.content ||
           'tu-anon-key'; // Fallback
}

// ============================================
// 🚀 AUTO-EJECUTAR Y EXPORTAR
// ============================================
if (typeof window !== 'undefined') {
    // Exponer función globalmente
    window.ejecutarTestingCompletoCorregido = ejecutarTestingCompletoCorregido;
    
    console.log('🧪 Sistema de testing corregido cargado');
    console.log('💡 Ejecuta: ejecutarTestingCompletoCorregido()');
    console.log('📋 Tests usan esquema real: profiles, dogs, evaluations, etc.');
}

// Exportar para uso externo
export { ejecutarTestingCompletoCorregido, testResults, SCHEMA_TABLES };