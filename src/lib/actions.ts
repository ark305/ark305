"use server";

// Acciones que guardan en Archie. Cada una revisa primero quién está conectado:
// estas funciones se pueden llamar desde fuera de la app, así que nunca confiamos en el formulario.
import { refresh, revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { archieReady, TOKEN_COOKIE } from "./archie/config";
import { gql } from "./archie/gql";
import { getSession } from "./archie/server";
import { buildSnapshot, sanitize } from "./diagnosis";
import { profiles as demoProfiles, type Kind } from "./mock-data";
import { parseSide, sideToExperience } from "./mode";
import { MEMBER_FIELDS, SERVICE_CATEGORIES, servicesOf, toRow, type ServiceCategory } from "./profiles-db";

export type FormState = { error?: string; ok?: boolean } | undefined;
type ErrorKey = "auth" | "name" | "handle" | "title" | "price" | "photo" | "generic";
const fail = (error: ErrorKey): FormState => ({ error });

const HANDLE_RE = /^[a-z0-9._]{3,30}$/;
const KINDS: Kind[] = ["member", "provider", "creator", "remote", "brand"];
// Enlaces que no se pueden usar: los perfiles de ejemplo y palabras de la app.
const RESERVED = new Set([...demoProfiles.map((p) => p.handle), "admin", "ark", "arkai", "soporte", "support", "perfil", "private", "ark305"]);

const text = (f: FormData, key: string, max: number) => String(f.get(key) ?? "").trim().slice(0, max);

// Tu fila de "member" en Archie (o null si todavía no creaste tu perfil).
async function me() {
  const session = await getSession();
  if (!session) return { session: null, member: null };
  const { member } = await gql<{ member: { items: Parameters<typeof toRow>[0][] } }>(
    `query($a: String) { member(first: 1, filter: { authId: { equals: $a } }) { items { ${MEMBER_FIELDS} } } }`,
    { a: session.userId },
    session.token,
  );
  return { session, member: member.items[0] ? toRow(member.items[0]) : null };
}

async function updateMe(input: Record<string, unknown>) {
  const { session, member } = await me();
  if (!session || !member) return false;
  await gql(`mutation($id: String, $in: MemberUpdateInput!) { updateMember(id: $id, input: $in) { id } }`, { id: member.id, in: input }, session.token);
  return true;
}

// Una foto solo vale si es una dirección https (las subidas a Archie o las de ejemplo).
function photoOrNull(value: string): string | null | false {
  if (!value) return null;
  try {
    return new URL(value).protocol === "https:" && value.length <= 500 ? value : false;
  } catch {
    return false;
  }
}

function socialUrl(value: string) {
  if (!value) return null;
  const v = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(v).protocol.startsWith("http") ? v.slice(0, 200) : null;
  } catch {
    return null;
  }
}

async function handleTaken(handle: string, mine: string | null, token: string | null) {
  const { member } = await gql<{ member: { items: { id: string }[] } }>(
    `query($h: String) { member(first: 1, filter: { handle: { equals: $h } }) { items { id } } }`,
    { h: handle },
    token,
  );
  const hit = member.items[0];
  return !!hit && hit.id !== mine;
}

export async function checkHandle(handle: string): Promise<"available" | "taken" | "invalid"> {
  const h = handle.trim().toLowerCase();
  if (!HANDLE_RE.test(h)) return "invalid";
  if (RESERVED.has(h)) return "taken";
  if (!archieReady) return "available";
  const { session, member } = await me();
  return (await handleTaken(h, member?.id ?? null, session?.token ?? null)) ? "taken" : "available";
}

