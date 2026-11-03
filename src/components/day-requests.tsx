"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DayEntry } from "@/lib/catalog";
import { getItem } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/client";
import { supabaseReady } from "@/lib/supabase/config";
import { createServiceRequest, isCalendarDate, listServiceRequests, ServiceRequestError, type ServiceRequest, type ServiceRequestInput } from "@/lib/service-requests";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";

type SessionSnapshot = { userId: string; accessToken: string; revision: number };
type EntryStatus = { state: "sending" | "received" | "uncertain" | "rejected"; requestDate: string; request?: ServiceRequest };

function localDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function inputFor(entry: DayEntry, requestedDate: string): ServiceRequestInput {
  return {
    serviceId: entry.id,
    requestedDate,
    guests: entry.guests,
    preferences: `Requested time: ${entry.time}; quantity: ${entry.qty}`,
  };
}

function matchesEntry(request: ServiceRequest, entry: DayEntry, requestedDate: string): boolean {
  const expected = inputFor(entry, requestedDate);
  return request.serviceId === expected.serviceId && request.requestedDate === expected.requestedDate &&
    request.guests === expected.guests && request.preferences === (expected.preferences ?? "");
}

function mergeHistory(serverItems: ServiceRequest[], currentItems: ServiceRequest[]): ServiceRequest[] {
  const merged = new Map(serverItems.map((item) => [item.id, item]));
  for (const item of currentItems) merged.set(item.id, item);
  return [...merged.values()]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.id.localeCompare(left.id))
    .slice(0, 50);
}

