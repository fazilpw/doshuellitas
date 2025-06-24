// src/lib/auth-config.ts
// CONFIGURACIÓN DE AUTENTICACIÓN SIMPLIFICADA PARA CLUB CANINO

export interface AuthConfig {
  ENABLE_GRANULAR_PERMISSIONS: boolean;
  ENABLE_CONTEXT_PERMISSIONS: boolean;
  DEBUG_MODE: boolean;
  FALLBACK_TO_SIMPLE: boolean;
}

export const getAuthConfig = (): AuthConfig => ({
  ENABLE_GRANULAR_PERMISSIONS: import.meta.env.MODE === 'development',
  ENABLE_CONTEXT_PERMISSIONS: false, // Para implementar después
  DEBUG_MODE: import.meta.env.MODE === 'development',
  FALLBACK_TO_SIMPLE: true, // Siempre activado por seguridad
});

export const PROTECTED_ROUTES = {
  public: [
    '/', 
    '/login', 
    '/register', 
    '/about', 
    '/servicios', 
    '/instalaciones', 
    '/contacto', 
    '/preguntas-frecuentes',
    '/diagnostico-fase1',
    '/fase2-implementacion'
  ],
  admin: ['/admin', '/usuarios', '/reportes', '/configuracion'],
  profesor: ['/dashboard/profesor', '/evaluaciones', '/estudiantes'],
  padre: ['/dashboard/padre', '/mis-mascotas', '/progreso']
};

export const shouldDebug = (component: string): boolean => {
  return import.meta.env.MODE === 'development' && 
         import.meta.env.DEBUG_AUTH !== 'false';
};

export const shouldFallbackToSimple = (): boolean => {
  return import.meta.env.FALLBACK_TO_SIMPLE !== 'false';
};

export const canBypassAuth = (): boolean => {
  return import.meta.env.MODE === 'development' && 
         import.meta.env.EMERGENCY_BYPASS === 'true';
};

// Logger simplificado para debugging
export const createAuthLogger = (enabled: boolean) => ({
  info: (message: string) => enabled && console.log(`🔵 AUTH: ${message}`),
  warn: (message: string) => enabled && console.warn(`🟡 AUTH: ${message}`),
  error: (message: string) => enabled && console.error(`🔴 AUTH: ${message}`),
  debug: (message: string) => enabled && console.debug(`🟣 AUTH: ${message}`)
});

// Configuración de roles del Club Canino
export const CLUB_ROLES = {
  PADRE: 'padre',
  PROFESOR: 'profesor', 
  ADMIN: 'admin'
} as const;

export type ClubRole = typeof CLUB_ROLES[keyof typeof CLUB_ROLES];

// Permisos básicos por rol
export const ROLE_PERMISSIONS = {
  [CLUB_ROLES.PADRE]: [
    'view_own_dogs',
    'create_evaluation_own_dogs', 
    'view_evaluations_own_dogs',
    'view_own_photos',
    'contact_support'
  ],
  [CLUB_ROLES.PROFESOR]: [
    'view_all_dogs',
    'create_evaluation_any_dog',
    'view_all_evaluations', 
    'manage_students',
    'create_reports',
    'upload_photos'
  ],
  [CLUB_ROLES.ADMIN]: [
    'manage_users',
    'manage_dogs',
    'view_all_evaluations',
    'create_evaluation_any_dog',
    'delete_evaluations',
    'manage_photos',
    'view_analytics',
    'manage_system_config',
    'export_data'
  ]
} as const;