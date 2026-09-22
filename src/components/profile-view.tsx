import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatPrice, type Profile } from "@/lib/mock-data";
import { IconCheck, IconChevron, IconFacebook, IconInstagram, IconPen, IconPlus, IconTikTok } from "./icons";
import { CopyLinkButton, ProfileMenu } from "./profile-actions";
import { SoonButton } from "./toast";

const socialIcon = { instagram: IconInstagram, tiktok: IconTikTok, facebook: IconFacebook };
const socialName = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook" };

function Placeholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span className={`flex items-center justify-center text-center text-[10px] tracking-[0.12em] text-dim ${className}`}>
      [{label}]
    </span>
  );
}

export function ProfileView({ profile, isOwner, locale, t }: { profile: Profile; isOwner: boolean; locale: Locale; t: Dictionary }) {
  const p = t.profile;
  const followers = profile.followers ? p.followers(profile.followers[locale]) : null;

  // Lista "Hazte visible" (datos de ejemplo: 2 de 4 listos).
  const steps: { title: string; sub: string; done: boolean; href?: string }[] = [
    { ...p.steps.photo, done: true },
    { ...p.steps.service, done: true },
    { ...p.steps.bio, done: false, href: "/ganar" },
    { ...p.steps.share, done: false, href: "/ganar" },
  ];
  const done = steps.filter((s) => s.done).length;

  return (
    <div>
      {/* Portada */}
      <div className="relative">
        <div className="flex h-[400px] items-center justify-center" style={{ background: profile.handle === "lente305" ? "#1B1D22" : profile.tone }}>
          <Placeholder label={p.coverPhoto} />
        </div>
        <div className="absolute inset-x-3.5 top-4 flex items-center justify-between gap-2">
          <CopyLinkButton handle={profile.handle} copied={t.common.copied} failed={t.common.copyFailed} label={p.copyLink} />
          <div className="flex gap-2">
            {isOwner && (
              <SoonButton className="flex h-11 items-center gap-1.5 rounded-full bg-ink/72 px-3.5 text-sm font-semibold text-cream backdrop-blur-sm">
                <IconPen size={16} stroke="#EFE6D8" /> {p.edit}
              </SoonButton>
            )}
            <ProfileMenu locale={locale} labels={{ menu: t.common.menu, language: t.common.language, close: t.common.close }} />
          </div>
        </div>
      </div>

      {/* Nombre y redes */}
      <div className="mt-3 flex flex-col items-center gap-1.5 px-4 text-center">
        <h1 className="font-display text-[40px] leading-none font-semibold text-white">{profile.name}</h1>
        <p className="text-[15px] text-mute">
          @{profile.handle} · {profile.role[locale]} · {profile.area}
        </p>
        <div className="mt-2.5 flex items-center gap-2.5">
          {isOwner && (
            <SoonButton aria-label={p.addNetwork} className="flex size-[52px] items-center justify-center rounded-full bg-gold">
              <IconPlus stroke="#08090B" weight={2.2} />
            </SoonButton>
          )}
          {profile.socials.map((s) => {
            const Icon = socialIcon[s];
            return (
              <SoonButton key={s} aria-label={socialName[s]} className="flex size-12 items-center justify-center rounded-xl bg-cream">
                <Icon stroke="#08090B" weight={1.9} />
              </SoonButton>
            );
          })}
        </div>
        {followers && (
          <p className="mt-1.5 text-[15px] text-mute">
            <strong className="text-cream">{followers.strong}</strong> {followers.rest}
          </p>
        )}
      </div>

      {/* Hazte visible (solo lo ves tú) */}
      {isOwner && (
        <section className="mx-3.5 mt-6 rounded-[26px] border border-line bg-card px-[22px] py-5">
          <h2 className="font-display text-2xl font-semibold text-white">{p.visibleTitle}</h2>
          <p className="mt-0.5 text-sm text-mute">{p.visibleProgress(done, steps.length)}</p>
          <div className="mt-3.5 mb-1.5 h-1.5 rounded-full bg-line-2">
            <div className="h-1.5 rounded-full bg-gold" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
          {steps.map((s, i) => {
            const body = (
              <>
                {s.done ? (
                  <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-gold">
                    <IconCheck size={18} stroke="#08090B" weight={2.4} />
                  </span>
                ) : (
                  <span className="size-[34px] shrink-0 rounded-full border-2 border-gold" />
                )}
                <span className="flex grow flex-col gap-0.5">
                  <span className={`text-base font-bold ${s.done ? "text-mute line-through" : "text-cream"}`}>{s.title}</span>
                  <span className="text-[13px] text-mute">{s.sub}</span>
                </span>
                {!s.done && <IconChevron size={20} stroke="#9A9EA6" />}
              </>
            );
            const cls = `flex items-center gap-3.5 py-3 ${i < steps.length - 1 ? "border-b border-line" : ""}`;
            return s.href ? (
              <Link key={s.title} href={s.href} className={cls}>
                {body}
              </Link>
            ) : (
              <div key={s.title} className={cls}>
                {body}
              </div>
            );
          })}
        </section>
      )}

      {/* Enlaces: servicios y redes */}
      {profile.services.length > 0 && (
        <>
          <div className="relative mt-6 flex h-[150px] items-end justify-center bg-raised pb-[18px]">
            <Placeholder label={p.cover} className="absolute inset-x-0 top-[60px]" />
            <span className="font-display text-[26px] font-semibold text-white">{profile.tagline[locale]}</span>
          </div>
          <div className="flex flex-col gap-3 px-3.5 pt-[22px]">
            <h2 className="text-center text-[15px] font-extrabold tracking-[0.18em] text-white">{p.book}</h2>
            {profile.services.map((s) => (
              <div key={s.id} className="flex items-center gap-3.5 rounded-[22px] border border-line bg-raised p-3">
                <Placeholder label={p.photo} className="size-[76px] shrink-0 rounded-[14px] bg-raised-2" />
                <div className="flex grow flex-col gap-[3px]">
                  <span className="text-[10px] font-bold tracking-[0.14em] text-gold">{s.kicker[locale]}</span>
                  <span className="text-[17px] leading-tight font-bold text-white">{s.title[locale]}</span>
                  <span className="text-[13px] text-mute">
                    {s.detail[locale]} {formatPrice(s.price, locale)}
                  </span>
                </div>
                <SoonButton className="flex h-11 shrink-0 items-center rounded-full bg-gold px-3.5 text-sm font-bold text-ink">
                  {p.actions[s.action]}
                </SoonButton>
              </div>
            ))}

            <h2 className="mt-2.5 text-center text-[15px] font-extrabold tracking-[0.18em] text-white">{p.findMe}</h2>
            <div className="flex gap-3">
              {profile.socials
                .filter((s) => s !== "facebook")
                .map((s) => {
                  const Icon = socialIcon[s];
                  return (
                    <SoonButton key={s} className="relative flex h-[150px] grow items-end rounded-[22px] bg-raised p-3.5 text-left text-white">
                      <span className="absolute top-3 left-3 flex size-8 items-center justify-center rounded-[9px] bg-cream">
                        <Icon size={18} stroke="#08090B" weight={2} />
                      </span>
                      <span className="text-xl font-bold">{socialName[s]}</span>
                    </SoonButton>
                  );
                })}
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {[p.post, p.reel, p.post].map((label, i) => (
                <Placeholder key={i} label={label} className="h-[118px] rounded-2xl bg-raised" />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
