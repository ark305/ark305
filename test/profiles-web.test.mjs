import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadBackendApi() {
  const source = fs.readFileSync(new URL('../src/lib/backend-api.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    process: { env: process.env },
    fetch: (...args) => globalThis.fetch(...args),
    URL,
    AbortSignal,
    require: (name) => { if (name === 'server-only') return {}; throw new Error(`Unexpected module ${name}`); },
  });
  return exports;
}

test('profile backend adapter forwards caller JWT and disables cache and redirects', async (t) => {
  const oldOrigin = process.env.ARK_API_URL;
  const oldFetch = globalThis.fetch;
  process.env.ARK_API_URL = 'http://127.0.0.1:3001';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return Response.json({ ok: true });
  };
  t.after(() => {
    if (oldOrigin === undefined) delete process.env.ARK_API_URL; else process.env.ARK_API_URL = oldOrigin;
    globalThis.fetch = oldFetch;
  });
  const { backendApi } = loadBackendApi();
  assert.deepEqual(await backendApi('profiles/me', { token: 'user-token', method: 'PATCH', body: { name: 'Ada' } }), { ok: true });
  assert.equal(calls[0].url, 'http://127.0.0.1:3001/api/v1/profiles/me');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer user-token');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.signal.aborted, false);
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: 'Ada' });
});

test('profile backend adapter rejects unsafe origins and hides upstream errors', async (t) => {
  const oldOrigin = process.env.ARK_API_URL;
  process.env.ARK_API_URL = 'http://api.example.com';
  t.after(() => { if (oldOrigin === undefined) delete process.env.ARK_API_URL; else process.env.ARK_API_URL = oldOrigin; });
  const { backendApi } = loadBackendApi();
  await assert.rejects(() => backendApi('profiles/me'), { message: 'Backend unavailable' });
});

test('profile backend adapter exposes only whitelisted validation codes', async (t) => {
  const oldOrigin = process.env.ARK_API_URL;
  const oldFetch = globalThis.fetch;
  process.env.ARK_API_URL = 'https://api.example.com';
  globalThis.fetch = async () => Response.json({ code: 'handle', message: 'sensitive upstream detail' }, { status: 400 });
  t.after(() => {
    if (oldOrigin === undefined) delete process.env.ARK_API_URL; else process.env.ARK_API_URL = oldOrigin;
    globalThis.fetch = oldFetch;
  });
  const { backendApi } = loadBackendApi();
  await assert.rejects(() => backendApi('profiles/me'), (error) => {
    assert.equal(error.message, 'Backend unavailable');
    assert.equal(error.code, 'handle');
    assert.doesNotMatch(error.message, /sensitive upstream detail/);
    return true;
  });
});

