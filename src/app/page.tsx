import { FeaturesStrip } from "@/components/features-strip";
import { getDictionary } from "@/lib/i18n";
import { formatPrice } from "@/lib/mock-data";

// Colores de cada función, tomados del diseño.
const FEATURE_COLORS = {
  bookings: "#D8B170",
  myDay: "#EA9272",
  concierge: "#7FC2B7",
  delivery: "#D3A468",
  talent: "#C49BD0",
  academy: "#9FC08A",
  teams: "#E07A8F",
  pass: "#8FB0D0",
  events: "#B7A58A",
  analytics: "#6FA8C9",
} as const;

export default async function HomePage() {
  const { locale, t } = await getDictionary();
  const h = t.home;
  const features = (Object.keys(FEATURE_COLORS) as (keyof typeof FEATURE_COLORS)[]).map((key) => ({
    key,
    label: h.features[key],
    color: FEATURE_COLORS[key],
  }));

  return (
    <FeaturesStrip
      features={features}
      text={{
        doIt: h.doIt,
        count: h.functionsCount(3),
        chatUser: h.chatUser,
        chatArk: h.chatArk(formatPrice(3850, locale)),
        bookAll: h.bookAll,
        changeChef: h.changeChef,
        tagline: h.conciergeTagline,
        body: h.conciergeBody,
        howItWorks: h.howItWorks,
        soon: t.common.soon,
      }}
    />
  );
}
