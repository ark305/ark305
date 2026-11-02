import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

const labels = {
  diag: {
    title: 'ARK Diagnosis', intro: 'Tell ARK what you need.', typeHere: 'Write a message to ARK', voice: 'Speak',
    listening: 'Listening', thinking: 'ARK is preparing a response', aiUnavailable: 'AI is unavailable',
    aiLimit: 'Request limit reached', aiSignIn: 'Sign in to talk with Meta', aiError: 'Meta could not respond',
    sessionChanged: 'Your session changed', signInAgain: 'Sign in again', proposalTitle: 'Your proposal',
    proposalDisclaimer: 'Initial guidance only.', saveProposal: 'Save and view my Snapshot', savingProposal: 'Saving',
    saveError: 'Could not save', send: 'Send',
  },
};

function loadDiagnosisChat(adapters = {}) {
  const source = fs.readFileSync(new URL('../src/components/diagnosis-chat.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  let state = [];
  let refs = [];
  let effects = [];
  let cursor = 0;
  const hooks = {
    useCallback(callback) { return callback; },
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in refs)) refs[index] = { current: initial };
      return refs[index];
    },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in effects)) effects[index] = effect();
    },
    useSyncExternalStore(_subscribe, _getSnapshot, getServerSnapshot) { cursor++; return getServerSnapshot(); },
  };
  const moduleAdapters = {
    react: hooks,
    'react/jsx-runtime': {
      jsx: (type, props) => ({ type, props: props ?? {} }),
      jsxs: (type, props) => ({ type, props: props ?? {} }),
      Fragment: 'fragment',
    },
    'next/navigation': { useRouter: () => adapters.router ?? { replace() {}, refresh() {} } },
    '@/lib/actions': { saveDiagnosis: adapters.saveDiagnosis ?? (async () => true) },
    '@/lib/diagnosis-ai': { requestDiagnosisTurn: adapters.requestDiagnosisTurn ?? (async () => { throw new Error('unexpected request'); }) },
    '@/lib/diagnosis': adapters.diagnosis ?? { sanitize: (value) => value ?? {} },
    '@/lib/diagnosis-store': { writeDiagnosis: adapters.writeDiagnosis ?? (() => {}) },
    '@/lib/dict': { dict: () => labels },
    '@/lib/supabase/client': { createClient: () => ({ auth: adapters.auth ?? {} }) },
    '@/lib/supabase/config': { supabaseReady: adapters.ready ?? true },
    './icons': {
      IconArrow: 'icon-arrow', IconMic: 'icon-mic', IconSparkle: 'icon-sparkle',
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => moduleAdapters[name] ?? require(name),
    window: {},
  });
  return {
    Component: exports.DiagnosisChat,
    render(Component, props) { cursor = 0; return Component(props); },
    cleanup() { for (const effect of effects) effect?.(); },
  };
}

function find(tree, predicate) {
  if (tree == null || typeof tree === 'boolean') return null;
  if (Array.isArray(tree)) {
    for (const child of tree) { const result = find(child, predicate); if (result) return result; }
    return null;
  }
  if (typeof tree !== 'object') return null;
  if (predicate(tree)) return tree;
  return find(tree.props?.children, predicate);
}

function setMessage(tree, value) {
  const field = find(tree, (node) => node.type === 'textarea');
  assert.ok(field);
  field.props.onChange({ target: { value } });
}

function sessionAuth(userId = 'user-A') {
  const listeners = [];
  return {
    listeners,
    getSession: async () => ({ data: { session: { user: { id: userId }, access_token: `token-${userId}` } }, error: null }),
    onAuthStateChange: (listener) => { listeners.push(listener); return { data: { subscription: { unsubscribe() {} } } }; },
  };
}

const completedAnswers = { who: 'company', industry: 'food', team: 'small', revenue: '5-20', breaking: 'demand', goal: 'grow', expFor: ['none'] };

