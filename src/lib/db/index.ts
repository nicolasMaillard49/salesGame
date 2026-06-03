import "server-only";
import { MemoryStore } from "./memory";
import { SupabaseStore } from "./supabase";
import type { Store } from "./types";

let _store: Store | null = null;

/** Renvoie le store actif : Supabase si configuré, sinon mémoire (suivi dégradé). */
export function getStore(): Store {
  if (_store) return _store;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    _store = new SupabaseStore(url, key);
  } else {
    _store = new MemoryStore();
  }
  return _store;
}

export type { Store } from "./types";
export * from "./types";
