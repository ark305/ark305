"use client";

// Paquetes para revender (Business · Ofrecer). Se guardan en el teléfono hasta la Fase 3.
import { createLocalStore } from "./local-store";

export type ResaleItem = { id: string; qty: number; guests: number };
export type Proposal = {
  id: string;
  client: string;
  brand: string;
  whiteLabel: boolean;
  items: ResaleItem[];
  wholesale: number; // lo que cuesta en ARK
  margin: number; // % que agrega el revendedor
  status: "sent" | "accepted" | "paid";
  createdAt: number;
};

// ARK cobra 5% del costo del paquete a quien revende.
export const RESALE_FEE = 0.05;
export const clientPrice = (p: Pick<Proposal, "wholesale" | "margin">) => Math.round(p.wholesale * (1 + p.margin / 100));
export const resellerProfit = (p: Pick<Proposal, "wholesale" | "margin">) => clientPrice(p) - p.wholesale - Math.round(p.wholesale * RESALE_FEE);

const store = createLocalStore<Proposal>("ark305:proposals");
export const useProposals = store.useItems;

export const proposals = {
  add(p: Omit<Proposal, "id" | "status" | "createdAt">) {
    const id = `P-${Math.floor(1000 + Math.random() * 9000)}`;
    store.write([{ ...p, id, status: "sent", createdAt: Date.now() }, ...store.read()]);
    return id;
  },
  advance(id: string) {
    store.write(store.read().map((p) => (p.id === id ? { ...p, status: p.status === "sent" ? "accepted" : "paid" } : p)));
  },
};

// Contratos firmados y facturas pagadas de "Documentos".
const docs = createLocalStore<string>("ark305:docs");
export const useDocFlags = docs.useItems;
export const docFlags = {
  toggle(flag: string) {
    const all = docs.read();
    docs.write(all.includes(flag) ? all : [...all, flag]);
  },
};