export async function createProfile(_: FormState, form: FormData): Promise<FormState> {
  const { session, member } = await me();
  if (!session) return fail("auth");
  if (member) redirect("/perfil");

  const name = text(form, "name", 60);
  const handle = text(form, "handle", 30).toLowerCase();
  const kind = text(form, "kind", 20) as Kind;
  const photo = photoOrNull(text(form, "photo_url", 500));
  if (!name) return fail("name");
  if (!HANDLE_RE.test(handle) || RESERVED.has(handle)) return fail("handle");
  if (photo === false) return fail("photo");
  if (await handleTaken(handle, null, session.token)) return fail("handle");

  const jar = await cookies();
  const side = parseSide(jar.get("side")?.value);
  try {
    await gql(
      `mutation($in: MemberCreateInput!) { createMember(input: $in) { id } }`,
      {
        in: {
          authId: session.userId,
          email: session.email ?? text(form, "email", 200),
          fullName: name,
          handle,
          kind: KINDS.includes(kind) ? kind : "member",
          role: text(form, "role", 60),
          area: text(form, "area", 60),
          photoUrl: photo,
          tier: "PLAYGROUND",
          status: "ACTIVE",
          dues: 0,
          language: jar.get("lang")?.value === "en" ? "EN" : "ES",
          experience: side ? sideToExperience(side) : null,
        },
      },
      session.token,
    );
  } catch (e) {
    console.error("archie createProfile", e);
    return fail("generic");
  }
  revalidatePath("/", "layout");
  redirect("/perfil");
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const { session, member } = await me();
  if (!session || !member) return fail("auth");

  const name = text(form, "name", 60);
  const handle = text(form, "handle", 30).toLowerCase();
  const kind = text(form, "kind", 20) as Kind;
  const photo = photoOrNull(text(form, "photo_url", 500));
  const banner = photoOrNull(text(form, "banner_url", 500));
  const gallery = form
    .getAll("gallery")
    .map((g) => photoOrNull(String(g)))
    .filter((g): g is string => typeof g === "string")
    .slice(0, 12);
  if (!name) return fail("name");
  if (!HANDLE_RE.test(handle) || RESERVED.has(handle)) return fail("handle");
  if (photo === false || banner === false) return fail("photo");
  if (handle !== member.handle && (await handleTaken(handle, member.id, session.token))) return fail("handle");

  try {
    await gql(
      `mutation($id: String, $in: MemberUpdateInput!) { updateMember(id: $id, input: $in) { id } }`,
      {
        id: member.id,
        in: {
          fullName: name,
          handle,
          kind: KINDS.includes(kind) ? kind : "member",
          role: text(form, "role", 60),
          area: text(form, "area", 60),
          tagline: text(form, "tagline", 80),
          photoUrl: photo,
          bannerUrl: banner,
          gallery,
          instagram: socialUrl(text(form, "instagram", 200)),
          tiktok: socialUrl(text(form, "tiktok", 200)),
          facebook: socialUrl(text(form, "facebook", 200)),
        },
      },
      session.token,
    );
  } catch (e) {
    console.error("archie updateProfile", e);
    return fail("generic");
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

// Tu "provider" en Archie: se crea solo la primera vez que publicas un servicio.
async function ensureProvider(member: NonNullable<Awaited<ReturnType<typeof me>>["member"]>, token: string, category: ServiceCategory) {
  const { providerId } = await servicesOf(member.id, token);
  if (providerId) return providerId;
  const { createProviderMany } = await gql<{ createProviderMany: { createdIds: string[] | null } }>(
    `mutation($in: [ProviderCreateInput!]!) { createProviderMany(inputs: $in, transactionMode: ALL_OR_NOTHING) { createdIds } }`,
    {
      in: [
        {
          name: member.name,
          category,
          bio: member.tagline || member.role,
          neighborhood: member.area,
          status: "ACTIVE",
          isDemoData: false,
          member: { connect: { id: member.id } },
        },
      ],
    },
    token,
  );
  const id = createProviderMany.createdIds?.[0];
  if (!id) throw new Error("provider_not_created");
  return id;
}

export async function saveService(_: FormState, form: FormData): Promise<FormState> {
  const { session, member } = await me();
  if (!session || !member) return fail("auth");

  const id = text(form, "id", 40);
  const title = text(form, "title", 80);
  const price = Number(text(form, "price", 10));
  const action = text(form, "action", 10);
  const rawCategory = text(form, "category", 20).toUpperCase();
  const category: ServiceCategory = (SERVICE_CATEGORIES as readonly string[]).includes(rawCategory) ? (rawCategory as ServiceCategory) : "PHOTOGRAPHER";
  const photo = photoOrNull(text(form, "photo_url", 500));
  if (!title) return fail("title");
  if (!Number.isInteger(price) || price < 0 || price > 1_000_000) return fail("price");
  if (photo === false) return fail("photo");

  const values = {
    title,
    kicker: text(form, "kicker", 30),
    detail: text(form, "detail", 80),
    price,
    category,
    action: ["book", "request", "view"].includes(action) ? action : "book",
    photoUrl: photo,
  };
  try {
    const providerId = await ensureProvider(member, session.token, category);
    if (id) {
      // Solo puedes editar servicios de tu propio provider.
      const { services } = await servicesOf(member.id, session.token);
      if (!services.some((s) => s.id === id)) return fail("auth");
      await gql(`mutation($id: String, $in: ServiceOfferingUpdateInput!) { updateServiceOffering(id: $id, input: $in) { id } }`, { id, in: values }, session.token);
    } else {
      await gql(
        `mutation($in: ServiceOfferingCreateInput!) { createServiceOffering(input: $in) { id } }`,
        { in: { ...values, isActive: true, position: Date.now() % 1_000_000_000, provider: { connect: { id: providerId } } } },
        session.token,
      );
    }
  } catch (e) {
    console.error("archie saveService", e);
    return fail("generic");
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteService(id: string) {
  const { session, member } = await me();
  if (!session || !member) return;
  const { services } = await servicesOf(member.id, session.token);
  if (!services.some((s) => s.id === id)) return;
  await gql(`mutation($id: String) { deleteServiceOffering(id: $id) }`, { id }, session.token);
  revalidatePath("/", "layout");
}

// Marca como hecho un paso de "Hazte visible".
export async function markStep(step: "bio_link" | "shared") {
  await updateMe(step === "bio_link" ? { bioLink: true } : { shared: true });
  refresh();
}

// La sesión vive en el navegador (el SDK la cierra); aquí borramos la cookie del servidor.
export async function signOut() {
  (await cookies()).delete(TOKEN_COOKIE);
  revalidatePath("/", "layout");
  redirect("/");
}

// Gustos del feed (tema → puntos), para que el feed te conozca en cualquier teléfono.
export async function saveTaste(taste: Record<string, number>) {
  const clean = Object.fromEntries(
    Object.entries(taste)
      .filter(([k, v]) => /^[a-z-]{2,20}$/.test(k) && Number.isFinite(v))
      .slice(0, 40)
      .map(([k, v]) => [k, Math.max(-50, Math.min(200, Math.round(v)))]),
  );
  if (!archieReady) return;
  await updateMe({ taste: clean }).catch((e) => console.error("archie saveTaste", e));
}

// Personal o Business. En el teléfono (cookie) y, si entraste, en tu cuenta.
export async function saveSide(value: string) {
  const side = parseSide(value);
  if (!side) return;
  const jar = await cookies();
  jar.set("side", side, { path: "/", maxAge: 31536000, sameSite: "lax" });
  if (archieReady) await updateMe({ experience: sideToExperience(side) }).catch((e) => console.error("archie saveSide", e));
  revalidatePath("/", "layout");
}

// Guarda el Diagnóstico ARK y aplica su resultado (Personal o Business).
export async function saveDiagnosis(raw: unknown, applySide = true) {
  const answers = sanitize(raw);
  const snap = buildSnapshot(answers);
  if (applySide && snap) await saveSide(snap.side);
  if (!archieReady) return;
  await updateMe({ diagnosis: { answers, at: new Date().toISOString() } }).catch((e) => console.error("archie saveDiagnosis", e));
  revalidatePath("/", "layout");
}

// "Lo que ARK sabe de mí": borrar el diagnóstico de la cuenta.
export async function clearDiagnosis() {
  if (!archieReady) return;
  await updateMe({ diagnosis: null, taste: {} }).catch((e) => console.error("archie clearDiagnosis", e));
  revalidatePath("/", "layout");
}

// ---------- Reservas (Mi día) ----------

export type BookItem = { id: string; startsAt: string; qty: number; guests: number };
export type BookResult = { ok: true; code: string; saved: boolean } | { ok: false; error: "auth" | "profile" | "generic" };

type Offering = { id: string; slug: string; title: string; price: number; unit: string | null; providerId: string };

// Reserva todo tu día: una "experience_booking" por servicio, en estado Requested.
// Sin cuenta (o sin Archie) la reserva sigue siendo la demostración de siempre.
export async function bookDay(items: BookItem[], priority: boolean): Promise<BookResult> {
  const demo = { ok: true as const, code: `ARK-${Math.floor(1000 + Math.random() * 9000)}`, saved: false };
  if (!archieReady) return demo;
  const { session, member } = await me();
  if (!session) return { ok: false, error: "auth" };
  if (!member) return { ok: false, error: "profile" };

  const clean = items.slice(0, 20).filter((i) => /^[a-zA-Z0-9-]{2,40}$/.test(i.id) && !Number.isNaN(Date.parse(i.startsAt)));
  if (!clean.length) return { ok: false, error: "generic" };
  try {
    const { serviceOffering } = await gql<{ serviceOffering: { items: Offering[] } }>(
      `query($s: [String!]) { serviceOffering(first: 50, filter: { slug: { in: $s } }) { items { id slug title price unit providerId } } }`,
      { s: [...new Set(clean.map((i) => i.id))] },
      session.token,
    );
    const bySlug = new Map(serviceOffering.items.map((o) => [o.slug, o]));
    const inputs = clean
      .map((i, n) => {
        const o = bySlug.get(i.id);
        if (!o) return null;
        const qty = Math.max(1, Math.min(12, Math.round(i.qty)));
        const guests = Math.max(1, Math.min(20, Math.round(i.guests)));
        const price = o.unit === "h" ? o.price * qty : o.unit === "p" ? o.price * guests : o.price;
        const start = new Date(i.startsAt);
        return {
          serviceName: o.title,
          serviceOrder: n + 1,
          startsAt: start.toISOString(),
          endsAt: o.unit === "h" ? new Date(start.getTime() + qty * 3600_000).toISOString() : null,
          partySize: guests,
          price,
          status: "REQUESTED",
          instantConfirmed: false,
          notes: priority ? "priority" : null,
          member: { connect: { id: member.id } },
          provider: { connect: { id: o.providerId } },
          serviceOffering: { connect: { id: o.id } },
        };
      })
      .filter(Boolean);
    if (!inputs.length) return demo; // servicios que todavía no están en Archie
    const { createExperienceBookingMany } = await gql<{ createExperienceBookingMany: { createdIds: string[] | null } }>(
      `mutation($in: [ExperienceBookingCreateInput!]!) { createExperienceBookingMany(inputs: $in, transactionMode: ALL_OR_NOTHING) { createdIds } }`,
      { in: inputs },
      session.token,
    );
    const first = createExperienceBookingMany.createdIds?.[0];
    if (!first) return { ok: false, error: "generic" };
    revalidatePath("/panel");
    return { ok: true, code: `ARK-${first.replace(/-/g, "").slice(0, 6).toUpperCase()}`, saved: true };
  } catch (e) {
    console.error("archie bookDay", e);
    return { ok: false, error: "generic" };
  }
}
