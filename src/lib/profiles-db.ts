import 'server-only';
import { cache } from 'react';
import { getProfile as getDemoProfile, type Kind, type Profile, type Service } from './mock-data';
import { backendApi } from './backend-api';
import { supabaseReady } from './supabase/config';
import { createClient } from './supabase/server';

export type ProfileRow = {
  id: string; handle: string; name: string; kind: Kind; role: string; area: string; tagline: string;
  photo_url: string | null; banner_url: string | null; gallery: string[]; instagram: string | null;
  tiktok: string | null; facebook: string | null; bio_link: boolean; shared: boolean;
  experience?: 'lifestyle' | 'business' | 'both' | null; taste?: Record<string, number> | null;
  diagnosis?: Record<string, unknown> | null;
};

export type ServiceRow = {
  id: string; owner: string; title: string; kicker: string; detail: string; price: number;
  action: 'book' | 'request' | 'view'; photo_url: string | null; position: number;
};

const same = (value: string) => ({ es: value, en: value });

export function toProfile(row: ProfileRow, services: ServiceRow[]): Profile {
  const socials: Profile['socials'] = [];
  if (row.instagram) socials.push({ network: 'instagram', photo: row.gallery[0] ?? null, url: row.instagram });
  if (row.tiktok) socials.push({ network: 'tiktok', photo: row.gallery[1] ?? null, url: row.tiktok });
  if (row.facebook) socials.push({ network: 'facebook', photo: null, url: row.facebook });
  return {
    handle: row.handle, name: row.name, kind: row.kind, role: same(row.role), area: row.area, near: false,
    photo: row.photo_url, followers: 0, tagline: same(row.tagline || row.role), banner: row.banner_url, socials,
    services: services.map((service): Service => ({
      id: service.id, kicker: same(service.kicker.toUpperCase()), title: same(service.title), detail: same(service.detail),
      price: service.price, action: service.action, photo: service.photo_url ?? row.photo_url,
    })),
    posts: row.gallery,
  };
}

export type Viewer = { userId: string | null; email: string | null; row: ProfileRow | null; services: ServiceRow[]; profile: Profile | null };
type ViewerResponse = { userId: string; row: ProfileRow | null; services: ServiceRow[] };

export const getViewer = cache(async (): Promise<Viewer> => {
  const empty: Viewer = { userId: null, email: null, row: null, services: [], profile: null };
  if (!supabaseReady) return empty;
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user || !session.session?.access_token || session.session.user.id !== user.user.id) return empty;
  try {
    const result = await backendApi<ViewerResponse>('profiles/me', { token: session.session.access_token });
    if (result.userId !== user.user.id || (result.row && result.row.id !== user.user.id) ||
        !Array.isArray(result.services) || result.services.some((service) => service.owner !== user.user.id)) {
      throw new Error('Viewer identity mismatch');
    }
    return { userId: result.userId, email: user.user.email ?? null, row: result.row, services: result.services, profile: result.row ? toProfile(result.row, result.services) : null };
  } catch {
    // A failed lookup must never be interpreted as a missing account profile.
    throw new Error('Account temporarily unavailable');
  }
});

export async function findProfile(handle: string): Promise<Profile | null> {
  if (supabaseReady) {
    try {
      const result = await backendApi<{ profile: ProfileRow | null; services: ServiceRow[] }>(`profiles/handle/${encodeURIComponent(handle.toLowerCase())}`);
      if (result.profile) return toProfile(result.profile, result.services);
    } catch { /* Continue with the existing demo fallback when the API is unavailable. */ }
  }
  return getDemoProfile(handle) ?? null;
}

export async function recentProfiles(limit = 24): Promise<Profile[]> {
  if (!supabaseReady) return [];
  try {
    const result = await backendApi<{ items: ProfileRow[] }>(`profiles/recent?limit=${encodeURIComponent(String(limit))}`);
    return result.items.map((row) => toProfile(row, []));
  } catch { return []; }
}
