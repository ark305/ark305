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
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness(options = {}) {
  const calls = [];
  const logs = [];
  const env = {
    META_API_KEY: 'test-meta-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://auth.example.test',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-public-key',
    ...options.env,
  };
  const context = {
    exports: {}, require: (name) => name.startsWith('@/') ? loadLibrary(name) : require(name), process: { env }, AbortSignal,
    console: { error: (...args) => logs.push(args) },
    fetch: async (url, init = {}) => {
      calls.push({ url, ...init });
      if (url.endsWith('/auth/v1/user')) {
        return Response.json({ id: 'user-1' }, { status: options.authStatus ?? 200 });
      }
      if (url.endsWith('/rpc/bump_ai')) return Response.json(options.allowed ?? true, { status: options.quotaStatus ?? 200 });
      if (url.includes('/profiles?')) return Response.json([{ experience: 'business' }]);
      return Response.json(options.upstreamBody ?? {
        content: [{ type: 'thinking', thinking: 'hidden' }, { type: 'text', text: 'Hello' }],
      }, { status: options.upstreamStatus ?? 200 });
    },
  };
  vm.runInNewContext(code, context);
  const invoke = (body = { prompt: 'Hello' }, authenticated = true) => context.exports.POST(
    new Request('http://localhost/api/ai', {
      method: 'POST', headers: authenticated ? { authorization: 'Bearer user-token' } : {},
      body: JSON.stringify(body),
    }),
  );
  return { invoke, calls, logs };
}

const dayPlan = { guests: 4, understood: true, items: [{ id: 'yacht', time: '14:00', qty: 4 }] };
const metaPlan = (value) => ({ id: 'msg_test', model: 'muse-spark-1.3', stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(value) }] });

test('Mi dia uses the authenticated request helper instead of local generation', () => {
  const component = fs.readFileSync(new URL('../src/components/day-planner.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(component, /planDay\(/);
  assert.match(component, /requestDayPlan\(/);
});

test('day-plan client sends the session and rejects failures without a fallback', async () => {
  const { requestDayPlan } = loadLibrary('@/lib/day-ai');
  let calls = 0;
  const transport = async (url, init) => {
    calls++;
    assert.equal(url, '/api/ai');
    assert.equal(init.headers.Authorization, 'Bearer session-token');
    assert.equal(JSON.parse(init.body).task, 'day-plan');
    return Response.json({ plan: dayPlan, provenance: { provider: 'Meta', model: 'muse-spark-1.3', responseId: 'msg_test' } });
  };
  const input = { prompt: 'Yacht', guests: 4, locale: 'es' };
  await assert.rejects(requestDayPlan(input, undefined, transport), /auth/);
  assert.equal(calls, 0);
  assert.equal((await requestDayPlan(input, 'session-token', transport)).plan.items[0].id, 'yacht');
  for (const response of [Response.json({ error: 'auth' }, { status: 401 }), Response.json({ plan: dayPlan }),
    Response.json({ error: 'quota_unavailable' }, { status: 503 })]) {
    await assert.rejects(requestDayPlan(input, 'session-token', async () => response));
  }
});

test('day-plan returns a validated plan and provider response provenance', async () => {
  const { invoke, calls } = harness({ upstreamBody: metaPlan(dayPlan) });
  const response = await invoke({ task: 'day-plan', prompt: 'Yacht for four', guests: 4 });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data.plan.items, [{ ...dayPlan.items[0], guests: 4 }]);
  assert.deepEqual(data.provenance, { provider: 'Meta', model: 'muse-spark-1.3', responseId: 'msg_test' });
  const request = JSON.parse(calls.at(-1).body);
  assert.ok(request.output_config.format.schema.properties.items.items.properties.id.enum.includes('yacht'));
  assert.match(request.system, /catalog/);
});

test('day-plan rejects invalid model output and does not silently invent a plan', async () => {
  for (const value of [null, { ...dayPlan, guests: 0 }, { ...dayPlan, items: [{ id: 'invented', time: '14:00', qty: 1 }] },
    { ...dayPlan, items: [{ id: 'yacht', time: '25:00', qty: -1 }] }, { ...dayPlan, items: [dayPlan.items[0], dayPlan.items[0]] }]) {
    const { invoke } = harness({ upstreamBody: metaPlan(value) });
    const response = await invoke({ task: 'day-plan', prompt: 'Plan', guests: 4 });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'invalid_plan' });
  }
});

