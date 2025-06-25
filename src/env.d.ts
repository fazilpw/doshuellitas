// src/env.d.ts
// TIPOS COMPLETOS PARA CLUB CANINO DOS HUELLITAS
/// <reference types="astro/client" />

import type { SupabaseClient, User } from '@supabase/supabase-js';

// ===============================================
// 🏷️ INTERFACES DEL CLUB CANINO
// ===============================================

// Perfil de usuario del Club Canino
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

// Datos del perro
interface Dog {
  id: string;
  name: string;
  owner_id: string;
  breed: string | null;
  size: 'pequeño' | 'mediano' | 'grande' | 'gigante' | null;
  age: number | null;
  weight: string | null;
  color: string | null;
  active: boolean;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

// Evaluación de comportamiento
interface Evaluation {
  id: string;
  dog_id: string;
  evaluator_id: string;
  date: string;
  location: 'casa' | 'colegio';
  energy_level: number | null;
  sociability_level: number | null;
  obedience_level: number | null;
  anxiety_level: number | null;
  barks_much: string | null;
  begs_food: string | null;
  destructive: string | null;
  social_with_dogs: string | null;
  follows_everywhere: string | null;
  window_watching: string | null;
  ate_well: string | null;
  bathroom_accidents: string | null;
  played_with_toys: string | null;
  responded_to_commands: string | null;
  interaction_quality: string | null;
  notes: string | null;
  highlights: string | null;
  concerns: string | null;
  created_at: string;
  updated_at: string;
}

// Notificación
interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'tip' | 'reminder' | 'progress' | 'transport' | 'general';
  read: boolean;
  created_at: string;
}

// Foto del perro
interface Photo {
  id: string;
  dog_id: string;
  url: string;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
}

// ===============================================
// 🌐 TIPOS DE ASTRO EXTENDIDOS
// ===============================================

declare namespace App {
  interface Locals {
    // Usuario autenticado de Supabase
    user: User | null;
    // Cliente Supabase
    supabase: SupabaseClient;
    // Perfil del usuario en nuestra base de datos
    profile: UserProfile | null;
    // Modo fallback para desarrollo
    fallbackMode?: boolean;
  }
}

// ===============================================
// 🔧 VARIABLES DE ENTORNO TIPADAS
// ===============================================

interface ImportMetaEnv {
  // Supabase (servidor y cliente)
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  
  // Supabase públicas (cliente)
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  
  // Configuración del entorno
  readonly MODE: 'development' | 'staging' | 'production' | 'test';
  readonly NODE_ENV: string;
  
  // Debug y desarrollo
  readonly DEBUG_AUTH?: string;
  readonly FALLBACK_TO_SIMPLE?: string;
  readonly EMERGENCY_BYPASS?: string;
  
  // PWA y branding
  readonly PUBLIC_APP_NAME: string;
  readonly PUBLIC_APP_SHORT_NAME: string;
  readonly PUBLIC_BRAND_PRIMARY_COLOR: string;
  readonly PUBLIC_COMPANY_NAME: string;
  readonly PUBLIC_COMPANY_PHONE: string;
  readonly PUBLIC_COMPANY_EMAIL: string;
  
  // Versión del Club Canino
  readonly CLUB_CANINO_VERSION?: string;
  
  // APIs externas (para futuras integraciones)
  readonly GOOGLE_MAPS_API_KEY?: string;
  readonly VAPID_PUBLIC_KEY?: string;
  readonly VAPID_PRIVATE_KEY?: string;
  
  // Configuración de notificaciones
  readonly PUSH_NOTIFICATIONS_ENABLED?: string;
  readonly EMAIL_NOTIFICATIONS_ENABLED?: string;
  
