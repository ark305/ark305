import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function harness(list,getSession){
  let cursor=0,listener;const slots=[],effects=[],restored=[];
  const session={user:{id:'owner-a'},access_token:'token-a'};
  const adapters={
    react:{useState(v){const i=cursor++;if(!(i in slots))slots[i]=v;return[slots[i],v=>slots[i]=v];},useRef(v){const i=cursor++;return slots[i]??={current:v};},useEffect(fn){const i=cursor++;if(!(i in slots)){slots[i]=true;effects.push(fn());}}},
    'react/jsx-runtime':{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},
    '@/lib/team-proposals':{listTeamProposals:list},
    '@/lib/supabase/config':{supabaseReady:true},
    '@/lib/supabase/client':{createClient:()=>({auth:{getSession:getSession??(async()=>({data:{session}})),onAuthStateChange(fn){listener=fn;return{data:{subscription:{unsubscribe(){}}}};}}})},
  };
  const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/team-proposal-history.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>adapters[name]});
  return {render(){cursor=0;return exports.TeamProposalHistory({es:true,disabled:false,onRestore:v=>restored.push(v)});},logout(){listener('SIGNED_OUT',null);},restored,cleanup(){effects.forEach(fn=>fn?.());}};
}
function nodes(v){return !v||typeof v!=='object'?[]:Array.isArray(v)?v.flatMap(nodes):[v,...nodes(v.props?.children)];}
const tick=()=>new Promise(r=>setImmediate(r));
const row={id:'id-a',ownerId:'owner-a',createdAt:'2026-11-04T00:00:00Z',prompt:'Propuesta guardada'};
test('history restores an existing proposal on a fresh mount with one GET and prevents duplicate loads',async()=>{
  let calls=0;const h=harness(async()=>{calls++;return[row];});
  const button=nodes(h.render()).find(n=>n.type==='button');button.props.onClick();button.props.onClick();await tick();
  assert.equal(calls,1);nodes(h.render()).find(n=>n.type==='button'&&Array.isArray(n.props.children)).props.onClick();
  assert.equal(h.restored[0].id,'id-a');h.logout();assert.equal(JSON.stringify(h.render()).includes('Propuesta guardada'),false);h.cleanup();
});
test('history discards a pending response and pending session after logout',async()=>{
  let resolve;const h=harness(()=>new Promise(r=>resolve=r));nodes(h.render()).find(n=>n.type==='button').props.onClick();await tick();h.logout();resolve([row]);await tick();
  assert.equal(JSON.stringify(h.render()).includes('Propuesta guardada'),false);h.cleanup();
  let resolveSession,calls=0;const h2=harness(async()=>{calls++;return[row];},()=>new Promise(r=>resolveSession=r));
  nodes(h2.render()).find(n=>n.type==='button').props.onClick();h2.logout();resolveSession({data:{session:{user:{id:'owner-a'},access_token:'token-a'}}});await tick();assert.equal(calls,0);h2.cleanup();
});
test('history reports storage failure without a generated replacement',async()=>{
  const h=harness(async()=>{throw new Error('proposal_storage');});nodes(h.render()).find(n=>n.type==='button').props.onClick();await tick();
  assert.ok(nodes(h.render()).find(n=>n.props.role==='alert'));assert.equal(h.restored.length,0);h.cleanup();
});
