import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const textOf = (node) => typeof node === 'string' || typeof node === 'number' ? String(node)
  : Array.isArray(node) ? node.map(textOf).join('')
    : node && typeof node === 'object' ? textOf(node.props?.children) : '';

function findNodes(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach((child) => findNodes(child, predicate, found));
  else if (node && typeof node === 'object') {
    if (predicate(node)) found.push(node);
    findNodes(node.props?.children, predicate, found);
  }
  return found;
}

function hooks() {
  const slots = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { kind: 'state', value: typeof initial === 'function' ? initial() : initial };
      const slot = slots[index];
      return [slot.value, (value) => { slot.value = typeof value === 'function' ? value(slot.value) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { kind: 'ref', value: { current: initial } };
      return slots[index].value;
    },
    useCallback(callback, dependencies) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || dependencies.some((dependency, i) => dependency !== previous.dependencies[i])) {
        slots[index] = { kind: 'callback', dependencies, value: callback };
      }
      return slots[index].value;
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !dependencies || dependencies.some((dependency, i) => dependency !== previous.dependencies[i])) {
        previous?.cleanup?.();
        slots[index] = { kind: 'effect', dependencies, cleanup: effect() };
      }
    },
  };
  return {
    react,
    render(component, props) { cursor = 0; return component(props); },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
}


const flush = () => new Promise(resolve => setImmediate(resolve));
const item = {id:'a2222222-2222-4222-8222-22222222222b', serviceId:'yacht', requestedDate:'2027-01-15', guests:4, preferences:'Quiet', status:'received', createdAt:'2026-11-01T12:00:00Z'};
const labels = {title:'Requests', admin:'Administration', personal:'My requests', refresh:'Refresh', loading:'Loading', empty:'Empty', detail:'Details', history:'History', unavailable:'Unavailable', conflict:'Conflict; refresh', uncertain:'Uncertain; refresh', login:'Sign in', disclaimer:'Not a reservation', guests:'Guests', created:'Created', actions:{in_progress:'Manage',closed:'Close',cancelled:'Cancel'}};
function app(options={}) {
 const h=hooks(); const listeners=[]; let writes=0;
 const exports={};
 const source=fs.readFileSync(new URL('../src/components/requests-inbox.tsx',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 class InboxError extends Error {constructor(status){super();this.status=status;}}
 vm.runInNewContext(code,{exports,AbortController,Promise,fetch,require(name){
  if(name==='react') return h.react;
  if(name==='react/jsx-runtime') return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='next/link') return {default:'a'};
  if(name==='@/lib/dict') return {dict:()=>options.dictionary??({requests:labels,day:{requestStates:{received:'Received',in_progress:'In progress',closed:'Closed',cancelled:'Cancelled'}}})};
  if(name==='@/lib/catalog') return {getItem:()=>({name:{en:'Yacht',es:'Yate'}})};
  if(name==='@/lib/supabase/config') return {supabaseReady:true};
  if(name==='@/lib/supabase/client') return {createClient:()=>({auth:{onAuthStateChange(cb){listeners.push(cb);return {data:{subscription:{unsubscribe(){}}}};}}})};
  if(name==='@/lib/requests-inbox') return {InboxError,nextStatuses:s=>s==='received'?['in_progress','cancelled']:[],readInbox:options.list??(async()=>({admin:options.admin??true,items:[item]})),readHistory:options.history??(async()=>[]),changeRequest:async(...args)=>{writes++;if(options.write)return options.write(...args);throw new InboxError(503);}};
  throw Error(name);
 }});
 return {render:()=>h.render(exports.RequestsInbox,{locale:'en'}),auth:(session)=>listeners[0]('CHANGE',session),writes:()=>writes};
}
const session={user:{id:'one'},access_token:'token'};
test('real dictionaries render the inbox and retain Spanish accents', () => {
 for(const locale of ['es','en']) {
  const exports={};
  const source=fs.readFileSync(new URL('../src/lib/dictionaries/'+locale+'.ts',import.meta.url),'utf8');
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
  const dictionary=exports[locale];
  assert.equal(typeof dictionary.requests.title,'string');
  assert.match(textOf(app({dictionary}).render()),new RegExp(dictionary.requests.title));
  if(locale==='es') {
   assert.equal(dictionary.requests.admin,'Administración de solicitudes');
   assert.equal(dictionary.requests.login,'Iniciar sesión');
   assert.doesNotMatch(JSON.stringify(dictionary.requests),/\?/);
  }
 }
});
const button=(tree,label)=>findNodes(tree,n=>n.type==='button'&&textOf(n)===label)[0];
test('client can inspect history but never sees administrative controls',async()=>{
 const a=app({admin:false}); a.render(); a.auth(session); await flush(); let tree=a.render();
 assert.equal(button(tree,'Manage'),undefined); await button(tree,'Details').props.onClick(); await flush();
 assert.match(textOf(a.render()),/History/); assert.equal(a.writes(),0);
});
test('late response after logout cannot restore requests or admin controls',async()=>{
 let finish; const a=app({list:()=>new Promise(r=>{finish=r;})}); a.render();a.auth(session);await flush();a.auth(null);
 finish({admin:true,items:[item]});await flush();const tree=a.render();assert.doesNotMatch(textOf(tree),/Yacht|Administration/);assert.match(textOf(tree),/Sign in/);
});
test('double mutation is blocked and unknown result requires explicit refresh',async()=>{
 let finish; const a=app({write:()=>new Promise((_,reject)=>{finish=reject;})});a.render();a.auth(session);await flush();let tree=a.render();
 const action=button(tree,'Manage');const pending=action.props.onClick();action.props.onClick();assert.equal(a.writes(),1);
 finish(Error('network'));await pending;await flush();tree=a.render();assert.match(textOf(tree),/Uncertain/);assert.equal(button(tree,'Manage').props.disabled,true);
 await button(tree,'Refresh').props.onClick();await flush();assert.equal(button(a.render(),'Manage').props.disabled,false);
});
