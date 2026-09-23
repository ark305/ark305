"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useState } from "react";
import { defaultEntry, getItem } from "@/lib/catalog";
import { day } from "@/lib/day-store";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { CURRENT_HANDLE, FOLLOWING, formatCount, formatPrice, getProfile, posts, profiles, type Post } from "@/lib/mock-data";
import { LEVEL_COLOR, type Level } from "@/lib/mode";
import { IconArrow, IconChevron, IconComment, IconCrown, IconHeart, IconPlay, IconPlus, IconShare, IconSparkle } from "./icons";
import { useToast } from "./toast";

type Tab = "forYou" | "following" | "near";

// Inicio en modo Buscar: la red social de ARK305.
export function Feed({ locale, level, levelName }: { locale: Locale; level: Level; levelName: string }) {
  const t = dict(locale);
  const [tab, setTab] = useState<Tab>("forYou");
  const me = getProfile(CURRENT_HANDLE)!;
  const vip = level === "vip";

  const shown = posts.filter((p) => {
    const author = getProfile(p.author);
    if (!author) return false;
    if (tab === "following") return FOLLOWING.includes(p.author);
    if (tab === "near") return author.near;
    return true;
  });
  const stories = profiles.filter((p) => !p.private && p.handle !== CURRENT_HANDLE).slice(0, 10);

  return (
    <div className="flex flex-col gap-5 pt-5">
      <header className="flex items-center justify-between px-4">
        <span className="font-display text-[30px] leading-none font-semibold text-white">
          ARK<span className="text-gold">305</span>
        </span>
        <Link href="/niveles" className="glass flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold text-cream">
          {vip ? <IconCrown size={14} stroke="#D8B170" weight={2} /> : <span className="size-2 rounded-full" style={{ background: LEVEL_COLOR[level] }} />}
          {levelName}
          <IconChevron size={14} stroke="#9A9EA6" />
        </Link>
      </header>

      {/* Historias */}
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-4">
        <div className="flex w-[70px] shrink-0 flex-col items-center gap-1.5">
          <span className="relative size-[66px] rounded-full border border-white/15 p-[3px]">
            <span className="relative block size-full overflow-hidden rounded-full">
              <Image src={me.photo} alt="" fill sizes="66px" className="object-cover" />
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 flex size-[22px] items-center justify-center rounded-full bg-cream ring-2 ring-ink">
              <IconPlus size={13} stroke="#08090B" weight={2.6} />
            </span>
          </span>
          <span className="w-full truncate text-center text-[11px] text-mute">{t.feed.yourStory}</span>
        </div>
        {stories.map((p) => (
          <Link key={p.handle} href={`/@${p.handle}`} className="flex w-[70px] shrink-0 flex-col items-center gap-1.5">
            <span className="gold-grad size-[66px] rounded-full p-[2.5px]">
              <span className="block size-full rounded-full bg-ink p-[2px]">
                <span className="relative block size-full overflow-hidden rounded-full">
                  <Image src={p.photo} alt="" fill sizes="60px" className="object-cover" />
                </span>
              </span>
            </span>
            <span className="w-full truncate text-center text-[11px] text-cream/85">{p.name}</span>
          </Link>
        ))}
      </div>

      {/* ARK IA */}
      <Link
        href="/mi-dia"
        className="mx-4 flex flex-col gap-3 rounded-[26px] border p-4"
        style={{ borderColor: "#7FC2B740", background: "radial-gradient(120% 100% at 0% 0%, #7FC2B733 0%, #7FC2B70d 55%, #0b0c0f 100%)" }}
      >
        <span className="flex items-center gap-2 text-[15px] font-bold text-teal">
          <IconSparkle size={18} stroke="#7FC2B7" weight={1.9} /> {t.feed.aiTitle}
        </span>
        <span className="flex h-12 items-center justify-between rounded-full border border-white/10 bg-ink/60 pr-1.5 pl-4 text-[15px] text-mute">
          {t.feed.aiPrompt}
          <span className="flex size-9 items-center justify-center rounded-full bg-teal">
            <IconArrow size={18} stroke="#08090B" weight={2} />
          </span>
        </span>
      </Link>

      {vip && (
        <Link href="/private" className="relative mx-4 flex h-[150px] flex-col justify-end overflow-hidden rounded-[26px] border border-gold/40 p-4">
          <Image src="https://images.unsplash.com/photo-1774423864869-702b21c2490a" alt="" fill sizes="400px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
          <span className="relative flex items-center gap-2 font-display text-2xl font-semibold text-gold-soft">
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
        {shown.length === 0 && <p className="px-6 py-10 text-center text-mute">{t.feed.empty}</p>}
        {shown.map((p, i) => (
          <Fragment key={p.id}>
            <PostCard post={p} locale={locale} />
            {i === 2 && !vip && (
              <Link href="/niveles" className="mx-4 flex items-center gap-3.5 rounded-[24px] border border-gold/35 bg-gradient-to-br from-[#241e15] via-[#141210] to-ink p-4">
                <span className="gold-grad flex size-12 shrink-0 items-center justify-center rounded-2xl">
                  <IconCrown size={24} stroke="#08090B" weight={1.9} />
                </span>
                <span className="flex grow flex-col">
                  <span className="font-display text-xl font-semibold text-gold-soft">{t.feed.vipTitle}</span>
                  <span className="text-[13px] leading-snug text-cream/75">{t.feed.vipSub}</span>
                </span>
                <IconChevron size={20} stroke="#D8B170" />
              </Link>
            )}
          </Fragment>
        ))}
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

function PostCard({ post, locale }: { post: Post; locale: Locale }) {
  const t = dict(locale);
  const { show } = useToast();
  const [liked, setLiked] = useState(false);
  const author = getProfile(post.author)!;
  const service = post.service ? getItem(post.service) : undefined;

  async function share() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/@${author.handle}`);
      show(t.common.copied);
    } catch {
      show(t.common.copyFailed);
    }
  }

  return (
    <article className="flex flex-col gap-3">
      <Link href={`/@${author.handle}`} className="flex items-center gap-3 px-4">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
          <Image src={author.photo} alt="" fill sizes="40px" className="object-cover" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2 text-[15px] font-bold text-white">
            {author.name}
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-cream/75">{t.kinds[author.kind]}</span>
          </span>
          <span className="text-[12px] text-mute">
            {author.role[locale]} · {author.area}
          </span>
        </span>
      </Link>

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
                show(t.feed.added);
              }}
              className="gold-grad h-10 shrink-0 rounded-full px-4 text-[13px] font-bold text-ink"
            >
              {t.feed.addToDay}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-4">
        <button type="button" aria-label={t.feed.like} aria-pressed={liked} onClick={() => setLiked((l) => !l)} className="transition-transform active:scale-90">
          <IconHeart size={26} stroke={liked ? "#E07A8F" : "#EFE6D8"} filled={liked} weight={1.8} />
        </button>
        <Link href={`/@${author.handle}`} aria-label={t.feed.comment}>
          <IconComment size={25} stroke="#EFE6D8" weight={1.8} />
        </Link>
        <button type="button" aria-label={t.feed.share} onClick={share}>
          <IconShare size={24} stroke="#EFE6D8" weight={1.8} />
        </button>
      </div>
      <div className="flex flex-col gap-1 px-4 text-[14px] leading-snug">
        <span className="font-bold text-white">{t.feed.likes(formatCount(post.likes + (liked ? 1 : 0), locale))}</span>
        <p className="text-cream/90">
          <span className="font-bold text-white">{author.name}</span> <Caption text={post.text[locale]} />
        </p>
      </div>
    </article>
  );
}
