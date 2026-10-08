import type { Metadata } from "next";
import { CarsView } from "@/components/cars-view";
import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.cars.title };
}

// ARK CARS: club de autos por membresía (traído de ark305-app).
export default async function CarsPage() {
  const { locale } = await getDictionary();
  return <CarsView locale={locale} />;
}
