import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../src/components/day-requests.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

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

function harness(options = {}) {
  const listeners = [];
  const submitted = [];
  const session = (userId = 'user-1', accessToken = 'access-1') => ({ user: { id: userId }, access_token: accessToken });
  const library = {
    createClient: () => ({ auth: { onAuthStateChange(callback) {
      listeners.push(callback);
      return { data: { subscription: { unsubscribe() {} } } };
    } } }),
  };
  const serviceRequests = {
    ServiceRequestError: class ServiceRequestError extends Error { constructor(kind) { super(kind); this.kind = kind; } },
    isCalendarDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value; },
    createServiceRequest: async (input, token, _fetcher, signal) => {
      submitted.push({ input, token, signal });
      return options.create ? options.create(input, token, signal, submitted.length) : dto(input, submitted.length);
    },
    listServiceRequests: async (token) => options.list ? options.list(token) : [],
  };
  const reactHooks = hooks();
  const context = {
    exports: {}, AbortSignal, AbortController, Date, Promise, console, fetch,
    require: (name) => {
      if (name === 'react') return reactHooks.react;
      if (name === 'react/jsx-runtime') return { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
      if (name === '@/lib/catalog') return { getItem: (id) => ({ id, name: { es: id, en: id } }) };
      if (name === '@/lib/supabase/client') return library;
      if (name === '@/lib/supabase/config') return { supabaseReady: options.supabaseReady ?? true };
      if (name === '@/lib/service-requests') return serviceRequests;
      if (name === '@/lib/dict') return { dict: () => ({ day: labels }) };
      if (name === '@/lib/locale') return {};
      return require(name);
    },
  };
  vm.runInNewContext(compiled, context);
  return { Component: context.exports.DayRequests, render: (component, props) => reactHooks.render(component, props), unmount: () => reactHooks.unmount(), listeners, submitted, session, ServiceRequestError: serviceRequests.ServiceRequestError };
}

const labels = {
  aiLogin: 'Sign in', requestTitle: 'Requests', requestDisclaimer: 'Interest only', requestDate: 'Date',
  requestDatePrompt: 'Pending confirmation', invalidDate: 'Invalid date', requestUnavailable: 'Unavailable',
  checkingSession: 'Checking', requestSignIn: 'Sign in', sendRequests: 'Send', sendRemaining: 'Send remaining',
  sendingRequests: 'Sending', received: 'Received', uncertainResult: 'Uncertain; refresh history',
  requestRejected: 'Rejected', notSubmitted: 'Pending', historyError: 'History error', requestHistory: 'History',
  loadingHistory: 'Loading', refreshHistory: 'Refresh history', emptyHistory: 'No history',
};
const dto = (input, count) => ({
  id: `a1ed2f79-e725-4916-8d61-03689bb78ac${count % 10}`,
  ...input, preferences: input.preferences ?? '', status: 'received', createdAt: '2026-10-31T12:00:00.000Z',
});
const entries = [
  { uid: 'one', id: 'yacht', time: '14:00', qty: 4, guests: 4 },
  { uid: 'two', id: 'chef', time: '19:00', qty: 1, guests: 4 },
];
const session = (userId = 'user-1', accessToken = 'access-1') => ({ user: { id: userId }, access_token: accessToken });
const flush = async () => { await new Promise((resolve) => setImmediate(resolve)); };
const textButton = (tree, label) => findNodes(tree, (node) => node.type === 'button' && textOf(node).includes(label))[0];

