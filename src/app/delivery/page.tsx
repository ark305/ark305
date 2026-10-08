import type { Metadata } from "next";
import { DeliveryView } from "@/components/delivery-view";
import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.delivery.title };
}

// Delivery: comida, licores, farmacia, flores y súper (traído de ark305-app).
export default async function DeliveryPage() {
  const { locale } = await getDictionary();
  return <DeliveryView locale={locale} />;
}
