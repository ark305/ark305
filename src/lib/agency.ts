import "server-only";

import { createClient } from "@/lib/supabase/server";
import { supabaseReady } from "@/lib/supabase/config";

export type AgencyLinkKind = "social" | "product" | "link";

export interface AgencyLink {
  id: string;
  profile_id: string;
  kind: AgencyLinkKind;
  section: string;
  title: string;
  subtitle: string;
  url: string;
  image_url: string | null;
  position: number;
  is_active: boolean;
}

export interface AgencyProfile {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  tagline: string;
  avatar_url: string | null;
  cover_url: string | null;
  is_active: boolean;
  links: AgencyLink[];
}

export interface AgencyProfileSummary extends Omit<AgencyProfile, "links"> {
  link_count: number;
  total_clicks: number;
}

// Perfil público + sus links activos, ordenados por sección y posición.
export async function getAgencyProfile(handle: string): Promise<AgencyProfile | null> {
  if (!supabaseReady) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("agency_profiles")
    .select("*")
    .eq("handle", handle.toLowerCase())
    .eq("is_active", true)
    .maybeSingle();
  if (!profile) return null;
  const { data: links } = await supabase
    .from("agency_links")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("is_active", true)
    .order("section")
    .order("position");
  return { ...profile, links: links ?? [] };
}

// Roster para el panel: perfiles con conteo de links y clics totales.
export async function getAgencyProfiles(): Promise<AgencyProfileSummary[]> {
  if (!supabaseReady) return [];
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("agency_profiles")
    .select("*")
    .order("created_at");
  if (!profiles?.length) return [];
  const ids = profiles.map((p) => p.id);
  const [{ data: links }, { data: clicks }] = await Promise.all([
    supabase.from("agency_links").select("profile_id").in("profile_id", ids).eq("is_active", true),
    supabase.from("agency_clicks").select("profile_id").in("profile_id", ids),
  ]);
  const linkCount = new Map<string, number>();
  const clickCount = new Map<string, number>();
  (links ?? []).forEach((l) => linkCount.set(l.profile_id, (linkCount.get(l.profile_id) ?? 0) + 1));
  (clicks ?? []).forEach((c) => clickCount.set(c.profile_id, (clickCount.get(c.profile_id) ?? 0) + 1));
  return profiles.map((p) => ({
    ...p,
    link_count: linkCount.get(p.id) ?? 0,
    total_clicks: clickCount.get(p.id) ?? 0,
  }));
}

// Links de un perfil (panel, incluye inactivos).
export async function getAgencyProfileLinks(profileId: string): Promise<AgencyLink[]> {
  if (!supabaseReady) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("agency_links")
    .select("*")
    .eq("profile_id", profileId)
    .order("section")
    .order("position");
  return data ?? [];
}
