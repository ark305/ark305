import "server-only";
import { cache } from "react";
import { getProfile as getDemoProfile, type Kind, type Profile, type Service } from "./mock-data";
import { supabaseReady } from "./supabase/config";
import { createClient } from "./supabase/server";

export type ProfileRow = {
  id: string;
  handle: string;
  name: string;
  kind: Kind;
  role: string;
  area: string;
  tagline: string;
  photo_url: string | null;
  banner_url: string | null;
  gallery: string[];
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  bio_link: boolean;
  shared: boolean;
  experience?: "lifestyle" | "business" | "both" | null; // columna nueva (supabase/002_experiences.sql)
  taste?: Record<string, number> | null;
};

export type ServiceRow = {
  id: string;
  owner: string;
  title: string;
  kicker: string;
  detail: string;
  price: number;
  action: "book" | "request" | "view";
  photo_url: string | null;
  position: number;
};

const same = (s: string) => ({ es: s, en: s });

// Convierte un perfil de la base de datos al formato que usan las pantallas.
export function toProfile(row: ProfileRow, services: ServiceRow[]): Profile {
  const socials: Profile["socials"] = [];
  if (row.instagram) socials.push({ network: "instagram", photo: row.gallery[0] ?? null, url: row.instagram });
  if (row.tiktok) socials.push({ network: "tiktok", photo: row.gallery[1] ?? null, url: row.tiktok });
  if (row.facebook) socials.push({ network: "facebook", photo: null, url: row.facebook });
  return {
    handle: row.handle,
    name: row.name,
    kind: row.kind,
    role: same(row.role),
    area: row.area,
    near: false,
    photo: row.photo_url,
    followers: 0,
    tagline: same(row.tagline || row.role),
    banner: row.banner_url,
    socials,
    services: services.map(
      (s): Service => ({
        id: s.id,
        kicker: same(s.kicker.toUpperCase()),
        title: same(s.title),
        detail: same(s.detail),
        price: s.price,
        action: s.action,
        photo: s.photo_url ?? row.photo_url,
      }),
    ),
    posts: row.gallery,
  };
}

export type Viewer = {
  userId: string | null;
  email: string | null;
  row: ProfileRow | null;
  services: ServiceRow[];
  profile: Profile | null;
};

// Quién está usando la app ahora (una sola consulta por visita).
export const getViewer = cache(async (): Promise<Viewer> => {
  const empty: Viewer = { userId: null, email: null, row: null, services: [], profile: null };
  if (!supabaseReady) return empty;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return empty;
  const [{ data: row }, { data: services }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle<ProfileRow>(),
    supabase.from("services").select("*").eq("owner", data.user.id).order("position").returns<ServiceRow[]>(),
  ]);
  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    row: row ?? null,
    services: services ?? [],
    profile: row ? toProfile(row, services ?? []) : null,
  };
});

// Perfil público: primero los perfiles reales, si no existe, los de ejemplo.
export async function findProfile(handle: string): Promise<Profile | null> {
  if (supabaseReady) {
    const supabase = await createClient();
    const { data: row } = await supabase.from("profiles").select("*").eq("handle", handle.toLowerCase()).maybeSingle<ProfileRow>();
    if (row) {
      const { data: services } = await supabase.from("services").select("*").eq("owner", row.id).order("position").returns<ServiceRow[]>();
      return toProfile(row, services ?? []);
    }
  }
  return getDemoProfile(handle) ?? null;
}

// Perfiles reales más recientes (para Descubrir y las historias del feed).
export async function recentProfiles(limit = 24): Promise<Profile[]> {
  if (!supabaseReady) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(limit).returns<ProfileRow[]>();
  return (data ?? []).map((r) => toProfile(r, []));
}
