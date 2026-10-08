// Delivery: locales y menús de ejemplo del prototipo (ark305-app).
import type { Localized } from "./locale";

export type StoreCat = "all" | "food" | "liquor" | "pharmacy" | "flowers" | "grocery";
export type MenuItem = { name: Localized; price: number };
export type Store = { id: string; cat: Exclude<StoreCat, "all">; name: string; desc: Localized; eta: string; fee: number; color: string; menu: MenuItem[] };

export const storeCats: { id: StoreCat; name: Localized }[] = [
  { id: "all", name: { es: "Todo", en: "All" } },
  { id: "food", name: { es: "Restaurantes", en: "Restaurants" } },
  { id: "liquor", name: { es: "Licores", en: "Liquor" } },
  { id: "pharmacy", name: { es: "Farmacia", en: "Pharmacy" } },
  { id: "flowers", name: { es: "Flores", en: "Flowers" } },
  { id: "grocery", name: { es: "Súper", en: "Grocery" } },
];

const m = (es: string, en: string, price: number): MenuItem => ({ name: { es, en }, price });

export const stores: Store[] = [
  {
    id: "s1", cat: "food", name: "Mar y Brasa", desc: { es: "Mariscos y parrilla · Brickell", en: "Seafood and grill · Brickell" }, eta: "25–35 min", fee: 3.99, color: "#C8643F",
    menu: [m("Ceviche de pescado", "Fish ceviche", 18), m("Pulpo a la brasa", "Grilled octopus", 32), m("Churrasco con chimichurri", "Churrasco with chimichurri", 38), m("Arroz con mariscos para 2", "Seafood rice for 2", 46)],
  },
  {
    id: "s2", cat: "food", name: "Sakura Omakase", desc: { es: "Sushi · Miami Beach", en: "Sushi · Miami Beach" }, eta: "35–45 min", fee: 4.99, color: "#3E8C82",
    menu: [m("Combo 24 piezas", "24-piece combo", 54), m("Roll de langosta", "Lobster roll", 28), m("Edamame con sal marina", "Edamame with sea salt", 9), m("Mochi surtido", "Assorted mochi", 12)],
  },
  {
    id: "s3", cat: "liquor", name: "Bodega 305", desc: { es: "Champagne, tequila y hielo · mayores de 21", en: "Champagne, tequila and ice · 21+" }, eta: "20–30 min", fee: 2.99, color: "#274356",
    menu: [m("Champagne brut 750 ml", "Brut champagne 750 ml", 68), m("Tequila reposado 750 ml", "Reposado tequila 750 ml", 55), m("Hielo 10 lb", "Ice 10 lb", 6), m("Pack de agua mineral x12", "Mineral water pack x12", 14)],
  },
  {
    id: "s4", cat: "pharmacy", name: "Farmacia Brickell", desc: { es: "Protector solar y básicos", en: "Sunscreen and basics" }, eta: "20–30 min", fee: 1.99, color: "#3E8C82",
    menu: [m("Protector solar SPF 50", "SPF 50 sunscreen", 16), m("Pastillas para el mareo", "Seasickness pills", 11), m("Electrolitos x6", "Electrolytes x6", 13), m("Botiquín de viaje", "Travel first-aid kit", 22)],
  },
  {
    id: "s5", cat: "flowers", name: "Casa Pétalo", desc: { es: "Arreglos para eventos", en: "Event arrangements" }, eta: "45–60 min", fee: 5.99, color: "#C8643F",
    menu: [m("Ramo de rosas blancas", "White rose bouquet", 65), m("Centro de mesa tropical", "Tropical centerpiece", 85), m("Globos metálicos x6", "Foil balloons x6", 24)],
  },
  {
    id: "s6", cat: "grocery", name: "Fresh Market Key", desc: { es: "Frutas, snacks y bebidas", en: "Fruit, snacks and drinks" }, eta: "30–40 min", fee: 2.99, color: "#9C7641",
    menu: [m("Tabla de quesos", "Cheese board", 42), m("Frutas cortadas", "Cut fruit", 24), m("Snacks surtidos", "Assorted snacks", 18), m("Refrescos x12", "Sodas x12", 15)],
  },
];

export const TIPS = [0, 0.1, 0.15, 0.2];
export const SERVICE_FEE = 0.05;

export const getStore = (id: string) => stores.find((s) => s.id === id);

// Cuentas del carrito: la propina se calcula sobre los productos.
export function cartTotals(store: Store, qty: Record<number, number>, tip: number) {
  const sub = store.menu.reduce((s, it, i) => s + it.price * (qty[i] ?? 0), 0);
  const svc = sub * SERVICE_FEE;
  const tipAmt = sub * tip;
  return { sub, svc, tip: tipAmt, fee: store.fee, total: sub + svc + tipAmt + store.fee };
}
