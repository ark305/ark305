import { Feed } from "@/components/feed";
import { getContext } from "@/lib/i18n";
import { getLevel } from "@/lib/levels";
import { CURRENT_HANDLE, getProfile } from "@/lib/mock-data";
import { getViewer, recentProfiles } from "@/lib/profiles-db";
import { supabaseReady } from "@/lib/supabase/config";
import { sanitize } from "@/lib/diagnosis";

// Inicio Personal ("Vive Miami"): el feed de la comunidad.
export default async function HomePage() {
  const { locale, t, level, side } = await getContext();
  const [viewer, real] = await Promise.all([getViewer(), recentProfiles(12)]);
  const me = supabaseReady ? viewer.profile : getProfile(CURRENT_HANDLE)!;
  const pick = (p: { handle: string; name: string; photo: string | null }) => ({ handle: p.handle, name: p.name, photo: p.photo });
  const s = side ?? "personal";
  const stored = viewer.row?.diagnosis;
  const fromAccount = stored && typeof stored === "object" && "answers" in stored ? sanitize(stored.answers) : null;
  return (
    <Feed
      locale={locale}
      level={level}
      levelName={getLevel(level).name[locale]}
      me={me ? pick(me) : null}
      people={real.map(pick)}
      side={s}
      labels={{ other: s === "business" ? t.side.personal : t.side.business, tag: s === "business" ? t.side.businessTag : t.side.personalTag }}
      initialTaste={viewer.row?.taste ?? null}
      signedIn={!!viewer.userId}
      fromAccount={fromAccount}
    />
  );
}
