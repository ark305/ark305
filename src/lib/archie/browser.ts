"use client";

import { createClient, type ArchieClient, type Session } from "@archie/js-sdk";
import { ARCHIE_ANON_KEY, ARCHIE_API_URL, ARCHIE_ENV, ARCHIE_PROJECT_ID, TOKEN_COOKIE, archieReady } from "./config";

// Un solo cliente de Archie en el teléfono: inicio de sesión, fotos y datos.
let client: ArchieClient | null = null;

export function archie(): ArchieClient {
  if (!archieReady) throw new Error("archie_not_configured");
  client ??= createClient({
    projectId: ARCHIE_PROJECT_ID,
    apiKey: ARCHIE_ANON_KEY,
    apiUrl: ARCHIE_API_URL,
    environment: ARCHIE_ENV,
    retries: 2,
  });
  return client;
}

// Copia el token de acceso a una cookie para que el servidor sepa quién eres.
// Devuelve true si la cookie cambió (hay que volver a pintar la página).
export function writeTokenCookie(session: Session | null): boolean {
  const current = document.cookie.split("; ").find((c) => c.startsWith(`${TOKEN_COOKIE}=`))?.slice(TOKEN_COOKIE.length + 1) ?? "";
  const next = session?.accessToken ?? "";
  if (current === next) return false;
  const secure = location.protocol === "https:" ? "; secure" : "";
  if (!next) {
    document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
  } else {
    // expiresAt puede venir en segundos o milisegundos.
    const exp = session!.expiresAt > 1e12 ? session!.expiresAt : session!.expiresAt * 1000;
    const maxAge = Math.max(60, Math.floor((exp - Date.now()) / 1000));
    document.cookie = `${TOKEN_COOKIE}=${next}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  }
  return true;
}
