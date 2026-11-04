import type { Answers, Snapshot } from './diagnosis';

export type SnapshotResponse = { snapshot: Snapshot | null };
type Localized = { es: string; en: string };

const WHO = new Set(['individual', 'earner', 'company', 'enterprise']);
const SIDES = new Set(['personal', 'business']);
const LADDERS = new Set(['starter', 'pro', 'operator', 'owner', 'exit']);
const MAX_ANSWER_KEYS = 80;
const MAX_BODY_BYTES = 16_384;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, maxLength = 500): value is string {
  return typeof value === 'string' && value.length <= maxLength;
}

function localized(value: unknown): value is Localized {
  return isRecord(value) && text(value.es) && text(value.en);
}

function localizedList(value: unknown, maxItems = 20): value is Localized[] {
  return Array.isArray(value) && value.length <= maxItems && value.every(localized);
}

function stringList(value: unknown, maxItems = 30): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => text(item, 120));
}

function localHref(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 1000 || !value.startsWith('/') || value.startsWith('//') ||
      value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return false;
  try { return new URL(value, 'https://ark.local').origin === 'https://ark.local'; } catch { return false; }
}

function action(value: unknown): boolean {
  return isRecord(value) && localized(value.label) && localHref(value.href);
}

function experience(value: unknown): boolean {
  return isRecord(value) && localized(value.recipients) && localized(value.kinds) && localized(value.prompt) &&
    (value.freq === undefined || localized(value.freq));
}

function isSnapshot(value: unknown): value is Snapshot {
  if (!isRecord(value) || !WHO.has(String(value.who)) || !SIDES.has(String(value.side)) ||
      typeof value.enterprise !== 'boolean' ||
      (value.ladder !== null && !LADDERS.has(String(value.ladder))) ||
      !localized(value.summary) || !localized(value.reason) ||
      !localizedList(value.strengths) || !localizedList(value.gaps) || !localizedList(value.opportunities) ||
      !Array.isArray(value.actions) || value.actions.length > 12 || !value.actions.every(action) ||
      !isRecord(value.course) || !text(value.course.id, 120) || !localized(value.course.reason) ||
      !localizedList(value.demand) || !localizedList(value.supply)) return false;

  if (value.dayPrompt !== undefined && !localized(value.dayPrompt)) return false;
  if (value.health !== undefined && (!isRecord(value.health) || typeof value.health.score !== 'number' ||
      !Number.isFinite(value.health.score) || value.health.score < 0 || value.health.score > 100 || !localized(value.health.metric))) return false;
  if (value.blueprint !== undefined && !stringList(value.blueprint)) return false;
  if (value.size !== undefined && !localized(value.size)) return false;
  if (value.experiences !== undefined && !experience(value.experiences)) return false;
  return true;
}

export function parseSnapshotRequest(value: unknown): { answers: Answers } | null {
  if (!isRecord(value) || Object.keys(value).length !== 1 || !isRecord(value.answers) ||
      Object.keys(value.answers).length > MAX_ANSWER_KEYS) return null;
  return { answers: value.answers as Answers };
}

export function parseSnapshotResponse(value: unknown): SnapshotResponse | null {
  if (!isRecord(value) || Object.keys(value).length !== 1 || !Object.prototype.hasOwnProperty.call(value, 'snapshot')) return null;
  if (value.snapshot === null) return { snapshot: null };
  return isSnapshot(value.snapshot) ? { snapshot: value.snapshot } : null;
}

export async function requestSnapshot(
  answers: Answers,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<Snapshot | null> {
  const input = parseSnapshotRequest({ answers });
  if (!input) throw new Error('Snapshot unavailable');
  try {
    const response = await fetcher('/api/snapshot', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'omit',
      cache: 'no-store',
      signal,
    });
    if (!response.ok) throw new Error('Snapshot unavailable');
    const payload: unknown = await response.json();
    const result = parseSnapshotResponse(payload);
    if (!result) throw new Error('Snapshot unavailable');
    return result.snapshot;
  } catch {
    throw new Error('Snapshot unavailable');
  }
}

export function isSnapshotRequestWithinLimit(raw: string): boolean {
  return raw.length > 0 && new TextEncoder().encode(raw).byteLength <= MAX_BODY_BYTES;
}
