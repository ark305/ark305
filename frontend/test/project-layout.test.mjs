import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('the root package launches and tests only the frontend', () => {
  const rootPackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const frontendPackage = JSON.parse(fs.readFileSync(path.join(root, 'frontend/package.json'), 'utf8'));

  assert.deepEqual(Object.keys(rootPackage.scripts).sort(), ['build', 'dev', 'lint', 'start', 'test', 'typecheck']);
  assert.match(rootPackage.scripts.dev, /--prefix frontend/);
  assert.match(rootPackage.scripts.test, /--prefix frontend/);
  assert.equal(frontendPackage.scripts.dev, 'next dev --port 3100');
  assert.ok(fs.existsSync(path.join(root, 'frontend/next.config.ts')));
  assert.ok(fs.existsSync(path.join(root, 'frontend/.env.example')));
});

test('the web repository no longer contains tracked server packages or database migrations', () => {
  for (const serverPath of [
    'backend/package.json',
    'backend/src',
    'supabase/schema.sql',
    'supabase/migrations',
  ]) {
    assert.equal(fs.existsSync(path.join(root, serverPath)), false, `${serverPath} should belong to the API repository`);
  }
});
