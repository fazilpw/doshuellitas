// src/middleware.ts
// MIDDLEWARE CORREGIDO CON TIPOS EXACTOS
import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// ===============================================
// 🎯 IMPORTAR TIPOS DESDE env.d.ts
// ===============================================

// Los tipos UserProfile y demás están definidos en env.d.ts
// y son accesibles globalmente a través de App.Locals

// ===============================================
// 🎛️ CONFIGURACIÓN
// ===============================================

const AUTH_CONFIG = {
  DEBUG_MODE: import.meta.env.DEV || false,
  ENABLE_FALLBACK: true
};

const ROUTE_CONFIG = {
  public: [
    '/', '/login', '/register', '/logout',
    '/servicios', '/instalaciones', '/contacto', '/preguntas-frecuentes',
    '/about', '/privacy', '/terms'
  ],
  protected: {
    padre: ['/dashboard/padre', '/mis-mascotas', '/progreso', '/mi-perfil'],
    profesor: ['/dashboard/profesor', '/evaluaciones', '/estudiantes', '/clases'],
    admin: ['/dashboard/admin', '/admin', '/usuarios', '/reportes', '/configuracion', '/crear-datos-prueba']
  },
  bypass: [
    '/api/', '/images/', '/_astro/', '/favicon.ico', '/manifest.json',
    '/sw.js', '/robots.txt', '/sitemap.xml', '/icons/', '/diagnostico'
  ]
};

// ===============================================
// 🚦 MIDDLEWARE PRINCIPAL
// ===============================================

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, url, cookies, redirect } = context;
  const pathname = url.pathname;

  if (AUTH_CONFIG.DEBUG_MODE) {
    console.log(`🚀 Auth middleware para: ${pathname}`);
  }

  try {
    // ===============================================
    // 🟢 PASO 1: CONFIGURAR SUPABASE
    // ===============================================
    
    const supabase = createServerClient(
      import.meta.env.PUBLIC_SUPABASE_URL!,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(key) {
            return cookies.get(key)?.value;
          },
          set(key, value, options) {
            cookies.set(key, value, options);
          },
          remove(key, options) {
            cookies.delete(key, options);
          },
        },
      }
    );

    // ✅ ASIGNAR SUPABASE A LOCALS (Tipo ya definido en env.d.ts)
    locals.supabase = supabase;

    // ===============================================
    // 🟢 PASO 2: VERIFICAR BYPASS
    // ===============================================
    
    const shouldBypass = ROUTE_CONFIG.bypass.some(route => 
      pathname.startsWith(route)
    );

    if (shouldBypass) {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log(`⚡ Bypass: ${pathname}`);
      }
      return next();
    }

    // ===============================================
    // 🟢 PASO 3: RUTAS PÚBLICAS
    // ===============================================
    
    const isPublicRoute = ROUTE_CONFIG.public.includes(pathname);

    if (isPublicRoute) {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log(`✅ Ruta pública: ${pathname}`);
      }
      
      // Intentar obtener usuario si está logueado (para rutas públicas)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // ✅ ASIGNAR USER A LOCALS (Tipo ya definido en env.d.ts)
          locals.user = session.user;
          const profile = await getUserProfile(supabase, session.user.id);
          // ✅ ASIGNAR PROFILE A LOCALS (Tipo ya definido en env.d.ts)
          locals.profile = profile;
        }
      } catch (error) {
        // No importa si falla en rutas públicas
      }
      
      return next();
    }

    // ===============================================
    // 🔴 PASO 4: VERIFICAR AUTENTICACIÓN
    // ===============================================
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error(`❌ Error de sesión: ${sessionError.message}`);
      return handleAuthError(pathname, cookies, redirect);
    }

    if (!session?.user) {
      // 🧪 MODO TESTING: Permitir acceso a dashboards sin sesión
      if (pathname.startsWith('/dashboard/')) {
        if (AUTH_CONFIG.DEBUG_MODE) {
          console.log(`🧪 TESTING: Permitiendo acceso sin sesión a: ${pathname}`);
        }
        return next(); // ← Esto permite continuar sin sesión
      }
      
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log(`🔒 Sin sesión para: ${pathname}`);
      }
      return handleNoSession(pathname, cookies, redirect);
    }

    // ===============================================
    // 🟠 PASO 5: OBTENER PERFIL DE USUARIO
    // ===============================================
    
    // ✅ ASIGNAR USER A LOCALS (Ya no da error de tipos)
    locals.user = session.user;
    
    let profile = await getUserProfile(supabase, session.user.id);
    
    if (!profile) {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log(`⚠️ Creando perfil para: ${session.user.email}`);
      }
      
      try {
        profile = await createBasicProfile(supabase, session.user);
      } catch (error) {
        console.error(`❌ Error creando perfil: ${error}`);
        return redirect('/error?type=profile');
      }
    }

    // ✅ ASIGNAR PROFILE A LOCALS (Ya no da error de tipos)
    locals.profile = profile;

    if (AUTH_CONFIG.DEBUG_MODE) {
      console.log(`👤 Usuario: ${session.user.email} | Rol: ${profile?.role}`);
    }

    // ===============================================
    // 🟣 PASO 6: VERIFICAR PERMISOS
    // ===============================================
    
    const userRole = profile?.role || 'padre';
    const hasAccess = checkRoleAccess(pathname, userRole);
    
    if (!hasAccess) {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log(`❌ Acceso denegado para ${userRole}: ${pathname}`);
      }
      return redirectToAuthorizedDashboard(userRole, redirect);
    }

    if (AUTH_CONFIG.DEBUG_MODE) {
      console.log(`✅ Acceso autorizado: ${pathname}`);
    }
    
    return next();

  } catch (error) {
    console.error(`💥 Error crítico en middleware: ${error}`);
    
    if (AUTH_CONFIG.ENABLE_FALLBACK) {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log(`🆘 Activando modo fallback para: ${pathname}`);
      }
      return handleFallbackMode(context, next);
    }
    
    return redirect('/error?type=middleware');
  }
});

