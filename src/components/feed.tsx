"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { defaultEntry, getItem } from "@/lib/catalog";
import { day } from "@/lib/day-store";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { FOLLOWING, formatCount, formatPrice, getProfile, posts, profiles, type Post } from "@/lib/mock-data";
import { LEVEL_COLOR, type Level, type Side } from "@/lib/mode";
import { taste, useTaste } from "@/lib/taste";
import { IconArrow, IconBookmark, IconChevron, IconComment, IconCrown, IconDots, IconHeart, IconPeople, IconPlay, IconPlus, IconShare, IconSparkle } from "./icons";
import { NextStep } from "./next-step";
import { Photo } from "./photo";
import { SidePill } from "./side-switch";
import { useToast } from "./toast";

type Tab = "forYou" | "following" | "near";
export type StoryPerson = { handle: string; name: string; photo: string | null };
type Ranked = { post: Post; explore: boolean };

// Orden de "Para ti": primero lo que más te gusta (según lo que ves, guardas y reservas),
// sin olvidar lo nuevo. Uno de cada 6 posts es de un tema distinto, para descubrir.
function rank(list: Post[], scores: Partial<Record<Post["topic"], number>>, home: Post["exp"]): Ranked[] {
  const scored = list.map((post, i) => ({ post, score: (scores[post.topic] ?? 0) + (list.length - i) * 0.3 - (post.exp === home ? 0 : 12) }));
  scored.sort((a, b) => b.score - a.score);
  const out: Ranked[] = [];
  const pool = [...scored];
  while (pool.length) {
    const explore = out.length % 6 === 5 && pool.length > 1;
    const pick = explore ? pool.splice(pool.length - 1, 1)[0] : pool.shift()!;
    out.push({ post: pick.post, explore });
  }
  return out;
}

