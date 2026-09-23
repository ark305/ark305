import { Feed } from "@/components/feed";
import { getContext } from "@/lib/i18n";
import { getLevel } from "@/lib/levels";

// Inicio (modo Buscar): el feed de la comunidad.
export default async function HomePage() {
  const { locale, level } = await getContext();
  return <Feed locale={locale} level={level} levelName={getLevel(level).name[locale]} />;
}