// ===============================================
// 🛠️ FUNCIONES HELPER
// ===============================================

async function getUserProfile(supabase: SupabaseClient, userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No existe
      }
      throw error;
    }

    return profile;
  } catch (error) {
    console.error(`Error obteniendo perfil: ${error}`);
    return null;
  }
}

async function createBasicProfile(supabase: SupabaseClient, user: User) {
  try {
    const profileData = {
      id: user.id,
      email: user.email!,
      role: 'padre' as const,
      full_name: user.user_metadata?.full_name || 
                 user.user_metadata?.name || 
                 user.email?.split('@')[0] || 
                 'Usuario',
      active: true
    };

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) throw error;

    if (AUTH_CONFIG.DEBUG_MODE) {
      console.log(`✅ Perfil creado: ${user.email}`);
    }
    
    return profile;
  } catch (error) {
    console.error(`Error creando perfil: ${error}`);
    throw error;
  }
}

function checkRoleAccess(pathname: string, userRole: string): boolean {
  const roleRoutes = ROUTE_CONFIG.protected[userRole as keyof typeof ROUTE_CONFIG.protected] || [];
  
  // Verificar acceso directo por rol
  const hasDirectAccess = roleRoutes.some(route => pathname.startsWith(route));
  if (hasDirectAccess) return true;
  
  // Rutas compartidas permitidas
  const sharedRoutes = ['/api/', '/logout', '/mi-perfil'];
  const hasSharedAccess = sharedRoutes.some(route => pathname.startsWith(route));
  if (hasSharedAccess) return true;
  
  // Admin tiene acceso a todo
  if (userRole === 'admin') return true;
  
  return false;
}

function redirectToAuthorizedDashboard(userRole: string, redirect: (url: string) => Response): Response {
  const dashboardMap: Record<string, string> = {
    'admin': '/dashboard/admin',
    'profesor': '/dashboard/profesor',
    'padre': '/dashboard/padre'
  };

  const targetDashboard = dashboardMap[userRole] || '/dashboard/padre';
  
  if (AUTH_CONFIG.DEBUG_MODE) {
    console.log(`🔄 Redirigiendo a: ${targetDashboard}`);
  }
  
  return redirect(targetDashboard);
}

function handleAuthError(pathname: string, cookies: any, redirect: (url: string) => Response): Response {
  cookies.set('redirect_after_login', pathname, { 
    maxAge: 600, 
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  });
  
  return redirect('/login?error=auth');
}

function handleNoSession(pathname: string, cookies: any, redirect: (url: string) => Response): Response {
  cookies.set('redirect_after_login', pathname, { 
    maxAge: 600, 
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  });
  
  return redirect('/login');
}

function handleFallbackMode(context: any, next: any) {
  const { locals, url, redirect } = context;
  
  if (AUTH_CONFIG.DEBUG_MODE) {
    console.log(`🆘 Modo fallback para: ${url.pathname}`);
  }
  
  // Solo proteger rutas críticas de admin
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/dashboard/admin')) {
    return redirect('/login?error=fallback');
  }
  
  locals.fallbackMode = true;
  return next();
}