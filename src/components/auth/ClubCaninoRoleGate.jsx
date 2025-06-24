// src/components/auth/ClubCaninoRoleGate.jsx
import { useAuth } from './AuthProvider.jsx';
import { useClubCaninoAuth } from '../../hooks/useClubCaninoAuth.js';

// ============================================
// 🛡️ COMPONENTE DE PROTECCIÓN POR ROLES
// ============================================

export function ClubCaninoRoleGate({ 
  roles = [], 
  permissions = [],
  children, 
  fallback = <UnauthorizedClubAccess />,
  loading = <ClubLoadingSkeleton />,
  showFallback = true,
  redirectTo = null
}) {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { hasPermission, clubRole, loading: clubLoading } = useClubCaninoAuth();

  // ============================================
  // 🔄 ESTADOS DE CARGA
  // ============================================

  if (authLoading || clubLoading) {
    return loading;
  }

  // ============================================
  // 🔐 VERIFICACIONES DE ACCESO
  // ============================================

  // No autenticado
  if (!isAuthenticated) {
    if (redirectTo) {
      window.location.href = redirectTo;
      return null;
    }
    return showFallback ? <NotAuthenticatedMessage /> : null;
  }

  // Verificar roles requeridos
  const hasRequiredRole = roles.length === 0 || roles.includes(clubRole);
  
  // Verificar permisos requeridos
  const hasRequiredPermissions = permissions.length === 0 || 
    permissions.every(permission => hasPermission(permission));

  // Acceso denegado
  if (!hasRequiredRole || !hasRequiredPermissions) {
    if (redirectTo) {
      window.location.href = redirectTo;
      return null;
    }
    return showFallback ? fallback : null;
  }

  // ✅ Acceso permitido
  return children;
}

// ============================================
// 🚫 COMPONENTE DE ACCESO NO AUTORIZADO
// ============================================

function UnauthorizedClubAccess() {
  const { clubRole, clubDisplayName } = useClubCaninoAuth();

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        
        {/* Icono de acceso denegado */}
        <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🚫</span>
        </div>
        
        {/* Mensaje principal */}
        <h1 className="text-2xl font-bold text-[#2C3E50] mb-4">
          Acceso Restringido
        </h1>
        
        <p className="text-gray-600 mb-6">
          Hola <strong>{clubDisplayName}</strong>, tu rol de{' '}
          <span className="text-[#56CCF2] font-medium">{clubRole}</span>{' '}
          no tiene permisos para acceder a esta sección del Club Canino.
        </p>
        
        {/* Sugerencias basadas en rol */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">
            ¿Qué puedes hacer?
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            {getAccessSuggestions(clubRole).map((suggestion, index) => (
              <li key={index}>• {suggestion}</li>
            ))}
          </ul>
        </div>
        
        {/* Botones de acción */}
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-[#56CCF2] text-white py-3 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            ← Volver Atrás
          </button>
          
          <a
            href="/app"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🏠 Ir al Dashboard
          </a>
          
          <a
            href="https://wa.me/573144329824"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
          >
            💬 Contactar Administrador
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 🔓 COMPONENTE DE NO AUTENTICADO
// ============================================

function NotAuthenticatedMessage() {
  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        
        {/* Icono de login requerido */}
        <div className="mx-auto h-24 w-24 bg-[#56CCF2] rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🔐</span>
        </div>
        
        {/* Mensaje principal */}
        <h1 className="text-2xl font-bold text-[#2C3E50] mb-4">
          Acceso Requerido
        </h1>
        
        <p className="text-gray-600 mb-6">
          Necesitas iniciar sesión para acceder a esta sección del Club Canino.
        </p>
        
        {/* Botones de acción */}
        <div className="space-y-3">
          <a
            href="/login"
            className="block w-full bg-[#56CCF2] text-white py-3 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            🐾 Iniciar Sesión
          </a>
          
          <a
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🏠 Volver al Inicio
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ⏳ SKELETON DE CARGA
// ============================================

function ClubLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#56CCF2] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-2xl">🐕</span>
        </div>
        <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">Club Canino</h2>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-[#56CCF2] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[#56CCF2] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-[#56CCF2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-gray-600 mt-2">Verificando permisos...</p>
      </div>
    </div>
  );
}

// ============================================
// 🛠️ FUNCIONES AUXILIARES
// ============================================

function getAccessSuggestions(role) {
  const suggestions = {
    padre: [
      'Ver y evaluar a tus propias mascotas',
      'Acceder al progreso de tus peluditos',
      'Contactar a los profesores del club',
      'Ver las fotos del día de tus mascotas'
    ],
    profesor: [
      'Evaluar a todas las mascotas del club',
      'Ver el historial completo de evaluaciones',
      'Gestionar actividades diarias',
      'Contactar a los padres de familia'
    ],
    admin: [
      'Gestionar usuarios y permisos',
      'Acceder a todos los reportes',
      'Configurar el club y sus políticas',
      'Exportar datos y estadísticas'
    ]
  };

  return suggestions[role] || [
    'Contactar al administrador para más información',
    'Verificar tu rol y permisos asignados'
  ];
}

// ============================================
// 🎯 COMPONENTES DE CONVENIENCIA
// ============================================

// Protección solo para padres
export function PadreOnly({ children, fallback }) {
  return (
    <ClubCaninoRoleGate roles={['padre']} fallback={fallback}>
      {children}
    </ClubCaninoRoleGate>
  );
}

// Protección solo para profesores
export function ProfesorOnly({ children, fallback }) {
  return (
    <ClubCaninoRoleGate roles={['profesor']} fallback={fallback}>
      {children}
    </ClubCaninoRoleGate>
  );
}

// Protección solo para admins
export function AdminOnly({ children, fallback }) {
  return (
    <ClubCaninoRoleGate roles={['admin']} fallback={fallback}>
      {children}
    </ClubCaninoRoleGate>
  );
}

// Protección para profesores y admins
export function StaffOnly({ children, fallback }) {
  return (
    <ClubCaninoRoleGate roles={['profesor', 'admin']} fallback={fallback}>
      {children}
    </ClubCaninoRoleGate>
  );
}

// Protección por permisos específicos
export function PermissionGate({ permissions, children, fallback }) {
  return (
    <ClubCaninoRoleGate permissions={permissions} fallback={fallback}>
      {children}
    </ClubCaninoRoleGate>
  );
}

// ============================================
// 🚀 HOOKS DE CONVENIENCIA
// ============================================

// Hook para verificar si puede gestionar mascotas
export function usePetManagement() {
  const { hasPermission } = useClubCaninoAuth();
  return hasPermission('view_all_pets');
}

// Hook para verificar si puede ver todas las evaluaciones
export function useEvaluationAccess() {
  const { hasPermission } = useClubCaninoAuth();
  return hasPermission('view_all_evaluations');
}

// Hook para verificar si puede administrar el club
export function useAdminAccess() {
  const { hasPermission } = useClubCaninoAuth();
  return hasPermission('manage_club_settings');
}

export default ClubCaninoRoleGate;