import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function compile(path) { return ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText; }
const libraryCode = compile('../src/lib/request-upsell.ts');
const componentCode = compile('../src/components/request-upsell.tsx');
const catalog = { getItem: id => ['yacht', 'chef'].includes(id) ? { name: { es: id === 'chef' ? 'Chef privado' : 'Yate', en: id === 'chef' ? 'Private chef' : 'Yacht' } } : undefined, entryPrice: () => 500 };
const row = { id: 'addon', requestId: 'request', serviceId: 'chef', qty: 1, acceptedAt: '2026-11-04T12:00:00Z', estimate: { amount: 500, currency: 'USD', source: 'demo' }, availability: 'unverified', bookable: false };
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(text).join('') : text(node?.props?.children ?? '');
function nodes(node, result = []) { if (Array.isArray(node)) node.forEach(child => nodes(child, result)); else if (node && typeof node === 'object') { result.push(node); nodes(node.props?.children, result); } return result; }
const flush = () => new Promise(resolve => setImmediate(resolve));

test('reload reads only storage; explicit accept sends no price and Meta errors do not write', async () => {
  const calls = []; let fail = false;
  const context = { exports: {}, require: () => catalog, fetch: async (url, init = {}) => {
    calls.push({ url, init });
    if (url === '/api/ai') return fail ? Response.json({}, { status: 503 }) : Response.json({ plan: { items: [{ id: 'chef', qty: 1 }] }, tools: [{ name: 'get_complements', serviceIds: ['chef'] }] });
    return Response.json(init.method === 'POST' ? row : { items: [row] });
  } };
  vm.runInNewContext(libraryCode, context); const api = context.exports;
  assert.equal((await api.loadAddons('token', 'request')).length, 1);
  assert.equal(calls[0].url, '/api/service-requests/request/addons');
  assert.equal(await api.proposeAddon('token', 'yacht', 4, 'es'), 'chef');
  assert.equal(calls.filter(call => call.url.includes('addons') && call.init.method === 'POST').length, 0);
  await api.acceptAddon('token', 'request', 'chef');
  assert.deepEqual(JSON.parse(calls.at(-1).init.body), { serviceId: 'chef', accepted: true });
  fail = true; await assert.rejects(() => api.proposeAddon('token', 'yacht', 4, 'en'));
  assert.equal(calls.filter(call => call.url.includes('addons') && call.init.method === 'POST').length, 1);
  assert.equal(api.isAddon({ ...row, serviceId: 'unknown' }, 'request'), false);
});

function harness(locale, options = {}) {
  const slots = []; let cursor = 0, persisted = [], metaCalls = 0, writes = 0;
  const react = {
    useState(initial) { const i = cursor++; slots[i] ??= { value: initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i]; },
    useEffect(effect, dependencies) { const i = cursor++, old = slots[i]; if (!old || dependencies.some((value, index) => value !== old.dependencies[index])) { old?.cleanup?.(); slots[i] = { dependencies, cleanup: effect() }; } },
  };
  const context = { exports: {}, Intl, require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name === '@/lib/catalog') return catalog;
    if (name === '@/lib/request-upsell') return {
      loadAddons: async () => persisted,
      proposeAddon: async () => { metaCalls++; if (options.metaFailure) throw new Error('Meta unavailable'); return 'chef'; },
      acceptAddon: async () => { writes++; persisted = [row]; if (options.uncertain) throw new Error('Response lost'); return row; },
    };
    throw new Error(name);
  } };
  vm.runInNewContext(componentCode, context);
  const props = { request: { id: 'request', serviceId: 'yacht', guests: 4, status: 'received' }, token: 'token', locale };
  const render = () => { cursor = 0; return context.exports.RequestUpsell(props); };
  const click = label => { const button = nodes(render()).find(node => node.type === 'button' && text(node) === label); assert.ok(button, label); assert.equal(button.props.disabled, false); button.props.onClick(); };
  return { render, click, props, counts: () => ({ metaCalls, writes }) };
}
for (const locale of ['es', 'en']) test(`actual component ${locale}: explicit decision, persisted reload and no duplicate click`, async () => {
  const h = harness(locale); h.render(); await flush();
  assert.deepEqual(h.counts(), { metaCalls: 0, writes: 0 });
  h.click(locale === 'es' ? 'Consultar complemento con Meta' : 'Ask Meta for a complement'); await flush();
  assert.match(text(h.render()), /DEMO/); assert.equal(h.counts().writes, 0);
  const label = locale === 'es' ? 'Aceptar complemento' : 'Accept complement';
  const button = nodes(h.render()).find(node => node.type === 'button' && text(node) === label);
  button.props.onClick(); button.props.onClick(); await flush();
  assert.equal(h.counts().writes, 1);
  h.click(locale === 'es' ? 'Recargar complementos' : 'Reload complements'); await flush();
  assert.equal(h.counts().metaCalls, 1);
  assert.match(text(h.render()), locale === 'es' ? /Complemento aceptado/ : /Complement accepted/);
});
test('uncertain acceptance blocks retry until GET reconciles persisted acceptance', async () => {
  const h = harness('en', { uncertain: true }); h.render(); await flush();
  h.click('Ask Meta for a complement'); await flush(); h.click('Accept complement'); await flush();
  assert.equal(nodes(h.render()).find(node => node.type === 'button' && text(node) === 'Accept complement').props.disabled, true);
  h.click('Reload complements'); await flush();
  assert.match(text(h.render()), /Complement accepted/); assert.equal(h.counts().writes, 1);
});
test('Meta failure does not fabricate a proposal or persist an addon', async () => {
  const h = harness('en', { metaFailure: true }); h.render(); await flush(); h.click('Ask Meta for a complement'); await flush();
  assert.equal(h.counts().writes, 0); assert.match(text(h.render()), /Could not look up/);
  assert.equal(nodes(h.render()).some(node => node.type === 'button' && text(node) === 'Accept complement'), false);
});
test('session changes clear proposals and accepted state before any new acceptance', async () => {
  const h = harness('en'); h.render(); await flush(); h.click('Ask Meta for a complement'); await flush();
  assert.ok(nodes(h.render()).some(node => node.type === 'button' && text(node) === 'Accept complement'));
  h.props.token = 'different-session'; h.render(); await flush();
  assert.equal(nodes(h.render()).some(node => node.type === 'button' && text(node) === 'Accept complement'), false);
  assert.equal(h.counts().writes, 0);
});
