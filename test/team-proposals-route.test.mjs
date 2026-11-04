import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function route(fetcher,env={}){
  const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/team-proposals/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,
    {exports,require:()=>({validTeamProposal:v=>v?.valid===true}),fetch:fetcher,process:{env},URL,Response,AbortSignal});return exports.GET;
}
test('history proxy forwards bearer only to configured safe origin and redacts failures',async()=>{
  let calls=0;const get=route(async(url,init)=>{calls++;assert.equal(String(url),'http://127.0.0.1:3001/api/v1/team-proposals');assert.equal(init.headers.Authorization,'Bearer test');assert.equal(init.redirect,'error');return Response.json({items:[{valid:true}]});});
  assert.equal((await get(new Request('http://local'))).status,401);assert.equal(calls,0);
  const request=new Request('http://local',{headers:{authorization:'Bearer test'}});
  const response=await get(request);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(calls,1);
  const badOrigin=route(()=>{throw new Error('must not fetch');},{ARK_API_URL:'http://external.example'});assert.equal((await badOrigin(request)).status,503);
  const failed=route(async()=>Response.json({error:'private details'},{status:500}));assert.deepEqual(await(await failed(request)).json(),{error:'proposal_storage'});
  const invalid=route(async()=>Response.json({items:[{}]}));assert.equal((await invalid(request)).status,502);
});
