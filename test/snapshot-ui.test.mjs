import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const es = loadDictionary('../src/lib/dictionaries/es.ts', 'es');
const en = loadDictionary('../src/lib/dictionaries/en.ts', 'en');

function loadDictionary(path, name) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports });
  return exports[name];
}

function loadDiagnosis() {
  const source = fs.readFileSync(new URL('../src/lib/diagnosis.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports });
  return exports;
}

function deferred() {
  let resolve; let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function loadSnapshotView(options = {}) {
  const source = fs.readFileSync(new URL('../src/components/snapshot-view.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const state = [];
  const effects = [];
  let cursor = 0;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useEffect(effect, deps = []) {
      const index = cursor++;
      const previous = effects[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        previous?.cleanup?.();
        effects[index] = { deps: [...deps], cleanup: effect() };
      }
    },
  };
  const moduleAdapters = {
    react: hooks,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props: props ?? {} }), jsxs: (type, props) => ({ type, props: props ?? {} }), Fragment: 'fragment' },
    'next/link': { default: 'link' },
    '@/lib/community': { courses: [{ id: 'concierge', color: '#000', name: { es: 'Concierge', en: 'Concierge' } }] },
    '@/lib/diagnosis': loadDiagnosis(),
    '@/lib/diagnosis-store': { useLocalDiagnosis: () => options.localAnswers ?? null },
    '@/lib/snapshot': { requestSnapshot: options.requestSnapshot ?? (async () => { throw new Error('unexpected snapshot request'); }) },
    '@/lib/dict': { dict: (locale) => locale === 'es' ? es : en },
    '@/lib/talent': { positions: [] },
    './icons': { IconArrow: 'arrow', IconCap: 'cap', IconCheck: 'check', IconSparkle: 'sparkle' },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: (name) => moduleAdapters[name] ?? require(name), URL, encodeURIComponent, AbortController });
  return {
    component: exports.SnapshotView,
    render(props) { cursor = 0; return exports.SnapshotView(props); },
    cleanup() { for (const effect of effects) effect?.cleanup?.(); },
  };
}

function find(tree, predicate) {
  if (tree == null || typeof tree === 'boolean') return null;
  if (Array.isArray(tree)) { for (const child of tree) { const match = find(child, predicate); if (match) return match; } return null; }
  if (typeof tree !== 'object') return null;
  if (predicate(tree)) return tree;
  return find(tree.props?.children, predicate);
}

function text(tree) {
  if (tree == null || typeof tree === 'boolean') return '';
  if (Array.isArray(tree)) return tree.map(text).join(' ');
  if (typeof tree !== 'object') return String(tree);
  return text(tree.props?.children);
}

function snapshot(summary) {
  const localized = { es: summary, en: summary };
  return {
    who: 'individual', side: 'personal', enterprise: false, ladder: null,
    summary: localized, reason: localized, strengths: [], gaps: [], opportunities: [],
    actions: [{ label: localized, href: '/' }], course: { id: 'concierge', reason: localized }, demand: [], supply: [],
  };
}

const accountAnswers = { who: 'company', industry: 'food', team: 'large' };
const localAnswers = { who: 'individual', interests: ['water'] };
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('Snapshot prefers account answers, ignores stale responses, and does not refetch unchanged answers', async () => {
  const pending = [];
  const harness = loadSnapshotView({
    localAnswers,
    requestSnapshot: (answers) => { const request = deferred(); pending.push({ answers, ...request }); return request.promise; },
  });
  const accountProps = { locale: 'en', fromAccount: accountAnswers };
  harness.render(accountProps);
  assert.deepEqual(JSON.parse(JSON.stringify(pending[0].answers)), accountAnswers);
  assert.match(text(harness.render(accountProps)), new RegExp(en.snap.loading));

  const nextAnswers = { who: 'earner', skills: ['photo'] };
  const nextProps = { ...accountProps, fromAccount: nextAnswers };
  harness.render(nextProps);
  assert.deepEqual(JSON.parse(JSON.stringify(pending[1].answers)), nextAnswers);
  pending[1].resolve(snapshot('Newest backend result'));
  await tick();
  assert.match(text(harness.render(nextProps)), /Newest backend result/);
  pending[0].resolve(snapshot('Stale backend result'));
  await tick();
  assert.match(text(harness.render(nextProps)), /Newest backend result/);
  harness.render(nextProps);
  assert.equal(pending.length, 2, 'a render with the same answers must not issue another request');
  harness.cleanup();
});

test('Snapshot uses local answers when no account diagnosis exists and shows localized retry after failure', async () => {
  const pending = [];
  const harness = loadSnapshotView({
    localAnswers,
    requestSnapshot: (answers) => { const request = deferred(); pending.push({ answers, ...request }); return request.promise; },
  });
  const props = { locale: 'es', fromAccount: null };
  harness.render(props);
  assert.deepEqual(JSON.parse(JSON.stringify(pending[0].answers)), localAnswers);
  pending[0].reject(new Error('network unavailable'));
  await tick();
  const failed = harness.render(props);
  assert.match(text(failed), new RegExp(es.snap.unavailable));
  const retry = find(failed, (node) => node.type === 'button' && node.props.children === es.snap.retry);
  assert.ok(retry, 'the Spanish retry control must come from the production dictionary');
  retry.props.onClick();
  const loading = harness.render(props);
  assert.equal(pending.length, 2);
  assert.match(text(loading), new RegExp(es.snap.loading));
  pending[1].resolve(snapshot('Respuesta del backend'));
  await tick();
  assert.match(text(harness.render(props)), /Respuesta del backend/);
  harness.cleanup();
});

test('Snapshot with no saved answers shows the existing empty state without contacting the API', () => {
  const harness = loadSnapshotView({ requestSnapshot: async () => { throw new Error('must not call'); } });
  const tree = harness.render({ locale: 'en', fromAccount: null });
  assert.match(text(tree), /Tell ARK/);
  assert.equal(find(tree, (node) => node.type === 'button'), null);
  harness.cleanup();
});
