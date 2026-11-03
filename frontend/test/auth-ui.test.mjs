import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

const labels = {
  auth: {
    title: 'Sign in', sub: 'Use your email and password.', why: 'ARK account', email: 'Email', password: 'Password',
    signInSub: 'Use your email and password.', signInError: 'We could not sign you in. Try again.',
    confirmPassword: 'Confirm password', signIn: 'Sign in', signingIn: 'Signing in', requestAccount: 'Request account',
    forgotPassword: 'Forgot password', send: 'Send email', sending: 'Sending', sent: 'Check your email',
    emailRequestSent: 'Check your email',
    passwordMin: 'At least 12 characters', passwordMismatch: 'Passwords do not match', invalidPassword: 'Password is invalid',
    updatePassword: 'Save password', updatingPassword: 'Saving password', passwordSaved: 'Password saved',
    retrySignOut: 'Sign out',
    passwordSignOutError: 'Your password was updated, but this session is still open.',
    genericError: 'Could not complete this request.', tooMany: 'Wait before trying again.', notReady: 'Auth is unavailable.',
    passwordUpdateError: 'We could not save your password. Request a new link and try again.',
    linkError: 'The link expired or was already used. Request another one.', example: 'Example profile',
    signOut: 'Sign out',
  },
};

function loadComponent(path, adapters = {}) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  let state = [];
  let refs = [];
  let effects = [];
  let cursor = 0;
  const hooks = {
    useCallback(callback) { return callback; },
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in refs)) refs[index] = { current: initial };
      return refs[index];
    },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in effects)) effects[index] = effect();
    },
  };
  let boundUserId = null;
  const createBoundClient = adapters.createBoundClient ?? (() => ({ auth: {
    setSession: async ({ access_token }) => {
      boundUserId = access_token.replace(/^token-/, '');
      return { data: { user: { id: boundUserId } }, error: null };
    },
    getUser: async () => ({ data: { user: { id: boundUserId } }, error: null }),
    updateUser: async (...args) => adapters.auth?.updateUser?.(...args) ?? { error: null },
  } }));
  const modules = {
    react: hooks,
    'react/jsx-runtime': {
      jsx: (type, props) => ({ type, props: props ?? {} }),
      jsxs: (type, props) => ({ type, props: props ?? {} }),
      Fragment: 'fragment',
    },
    'next/link': { default: 'a' },
    'next/navigation': { useRouter: () => adapters.router ?? { replace() {}, refresh() {} } },
    '@supabase/supabase-js': { createClient: createBoundClient },
    '@/lib/dict': { dict: () => labels },
    '@/lib/supabase/client': { createClient: () => ({ auth: adapters.auth ?? {} }) },
    '@/lib/supabase/config': {
      supabaseReady: adapters.ready ?? true,
      SUPABASE_URL: adapters.supabaseUrl ?? 'https://auth.example.test',
      SUPABASE_KEY: adapters.supabaseKey ?? 'synthetic-publishable-key',
    },
    '@/lib/auth-flow': adapters.authFlow ?? {
      isPasswordAllowed: (value) => typeof value === 'string' && value.length >= 12 && value.length <= 128,
      safeLocalNext: (value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/perfil',
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => modules[name] ?? require(name),
    URL,
    location: { origin: 'https://ark.example.test' },
    window: { location: { origin: 'https://ark.example.test' } },
  });
  return {
    exports,
    render(Component, props) {
      cursor = 0;
      return Component(props);
    },
  };
}

function find(tree, predicate) {
  if (tree == null || typeof tree === 'boolean') return null;
  if (Array.isArray(tree)) {
    for (const child of tree) {
      const match = find(child, predicate);
      if (match) return match;
    }
    return null;
  }
  if (typeof tree !== 'object') return null;
  if (predicate(tree)) return tree;
  return find(tree.props?.children, predicate);
}

function input(tree, name, value) {
  const element = find(tree, (node) => node.type === 'input' && node.props.name === name);
  assert.ok(element, `expected input ${name}`);
  element.props.onChange({ target: { value } });
}

