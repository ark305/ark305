import type { NextRequest } from 'next/server';
import { validTeamProposal } from '@/lib/team-proposals';

const failure=(status:number)=>Response.json({error:status===401?'auth':'proposal_storage'},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request: NextRequest) {
  const token=request.headers.get('authorization');
  if(!token || !/^Bearer [^\s,]+$/i.test(token))return failure(401);
  try {
    const origin=new URL(process.env.ARK_API_URL??'http://127.0.0.1:3001');
    if((origin.protocol!=='https:' && !(origin.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(origin.hostname))) ||
       origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)return failure(503);
    const response=await fetch(new URL('/api/v1/team-proposals',origin),{headers:{Authorization:token},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000)});
    if(!response.ok)return failure(response.status===401?401:503);
    const body=await response.json();
    if(!body || !Array.isArray(body.items)||body.items.length>50||!body.items.every(validTeamProposal))return failure(502);
    return Response.json({items:body.items},{headers:{'Cache-Control':'no-store'}});
  } catch {return failure(503);}
}
