// src/types/auth.d.ts
// 🔐 TIPOS DE AUTENTICACIÓN PARA CLUB CANINO DOS HUELLITAS

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
// EXPORT POR DEFECTO
// ===============================================

export default AuthServiceInterface;