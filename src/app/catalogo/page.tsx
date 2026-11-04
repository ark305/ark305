import { getLocale } from "@/lib/i18n";

type Service = {
  id: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  source: "demo";
  bookable: false;
  pricing: { type: "quote" };
};

function isService(value: unknown): value is Service {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Service>;
  return typeof item.id === "string" &&
    typeof item.name?.es === "string" && typeof item.name?.en === "string" &&
    typeof item.description?.es === "string" && typeof item.description?.en === "string" &&
    item.source === "demo" && item.bookable === false && item.pricing?.type === "quote";
}

export default async function CatalogPage() {
  const locale = await getLocale();
  const es = locale === "es";
  let items: Service[] | null = null;
  try {
    const base = process.env.ARK_API_URL ?? "http://127.0.0.1:3001";
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/catalog`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Catalog request failed");
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("items" in data) ||
        !Array.isArray(data.items) || !data.items.every(isService)) {
      throw new Error("Invalid catalog response");
    }
    items = data.items;
  } catch {
    // Never substitute local demo data for an unavailable backend.
    items = null;
  }

  return (
    <section className="space-y-5 px-5 py-8">
      <header>
        <h1 className="text-2xl font-semibold">{es ? "Catálogo de servicios" : "Service catalog"}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {es ? "Demo · Sin proveedores confirmados. No permite reservas." : "Demo · No confirmed providers. Booking is unavailable."}
        </p>
      </header>
      {items === null ? (
        <p role="status">{es ? "Catálogo no disponible. Intenta nuevamente más tarde." : "Catalog unavailable. Please try again later."}</p>
      ) : items.length === 0 ? (
        <p>{es ? "No hay servicios publicados." : "No services published."}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-neutral-200 p-4">
              <h2 className="font-semibold">{item.name[locale]}</h2>
              <p className="mt-1 text-sm">{item.description[locale]}</p>
              <p className="mt-3 text-sm text-neutral-500">{es ? "Bajo cotización · Demo" : "Price on request · Demo"}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
