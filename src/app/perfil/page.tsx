import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconChevron, IconCrown } from "@/components/icons";
import { ModeSwitch } from "@/components/mode-switch";
import { ProfileView } from "@/components/profile-view";
import { SignIn } from "@/components/sign-in";
import { getContext, getDictionary } from "@/lib/i18n";
import { getLevel } from "@/lib/levels";
import { CURRENT_HANDLE, getProfile } from "@/lib/mock-data";
import { LEVEL_COLOR } from "@/lib/mode";
import { getViewer } from "@/lib/profiles-db";
import { supabaseReady } from "@/lib/supabase/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.profile };
}

export default async function MyProfilePage() {
  const { locale, t, mode, level } = await getContext();

  // Sin base de datos conectada: perfil de ejemplo (Lente 305), como antes.
  if (!supabaseReady) {
    const me = getProfile(CURRENT_HANDLE)!;
    return <ProfileView profile={me} isOwner locale={locale} t={t} mode={mode} level={level} />;
  }

  const viewer = await getViewer();
  if (viewer.userId && !viewer.row) redirect("/bienvenida");

  if (viewer.profile && viewer.row) {
    const r = viewer.row;
    return (
      <ProfileView
        profile={viewer.profile}
        isOwner
        real
        signedIn
        locale={locale}
        t={t}
        mode={mode}
        level={level}
        steps={{ photo: !!r.photo_url, service: viewer.services.length > 0, bio: r.bio_link, shared: r.shared }}
      />
    );
  }

  // Invitado: entrar, y mientras tanto puede cambiar de modo y ver los niveles.
  const lvl = getLevel(level);
  return (
    <div className="flex flex-col gap-4 px-4 pt-10">
      <p className="font-display text-[34px] leading-none font-semibold text-white">
        ARK<span className="text-gold">305</span>
      </p>
      <SignIn locale={locale} />
      <ModeSwitch mode={mode} labels={{ label: t.mode.label, buscar: t.mode.buscar, ofrecer: t.mode.ofrecer }} />
      <p className="text-center text-[13px] text-mute">{mode === "ofrecer" ? t.mode.ofrecerHint : t.mode.buscarHint}</p>
      <Link href="/niveles" className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.035] p-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ background: `${LEVEL_COLOR[level]}22` }}>
          {level === "vip" ? <IconCrown size={20} stroke="#D8B170" weight={1.9} /> : <span className="size-3 rounded-full" style={{ background: LEVEL_COLOR[level] }} />}
        </span>
        <span className="flex grow flex-col">
          <span className="text-[12px] text-mute">{t.levels.yourLevel}</span>
          <span className="text-base font-bold text-white">{lvl.name[locale]}</span>
        </span>
        <span className="text-[13px] font-semibold text-cream/80">{t.levels.see}</span>
        <IconChevron size={18} stroke="#9A9EA6" />
      </Link>
    </div>
  );
}
