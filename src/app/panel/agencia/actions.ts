"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseReady } from "@/lib/supabase/config";
import type { AgencyLinkKind } from "@/lib/agency";

function needDb() {
  if (!supabaseReady) throw new Error("Supabase no está configurado (revisa .env).");
}

const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const opt = (v: string) => (v === "" ? null : v);

export async function createProfile(form: FormData) {
  needDb();
  const supabase = await createClient();
  const handle = clean(form.get("handle")).toLowerCase();
  if (!/^[a-z0-9._]{2,30}$/.test(handle)) throw new Error("Handle inválido (a-z, 0-9, punto, guion bajo).");
  const { error } = await supabase.from("agency_profiles").insert({
    handle,
    display_name: clean(form.get("display_name")) || `@${handle}`,
    bio: clean(form.get("bio")),
    tagline: clean(form.get("tagline")),
    avatar_url: opt(clean(form.get("avatar_url"))),
    cover_url: opt(clean(form.get("cover_url"))),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/panel/agencia");
}

export async function updateProfile(form: FormData) {
  needDb();
  const supabase = await createClient();
  const id = clean(form.get("id"));
  const { error } = await supabase
    .from("agency_profiles")
    .update({
      display_name: clean(form.get("display_name")),
      bio: clean(form.get("bio")),
      tagline: clean(form.get("tagline")),
      avatar_url: opt(clean(form.get("avatar_url"))),
      cover_url: opt(clean(form.get("cover_url"))),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  const handle = clean(form.get("handle"));
  revalidatePath("/panel/agencia");
  if (handle) revalidatePath(`/p/${handle}`);
}

export async function toggleProfile(id: string, is_active: boolean, handle: string) {
  needDb();
  const supabase = await createClient();
  const { error } = await supabase.from("agency_profiles").update({ is_active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/agencia");
  revalidatePath(`/p/${handle}`);
}

export async function createLink(form: FormData) {
  needDb();
  const supabase = await createClient();
  const kind = clean(form.get("kind")) as AgencyLinkKind;
  if (!["social", "product", "link"].includes(kind)) throw new Error("Tipo inválido.");
  const { error } = await supabase.from("agency_links").insert({
    profile_id: clean(form.get("profile_id")),
    kind,
    section: clean(form.get("section")) || "links",
    title: clean(form.get("title")),
    subtitle: clean(form.get("subtitle")),
    url: clean(form.get("url")),
    image_url: opt(clean(form.get("image_url"))),
    position: parseInt(clean(form.get("position")) || "0", 10) || 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/panel/agencia");
  const handle = clean(form.get("handle"));
  if (handle) revalidatePath(`/p/${handle}`);
}

export async function updateLink(form: FormData) {
  needDb();
  const supabase = await createClient();
  const id = clean(form.get("id"));
  const { error } = await supabase
    .from("agency_links")
    .update({
      title: clean(form.get("title")),
      subtitle: clean(form.get("subtitle")),
      url: clean(form.get("url")),
      section: clean(form.get("section")) || "links",
      image_url: opt(clean(form.get("image_url"))),
      position: parseInt(clean(form.get("position")) || "0", 10) || 0,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/agencia");
  const handle = clean(form.get("handle"));
  if (handle) revalidatePath(`/p/${handle}`);
}

export async function toggleLink(id: string, is_active: boolean, handle: string) {
  needDb();
  const supabase = await createClient();
  const { error } = await supabase.from("agency_links").update({ is_active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/agencia");
  if (handle) revalidatePath(`/p/${handle}`);
}

export async function deleteLink(id: string) {
  needDb();
  const supabase = await createClient();
  const { error } = await supabase.from("agency_links").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/agencia");
}
