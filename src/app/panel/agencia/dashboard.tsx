"use client";

import { useState, useTransition } from "react";
import {
  createLink,
  createProfile,
  deleteLink,
  toggleLink,
  toggleProfile,
  updateLink,
  updateProfile,
} from "./actions";
import type { AgencyLink, AgencyProfileSummary } from "@/lib/agency";

const KIND_LABEL: Record<string, string> = { social: "Social", product: "Producto", link: "Link" };

function Field({ label, name, defaultValue, placeholder, type = "text" }: {
  label: string; name: string; defaultValue?: string; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-mute">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-ink-2 px-3 py-2 text-sm text-cream placeholder:text-dim focus:border-gold focus:outline-none"
      />
    </label>
  );
}

function Submit({ children, busy }: { children: string; busy: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="gold-grad rounded-xl px-4 py-2 text-sm font-bold text-ink disabled:opacity-50"
    >
      {busy ? "Guardando…" : children}
    </button>
  );
}

export function AgenciaDashboard({ profiles: initial, initialLinks }: { profiles: AgencyProfileSummary[]; initialLinks: AgencyLink[] }) {
  const [profiles, setProfiles] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? "");
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [showNewLink, setShowNewLink] = useState(false);
  const [error, setError] = useState("");
  const [links, setLinks] = useState<AgencyLink[]>(initialLinks);
  const [linksBusy, setLinksBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  const selected = profiles.find((p) => p.id === selectedId);

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      setError("");
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error inesperado");
      }
    });

  const loadLinks = async (profileId: string) => {
    setLinksBusy(true);
    try {
      const res = await fetch(`/api/agency/links?profile_id=${profileId}`);
      const data = await res.json();
      setLinks(data.links ?? []);
    } catch {
      setLinks([]);
    } finally {
      setLinksBusy(false);
    }
  };

  const pickProfile = (id: string) => {
    setSelectedId(id);
    setEditingLink(null);
    void loadLinks(id);
  };

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      )}

      {/* ---------- ROSTER ---------- */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Roster</h2>
          <button
            onClick={() => setShowNewProfile((v) => !v)}
            className="rounded-xl border border-line-2 px-3 py-1.5 text-sm font-semibold text-cream hover:border-gold"
          >
            {showNewProfile ? "Cerrar" : "+ Nuevo perfil"}
          </button>
        </div>

        {showNewProfile && (
          <form
            action={(fd) => run(async () => { await createProfile(fd); window.location.reload(); })}
            className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2"
          >
            <Field label="Handle (único, minúsculas)" name="handle" placeholder="itakaark" />
            <Field label="Nombre visible" name="display_name" placeholder="@itakaark" />
            <div className="sm:col-span-2"><Field label="Bio" name="bio" placeholder="Emprendedor entre Miami y Latinoamérica…" /></div>
            <Field label="Tagline" name="tagline" placeholder="Descubre. Conecta. Crea. Crece." />
            <Field label="URL avatar" name="avatar_url" placeholder="https://…" />
            <div className="sm:col-span-2"><Field label="URL portada" name="cover_url" placeholder="https://…" /></div>
            <div className="sm:col-span-2"><Submit busy={pending}>Crear perfil</Submit></div>
          </form>
        )}

        <div className="flex flex-col gap-2.5">
          {profiles.map((p) => (
            <div key={p.id} className={`rounded-2xl border p-4 ${p.is_active ? "border-line bg-card" : "border-line bg-ink-2 opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{p.display_name} <span className="font-normal text-mute">@{p.handle}</span></p>
                  <p className="text-xs text-mute">{p.link_count} links · {p.total_clicks} clics</p>
                </div>
                <a href={`/p/${p.handle}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gold">
                  Ver página →
                </a>
                <button
                  onClick={() => run(async () => {
                    await toggleProfile(p.id, !p.is_active, p.handle);
                    setProfiles((ps) => ps.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
                  })}
                  className="rounded-lg border border-line-2 px-2.5 py-1 text-xs font-semibold"
                >
                  {p.is_active ? "Pausar" : "Activar"}
                </button>
                <button onClick={() => pickProfile(p.id)} className="rounded-lg border border-line-2 px-2.5 py-1 text-xs font-semibold">
                  Links
                </button>
                <button onClick={() => setEditingProfile(editingProfile === p.id ? null : p.id)} className="text-xs text-mute underline">
                  Editar
                </button>
              </div>
              {editingProfile === p.id && (
                <form
                  action={(fd) => run(async () => { await updateProfile(fd); window.location.reload(); })}
                  className="mt-3 grid grid-cols-1 gap-3 border-t border-line pt-3 sm:grid-cols-2"
                >
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="handle" value={p.handle} />
                  <Field label="Nombre visible" name="display_name" defaultValue={p.display_name} />
                  <Field label="Tagline" name="tagline" defaultValue={p.tagline} />
                  <div className="sm:col-span-2"><Field label="Bio" name="bio" defaultValue={p.bio} /></div>
                  <Field label="URL avatar" name="avatar_url" defaultValue={p.avatar_url ?? ""} />
                  <Field label="URL portada" name="cover_url" defaultValue={p.cover_url ?? ""} />
                  <div className="sm:col-span-2"><Submit busy={pending}>Guardar cambios</Submit></div>
                </form>
              )}
            </div>
          ))}
          {profiles.length === 0 && (
            <p className="rounded-2xl border border-line bg-card p-6 text-center text-sm text-mute">
              Aún no hay perfiles. Crea el primero con el botón de arriba.
            </p>
          )}
        </div>
      </section>

      {/* ---------- LINKS ---------- */}
      {selected && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Links · @{selected.handle}</h2>
            <button
              onClick={() => setShowNewLink((v) => !v)}
              className="rounded-xl border border-line-2 px-3 py-1.5 text-sm font-semibold text-cream hover:border-gold"
            >
              {showNewLink ? "Cerrar" : "+ Nuevo link"}
            </button>
          </div>

          {showNewLink && (
            <form
              action={(fd) => run(async () => { await createLink(fd); setShowNewLink(false); void loadLinks(selected.id); })}
              className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2"
            >
              <input type="hidden" name="profile_id" value={selected.id} />
              <input type="hidden" name="handle" value={selected.handle} />
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-mute">Tipo</span>
                <select name="kind" className="w-full rounded-xl border border-line bg-ink-2 px-3 py-2 text-sm text-cream">
                  <option value="link">Link</option>
                  <option value="product">Producto</option>
                  <option value="social">Social</option>
                </select>
              </label>
              <Field label="Sección" name="section" placeholder="productos / redes / herramientas / destacado" />
              <Field label="Título" name="title" placeholder="Libro Todo Conectado — $5" />
              <Field label="Subtítulo" name="subtitle" placeholder="La entrada al sistema" />
              <div className="sm:col-span-2"><Field label="URL" name="url" placeholder="https://…" /></div>
              <Field label="URL imagen (opcional)" name="image_url" placeholder="https://… o /agency/…" />
              <Field label="Posición" name="position" type="number" defaultValue="0" />
              <div className="sm:col-span-2"><Submit busy={pending}>Agregar link</Submit></div>
            </form>
          )}

          {linksBusy ? (
            <p className="text-sm text-mute">Cargando links…</p>
          ) : (
            <div className="flex flex-col gap-2">
              {links.map((l) => (
                <div key={l.id} className={`rounded-xl border p-3 ${l.is_active ? "border-line bg-card" : "border-line bg-ink-2 opacity-60"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-raised px-2 py-0.5 text-[11px] font-bold text-gold">{KIND_LABEL[l.kind] ?? l.kind}</span>
                    <span className="rounded-md bg-raised px-2 py-0.5 text-[11px] text-mute">{l.section}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{l.title}</p>
                      <p className="truncate text-xs text-dim">{l.url}</p>
                    </div>
                    <button
                      onClick={() => run(async () => {
                        await toggleLink(l.id, !l.is_active, selected.handle);
                        setLinks((ls) => ls.map((x) => (x.id === l.id ? { ...x, is_active: !x.is_active } : x)));
                      })}
                      className="rounded-lg border border-line-2 px-2 py-1 text-xs"
                    >
                      {l.is_active ? "Pausar" : "Activar"}
                    </button>
                    <button onClick={() => setEditingLink(editingLink === l.id ? null : l.id)} className="text-xs text-mute underline">
                      Editar
                    </button>
                    <button
                      onClick={() => { if (confirm("¿Eliminar este link?")) run(async () => { await deleteLink(l.id); void loadLinks(selected.id); }); }}
                      className="text-xs text-red-300/80 underline"
                    >
                      Eliminar
                    </button>
                  </div>
                  {editingLink === l.id && (
                    <form
                      action={(fd) => run(async () => { await updateLink(fd); setEditingLink(null); void loadLinks(selected.id); })}
                      className="mt-3 grid grid-cols-1 gap-3 border-t border-line pt-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="handle" value={selected.handle} />
                      <Field label="Título" name="title" defaultValue={l.title} />
                      <Field label="Subtítulo" name="subtitle" defaultValue={l.subtitle} />
                      <div className="sm:col-span-2"><Field label="URL" name="url" defaultValue={l.url} /></div>
                      <Field label="Sección" name="section" defaultValue={l.section} />
                      <Field label="URL imagen" name="image_url" defaultValue={l.image_url ?? ""} />
                      <Field label="Posición" name="position" type="number" defaultValue={String(l.position)} />
                      <div className="sm:col-span-2"><Submit busy={pending}>Guardar</Submit></div>
                    </form>
                  )}
                </div>
              ))}
              {links.length === 0 && <p className="text-sm text-mute">Este perfil aún no tiene links.</p>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
