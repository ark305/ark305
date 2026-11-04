import { getItem } from './catalog';
import type { Locale } from './locale';

export type AcceptedAddon = { id: string; requestId: string; serviceId: string; qty: number; acceptedAt: string; estimate: { amount: number; currency: 'USD'; source: 'demo' }; availability: 'unverified'; bookable: false };
export function isAddon(value: unknown, requestId: string): value is AcceptedAddon {
  if (!value || typeof value !== 'object') return false;
  const row = value as AcceptedAddon;
  return typeof row.id === 'string' && row.requestId === requestId && !!getItem(row.serviceId) && row.qty === 1 &&
    typeof row.acceptedAt === 'string' && Number.isFinite(Date.parse(row.acceptedAt)) && row.estimate?.source === 'demo' &&
    row.estimate.currency === 'USD' && Number.isFinite(row.estimate.amount) && row.estimate.amount >= 0 && row.availability === 'unverified' && row.bookable === false;
}
async function responseJson(response: Response) {
  if (!response.ok) throw new Error('Complement request failed');
  return response.json();
}
export async function loadAddons(token: string, requestId: string): Promise<AcceptedAddon[]> {
  const data = await responseJson(await fetch(`/api/service-requests/${encodeURIComponent(requestId)}/addons`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }));
  if (!Array.isArray(data.items) || !data.items.every((row: unknown) => isAddon(row, requestId))) throw new Error('Invalid complement response');
  return data.items;
}
export async function acceptAddon(token: string, requestId: string, serviceId: string): Promise<AcceptedAddon> {
  const data = await responseJson(await fetch(`/api/service-requests/${encodeURIComponent(requestId)}/addons`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceId, accepted: true }) }));
  if (!isAddon(data, requestId) || data.serviceId !== serviceId) throw new Error('Invalid complement response');
  return data;
}
export async function proposeAddon(token: string, serviceId: string, guests: number, locale: Locale): Promise<string | null> {
  const data = await responseJson(await fetch('/api/ai', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ task: 'day-upsell', serviceId, guests, locale, prompt: locale === 'es' ? 'Consulta un complemento compatible para mi solicitud.' : 'Look up one compatible complement for my request.' }) }));
  const items = data.plan?.items;
  if (!Array.isArray(items) || items.length > 1 || !Array.isArray(data.tools) || !data.tools.some((tool: { name?: string }) => tool.name === 'get_complements')) throw new Error('Invalid AI response');
  if (!items.length) return null;
  const item = items[0];
  if (!getItem(item.id) || item.qty !== 1 || !data.tools.some((tool: { serviceIds?: string[] }) => tool.serviceIds?.includes(item.id))) throw new Error('Invalid AI complement');
  return item.id;
}
