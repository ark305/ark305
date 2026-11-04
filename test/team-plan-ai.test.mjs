import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(`../src/lib/${file}.ts`, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { exports, require: name => load(name.replace('./', '')), fetch, AbortSignal });
  return exports;
}
test('team client sends one authenticated request and rejects fabricated or malformed estimates', async () => {
  const { requestTeamPlan } = load('team-plan-ai');
  const input = { prompt: 'Equipo de marketing', locale: 'es' };
  let calls = 0;
  const valid = { plan: { understood: true, rationale: 'Propuesta.', demo: true, monthlyTotal: 779, oneOffTotal: 145, quoteCount: 1,
    items: [{ id: 'r-cm', hours: 10, cadence: 'monthly', amount: 779 }, { id: 'turn', hours: 0, cadence: 'one_off', amount: 145 }, { id: 'kitchen', hours: 0, cadence: 'quote', amount: null }] },
    provenance: { provider: 'Meta', model: 'muse-test', responseId: 'msg-team' } };
  const fetcher = async (url, init) => {
    calls++; assert.equal(url, '/api/ai'); assert.equal(init.headers.Authorization, 'Bearer test');
    assert.equal(JSON.parse(init.body).task, 'team-plan'); return Response.json(valid);
  };
  await assert.rejects(requestTeamPlan(input, undefined, fetcher), /auth/);
  assert.equal(calls, 0);
  assert.equal((await requestTeamPlan(input, 'test', fetcher)).plan.quoteCount, 1);
  assert.equal(calls, 1);
  for (const body of [{ ...valid, provenance: undefined }, { ...valid, plan: { ...valid.plan, monthlyTotal: 924 } },
    { ...valid, plan: { ...valid.plan, items: [{ ...valid.plan.items[0], amount: 1 }] } }]) {
    await assert.rejects(requestTeamPlan(input, 'test', async () => Response.json(body)), /invalid_plan/);
  }
  await assert.rejects(requestTeamPlan(input, 'test', async () => Response.json({ error: 'invalid_plan' }, { status: 502 })), /invalid_plan/);
});