function accountAuth(userId, methods = {}) {
  return {
    getSession: async () => ({ data: { session: { access_token: `token-${userId}`, refresh_token: `refresh-${userId}` } }, error: null }),
    getUser: async () => ({ data: { user: { id: userId } }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    ...methods,
  };
}

function syntheticJwt(userId) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: userId, aud: 'authenticated', role: 'authenticated', exp: now + 3600, iat: now })}.synthetic-signature`;
}

function realSdkAuthSetup(options = {}) {
  const accountA = '11111111-1111-4111-8111-111111111111';
  const accountB = '33333333-3333-4333-8333-333333333333';
  let activeAccount = accountA;
  const requests = [];
  const sharedSignsOut = [];
  const listeners = [];
  let liveIdentityReads = 0;
  const sdk = require('@supabase/supabase-js');
  const syntheticFetch = async (url, init = {}) => {
    const authorization = new Headers(init.headers).get('authorization');
    const target = authorization === `Bearer ${syntheticJwt(accountA)}` ? accountA
      : authorization === `Bearer ${syntheticJwt(accountB)}` ? accountB : 'unknown';
    const parsed = new URL(url);
    requests.push({ path: parsed.pathname, method: init.method ?? 'GET', target });
    if (parsed.pathname.endsWith('/user')) return Response.json({ id: target, aud: 'authenticated', role: 'authenticated', email: 'synthetic@example.test' });
    if (parsed.pathname.endsWith('/logout')) return new Response(null, { status: 204 });
    throw new Error('Unexpected synthetic Supabase request');
  };
  const sharedAuth = {
    onAuthStateChange: (callback) => { listeners.push(callback); return { data: { subscription: { unsubscribe() {} } } }; },
    getSession: async () => ({ data: { session: {
      user: { id: activeAccount }, access_token: syntheticJwt(activeAccount), refresh_token: `synthetic-refresh-${activeAccount}`,
    } }, error: null }),
    getUser: async () => {
      liveIdentityReads += 1;
      if (options.getUser) return options.getUser({ activeAccount, liveIdentityReads, setAccount: (value) => { activeAccount = value; } });
      return { data: { user: { id: activeAccount } }, error: null };
    },
    updateUser: async () => { throw new Error('The shared browser client must not update a password'); },
    signOut: async () => { sharedSignsOut.push(activeAccount); return sharedSignsOut.length === 1 && options.failSignOut ? { error: new Error('synthetic signout failure') } : { error: null }; },
  };
  const harness = loadComponent('../src/components/set-password.tsx', {
    auth: sharedAuth,
    createBoundClient: (url, key, config) => sdk.createClient(url, key, {
      ...config,
      global: { fetch: syntheticFetch },
    }),
  });
  const component = harness.exports.SetPassword;
  const props = { locale: 'en', purpose: 'recovery', expectedUserId: accountA };
  let tree = harness.render(component, props);
  input(tree, 'password', 'new synthetic password for A');
  tree = harness.render(component, props);
  input(tree, 'confirmPassword', 'new synthetic password for A');
  tree = harness.render(component, props);
  return {
    harness, component, props, tree, requests, sharedSignsOut, listeners,
    setAccount: (value) => { activeAccount = value; },
  };
}

test('password login submits email and password once and returns to safe local destination', async () => {
  const calls = [];
  const navigation = [];
  const harness = loadComponent('../src/components/sign-in.tsx', {
    router: { replace: (path) => navigation.push(path), refresh: () => navigation.push('refresh') },
    auth: { signInWithPassword: async (credentials) => { calls.push(credentials); return { error: null }; } },
  });
  const component = harness.exports.SignIn;
  let tree = harness.render(component, { locale: 'en', next: '/perfil?tab=services' });
  input(tree, 'email', '  person@example.test ');
  tree = harness.render(component, { locale: 'en', next: '/perfil?tab=services' });
  input(tree, 'password', 'correct horse battery staple');
  tree = harness.render(component, { locale: 'en', next: '/perfil?tab=services' });
  const form = find(tree, (node) => node.type === 'form');
  const event = { preventDefault() {} };
  const first = form.props.onSubmit(event);
  const second = form.props.onSubmit(event);
  await Promise.all([first, second]);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [{ email: 'person@example.test', password: 'correct horse battery staple' }]);
  assert.deepEqual(navigation, ['/perfil?tab=services', 'refresh']);
});

test('password login errors remain generic and never route a failed session', async () => {
  const navigation = [];
  const harness = loadComponent('../src/components/sign-in.tsx', {
    router: { replace: (path) => navigation.push(path), refresh() {} },
    auth: { signInWithPassword: async () => ({ error: { status: 400, message: 'Invalid login credentials' } }) },
  });
  const component = harness.exports.SignIn;
  let tree = harness.render(component, { locale: 'en', next: '/perfil' });
  input(tree, 'email', 'person@example.test');
  tree = harness.render(component, { locale: 'en', next: '/perfil' });
  input(tree, 'password', 'correct horse battery staple');
  tree = harness.render(component, { locale: 'en', next: '/perfil' });
  await find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  tree = harness.render(component, { locale: 'en', next: '/perfil' });
  const text = JSON.stringify(tree);
  assert.match(text, /We could not sign you in/);
  assert.doesNotMatch(text, /Invalid login credentials/);
  assert.deepEqual(navigation, []);
});

test('account request uses only fixed setup-purpose redirect and does not expose account existence', async () => {
  const calls = [];
  const harness = loadComponent('../src/components/auth-email-request.tsx', {
    auth: { signInWithOtp: async (request) => { calls.push(request); return { error: null }; } },
  });
  const component = harness.exports.AuthEmailRequest;
  let tree = harness.render(component, { locale: 'en', mode: 'register' });
  input(tree, 'email', 'person@example.test');
  tree = harness.render(component, { locale: 'en', mode: 'register' });
  const form = find(tree, (node) => node.type === 'form');
  const event = { preventDefault() {} };
  const first = form.props.onSubmit(event);
  const second = form.props.onSubmit(event);
  await Promise.all([first, second]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].email, 'person@example.test');
  assert.equal(calls[0].options.shouldCreateUser, true);
  assert.equal(calls[0].options.emailRedirectTo, 'https://ark.example.test/auth/callback?purpose=setup');
  tree = harness.render(component, { locale: 'en', mode: 'register' });
  assert.match(JSON.stringify(tree), /Check your email/);
});

test('recovery email uses the fixed recovery callback and generic success response', async () => {
  const calls = [];
  const harness = loadComponent('../src/components/auth-email-request.tsx', {
    auth: { resetPasswordForEmail: async (...args) => { calls.push(args); return { error: null }; } },
  });
  const component = harness.exports.AuthEmailRequest;
  let tree = harness.render(component, { locale: 'en', mode: 'recovery' });
  input(tree, 'email', 'person@example.test');
  tree = harness.render(component, { locale: 'en', mode: 'recovery' });
  await find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'person@example.test');
  assert.equal(calls[0][1].redirectTo, 'https://ark.example.test/auth/callback?purpose=recovery');
  tree = harness.render(component, { locale: 'en', mode: 'recovery' });
  assert.match(JSON.stringify(tree), /Check your email/);
});

test('recovery errors do not expose account existence and respect rate limits', async () => {
  for (const [status, expected] of [[400, 'Could not complete this request.'], [429, 'Wait before trying again.']]) {
    const harness = loadComponent('../src/components/auth-email-request.tsx', {
      auth: { resetPasswordForEmail: async () => ({ error: { status, message: 'account not found' } }) },
    });
    const component = harness.exports.AuthEmailRequest;
    let tree = harness.render(component, { locale: 'en', mode: 'recovery' });
    input(tree, 'email', 'person@example.test');
    tree = harness.render(component, { locale: 'en', mode: 'recovery' });
    await find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
    tree = harness.render(component, { locale: 'en', mode: 'recovery' });
    const text = JSON.stringify(tree);
    assert.match(text, new RegExp(expected));
    assert.doesNotMatch(text, /account not found/);
  }
});

test('password update rejects mismatch, updates through Supabase, then signs out', async () => {
  const calls = [];
  const navigation = [];
  const harness = loadComponent('../src/components/set-password.tsx', {
    router: { replace: (path) => navigation.push(path), refresh() {} },
    auth: accountAuth('account-A', {
      updateUser: async (values) => { calls.push(['update', values]); return { error: null }; },
      signOut: async (options) => { calls.push(['signOut', options]); return { error: null }; },
    }),
  });
  const component = harness.exports.SetPassword;
  const props = { locale: 'en', purpose: 'setup', expectedUserId: 'account-A' };
  let tree = harness.render(component, props);
  input(tree, 'password', 'correct horse battery staple');
  tree = harness.render(component, props);
  input(tree, 'confirmPassword', 'different password');
  tree = harness.render(component, props);
  await find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(calls, []);

  tree = harness.render(component, props);
  input(tree, 'confirmPassword', 'correct horse battery staple');
  tree = harness.render(component, props);
  const form = find(tree, (node) => node.type === 'form');
  await Promise.all([form.props.onSubmit({ preventDefault() {} }), form.props.onSubmit({ preventDefault() {} })]);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ['update', { password: 'correct horse battery staple' }],
    ['signOut', { scope: 'local' }],
  ]);
  assert.deepEqual(navigation, ['/entrar?password=created']);
});

test('password update refuses a different active account and clears stale password fields', async () => {
  let currentAccount = 'account-A';
  const calls = [];
  const auth = accountAuth('account-A', {
    getSession: async () => ({ data: { session: { access_token: `token-${currentAccount}`, refresh_token: `refresh-${currentAccount}` } }, error: null }),
    getUser: async () => ({ data: { user: { id: currentAccount } }, error: null }),
    updateUser: async () => { calls.push(['update', currentAccount]); return { error: null }; },
    signOut: async () => { calls.push(['signOut', currentAccount]); return { error: null }; },
  });
  const harness = loadComponent('../src/components/set-password.tsx', { auth });
  const component = harness.exports.SetPassword;
  const props = { locale: 'en', purpose: 'recovery', expectedUserId: 'account-A' };
  let tree = harness.render(component, props);
  input(tree, 'password', 'new password for account A');
  tree = harness.render(component, props);
  input(tree, 'confirmPassword', 'new password for account A');
  tree = harness.render(component, props);
  currentAccount = 'account-B';
  await find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  tree = harness.render(component, props);
  assert.deepEqual(calls, []);
  assert.match(JSON.stringify(tree), /We could not save your password/);
  assert.equal(find(tree, (node) => node.type === 'input' && node.props.name === 'password').props.value, '');
  assert.equal(find(tree, (node) => node.type === 'input' && node.props.name === 'confirmPassword').props.value, '');
});

test('account switch during a pending identity check invalidates the operation before any write', async () => {
  let currentAccount = 'account-A';
  let releaseVerification;
  let announceVerification;
  const verificationStarted = new Promise((resolve) => { announceVerification = resolve; });
  const listeners = [];
  const calls = [];
  const auth = accountAuth('account-A', {
    getSession: async () => ({ data: { session: { access_token: 'token-account-A', refresh_token: 'refresh-account-A' } }, error: null }),
    getUser: () => new Promise((resolve) => {
      releaseVerification = () => resolve({ data: { user: { id: 'account-A' } }, error: null });
      announceVerification();
    }),
    onAuthStateChange: (listener) => {
      listeners.push(listener);
      return { data: { subscription: { unsubscribe() {} } } };
    },
    updateUser: async () => { calls.push(['update', currentAccount]); return { error: null }; },
    signOut: async () => { calls.push(['signOut', currentAccount]); return { error: null }; },
  });
  const harness = loadComponent('../src/components/set-password.tsx', { auth });
  const component = harness.exports.SetPassword;
  const props = { locale: 'en', purpose: 'setup', expectedUserId: 'account-A' };
  let tree = harness.render(component, props);
  input(tree, 'password', 'new password for account A');
  tree = harness.render(component, props);
  input(tree, 'confirmPassword', 'new password for account A');
  tree = harness.render(component, props);
  const submission = find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  await verificationStarted;
  currentAccount = 'account-B';
  listeners[0]('SIGNED_IN', { user: { id: 'account-B' } });
  releaseVerification();
  await submission;
  tree = harness.render(component, props);
  assert.deepEqual(calls, []);
  assert.equal(find(tree, (node) => node.type === 'input' && node.props.name === 'password').props.value, '');
  assert.equal(find(tree, (node) => node.type === 'input' && node.props.name === 'confirmPassword').props.value, '');
});

test('password write remains pinned to the verified token if the browser session switches after checking', async () => {
  let currentAccount = 'account-A';
  const writes = [];
  const signOuts = [];
  let boundAccount = null;
  const shared = accountAuth('account-A', {
    getSession: async () => ({ data: { session: { access_token: 'token-account-A', refresh_token: 'refresh-account-A' } }, error: null }),
    getUser: async () => {
      const observed = currentAccount;
      if (observed === 'account-A') currentAccount = 'account-B';
      return { data: { user: { id: observed } }, error: null };
    },
    updateUser: async () => { throw new Error('shared session update must not be used'); },
    signOut: async () => { signOuts.push(currentAccount); return { error: null }; },
  });
  const harness = loadComponent('../src/components/set-password.tsx', {
    auth: shared,
    supabaseUrl: 'https://auth.example.test',
    supabaseKey: 'publishable-test-key',
    createBoundClient: () => ({ auth: {
      setSession: async ({ access_token }) => {
        boundAccount = access_token.replace('token-', '');
        return { data: { user: { id: boundAccount } }, error: null };
      },
      getUser: async () => ({ data: { user: { id: boundAccount } }, error: null }),
      updateUser: async (values) => { writes.push({ account: boundAccount, values }); return { error: null }; },
      signOut: async () => { boundAccount = null; return { error: null }; },
    } }),
  });
  const component = harness.exports.SetPassword;
  const props = { locale: 'en', purpose: 'setup', expectedUserId: 'account-A' };
  let tree = harness.render(component, props);
  input(tree, 'password', 'new password for account A');
  tree = harness.render(component, props);
  input(tree, 'confirmPassword', 'new password for account A');
  tree = harness.render(component, props);
  await find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(JSON.parse(JSON.stringify(writes)), [{ account: 'account-A', values: { password: 'new password for account A' } }]);
  assert.deepEqual(signOuts, []);
});

test('password update errors stay generic and failed local sign-out can retry without resubmitting password', async () => {
  const calls = [];
  const navigation = [];
  let signOutCount = 0;
  let currentAccount = 'account-A';
  const harness = loadComponent('../src/components/set-password.tsx', {
    router: { replace: (path) => navigation.push(path), refresh() {} },
    auth: accountAuth('account-A', {
      getUser: async () => ({ data: { user: { id: currentAccount } }, error: null }),
      updateUser: async () => { calls.push(['update']); return { error: null }; },
      signOut: async (options) => {
        calls.push(['signOut', options]);
        signOutCount += 1;
        return signOutCount === 1 ? { error: new Error('private SDK detail') } : { error: null };
      },
    }),
  });
  const component = harness.exports.SetPassword;
  const props = { locale: 'en', purpose: 'setup', expectedUserId: 'account-A' };
  let tree = harness.render(component, props);
  input(tree, 'password', 'correct horse battery staple');
  tree = harness.render(component, props);
  input(tree, 'confirmPassword', 'correct horse battery staple');
  tree = harness.render(component, props);
  await find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  tree = harness.render(component, props);
  const text = JSON.stringify(tree);
  assert.match(text, /Your password was updated/);
  assert.doesNotMatch(text, /private SDK detail/);
  assert.doesNotMatch(navigation.join(' '), /correct horse/);
  const retry = find(tree, (node) => node.type === 'button' && node.props.children === 'Sign out');
  assert.ok(retry);
  currentAccount = 'account-B';
  await retry.props.onClick();
  assert.equal(calls.filter(([name]) => name === 'update').length, 1);
  assert.equal(calls.filter(([name]) => name === 'signOut').length, 1);
  assert.deepEqual(navigation, []);
});

test('password provider errors remain generic and do not sign out or reveal credentials', async () => {
  const calls = [];
  const harness = loadComponent('../src/components/set-password.tsx', {
    auth: accountAuth('account-A', {
      updateUser: async () => ({ error: { status: 400, message: 'weak_password internal detail' } }),
      signOut: async () => { calls.push('signOut'); return { error: null }; },
    }),
  });
  const component = harness.exports.SetPassword;
  const props = { locale: 'en', purpose: 'recovery', expectedUserId: 'account-A' };
  let tree = harness.render(component, props);
  input(tree, 'password', 'correct horse battery staple');
  tree = harness.render(component, props);
  input(tree, 'confirmPassword', 'correct horse battery staple');
  tree = harness.render(component, props);
  await find(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  tree = harness.render(component, props);
  const text = JSON.stringify(tree);
  assert.match(text, /We could not save your password/);
  assert.doesNotMatch(text, /weak_password internal detail/);
  assert.deepEqual(calls, []);
});

test('real Supabase SDK: account switch before submission cannot update or revoke the new account', async () => {
  const scenario = realSdkAuthSetup();
  scenario.setAccount('33333333-3333-4333-8333-333333333333');
  await find(scenario.tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(scenario.requests.filter(({ method }) => method === 'PUT').length, 0);
  assert.equal(scenario.requests.filter(({ path, method, target }) => path.endsWith('/logout') && method === 'POST' && target === '33333333-3333-4333-8333-333333333333').length, 0);
  assert.deepEqual(scenario.sharedSignsOut, []);
});

test('real Supabase SDK: isolated password update does not cross the live browser auth channel or revoke sessions', async () => {
  const original = {
    window: globalThis.window,
    document: globalThis.document,
    BroadcastChannel: globalThis.BroadcastChannel,
  };
  const channels = new Map();
  const broadcasts = [];
  class LocalBroadcastChannel {
    constructor(name) {
      this.name = name;
      this.onmessage = null;
      if (!channels.has(name)) channels.set(name, new Set());
      channels.get(name).add(this);
    }
    postMessage(data) {
      broadcasts.push({ name: this.name, event: data.event });
      for (const peer of channels.get(this.name)) {
        if (peer !== this) queueMicrotask(() => peer.onmessage?.({ data }));
      }
    }
    addEventListener(type, callback) { if (type === 'message') this.onmessage = callback; }
    close() { channels.get(this.name)?.delete(this); }
  }
  globalThis.window = { location: { href: 'https://ark.example.test/crear-contrasena', hash: '', search: '' }, addEventListener() {}, removeEventListener() {} };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
  globalThis.BroadcastChannel = LocalBroadcastChannel;
  let liveClient;
  let subscription;
  const liveEvents = [];
  try {
    const sdk = require('@supabase/supabase-js');
    const values = new Map();
    liveClient = sdk.createClient('https://auth.example.test', 'synthetic-publishable-key', {
      auth: {
        storage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) },
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: { fetch: async () => Response.json({ id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', email: 'synthetic@example.test' }) },
    });
    await liveClient.auth.setSession({ access_token: syntheticJwt('11111111-1111-4111-8111-111111111111'), refresh_token: 'synthetic-refresh-live' });
    subscription = liveClient.auth.onAuthStateChange((event) => liveEvents.push(event));
    await new Promise((resolve) => setImmediate(resolve));
    liveEvents.length = 0;
    broadcasts.length = 0;

    const scenario = realSdkAuthSetup();
    await find(scenario.tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(liveEvents, []);
    assert.equal(broadcasts.some(({ name }) => name === 'sb-auth-auth-token'), false);
    assert.equal(scenario.requests.some(({ path, method }) => path.endsWith('/logout') && method === 'POST'), false);
  } finally {
    subscription?.data?.subscription?.unsubscribe();
    await liveClient?.auth.stopAutoRefresh();
    for (const peers of channels.values()) for (const peer of [...peers]) peer.close();
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});

