import 'server-only';

const DEFAULT_ORIGIN = 'http://127.0.0.1:3001';
const ERROR_CODES = new Set(['name', 'handle', 'title', 'price', 'photo']);

export class BackendApiError extends Error {
  constructor(readonly status: number, readonly code?: 'name' | 'handle' | 'title' | 'price' | 'photo') {
    super('Backend unavailable');
    this.name = 'BackendApiError';
  }
}

function origin(): URL {
  const value = new URL(process.env.ARK_API_URL ?? DEFAULT_ORIGIN);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(value.hostname);
  if ((value.protocol !== 'https:' && !(local && value.protocol === 'http:')) || value.username || value.password ||
      value.pathname !== '/' || value.search || value.hash) throw new Error('Backend unavailable');
  return value;
}

export async function backendApi<T>(path: string, options: { token?: string; method?: string; body?: unknown } = {}): Promise<T> {
  try {
    const response = await fetch(new URL(`/api/v1/${path.replace(/^\/+/, '')}`, origin()), {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      let code: BackendApiError['code'];
      try {
        const payload: unknown = await response.json();
        if (payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string' && ERROR_CODES.has(payload.code)) {
          code = payload.code as BackendApiError['code'];
        }
      } catch { /* Ignore untrusted or malformed upstream error bodies. */ }
      throw new BackendApiError(response.status, code);
    }
    return await response.json() as T;
  } catch (error) {
    if (error instanceof BackendApiError) throw error;
    throw new Error('Backend unavailable');
  }
}
