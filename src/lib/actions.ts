"use server";

// Acciones que guardan en Supabase. Cada una revisa primero quién está conectado:
// estas funciones se pueden llamar desde fuera de la app, así que nunca confiamos en el formulario.
import { refresh, revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { profiles as demoProfiles, type Kind } from "./mock-data";
import { buildSnapshot, sanitize } from "./diagnosis";
import { parseSide, sideToExperience } from "./mode";
import { mediaPrefix, supabaseReady } from "./supabase/config";
import { createClient } from "./supabase/server";

export type FormState = { error?: string; ok?: boolean } | undefined;
type ErrorKey = "auth" | "name" | "handle" | "title" | "price" | "photo" | "generic";
const fail = (error: ErrorKey): FormState => ({ error });

const HANDLE_RE = /^[a-z0-9._]{3,30}$/;
const KINDS: Kind[] = ["member", "provider", "creator", "remote", "brand"];
// Enlaces que no se pueden usar: los perfiles de ejemplo y palabras de la app.
const RESERVED = new Set([...demoProfiles.map((p) => p.handle), "admin", "ark", "arkai", "soporte", "support", "perfil", "private", "ark305"]);

const text = (f: FormData, key: string, max: number) => String(f.get(key) ?? "").trim().slice(0, max);

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

// Una foto solo vale si está en la carpeta de la propia persona.
function photoOrNull(value: string, uid: string): string | null | false {
  if (!value) return null;
  return value.startsWith(mediaPrefix(uid)) && value.length <= 500 ? value : false;
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

export async function checkHandle(handle: string): Promise<"available" | "taken" | "invalid"> {
  const h = handle.trim().toLowerCase();
  if (!HANDLE_RE.test(h)) return "invalid";
  if (RESERVED.has(h)) return "taken";
  const { supabase, user } = await currentUser();
  const { data } = await supabase.from("profiles").select("id").eq("handle", h).maybeSingle();
  return data && data.id !== user?.id ? "taken" : "available";
}

export async function createProfile(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  if (!user) return fail("auth");

  const name = text(form, "name", 60);
  const handle = text(form, "handle", 30).toLowerCase();
  const kind = text(form, "kind", 20) as Kind;
  const photo = photoOrNull(text(form, "photo_url", 500), user.id);
  if (!name) return fail("name");
  if (!HANDLE_RE.test(handle) || RESERVED.has(handle)) return fail("handle");
  if (photo === false) return fail("photo");

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    handle,
    name,
    kind: KINDS.includes(kind) ? kind : "member",
    role: text(form, "role", 60),
    area: text(form, "area", 60),
    photo_url: photo,
  });
  if (error) return fail(error.code === "23505" ? "handle" : "generic");
  revalidatePath("/", "layout");
  redirect("/perfil");
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  if (!user) return fail("auth");

  const name = text(form, "name", 60);
  const handle = text(form, "handle", 30).toLowerCase();
  const kind = text(form, "kind", 20) as Kind;
  const photo = photoOrNull(text(form, "photo_url", 500), user.id);
  const banner = photoOrNull(text(form, "banner_url", 500), user.id);
  const gallery = form
    .getAll("gallery")
    .map((g) => photoOrNull(String(g), user.id))
    .filter((g): g is string => typeof g === "string")
    .slice(0, 12);
  if (!name) return fail("name");
  if (!HANDLE_RE.test(handle) || RESERVED.has(handle)) return fail("handle");
  if (photo === false || banner === false) return fail("photo");

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      handle,
      kind: KINDS.includes(kind) ? kind : "member",
      role: text(form, "role", 60),
      area: text(form, "area", 60),
      tagline: text(form, "tagline", 80),
      photo_url: photo,
      banner_url: banner,
      gallery,
      instagram: socialUrl(text(form, "instagram", 200)),
      tiktok: socialUrl(text(form, "tiktok", 200)),
      facebook: socialUrl(text(form, "facebook", 200)),
    })
    .eq("id", user.id);
  if (error) return fail(error.code === "23505" ? "handle" : "generic");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveService(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await currentUser();
  if (!user) return fail("auth");

  const id = text(form, "id", 40);
  const title = text(form, "title", 80);
  const price = Number(text(form, "price", 10));
  const action = text(form, "action", 10);
  const photo = photoOrNull(text(form, "photo_url", 500), user.id);
  if (!title) return fail("title");
  if (!Number.isInteger(price) || price < 0 || price > 1_000_000) return fail("price");
  if (photo === false) return fail("photo");

  const values = {
    title,
    kicker: text(form, "kicker", 30),
    detail: text(form, "detail", 80),
    price,
    action: ["book", "request", "view"].includes(action) ? action : "book",
    photo_url: photo,
  };
  const { error } = id
    ? await supabase.from("services").update(values).eq("id", id).eq("owner", user.id)
    : await supabase.from("services").insert({ ...values, owner: user.id, position: Date.now() % 1_000_000_000 });
  if (error) return fail("generic");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteService(id: string) {
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase.from("services").delete().eq("id", id).eq("owner", user.id);
  revalidatePath("/", "layout");
}

// Marca como hecho un paso de "Hazte visible".
export async function markStep(step: "bio_link" | "shared") {
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase.from("profiles").update({ [step]: true }).eq("id", user.id);
  refresh();
}

export async function signOut() {
  const { supabase } = await currentUser();
  await supabase.auth.signOut();
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
  if (!supabaseReady) return;
  const { supabase, user } = await currentUser();
  if (user) await supabase.from("profiles").update({ taste: clean }).eq("id", user.id);
}

// Personal o Business. En el teléfono (cookie) y, si entraste, en tu cuenta.
export async function saveSide(value: string) {
  const side = parseSide(value);
  if (!side) return;
  const jar = await cookies();
  jar.set("side", side, { path: "/", maxAge: 31536000, sameSite: "lax" });
  if (supabaseReady) {
    const { supabase, user } = await currentUser();
    if (user) await supabase.from("profiles").update({ experience: sideToExperience(side) }).eq("id", user.id);
  }
  revalidatePath("/", "layout");
}

// Guarda el Diagnóstico ARK y aplica su resultado (Personal o Business).
export async function saveDiagnosis(raw: unknown, applySide = true) {
  const answers = sanitize(raw);
  const snap = buildSnapshot(answers);
  if (applySide && snap) await saveSide(snap.side);
  if (!supabaseReady) return;
  const { supabase, user } = await currentUser();
  if (user) await supabase.from("profiles").update({ diagnosis: { answers, at: new Date().toISOString() } }).eq("id", user.id);
  revalidatePath("/", "layout");
}

// "Lo que ARK sabe de mí": borrar el diagnóstico de la cuenta.
export async function clearDiagnosis() {
  if (!supabaseReady) return;
  const { supabase, user } = await currentUser();
  if (user) await supabase.from("profiles").update({ diagnosis: null, taste: {} }).eq("id", user.id);
  revalidatePath("/", "layout");
}
