import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/lib/auth-flow.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadAuthFlow() {
  const exports = {};
  vm.runInNewContext(compiled, { exports, URL });
  return exports;
}

test('local auth destinations accept same-site paths and reject redirect tricks', () => {
  const { safeLocalNext } = loadAuthFlow();
  assert.equal(safeLocalNext('/perfil?tab=services'), '/perfil?tab=services');
  for (const value of [
    '//attacker.example/path',
    'https://attacker.example/path',
    '/\\attacker.example/path',
    '/%2f%2fattacker.example/path',
    '/%5c%5cattacker.example/path',
    '/profile%0d%0aLocation:%20https://attacker.example',
    '/%zz',
  ]) {
    assert.equal(safeLocalNext(value), '/perfil', `unsafe target: ${value}`);
  }
});

test('password policy has a documented minimum and bounded maximum', () => {
  const { isPasswordAllowed } = loadAuthFlow();
  assert.equal(isPasswordAllowed('correct horse battery staple'), true);
  assert.equal(isPasswordAllowed('short123!'), false);
  assert.equal(isPasswordAllowed('x'.repeat(129)), false);
  assert.equal(isPasswordAllowed('x'.repeat(12)), true);
  assert.equal(isPasswordAllowed(''), false);
});

const callbackSource = fs.readFileSync(new URL('../src/app/auth/callback/route.ts', import.meta.url), 'utf8');
const callbackCompiled = ts.transpileModule(callbackSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function callbackHarness(options = {}) {
  const calls = [];
  const exports = {};
  const supabase = {
    auth: {
      exchangeCodeForSession: async (code) => {
        calls.push(['exchange', code]);
        return options.authError ? { data: { user: null }, error: new Error('invalid') } : {
          data: { user: { id: 'account-1' }, session: { access_token: 'session-token' } }, error: null,
        };
      },
    },

  };
  const context = {
    exports,
    require: (name) => name === 'next/server'
      ? { NextResponse: { redirect: (url) => new Response(null, { status: 302, headers: { location: String(url) } }) } }
      : { safeLocalNext: loadAuthFlow().safeLocalNext, createClient: async () => supabase,
          backendApi: async (path, config) => {
            calls.push(['backend', path, config.token]);
            if (options.backendError) throw new Error('Backend unavailable');
            return { row: options.profile ? { id: 'account-1' } : null };
          } },
    URL, Response,
  };
  vm.runInNewContext(callbackCompiled, context);
  return {
    calls,
    invoke: (query) => exports.GET({ nextUrl: new URL(`https://ark305.example/auth/callback${query}`) }),
  };
}

test('callback routes setup and recovery purpose to fixed password page only after PKCE exchange', async () => {
  for (const purpose of ['setup', 'recovery']) {
    const harness = callbackHarness();
    const response = await harness.invoke(`?code=one-time-code&purpose=${purpose}`);
    assert.equal(response.headers.get('location'), `https://ark305.example/crear-contrasena?purpose=${purpose}`);
    assert.deepEqual(harness.calls, [['exchange', 'one-time-code']]);
  }
});

test('callback rejects missing, invalid and unknown-purpose links without leaking codes', async () => {
  for (const query of ['', '?purpose=unknown&code=secret-code']) {
    const harness = callbackHarness();
    const response = await harness.invoke(query);
    assert.equal(response.headers.get('location'), 'https://ark305.example/entrar?error=link');
    if (!query.includes('code=')) assert.deepEqual(harness.calls, []);
  }
  const invalid = callbackHarness({ authError: true });
  const response = await invalid.invoke('?code=secret-code&purpose=recovery');
  assert.equal(response.headers.get('location'), 'https://ark305.example/entrar?error=link');
  assert.equal(response.headers.get('location').includes('secret-code'), false);
});

test('legacy callback preserves profile onboarding and sanitizes next as a local path', async () => {
  const withProfile = callbackHarness({ profile: true });
  const response = await withProfile.invoke('?code=legacy-code&next=%2Fperfil%3Ftab%3Dservices');
  assert.equal(response.headers.get('location'), 'https://ark305.example/perfil?tab=services');
  const unsafe = callbackHarness({ profile: true });
  const unsafeResponse = await unsafe.invoke('?code=legacy-code&next=%2F%2Fevil.example');
  assert.equal(unsafeResponse.headers.get('location'), 'https://ark305.example/perfil');
  const newProfile = callbackHarness({ profile: false });
  const onboarding = await newProfile.invoke('?code=legacy-code');
  assert.equal(onboarding.headers.get('location'), 'https://ark305.example/bienvenida');
});

const passwordPageSource = fs.readFileSync(new URL('../src/app/crear-contrasena/page.tsx', import.meta.url), 'utf8');
const passwordPageCompiled = ts.transpileModule(passwordPageSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function passwordPageHarness(options = {}) {
  const exports = {};
  const events = [];
  const signedOut = [];
  const userId = options.userId ?? '7c493c6f-07f4-4f9b-bbf2-8408fa970e49';
  const context = {
    exports,
    require: (name) => {
      if (name === 'next/navigation') return { redirect: (path) => { throw new Error(`REDIRECT:${path}`); } };
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === '@/components/set-password') return { SetPassword: 'SetPassword' };
      if (name === '@/lib/i18n') return { getContext: async () => ({ locale: 'en' }), getDictionary: async () => ({ t: { auth: { setupPasswordTitle: 'Set password' } } }) };
      if (name === '@/lib/supabase/config') return { supabaseReady: options.ready ?? true };
      if (name === '@/lib/supabase/server') return { createClient: async () => ({ auth: {
        getUser: async () => options.authResult ?? { data: { user: { id: userId } }, error: null },
        signOut: async (config) => { signedOut.push(config); return options.signOutError ? { error: new Error('offline') } : { error: null }; },
      } }) };
      throw new Error(`Unexpected module ${name}`);
    },
  };
  vm.runInNewContext(passwordPageCompiled, context);
  return { page: exports.default, events, signedOut };
}

test('password setup page requires a verified Supabase user session', async () => {
  const missing = passwordPageHarness({ authResult: { data: { user: null }, error: null } });
  await assert.rejects(missing.page({ searchParams: Promise.resolve({ purpose: 'setup' }) }), /REDIRECT:\/entrar\?error=link/);
  const invalid = passwordPageHarness({ authResult: { data: { user: null }, error: new Error('invalid session') } });
  await assert.rejects(invalid.page({ searchParams: Promise.resolve({ purpose: 'recovery' }) }), /REDIRECT:\/entrar\?error=link/);
  const verified = passwordPageHarness();
  const result = await verified.page({ searchParams: Promise.resolve({ purpose: 'recovery' }) });
  assert.equal(result.type, 'div');
  assert.equal(result.props.children.type, 'SetPassword');
  assert.equal(result.props.children.props.purpose, 'recovery');
  assert.equal(result.props.children.props.expectedUserId, '7c493c6f-07f4-4f9b-bbf2-8408fa970e49');
  const endSession = result.props.children.props.endSession;
  assert.equal(await endSession('b2c9cdb6-c347-4e0c-9d8f-3b1175d1111a'), false);
  assert.deepEqual(verified.signedOut, []);
  assert.equal(await endSession('7c493c6f-07f4-4f9b-bbf2-8408fa970e49'), true);
  assert.deepEqual(JSON.parse(JSON.stringify(verified.signedOut)), [{ scope: 'local' }]);
});


test('callback uses Nest profile lookup with exchanged session and defaults to diagnosis', async () => {
  const harness = callbackHarness({ profile: true });
  const response = await harness.invoke('?code=legacy-code');
  assert.equal(response.headers.get('location'), 'https://ark305.example/diagnostico');
  assert.deepEqual(harness.calls, [['exchange', 'legacy-code'], ['backend', '/profiles/me', 'session-token']]);
});

test('callback does not treat unavailable Nest as a missing profile', async () => {
  const harness = callbackHarness({ backendError: true });
  const response = await harness.invoke('?code=legacy-code');
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
