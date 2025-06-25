// src/middleware.ts
// MIDDLEWARE REAL PARA CLUB CANINO - CON DATOS DE PRODUCCIÓN

import { defineMiddleware } from 'astro:middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// ===============================================
// 🎯 TIPOS PARA CLUB CANINO
// ===============================================

interface UserProfile {
  id: string;
  email: string;
  role: 'padre' | 'profesor' | 'admin';
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  club_member_since: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ===============================================
// 🎛️ CONFIGURACIÓN DE PRODUCCIÓN
// ===============================================

const AUTH_CONFIG = {
  DEBUG_MODE: import.meta.env.DEV || false,
  ENABLE_FALLBACK: false,  // ← CAMBIADO: Sin fallback en producción
  DEFENSIVE_MODE: false    // ← CAMBIADO: Modo real activado
};

// Rutas organizadas por tipo
const ROUTE_CONFIG = {
  public: [
    '/', '/servicios', '/instalaciones', '/contacto', 
    '/preguntas-frecuentes', '/login', '/register', '/logout',
    '/about', '/privacy', '/terms', '/gracias'
  ],
  protected: {
    padre: ['/dashboard/padre', '/mis-mascotas', '/progreso', '/mi-perfil'],
    profesor: ['/dashboard/profesor', '/evaluaciones', '/estudiantes', '/clases'],
    admin: ['/dashboard/admin', '/admin', '/usuarios', '/reportes', '/configuracion']
  },
  bypass: [
    '/api/', '/images/', '/_astro/', '/favicon.ico', '/manifest.json',
    '/sw.js', '/robots.txt', '/sitemap.xml', '/icons/', 
    '/diagnostico', '/diagnostico-fase1', '/fase2-implementacion',
    '/crear-datos-prueba', '/test-', '/offline', '/error'
  ]
};

// ===============================================
// 🚦 MIDDLEWARE PRINCIPAL DE PRODUCCIÓN
// ===============================================

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, url, cookies, redirect } = context;
  const pathname = url.pathname;

  if (AUTH_CONFIG.DEBUG_MODE) {
    console.log(`🚀 Auth middleware para: ${pathname}`);
  }

  try {
    // ===============================================
    // 🟢 PASO 1: VERIFICAR BYPASS
    // ===============================================
    
    const shouldBypass = ROUTE_CONFIG.bypass.some(route => 
      pathname.startsWith(route)
    );

    if (shouldBypass) {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log(`⚡ Bypass para: ${pathname}`);
      }
      return next();
    }

    // ===============================================
    // 🔐 PASO 2: INICIALIZAR SUPABASE
    // ===============================================
    
    const supabase = createServerClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            const allCookies: Array<{ name: string; value: string }> = [];
            const knownCookies = [
              'sb-access-token', 'sb-refresh-token', 'sb-provider-token',
              'sb-provider-refresh-token', 'supabase-auth-token', 'supabase.auth.token'
            ];
            
            knownCookies.forEach(name => {
              try {
                if (cookies.has(name)) {
                  const cookie = cookies.get(name);
                  if (cookie?.value) {
                    allCookies.push({ name, value: cookie.value });
                  }
                }
              } catch (error) {
                // Ignorar errores individuales
              }
            });
            
            return allCookies;
          },
          
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookies.set(name, value, options);
              } catch (error) {
                if (AUTH_CONFIG.DEBUG_MODE) {
                  console.warn(`⚠️ Error setting cookie ${name}:`, error);
                }
              }
            });
          },
        },
      }
    );

    locals.supabase = supabase;

    // ===============================================
    // 🟢 PASO 3: VERIFICAR RUTAS PÚBLICAS
    // ===============================================
    
    const isPublicRoute = ROUTE_CONFIG.public.includes(pathname);
    
    if (isPublicRoute) {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log(`✅ Ruta pública: ${pathname}`);
      }
      
      // En rutas públicas, intentar obtener usuario si está logueado
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          locals.user = session.user;
          const profile = await getUserProfile(supabase, session.user.id);
          locals.profile = profile;
        }
      } catch (error) {
        // No importa si falla en rutas públicas
      }
      
      return next();
    }

    // ===============================================
    // 🔐 PASO 4: VERIFICAR AUTENTICACIÓN PARA RUTAS PROTEGIDAS
    // ===============================================
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error(`❌ Error de sesión: ${sessionError.message}`);
      return handleAuthError(pathname, cookies, redirect);
    }

    if (!session?.user) {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log(`🔒 Sin sesión para: ${pathname}`);
      }
      return handleNoSession(pathname, cookies, redirect);
    }

    // ===============================================
    // 🟠 PASO 5: OBTENER PERFIL DE USUARIO
    // ===============================================
    
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

    locals.profile = profile;

    if (AUTH_CONFIG.DEBUG_MODE) {
      console.log(`👤 Usuario: ${session.user.email} | Rol: ${profile?.role}`);
    }

    // ===============================================
    // 🟣 PASO 6: VERIFICAR PERMISOS POR ROL
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
    
    // En producción, redirigir a error
    return redirect('/error?type=middleware&message=' + encodeURIComponent(error.message));
  }
});

// ===============================================
// 🛠️ FUNCIONES HELPER
// ===============================================

async function getUserProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile | undefined> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return undefined; // No existe
      }
      throw error;
    }

    return profile as UserProfile;
  } catch (error) {
    console.error(`Error obteniendo perfil: ${error}`);
    return undefined;
  }
}

async function createBasicProfile(supabase: SupabaseClient, user: User): Promise<UserProfile> {
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
    
    return profile as UserProfile;
  } catch (error) {
    console.error(`Error creando perfil: ${error}`);
    throw error;
  }
}

function checkRoleAccess(pathname: string, userRole: string): boolean {
  const roleRoutes = ROUTE_CONFIG.protected[userRole as keyof typeof ROUTE_CONFIG.protected] || [];
  
  const hasDirectAccess = roleRoutes.some(route => pathname.startsWith(route));
  if (hasDirectAccess) return true;
  
  const sharedRoutes = ['/api/', '/logout', '/mi-perfil'];
  const hasSharedAccess = sharedRoutes.some(route => pathname.startsWith(route));
  if (hasSharedAccess) return true;
  
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

// ===============================================
// 🎯 DECLARACIÓN DE TIPOS GLOBALES
// ===============================================

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user?: User;
      profile?: UserProfile;
      fallbackMode?: boolean;
    }
  }
}

// ===============================================
// 🎉 MIDDLEWARE DE PRODUCCIÓN ACTIVADO
// ===============================================
// 
// ✅ Autenticación real con Supabase
// ✅ Protección por roles (padre/profesor/admin)  
// ✅ Redirecciones inteligentes
// ✅ Manejo de errores robusto
// ✅ Compatible con los datos de producción
//
// USUARIOS DE PRUEBA:
// - maria@gmail.com (padre)
// - profesor@clubcanino.com (profesor)  
// - admin@clubcanino.com (admin)
//
// ===============================================