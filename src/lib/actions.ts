'use server';

// Web adapters retain session cookies and navigation; profile business rules live in Nest.
import { refresh, revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { parseSide } from './mode';
import { supabaseReady } from './supabase/config';
import { createClient } from './supabase/server';
import { backendApi, BackendApiError } from './backend-api';

export type FormState = { error?: 'auth' | 'name' | 'handle' | 'title' | 'price' | 'photo' | 'generic'; ok?: boolean } | undefined;
type ErrorKey = NonNullable<FormState>['error'];
const fail = (error: ErrorKey): FormState => ({ error: error ?? 'generic' });

async function currentUser() {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  const { data: user } = await supabase.auth.getUser();
  const sessionUserId = session.session?.user?.id;
  if (!session.session?.access_token || !sessionUserId || user.user?.id !== sessionUserId) {
    return { supabase, user: null, token: null };
  }
  return { supabase, user: user.user, token: session.session.access_token };
}

function formError(error: unknown): ErrorKey {
  if (error instanceof BackendApiError && error.code) return error.code;
  return 'generic';
}

export async function checkHandle(handle: string): Promise<'available' | 'taken' | 'invalid'> {
  const h = handle.trim().toLowerCase();
  const { token } = await currentUser();
  if (!token) return 'invalid';
  try {
    const result = await backendApi<{ status: 'available' | 'taken' | 'invalid' }>(`profiles/check-handle?handle=${encodeURIComponent(h)}`, { token });
    return result.status;
  } catch { return 'invalid'; }
}

export async function createProfile(_: FormState, form: FormData): Promise<FormState> {
  const { token } = await currentUser();
  if (!token) return fail('auth');
  try {
    await backendApi('profiles/me', { token, method: 'POST', body: {
      name: formText(form, 'name'), handle: formText(form, 'handle'), kind: formText(form, 'kind'),
      role: formText(form, 'role'), area: formText(form, 'area'), photo_url: formText(form, 'photo_url'),
    } });
  } catch (error) { return fail(formError(error)); }
  revalidatePath('/', 'layout');
  redirect('/diagnostico');
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const { token } = await currentUser();
  if (!token) return fail('auth');
  try {
    await backendApi('profiles/me', { token, method: 'PATCH', body: {
      name: formText(form, 'name'), handle: formText(form, 'handle'), kind: formText(form, 'kind'),
      role: formText(form, 'role'), area: formText(form, 'area'), tagline: formText(form, 'tagline'),
      photo_url: formText(form, 'photo_url'), banner_url: formText(form, 'banner_url'), gallery: form.getAll('gallery').map(String),
      instagram: formText(form, 'instagram'), tiktok: formText(form, 'tiktok'), facebook: formText(form, 'facebook'),
    } });
  } catch (error) { return fail(formError(error)); }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function saveService(_: FormState, form: FormData): Promise<FormState> {
  const { token } = await currentUser();
  if (!token) return fail('auth');
  const id = formText(form, 'id');
  try {
    await backendApi(id ? `profiles/me/services/${encodeURIComponent(id)}` : 'profiles/me/services', { token, method: id ? 'PATCH' : 'POST', body: {
      title: formText(form, 'title'), price: formText(form, 'price'), action: formText(form, 'action'),
      kicker: formText(form, 'kicker'), detail: formText(form, 'detail'), photo_url: formText(form, 'photo_url'),
    } });
  } catch (error) { return fail(formError(error)); }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function deleteService(id: string) {
  const { token } = await currentUser();
  if (token) await backendApi(`profiles/me/services/${encodeURIComponent(id)}`, { token, method: 'DELETE' }).catch(() => undefined);
  revalidatePath('/', 'layout');
}

export async function markStep(step: 'bio_link' | 'shared') {
  const { token } = await currentUser();
  if (token) await backendApi(`profiles/me/steps/${step}`, { token, method: 'PATCH' }).catch(() => undefined);
  refresh();
}

export async function signOut() {
  const { supabase } = await currentUser();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function saveTaste(taste: Record<string, number>) {
  if (!supabaseReady) return;
  const { token } = await currentUser();
  if (token) await backendApi('profiles/me/taste', { token, method: 'PATCH', body: { taste } }).catch(() => undefined);
}

export async function saveSide(value: string) {
  const side = parseSide(value);
  if (!side) return;
  const jar = await cookies();
  jar.set('side', side, { path: '/', maxAge: 31536000, sameSite: 'lax' });
  if (supabaseReady) {
    const { token } = await currentUser();
    if (token) await backendApi('profiles/me/side', { token, method: 'PATCH', body: { side } }).catch(() => undefined);
  }
  revalidatePath('/', 'layout');
}

export async function saveDiagnosis(raw: unknown, applySideOrExpectedUser: boolean | string = true, expectedUserId?: string): Promise<boolean> {
  const applySide = typeof applySideOrExpectedUser === 'boolean' ? applySideOrExpectedUser : true;
  const boundUserId = typeof applySideOrExpectedUser === 'string' ? applySideOrExpectedUser : expectedUserId;
  if (!supabaseReady) return false;
  const { user, token } = await currentUser();
  if (!user || !token || (boundUserId && user.id !== boundUserId)) return false;
  try {
    const result = await backendApi<{ ok: boolean; side?: 'personal' | 'business' }>('profiles/me/diagnosis', { token, method: 'PUT', body: { answers: raw, applySide, expectedUserId: boundUserId } });
    if (!result.ok) return false;
    if (applySide && result.side) {
      const jar = await cookies();
      jar.set('side', result.side, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    }
  } catch { return false; }
  revalidatePath('/', 'layout');
  return true;
}

export async function clearDiagnosis() {
  if (!supabaseReady) return;
  const { token } = await currentUser();
  if (token) await backendApi('profiles/me/diagnosis', { token, method: 'DELETE' }).catch(() => undefined);
  revalidatePath('/', 'layout');
}

function formText(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim();
}
