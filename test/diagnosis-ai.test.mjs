import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(spec) {
  const filename = spec.replace('@/', '../src/');
  const source = fs.readFileSync(new URL(`${filename}.ts`, import.meta.url), 'utf8');
  const exports = {};
  const localRequire = (name) => name.startsWith('.') ? load(`@/lib/${name.slice(2)}`) : require(name);
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: localRequire, fetch, AbortSignal });
  return exports;
}

test('legacy UI answer validation remains tolerant while model output is strict', () => {
  const { parseDiagnosisOutput, validateDiagnosisAnswers } = load('@/lib/diagnosis-ai');
  const blank = { who: 'company', industry: '', team: '', revenue: '', breaking: '', goal: '', expFor: [] };
  assert.equal(validateDiagnosisAnswers(blank), true);
  assert.equal(parseDiagnosisOutput({ reply: 'Your proposal is ready.', answers: blank }, {}), null);
  const answered = { who: 'company', industry: 'food', team: 'small', revenue: '5-20', breaking: 'demand', goal: 'grow', expFor: ['none'] };
  assert.equal(parseDiagnosisOutput({ reply: 'Your proposal is ready.', answers: answered }, {}).complete, true);
});

test('diagnosis client sends the session and rejects malformed responses without a fallback', async () => {
  const { requestDiagnosisTurn } = load('@/lib/diagnosis-ai');
  const input = { message: 'I run a business.', answers: {}, conversation: [], locale: 'es' }; let calls = 0;
  const fetcher = async (url, init) => {
    calls++; assert.equal(url, '/api/ai'); assert.equal(init.headers.Authorization, 'Bearer user-token'); assert.equal(JSON.parse(init.body).task, 'diagnosis');
    return Response.json({ reply: 'Cuéntame más.', answers: { who: 'company' }, complete: false, provenance: { provider: 'Meta', model: 'muse-spark-1.3', responseId: 'msg_test' } });
  };
  await assert.rejects(requestDiagnosisTurn(input, undefined, fetcher), /auth/); assert.equal(calls, 0);
  assert.equal((await requestDiagnosisTurn(input, 'user-token', fetcher)).answers.who, 'company');
  for (const response of [Response.json({ error: 'rate_limited' }, { status: 429 }), Response.json({ reply: 'No provenance', answers: {}, complete: false })]) {
    await assert.rejects(requestDiagnosisTurn(input, 'user-token', async () => response));
  }
});
