import "server-only";
import { cache } from "react";
import { SERVICE_CATEGORIES, type ServiceCategory } from "./archie/categories";
import { archieReady } from "./archie/config";
import { gql } from "./archie/gql";
import { getSession } from "./archie/server";
import { getProfile as getDemoProfile, type Kind, type Profile, type Service } from "./mock-data";

// Un perfil = una fila de "member" en Archie (con los campos públicos que agregamos: handle, galería…).
// Quien ofrece servicios tiene además una fila de "provider" (member_id → member) y sus "service_offering".

export type ProfileRow = {
  id: string; // id del member en Archie
  handle: string;
  name: string;
  kind: Kind;
  role: string;
  role_en: string | null;
  area: string;
  tagline: string;
  tagline_en: string | null;
  photo_url: string | null;
  banner_url: string | null;
  gallery: string[];
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  bio_link: boolean;
  shared: boolean;
  followers: number;
  near: boolean;
  is_private: boolean;
  experience?: "lifestyle" | "business" | "both" | null;
  taste?: Record<string, number> | null;
  diagnosis?: Record<string, unknown> | null;
};

export { SERVICE_CATEGORIES, type ServiceCategory } from "./archie/categories";

export type ServiceRow = {
  id: string;
  owner: string; // id del provider
  title: string;
  kicker: string;
  detail: string;
  price: number;
  action: "book" | "request" | "view";
  category: ServiceCategory;
  photo_url: string | null;
  position: number;
};

// ---------- GraphQL ----------

export const MEMBER_FIELDS = `id authId handle fullName kind role roleEn area tagline taglineEn photoUrl bannerUrl gallery
  instagram tiktok facebook bioLink shared followers near isPrivate experience taste diagnosis`;
const SERVICE_FIELDS = `id providerId title kicker detail price action category photoUrl position`;

type MemberNode = {
  id: string;
  authId?: string | null;
  handle: string | null;
  fullName: string;
  kind: string | null;
  role: string | null;
  roleEn: string | null;
  area: string | null;
  tagline: string | null;
  taglineEn: string | null;
  photoUrl: string | null;
  bannerUrl: string | null;
  gallery: unknown;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  bioLink: boolean | null;
  shared: boolean | null;
  followers: number | null;
  near: boolean | null;
  isPrivate: boolean | null;
  experience: string | null;
  taste: unknown;
  diagnosis: unknown;
};

type ServiceNode = {
  id: string;
  providerId: string;
  title: string;
  kicker: string | null;
  detail: string | null;
  price: number;
  action: string | null;
  category: string;
  photoUrl: string | null;
  position: number | null;
};

const KINDS: Kind[] = ["member", "provider", "creator", "remote", "brand"];
const json = <T,>(v: unknown, fallback: T): T => {
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return (v ?? fallback) as T;
};

export function toRow(m: MemberNode): ProfileRow {
  const exp = m.experience;
  return {
    id: m.id,
    handle: m.handle ?? m.id,
    name: m.fullName,
    kind: KINDS.includes(m.kind as Kind) ? (m.kind as Kind) : "member",
    role: m.role ?? "",
    role_en: m.roleEn,
    area: m.area ?? "",
    tagline: m.tagline ?? "",
    tagline_en: m.taglineEn,
    photo_url: m.photoUrl,
    banner_url: m.bannerUrl,
    gallery: json<string[]>(m.gallery, []).filter((g) => typeof g === "string"),
    instagram: m.instagram,
    tiktok: m.tiktok,
    facebook: m.facebook,
    bio_link: !!m.bioLink,
    shared: !!m.shared,
    followers: m.followers ?? 0,
    near: !!m.near,
    is_private: !!m.isPrivate,
    experience: exp === "lifestyle" || exp === "business" || exp === "both" ? exp : null,
    taste: json<Record<string, number> | null>(m.taste, null),
    diagnosis: json<Record<string, unknown> | null>(m.diagnosis, null),
  };
}

function toServiceRow(s: ServiceNode): ServiceRow {
  return {
    id: s.id,
    owner: s.providerId,
    title: s.title,
    kicker: s.kicker ?? "",
    detail: s.detail ?? "",
    price: Math.round(s.price),
    action: s.action === "request" || s.action === "view" ? s.action : "book",
    category: (SERVICE_CATEGORIES as readonly string[]).includes(s.category) ? (s.category as ServiceCategory) : "PHOTOGRAPHER",
    photo_url: s.photoUrl,
    position: s.position ?? 0,
  };
}