function loadActions(adapters = {}) {
  const source = fs.readFileSync(new URL('../src/lib/actions.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const modules = {
    'next/cache': { refresh() {}, revalidatePath() {} },
    'next/headers': { cookies: async () => ({ set() {} }) },
    'next/navigation': { redirect(path) { throw new Error(`redirect:${path}`); } },
    './mode': { parseSide: (value) => value === 'personal' || value === 'business' ? value : null },
    './supabase/config': { supabaseReady: true },
    './supabase/server': { createClient: async () => ({ auth: {
      getSession: async () => { adapters.events?.push('session'); return { data: { session: adapters.session ?? { access_token: 'session-token', user: { id: 'user-A' } } } }; },
      getUser: async () => { adapters.events?.push('user'); return { data: { user: adapters.user ?? { id: 'user-A' } } }; },
      signOut: async () => {},
    } }) },
    './backend-api': { backendApi: adapters.backendApi ?? (async () => ({})), BackendApiError: adapters.BackendApiError },
  };
  vm.runInNewContext(compiled, { exports, require: (name) => {
    if (modules[name]) return modules[name];
    throw new Error(`Unexpected module ${name}`);
  } });
  return exports;
}

function fields(values = {}) {
  return { get: (key) => values[key] ?? '', getAll: (key) => values[key] ?? [] };
}

test('profile actions preserve field-level form errors from sanitized backend codes', async () => {
  class BackendApiError extends Error { constructor(status, code) { super('Backend unavailable'); this.status = status; this.code = code; } }
  const cases = [
    ['createProfile', new BackendApiError(400, 'name'), 'name', fields()],
    ['updateProfile', new BackendApiError(400, 'handle'), 'handle', fields()],
    ['updateProfile', new BackendApiError(400, 'photo'), 'photo', fields()],
    ['saveService', new BackendApiError(400, 'title'), 'title', fields()],
    ['saveService', new BackendApiError(400, 'price'), 'price', fields()],
  ];
  for (const [action, error, expected] of cases) {
    const loaded = loadActions({ BackendApiError, backendApi: async () => { throw error; } });
    assert.deepEqual(JSON.parse(JSON.stringify(await loaded[action](undefined, fields()))), { error: expected });
  }
});

test('profile actions fail closed when verified user and session identities differ', async () => {
  let backendCalls = 0;
  const events = [];
  const actions = loadActions({ user: { id: 'user-B' }, events, backendApi: async () => { backendCalls++; return {}; } });
  assert.deepEqual(JSON.parse(JSON.stringify(await actions.updateProfile(undefined, fields()))), { error: 'auth' });
  assert.deepEqual(events, ['session', 'user']);
  assert.equal(backendCalls, 0);
});

test('handle check does not claim availability when the backend is unavailable', async () => {
  const actions = loadActions({ backendApi: async () => { throw new Error('offline'); } });
  assert.equal(await actions.checkHandle('ada'), 'invalid');
});

function loadViewer({ sessionId = 'user-A', responseId = 'user-A', rowId = responseId, serviceOwner = responseId } = {}) {
  const source = fs.readFileSync(new URL('../src/lib/profiles-db.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const calls = [];
  const modules = {
    'server-only': {}, react: { cache: (fn) => fn }, './mock-data': { getProfile: () => null },
    './supabase/config': { supabaseReady: true },
    './supabase/server': { createClient: async () => ({ auth: {
      getSession: async () => { calls.push('session'); return { data: { session: { access_token: 'token', user: { id: sessionId } } } }; },
      getUser: async () => { calls.push('user'); return { data: { user: { id: 'user-A', email: 'a@example.test' } } }; },
    } }) },
    './backend-api': { backendApi: async () => {
      calls.push('backend');
      return { userId: responseId, row: { id: rowId, handle: 'ada', name: 'Ada', kind: 'member', role: '', area: '', tagline: '', gallery: [], diagnosis: { private: true } },
        services: [{ id: 'service', owner: serviceOwner, kicker: '', title: 'Service', detail: '', price: 10, action: 'book' }] };
    } },
  };
  vm.runInNewContext(compiled, { exports, require: (name) => {
    if (modules[name]) return modules[name];
    throw new Error(`Unexpected module ${name}`);
  } });
  return { getViewer: exports.getViewer, calls };
}

test('viewer binds session identity before forwarding any token', async () => {
  const mismatch = loadViewer({ sessionId: 'user-B', responseId: 'user-B' });
  const viewer = await mismatch.getViewer();
  assert.equal(viewer.row, null);
  assert.equal(viewer.profile, null);
  assert.equal(viewer.services.length, 0);
  assert.deepEqual(mismatch.calls, ['session', 'user']);
  const valid = loadViewer();
  const own = await valid.getViewer();
  assert.equal(own.userId, 'user-A');
  assert.equal(own.row.id, 'user-A');
  assert.equal(own.email, 'a@example.test');
  assert.deepEqual(valid.calls, ['session', 'user', 'backend']);
});

test('viewer rejects foreign response identity, private profile or service ownership', async () => {
  for (const options of [{ responseId: 'user-B' }, { rowId: 'user-B' }, { serviceOwner: 'user-B' }]) {
    const viewer = await loadViewer(options).getViewer();
    assert.equal(viewer.row, null);
    assert.equal(viewer.profile, null);
    assert.equal(viewer.services.length, 0);
  }
});
