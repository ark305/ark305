import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve('src');

test('fixed navigation has a scroll clearance as well as content padding', () => {
  const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
  assert.match(css, /scroll-padding-bottom:\s*calc\(124px\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\)/);
});

test('error screens offer an explicit retry without exposing the original error', () => {
  let retries = 0;
  const load = loader();
  const ErrorPage = load('@/app/error').default;
  const GlobalError = load('@/app/global-error').default;
  const page = ErrorPage({ error: new Error('private upstream detail'), retry: () => retries++ });
  const panel = page.type(page.props);
  const find = (node, type) => {
    if (!node || typeof node !== 'object') return null;
    if (node.type === type) return node;
    return [node.props?.children].flat().map((child) => find(child, type)).find(Boolean);
  };
  assert.doesNotMatch(JSON.stringify(panel), /private upstream detail/);
  assert.match(JSON.stringify(panel), /No pudimos cargar/);
  find(panel, 'button').props.onClick();
  assert.equal(retries, 1);
  const global = GlobalError({ error: new Error('private upstream detail'), retry: () => retries++ });
  assert.equal(global.type, 'html');
  assert.equal(global.props.children.type, 'body');
});
function loader(overrides = {}, storage = new Map()) {
  const cache = new Map();
  const react = { useSyncExternalStore: (_subscribe, read) => read() };
  function load(spec, parent = root) {
    if (Object.hasOwn(overrides, spec)) return overrides[spec];
    if (spec === 'react') return react;
    if (spec === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (spec === 'next/link') return { default: 'link' };
    if (spec.endsWith('/icons')) return { IconArrow: 'arrow', IconSparkle: 'sparkle' };
    const base = spec.startsWith('@/') ? path.join(root, spec.slice(2)) : path.resolve(parent, spec);
    if (!spec.startsWith('@/') && !spec.startsWith('.')) return require(spec);
    const file = ['.ts', '.tsx'].map((ext) => base + ext).find(fs.existsSync);
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const source = fs.readFileSync(file, 'utf8');
    const code = ts.transpileModule(source, { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(code, {
      exports, require: (name) => load(name, path.dirname(file)),
      localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    });
    return exports;
  }
  return load;
}

test('Home opens the account Snapshot and never substitutes guest answers for a signed-in account', () => {
  const local = { who: 'individual', interests: ['water'] };
  const load = loader({ '@/lib/diagnosis-store': { useLocalDiagnosis: () => local } });
  const { NextStep } = load('@/components/next-step');
  const saved = NextStep({ locale: 'es', signedIn: true, fromAccount: { who: 'individual' } });
  assert.equal(saved.props.href, '/snapshot');
  assert.match(JSON.stringify(saved), /Ver mi Snapshot/);
  assert.equal(NextStep({ locale: 'en', signedIn: true, fromAccount: null }).props.href, '/diagnostico');
  assert.equal(NextStep({ locale: 'en', signedIn: false, fromAccount: null }).props.href, '/snapshot');
});

test('Planner remembers people across reloads without changing existing day entries', () => {
  const storage = new Map();
  let load = loader({}, storage);
  let store = load('@/lib/day-store');
  store.day.add([{ id: 'catamaran', time: '17:00', qty: 1, guests: 2 }]);
  const before = storage.get('ark305:day');
  assert.equal(store.usePlannerGuests(), 2, 'existing uniform cart supplies an initial value');
  store.plannerGuests.set(3);
  load = loader({}, storage);
  store = load('@/lib/day-store');
  assert.equal(store.usePlannerGuests(), 3, 'preference survives a fresh module/browser load');
  assert.equal(storage.get('ark305:day'), before, 'preference must not mutate the cart');
  for (const invalid of [0, 21, 1.5, '2']) store.plannerGuests.set(invalid);
  assert.equal(store.usePlannerGuests(), 3);
  store.day.remove(store.useDay()[0].uid);
  assert.equal(store.useDay().length, 0, 'existing removal behavior remains');
  store.day.clear();
  assert.equal(store.useDay().length, 0);
});

test('Planner defaults safely when no preference or a mixed cart exists', () => {
  const store = loader()('@/lib/day-store');
  assert.equal(store.usePlannerGuests(), 4);
  store.day.add([{ id: 'chef', time: '18:00', qty: 1, guests: 2 }, { id: 'restaurant', time: '20:00', qty: 1, guests: 6 }]);
  assert.equal(store.usePlannerGuests(), 4, 'do not infer one count from mixed entries');
});

test('Prototype copy does not promise slots and Snapshot does not invent saved-day status', () => {
  const load = loader();
  const { posts } = load('@/lib/mock-data');
  const { dict } = load('@/lib/dict');
  const { buildSnapshot } = load('@/lib/diagnosis');
  for (const locale of ['es', 'en']) {
    const post = posts.find((item) => item.id === 'p1').text[locale];
    assert.doesNotMatch(post, /Quedan dos|Two afternoon trips left/);
    assert.match(post, /prototipo|prototype/i);
    const gaps = buildSnapshot({ who: 'individual' }).gaps.map((item) => item[locale]).join(' ');
    assert.doesNotMatch(gaps, /no tienes días guardados|No saved days/i);
    assert.match(dict(locale).day.draftNote, /navegador|browser/i);
  }
});