test('Meta conversation sends the verified session, shows provenance and waits for explicit proposal confirmation', async () => {
  const auth = sessionAuth();
  const requests = [];
  const saved = [];
  const localWrites = [];
  const navigation = [];
  const harness = loadDiagnosisChat({
    auth,
    requestDiagnosisTurn: async (input, token) => {
      requests.push({ input, token });
      return { reply: 'A tailored proposal.', answers: completedAnswers, complete: true,
        provenance: { provider: 'Meta', model: 'muse-spark-1.3', responseId: 'msg_proposal' } };
    },
    saveDiagnosis: async (...args) => { saved.push(args); return true; },
    writeDiagnosis: (value) => localWrites.push(value),
    router: { replace: (path) => navigation.push(path), refresh: () => navigation.push('refresh') },
  });
  const props = { locale: 'en', userId: 'user-A', initialAnswers: { who: 'company' } };
  let tree = harness.render(harness.Component, props);
  setMessage(tree, 'I run a restaurant and want more bookings.');
  tree = harness.render(harness.Component, props);
  await find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  tree = harness.render(harness.Component, props);

  assert.equal(requests.length, 1);
  assert.equal(requests[0].token, 'token-user-A');
  assert.deepEqual(JSON.parse(JSON.stringify(requests[0].input.answers)), { who: 'company' });
  assert.equal(requests[0].input.message, 'I run a restaurant and want more bookings.');
  assert.match(JSON.stringify(tree), /A tailored proposal/);
  assert.match(JSON.stringify(tree), /muse-spark-1\.3/);
  assert.equal(saved.length, 0, 'proposal must not be persisted before confirmation');

  await find(tree, (node) => node.type === 'button' && node.props.children === 'Save and view my Snapshot').props.onClick();
  assert.deepEqual(JSON.parse(JSON.stringify(saved)), [[completedAnswers, 'user-A']]);
  assert.deepEqual(localWrites, [null], 'only clear previous local diagnosis; do not store AI text locally');
  assert.deepEqual(navigation, ['/snapshot', 'refresh']);
  harness.cleanup();
});

test('account switch during a pending Meta turn clears the session-bound conversation and ignores its response', async () => {
  const auth = sessionAuth();
  let resolveTurn;
  let started;
  const waiting = new Promise((resolve) => { started = resolve; });
  const harness = loadDiagnosisChat({
    auth,
    requestDiagnosisTurn: () => new Promise((resolve) => { resolveTurn = resolve; started(); }),
  });
  const props = { locale: 'en', userId: 'user-A', initialAnswers: { who: 'company' } };
  let tree = harness.render(harness.Component, props);
  setMessage(tree, 'I run a restaurant.');
  tree = harness.render(harness.Component, props);
  const sending = find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  await waiting;
  auth.listeners[0]('SIGNED_IN', { user: { id: 'user-B' } });
  resolveTurn({ reply: 'Private proposal for A.', answers: completedAnswers, complete: true,
    provenance: { provider: 'Meta', model: 'muse-spark-1.3', responseId: 'msg_private' } });
  await sending;
  tree = harness.render(harness.Component, props);
  assert.doesNotMatch(JSON.stringify(tree), /Private proposal for A/);
  assert.match(JSON.stringify(tree), /Your session changed/);
  assert.equal(find(tree, (node) => node.type === 'button' && node.props.children === 'Save and view my Snapshot'), null);
  harness.cleanup();
});

test('failed persistence does not navigate or claim that the proposal was saved', async () => {
  const navigation = [];
  const harness = loadDiagnosisChat({
    auth: sessionAuth(),
    requestDiagnosisTurn: async () => ({ reply: 'A tailored proposal.', answers: completedAnswers, complete: true,
      provenance: { provider: 'Meta', model: 'muse-spark-1.3', responseId: 'msg_proposal' } }),
    saveDiagnosis: async () => false,
    router: { replace: (path) => navigation.push(path), refresh() {} },
  });
  const props = { locale: 'en', userId: 'user-A', initialAnswers: {} };
  let tree = harness.render(harness.Component, props);
  setMessage(tree, 'I run a restaurant.');
  tree = harness.render(harness.Component, props);
  await find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  tree = harness.render(harness.Component, props);
  await find(tree, (node) => node.type === 'button' && node.props.children === 'Save and view my Snapshot').props.onClick();
  tree = harness.render(harness.Component, props);
  assert.deepEqual(navigation, []);
  assert.match(JSON.stringify(tree), /Could not save/);
  harness.cleanup();
});
