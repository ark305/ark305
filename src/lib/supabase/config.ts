// Datos públicos de Supabase (van al navegador por diseño). Si faltan, la app sigue en modo demo.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Solo aceptamos fotos subidas a la carpeta de la propia persona.
export const mediaPrefix = (uid: string) => `${SUPABASE_URL}/storage/v1/object/public/media/${uid}/`;