test('one selected calendar date is sent for every cart item and duplicate clicks are blocked', async () => {
  const completions = [];
  const app = harness({ create: () => new Promise((resolve) => { completions.push(resolve); }) });
  function Component(props) { return app.Component(props); }
  let tree = app.render(Component, { locale: 'en', entries });
  app.listeners[0]('INITIAL_SESSION', session());
  await flush();
  tree = app.render(Component, { locale: 'en', entries });
  let date = findNodes(tree, (node) => node.type === 'input' && node.props.id === 'service-request-date')[0];
  date.props.onChange({ target: { value: '2027-02-29' } });
  tree = app.render(Component, { locale: 'en', entries });
  await textButton(tree, labels.sendRequests).props.onClick();
  assert.equal(app.submitted.length, 0);

  date = findNodes(tree, (node) => node.type === 'input' && node.props.id === 'service-request-date')[0];
  date.props.onChange({ target: { value: '2027-03-01' } });
  tree = app.render(Component, { locale: 'en', entries });
  const send = textButton(tree, labels.sendRequests);
  const first = send.props.onClick();
  const second = send.props.onClick();
  await flush();
  assert.equal(app.submitted.length, 1);
  assert.equal(app.submitted[0].input.requestedDate, '2027-03-01');
  assert.equal(app.submitted[0].input.preferences, 'Requested time: 14:00; quantity: 4');
  assert.equal(app.submitted[0].token, 'access-1');
  completions[0](dto(app.submitted[0].input, 1));
  await flush();
  assert.equal(app.submitted.length, 2);
  completions[1](dto(app.submitted[1].input, 2));
  await Promise.all([first, second]);
  assert.equal(app.submitted.length, 2);
  assert.equal(app.submitted[1].input.requestedDate, '2027-03-01');
  assert.equal(app.submitted[1].input.preferences, 'Requested time: 19:00; quantity: 1');
  app.unmount();
});

test('successful items stay received while an uncertain item is never automatically retried', async () => {
  let stored;
  const cart = [...entries, { uid: 'three', id: 'suv', time: '09:00', qty: 2, guests: 4 }];
  const app = harness({
    create: async (input, _token, _signal, count) => {
      if (count === 1) { stored = dto(input, 1); return stored; }
      throw new app.ServiceRequestError('uncertain');
    },
    list: async () => stored ? [stored] : [],
  });
  function Component(props) { return app.Component(props); }
  let tree = app.render(Component, { locale: 'en', entries: cart });
  app.listeners[0]('INITIAL_SESSION', session());
  await flush();
  tree = app.render(Component, { locale: 'en', entries: cart });
  await textButton(tree, labels.sendRequests).props.onClick();
  assert.equal(app.submitted.length, 2);
  tree = app.render(Component, { locale: 'en', entries: cart });
  assert.match(textOf(tree), /Received/);
  assert.match(textOf(tree), /Uncertain/);
  const disabledButton = textButton(tree, labels.sendRemaining);
  assert.equal(disabledButton.props.disabled, false);

  const refresh = textButton(tree, labels.refreshHistory);
  await refresh.props.onClick?.();
  await flush();
  tree = app.render(Component, { locale: 'en', entries: cart });
  await textButton(tree, labels.sendRemaining).props.onClick();
  assert.equal(app.submitted.length, 3);
  assert.equal(app.submitted[1].input.serviceId, 'chef');
  assert.equal(app.submitted[2].input.serviceId, 'suv');
  app.unmount();
});

test('an account switch clears private history and stops queued sends under the previous token', async () => {
  let complete;
  const app = harness({
    list: async (token) => token === 'access-1'
      ? [dto({ serviceId: 'old', requestedDate: '2027-01-01', guests: 1 }, 3)]
      : [dto({ serviceId: 'private-b', requestedDate: '2027-01-01', guests: 1 }, 4)],
    create: () => new Promise((resolve) => { complete = resolve; }),
  });
  function Component(props) { return app.Component(props); }
  let tree = app.render(Component, { locale: 'en', entries });
  app.listeners[0]('INITIAL_SESSION', session());
  await flush();
  tree = app.render(Component, { locale: 'en', entries });
  const inFlight = textButton(tree, labels.sendRequests).props.onClick();
  await flush();
  assert.equal(app.submitted.length, 1);
  app.listeners[0]('SIGNED_IN', session('user-2', 'access-2'));
  await flush();
  complete(dto(app.submitted[0].input, 1));
  await inFlight;
  tree = app.render(Component, { locale: 'en', entries });
  assert.equal(app.submitted.length, 1);
  assert.equal(app.submitted[0].token, 'access-1');
  assert.match(textOf(tree), /private-b/);
  assert.doesNotMatch(textOf(tree), /old/);
  app.listeners[0]('SIGNED_OUT', null);
  tree = app.render(Component, { locale: 'en', entries });
  assert.match(textOf(tree), /Sign in/);
  assert.doesNotMatch(textOf(tree), /private-b/);
  app.unmount();
});

