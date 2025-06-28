// src/types/auth.d.ts
// 🔐 TIPOS DE AUTENTICACIÓN PARA CLUB CANINO DOS HUELLITAS
// Asegura compatibilidad entre authService y componentes

// ===============================================
// 🏷️ INTERFACES PRINCIPALES
// ===============================================

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'padre' | 'profesor' | 'admin' | 'conductor';
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  club_member_since: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthServiceInterface {
  // Estado
  isInitialized: boolean;
  currentUser: AuthUser | null;
  currentProfile: UserProfile | null;
  debug: boolean;

  // Métodos principales
  initialize(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;

  // Getters
  readonly isAuthenticated: boolean;
  readonly user: AuthUser | null;
  readonly profile: UserProfile | null;
  readonly userRole: string | undefined;

  // Utilidades
  getDashboard(): string;
  getDebugInfo(): DebugInfo;
  translateAuthError(errorMessage: string): string;
  onAuthStateChange(callback: (event: string, session: any) => void): any;
}

export interface DebugInfo {
  isInitialized: boolean;
  hasUser: boolean;
  hasProfile: boolean;
  isAuthenticated: boolean;
  userEmail?: string;
  userRole?: string;
  debugMode: boolean;
}

// ===============================================
// 🛠️ TIPOS DE FORMULARIOS
// ===============================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export interface LoginFormState {
  isSubmitting: boolean;
  errors: LoginFormErrors;
  showPassword: boolean;
}

// ===============================================
// 🎯 TIPOS DE RESPUESTA AUTH
// ===============================================

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  profile?: UserProfile;
  error?: string;
  redirectTo?: string;
}

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

// ===============================================
// 🌐 EXTENSIONES DOM TIPADAS
// ===============================================

export interface HTMLInputElementTyped extends HTMLInputElement {
  value: string;
  type: string;
  checked?: boolean;
}

export interface HTMLButtonElementTyped extends HTMLButtonElement {
  disabled: boolean;
  textContent: string | null;
}

export interface HTMLFormElementTyped extends HTMLFormElement {
  elements: HTMLFormControlsCollection;
}

// ===============================================
// 🔧 TIPOS DE CONFIGURACIÓN
// ===============================================

export interface AuthConfig {
  supabaseUrl: string;
  supabaseKey: string;
  debug: boolean;
  enableFallback: boolean;
  redirectAfterLogin: string;
  redirectAfterLogout: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

// ===============================================
// 🧪 TIPOS PARA DEBUGGING
// ===============================================

export interface LoginDebugInterface {
  authService: () => AuthServiceInterface | null;
  testLogin: (email?: string, password?: string) => Promise<any>;
  checkAuth: () => DebugInfo | null;
  clearAuth: () => Promise<void>;
  simulateError: (type: 'network' | 'auth' | 'profile') => void;
  getState: () => any;
}

export interface WindowWithDebug extends Window {
  authService?: AuthServiceInterface;
  loginDebug?: LoginDebugInterface;
  supabaseDebug?: any;
}

// ===============================================
// 🎨 TIPOS DE UI
// ===============================================

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface MessageState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  visible: boolean;
  autoHide?: boolean;
  duration?: number;
}

export interface FormFieldState {
  value: string;
  error?: string;
  touched: boolean;
  valid: boolean;
}

// ===============================================
// 🚨 TIPOS DE ERRORES
// ===============================================

export type AuthErrorCode = 
  | 'invalid_credentials'
  | 'user_not_found'
  | 'email_not_confirmed'
  | 'too_many_requests'
  | 'network_error'
  | 'profile_not_found'
  | 'unauthorized'
  | 'session_expired';

export interface AuthErrorWithCode extends AuthError {
  code: AuthErrorCode;
  retry?: boolean;
  retryAfter?: number;
}

// ===============================================
// 🎯 TIPOS DE EVENTOS
// ===============================================

export type AuthEventType = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PROFILE_UPDATED'
  | 'PASSWORD_RECOVERY';

export interface AuthEvent {
  type: AuthEventType;
  user?: AuthUser;
  profile?: UserProfile;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type AuthEventCallback = (event: AuthEvent) => void | Promise<void>;

// ===============================================
// 🔄 TIPOS DE SINCRONIZACIÓN
// ===============================================

export interface SyncState {
  isOnline: boolean;
  lastSync: string | null;
  pendingOperations: number;
  hasConflicts: boolean;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, any>;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
}

// ===============================================
// 🌟 TIPOS PARA CONTEXT PROVIDERS
// ===============================================

export interface AuthContextValue {
  // Estado
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: AuthError | null;
  
  // Métodos
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  
  // Estado del formulario (opcional)
  formState?: LoginFormState;
  setFormState?: (state: Partial<LoginFormState>) => void;
  
  // Debug (solo desarrollo)
  debug?: DebugInfo;
}

// ===============================================
// 🚀 TIPOS PARA PWA Y NAVEGACIÓN
// ===============================================

export interface NavigationState {
  canGoBack: boolean;
  currentPath: string;
  previousPath?: string;
  isNavigating: boolean;
}

export interface PWAState {
  installed: boolean;
  updateAvailable: boolean;
  installPrompt?: any;
  networkStatus: 'online' | 'offline' | 'slow';
}

// ===============================================
// 🎨 EXPORT POR DEFECTO PARA COMPATIBILIDAD
// ===============================================

declare global {
  interface Window extends WindowWithDebug {}
  
  namespace JSX {
    interface IntrinsicElements {
      'login-form': any;
      'auth-provider': any;
    }
  }
}

export default AuthServiceInterface;