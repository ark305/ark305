import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const serviceId = '22222222-2222-4222-8222-222222222222';
const props = { locale: 'es', userId: 'owner', tone: 'business', services: [{ id: serviceId, title: 'Editing' }] };
const result = { draft: { text: 'Borrador real' }, provenance: { provider: 'Meta', model: 'muse-test', responseId: 'msg-seller' } };
function harness(request, getSession) {
  let cursor = 0, listener; const state = [], effects = [];
  const panel = { aiTitle: 'Commercial AI', aiActions: { post: 'Post', reply: 'Reply', price: 'Price' }, copy: 'Copy', needService: 'Add a service' };
  const modules = {
    react: {
      useState(value) { const i = cursor++; if (!(i in state)) state[i] = value; return [state[i], v => { state[i] = v; }]; },
      useRef(value) { return state[cursor++] ??= { current: value }; },
      useEffect(effect) { const i = cursor++; if (!(i in state)) { state[i] = true; effects.push(effect()); } },
    },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'fragment' },
    'next/link': { default: 'link' }, '@/lib/dict': { dict: () => ({ panel, biz: { panel }, common: {} }) },
    '@/lib/seller-draft-ai': { requestSellerDraft: request }, './toast': { useToast: () => ({ show() {} }) },
    '@/lib/supabase/config': { supabaseReady: true },
    '@/lib/supabase/client': { createClient: () => ({ auth: { getSession: getSession ?? (async () => ({ data: { session: { user: { id: 'owner' }, access_token: 'token' } } })),
      onAuthStateChange(fn) { listener = fn; return { data: { subscription: { unsubscribe() {} } } }; },
    } }) },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/components/seller-ai.tsx', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
  { exports, require: name => { if (!modules[name]) throw new Error(name); return modules[name]; } });
  return { render(p = props) { cursor = 0; return exports.SellerAi(p); }, signOut() { listener('SIGNED_OUT', null); }, cleanup() { effects.forEach(e => e?.()); } };
}
function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)]; }
const button = (h, name) => nodes(h.render()).find(n => n.type === 'button' && n.props.children === name);
const tick = () => new Promise(resolve => setImmediate(resolve));

test('seller UI requires reply context and explicit cost/margin before any call', async () => {
  let calls = 0; const h = harness(async () => { calls++; return result; });
  button(h, 'Reply').props.onClick(); button(h, 'Price').props.onClick(); await tick(); assert.equal(calls, 0);
  assert.ok(nodes(h.render()).some(n => n.props.role === 'alert'));
  assert.equal(nodes(h.render({ ...props, services: [] })).some(n => n.type === 'button'), false);
  h.cleanup();
});
test('seller UI sends only owned service ID and blocks duplicate requests', async () => {
  let resolve, calls = 0; const h = harness(async (input, token) => {
    calls++; assert.equal(input.serviceId, serviceId); assert.equal(token, 'token'); assert.equal(input.name, undefined); assert.equal(input.price, undefined);
    return new Promise(r => { resolve = r; });
  });
  const post = button(h, 'Post'); post.props.onClick(); post.props.onClick(); await tick(); assert.equal(calls, 1);
  resolve(result); await tick(); assert.ok(JSON.stringify(h.render()).includes('msg-seller')); h.cleanup();
});
test('seller UI cancels pending session lookup on logout and surfaces provider failures', async () => {
  let resolveSession, calls = 0; const h = harness(async () => { calls++; return result; }, () => new Promise(r => { resolveSession = r; }));
  button(h, 'Post').props.onClick(); h.signOut(); resolveSession({ data: { session: { user: { id: 'owner' }, access_token: 'old' } } });
  await tick(); assert.equal(calls, 0); assert.equal(JSON.stringify(h.render()).includes('msg-seller'), false); h.cleanup();
  const failed = harness(async () => { throw new Error('invalid_draft'); }); button(failed, 'Post').props.onClick(); await tick();
  assert.ok(nodes(failed.render()).some(n => n.props.role === 'alert')); assert.equal(JSON.stringify(failed.render()).includes('msg-seller'), false); failed.cleanup();
});
test('panel never supplies the demo profile services to commercial AI', () => {
  const source = fs.readFileSync(new URL('../src/app/panel/page.tsx', import.meta.url), 'utf8');
  const invocation = source.slice(source.indexOf('<SellerAi'), source.indexOf('/>', source.indexOf('<SellerAi')));
  assert.match(invocation, /viewer\.profile\?\.services \?\? \[\]/);
  assert.doesNotMatch(invocation, /me\.(services|name|handle)/);
});
