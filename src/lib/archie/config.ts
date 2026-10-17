// Datos públicos de Archie (van al navegador por diseño). Si faltan, la app sigue en modo demo.
// La llave "anon" solo debe tener permisos de lectura del catálogo (rol Guest en Archie).
export const ARCHIE_PROJECT_ID = process.env.NEXT_PUBLIC_ARCHIE_PROJECT_ID ?? "";
export const ARCHIE_ENV = process.env.NEXT_PUBLIC_ARCHIE_ENVIRONMENT || "master";
export const ARCHIE_API_URL = (process.env.NEXT_PUBLIC_ARCHIE_API_URL || "https://archie-core.services.archie.com").replace(/\/+$/, "");
export const ARCHIE_ANON_KEY = process.env.NEXT_PUBLIC_ARCHIE_ANON_KEY ?? "";

export const archieReady = Boolean(ARCHIE_PROJECT_ID && ARCHIE_ANON_KEY);

// La sesión vive en el navegador (SDK de Archie). Copiamos solo el token de acceso a esta cookie
// para que el servidor sepa quién eres al pintar las páginas y al guardar.
export const TOKEN_COOKIE = "ark_token";

// Llaves públicas de Archie para verificar el token en el servidor.
export const JWKS_URL = `${ARCHIE_API_URL}/auth/${ARCHIE_PROJECT_ID}/${ARCHIE_ENV}/.well-known/jwks.json`;
