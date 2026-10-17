"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deleteService, saveService, updateProfile, type FormState } from "@/lib/actions";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatPrice } from "@/lib/mock-data";
import { SERVICE_CATEGORIES } from "@/lib/archie/categories";
import type { ProfileRow, ServiceRow } from "@/lib/profiles-db";
import { uploadPhoto } from "@/lib/upload";
import { IconChevron, IconClose, IconPlus } from "./icons";
import { field, HandleField, KindPicker } from "./onboarding-form";
import { Photo } from "./photo";
import { PhotoPicker } from "./photo-picker";
import { useToast } from "./toast";

function ErrorText({ state, locale }: { state: FormState; locale: Locale }) {
  if (!state?.error) return null;
  const e = dict(locale).edit.errors;
  return (
    <p role="alert" className="text-sm text-[#E07A8F]">
      {e[state.error as keyof typeof e] ?? e.generic}
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-mute">{label}</span>
      {children}
    </label>
  );
}

export function EditProfile({ locale, row, services }: { locale: Locale; row: ProfileRow; services: ServiceRow[] }) {
  const t = dict(locale);
  const e = t.edit;
  const { show } = useToast();
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [editing, setEditing] = useState<ServiceRow | "new" | null>(null);
  const pickerLabels = { add: t.onboarding.addPhoto, change: e.change, remove: e.remove, uploading: e.uploading, uploadError: e.uploadError };

  useEffect(() => {
    if (state?.ok) show(e.saved);
  }, [state, show, e.saved]);

  return (
    <div className="flex flex-col gap-8 px-4 pt-8">
      <header className="flex flex-col gap-2">
        <Link href="/perfil" className="text-sm font-semibold text-mute">
          ← {e.back}
        </Link>
        <h1 className="font-display text-[40px] leading-[1.05] font-semibold text-white">{e.title}</h1>
      </header>

      {/* Tus servicios */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">{e.services}</h2>
          <p className="text-[13px] text-mute">{e.servicesHint}</p>
        </div>
        {services.map((s) => (
          <button key={s.id} type="button" onClick={() => setEditing(s)} className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.035] p-2.5 text-left">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-[14px]">
              <Photo src={s.photo_url ?? row.photo_url} name={s.title} sizes="56px" />
            </span>
            <span className="flex min-w-0 grow flex-col">
              <span className="truncate text-[15px] font-bold text-white">{s.title}</span>
              <span className="truncate text-[12px] text-mute">
                {s.detail} {formatPrice(s.price, locale)}
              </span>
            </span>
            <IconChevron size={18} stroke="#9A9EA6" />
          </button>
        ))}
        <button type="button" onClick={() => setEditing("new")} className="gold-grad flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-bold text-ink">
          <IconPlus size={18} stroke="#08090B" weight={2.4} /> {e.addService}
        </button>
      </section>

      {/* Datos del perfil */}
      <form action={action} className="flex flex-col gap-5">
        <PhotoPicker name="photo_url" uid={row.id} kind="avatar" initial={row.photo_url} label={e.photo} labels={pickerLabels} />
        <Field label={t.onboarding.name}>
          <input name="name" required maxLength={60} defaultValue={row.name} className={field} />
        </Field>
        <HandleField locale={locale} initial={row.handle} current={row.handle} />
        <KindPicker locale={locale} initial={row.kind} />
        <Field label={t.onboarding.role}>
          <input name="role" maxLength={60} defaultValue={row.role} placeholder={t.onboarding.rolePh} className={field} />
        </Field>
        <Field label={t.onboarding.area}>
          <input name="area" maxLength={60} defaultValue={row.area} placeholder={t.onboarding.areaPh} className={field} />
        </Field>
        <Field label={e.tagline}>
          <input name="tagline" maxLength={80} defaultValue={row.tagline} placeholder={e.taglinePh} className={field} />
        </Field>
        <PhotoPicker name="banner_url" uid={row.id} kind="banner" initial={row.banner_url} label={e.banner} labels={pickerLabels} shape="wide" />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-mute">{e.socials}</legend>
          <input name="instagram" defaultValue={row.instagram ?? ""} placeholder="instagram.com/…" inputMode="url" className={field} />
          <input name="tiktok" defaultValue={row.tiktok ?? ""} placeholder="tiktok.com/@…" inputMode="url" className={field} />
          <input name="facebook" defaultValue={row.facebook ?? ""} placeholder="facebook.com/…" inputMode="url" className={field} />
        </fieldset>
        <Gallery locale={locale} uid={row.id} initial={row.gallery} />
        <ErrorText state={state} locale={locale} />
        <button type="submit" disabled={pending} className="gold-grad h-[52px] rounded-full text-base font-bold text-ink disabled:opacity-60">
          {pending ? e.saving : e.save}
        </button>
      </form>

      {editing && <ServiceSheet locale={locale} uid={row.id} service={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function Gallery({ locale, uid, initial }: { locale: Locale; uid: string; initial: string[] }) {
  const e = dict(locale).edit;
  const [photos, setPhotos] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function add(ev: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(ev.target.files ?? [])].slice(0, 12 - photos.length);
    ev.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError(false);
    try {
      const urls = await Promise.all(files.map((f) => uploadPhoto(f, uid, "post")));
      setPhotos((p) => [...p, ...urls].slice(0, 12));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-mute">{e.gallery}</span>
      <span className="-mt-1 text-[12px] text-mute">{e.galleryHint}</span>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((src) => (
          <span key={src} className="relative aspect-[4/5] overflow-hidden rounded-[14px]">
            <Photo src={src} name="" sizes="130px" />
            <button type="button" aria-label={e.remove} onClick={() => setPhotos((p) => p.filter((x) => x !== src))} className="glass absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full">
              <IconClose size={12} stroke="#FFFFFF" />
            </button>
            <input type="hidden" name="gallery" value={src} />
          </span>
        ))}
        {photos.length < 12 && (
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex aspect-[4/5] items-center justify-center rounded-[14px] border border-dashed border-white/20 text-sm text-mute">
            {busy ? e.uploading : <IconPlus size={22} stroke="#9A9EA6" />}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-[#E07A8F]">
          {e.uploadError}
        </p>
      )}
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={add} className="hidden" />
    </div>
  );
}

function ServiceSheet({ locale, uid, service, onClose }: { locale: Locale; uid: string; service: ServiceRow | null; onClose: () => void }) {
  const t = dict(locale);
  const e = t.edit;
  const { show } = useToast();
  const [state, action, pending] = useActionState(saveService, undefined);
  const [deleting, startDelete] = useTransition();
  const [act, setAct] = useState<ServiceRow["action"]>(service?.action ?? "book");

  useEffect(() => {
    if (state?.ok) {
      show(e.saved);
      onClose();
    }
  }, [state, show, onClose, e.saved]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <form
        action={action}
        role="dialog"
        aria-label={service ? e.editService : e.addService}
        className="flex max-h-[90dvh] w-full max-w-[430px] flex-col gap-4 overflow-y-auto rounded-t-[28px] border-t border-line bg-card px-5 pt-5"
        style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom))" }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-white">{service ? e.editService : e.addService}</h2>
          <button type="button" aria-label={t.common.close} onClick={onClose} className="flex size-9 items-center justify-center rounded-full bg-white/10">
            <IconClose size={16} stroke="#EFE6D8" />
          </button>
        </div>
        <input type="hidden" name="id" value={service?.id ?? ""} />
        <PhotoPicker
          name="photo_url"
          uid={uid}
          kind="service"
          initial={service?.photo_url ?? null}
          label={e.servicePhoto}
          shape="wide"
          labels={{ add: t.onboarding.addPhoto, change: e.change, remove: e.remove, uploading: e.uploading, uploadError: e.uploadError }}
        />
        <Field label={e.serviceTitle}>
          <input name="title" required maxLength={80} defaultValue={service?.title} placeholder={e.serviceTitlePh} className={field} />
        </Field>
        <Field label={e.kicker}>
          <input name="kicker" maxLength={30} defaultValue={service?.kicker} placeholder={e.kickerPh} className={field} />
        </Field>
        <Field label={e.detail}>
          <input name="detail" maxLength={80} defaultValue={service?.detail} placeholder={e.detailPh} className={field} />
        </Field>
        <Field label={e.category}>
          <select name="category" defaultValue={service?.category ?? "PHOTOGRAPHER"} className={`${field} appearance-none`}>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {e.categories[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={e.price}>
          <input name="price" required type="number" inputMode="numeric" min={0} max={1000000} step={1} defaultValue={service?.price} className={field} />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-mute">{e.action}</legend>
          <div className="flex gap-2">
            {(["book", "request", "view"] as const).map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={act === a}
                onClick={() => setAct(a)}
                className={`h-10 flex-1 rounded-full text-sm font-bold ${act === a ? "gold-grad text-ink" : "border border-white/10 text-cream"}`}
              >
                {t.profile.actions[a]}
              </button>
            ))}
          </div>
          <input type="hidden" name="action" value={act} />
        </fieldset>
        <ErrorText state={state} locale={locale} />
        <button type="submit" disabled={pending} className="gold-grad h-[52px] rounded-full text-base font-bold text-ink disabled:opacity-60">
          {pending ? e.saving : e.saveService}
        </button>
        {service && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (!confirm(e.confirmDelete)) return;
              startDelete(async () => {
                await deleteService(service.id);
                onClose();
              });
            }}
            className="h-11 rounded-full text-sm font-semibold text-[#E07A8F]"
          >
            {e.deleteService}
          </button>
        )}
      </form>
    </div>
  );
}
