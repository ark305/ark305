import { positions } from './talent';

export type TeamEstimate = {
  understood: boolean; rationale: string; demo: true;
  items: { id: string; hours: number; cadence: 'monthly' | 'one_off' | 'quote'; amount: number | null }[];
  monthlyTotal: number; oneOffTotal: number; quoteCount: number;
};
export type TeamResult = { plan: TeamEstimate; provenance: { provider: 'Meta'; model: string; responseId: string } };
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function validTeamResult(value: unknown): value is TeamResult {
  if (!record(value) || !record(value.plan) || !record(value.provenance)) return false;
  const p = value.plan, source = value.provenance;
  if (source.provider !== 'Meta' || typeof source.model !== 'string' || !source.model.trim() || typeof source.responseId !== 'string' || !source.responseId.trim() ||
      p.demo !== true || typeof p.rationale !== 'string' || !p.rationale.trim() || p.rationale.length > 1200 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\ufffd]/u.test(p.rationale) ||
      !Array.isArray(p.items) || p.items.length > 8 || p.understood !== (p.items.length > 0)) return false;
  const ids = new Set<string>(); let monthly = 0, once = 0, quotes = 0;
  for (const item of p.items) {
    if (!record(item)) return false;
    const role = positions.find(role => role.id === item.id);
    if (!role || ids.has(role.id) || typeof item.hours !== 'number' || !Number.isInteger(item.hours)) return false;
    ids.add(role.id);
    const periods = role.unit === 'h' ? ['monthly', 'one_off'] : role.unit === 'm' ? ['monthly'] : role.unit === 'q' ? ['quote'] : ['one_off'];
    if (typeof item.cadence !== 'string' || !periods.includes(item.cadence) || (role.unit === 'h' ? item.hours < 1 || item.hours > 40 : item.hours !== 0)) return false;
    const expected = role.unit === 'q' ? null : Math.round(role.rate * (role.unit === 'h' ? item.hours * (item.cadence === 'monthly' ? 4.33 : 1) : 1));
    if (item.amount !== expected) return false;
    if (item.cadence === 'monthly') monthly += expected ?? 0;
    else if (item.cadence === 'one_off') once += expected ?? 0;
    else quotes++;
  }
  return p.monthlyTotal === monthly && p.oneOffTotal === once && p.quoteCount === quotes;
}

export async function requestTeamPlan(input: { prompt: string; locale: string }, token: string | undefined, fetcher: typeof fetch = fetch): Promise<TeamResult> {
  if (!token) throw new Error('auth');
  const response = await fetcher('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...input, task: 'team-plan' }), signal: AbortSignal.timeout(85000) });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(record(data) && typeof data.error === 'string' ? data.error : 'upstream');
  if (!validTeamResult(data)) throw new Error('invalid_plan');
  return data;
}
