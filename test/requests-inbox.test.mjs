import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, overrides = {}) {
  const exports = {};
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, fetch, Request, Response, URL, AbortSignal,
    process: { env: { ARK_API_URL: 'http://127.0.0.1:3001' } },
    require: name => load(`src/${name.slice(2)}.ts`, overrides), ...overrides });
  return exports;
}
const id = 'a2222222-2222-4222-8222-22222222222b';
const item = { id, serviceId: 'yacht', guests: 4, requestedDate: '2027-01-15', preferences: '', status: 'received', createdAt: '2026-11-01T12:00:00Z' };
const libFile = 'src/lib/requests-inbox.ts';
const routeFile = 'src/app/api/requests-inbox/[[...segments]]/route.ts';

test('inbox proxy delegates transition policy to Nest while rejecting malformed envelopes', async () => {
  let calls = 0;
  const route = load(routeFile, { fetch: async (_url, init) => {
    calls++;
    assert.deepEqual(JSON.parse(init.body), { expectedStatus: 'received', status: 'closed' });
    return Response.json({ error: 'Invalid transition' }, { status: 400 });
  } });
  const request = body => new Request('http://localhost/api/requests-inbox/admin/'+id, {
    method: 'PATCH', headers: { authorization: 'Bearer token', 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const context = { params: Promise.resolve({ segments: ['admin', id] }) };
  const rejected = await route.PATCH(request({ expectedStatus: 'received', status: 'closed' }), context);
  assert.equal(rejected.status, 400);
  assert.equal(calls, 1, 'Nest must decide whether a well-shaped transition is allowed');
  const malformed = await route.PATCH(request({ expectedStatus: 'received', status: {}, owner: id }), context);
  assert.equal(malformed.status, 400);
  assert.equal(calls, 1);
});

test('inbox selects client view only on explicit forbidden admin response', async () => {
  const { readInbox } = load(libFile);
  const paths = [];
  const result = await readInbox('token', async (url, init) => {
    paths.push(url); assert.equal(init.headers.Authorization, 'Bearer token');
    return paths.length === 1 ? Response.json({}, { status: 403 }) : Response.json({ items: [item] });
  });
  assert.equal(result.admin, false); assert.equal(result.items[0].id, id); assert.equal(paths.length, 2);
  for (const status of [401, 503]) {
    let calls = 0;
    await assert.rejects(readInbox('token', async () => { calls++; return Response.json({}, { status }); }), error => error.status === status);
    assert.equal(calls, 1);
  }
});

test('administrative transport preserves status and validates update representation without retry', async () => {
  const { readInbox, changeRequest, readHistory } = load(libFile);
  const listed = await readInbox('token', async () => Response.json({ items: [{ ...item, requesterId: id, private: 'hidden' }] }));
  assert.equal(listed.admin, true); assert.equal(listed.items[0].private, undefined);
  for (const status of [403, 409, 503]) {
    let calls = 0;
    await assert.rejects(changeRequest(item, 'in_progress', 'token', async (_url, init) => {
      calls++; assert.deepEqual(JSON.parse(init.body), { expectedStatus: 'received', status: 'in_progress' });
      return Response.json({}, { status });
    }), error => error.status === status);
    assert.equal(calls, 1);
  }
  await assert.rejects(changeRequest(item, 'in_progress', 'token', async () => Response.json(item)), error => error.status === 502);
  const events = await readHistory(id, false, 'token', async () => Response.json({ items: [{ id, fromStatus: 'received', toStatus: 'in_progress', createdAt: item.createdAt, actorId: 'hidden' }] }));
  assert.equal(events[0].actorId, undefined);
});

test('inbox proxy restricts paths, strips cookies, preserves failures and sanitizes output', async () => {
  let status = 200; let calls = 0;
  const route = load(routeFile, { fetch: async (url, init) => {
    calls++; assert.equal(new URL(url).origin, 'http://127.0.0.1:3001');
    assert.equal(init.headers.Authorization, 'Bearer token'); assert.equal(init.headers.Cookie, undefined);
    return Response.json(status === 200 ? { items: [{ ...item, requesterId: id, private: 'hidden' }] } : { secret: 'hidden' }, { status });
  } });
  const req = () => new Request('http://localhost/api/requests-inbox/admin', { headers: { authorization: 'Bearer token', cookie: 'secret' } });
  const ctx = segments => ({ params: Promise.resolve({ segments }) });
  const response = await route.GET(req(), ctx(['admin']));
  assert.equal(response.status, 200); assert.equal((await response.json()).items[0].private, undefined);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  for (status of [401, 403, 404, 409, 503]) {
    const failed = await route.GET(req(), ctx(['admin'])); assert.equal(failed.status, status);
    assert.doesNotMatch(await failed.text(), /hidden/);
  }
  const count = calls;
  assert.equal((await route.GET(req(), ctx(['https:', 'evil']))).status, 400);
  assert.equal((await route.GET(new Request('http://localhost'), ctx(['admin']))).status, 401);
  assert.equal(calls, count);
});
