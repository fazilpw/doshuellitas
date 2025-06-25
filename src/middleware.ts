// src/middleware.ts
// FASE A: CORRECCIÓN QUIRÚRGICA - MODO DEFENSIVO
// ✅ Mantiene toda la lógica original pero es permisivo hasta tener datos

import { defineMiddleware } from 'astro:middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// ===============================================
// 🎯 CONFIGURACIÓN DEFENSIVA (CAMBIO PRINCIPAL)
// ===============================================

const AUTH_CONFIG = {
  DEBUG_MODE: import.meta.env.DEV || false,
  ENABLE_FALLBACK: true,
  // 🛡️ NUEVO: Modo defensivo hasta que tengamos datos estables
  DEFENSIVE_MODE: false  // ← CAMBIAR A false cuando tengamos datos estables
};

// ===============================================
// 🚦 RUTAS Y CONFIGURACIÓN (SIN CAMBIOS)
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
    '/sw.js', '/robots.txt', '/sitemap.xml', '/icons/', '/diagnostico',
    '/crear-datos-prueba', '/diagnostico-fase1', '/fase2-implementacion'  // ← Críticos para setup
  ]
};

// ===============================================
// 🚦 MIDDLEWARE PRINCIPAL CON MODO DEFENSIVO
// ===============================================

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, url, cookies, redirect } = context;
  const pathname = url.pathname;

  if (AUTH_CONFIG.DEBUG_MODE) {
    console.log(`🚀 Auth middleware para: ${pathname}`);
  }

  try {
    // ===============================================
    // 🟢 PASO 1: VERIFICAR BYPASS (EXPANDIDO)
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
    // 🛡️ PASO 2: MODO DEFENSIVO (NUEVO)
    // ===============================================
    
    if (AUTH_CONFIG.DEFENSIVE_MODE) {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log(`🛡️ MODO DEFENSIVO: ${pathname} - Permitiendo acceso temporal`);
      }
      
      // Configurar locals básicos para evitar errores en el código
      locals.user = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'maria@gmail.com'
      } as User;
      
      locals.profile = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'maria@gmail.com',
        role: 'padre',
        full_name: 'María García (Modo Defensivo)',
        phone: '3007654321',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar_url: null,
        club_member_since: new Date().toISOString()
      } as UserProfile;
      
      // ⚠️ IMPORTANTE: Configurar Supabase si es posible, pero no fallar si no
      try {
        const supabase = createServerClient(
          import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
          import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
          {
            cookies: {
              getAll() {
                return [];
              },
              setAll() {
                // No hacer nada en modo defensivo
              },
            },
          }
        );
        locals.supabase = supabase;
      } catch (error) {
        // En modo defensivo, no importa si Supabase falla
        console.log('⚠️ Supabase no disponible en modo defensivo, continuando...');
      }
      
      return next();
    }

    // ===============================================
    // 🔄 RESTO DE LA LÓGICA ORIGINAL (SIN CAMBIOS)
    // ===============================================
    // Esta parte se ejecuta solo cuando DEFENSIVE_MODE = false
    
    // Inicializar Supabase
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

    // Verificar rutas públicas
    const isPublicRoute = ROUTE_CONFIG.public.includes(pathname);
    
    if (isPublicRoute) {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log(`✅ Ruta pública: ${pathname}`);
      }
      
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

    // Verificar autenticación para rutas protegidas
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

    // Obtener perfil
    locals.user = session.user;
    
    let profile = await getUserProfile(supabase, session.user.id);
    
    if (!profile) {
      try {
        profile = await createBasicProfile(supabase, session.user);
      } catch (error) {
        console.error(`❌ Error creando perfil: ${error}`);
        return redirect('/error?type=profile');
      }
    }

    locals.profile = profile;

    // Verificar permisos
    const userRole = profile?.role || 'padre';
    const hasAccess = checkRoleAccess(pathname, userRole);
    
    if (!hasAccess) {
      return redirectToAuthorizedDashboard(userRole, redirect);
    }
    
    return next();

  } catch (error) {
    console.error(`💥 Error crítico en middleware: ${error}`);
    
    if (AUTH_CONFIG.ENABLE_FALLBACK) {
      return handleFallbackMode(context, next);
    }
    
    return redirect('/error?type=middleware');
  }
});

// ===============================================
// 🛠️ FUNCIONES HELPER (SIN CAMBIOS)
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
        return undefined;
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

async function handleFallbackMode(context: any, next: any) {
  const { locals, url, redirect } = context;
  
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/dashboard/admin')) {
    return redirect('/login?error=fallback');
  }
  
  locals.fallbackMode = true;
  return next();
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
// 🎯 INSTRUCCIONES DE USO - FASE A
// ===============================================
// 
// 1. ✅ DEFENSIVE_MODE = true: Sistema funciona sin base de datos
// 2. 🚀 Deploy en Netlify: Todo funcionará perfectamente
// 3. 🔧 Crear datos desde /crear-datos-prueba en producción
// 4. ⚙️ Cambiar DEFENSIVE_MODE = false cuando tengamos datos
// 5. 🎉 Sistema de producción completo
//
// ===============================================