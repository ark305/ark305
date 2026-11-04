import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load() {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/team-proposals.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,fetch,AbortSignal});
  return exports;
}
export const snapshot = {id:'11111111-1111-4111-8111-111111111111',ownerId:'owner-a',createdAt:'2026-11-04T00:00:00.000Z',version:1,currency:'USD',locale:'es',prompt:'Equipo',
  plan:{understood:true,rationale:'Propuesta histórica',demo:true,items:[{id:'retired-role',name:'Nombre original',unit:'h',rate:20,hours:10,cadence:'monthly',amount:866}],monthlyTotal:866,oneOffTotal:0,quoteCount:0},
  provenance:{provider:'Meta',model:'muse-test',responseId:'msg-original'}};
test('history reads saved prices and retired roles without requesting AI, rejects foreign accounts and invalid totals',async()=>{
  const {listTeamProposals,validTeamProposal}=load(); let calls=0;
  const fetcher=async(url,init)=>{calls++;assert.equal(url,'/api/team-proposals');assert.equal(init.method,'GET');return Response.json({items:[snapshot]});};
  await assert.rejects(listTeamProposals(undefined,'owner-a',fetcher),/auth/);assert.equal(calls,0);
  const rows=await listTeamProposals('token','owner-a',fetcher); assert.equal(rows[0].plan.monthlyTotal,866);assert.equal(calls,1);
  await assert.rejects(listTeamProposals('token','owner-b',fetcher),/invalid_proposal/);
  assert.equal(validTeamProposal({...snapshot,plan:{...snapshot.plan,monthlyTotal:1}}),false);
  assert.equal(validTeamProposal({...snapshot,provenance:{provider:'fake'}}),false);
});
