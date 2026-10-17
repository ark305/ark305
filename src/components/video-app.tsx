"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { dict, formatTime } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { demoPlan, getVideoPackage, videographers, videoPackages, type ContentPlan, type VideoPackage } from "@/lib/video";
import { IconCalendar, IconCamera, IconCheck, IconSparkle } from "./icons";

const BOARD_KEY = "ark-video-board";
const LEADS_KEY = "ark-video-leads";
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

type Board = { plan: ContentPlan; done: Record<string, boolean> };

function readBoard(): Board | null {
  try {
    const raw = localStorage.getItem(BOARD_KEY);
    return raw ? (JSON.parse(raw) as Board) : null;
  } catch {
    return null;
  }
}

function saveLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // modo privado: vive solo mientras la página está abierta
  }
}

// Flujo del evento: 1) ARK IA organiza el contenido · 2) videógrafo + horario de hoy · 3) reserva → GoHighLevel.
export function VideoApp({ locale }: { locale: Locale }) {
  const v = dict(locale).video;
  const [brief, setBrief] = useState("");
  const [plan, setPlan] = useState<ContentPlan | null>(null);
  const [planning, setPlanning] = useState(false);
  const [vgId, setVgId] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [pkgId, setPkgId] = useState<VideoPackage["id"] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", instagram: "", company: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "done">("idle");
  const [delivered, setDelivered] = useState<string[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const pickRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // localStorage solo existe en el teléfono; se lee después de montar para no romper la hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoard(readBoard());
  }, []);

  const vg = videographers.find((x) => x.id === vgId) ?? null;
  const pkg = pkgId ? getVideoPackage(pkgId) : null;
  const sorted = plan ? [...videographers].sort((a, b) => Number(b.packages.includes(plan.packageId)) - Number(a.packages.includes(plan.packageId))) : videographers;

  async function organize(text = brief) {
    const b = text.trim();
    if (b.length < 3) return;
    setBrief(b);
    setPlanning(true);
    let next: ContentPlan;
    try {
      const r = await fetch("/api/video/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brief: b, locale }) });
      if (!r.ok) throw new Error(String(r.status));
      next = (await r.json()) as ContentPlan;
    } catch {
      next = demoPlan(b, locale);
    }
    setPlan(next);
    setPkgId(next.packageId);
    setPlanning(false);
  }

  function pick(id: string, time: string) {
    const chosen = videographers.find((x) => x.id === id)!;
    setVgId(id);
    setSlot(time);
    setPkgId((cur) => (cur && chosen.packages.includes(cur) ? cur : plan && chosen.packages.includes(plan.packageId) ? plan.packageId : chosen.packages[0]));
    setTimeout(() => bookRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const okContact = /^\S+@\S+\.\S+$/.test(form.email.trim()) || form.phone.replace(/\D/g, "").length >= 7;
    if (!form.name.trim() || !okContact || !vg || !slot || !pkg) return setStatus("error");
    setStatus("sending");
    const source = new URLSearchParams(window.location.search).get("src") === "qr" ? "event-qr" : "ark-video";
    const lead = { ...form, videographerId: vg.id, packageId: pkg.id, slot, brief, planTitle: plan?.title ?? "", locale, source };
    let sent: string[] = [];
    try {
      const r = await fetch("/api/video/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(lead) });
      if (r.status === 400) return setStatus("error");
      sent = ((await r.json()) as { delivered?: string[] }).delivered ?? [];
    } catch {
      sent = [];
    }
    try {
      const prev = JSON.parse(localStorage.getItem(LEADS_KEY) || "[]") as unknown[];
      saveLocal(LEADS_KEY, [...prev, { ...lead, company: undefined, at: new Date().toISOString(), delivered: sent }]);
    } catch {
      saveLocal(LEADS_KEY, [lead]);
    }
    const fresh: Board = { plan: plan ?? demoPlan(brief || pkg.name[locale], locale), done: {} };
    saveLocal(BOARD_KEY, fresh);
    setBoard(fresh);
    setDelivered(sent);
    setStatus("done");
  }

  function toggle(key: string) {
    if (!board) return;
    const next = { ...board, done: { ...board.done, [key]: !board.done[key] } };
    saveLocal(BOARD_KEY, next);
    setBoard(next);
  }

  function restart() {
    setPlan(null);
    setBrief("");
    setVgId(null);
    setSlot(null);
    setStatus("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const input = "h-12 w-full rounded-2xl border border-white/10 bg-raised px-4 text-[15px] text-white placeholder:text-dim focus:border-gold/60 focus:outline-none";

  if (status === "done" && vg && slot && pkg) {
    return (
      <div className="flex flex-col gap-6 px-5">
        <section className="flex flex-col items-center gap-3 rounded-[28px] border border-gold/40 bg-gradient-to-br from-[#2a2217] via-[#141210] to-ink p-6 text-center">
          <span className="gold-grad flex size-14 items-center justify-center rounded-full">
            <IconCheck size={28} stroke="#08090B" weight={2.6} />
          </span>
          <h2 className="font-display text-[28px] font-semibold text-white">{v.bookedTitle}</h2>
          <p className="text-[15px] text-cream/85">{v.bookedBody(vg.name, formatTime(slot, locale))}</p>
          <p className="text-[13px] text-mute">
            {pkg.name[locale]} · {usd(pkg.price)} · {v.hours(pkg.hours)}
          </p>
          {delivered.length === 0 && <p className="text-[12px] text-gold-soft">{v.savedLocal}</p>}
          <p className="text-[12px] text-mute">{v.noPay}</p>
        </section>
        {board && <ContentBoard board={board} onToggle={toggle} locale={locale} />}
        <button type="button" onClick={restart} className="h-12 rounded-full border border-gold/40 text-[15px] font-bold text-gold-soft">
          {v.another}
        </button>
        <p className="text-center text-[11px] text-mute">{v.demoNote}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 1 · Organizar el contenido */}
      <section className="flex flex-col gap-3 px-5">
        <StepTitle n={1} title={v.step1} />
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder={v.placeholder}
          rows={3}
          maxLength={800}
          className="w-full resize-none rounded-[20px] border border-white/10 bg-raised p-4 text-[15px] leading-snug text-white placeholder:text-dim focus:border-gold/60 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {v.ideas.map((idea) => (
            <button key={idea} type="button" onClick={() => organize(idea)} disabled={planning} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[13px] font-semibold text-cream disabled:opacity-50">
              {idea}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => organize()} disabled={planning || brief.trim().length < 3} className="gold-grad flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-bold text-ink disabled:opacity-60">
          <IconSparkle size={18} stroke="#08090B" weight={2} />
          {planning ? v.organizing : v.organize}
        </button>
        {plan && <PlanCard plan={plan} locale={locale} />}
      </section>

      {/* 2 · Videógrafo y horario */}
      <section ref={pickRef} className="flex flex-col gap-3 px-5">
        <StepTitle n={2} title={v.step2} />
        {sorted.map((x) => {
          const from = Math.min(...x.packages.map((id) => getVideoPackage(id)!.price));
          const fits = plan ? x.packages.includes(plan.packageId) : false;
          return (
            <div key={x.id} className={`rounded-[22px] border bg-card p-3.5 ${vgId === x.id ? "border-gold/60" : fits ? "border-gold/25" : "border-white/[0.08]"}`}>
              <div className="flex gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl">
                  <Image src={x.photo} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[16px] font-bold text-white">{x.name}</p>
                    <p className="shrink-0 text-[13px] font-bold text-gold-soft">★ {x.rating.toFixed(1)}</p>
                  </div>
                  <p className="text-[12px] text-mute">
                    {x.area} · {v.jobs(x.jobs)} · {v.from} {usd(from)}
                  </p>
                  <p className="mt-0.5 text-[13px] text-cream/85">{x.specialty[locale]}</p>
                  <p className="text-[12px] text-cream/60">{x.style[locale]}</p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] text-mute uppercase">
                <IconCalendar size={12} stroke="currentColor" weight={2} /> {v.today}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {x.slots.map((s) => {
                  const on = vgId === x.id && slot === s.time;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.open}
                      onClick={() => pick(x.id, s.time)}
                      title={s.open ? undefined : v.taken}
                      className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${on ? "gold-grad text-ink" : s.open ? "border border-gold/30 text-gold-soft" : "border border-white/5 text-dim line-through"}`}
                    >
                      {formatTime(s.time, locale)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* 3 · Reserva */}
      {vg && slot && (
        <section ref={bookRef} className="flex scroll-mt-4 flex-col gap-3 px-5">
          <StepTitle n={3} title={v.step3} />
          <div className="flex flex-col gap-2">
            {vg.packages.map((id) => {
              const p = getVideoPackage(id)!;
              const on = pkgId === id;
              return (
                <button key={id} type="button" onClick={() => setPkgId(id)} className={`rounded-[20px] border p-3.5 text-left ${on ? "border-gold/60 bg-gold/[0.07]" : "border-white/[0.08] bg-card"}`}>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-bold text-white">
                      {p.name[locale]}
                      {plan?.packageId === id && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-gold-soft uppercase">{v.rec}</span>}
                    </span>
                    <span className="shrink-0 text-[15px] font-extrabold text-gold-soft">{usd(p.price)}</span>
                  </span>
                  <span className="mt-0.5 block text-[12px] text-mute">{p.includes.map((i) => i[locale]).join(" · ")}</span>
                </button>
              );
            })}
          </div>
          <form onSubmit={submit} className="flex flex-col gap-2.5 rounded-[22px] border border-white/[0.08] bg-card p-4" noValidate>
            <p className="text-[13px] text-cream/80">
              <span className="font-bold text-white">{vg.name}</span> · {formatTime(slot, locale)} · {pkg ? v.hours(pkg.hours) : ""}
            </p>
            <input className={input} placeholder={v.name} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={input} placeholder={v.phone} type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className={input} placeholder={v.email} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={input} placeholder={v.instagram} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <p className={`text-[12px] ${status === "error" ? "text-[#ff8a8a]" : "text-mute"}`}>{status === "error" ? v.error : v.contactHint}</p>
            <button type="submit" disabled={status === "sending"} className="gold-grad h-12 rounded-full text-[15px] font-bold text-ink disabled:opacity-60">
              {status === "sending" ? v.sending : v.book(pkg ? usd(pkg.price) : "")}
            </button>
            <p className="text-center text-[11px] text-mute">{v.noPay}</p>
          </form>
        </section>
      )}

      {board && (
        <section className="px-5">
          <ContentBoard board={board} onToggle={toggle} locale={locale} />
        </section>
      )}
      <p className="px-5 text-center text-[11px] text-mute">{v.demoNote}</p>
    </div>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-2.5 font-display text-[22px] font-semibold text-white">
      <span className="gold-grad flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-ink">{n}</span>
      {title}
    </h2>
  );
}

function PlanCard({ plan, locale }: { plan: ContentPlan; locale: Locale }) {
  const v = dict(locale).video;
  const pkg = getVideoPackage(plan.packageId) ?? videoPackages[1];
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-gold/30 bg-gradient-to-br from-[#2a2217] via-[#141210] to-ink p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] text-gold-soft uppercase">{v.planTitle}</p>
          <h3 className="mt-0.5 text-[19px] leading-tight font-bold text-white">{plan.title}</h3>
          <p className="mt-1 text-[13px] leading-snug text-cream/80">{plan.summary}</p>
        </div>
        <span className="shrink-0 rounded-full border border-gold/40 bg-gold/[0.08] px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-gold-soft uppercase">
          {plan.source === "ai" ? v.aiBadge : v.demoBadge}
        </span>
      </div>
      <Block title={v.shots}>
        {plan.shots.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-[13px] leading-snug">
            <IconCamera size={15} stroke="#D8B170" weight={1.8} className="mt-0.5 shrink-0" />
            <span>
              <span className="font-bold text-white">{s.scene}</span> <span className="text-cream/70">{s.detail}</span>
            </span>
          </li>
        ))}
      </Block>
      <Block title={v.deliverables}>
        {plan.deliverables.map((d, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="font-bold text-white">{d.name}</span>
            <span className="text-right text-cream/70">
              {d.format} · <span className="text-gold-soft">{d.due}</span>
            </span>
          </li>
        ))}
      </Block>
      <Block title={v.calendar}>
        {plan.calendar.map((c, i) => (
          <li key={i} className="grid grid-cols-[72px_1fr] gap-2 text-[13px] leading-snug">
            <span className="font-bold text-gold-soft">{c.day}</span>
            <span className="text-cream/85">
              {c.piece} <span className="text-mute">· {c.platform}</span>
            </span>
          </li>
        ))}
      </Block>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.05] px-3.5 py-3">
        <span>
          <span className="block text-[10px] font-bold tracking-[0.12em] text-mute uppercase">{v.recommended}</span>
          <span className="block text-[15px] font-bold text-white">{pkg.name[locale]}</span>
        </span>
        <span className="text-[17px] font-extrabold text-gold-soft">{usd(pkg.price)}</span>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold tracking-[0.12em] text-mute uppercase">{title}</p>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function ContentBoard({ board, onToggle, locale }: { board: Board; onToggle: (key: string) => void; locale: Locale }) {
  const v = dict(locale).video;
  const items = [
    ...board.plan.shots.map((s, i) => ({ key: `s${i}`, tag: v.filmed, text: s.scene, sub: s.detail })),
    ...board.plan.calendar.map((c, i) => ({ key: `c${i}`, tag: v.posted, text: c.piece, sub: `${c.day} · ${c.platform}` })),
  ];
  const done = items.filter((i) => board.done[i.key]).length;
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-white/[0.08] bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-[22px] font-semibold text-white">{v.myContent}</h3>
        <span className="text-[13px] font-bold text-gold-soft">
          {done}/{items.length}
        </span>
      </div>
      <p className="-mt-2 text-[12px] text-mute">{v.myContentSub}</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="gold-grad h-full rounded-full transition-[width]" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((i) => {
          const on = !!board.done[i.key];
          return (
            <li key={i.key}>
              <button type="button" onClick={() => onToggle(i.key)} className="flex w-full items-start gap-3 rounded-2xl px-1 py-1.5 text-left">
                <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${on ? "gold-grad border-transparent" : "border-white/20"}`}>
                  {on && <IconCheck size={12} stroke="#08090B" weight={2.8} />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[14px] font-semibold ${on ? "text-mute line-through" : "text-white"}`}>
                    <span className="mr-1.5 text-[10px] font-bold tracking-wide text-gold-soft uppercase">{i.tag}</span>
                    {i.text}
                  </span>
                  <span className="block text-[12px] text-mute">{i.sub}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
