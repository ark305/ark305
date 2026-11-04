import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

// Cliente de Supabase para el servidor: usa la sesión guardada en cookies.
export async function createClient() {
  const jar = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // En páginas (no en acciones) no se pueden escribir cookies; el proxy ya renovó la sesión.
        }
      },
    },
  });
}
