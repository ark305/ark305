import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('the repository root is the standalone Next application', () => {
  const rootPackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  assert.deepEqual(Object.keys(rootPackage.scripts).sort(), ['build', 'dev', 'lint', 'start', 'test', 'typecheck']);
  assert.equal(rootPackage.scripts.dev, 'next dev --port 3100');
  assert.equal(rootPackage.scripts.start, 'next start --port 3100');
  assert.equal(rootPackage.scripts.test, 'node --test test/*.test.mjs');
  assert.ok(rootPackage.dependencies.next);
  assert.equal(rootPackage.dependencies['@nestjs/core'], undefined);
  for (const webPath of ['next.config.ts', '.env.example', 'src', 'public', 'test']) {
    assert.ok(fs.existsSync(path.join(root, webPath)), `${webPath} must be at the repository root`);
  }
});

test('the active web tree contains no nested source or server migrations', () => {
  for (const serverPath of [
    'frontend/src',
    'backend',
    'supabase/schema.sql',
    'supabase/migrations',
  ]) {
    assert.equal(fs.existsSync(path.join(root, serverPath)), false, `${serverPath} should belong to the API repository`);
  }
});


test('private environments and generated files remain outside Git', () => {
  const actualRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const privatePaths = ['.env.local', '.env.production', 'frontend/.env.local', 'node_modules/example.js', '.next/server/example.js', 'frontend/.next/server/example.js'];
  for (const candidate of privatePaths) {
    assert.doesNotThrow(() => execFileSync('git', ['check-ignore', '--no-index', '--quiet', candidate], { cwd: actualRoot }), `${candidate} must be ignored`);
  }
  const rules = fs.readFileSync(path.join(actualRoot, '.gitignore'), 'utf8');
  assert.match(rules, /!\.env\.example/);
});
