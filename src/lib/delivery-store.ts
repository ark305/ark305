"use client";

// Carrito y pedido de Delivery, guardados en este teléfono.
import { createLocalValue } from "./local-store";

export type DeliveryOrder = { code: string; store: string; total: number; addr: string; at: number };
export type DeliveryState = { store: string | null; qty: Record<number, number>; tip: number; addr: string; order: DeliveryOrder | null };

const store = createLocalValue<DeliveryState>("ark305:delivery", { store: null, qty: {}, tip: 0.15, addr: "", order: null });

export const useDelivery = store.useValue;

// El seguimiento es simulado: avanza un paso cada 3 segundos desde que se pidió.
export const STEP_MS = 3000;
export const orderStep = (o: DeliveryOrder, now: number) => Math.max(0, Math.min(3, Math.floor((now - o.at) / STEP_MS)));

export const deliveryStore = {
  // Un carrito solo puede tener productos de un local.
  setQty(storeId: string, index: number, q: number) {
    const s = store.read();
    const qty = s.store === storeId ? { ...s.qty } : {};
    if (q > 0) qty[index] = q;
    else delete qty[index];
    store.write({ ...s, store: Object.keys(qty).length ? storeId : null, qty });
  },
  setTip(tip: number) {
    store.write({ ...store.read(), tip });
  },
  setAddr(addr: string) {
    store.write({ ...store.read(), addr });
  },
  place(order: Omit<DeliveryOrder, "code" | "at">) {
    const o: DeliveryOrder = { ...order, code: `PED-${1000 + Math.floor(Math.random() * 9000)}`, at: Date.now() };
    store.write({ ...store.read(), store: null, qty: {}, order: o });
    return o;
  },
  done() {
    store.write({ ...store.read(), order: null });
  },
};