// Inicio en modo Buscar: la red social de ARK305, según tu experiencia.
export function Feed({
  locale,
  level,
  levelName,
  me,
  people,
  side,
  labels,
  initialTaste,
  signedIn,
}: {
  locale: Locale;
  level: Level;
  levelName: string;
  me: StoryPerson | null;
  people: StoryPerson[];
  side: Side;
  labels: { other: string; tag: string };
  initialTaste: Record<string, number> | null;
  signedIn: boolean;
}) {
  const t = dict(locale);
  const [tab, setTab] = useState<Tab>("forYou");
  const state = useTaste();
  const vip = level === "vip";
  const business = side === "business";
  const home: Post["exp"] = business ? "business" : "lifestyle";

  useEffect(() => {
    taste.init(initialTaste, signedIn);
  }, [initialTaste, signedIn]);

  // Tu lado primero; el otro lado solo aparece de vez en cuando, para descubrir.
  const ranked = useMemo(() => {
    const base = posts.filter((p) => !state.hidden.includes(p.id) && getProfile(p.author));
    const mine = base.filter((p) => p.exp === home);
    if (tab === "following") return mine.filter((p) => FOLLOWING.includes(p.author)).map((post) => ({ post, explore: false }));
    if (tab === "near") return mine.filter((p) => getProfile(p.author)!.near).map((post) => ({ post, explore: false }));
    const others = base.filter((p) => p.exp !== home).slice(0, Math.ceil(mine.length / 5));
    return rank([...mine, ...others], state.taste, home);
  }, [home, state.hidden, state.taste, tab]);

  const stories = [...people, ...profiles.filter((p) => !p.private)]
    .filter((p, i, all) => p.handle !== me?.handle && all.findIndex((x) => x.handle === p.handle) === i)
    .slice(0, 14);

  return (
    <div className="flex flex-col gap-5 pt-5">
      <header className="flex items-center justify-between px-4">
        <span className="font-display text-[30px] leading-none font-semibold text-white">
          ARK<span className="text-gold">305</span>
        </span>
        <div className="flex items-center gap-2">
          <SidePill side={side} label={labels.other} />
        <Link href="/niveles" className="glass flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold text-cream">
          {vip ? <IconCrown size={14} stroke="#D8B170" weight={2} /> : <span className="size-2 rounded-full" style={{ background: LEVEL_COLOR[level] }} />}
          {levelName}
          <IconChevron size={14} stroke="#9A9EA6" />
        </Link>
        </div>
      </header>
      <p className="-mt-3 px-4 text-[13px] text-mute">{labels.tag}</p>

      <NextStep locale={locale} />

      {/* Historias */}
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-4">
        <Link href={me ? "/perfil/editar" : "/entrar"} className="flex w-[70px] shrink-0 flex-col items-center gap-1.5">
          <span className="relative size-[66px] rounded-full border border-white/15 p-[3px]">
            <span className="relative block size-full overflow-hidden rounded-full">
              <Photo src={me?.photo} name={me?.name ?? ""} sizes="66px" />
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 flex size-[22px] items-center justify-center rounded-full bg-cream ring-2 ring-ink">
              <IconPlus size={13} stroke="#08090B" weight={2.6} />
            </span>
          </span>
          <span className="w-full truncate text-center text-[11px] text-mute">{t.feed.yourStory}</span>
        </Link>
        {stories.map((p) => (
          <Link key={p.handle} href={`/@${p.handle}`} className="flex w-[70px] shrink-0 flex-col items-center gap-1.5">
            <span className="gold-grad size-[66px] rounded-full p-[2.5px]">
              <span className="block size-full rounded-full bg-ink p-[2px]">
                <span className="relative block size-full overflow-hidden rounded-full">
                  <Photo src={p.photo} name={p.name} sizes="60px" />
                </span>
              </span>
            </span>
            <span className="w-full truncate text-center text-[11px] text-cream/85">{p.name}</span>
          </Link>
        ))}
      </div>

      {/* ARK IA: arma tu día (Lifestyle) o tu equipo (Business) */}
      <Link
        href={business ? "/equipo" : "/mi-dia"}
        className="mx-4 flex flex-col gap-3 rounded-[26px] border p-4"
        style={
          business
            ? { borderColor: "#8FB0D040", background: "radial-gradient(120% 100% at 0% 0%, #8FB0D033 0%, #8FB0D00d 55%, #0b0c0f 100%)" }
            : { borderColor: "#7FC2B740", background: "radial-gradient(120% 100% at 0% 0%, #7FC2B733 0%, #7FC2B70d 55%, #0b0c0f 100%)" }
        }
      >
        <span className={`flex items-center gap-2 text-[15px] font-bold ${business ? "text-gold" : "text-teal"}`}>
          {business ? <IconPeople size={18} weight={1.9} /> : <IconSparkle size={18} stroke="#7FC2B7" weight={1.9} />} {business ? t.feed.teamTitle : t.feed.aiTitle}
        </span>
        <span className="flex h-12 items-center justify-between gap-2 rounded-full border border-white/10 bg-ink/60 pr-1.5 pl-4 text-[15px] text-mute">
          <span className="truncate">{business ? t.feed.teamPrompt : t.feed.aiPrompt}</span>
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${business ? "bg-gold" : "bg-teal"}`}>
            <IconArrow size={18} stroke="#08090B" weight={2} />
          </span>
        </span>
      </Link>

      {vip && !business && (
        <Link href="/private" className="relative mx-4 flex h-[150px] flex-col justify-end overflow-hidden rounded-[26px] border border-[#D8B170]/40 p-4">
          <Image src="https://images.unsplash.com/photo-1774423864869-702b21c2490a" alt="" fill sizes="400px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
          <span className="relative flex items-center gap-2 font-display text-2xl font-semibold text-[#EBD3A0]">
            <IconCrown size={20} stroke="#EBD3A0" weight={1.8} /> {t.feed.privateTitle}
          </span>
          <span className="relative text-sm text-cream/80">{t.feed.privateSub}</span>
        </Link>
      )}

      {/* Pestañas */}
      <div role="tablist" className="mx-4 grid grid-cols-3 border-b border-white/10">
        {(Object.keys(t.feed.tabs) as Tab[]).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-px h-11 border-b-2 text-[14px] font-semibold transition-colors ${tab === k ? "border-cream text-white" : "border-transparent text-mute"}`}
          >
            {t.feed.tabs[k]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {ranked.length === 0 && <p className="px-6 py-10 text-center text-mute">{t.feed.empty}</p>}
        {ranked.map(({ post, explore }, i) => (
          <Fragment key={post.id}>
            <PostCard post={post} locale={locale} explore={explore} saved={state.saved.includes(post.id)} expName={post.exp === "business" ? t.side.business : t.side.personal} score={state.taste[post.topic] ?? 0} />
            {i === 2 && !vip && (
              <Link href="/niveles" className="mx-4 flex items-center gap-3.5 rounded-[24px] border border-[#D8B170]/35 bg-gradient-to-br from-[#241e15] via-[#141210] to-ink p-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f3dba6] via-[#d8b170] to-[#b48746]">
                  <IconCrown size={24} stroke="#08090B" weight={1.9} />
                </span>
                <span className="flex grow flex-col">
                  <span className="font-display text-xl font-semibold text-[#EBD3A0]">{t.feed.vipTitle}</span>
                  <span className="text-[13px] leading-snug text-cream/75">{t.feed.vipSub}</span>
                </span>
                <IconChevron size={20} stroke="#D8B170" />
              </Link>
            )}
          </Fragment>
        ))}
        {ranked.length > 0 && <p className="px-6 text-center text-[12px] text-mute">{t.feed.learned}</p>}
      </div>
    </div>
  );
}

