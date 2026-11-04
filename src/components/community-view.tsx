"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { bundle, courses, events, groups, teamMonthly, teams } from "@/lib/community";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { formatCount, formatPrice, getProfile } from "@/lib/mock-data";
import { Photo } from "./photo";
import { IconCap, IconCheck, IconChevron, IconPeople } from "./icons";
import { SoonButton } from "./toast";

type Tab = "academy" | "teams" | "groups" | "events";

// Comunidad: la misma en los dos modos.
export function CommunityView({ locale }: { locale: Locale }) {
  const t = dict(locale).community;
  const [tab, setTab] = useState<Tab>("academy");

  return (
    <div className="flex flex-col gap-5 pt-8">
      <header className="px-4">
        <h1 className="font-display text-[42px] leading-[1.05] font-semibold text-white">{t.title}</h1>
        <p className="mt-2 text-base text-mute">{t.intro}</p>
      </header>

      <div role="tablist" className="no-scrollbar flex gap-2 overflow-x-auto px-4">
        {(Object.keys(t.tabs) as Tab[]).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${tab === k ? "bg-cream text-ink" : "border border-white/10 bg-white/[0.04] text-cream"}`}
          >
            {t.tabs[k]}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === "academy" && <Academy locale={locale} />}
        {tab === "teams" && <Teams locale={locale} />}
        {tab === "groups" && <Groups locale={locale} />}
        {tab === "events" && <Events locale={locale} />}
      </div>
    </div>
  );
}

function Academy({ locale }: { locale: Locale }) {
  const t = dict(locale).community;
  const done = courses.filter((c) => c.done).length;
  const next = courses.find((c) => !c.done)!;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-normal text-mute">{t.academyIntro}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[20px] border border-white/10 bg-white/[0.035] p-3.5">
          <p className="text-2xl font-extrabold text-white">
            {done}/{courses.length}
          </p>
          <p className="text-[12px] text-mute">{t.progress(done, courses.length)}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.035] p-3.5">
          <p className="text-2xl font-extrabold text-white">🔥 3</p>
          <p className="text-[12px] text-mute">{t.streak(3)}</p>
        </div>
      </div>

      <div className="rounded-[24px] border p-4" style={{ borderColor: `${next.color}55`, background: `radial-gradient(120% 100% at 0% 0%, ${next.color}33 0%, #0b0c0f 80%)` }}>
        <p className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: next.color }}>
          {t.today}
        </p>
        <p className="mt-1 text-2xl font-extrabold text-white">{next.name[locale]}</p>
        <p className="text-sm text-mute">{t.lessons(next.lessons)}</p>
        <SoonButton className="mt-3 h-10 rounded-full px-5 text-sm font-bold text-ink" style={{ background: next.color }}>
          {t.start}
        </SoonButton>
      </div>

      <ul className="flex flex-col">
        {courses.map((c) => (
          <li key={c.id}>
            <SoonButton className="flex w-full items-center gap-3.5 border-b border-white/[0.07] py-3 text-left">
              <span className="gloss flex size-12 shrink-0 items-center justify-center rounded-[15px]" style={{ "--c": c.color } as React.CSSProperties}>
                <IconCap size={24} stroke="#FFFFFF" weight={1.9} />
              </span>
              <span className="flex min-w-0 grow flex-col">
                <span className="flex items-center gap-2 text-base font-bold text-white">
                  {c.name[locale]}
                  {c.required && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold-soft">{t.required}</span>}
                </span>
                <span className="text-[12px] text-mute">{c.license ? `${t.license} ${c.license[locale]}` : t.lessons(c.lessons)}</span>
              </span>
              {c.done ? (
                <span className="flex items-center gap-1 text-[12px] font-bold text-teal">
                  <IconCheck size={14} stroke="#7FC2B7" weight={2.6} /> {t.certified}
                </span>
              ) : (
                <IconChevron size={18} stroke="#9A9EA6" />
              )}
            </SoonButton>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-mute">{t.disclaimer}</p>
    </div>
  );
}

function Teams({ locale }: { locale: Locale }) {
  const t = dict(locale).community;
  const money = (n: number) => formatPrice(n, locale);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-normal text-mute">{t.teamsIntro}</p>

      <div className="flex flex-col gap-3 rounded-[24px] border border-gold/30 bg-gradient-to-br from-[#241e15] to-ink p-4">
        <p className="text-xs font-bold tracking-[0.14em] text-gold-soft uppercase">{t.bundleTitle}</p>
        <p className="text-xl font-extrabold text-white">{bundle.name[locale]}</p>
        <p className="text-[13px] text-mute">{t.bundleSub}</p>
        <div className="flex flex-col gap-2">
          {bundle.members.map((m) => {
            const p = getProfile(m.handle)!;
            return (
              <div key={m.handle} className="flex items-center gap-3">
                <span className="relative size-9 overflow-hidden rounded-full">
                  <Photo src={p.photo} name={p.name} sizes="36px" />
                </span>
                <span className="grow text-sm font-semibold text-cream">{p.name}</span>
                <span className="text-sm text-gold-soft tabular-nums">
                  {m.share}% · {money((bundle.price * m.share) / 100)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="border-t border-white/10 pt-2 text-right text-base font-bold text-white tabular-nums">{money(bundle.price)}</p>
      </div>

      {teams.map((team) => (
        <div key={team.id} className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            <span className="gloss flex size-11 items-center justify-center rounded-[14px]" style={{ "--c": team.color } as React.CSSProperties}>
              <IconPeople size={22} stroke="#FFFFFF" weight={1.9} />
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-bold text-white">{team.name[locale]}</span>
              <span className="text-[13px] text-mute">{team.desc[locale]}</span>
            </span>
          </div>
          <ul className="flex flex-col gap-1 text-sm">
            {team.roles.map((r) => (
              <li key={r.name.es} className="flex justify-between text-cream/85">
                <span>{r.name[locale]}</span>
                <span className="text-mute tabular-nums">
                  {t.perWeek(r.hours)} · {money(r.rate)}/h
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white tabular-nums">
              {money(teamMonthly(team))} <span className="text-sm font-normal text-mute">{t.perMonth}</span>
            </span>
            <Link href="/talento" className="flex h-10 items-center rounded-full bg-cream px-4 text-sm font-bold text-ink">
              {t.buildTeam}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function Groups({ locale }: { locale: Locale }) {
  const t = dict(locale).community;
  const [joined, setJoined] = useState<string[]>(["creators"]);
  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => {
        const on = joined.includes(g.id);
        return (
          <div key={g.id} className="flex items-center gap-3.5 rounded-[22px] border border-white/10 bg-white/[0.035] p-2.5">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-[16px]">
              <Image src={g.photo} alt="" fill sizes="64px" className="object-cover" />
            </span>
            <span className="flex min-w-0 grow flex-col">
              <span className="text-base font-bold text-white">{g.name[locale]}</span>
              <span className="line-clamp-2 text-[12px] leading-snug text-mute">{g.desc[locale]}</span>
              <span className="mt-0.5 text-[11px] text-gold-soft">
                {g.tag} · {t.members(formatCount(g.members + (on && g.id !== "creators" ? 1 : 0), locale))}
              </span>
            </span>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => setJoined((j) => (on ? j.filter((x) => x !== g.id) : [...j, g.id]))}
              className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold ${on ? "border border-white/15 text-cream" : "bg-cream text-ink"}`}
            >
              {on ? t.joined : t.join}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Events({ locale }: { locale: Locale }) {
  const t = dict(locale).community;
  const [going, setGoing] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-4">
      {events.map((e) => {
        const on = going.includes(e.id);
        return (
          <div key={e.id} className="relative flex h-[220px] flex-col justify-end overflow-hidden rounded-[26px] p-4">
            <Image src={e.photo} alt="" fill sizes="400px" className="object-cover" />
            <div className="fade-bottom absolute inset-0" />
            <span className="relative text-[13px] font-semibold text-gold-soft">
              {e.when[locale]} · {e.place}
            </span>
            <span className="relative text-2xl font-extrabold text-white">{e.name[locale]}</span>
            <div className="relative mt-2 flex items-center justify-between">
              <span className="text-sm text-cream/75">{t.going(e.going + (on ? 1 : 0))}</span>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setGoing((g) => (on ? g.filter((x) => x !== e.id) : [...g, e.id]))}
                className={`h-10 rounded-full px-4 text-sm font-bold ${on ? "glass text-cream" : "gold-grad text-ink"}`}
              >
                {on ? t.attending : t.attend}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
