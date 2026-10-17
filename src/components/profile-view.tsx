import Image from "next/image";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLevel } from "@/lib/levels";
import { formatCount, formatPrice, type Profile } from "@/lib/mock-data";
import { LEVEL_COLOR, type Level, type Mode } from "@/lib/mode";
import { IconCheck, IconChevron, IconCrown, IconFacebook, IconInstagram, IconPen, IconPlus, IconTikTok } from "./icons";
import { IconSparkle } from "./icons";
import { SideSwitch } from "./side-switch";
import { CopyLinkButton, Dismissible, ProfileMenu, StepButton } from "./profile-actions";
import { Photo } from "./photo";
import { SoonButton } from "./toast";

const socialIcon = { instagram: IconInstagram, tiktok: IconTikTok, facebook: IconFacebook };
const socialName = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook" };

export type Steps = { photo: boolean; service: boolean; bio: boolean; shared: boolean };

export function ProfileView({
  profile,
  isOwner,
  locale,
  t,
  mode,
  level,
  real = false,
  signedIn = false,
  steps: realSteps,
}: {
  profile: Profile;
  isOwner: boolean;
  locale: Locale;
  t: Dictionary;
  mode: Mode;
  level: Level;
  real?: boolean; // perfil real en Archie (se puede editar)
  signedIn?: boolean;
  steps?: Steps;
  exp?: unknown;
}) {
  const p = t.profile;
  const followers = p.followers(formatCount(profile.followers, locale));
  const offer = mode === "ofrecer";
  const lvl = getLevel(level);
  const menuLabels = { label: t.side.label, personal: t.side.personal, business: t.side.business };

  // Lista "Hazte visible" (datos de ejemplo: 2 de 4 listos).
  const flags = realSteps ?? { photo: true, service: true, bio: false, shared: false };
  const editable = isOwner && real;
  const steps: { key: string; title: string; sub: string; done: boolean; href?: string }[] = [
    { key: "photo", ...p.steps.photo, done: flags.photo, href: editable ? "/perfil/editar" : undefined },
    { key: "service", ...p.steps.service, done: flags.service, href: editable ? "/perfil/editar" : undefined },
    { key: "bio", ...p.steps.bio, done: flags.bio, href: editable ? undefined : "/ganar" },
    { key: "share", ...p.steps.share, done: flags.shared, href: editable ? undefined : "/ganar" },
  ];
  const done = steps.filter((s) => s.done).length;
  const findMe = profile.socials.filter((s) => s.photo);

  return (
    <div>
      {/* Portada a pantalla completa con el nombre encima */}
      <section className="relative h-[min(80dvh,640px)] min-h-[520px]">
        <Photo src={profile.photo} name={profile.name} priority sizes="430px" />
        <div className="fade-top absolute inset-x-0 top-0 h-36" />
        <div className="fade-bottom absolute inset-x-0 bottom-0 h-[60%]" />

        <div className="absolute inset-x-3.5 flex items-center justify-between gap-2" style={{ top: "calc(16px + env(safe-area-inset-top))" }}>
          <CopyLinkButton handle={profile.handle} copied={t.common.copied} failed={t.common.copyFailed} label={p.copyLink} markShared={editable && !flags.shared} />
          <div className="flex shrink-0 gap-2">
            {isOwner &&
              (offer || editable) &&
              (editable ? (
                <Link href="/perfil/editar" className="glass flex h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-cream">
                  <IconPen size={16} stroke="#EFE6D8" /> {p.edit}
                </Link>
              ) : (
                <SoonButton className="glass flex h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-cream">
                  <IconPen size={16} stroke="#EFE6D8" /> {p.edit}
                </SoonButton>
              ))}
            <ProfileMenu locale={locale} mode={isOwner ? mode : null} signedIn={signedIn} labels={{ menu: t.common.menu, language: t.common.language, close: t.common.close, levels: t.levels.see, signOut: t.auth.signOut, ...menuLabels }} side={offer ? "business" : "personal"} />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 px-4 pb-2 text-center">
          <h1 className="font-display text-[44px] leading-none font-semibold text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.5)]">{profile.name}</h1>
          <p className="text-[15px] text-cream/75">
            @{profile.handle} · {profile.role[locale]} · {profile.area}
          </p>
          {((isOwner && offer) || profile.socials.length > 0) && (
            <div className="mt-3 flex items-center gap-2.5">
              {isOwner &&
                offer &&
                (editable ? (
                  <Link href="/perfil/editar" aria-label={p.addNetwork} className="gold-grad flex size-[52px] items-center justify-center rounded-full shadow-[0_8px_24px_-6px_var(--accent)]">
                    <IconPlus stroke="#08090B" weight={2.2} />
                  </Link>
                ) : (
                  <SoonButton aria-label={p.addNetwork} className="gold-grad flex size-[52px] items-center justify-center rounded-full shadow-[0_8px_24px_-6px_var(--accent)]">
                    <IconPlus stroke="#08090B" weight={2.2} />
                  </SoonButton>
                ))}
              {profile.socials.map(({ network, url }) => {
                const Icon = socialIcon[network];
                const cls = "glass flex size-12 items-center justify-center rounded-2xl";
                return url ? (
                  <a key={network} href={url} target="_blank" rel="noopener noreferrer" aria-label={socialName[network]} className={cls}>
                    <Icon stroke="#FFFFFF" weight={1.9} />
                  </a>
                ) : (
                  <SoonButton key={network} aria-label={socialName[network]} className={cls}>
                    <Icon stroke="#FFFFFF" weight={1.9} />
                  </SoonButton>
                );
              })}
            </div>
          )}
          <p className="mt-2 text-[15px] text-mute">
            <strong className="text-cream">{followers.strong}</strong> {followers.rest}
          </p>
        </div>
      </section>

      {/* Tu cuenta: modo y nivel (solo lo ves tú) */}
      {isOwner && (
        <section className="mx-3.5 mt-6 flex flex-col gap-3">
          <SideSwitch side={offer ? "business" : "personal"} labels={{ label: t.side.label, personal: t.side.personal, business: t.side.business }} />
          <p className="text-center text-[13px] text-mute">{offer ? t.side.businessTag : t.side.personalTag}</p>
          <Link href="/snapshot" className="flex items-center gap-3 rounded-[22px] border border-gold/30 bg-gold/[0.06] p-3.5">
            <span className="gold-grad flex size-10 shrink-0 items-center justify-center rounded-full">
              <IconSparkle size={18} stroke="#08090B" weight={2} />
            </span>
            <span className="grow text-base font-bold text-white">{t.diag.cardTitle}</span>
            <IconChevron size={18} stroke="#9A9EA6" />
          </Link>
          <Link
            href="/niveles"
            className={`flex items-center gap-3 rounded-[22px] border p-3.5 ${level === "vip" ? "border-gold/40 bg-gradient-to-br from-[#241e15] to-ink" : "border-white/10 bg-white/[0.035]"}`}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ background: `${LEVEL_COLOR[level]}22` }}>
              {level === "vip" ? <IconCrown size={20} stroke="#D8B170" weight={1.9} /> : <span className="size-3 rounded-full" style={{ background: LEVEL_COLOR[level] }} />}
            </span>
            <span className="flex grow flex-col">
              <span className="text-[12px] text-mute">{t.levels.yourLevel}</span>
              <span className={`text-base font-bold ${level === "vip" ? "text-gold-soft" : "text-white"}`}>{lvl.name[locale]}</span>
            </span>
            <span className="text-[13px] font-semibold text-cream/80">{t.levels.see}</span>
            <IconChevron size={18} stroke="#9A9EA6" />
          </Link>
          <Link href="/perfil/datos" className="flex h-11 items-center justify-center text-[13px] font-semibold text-mute">
            {t.snap.knows}
          </Link>
        </section>
      )}

      {/* Hazte visible (solo en modo Ofrecer) */}
      {isOwner && offer && (
        <Dismissible label={p.hide} className="mx-3.5 mt-6">
          <section className="rounded-[26px] border border-white/10 bg-white/[0.035] px-[22px] py-5">
            <h2 className="font-display text-2xl font-semibold text-white">{p.visibleTitle}</h2>
            <p className="mt-0.5 text-sm text-mute">{p.visibleProgress(done, steps.length)}</p>
            <div className="mt-4 mb-1.5 h-1.5 rounded-full bg-white/10">
              <div className="gold-grad h-1.5 rounded-full shadow-[0_0_14px_var(--accent)]" style={{ width: `${(done / steps.length) * 100}%` }} />
            </div>
            {steps.map((s, i) => {
              const body = (
                <>
                  {s.done ? (
                    <span className="gold-grad flex size-[34px] shrink-0 items-center justify-center rounded-full">
                      <IconCheck size={18} stroke="#08090B" weight={2.4} />
                    </span>
                  ) : (
                    <span className="size-[34px] shrink-0 rounded-full border-2 border-gold/80" />
                  )}
                  <span className="flex grow flex-col gap-0.5">
                    <span className={`text-base font-bold ${s.done ? "text-mute line-through" : "text-cream"}`}>{s.title}</span>
                    <span className="text-[13px] text-mute">{s.sub}</span>
                  </span>
                  {!s.done && s.href && <IconChevron size={20} stroke="#9A9EA6" />}
                </>
              );
              const cls = `flex items-center gap-3.5 py-3 ${i < steps.length - 1 ? "border-b border-white/[0.07]" : ""}`;
              if (editable && s.key === "bio" && !s.done)
                return <StepButton key={s.key} step="bio_link" className={cls} label={p.bioDone}>{body}</StepButton>;
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
        </Dismissible>
      )}

      {/* Enlaces: servicios, redes y publicaciones */}
      {profile.services.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 px-3.5">
          {profile.banner && (
            <div className="relative flex h-[190px] items-end justify-center overflow-hidden rounded-[26px] pb-5">
              <Image src={profile.banner} alt="" fill sizes="430px" className="object-cover" />
              <div className="fade-bottom absolute inset-0" />
              <span className="relative font-display text-[28px] font-semibold text-white">{profile.tagline[locale]}</span>
            </div>
          )}

          <h2 className="mt-3 text-center text-[15px] font-extrabold tracking-[0.18em] text-white">{p.book}</h2>
          {profile.services.map((s) => (
            <div key={s.id} className="relative flex items-center gap-3.5 overflow-hidden rounded-[24px] border border-white/10 p-3">
              <Photo src={s.photo} name={s.title[locale]} sizes="200px" className="scale-150 object-cover opacity-70 blur-2xl" />
              <div className="absolute inset-0 bg-ink/45" />
              <div className="relative size-[76px] shrink-0 overflow-hidden rounded-[14px]">
                <Photo src={s.photo} name={s.title[locale]} sizes="76px" />
              </div>
              <div className="relative flex grow flex-col gap-[3px]">
                <span className="text-[10px] font-bold tracking-[0.14em] text-gold-soft">{s.kicker[locale]}</span>
                <span className="text-[17px] leading-tight font-bold text-white">{s.title[locale]}</span>
                <span className="text-[13px] text-cream/70">
                  {s.detail[locale]} {formatPrice(s.price, locale)}
                </span>
              </div>
              <SoonButton className="gold-grad relative flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold text-ink">
                {p.actions[s.action]}
              </SoonButton>
            </div>
          ))}

          {findMe.length > 0 && (
            <>
              <h2 className="mt-5 text-center text-[15px] font-extrabold tracking-[0.18em] text-white">{p.findMe}</h2>
              <div className="flex gap-3">
                {findMe.map(({ network, photo }) => {
                  const Icon = socialIcon[network];
                  return (
                    <SoonButton key={network} className="relative flex h-[180px] grow basis-0 items-end overflow-hidden rounded-[24px] p-3.5 text-left text-white">
                      <Image src={photo!} alt="" fill sizes="215px" className="object-cover" />
                      <div className="fade-bottom absolute inset-0" />
                      <span className="glass absolute top-3 left-3 flex size-9 items-center justify-center rounded-[11px]">
                        <Icon size={18} stroke="#FFFFFF" weight={2} />
                      </span>
                      <span className="relative text-xl font-bold">{socialName[network]}</span>
                    </SoonButton>
                  );
                })}
              </div>
            </>
          )}

          {profile.posts.length > 0 && (
            <div className="no-scrollbar -mx-3.5 mt-3 flex snap-x scroll-px-3.5 gap-2.5 overflow-x-auto px-3.5">
              {profile.posts.map((src, i) => (
                <div key={src} className="relative aspect-[4/5] w-[46%] shrink-0 snap-start overflow-hidden rounded-[20px]">
                  <Image src={src} alt={`${i % 2 ? p.reel : p.post} ${i + 1}`} fill sizes="200px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
