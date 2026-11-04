export type SellerInput = { action: 'post' | 'reply' | 'price'; locale: string; tone: string; serviceId: string; context?: string; customerMessage?: string; cost?: number; marginPercent?: number };
export type SellerResult = { draft: { text: string }; pricing?: { cost: number; marginPercent: number; suggestedPrice: number; currency: 'USD' }; provenance: { provider: 'Meta'; model: string; responseId: string } };
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export async function requestSellerDraft(input: SellerInput, token: string | undefined, fetcher: typeof fetch = fetch): Promise<SellerResult> {
  if (!token) throw new Error('auth');
  const response = await fetcher('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...input, task: 'seller-draft' }), signal: AbortSignal.timeout(85000) });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(record(data) && typeof data.error === 'string' ? data.error : 'upstream');
  if (!record(data) || !record(data.draft) || typeof data.draft.text !== 'string' || !data.draft.text.trim() || data.draft.text.length > 2400 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\ufffd]/u.test(data.draft.text) || !record(data.provenance) || data.provenance.provider !== 'Meta' ||
    typeof data.provenance.model !== 'string' || !data.provenance.model.trim() || typeof data.provenance.responseId !== 'string' || !data.provenance.responseId.trim()) throw new Error('invalid_draft');
  if (input.action === 'price') {
    if (!record(data.pricing) || data.pricing.cost !== input.cost || data.pricing.marginPercent !== input.marginPercent || data.pricing.currency !== 'USD' ||
      typeof input.cost !== 'number' || !Number.isFinite(input.cost) || typeof input.marginPercent !== 'number' || input.marginPercent < 0 || input.marginPercent > 95 ||
      data.pricing.suggestedPrice !== Math.round(input.cost / (1 - input.marginPercent / 100) * 100) / 100) throw new Error('invalid_draft');
  } else if (data.pricing !== undefined) throw new Error('invalid_draft');
  return data as SellerResult;
}