  // URLs base
  readonly PUBLIC_BASE_URL?: string;
  readonly PUBLIC_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ===============================================
// 🎯 TIPOS GLOBALES ADICIONALES
// ===============================================

// Tipos para los formularios de evaluación
type EvaluationStep = 1 | 2 | 3 | 4;

interface EvaluationFormData {
  dog_id: string;
  location: 'casa' | 'colegio';
  // Paso 1: Niveles básicos
  energy_level?: number;
  sociability_level?: number;
  obedience_level?: number;
  anxiety_level?: number;
  // Paso 2: Comportamientos específicos
  barks_much?: string;
  begs_food?: string;
  destructive?: string;
  social_with_dogs?: string;
  // Paso 3: Actividades del día
  ate_well?: string;
  played_with_toys?: string;
  responded_to_commands?: string;
  bathroom_accidents?: string;
  // Paso 4: Observaciones
  highlights?: string;
  concerns?: string;
  notes?: string;
}

// Estados de la PWA
interface PWAState {
  installed: boolean;
  installPrompt?: any;
  updateAvailable: boolean;
}

// Configuración del middleware
interface AuthConfig {
  DEBUG_MODE: boolean;
  ENABLE_FALLBACK: boolean;
  DEFENSIVE_MODE: boolean;
}

// Tipos para las notificaciones push
interface PushNotificationPayload {
  title: string;
  message: string;
  type: Notification['type'];
  dog_id?: string;
  evaluation_id?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

// ===============================================
// 🗺️ TIPOS PARA TRACKING GPS (FUTURO)
// ===============================================

interface VehicleLocation {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

interface TransportRoute {
  id: string;
  vehicle_id: string;
  date: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  estimated_start: string;
  actual_start?: string;
  estimated_end: string;
  actual_end?: string;
  dogs: string[]; // Array de dog_ids
  stops: TransportStop[];
}

interface TransportStop {
  id: string;
  route_id: string;
  dog_id: string;
  address: string;
  latitude: number;
  longitude: number;
  estimated_time: string;
  actual_time?: string;
  status: 'pending' | 'completed' | 'skipped';
  order: number;
}

// ===============================================
// 🎨 TIPOS PARA TEMAS Y BRANDING
// ===============================================

interface ClubCaninoTheme {
  primary: string;    // #56CCF2
  secondary: string;  // #FFFBF0
  accent: string;     // #C7EA46
  neutral: string;    // #2C3E50
  background: string; // #FFFBF0
  surface: string;    // #ACF0F4
}

// ===============================================
// 📱 EXTENSIONES PARA PWA
// ===============================================

declare global {
  interface Window {
    // Service Worker
    swRegistration?: ServiceWorkerRegistration;
    
    // PWA Install
    deferredPrompt?: any;
    
    // Supabase global (para debugging)
    supabase?: SupabaseClient;
    
    // Club Canino específicos
    clubCanino?: {
      version: string;
      config: AuthConfig;
      theme: ClubCaninoTheme;
    };
  }
}

// ===============================================
// 📊 TIPOS PARA ANALYTICS Y REPORTES
// ===============================================

interface DogProgress {
  dog_id: string;
  period_start: string;
  period_end: string;
  energy_trend: 'improving' | 'stable' | 'declining';
  sociability_trend: 'improving' | 'stable' | 'declining';
  obedience_trend: 'improving' | 'stable' | 'declining';
  anxiety_trend: 'improving' | 'stable' | 'declining';
  total_evaluations: number;
  casa_evaluations: number;
  colegio_evaluations: number;
  average_scores: {
    energy: number;
    sociability: number;
    obedience: number;
    anxiety: number;
  };
}

interface CollegeSummary {
  date: string;
  total_dogs: number;
  evaluations_completed: number;
  average_scores: {
    energy: number;
    sociability: number;
    obedience: number;
    anxiety: number;
  };
  top_performing_dogs: string[];
  dogs_needing_attention: string[];
}

// ===============================================
// 🔄 TIPOS PARA ESTADOS DE CARGA
// ===============================================

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface APIResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
  status: LoadingState;
}

// ===============================================
// 🎯 EXPORTACIONES FINALES
// ===============================================

export type {
  UserProfile,
  Dog,
  Evaluation,
  Notification,
  Photo,
  EvaluationFormData,
  EvaluationStep,
  PWAState,
  AuthConfig,
  PushNotificationPayload,
  VehicleLocation,
  TransportRoute,
  TransportStop,
  ClubCaninoTheme,
  DogProgress,
  CollegeSummary,
  LoadingState,
  APIResponse
};