"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

// Cliente de Supabase para el teléfono (iniciar sesión y subir fotos).
export const createClient = () => createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
