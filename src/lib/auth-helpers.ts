// src/lib/auth-helpers.ts
import type { User } from '@supabase/supabase-js';

// ===============================================
// 🎯 TIPOS Y INTERFACES CORREGIDOS
// ===============================================

export interface UserProfile {
  id: string;
  email: string;
  role: 'padre' | 'profesor' | 'admin';
  full_name: string;
  avatar_url?: string;
  phone?: string;
  club_member_since: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionResult {
  hasAccess: boolean;
  permissions: string[];
  reason: string;
  context?: Record<string, any>;
}

export interface AuthLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

// Tipo para roles válidos
type ValidRole = 'padre' | 'profesor' | 'admin';

// Tipo para permisos específicos
type Permission = 
  | 'view_own_dogs'
  | 'create_evaluation_own_dogs'
  | 'view_evaluations_own_dogs'
  | 'view_own_photos'
  | 'contact_support'
  | 'view_all_dogs'
  | 'create_evaluation_any_dog'
  | 'view_all_evaluations'
  | 'manage_students'
  | 'create_reports'
  | 'view_reports'
  | 'upload_photos'
  | 'manage_users'
  | 'manage_dogs'
  | 'delete_evaluations'
  | 'manage_photos'
  | 'view_analytics'
  | 'manage_system_config'
  | 'manage_notifications'
  | 'export_data';

// ===============================================
// 🎛️ CONFIGURACIÓN DE PERMISOS POR ROL (TIPADO)
// ===============================================

const ROLE_PERMISSIONS: Record<ValidRole, Permission[]> = {
  padre: [
    'view_own_dogs',
    'create_evaluation_own_dogs',
    'view_evaluations_own_dogs',
    'view_own_photos',
    'contact_support'
  ],
  profesor: [
    'view_all_dogs',
    'create_evaluation_any_dog',
    'view_all_evaluations',
    'manage_students',
    'create_reports',
    'view_reports',
    'upload_photos'
  ],
  admin: [
    'manage_users',
    'manage_dogs',
    'view_all_evaluations',
    'create_evaluation_any_dog',
    'delete_evaluations',
    'manage_photos',
    'upload_photos',
    'view_analytics',
    'manage_system_config',
    'manage_notifications',
    'export_data'
  ]
};

// Jerarquía de roles (para herencia de permisos)
const ROLE_HIERARCHY: Record<ValidRole, ValidRole[]> = {
  admin: ['admin', 'profesor', 'padre'],
  profesor: ['profesor', 'padre'],
  padre: ['padre']
};

// ===============================================
// 🔍 FUNCIONES DE VERIFICACIÓN DE PERMISOS (TIPADAS)
// ===============================================

export async function checkUserPermissions(
  user: User,
  requiredPermission: string,
  context?: Record<string, any>
): Promise<PermissionResult> {
  
  try {
    // Obtener perfil del usuario (esto se haría con Supabase en producción)
    const profile = await getUserProfileFromCache(user.id);
    
    if (!profile) {
      return {
        hasAccess: false,
        permissions: [],
        reason: 'Perfil de usuario no encontrado'
      };
    }

    // Verificar permisos básicos
    const userPermissions = await getPermissionLevel(profile.role, [requiredPermission]);
    const hasBasicPermission = userPermissions.includes(requiredPermission);

    if (!hasBasicPermission) {
      return {
        hasAccess: false,
        permissions: userPermissions,
        reason: `Rol ${profile.role} no tiene permiso: ${requiredPermission}`
      };
    }

    // Verificación contextual (si es necesaria)
    if (context) {
      const contextualAccess = await hasContextualAccess(
        profile,
        requiredPermission,
        context
      );

      return {
        hasAccess: contextualAccess.hasAccess,
        permissions: userPermissions,
        reason: contextualAccess.reason,
        context: context
      };
    }

    return {
      hasAccess: true,
      permissions: userPermissions,
      reason: 'Permisos verificados correctamente'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return {
      hasAccess: false,
      permissions: [],
      reason: `Error verificando permisos: ${errorMessage}`
    };
  }
}

export async function getPermissionLevel(
  userRole: string,
  requiredPermissions: string[]
): Promise<string[]> {
  
  // Verificar que el rol sea válido
  if (!isValidRole(userRole)) {
    console.warn(`Rol inválido: ${userRole}, usando 'padre' por defecto`);
    userRole = 'padre';
  }

  const validRole = userRole as ValidRole;
  
  // Obtener todos los permisos del rol del usuario
  const rolePermissions = ROLE_PERMISSIONS[validRole] || [];
  
  // Incluir permisos heredados de roles inferiores
  const inheritedRoles = ROLE_HIERARCHY[validRole] || [validRole];
  const allPermissions = new Set<string>();
  
  inheritedRoles.forEach((role: ValidRole) => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    permissions.forEach((permission: Permission) => allPermissions.add(permission));
  });

  // Retornar solo los permisos que el usuario tiene
  return Array.from(allPermissions);
}

export async function hasContextualAccess(
  profile: UserProfile,
  permission: string,
  context: Record<string, any>
): Promise<{ hasAccess: boolean; reason: string }> {
  
  // Verificaciones específicas por contexto
  switch (permission) {
    case 'view_evaluations_own_dogs':
    case 'create_evaluation_own_dogs':
      return await checkOwnDogAccess(profile, context);
      
    case 'view_specific_dog':
      return await checkSpecificDogAccess(profile, context);
      
    case 'edit_evaluation':
      return await checkEvaluationEditAccess(profile, context);
      
    default:
      return { hasAccess: true, reason: 'No requiere verificación contextual' };
  }
}

// ===============================================
// 🐕 VERIFICACIONES ESPECÍFICAS DE CONTEXTO (TIPADAS)
// ===============================================

async function checkOwnDogAccess(
  profile: UserProfile,
  context: Record<string, any>
): Promise<{ hasAccess: boolean; reason: string }> {
  
  const { dogId } = context;
  
  if (!dogId || typeof dogId !== 'string') {
    return { hasAccess: false, reason: 'ID de perro requerido' };
  }

  // En una implementación real, verificaríamos en la base de datos
  // si el perro pertenece al usuario
  
  // Por ahora, simulamos la verificación
  if (profile.role === 'padre') {
    // Solo permitir si es el dueño del perro
    const isOwner = await verifyDogOwnership(profile.id, dogId);
    return {
      hasAccess: isOwner,
      reason: isOwner ? 'Usuario es dueño del perro' : 'Perro no pertenece al usuario'
    };
  }

  // Profesores y admins pueden acceder a cualquier perro
  return { hasAccess: true, reason: 'Rol con acceso a todos los perros' };
}

async function checkSpecificDogAccess(
  profile: UserProfile,
  context: Record<string, any>
): Promise<{ hasAccess: boolean; reason: string }> {
  
  const { dogId } = context;
  
  // Lógica similar a checkOwnDogAccess pero más específica
  return await checkOwnDogAccess(profile, context);
}

async function checkEvaluationEditAccess(
  profile: UserProfile,
  context: Record<string, any>
): Promise<{ hasAccess: boolean; reason: string }> {
  
  const { evaluationId, evaluatorId } = context;
  
  if (!evaluationId || typeof evaluationId !== 'string') {
    return { hasAccess: false, reason: 'ID de evaluación requerido' };
  }

  // Verificar si el usuario puede editar esta evaluación específica
  switch (profile.role) {
    case 'admin':
      return { hasAccess: true, reason: 'Admin puede editar cualquier evaluación' };
      
    case 'profesor':
      // Los profesores pueden editar sus propias evaluaciones
      if (evaluatorId && evaluatorId === profile.id) {
        return { hasAccess: true, reason: 'Profesor puede editar su propia evaluación' };
      }
      return { hasAccess: false, reason: 'Profesor solo puede editar sus propias evaluaciones' };
      
    case 'padre':
      // Los padres pueden editar evaluaciones de casa de sus propios perros
      const canEdit = await verifyEvaluationOwnership(profile.id, evaluationId);
      return {
        hasAccess: canEdit,
        reason: canEdit ? 'Padre puede editar evaluación de su perro' : 'No puede editar esta evaluación'
      };
      
    default:
      return { hasAccess: false, reason: 'Rol no reconocido' };
  }
}

// ===============================================
// 🔍 FUNCIONES DE VERIFICACIÓN EN BASE DE DATOS (TIPADAS)
// ===============================================

async function verifyDogOwnership(userId: string, dogId: string): Promise<boolean> {
  // TODO: Implementar verificación real con Supabase
  // Por ahora retornamos true para desarrollo
  return true;
}

async function verifyEvaluationOwnership(userId: string, evaluationId: string): Promise<boolean> {
  // TODO: Implementar verificación real con Supabase
  // Verificar si la evaluación es de un perro que pertenece al usuario
  return true;
}

async function getUserProfileFromCache(userId: string): Promise<UserProfile | null> {
  // TODO: Implementar cache de perfiles
  // Por ahora retornamos un perfil de prueba
  return {
    id: userId,
    email: 'test@example.com',
    role: 'padre',
    full_name: 'Usuario de Prueba',
    club_member_since: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// ===============================================
// 📝 SISTEMA DE LOGGING (TIPADO)
// ===============================================

export function createAuthLogger(debugEnabled: boolean): AuthLogger {
  const prefix = '[Club Canino Auth]';
  
  return {
    info: (message: string) => {
      if (debugEnabled) {
        console.log(`${prefix} ℹ️  ${message}`);
      }
    },
    
    warn: (message: string) => {
      if (debugEnabled) {
        console.warn(`${prefix} ⚠️  ${message}`);
      }
    },
    
    error: (message: string) => {
      console.error(`${prefix} ❌ ${message}`);
    },
    
    debug: (message: string) => {
      if (debugEnabled) {
        console.debug(`${prefix} 🔍 ${message}`);
      }
    }
  };
}

// ===============================================
// 🛠️ UTILIDADES ADICIONALES (TIPADAS)
// ===============================================

// Type guard para verificar roles válidos
function isValidRole(role: string): role is ValidRole {
  return ['padre', 'profesor', 'admin'].includes(role);
}

export function canAccessRoute(userRole: string, routePath: string): boolean {
  const routeAccess: Record<string, ValidRole[]> = {
    '/dashboard/admin': ['admin'],
    '/dashboard/profesor': ['admin', 'profesor'],
    '/dashboard/padre': ['admin', 'profesor', 'padre'],
    '/admin': ['admin'],
    '/evaluaciones/crear': ['admin', 'profesor', 'padre'],
    '/evaluaciones/historial': ['admin', 'profesor', 'padre'],
    '/reportes': ['admin', 'profesor'],
    '/usuarios': ['admin']
  };

  const allowedRoles = routeAccess[routePath];
  if (!allowedRoles) {
    return true; // Si no está definido, permitir acceso
  }

  return isValidRole(userRole) && allowedRoles.includes(userRole as ValidRole);
}

export function getDefaultRedirectByRole(userRole: string): string {
  const redirects: Record<ValidRole, string> = {
    admin: '/dashboard/admin',
    profesor: '/dashboard/profesor',
    padre: '/dashboard/padre'
  };

  if (isValidRole(userRole)) {
    return redirects[userRole];
  }
  
  return '/dashboard/padre'; // Fallback por defecto
}

export function validatePermissionRequest(permission: string, context?: Record<string, any>): boolean {
  // Validar que la solicitud de permiso es válida
  const validPermissions = Object.values(ROLE_PERMISSIONS).flat();
  
  if (!validPermissions.includes(permission as Permission)) {
    return false;
  }

  // Validaciones adicionales por tipo de permiso
  if (permission.includes('own_dogs') && (!context?.dogId || typeof context.dogId !== 'string')) {
    return false;
  }

  if (permission.includes('evaluation') && context?.evaluationId && typeof context.evaluationId !== 'string') {
    return false;
  }

  return true;
}

// Exportar tipos para uso en otros archivos
export type { ValidRole, Permission };