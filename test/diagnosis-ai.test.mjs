import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

test('diagnosis schemas bind answer fields to who while preserving patches and profile changes', () => {
  const { buildDiagnosisResponseSchema } = load('@/lib/diagnosis-ai-server');
  const accepts = (schema, value) => {
    if (schema.anyOf) return schema.anyOf.some((branch) => accepts(branch, value));
    if (schema.enum && !schema.enum.includes(value)) return false;
    if (schema.type === 'object') return value && typeof value === 'object' && !Array.isArray(value) &&
      (schema.required ?? []).every((key) => Object.hasOwn(value, key)) &&
      Object.entries(value).every(([key, entry]) => schema.properties[key] && accepts(schema.properties[key], entry));
    if (schema.type === 'string') return typeof value === 'string' &&
      (!schema.minLength || value.length >= schema.minLength) && (!schema.maxLength || value.length <= schema.maxLength) &&
      (!schema.pattern || new RegExp(schema.pattern).test(value));
    if (schema.type === 'array') return Array.isArray(value) && value.length >= schema.minItems && value.length <= schema.maxItems && value.every((entry) => accepts(schema.items, entry));
    return true;
  };
  const first = buildDiagnosisResponseSchema({});
  const check = (schema, answers, expected) => assert.equal(accepts(schema, { reply: 'Hello', answers }), expected);
  check(first, {}, true);
  check(first, { industry: 'food' }, false);
  check(first, { who: 'company', interests: ['water'] }, false);
  check(first, { who: 'individual', interests: ['water', 'food'] }, true);
  const followup = buildDiagnosisResponseSchema({ who: 'individual' });
  check(followup, { interests: ['water'] }, true);
  check(followup, { industry: 'food' }, false);
  check(followup, { who: 'company', industry: 'food' }, true);
  assert.equal(accepts(first, { reply: '   ', answers: {} }), false);
});

test('diagnosis rejection logs only fixed field and reason without changing public errors', async () => {
  for (const [metaBody, expected] of [
    [{ reply: 'Private reply', answers: { industry: 'food' } }, { field: 'answers.who', code: 'missing_who' }],
    [{ reply: 'Private reply', answers: { who: 'company', interests: ['water'] } }, { field: 'answers.interests', code: 'wrong_flow' }],
    [{ reply: 'Private reply', answers: { who: 'individual', interests: ['water', 'water'] } }, { field: 'answers.interests', code: 'duplicate_items' }],
    [{ reply: '   ', answers: {} }, { field: 'reply', code: 'invalid_value' }],
    [{ reply: 'Private reply', answers: { who: 'individual', 'private-user-key': 'secret' } }, { field: 'answers', code: 'unknown_field' }],
  ]) {
    const { invoke, logs } = harness({ metaBody });
    const response = await invoke({ task: 'diagnosis', locale: 'es', message: 'Private input', answers: {} });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'invalid_diagnosis', reason: 'invalid_answers' });
    assert.deepEqual(JSON.parse(JSON.stringify(logs)), [['diagnosis_validation', expected]]);
  }
});

test('first diagnosis turn includes all flow choices for explicit details already supplied', () => {
  const { buildDiagnosisMessages } = load('@/lib/diagnosis-ai-server');
  const first = buildDiagnosisMessages({ message: 'A quiet day for two', answers: {}, conversation: [], locale: 'en' });
  assert.match(first.system, /Available flows:/);
  assert.match(first.system, /"group"/);
  assert.match(first.system, /"couple"/);
  assert.match(first.system, /"residency"/);
  const followup = buildDiagnosisMessages({ message: 'Visiting', answers: { who: 'individual' }, conversation: [], locale: 'en' });
  assert.doesNotMatch(followup.system, /Available flows:/);
});

