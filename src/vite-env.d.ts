/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://kmvbqjlsiwhivxhmgdqt.supabase.co */
  readonly VITE_SUPABASE_URL: string;
  /** Public anon / publishable key. Safe to expose in the client bundle. */
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
