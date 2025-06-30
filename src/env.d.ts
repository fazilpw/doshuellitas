/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// ============================================
// VARIABLES DE ENTORNO - CLUB CANINO DOS HUELLITAS
// ============================================
interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly PUBLIC_APP_NAME?: string;
  readonly PUBLIC_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}