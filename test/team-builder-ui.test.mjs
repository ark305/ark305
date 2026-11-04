import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function harness(request, getSession) {
  let cursor = 0, listener;
  const slots = [], effects = [];
  const session = { user: { id: 'user-a' }, access_token: 'token-a' };
  const adapters = {
    react: {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], v => { slots[i] = v; }]; },
      useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
      useEffect(effect) { const i = cursor++; if (!(i in slots)) { slots[i] = true; effects.push(effect()); } },
    },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'next/link': { default: 'link' },
    '@/lib/dict': { dict: () => ({ biz: { team: { suggestions: ['Contenido'], build: 'Generar', building: 'Esperando' } } }) },
    '@/lib/mock-data': { formatPrice: n => '$' + n },
    '@/lib/talent': { positions: [{ id: 'r-cm', name: { es: 'Community manager', en: 'Community manager' } }] },
    '@/lib/team-plan-ai': { requestTeamPlan: request },
    '@/lib/supabase/config': { supabaseReady: true },
    '@/lib/supabase/client': { createClient: () => ({ auth: {
      getSession: getSession ?? (async () => ({ data: { session }, error: null })),
      onAuthStateChange: fn => { listener = fn; return { data: { subscription: { unsubscribe() {} } } }; },
    } }) },
  };
  const exports = {};
  const source = fs.readFileSync(new URL('../src/components/team-builder.tsx', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, require: name => { if (!adapters[name]) throw new Error(name); return adapters[name]; } });
  return { render() { cursor = 0; return exports.TeamBuilder({ locale: 'es', canHire: true }); },
    signOut() { listener('SIGNED_OUT', null); }, cleanup() { effects.forEach(e => e?.()); } };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const result = { plan: { understood: true, rationale: 'Equipo propuesto', demo: true, items: [{ id: 'r-cm', hours: 10, cadence: 'monthly', amount: 779 }], monthlyTotal: 779, oneOffTotal: 0, quoteCount: 0 }, provenance: { model: 'muse-test', responseId: 'msg-team' } };

test('team UI prevents duplicate provider calls and shows separate estimates with provenance', async () => {
  let resolve, calls = 0;
  const h = harness(async () => { calls++; return new Promise(r => { resolve = r; }); });
  const suggestion = nodes(h.render()).find(n => n.type === 'button' && n.props.children === 'Contenido');
  suggestion.props.onClick(); suggestion.props.onClick(); await tick();
  assert.equal(calls, 1);
  assert.ok(nodes(h.render()).filter(n => n.type === 'button').every(n => n.props.disabled));
  resolve(result); await tick();
  const output = JSON.stringify(h.render());
  for (const label of ['Mensual recurrente', 'Servicio puntual', 'Por cotizar', 'msg-team', 'Precios de demo']) assert.ok(output.includes(label));
  assert.equal(output.includes('/documentos'), false);
  h.cleanup();
});

test('team UI discards a late response after sign-out and never synthesizes a failed proposal', async () => {
  let resolve;
  const h = harness(() => new Promise(r => { resolve = r; }));
  nodes(h.render()).find(n => n.type === 'button' && n.props.children === 'Contenido').props.onClick(); await tick();
  h.signOut(); resolve(result); await tick();
  assert.equal(JSON.stringify(h.render()).includes('msg-team'), false);
  h.cleanup();
  const failed = harness(async () => { throw new Error('invalid_plan'); });
  nodes(failed.render()).find(n => n.type === 'button' && n.props.children === 'Contenido').props.onClick(); await tick();
  assert.ok(nodes(failed.render()).some(n => n.props.role === 'alert'));
  assert.equal(JSON.stringify(failed.render()).includes('msg-team'), false);
  failed.cleanup();
});

test('sign-out invalidates a session lookup before the account identity has initialized', async () => {
  let resolveSession, calls = 0;
  const h = harness(async () => { calls++; return result; }, () => new Promise(resolve => { resolveSession = resolve; }));
  nodes(h.render()).find(n => n.type === 'button' && n.props.children === 'Contenido').props.onClick();
  h.signOut();
  resolveSession({ data: { session: { user: { id: 'previous-account' }, access_token: 'old-token' } }, error: null });
  await tick();
  assert.equal(calls, 0);
  assert.equal(JSON.stringify(h.render()).includes('msg-team'), false);
  h.cleanup();
});