function Caption({ text }: { text: string }) {
  return (
    <>
      {text.split(/(#[\p{L}\d_]+)/u).map((part, i) =>
        part.startsWith("#") ? (
          <span key={i} className="text-gold-soft">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function PostCard({ post, locale, explore, saved, expName, score }: { post: Post; locale: Locale; explore: boolean; saved: boolean; expName: string; score: number }) {
  const t = dict(locale);
  const { show } = useToast();
  const [liked, setLiked] = useState(false);
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const author = getProfile(post.author)!;
  const service = post.service ? getItem(post.service) : undefined;
  const tag = post.exp === "business" ? "#D8B170" : "#7FC2B7";

  // Si te quedas mirando el post un rato, cuenta como interés (una vez por post).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        clearTimeout(timer);
        if (e.isIntersecting) timer = setTimeout(() => taste.seen(post.id, post.topic), 2500);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [post.id, post.topic]);

  async function share() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/@${author.handle}`);
      show(t.common.copied);
    } catch {
      show(t.common.copyFailed);
    }
  }

  const why = explore ? t.feed.whyNew : score >= 4 ? t.feed.whyTopic(t.feed.topics[post.topic]) : t.feed.whyExp(expName);

  return (
    <article ref={ref} className="flex flex-col gap-3">
      <div className="flex items-center gap-3 px-4">
        <Link href={`/@${author.handle}`} className="flex min-w-0 grow items-center gap-3">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
            <Photo src={author.photo} name={author.name} sizes="40px" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2 text-[15px] font-bold text-white">
              <span className="truncate">{author.name}</span>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink" style={{ background: tag }}>
                {expName}
              </span>
            </span>
            <span className="truncate text-[12px] text-mute">
              {t.kinds[author.kind]} · {author.role[locale]} · {author.area}
            </span>
          </span>
        </Link>
        <button type="button" aria-label={t.feed.more} onClick={() => setMenu(true)} className="flex size-9 shrink-0 items-center justify-center rounded-full">
          <IconDots size={22} stroke="#EFE6D8" weight={2.4} />
        </button>
      </div>

      <div className="relative mx-2 aspect-[4/5] overflow-hidden rounded-[24px] bg-raised">
        <Image src={post.photo} alt="" fill sizes="(max-width: 430px) 100vw, 414px" className="object-cover" />
        {post.kind === "reel" && (
          <span className="glass absolute top-3 right-3 flex size-9 items-center justify-center rounded-full">
            <IconPlay size={16} stroke="#FFFFFF" weight={1} />
          </span>
        )}
        {service && (
          <div className="glass absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-[18px] p-2 pl-3">
            <span className="flex min-w-0 grow flex-col">
              <span className="truncate text-[14px] font-bold text-white">{service.name[locale]}</span>
              <span className="text-[12px] text-cream/75">
                {formatPrice(service.price, locale)}
                {service.unit === "h" ? " / h" : service.unit === "p" ? (locale === "es" ? " / persona" : " / person") : ""}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                day.add([defaultEntry(service.id)]);
                taste.bump(post.topic, "book");
                show(t.feed.added);
              }}
              className="gold-grad h-10 shrink-0 rounded-full px-4 text-[13px] font-bold text-ink"
            >
              {t.feed.addToDay}
            </button>
          </div>
        )}
        {post.cta && (
          <Link
            href={post.cta.href}
            onClick={() => taste.bump(post.topic, "book")}
            className="glass absolute inset-x-3 bottom-3 flex h-12 items-center justify-between rounded-[18px] pr-2 pl-4 text-[14px] font-bold text-white"
          >
            {t.feed.cta[post.cta.label]}
            <span className="gold-grad flex size-8 items-center justify-center rounded-full">
              <IconArrow size={16} stroke="#08090B" weight={2.2} />
            </span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4 px-4">
        <button
          type="button"
          aria-label={t.feed.like}
          aria-pressed={liked}
          onClick={() => {
            if (!liked) taste.bump(post.topic, "like");
            setLiked((l) => !l);
          }}
          className="transition-transform active:scale-90"
        >
          <IconHeart size={26} stroke={liked ? "#E07A8F" : "#EFE6D8"} filled={liked} weight={1.8} />
        </button>
        <Link href={`/@${author.handle}`} aria-label={t.feed.comment}>
          <IconComment size={25} stroke="#EFE6D8" weight={1.8} />
        </Link>
        <button type="button" aria-label={t.feed.share} onClick={share}>
          <IconShare size={24} stroke="#EFE6D8" weight={1.8} />
        </button>
        <button
          type="button"
          aria-label={saved ? t.feed.saved : t.feed.save}
          aria-pressed={saved}
          onClick={() => {
            taste.toggleSave(post.id, post.topic);
            if (!saved) show(t.feed.saved);
          }}
          className={`ml-auto transition-transform active:scale-90 ${saved ? "text-gold" : "text-cream"}`}
        >
          <IconBookmark size={25} weight={1.8} filled={saved} />
        </button>
      </div>
      <div className="flex flex-col gap-1 px-4 text-[14px] leading-snug">
        <span className="font-bold text-white">{t.feed.likes(formatCount(post.likes + (liked ? 1 : 0), locale))}</span>
        <p className="text-cream/90">
          <span className="font-bold text-white">{author.name}</span> <Caption text={post.text[locale]} />
        </p>
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setMenu(false)}>
          <div
            role="dialog"
            aria-label={t.feed.more}
            className="flex w-full max-w-[430px] flex-col gap-3 rounded-t-[28px] border-t border-line bg-card px-5 pt-5"
            style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-mute">{t.feed.why}</p>
            <p className="rounded-[18px] bg-white/[0.05] px-4 py-3 text-[15px] text-cream">{why}</p>
            <button
              type="button"
              onClick={() => {
                taste.hide(post.id, post.topic);
                setMenu(false);
                show(t.feed.hiddenToast);
              }}
              className="h-12 rounded-full border border-white/10 text-[15px] font-semibold text-[#E07A8F]"
            >
              {t.feed.notInterested}
            </button>
            <button type="button" onClick={() => setMenu(false)} className="h-11 text-sm font-semibold text-mute">
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
