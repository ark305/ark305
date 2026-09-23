import { FeaturesFeed, type FeatureGroup, type FeatureKey } from "@/components/features-feed";
import { getDictionary } from "@/lib/i18n";
import { formatPrice } from "@/lib/mock-data";

// Colores de cada función, tomados del diseño.
const COLORS: Record<FeatureKey, string> = {
  concierge: "#7FC2B7",
  bookings: "#D8B170",
  myDay: "#EA9272",
  delivery: "#D3A468",
  talent: "#C49BD0",
  teams: "#E07A8F",
  events: "#B7A58A",
  pass: "#8FB0D0",
  academy: "#9FC08A",
  analytics: "#6FA8C9",
};

const GROUPS: { title: "doIt" | "grow" | "learn"; keys: FeatureKey[] }[] = [
  { title: "doIt", keys: ["concierge", "bookings", "myDay", "delivery"] },
  { title: "grow", keys: ["talent", "teams", "events", "pass"] },
  { title: "learn", keys: ["academy", "analytics"] },
];

export default async function HomePage() {
  const { locale, t } = await getDictionary();
  const h = t.home;

  const groups: FeatureGroup[] = GROUPS.map((g) => ({
    title: h.groups[g.title],
    count: h.count(g.keys.length),
    items: g.keys.map((key) => ({ key, color: COLORS[key], ...h.features[key] })),
  }));

  return (
    <FeaturesFeed
      groups={groups}
      howItWorks={h.howItWorks}
      demo={{ chatUser: h.chatUser, chatArk: h.chatArk(formatPrice(3850, locale)), bookAll: h.bookAll, changeChef: h.changeChef }}
    />
  );
}
