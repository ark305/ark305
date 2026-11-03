import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('Next and Nest have independent package roots with compatible root launchers', () => {
  const frontend = JSON.parse(read('frontend/package.json'));
  const backend = JSON.parse(read('backend/package.json'));
  const launcher = JSON.parse(read('package.json'));
  assert.ok(frontend.dependencies.next);
  assert.ok(backend.dependencies['@nestjs/core']);
  assert.equal(launcher.dependencies, undefined);
  for (const name of ['dev', 'build', 'start', 'lint']) assert.match(launcher.scripts[name], /--prefix frontend/);
  assert.match(frontend.scripts.dev, /3100/);
  for (const name of ['src', 'public', 'test', 'next.config.ts', 'tsconfig.json', 'package-lock.json']) {
    assert.ok(fs.existsSync(path.join(root, 'frontend', name)), name);
  }
  assert.equal(fs.existsSync(path.join(root, 'src')), false);
  assert.ok(fs.existsSync(path.join(root, 'supabase/migrations')));
  assert.doesNotMatch(read('frontend/.env.example'), /^(META_|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY)/m);
});
