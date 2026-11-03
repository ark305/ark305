import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const response = {
  snapshot: {
    who: 'individual', side: 'personal', enterprise: false, ladder: null,
    summary: { es: 'Resumen seguro', en: 'Safe summary' }, reason: { es: 'Motivo', en: 'Reason' },
    strengths: [], gaps: [], opportunities: [], actions: [{ label: { es: 'Inicio', en: 'Home' }, href: '/' }],
    course: { id: 'concierge', reason: { es: 'Motivo', en: 'Reason' } }, demand: [], supply: [],
  },
};

function compile(filename) {
  return ts.transpileModule(fs.readFileSync(new URL(filename, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}

function loadSnapshotLibrary() {
  const exports = {};
  vm.runInNewContext(compile('../src/lib/snapshot.ts'), { exports, fetch, Response, URL, Object, Array, Number, String, RegExp, AbortSignal, TextEncoder, JSON });
  return exports;
}

function routeHarness(options = {}) {
  const calls = [];
  const exports = {};
  class BackendApiError extends Error { constructor(status) { super('Backend unavailable'); this.status = status; } }
  const snapshotLibrary = loadSnapshotLibrary();
  const moduleAdapters = {
    '@/lib/backend-api': {
      BackendApiError,
      backendApi: async (...args) => {
        calls.push(args);
        if (options.failure) throw options.failure;
        return options.result ?? response;
      },
    },
    '@/lib/snapshot': snapshotLibrary,
  };
  vm.runInNewContext(compile('../src/app/api/snapshot/route.ts'), {
    exports, require: (name) => moduleAdapters[name] ?? require(name),
    Request, Response, URL, AbortSignal, TextEncoder, JSON, Object, Array, Number, String, RegExp,
    process: { env: {} },
  });
  return { route: exports, calls };
}

function request(body, options = {}) {
  return new Request('http://localhost/api/snapshot', {
    method: 'POST',
    headers: { ...(options.headers ?? {}), ...(body === undefined ? {} : { 'content-type': options.contentType ?? 'application/json' }) },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}

test('snapshot client posts answers without credentials and validates the stateless DTO', async () => {
  const { requestSnapshot } = loadSnapshotLibrary();
  const calls = [];
  const answers = { who: 'individual', interests: ['water'] };
  const result = await requestSnapshot(answers, undefined, async (url, init) => {
    calls.push({ url, init });
    return Response.json(response);
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/snapshot');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.equal(calls[0].init.credentials, 'omit');
  assert.deepEqual(JSON.parse(calls[0].init.body), { answers });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), response.snapshot);
});

test('snapshot client rejects unsafe links and malformed backend responses', async () => {
  const { requestSnapshot } = loadSnapshotLibrary();
  for (const payload of [
    { snapshot: { ...response.snapshot, actions: [{ label: { es: 'x', en: 'x' }, href: 'javascript:alert(1)' }] } },
    { snapshot: { ...response.snapshot, actions: [{ label: { es: 'x', en: 'x' }, href: '//outside.test' }] } },
    { unrelated: true },
  ]) {
    await assert.rejects(requestSnapshot({ who: 'individual' }, undefined, async () => Response.json(payload)), /Snapshot unavailable/);
  }
});

test('snapshot BFF forwards only parsed answers and returns no-store data', async () => {
  const { route, calls } = routeHarness();
  const answers = { who: 'enterprise' };
  const result = await route.POST(request({ answers }));
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.deepEqual(JSON.parse(await result.text()), response);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'profiles/snapshot');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0][1])), { method: 'POST', body: { answers } });
});

test('snapshot BFF rejects invalid content types, bodies, and oversized requests before calling Nest', async () => {
  const { route, calls } = routeHarness();
  for (const req of [
    request({ answers: { who: 'individual' } }, { contentType: 'text/plain' }),
    request({ answers: null }),
    request({ answers: { who: 'individual' }, userId: 'untrusted' }),
    request({ answers: { unknown: 'x'.repeat(17_000) } }),
  ]) assert.equal((await route.POST(req)).status, 400);
  assert.equal(calls.length, 0);
});

test('snapshot BFF maps backend failure and malformed response to safe statuses', async () => {
  const invalidDto = routeHarness({ result: { snapshot: { ...response.snapshot, actions: [{ label: { es: 'x', en: 'x' }, href: 'javascript:alert(1)' }] } } });
  assert.equal((await invalidDto.route.POST(request({ answers: { who: 'individual' } }))).status, 502);
  const unavailable = routeHarness({ failure: new Error('private backend detail') });
  const result = await unavailable.route.POST(request({ answers: { who: 'individual' } }));
  assert.equal(result.status, 503);
  assert.doesNotMatch(await result.text(), /private backend detail/);
});
