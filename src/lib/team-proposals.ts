import type { TeamResult } from './team-plan-ai';

export type TeamProposal = TeamResult & {
  id: string; ownerId: string; createdAt: string; prompt: string; locale: 'es' | 'en'; version: 1; currency: 'USD';
};
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max: number): v is string => typeof v === 'string' && !!v.trim() && v.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\ufffd]/u.test(v);
export function validTeamProposal(v: unknown): v is TeamProposal {
  if (!record(v) || v.version !== 1 || v.currency !== 'USD' || !text(v.id,36) || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v.id) ||
      !text(v.ownerId,64) || !text(v.createdAt,40) || !Number.isFinite(Date.parse(v.createdAt)) || !text(v.prompt,4000) ||
      (v.locale!=='es'&&v.locale!=='en') || !record(v.plan) || !record(v.provenance)) return false;
  const p=v.plan, s=v.provenance;
  if (s.provider!=='Meta' || !text(s.model,200) || !text(s.responseId,200) || p.demo!==true || !text(p.rationale,1200) ||
      !Array.isArray(p.items) || p.items.length>8 || p.understood !== (p.items.length>0)) return false;
  let monthly=0, once=0, quote=0; const ids=new Set<string>();
  for (const item of p.items) {
    if (!record(item) || !text(item.id,100) || ids.has(item.id) || !text(item.name,200) ||
        typeof item.unit!=='string' || !['h','m','f','p','q'].includes(item.unit) ||
        typeof item.rate!=='number' || !Number.isFinite(item.rate) || item.rate<0 ||
        typeof item.hours!=='number' || !Number.isInteger(item.hours) ||
        (item.unit==='h' ? item.hours<1 || item.hours>40 : item.hours!==0)) return false;
    ids.add(item.id);
    const allowed=item.unit==='h'?['monthly','one_off']:item.unit==='m'?['monthly']:item.unit==='q'?['quote']:['one_off'];
    if (typeof item.cadence!=='string' || !allowed.includes(item.cadence)) return false;
    if (item.cadence==='quote') { if(item.amount!==null)return false; quote++; }
    else {
      if(typeof item.amount!=='number' || !Number.isSafeInteger(item.amount) || item.amount<0)return false;
      if(item.cadence==='monthly')monthly+=item.amount; else once+=item.amount;
    }
  }
  return p.monthlyTotal===monthly && p.oneOffTotal===once && p.quoteCount===quote;
}

export async function listTeamProposals(token: string | undefined, owner: string, fetcher: typeof fetch = fetch): Promise<TeamProposal[]> {
  if (!token) throw new Error('auth');
  const response=await fetcher('/api/team-proposals',{method:'GET',headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(response.status===401?'auth':'proposal_storage');
  const body:unknown=await response.json();
  if(!record(body)||!Array.isArray(body.items)||body.items.length>50||body.items.some(v=>!validTeamProposal(v)||v.ownerId!==owner))throw new Error('invalid_proposal');
  return body.items as TeamProposal[];
}
