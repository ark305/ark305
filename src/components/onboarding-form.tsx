"use client";

import { useActionState, useEffect, useState } from "react";
import { checkHandle, createProfile } from "@/lib/actions";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import type { Kind } from "@/lib/mock-data";
import { PhotoPicker } from "./photo-picker";

const KINDS: Kind[] = ["member", "provider", "creator", "remote", "brand"];
const suggest = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9._]+/g, "")
    .slice(0, 30);

export const field = "h-12 rounded-full border border-white/10 bg-white/[0.05] px-4 text-base text-cream outline-none placeholder:text-mute focus:border-gold/60";

export function HandleField({ locale, initial, current }: { locale: Locale; initial: string; current?: string }) {
  const t = dict(locale).onboarding;
  const [handle, setHandle] = useState(initial);
  const [status, setStatus] = useState<"available" | "taken" | "invalid" | null>(null);

  useEffect(() => {
    if (!handle || handle === current) return;
    let alive = true;
    const id = setTimeout(async () => {
      const s = await checkHandle(handle);
      if (alive) setStatus(s);
    }, 400);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [handle, current]);

  const shown = handle === current ? null : status;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-mute">{t.handle}</span>
      <span className={`${field} flex items-center gap-1`}>
        <span className="text-mute">ark305.com/@</span>
        <input
          name="handle"
          required
          value={handle}
          onChange={(e) => {
            setHandle(suggest(e.target.value));
            setStatus(null);
          }}
          autoCapitalize="none"
          autoCorrect="off"
          className="min-w-0 grow bg-transparent outline-none"
        />
      </span>
      <span className={`text-[12px] ${shown === "available" ? "text-teal" : shown ? "text-[#E07A8F]" : "text-mute"}`}>
        {shown === "available" ? t.available : shown === "taken" ? t.taken : shown === "invalid" ? t.invalid : t.handleHint}
      </span>
    </label>
  );
}

export function KindPicker({ locale, initial }: { locale: Locale; initial: Kind }) {
  const t = dict(locale);
  const [kind, setKind] = useState<Kind>(initial);
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-semibold text-mute">{t.onboarding.kind}</legend>
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={`h-10 rounded-full px-4 text-sm font-semibold ${kind === k ? "bg-cream text-ink" : "border border-white/10 text-cream"}`}
          >
            {t.kinds[k]}
          </button>
        ))}
      </div>
      <input type="hidden" name="kind" value={kind} />
    </fieldset>
  );
}

export function OnboardingForm({ locale, uid, email }: { locale: Locale; uid: string; email: string | null }) {
  const t = dict(locale);
  const o = t.onboarding;
  const [state, action, pending] = useActionState(createProfile, undefined);
  const [name, setName] = useState("");

  return (
    <form action={action} className="flex flex-col gap-5">
      <PhotoPicker
        name="photo_url"
        uid={uid}
        kind="avatar"
        initial={null}
        label={o.photo}
        labels={{ add: o.addPhoto, change: t.edit.change, remove: t.edit.remove, uploading: t.edit.uploading, uploadError: t.edit.uploadError }}
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-mute">{o.name}</span>
        <input name="name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </label>
      <HandleField locale={locale} initial={suggest(email?.split("@")[0] ?? "")} />
      <KindPicker locale={locale} initial="member" />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-mute">{o.role}</span>
        <input name="role" maxLength={60} placeholder={o.rolePh} className={field} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-mute">{o.area}</span>
        <input name="area" maxLength={60} placeholder={o.areaPh} className={field} />
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-[#E07A8F]">
          {t.edit.errors[state.error as keyof typeof t.edit.errors]}
        </p>
      )}
      <button type="submit" disabled={pending} className="gold-grad h-[52px] rounded-full text-base font-bold text-ink disabled:opacity-60">
        {pending ? o.creating : o.create}
      </button>
    </form>
  );
}