test('a refreshed access token stops the old queue and keeps its in-flight result uncertain', async () => {
  let complete;
  const app = harness({ create: () => new Promise((resolve) => { complete = resolve; }) });
  function Component(props) { return app.Component(props); }
  const cart = entries.slice(0, 1);
  let tree = app.render(Component, { locale: 'en', entries: cart });
  app.listeners[0]('INITIAL_SESSION', session('user-1', 'access-1'));
  await flush();
  tree = app.render(Component, { locale: 'en', entries: cart });
  const inFlight = textButton(tree, labels.sendRequests).props.onClick();
  await flush();
  assert.equal(app.submitted.length, 1);

  app.listeners[0]('TOKEN_REFRESHED', session('user-1', 'access-2'));
  complete(dto(app.submitted[0].input, 1));
  await inFlight;
  tree = app.render(Component, { locale: 'en', entries: cart });
  assert.match(textOf(tree), /Uncertain/);
  assert.equal(textButton(tree, labels.sendRequests).props.disabled, true);
  await textButton(tree, labels.refreshHistory).props.onClick();
  assert.equal(app.submitted.length, 1);
  app.unmount();
});

test('a partial rejection keeps the original common date for every remaining cart request', async () => {
  const app = harness({
    create: async (input, _token, _signal, count) => {
      if (count === 2) throw new app.ServiceRequestError('rejected');
      return dto(input, count);
    },
  });
  const props = { locale: 'en', entries };
  let tree = app.render(app.Component, props);
  app.listeners[0]('INITIAL_SESSION', session());
  await flush();
  tree = app.render(app.Component, props);
  findNodes(tree, (node) => node.type === 'input' && node.props.type === 'date')[0].props.onChange({ target: { value: '2027-03-01' } });
  tree = app.render(app.Component, props);
  await textButton(tree, labels.sendRequests).props.onClick();

  tree = app.render(app.Component, props);
  const dateInput = findNodes(tree, (node) => node.type === 'input' && node.props.type === 'date')[0];
  assert.equal(dateInput.props.disabled, true, 'the date stays frozen for this submitted cart set');
  dateInput.props.onChange({ target: { value: '2027-03-02' } });
  tree = app.render(app.Component, props);
  await textButton(tree, labels.sendRemaining).props.onClick();

  assert.equal(app.submitted.length, 3);
  assert.equal(app.submitted[0].input.requestedDate, '2027-03-01');
  assert.equal(app.submitted[2].input.requestedDate, '2027-03-01', 'programmatic date changes cannot split one cart set');
  app.unmount();
});

test('a history read that began before a successful create cannot erase the received item', async () => {
  let resolveHistory;
  const oldHistory = new Promise((resolve) => { resolveHistory = resolve; });
  const app = harness({ list: () => oldHistory });
  const props = { locale: 'en', entries: entries.slice(0, 1) };
  let tree = app.render(app.Component, props);
  app.listeners[0]('INITIAL_SESSION', session());
  await flush();
  tree = app.render(app.Component, props);

  await textButton(tree, labels.sendRequests).props.onClick();
  tree = app.render(app.Component, props);
  assert.match(textOf(tree), /Received/);
  resolveHistory([]);
  await flush();
  tree = app.render(app.Component, props);
  assert.doesNotMatch(textOf(tree), /No history/, 'a stale empty GET cannot remove a confirmed POST');
  assert.match(textOf(tree), /Received/);
  app.unmount();
});
