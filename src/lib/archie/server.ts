import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { JWKS_URL, TOKEN_COOKIE, archieReady } from "./config";

const jwks = archieReady ? createRemoteJWKSet(new URL(JWKS_URL)) : null;

export type Session = { userId: string; email: string | null; token: string };

// Quién está conectado en esta visita. Verificamos la firma del token con las llaves públicas
// de Archie: nunca confiamos en una cookie sin revisar.
export const getSession = cache(async (): Promise<Session | null> => {
  if (!jwks) return null;
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwks);
    const userId = typeof payload.sub === "string" ? payload.sub : typeof payload.userId === "string" ? payload.userId : null;
    if (!userId) return null;
    return { userId, email: typeof payload.email === "string" ? payload.email : null, token };
  } catch {
    return null; // vencido o alterado: como invitado hasta que el navegador renueve la sesión
  }
});
