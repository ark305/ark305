import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function loadLibrary(spec) {
  const filename = spec.replace('@/', '../src/');
  const text = fs.readFileSync(new URL(`${filename}.ts`, import.meta.url), 'utf8');
  const exports = {};
  const localRequire = (name) => name.startsWith('.') ? loadLibrary(`@/lib/${name.slice(2)}`) : require(name);
  vm.runInNewContext(ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: localRequire, fetch, AbortSignal });
  return exports;
}

const source = fs.readFileSync(new URL('../src/app/api/ai/route.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function harness(options = {}) {
  const calls = [];
  const deadlines = [];
  const context = { exports: {}, require, process: { env: { ARK_API_URL: 'http://127.0.0.1:3001', ...options.env } }, AbortSignal: options.elapsed === undefined ? AbortSignal : { timeout(ms) { deadlines.push(ms); return new AbortController().signal; } }, URL, TextEncoder,
    Response,
    fetch: async (url, init = {}) => { calls.push({ url, ...init });
      if (options.reject || (options.elapsed !== undefined && options.elapsed >= deadlines.at(-1))) throw new Error('network');
      return options.response?.clone() ?? Response.json({ text: 'Hello', user: 'user-1' });
    } };
  vm.runInNewContext(code, context);
  const invoke = (body = { prompt: 'Hello' }, authenticated = true) => context.exports.POST(new Request('http://localhost/api/ai', {
    method: 'POST', headers: authenticated ? { authorization: 'Bearer user-token' } : {}, body: typeof body === 'string' ? body : JSON.stringify(body),
  }));
  return { invoke, calls };
}

test('day-plan client sends session and rejects failures without local fallback', async () => {
  const { requestDayPlan } = loadLibrary('@/lib/day-ai'); let calls = 0;
  const transport = async (url, init) => { calls++; assert.equal(url, '/api/ai'); assert.equal(init.headers.Authorization, 'Bearer session-token'); assert.equal(JSON.parse(init.body).task, 'day-plan');
    return Response.json({ plan: { items: [{ id: 'yacht', time: '14:00', qty: 4, guests: 4 }], guests: 4, understood: true }, provenance: { provider: 'Meta', model: 'muse-spark-1.3', responseId: 'msg_test' } }); };
  const input = { prompt: 'Yacht', guests: 4, locale: 'es' };
  await assert.rejects(requestDayPlan(input, undefined, transport), /auth/); assert.equal(calls, 0);
  assert.equal((await requestDayPlan(input, 'session-token', transport)).plan.items[0].id, 'yacht');
  for (const response of [Response.json({ error: 'auth' }, { status: 401 }), Response.json({ plan: {} }), Response.json({ error: 'quota_unavailable' }, { status: 503 })]) await assert.rejects(requestDayPlan(input, 'session-token', async () => response));
});

test('Next route forwards authenticated AI requests to Nest without provider credentials', async () => {
  const { invoke, calls } = harness();
  const requestBody = { task: 'day-plan', prompt: 'Yacht', guests: 4, locale: 'en' };
  const response = await invoke(requestBody); assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: 'Hello', user: 'user-1' });
  assert.equal(calls.length, 1); assert.equal(String(calls[0].url), 'http://127.0.0.1:3001/api/v1/ai');
  assert.equal(calls[0].headers.Authorization, 'Bearer user-token'); assert.equal(calls[0].headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].body), requestBody); assert.equal(calls[0].redirect, 'error'); assert.equal(calls[0].cache, 'no-store');
  assert.doesNotMatch(source, /META_API_KEY|api\.meta\.ai|muse-spark|bump_ai/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_SUPABASE|service_role|createClient/);
});

test('Next AI BFF rejects anonymous, malformed, unsafe-target and unavailable requests', async () => {
  const anonymous = harness(); assert.equal((await anonymous.invoke({ prompt: 'Hello' }, false)).status, 401); assert.equal(anonymous.calls.length, 0);
  const malformed = harness(); assert.equal((await malformed.invoke('{')).status, 400); assert.equal(malformed.calls.length, 0);
  const unsafe = harness({ env: { ARK_API_URL: 'http://example.com' } }); assert.equal((await unsafe.invoke()).status, 503); assert.equal(unsafe.calls.length, 0);
  const unavailable = harness({ reject: true }); const failed = await unavailable.invoke(); assert.equal(failed.status, 503); assert.deepEqual(await failed.json(), { error: 'upstream' });
});

test('Next AI BFF preserves safe Nest errors and hides malformed upstream responses', async () => {
  const failed = harness({ response: Response.json({ error: 'rate_limited' }, { status: 429 }) });
  assert.equal((await failed.invoke()).status, 429); assert.deepEqual(await (await failed.invoke()).json(), { error: 'rate_limited' });
  const malformed = harness({ response: new Response('secret', { status: 200 }) });
  assert.equal((await malformed.invoke()).status, 502); assert.deepEqual(await (await malformed.invoke()).json(), { error: 'upstream' });
  const diagnosis = harness({ response: Response.json({ error: 'invalid_diagnosis', reason: 'invalid_json', secret: 'private' }, { status: 502 }) });
  assert.deepEqual(await (await diagnosis.invoke({ task: 'diagnosis' })).json(), { error: 'invalid_diagnosis', reason: 'invalid_json' });
  const unknown = harness({ response: Response.json({ error: 'secret_exception', message: 'sensitive stack' }, { status: 500 }) });
  assert.equal((await unknown.invoke()).status, 503); assert.deepEqual(await (await unknown.invoke()).json(), { error: 'upstream' });
});

test('Next AI BFF retains the existing 60,000-character prompt allowance for Unicode', async () => {
  const { invoke, calls } = harness();
  const requestBody = { prompt: 'é'.repeat(60_000) };
  assert.equal((await invoke(requestBody)).status, 200);
  assert.deepEqual(JSON.parse(calls[0].body), requestBody);
});

test('day planner component uses the API helper instead of local generation', () => {
  const component = fs.readFileSync(new URL('../src/components/day-planner.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(component, /planDay\(/); assert.match(component, /requestDayPlan\(/);
});

test('AI proxy allows preprocessing plus the full provider deadline without retrying', async () => {
  for (const elapsed of [61_000, 74_000]) {
    const slow = harness({ elapsed, response: Response.json({ reply: 'Ready', answers: {}, complete: false }) });
    const response = await slow.invoke({ task: 'diagnosis', locale: 'es', message: 'Hello', answers: {} });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).reply, 'Ready');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(slow.calls.length, 1);
  }
  const expired = harness({ elapsed: 81_000 });
  const response = await expired.invoke();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'upstream' });
  assert.equal(expired.calls.length, 1);
});