// Convierte un perfil de Archie al formato que usan las pantallas.
export function toProfile(row: ProfileRow, services: ServiceRow[]): Profile {
  const socials: Profile["socials"] = [];
  if (row.instagram) socials.push({ network: "instagram", photo: row.gallery[0] ?? null, url: row.instagram });
  if (row.tiktok) socials.push({ network: "tiktok", photo: row.gallery[1] ?? null, url: row.tiktok });
  if (row.facebook) socials.push({ network: "facebook", photo: null, url: row.facebook });
  const loc = (es: string, en: string | null) => ({ es, en: en || es });
  return {
    handle: row.handle,
    name: row.name,
    kind: row.kind,
    private: row.is_private || undefined,
    role: loc(row.role, row.role_en),
    area: row.area,
    near: row.near,
    photo: row.photo_url,
    followers: row.followers,
    tagline: loc(row.tagline || row.role, row.tagline_en || row.role_en),
    banner: row.banner_url,
    socials,
    services: services.map(
      (s): Service => ({
        id: s.id,
        kicker: { es: s.kicker.toUpperCase(), en: s.kicker.toUpperCase() },
        title: { es: s.title, en: s.title },
        detail: { es: s.detail, en: s.detail },
        price: s.price,
        action: s.action,
        photo: s.photo_url ?? row.photo_url,
      }),
    ),
    posts: row.gallery,
  };
}

// ---------- Lecturas ----------

// El provider de un perfil (si ofrece servicios) y su vitrina.
export async function servicesOf(memberId: string, token?: string | null): Promise<{ providerId: string | null; services: ServiceRow[] }> {
  const { provider } = await gql<{ provider: { items: { id: string }[] } }>(
    `query($m: String) { provider(first: 1, filter: { memberId: { equals: $m } }) { items { id } } }`,
    { m: memberId },
    token,
  );
  const providerId = provider.items[0]?.id ?? null;
  if (!providerId) return { providerId: null, services: [] };
  const { serviceOffering } = await gql<{ serviceOffering: { items: ServiceNode[] } }>(
    `query($p: String) { serviceOffering(first: 50, filter: { providerId: { equals: $p }, isActive: { equals: true } }, orderBy: { position: ASC }) { items { ${SERVICE_FIELDS} } } }`,
    { p: providerId },
    token,
  );
  return { providerId, services: serviceOffering.items.map(toServiceRow) };
}

export type Viewer = {
  userId: string | null;
  email: string | null;
  token: string | null;
  row: ProfileRow | null;
  providerId: string | null;
  services: ServiceRow[];
  profile: Profile | null;
};

// Quién está usando la app ahora (una sola consulta por visita).
export const getViewer = cache(async (): Promise<Viewer> => {
  const empty: Viewer = { userId: null, email: null, token: null, row: null, providerId: null, services: [], profile: null };
  if (!archieReady) return empty;
  const session = await getSession();
  if (!session) return empty;
  const base = { ...empty, userId: session.userId, email: session.email, token: session.token };
  try {
    const { member } = await gql<{ member: { items: MemberNode[] } }>(
      `query($a: String) { member(first: 1, filter: { authId: { equals: $a } }) { items { ${MEMBER_FIELDS} } } }`,
      { a: session.userId },
      session.token,
    );
    const node = member.items[0];
    if (!node) return base;
    const row = toRow(node);
    const { providerId, services } = await servicesOf(row.id, session.token);
    return { ...base, row, providerId, services, profile: toProfile(row, services) };
  } catch (e) {
    console.error("archie viewer", e);
    return base;
  }
});

// Perfil público: primero los perfiles de Archie; si no existe, los de ejemplo.
export async function findProfile(handle: string): Promise<Profile | null> {
  if (archieReady) {
    try {
      const { member } = await gql<{ member: { items: MemberNode[] } }>(
        `query($h: String) { member(first: 1, filter: { handle: { equals: $h } }) { items { ${MEMBER_FIELDS} } } }`,
        { h: handle.toLowerCase() },
      );
      const node = member.items[0];
      if (node) {
        const row = toRow(node);
        return toProfile(row, (await servicesOf(row.id)).services);
      }
    } catch (e) {
      console.error("archie findProfile", e);
    }
  }
  return getDemoProfile(handle) ?? null;
}

// Perfiles más recientes (para Descubrir y las historias del feed).
export async function recentProfiles(limit = 24): Promise<Profile[]> {
  if (!archieReady) return [];
  try {
    const { member } = await gql<{ member: { items: MemberNode[] } }>(
      `query($n: Int) { member(first: $n, filter: { handle: { is_not_empty: true } }, orderBy: { createdAt: DESC }) { items { ${MEMBER_FIELDS} } } }`,
      { n: limit },
    );
    return member.items.map((m) => toProfile(toRow(m), []));
  } catch (e) {
    console.error("archie recentProfiles", e);
    return [];
  }
}