export function DayRequests({ locale, entries }: { locale: Locale; entries: DayEntry[] }) {
  const t = dict(locale).day;
  const [requestedDate, setRequestedDate] = useState(localDate);
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [authLoaded, setAuthLoaded] = useState(!supabaseReady);
  const [history, setHistory] = useState<ServiceRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [entryStatuses, setEntryStatuses] = useState<Record<string, EntryStatus>>({});
  const [sending, setSending] = useState(false);
  const [dateLocked, setDateLocked] = useState(false);
  const [message, setMessage] = useState("");
  const sessionRef = useRef<SessionSnapshot | null>(null);
  const revisionRef = useRef(0);
  const historyWriteRevisionRef = useRef(0);
  const sendIdRef = useRef(0);
  const sendingRef = useRef(false);
  const requestedDateLockRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const statusesRef = useRef<Record<string, EntryStatus>>({});
  const entriesRef = useRef(entries);
  const requestedDateRef = useRef(requestedDate);

  const updateStatuses = useCallback((update: (current: Record<string, EntryStatus>) => Record<string, EntryStatus>) => {
    const next = update(statusesRef.current);
    statusesRef.current = next;
    setEntryStatuses(next);
  }, []);

  const reconcileHistory = useCallback((items: ServiceRequest[], date: string) => {
    updateStatuses((current) => {
      const next = { ...current };
      for (const entry of entriesRef.current) {
        if (items.some((item) => matchesEntry(item, entry, date))) {
          const match = items.find((item) => matchesEntry(item, entry, date));
          if (match) next[entry.uid] = { state: "received", requestDate: date, request: match };
        }
      }
      return next;
    });
  }, [updateStatuses]);

  const loadHistory = useCallback(async (snapshot: SessionSnapshot, date = requestedDateRef.current) => {
    const writeRevisionAtReadStart = historyWriteRevisionRef.current;
    setHistoryLoading(true);
    setMessage("");
    try {
      const items = await listServiceRequests(snapshot.accessToken);
      if (sessionRef.current?.revision !== snapshot.revision) return;
      setHistory((current) => writeRevisionAtReadStart === historyWriteRevisionRef.current ? items : mergeHistory(items, current));
      reconcileHistory(items, date);
    } catch (error) {
      if (sessionRef.current?.revision !== snapshot.revision) return;
      setMessage(error instanceof ServiceRequestError && error.kind === "auth" ? t.requestSignIn : t.historyError);
    } finally {
      if (sessionRef.current?.revision === snapshot.revision) setHistoryLoading(false);
    }
  }, [reconcileHistory, t.historyError, t.requestSignIn]);

  useEffect(() => {
    entriesRef.current = entries;
    requestedDateRef.current = requestedDate;
  }, [entries, requestedDate]);

  useEffect(() => {
    if (!supabaseReady) {
      return;
    }
    const client = createClient();
    let active = true;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setAuthLoaded(true);
      const userId = nextSession?.user?.id;
      const accessToken = nextSession?.access_token;
      const previous = sessionRef.current;
      if (!userId || !accessToken) {
        if (previous) {
          revisionRef.current++;
          sendIdRef.current++;
          sendingRef.current = false;
          sessionRef.current = null;
          controllerRef.current?.abort();
          setSession(null);
          setHistory([]);
          statusesRef.current = {};
          setEntryStatuses({});
          setHistoryLoading(false);
          setSending(false);
          setMessage("");
        }
        return;
      }
      if (previous?.userId === userId && previous.accessToken === accessToken) return;

      const changedUser = previous?.userId !== userId;
      const snapshot = { userId, accessToken, revision: ++revisionRef.current };
      sessionRef.current = snapshot;
      controllerRef.current?.abort();
      setSession(snapshot);
      sendIdRef.current++;
      sendingRef.current = false;
      setSending(false);
      if (changedUser) {
        setHistory([]);
        statusesRef.current = {};
        setEntryStatuses({});
        setMessage("");
      } else {
        const hadInFlightRequest = Object.values(statusesRef.current).some((status) => status.state === "sending");
        if (hadInFlightRequest) {
          updateStatuses((current) => Object.fromEntries(Object.entries(current).map(([uid, status]) => [
            uid,
            status.state === "sending" ? { ...status, state: "uncertain" as const } : status,
          ])));
          setMessage(t.uncertainResult);
        }
      }
      void Promise.resolve().then(() => loadHistory(snapshot));
    });
    return () => {
      active = false;
      subscription.unsubscribe();
      sendingRef.current = false;
      sessionRef.current = null;
      controllerRef.current?.abort();
    };
  }, [loadHistory, t.historyError, t.requestSignIn, t.uncertainResult, updateStatuses]);

  async function sendRequests() {
    const snapshot = sessionRef.current;
    if (!snapshot || !entries.length || sendingRef.current) return;
    const lockedDate = requestedDateLockRef.current;
    if (!isCalendarDate(lockedDate ?? requestedDate)) {
      setMessage(t.invalidDate);
      return;
    }
    if (lockedDate && requestedDate !== lockedDate) setRequestedDate(lockedDate);
    const dateForRequestSet = lockedDate ?? requestedDate;
    requestedDateLockRef.current = dateForRequestSet;
    setDateLocked(true);
    const pending = entries.filter((entry) => {
      const status = statusesRef.current[entry.uid];
      return status?.state !== "received" && status?.state !== "uncertain" && status?.state !== "sending";
    });
    if (!pending.length) return;

    sendingRef.current = true;
    const sendId = ++sendIdRef.current;
    setSending(true);
    setMessage("");
    try {
      for (const entry of pending) {
        if (sessionRef.current?.revision !== snapshot.revision) break;
        const controller = new AbortController();
        controllerRef.current = controller;
        updateStatuses((current) => ({ ...current, [entry.uid]: { state: "sending", requestDate: dateForRequestSet } }));
        try {
          const item = await createServiceRequest(inputFor(entry, dateForRequestSet), snapshot.accessToken, fetch, controller.signal);
          if (sessionRef.current?.revision !== snapshot.revision) break;
          updateStatuses((current) => ({ ...current, [entry.uid]: { state: "received", requestDate: dateForRequestSet, request: item } }));
          historyWriteRevisionRef.current++;
          setHistory((current) => mergeHistory([item], current));
        } catch (error) {
          if (sessionRef.current?.revision !== snapshot.revision) break;
          const uncertain = !(error instanceof ServiceRequestError) || error.kind === "uncertain";
          updateStatuses((current) => ({
            ...current,
            [entry.uid]: { state: uncertain ? "uncertain" : "rejected", requestDate: dateForRequestSet },
          }));
          setMessage(uncertain ? t.uncertainResult : error instanceof ServiceRequestError && error.kind === "auth" ? t.requestSignIn : t.requestRejected);
          break;
        }
      }
    } finally {
      if (sendIdRef.current === sendId) {
        sendingRef.current = false;
        if (sessionRef.current?.revision === snapshot.revision) setSending(false);
      }
    }
  }

  const receivedCount = entries.filter((entry) => entryStatuses[entry.uid]?.state === "received").length;
  const buttonLabel = sending ? t.sendingRequests : receivedCount ? t.sendRemaining : t.sendRequests;

  return (
    <section className="flex flex-col gap-3 rounded-[22px] border border-white/10 bg-white/[0.035] p-4" aria-labelledby="service-requests-title">
      <div>
        <h3 id="service-requests-title" className="text-lg font-bold text-white">{t.requestTitle}</h3>
        <p className="mt-1 text-sm text-mute">{t.requestDisclaimer}</p>
      </div>
      {!supabaseReady ? (
        <p role="status" className="text-sm text-cream">{t.requestUnavailable}</p>
      ) : !authLoaded ? (
        <p role="status" className="text-sm text-cream">{t.checkingSession}</p>
      ) : !session ? (
        <p role="status" className="text-sm text-cream">{t.requestSignIn} <a href="/entrar" className="underline">{t.aiLogin}</a></p>
      ) : (
        <>
          {entries.length > 0 && (
            <>
              <label htmlFor="service-request-date" className="flex flex-col gap-1 text-sm text-cream">
                {t.requestDate}
                <input
                  id="service-request-date"
                  type="date"
                  value={requestedDate}
                  disabled={sending || dateLocked}
                  onChange={(event) => {
                    if (requestedDateLockRef.current === null) setRequestedDate(event.target.value);
                  }}
                  className="h-11 rounded-xl border border-white/15 bg-ink px-3 text-base text-white"
                />
              </label>
              <ul className="flex flex-col gap-2">
                {entries.map((entry) => {
                  const item = getItem(entry.id);
                  if (!item) return null;
                  const status = entryStatuses[entry.uid];
                  const statusText = status?.state === "received" ? `${t.received}: ${status.request?.requestedDate ?? status.requestDate}`
                    : status?.state === "sending" ? t.sendingRequests
                      : status?.state === "uncertain" ? t.uncertainResult
                        : status?.state === "rejected" ? t.requestRejected : t.notSubmitted;
                  return (
                    <li key={entry.uid} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate text-cream">{item.name[locale]} · {entry.time} · {entry.qty}</span>
                      <span className="shrink-0 text-mute" role="status">{statusText}</span>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={sendRequests}
                disabled={sending || entries.every((entry) => ["received", "uncertain"].includes(entryStatuses[entry.uid]?.state ?? ""))}
                className="h-11 rounded-full bg-teal px-4 text-sm font-bold text-ink disabled:opacity-50"
              >
                {buttonLabel}
              </button>
            </>
          )}
          {message && <p role="alert" className="text-sm text-cream">{message}</p>}
          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <h4 className="text-sm font-bold text-white"><a href="/solicitudes" className="underline">{t.requestHistory}</a></h4>
            <button type="button" onClick={() => sessionRef.current && void loadHistory(sessionRef.current)} disabled={historyLoading} className="text-sm text-teal underline disabled:opacity-50">
              {historyLoading ? t.loadingHistory : t.refreshHistory}
            </button>
          </div>
          {historyLoading && history.length === 0 ? (
            <p role="status" className="text-sm text-mute">{t.loadingHistory}</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-mute">{t.emptyHistory}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((item) => (
                <li key={item.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm">
                  <span className="font-semibold text-white">{getItem(item.serviceId)?.name[locale] ?? item.serviceId}</span>
                  <span className="ml-2 text-cream">{item.requestedDate}</span>
                  <span className="ml-2 text-mute">{t.requestStates[item.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
