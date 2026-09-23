import { Feed } from "@/components/feed";
import { getContext } from "@/lib/i18n";
import { getLevel } from "@/lib/levels";
import { CURRENT_HANDLE, getProfile } from "@/lib/mock-data";
import { getViewer, recentProfiles } from "@/lib/profiles-db";
import { supabaseReady } from "@/lib/supabase/config";

// Inicio (modo Buscar): el feed de la comunidad, según tu experiencia.
export default async function HomePage() {
  const { locale, level, exp, lens, view } = await getContext();
  const [viewer, real] = await Promise.all([getViewer(), recentProfiles(12)]);
  const me = supabaseReady ? viewer.profile : getProfile(CURRENT_HANDLE)!;
  const pick = (p: { handle: string; name: string; photo: string | null }) => ({ handle: p.handle, name: p.name, photo: p.photo });
  return (
    <Feed
      locale={locale}
      level={level}
      levelName={getLevel(level).name[locale]}
      me={me ? pick(me) : null}
      people={real.map(pick)}
      exp={exp}
      lens={lens}
      view={view}
      initialTaste={viewer.row?.taste ?? null}
      signedIn={!!viewer.userId}
    />
  );
}