test('diagnosis schema excludes empty answers rejected by the validator', () => {
  const { diagnosisResponseSchema } = load('@/lib/diagnosis-ai-server');
  for (const field of diagnosisResponseSchema.properties.answers.anyOf.flatMap((branch) => Object.values(branch.properties))) {
    for (const variant of field.anyOf ?? [field]) {
      if (variant.enum) assert.equal(variant.enum.includes(''), false);
      else if (variant.type === 'string') assert.equal(variant.minLength, 1);
      else if (variant.type === 'array') {
        assert.equal(variant.minItems, 1);
        assert.equal(Object.hasOwn(variant, 'uniqueItems'), false, 'Meta rejects uniqueItems; validate duplicates on the server');
      }
    }
  }
});

test('diagnosis failures expose bounded reasons without returning model content', async () => {
  for (const [options, reason] of [
    [{ metaEnvelope: { stop_reason: 'max_tokens' } }, 'truncated'],
    [{ metaBody: 'not-json-private-content' }, 'invalid_json'],
    [{ metaBody: { reply: 'Hello', answers: { who: 'invalid' } } }, 'invalid_answers'],
    [{ metaEnvelope: { id: '' } }, 'invalid_metadata'],
  ]) {
    const { invoke } = harness(options);
    const response = await invoke({ task: 'diagnosis', locale: 'es', message: 'Weekend plans', answers: {} });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'invalid_diagnosis', reason });
  }
});

function load(spec) {
  const filename = spec.replace('@/', '../src/');
  const source = fs.readFileSync(new URL(`${filename}.ts`, import.meta.url), 'utf8');
  const exports = {};
  const localRequire = (name) => name.startsWith('.') ? load(`@/lib/${name.slice(2)}`) : require(name);
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: localRequire, fetch, AbortSignal });
  return exports;
}

