import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const filename = new URL('../src/lib/service-requests.ts', import.meta.url);
const source = fs.readFileSync(filename, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadLibrary() {
  const exports = {};
  vm.runInNewContext(compiled, { exports, require, fetch, AbortSignal });
  return exports;
}

const routeSource = fs.readFileSync(new URL('../src/app/api/service-requests/route.ts', import.meta.url), 'utf8');
const routeCompiled = ts.transpileModule(routeSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function routeHarness(options = {}) {
  const calls = [];
  const logs = [];
  const context = {
    exports: {}, process: { env: options.env ?? { ARK_API_URL: 'http://127.0.0.1:3001' } },
    AbortSignal, Date, URL, Response, JSON, Object, Number, String, RegExp,
    fetch: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      if (options.fetchError) throw options.fetchError;
      return options.upstream?.(url, init) ?? Response.json(options.body ?? { items: [] }, { status: options.status ?? 200 });
    },
    console: { error: (...args) => logs.push(args) },
  };
  vm.runInNewContext(routeCompiled, context);
  return { route: context.exports, calls, logs };
}

function proxyRequest(method, body, token = 'user-access-token') {
  return new Request('http://localhost/api/service-requests', {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      cookie: 'private-browser-cookie',
      ...(body ? { 'content-type': 'application/json', cookie: 'private-browser-cookie' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const request = {
  serviceId: 'yacht',
  requestedDate: '2027-01-15',
  guests: 4,
  preferences: '14:00; quantity: 4',
};
const dto = {
  id: 'a1ed2f79-e725-4916-8d61-03689bb78acb',
  serviceId: 'yacht',
  requestedDate: '2027-01-15',
  guests: 4,
  preferences: '14:00; quantity: 4',
  status: 'received',
  createdAt: '2026-10-31T12:00:00.000Z',
};

test('create helper forwards only the validated request with the current bearer', async () => {
  const { createServiceRequest } = loadLibrary();
  const calls = [];
  const result = await createServiceRequest(request, 'access-token', async (url, init) => {
    calls.push({ url, init });
    return Response.json({ ...dto, ownerId: 'must-not-escape' }, { status: 201 });
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/service-requests');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer access-token');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.deepEqual(JSON.parse(calls[0].init.body), request);
  assert.deepEqual({ ...result }, dto);
});

test('list helper validates a private history response and returns safe DTOs only', async () => {
  const { listServiceRequests } = loadLibrary();
  const result = await listServiceRequests('access-token', async (url, init) => {
    assert.equal(url, '/api/service-requests');
    assert.equal(init.method, 'GET');
    assert.equal(init.headers.Authorization, 'Bearer access-token');
    return Response.json({ items: [{ ...dto, ownerId: 'must-not-escape' }] });
  });
  assert.deepEqual(result.map((item) => ({ ...item })), [dto]);
});

test('client helper rejects invalid calendar dates and owner injection before transport', async () => {
  const { createServiceRequest } = loadLibrary();
  let calls = 0;
  const transport = async () => { calls++; return Response.json(dto, { status: 201 }); };
  await assert.rejects(createServiceRequest({ ...request, requestedDate: '2027-02-29' }, 'access-token', transport), /invalid/i);
  await assert.rejects(createServiceRequest({ ...request, ownerId: 'attacker' }, 'access-token', transport), /invalid/i);
  assert.equal(calls, 0);
});

test('client helper rejects unconfirmed or malformed service responses', async () => {
  const { createServiceRequest, listServiceRequests } = loadLibrary();
  await assert.rejects(createServiceRequest(request, 'access-token', async () => Response.json(dto, { status: 200 })), /outcome|response/i);
  await assert.rejects(createServiceRequest(request, 'access-token', async () => new Response('not-json', { status: 201 })), /response/i);
  await assert.rejects(listServiceRequests('access-token', async () => Response.json({ items: [{ ...dto, status: 'confirmed' }] })), /history|response/i);
});

test('GET proxy forwards the bearer to the fixed Nest route and sanitizes history DTOs', async () => {
  const { route, calls } = routeHarness({ body: { items: [{ ...dto, ownerId: 'must-not-escape' }] } });
  const response = await route.GET(proxyRequest('GET'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { items: [dto] });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://127.0.0.1:3001/api/v1/service-requests');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer user-access-token');
  assert.equal(calls[0].init.headers.Cookie, undefined);
  assert.equal(calls[0].init.redirect, 'error');
  assert.equal(calls[0].init.cache, 'no-store');
});

test('POST proxy accepts exactly one request and forwards only approved body fields', async () => {
  const { route, calls } = routeHarness({ body: { ...dto, ownerId: 'must-not-escape' }, status: 201 });
  const response = await route.POST(proxyRequest('POST', request));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), dto);
  assert.equal(calls[0].url, 'http://127.0.0.1:3001/api/v1/service-requests');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), request);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer user-access-token');
  assert.equal(calls[0].init.headers.Cookie, undefined);
});

test('proxy rejects missing auth, owner injection and invalid dates before contacting Nest', async () => {
  const { route, calls } = routeHarness();
  assert.equal((await route.GET(proxyRequest('GET', undefined, null))).status, 401);
  assert.equal((await route.POST(proxyRequest('POST', request, null))).status, 401);
  assert.equal((await route.POST(proxyRequest('POST', { ...request, ownerId: 'attacker' }))).status, 400);
  assert.equal((await route.POST(proxyRequest('POST', { ...request, requestedDate: '2027-02-29' }))).status, 400);
  assert.equal((await route.POST(proxyRequest('POST', { ...request, guests: 21 }))).status, 400);
  assert.equal(calls.length, 0);
});

test('proxy rejects unsafe origins and never forwards to a client-selected destination', async () => {
  for (const ARK_API_URL of [
    'http://example.test', 'http://127.0.0.1:3001/nested', 'https://user:pass@example.test',
    'https://example.test?query=1', 'https://example.test#fragment', 'ftp://example.test',
  ]) {
    const { route, calls } = routeHarness({ env: { ARK_API_URL } });
    const response = await route.GET(proxyRequest('GET'));
    assert.equal(response.status, 503, ARK_API_URL);
    assert.equal(calls.length, 0, ARK_API_URL);
  }
});

test('proxy sanitizes malformed upstream output, redirects and storage errors', async () => {
  const malformed = routeHarness({ upstream: async () => new Response('private upstream body', { status: 201 }) });
  const badResponse = await malformed.route.POST(proxyRequest('POST', request));
  assert.equal(badResponse.status, 502);
  assert.doesNotMatch(await badResponse.text(), /private upstream body/);

  const upstreamError = routeHarness({ upstream: async () => Response.json({ message: 'private database details' }, { status: 503 }) });
  const failure = await upstreamError.route.GET(proxyRequest('GET'));
  assert.equal(failure.status, 503);
  assert.doesNotMatch(await failure.text(), /private database details/);

  const networkError = routeHarness({ fetchError: new Error('private host and token') });
  const unavailable = await networkError.route.GET(proxyRequest('GET'));
  assert.equal(unavailable.status, 503);
  assert.doesNotMatch(await unavailable.text(), /private host|token/);
  assert.deepEqual(networkError.logs, []);
});
