"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseReady } from "@/lib/supabase/config";
import { dict } from "@/lib/dict";
import { getItem } from "@/lib/catalog";
import type { Locale } from "@/lib/locale";
import { changeRequest, InboxError, nextStatuses, readHistory, readInbox, type InboxRequest, type RequestEvent, type RequestStatus } from "@/lib/requests-inbox";

type Session = { userId: string; token: string };
const buttonClass = "min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-teal disabled:opacity-50";

export function RequestsInbox({ locale }: { locale: Locale }) {
  const dictionary = dict(locale);
  const t = dictionary.requests;
  const states = dictionary.day.requestStates;
  const [authenticated, setAuthenticated] = useState<boolean | null>(supabaseReady ? null : false);
  const [data, setData] = useState<{ admin: boolean; items: InboxRequest[] } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [events, setEvents] = useState<RequestEvent[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"unavailable" | "conflict" | "uncertain" | "login" | null>(null);
  const [locked, setLocked] = useState(false);
  const session = useRef<Session | null>(null);
  const operation = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const writing = useRef(false);

  const begin = useCallback(() => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const revision = ++operation.current;
    return { signal: controller.signal, current: () => revision === operation.current && !controller.signal.aborted };
  }, []);

  const refresh = useCallback(async () => {
    if (!session.current || writing.current) return;
    const token = session.current.token;
    const op = begin();
    setBusy(true); setError(null); setSelected(null); setEvents(null); setData(null);
    try {
      const result = await readInbox(token, fetch, op.signal);
      if (op.current()) { setData(result); setLocked(false); }
    } catch (cause) {
      if (op.current()) setError(cause instanceof InboxError && cause.status === 401 ? "login" : "unavailable");
    } finally { if (op.current()) setBusy(false); }
  }, [begin]);

  useEffect(() => {
    if (!supabaseReady) return;
    const { data: subscription } = createClient().auth.onAuthStateChange((_event, value) => {
      const next = value ? { userId: value.user.id, token: value.access_token } : null;
      if (next && session.current?.userId === next.userId && session.current.token === next.token) return;
      abort.current?.abort(); ++operation.current; writing.current = false;
      session.current = next;
      setAuthenticated(!!next); setData(null); setSelected(null); setEvents(null); setError(null); setLocked(false); setBusy(false);
      if (next) void Promise.resolve().then(() => { if (session.current === next) return refresh(); });
    });
    return () => {
      subscription.subscription.unsubscribe(); abort.current?.abort(); ++operation.current; session.current = null;
    };
  }, [refresh]);

  async function details(item: InboxRequest) {
    if (!session.current || writing.current || !data) return;
    const op = begin();
    setBusy(true); setSelected(item.id); setEvents(null); setError(null);
    try {
      const result = await readHistory(item.id, data.admin, session.current.token, fetch, op.signal);
      if (op.current()) setEvents(result);
    } catch (cause) {
      if (op.current()) setError(cause instanceof InboxError && cause.status === 401 ? "login" : "unavailable");
    } finally { if (op.current()) setBusy(false); }
  }

  async function transition(item: InboxRequest, status: RequestStatus) {
    if (!session.current || !data?.admin || writing.current || locked || busy) return;
    writing.current = true;
    const op = begin();
    const token = session.current.token;
    setBusy(true); setError(null); setSelected(null); setEvents(null);
    try {
      await changeRequest(item, status, token, fetch, op.signal);
      if (!op.current()) return;
      const result = await readInbox(token, fetch, op.signal);
      if (op.current()) setData(result);
    } catch (cause) {
      if (op.current()) {
        setLocked(true);
        setError(cause instanceof InboxError && cause.status === 409 ? "conflict" : cause instanceof InboxError && cause.status === 401 ? "login" : "uncertain");
      }
    } finally { if (op.current()) { writing.current = false; setBusy(false); } }
  }

  return <section className="space-y-4 px-5 pt-6">
    <h1 className="text-2xl font-bold text-white">{t.title}</h1>
    <p className="text-sm text-mute">{t.disclaimer}</p>
    {authenticated === null ? <p role="status">{t.loading}</p> : !authenticated ?
      <Link href="/entrar" className={buttonClass}>{t.login}</Link> : <>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-cream">{data ? data.admin ? t.admin : t.personal : ""}</p>
          <button type="button" onClick={refresh} disabled={busy} className={buttonClass}>{t.refresh}</button>
        </div>
        {error && <p role="alert" className="text-sm text-cream">{t[error]}</p>}
        {error === "login" && <Link href="/entrar" className={buttonClass}>{t.login}</Link>}
        {busy && <p role="status" className="text-sm text-mute">{t.loading}</p>}
        {data?.items.length === 0 && !busy && <p className="text-mute">{t.empty}</p>}
        <ul className="space-y-3">{data?.items.map((item) => <li key={item.id} className="space-y-3 rounded-3xl border border-line bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-bold text-white">{getItem(item.serviceId)?.name[locale] ?? item.serviceId}</h2>
            <span className="text-sm text-teal">{states[item.status]}</span>
          </div>
          <p className="text-sm text-cream">{item.requestedDate} · {item.guests} {t.guests}</p>
          <p className="break-words text-sm text-mute">{item.preferences}</p>
          <p className="break-all text-xs text-mute">#{item.id}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => details(item)} disabled={busy} aria-expanded={selected === item.id} className={buttonClass}>{t.detail}</button>
            {data.admin && nextStatuses(item.status).map((status) => <button type="button" key={status} onClick={() => transition(item, status)} disabled={busy || locked} className={buttonClass}>{t.actions[status as keyof typeof t.actions]}</button>)}
          </div>
          {selected === item.id && <div className="space-y-2 border-t border-line pt-3">
            <h3 className="text-sm font-bold text-white">{t.history}</h3>
            <p className="text-xs text-mute">{t.created}: <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString(locale)}</time></p>
            {events && <ol className="space-y-2">{events.map((event) => <li key={event.id} className="text-sm text-cream">
              {states[event.fromStatus]} → {states[event.toStatus]}<br />
              <time className="text-xs text-mute" dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString(locale)}</time>
            </li>)}</ol>}
          </div>}
        </li>)}</ul>
      </>}
  </section>;
}
