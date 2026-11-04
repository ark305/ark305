import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load() {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/lib/seller-draft-ai.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, fetch, AbortSignal });
  return exports;
}
test('seller client requires provenance and cost-based pricing without fallback', async () => {
  const { requestSellerDraft } = load();
  const input = { action: 'price', serviceId: 'service', locale: 'es', tone: 'business', cost: 75, marginPercent: 25 };
  const data = { draft: { text: 'Borrador.' }, pricing: { cost: 75, marginPercent: 25, suggestedPrice: 100, currency: 'USD' }, provenance: { provider: 'Meta', model: 'muse', responseId: 'msg' } };
  let calls = 0;
  const fetcher = async (url, init) => { calls++; assert.equal(url, '/api/ai'); assert.equal(init.headers.Authorization, 'Bearer token'); assert.equal(JSON.parse(init.body).task, 'seller-draft'); return Response.json(data); };
  await assert.rejects(requestSellerDraft(input, undefined, fetcher), /auth/); assert.equal(calls, 0);
  assert.equal((await requestSellerDraft(input, 'token', fetcher)).pricing.suggestedPrice, 100); assert.equal(calls, 1);
  for (const value of [{ ...data, provenance: null }, { ...data, pricing: { ...data.pricing, suggestedPrice: 200 } }, { ...data, draft: { text: 'bad\u0000text' } }]) {
    await assert.rejects(requestSellerDraft(input, 'token', async () => Response.json(value)), /invalid_draft/);
  }
  await assert.rejects(requestSellerDraft(input, 'token', async () => Response.json({ error: 'seller_service' }, { status: 404 })), /seller_service/);
});