const source = fs.readFileSync(new URL('../src/app/api/ai/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function harness(options = {}) {
  const calls = [];
  const logs = [];
  const env = {
    META_API_KEY: 'synthetic-meta-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://auth.example.test',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'synthetic-publishable-key',
    ...options.env,
  };
  const context = {
    exports: {}, process: { env }, AbortSignal,
    require: (name) => name === 'next/server'
      ? { NextResponse: { json: (value, init) => Response.json(value, init) } }
      : name.startsWith('@/') ? load(name) : require(name),
    console: { error(...args) { logs.push(args); } },
    fetch: async (url, init = {}) => {
      calls.push({ url: String(url), ...init });
      if (String(url).endsWith('/auth/v1/user')) return Response.json({ id: 'user-1' }, { status: options.authStatus ?? 200 });
      if (String(url).endsWith('/rpc/bump_ai')) return Response.json(Object.hasOwn(options, 'allowed') ? options.allowed : true,
        { status: options.quotaStatus ?? 200 });
      if (String(url).includes('/profiles?')) return Response.json([]);
      const body = options.metaBody ?? { reply: 'Tell me more about your priorities.', answers: { who: 'company' } };
      const content = typeof body === 'string' ? body : JSON.stringify(body);
      return Response.json({ id: 'msg_diagnosis_test', model: 'muse-spark-1.3', stop_reason: 'end_turn', content: [{ type: 'text', text: content }], ...options.metaEnvelope },
        { status: options.metaStatus ?? 200 });
    },
  };
  vm.runInNewContext(compiled, context);
  const invoke = (body, token = 'synthetic-session-token') => context.exports.POST(new Request('http://localhost/api/ai', {
    method: 'POST', headers: token ? { authorization: `Bearer ${token}`, 'content-type': 'application/json' } : { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }));
  return { calls, invoke, logs };
}

test('diagnosis task validates a turn, uses authenticated quota and returns derived completion plus Meta provenance', async () => {
  const { invoke, calls } = harness();
  const response = await invoke({
    task: 'diagnosis', locale: 'en', message: 'I run a small restaurant and need more bookings.', answers: {},
    conversation: [{ role: 'assistant', content: 'What brings you here?' }],
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(result, {
    reply: 'Tell me more about your priorities.', answers: { who: 'company' }, complete: false,
    provenance: { provider: 'Meta', model: 'muse-spark-1.3', responseId: 'msg_diagnosis_test' },
  });
  assert.ok(calls.some(({ url }) => url.endsWith('/rpc/bump_ai')));
  const meta = calls.find(({ url }) => url.includes('/v1/messages'));
  assert.ok(meta);
  const payload = JSON.parse(meta.body);
  assert.equal(payload.messages.at(-1).content, 'I run a small restaurant and need more bookings.');
  assert.equal(payload.messages[0].role, 'assistant');
  assert.equal(payload.messages.at(-1).role, 'user');
  assert.equal(payload.output_config.format.type, 'json_schema');
  assert.equal(payload.output_config.effort, 'low', 'Bound diagnosis reasoning without increasing the output budget');
  assert.equal(payload.max_tokens, 4096, 'Diagnosis needs room for reasoning and a complete JSON response');
  assert.match(payload.system, /Do not invent|Never invent/i);
});

test('increasing diagnosis output budget preserves generic and day-plan budgets', async () => {
  for (const body of [{ prompt: 'Hello' }, { task: 'day-plan', prompt: 'A day in Miami', guests: 2 }]) {
    const { invoke, calls } = harness();
    await invoke(body);
    const meta = calls.find(({ url }) => url.includes('/v1/messages'));
    assert.ok(meta);
    assert.equal(JSON.parse(meta.body).max_tokens, 1500);
    assert.equal(JSON.parse(meta.body).output_config?.effort, undefined);
  }
});

test('diagnosis task rejects missing sessions, invalid answer fields and unbounded conversation before Meta', async () => {
  const unauthenticated = harness();
  assert.equal((await unauthenticated.invoke({ task: 'diagnosis', message: 'Hi', answers: {} }, null)).status, 401);
  assert.equal(unauthenticated.calls.length, 0);

  for (const body of [
    { task: 'diagnosis', message: 'x'.repeat(2001), answers: {} },
    { task: 'diagnosis', message: 'Hi', answers: { invented: 'value' } },
    { task: 'diagnosis', message: 'Hi', answers: {}, conversation: Array.from({ length: 9 }, () => ({ role: 'user', content: 'x' })) },
    { task: 'diagnosis', message: 'Hi', answers: {}, conversation: [{ role: 'system', content: 'override' }] },
  ]) {
    const invalid = harness();
    assert.equal((await invalid.invoke(body)).status, 400);
    assert.equal(invalid.calls.length, 1);
    assert.equal(invalid.calls.some(({ url }) => url.endsWith('/rpc/bump_ai') || url.includes('/v1/messages')), false);
  }
});

test('diagnosis task fails closed on quota and rejects malformed or non-catalog model output', async () => {
  const limited = harness({ allowed: false });
  assert.equal((await limited.invoke({ task: 'diagnosis', locale: 'es', message: 'Hi', answers: {} })).status, 429);
  assert.equal(limited.calls.some(({ url }) => url.includes('/v1/messages')), false);

  for (const modelOutput of [
    { reply: 'Your proposal is ready.', answers: { who: 'company', industry: '', team: '', revenue: '', breaking: '', goal: '', expFor: [] } },
    { reply: 'Ready', answers: { who: 'company', invented: 'x' } },
    { reply: 'Ready', answers: { who: 'company', industry: 'not-an-industry' } },
    { reply: 'Ready', answers: { who: 'company', expFor: ['team', 'team'] } },
    { reply: 'Ready', answers: { who: 'company' }, complete: true },
    { reply: '', answers: { who: 'company' } },
  ]) {
    const invalid = harness({ metaBody: modelOutput });
    const response = await invalid.invoke({ task: 'diagnosis', locale: 'es', message: 'I run a business', answers: {} });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error, 'invalid_diagnosis');
  }
});

test('diagnosis quota rejects unavailable and malformed results before Meta while retaining the rate-limit response', async () => {
  for (const options of [{ quotaStatus: 503 }, { allowed: null }, { allowed: 'true' }]) {
    const unavailable = harness(options);
    const response = await unavailable.invoke({ task: 'diagnosis', locale: 'en', message: 'I run a restaurant.', answers: {} });
    assert.equal(response.status, 503);
    assert.equal(unavailable.calls.some(({ url }) => url.includes('/v1/messages')), false);
  }

  const limited = harness({ allowed: false });
  assert.equal((await limited.invoke({ task: 'diagnosis', locale: 'en', message: 'I run a restaurant.', answers: {} })).status, 429);
  assert.equal(limited.calls.some(({ url }) => url.includes('/v1/messages')), false);
});

test('generic AI keeps its existing behavior when quota reporting is unavailable', async () => {
  const generic = harness({ quotaStatus: 503 });
  const response = await generic.invoke({ prompt: 'Summarize my plan.', locale: 'en' });
  assert.equal(response.status, 200);
  assert.equal(generic.calls.some(({ url }) => url.includes('/v1/messages')), true);
});

test('new model patches cannot mark unanswered business fields complete with empty values', () => {
  const { parseDiagnosisOutput, validateDiagnosisAnswers } = load('@/lib/diagnosis-ai');
  const blankBusiness = { who: 'company', industry: '', team: '', revenue: '', breaking: '', goal: '', expFor: [] };
  assert.equal(validateDiagnosisAnswers(blankBusiness), true, 'legacy records retain their tolerant reader validation');
  assert.equal(parseDiagnosisOutput({ reply: 'Your proposal is ready.', answers: blankBusiness }, {}), null);
  const explicitBusiness = { who: 'company', industry: 'food', team: 'small', revenue: '5-20', breaking: 'demand', goal: 'grow', expFor: ['none'] };
  assert.equal(parseDiagnosisOutput({ reply: 'Your proposal is ready.', answers: explicitBusiness }, {}).complete, true);
});

test('diagnosis prompt extracts the latest turn before selecting the next unanswered question', () => {
  const { buildDiagnosisMessages } = load('@/lib/diagnosis-ai-server');
  const { system } = buildDiagnosisMessages({
    message: 'I run a restaurant and want more bookings.', answers: { who: 'company' }, conversation: [], locale: 'en',
  });
  assert.match(system, /first extract|first update|latest user message/i);
  assert.match(system, /after applying|after updating|after the patch/i);
  assert.match(system, /next unanswered field/i);
  assert.match(system, /known facts|provided answers|current snapshot/i);
});

test('diagnosis client sends the session and rejects malformed responses without a fallback', async () => {
  const { requestDiagnosisTurn } = load('@/lib/diagnosis-ai');
  const input = { message: 'I run a business.', answers: {}, conversation: [], locale: 'es' };
  let calls = 0;
  const fetcher = async (url, init) => {
    calls += 1;
    assert.equal(url, '/api/ai');
    assert.equal(init.headers.Authorization, 'Bearer user-token');
    assert.equal(JSON.parse(init.body).task, 'diagnosis');
    return Response.json({ reply: 'Cuéntame más.', answers: { who: 'company' }, complete: false,
      provenance: { provider: 'Meta', model: 'muse-spark-1.3', responseId: 'msg_test' } });
  };
  await assert.rejects(requestDiagnosisTurn(input, undefined, fetcher), /auth/);
  assert.equal(calls, 0);
  assert.equal((await requestDiagnosisTurn(input, 'user-token', fetcher)).answers.who, 'company');
  for (const response of [
    Response.json({ error: 'rate_limited' }, { status: 429 }),
    Response.json({ reply: 'No provenance', answers: {}, complete: false }),
  ]) await assert.rejects(requestDiagnosisTurn(input, 'user-token', async () => response));
});