test('day-plan validates input and refuses to bypass an unavailable quota check', async () => {
  const invalid = harness();
  assert.equal((await invalid.invoke({ task: 'day-plan', prompt: 'Plan', guests: 21 })).status, 400);
  assert.equal(invalid.calls.length, 1);
  const unavailable = harness({ quotaStatus: 500 });
  assert.equal((await unavailable.invoke({ task: 'day-plan', prompt: 'Plan', guests: 4 })).status, 503);
  assert.equal(unavailable.calls.length, 2);
});

test('day-plan rejects incomplete responses and accepts an explicit no-match without fallback', async () => {
  for (const upstreamBody of [
    { ...metaPlan(dayPlan), content: [{ type: 'text', text: 'not JSON' }] },
    { ...metaPlan(dayPlan), stop_reason: 'max_tokens' },
    { ...metaPlan(dayPlan), model: '' },
    { ...metaPlan(dayPlan), id: undefined },
  ]) {
    const { invoke } = harness({ upstreamBody });
    assert.equal((await invoke({ task: 'day-plan', prompt: 'Plan', guests: 4 })).status, 502);
  }
  const { invoke } = harness({ upstreamBody: metaPlan({ items: [], guests: 4, understood: false }) });
  const response = await invoke({ task: 'day-plan', prompt: 'Something unrelated', guests: 4 });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).plan.items, []);
});

test('Meta receives the server key, configured model and compatible message payload', async () => {
  const { invoke, calls } = harness({ env: { META_MODEL: 'configured-model', META_BASE_URL: 'https://api.meta.ai/' } });
  const response = await invoke({ prompt: 'Hello', locale: 'en', json: true });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: 'Hello', user: 'user-1' });
  const upstream = calls.at(-1);
  assert.equal(upstream.url, 'https://api.meta.ai/v1/messages');
  assert.equal(upstream.headers.Authorization, 'Bearer test-meta-key');
  assert.equal(upstream.headers['x-api-key'], undefined);
  assert.equal(upstream.headers['anthropic-version'], undefined);
  const payload = JSON.parse(upstream.body);
  assert.equal(payload.model, 'configured-model');
  assert.equal(payload.max_tokens, 1500);
  assert.deepEqual(payload.messages, [{ role: 'user', content: 'Hello' }]);
  assert.match(payload.system, /business mode/);
  assert.match(payload.system, /Respond ONLY with valid JSON/);
  assert.equal(calls[0].headers.Authorization, 'Bearer user-token');
  assert.deepEqual(JSON.parse(calls[1].body), { lim: 60 });
});

test('default and quick requests use Meta, with an optional quick override', async () => {
  for (const [env, tier, model] of [
    [{}, undefined, 'muse-spark-1.3'],
    [{ META_MODEL: 'configured-model' }, 'quick', 'configured-model'],
    [{ META_MODEL_QUICK: 'quick-model' }, 'quick', 'quick-model'],
  ]) {
    const { invoke, calls } = harness({ env });
    assert.equal((await invoke({ prompt: 'Hola', tier })).status, 200);
    assert.equal(JSON.parse(calls.at(-1).body).model, model);
  }
});

test('missing configuration, rejected sessions, limits and empty prompts preserve errors', async () => {
  for (const [options, authenticated, body, status, error, callCount] of [
    [{ env: { META_API_KEY: '' } }, true, { prompt: 'Hi' }, 503, 'ai_not_configured', 0],
    [{}, false, { prompt: 'Hi' }, 401, 'auth', 0],
    [{ authStatus: 401 }, true, { prompt: 'Hi' }, 401, 'auth', 1],
    [{ allowed: false }, true, { prompt: 'Hi' }, 429, 'rate_limited', 2],
    [{}, true, {}, 400, 'prompt', 3],
  ]) {
    const { invoke, calls } = harness(options);
    const response = await invoke(body, authenticated);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { error });
    assert.equal(calls.length, callCount);
  }
});

test('Meta errors retain public mappings without logging upstream bodies', async () => {
  for (const [upstreamStatus, status, error] of [[429, 429, 'rate_limited'], [500, 502, 'upstream']]) {
    const { invoke, logs } = harness({ upstreamStatus, upstreamBody: { secret: 'do-not-log' } });
    const response = await invoke();
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { error });
    assert.equal(JSON.stringify(logs).includes('do-not-log'), false);
    if (upstreamStatus === 500) assert.equal(logs[0][0], 'meta');
  }
});
