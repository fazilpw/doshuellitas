// src/env.d.ts
// TIPOS ACTUALIZADOS PARA CLUB CANINO
/// <reference types="astro/client" />

import type { SupabaseClient, User } from '@supabase/supabase-js';

// Interfaz del perfil de usuario del Club Canino
interface UserProfile {
  id: string;
  email: string;
  role: 'padre' | 'profesor' | 'admin';
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  club_member_since: string;
  created_at: string;
  updated_at: string;
}

// Extender tipos de Astro para nuestro proyecto Club Canino
declare namespace App {
  interface Locals {
    user: User | null;
    supabase: SupabaseClient;
    profile: UserProfile | null;
  }
}

// Variables de entorno con tipos estrictos para Club Canino
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly MODE: 'development' | 'staging' | 'production' | 'test';
  readonly DEBUG_AUTH?: string;
  readonly FALLBACK_TO_SIMPLE?: string;
  readonly EMERGENCY_BYPASS?: string;
  readonly CLUB_CANINO_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}