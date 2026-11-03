"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/client";
import { supabaseReady } from "@/lib/supabase/config";

type RequestMode = "register" | "recovery";

export function AuthEmailRequest({ locale, mode }: { locale: Locale; mode: RequestMode }) {
  const t = dict(locale).auth;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const isRecovery = mode === "recovery";

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    if (!supabaseReady) {
      setError(t.notReady);
      return;
    }
    inFlight.current = true;
    setState("sending");
    setError(null);
    let requestError: { status?: number } | null = null;
    try {
      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("purpose", isRecovery ? "recovery" : "setup");
      if (isRecovery) {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: callback.toString() });
        requestError = authError;
      } else {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true, emailRedirectTo: callback.toString() },
        });
        requestError = authError;
      }
    } catch {
      requestError = {};
    }
    if (requestError) {
      inFlight.current = false;
      setState("idle");
      setError(requestError.status === 429 ? t.tooMany : t.genericError);
      return;
    }
    setState("sent");
  }

  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-gold/30 bg-gradient-to-br from-[#241e15] via-[#121110] to-ink p-5">
      <div>
        <h1 className="font-display text-[30px] leading-tight font-semibold text-white">
          {isRecovery ? t.recoveryTitle : t.registerTitle}
        </h1>
        <p className="mt-1 text-[15px] text-cream/80">{isRecovery ? t.recoverySub : t.registerSub}</p>
      </div>
      {state === "sent" ? (
        <p role="status" className="rounded-[18px] bg-teal/10 px-4 py-3 text-[15px] leading-snug text-teal">
          {t.emailRequestSent}
        </p>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-2.5">
          <label htmlFor={`${mode}-email`} className="sr-only">{t.email}</label>
          <input
            id={`${mode}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t.email}
            className="h-[52px] rounded-full border border-white/10 bg-ink/60 px-5 text-base text-cream outline-none placeholder:text-mute focus:border-gold/60"
          />
          <button type="submit" disabled={state === "sending"} className="gold-grad h-[52px] rounded-full text-base font-bold text-ink disabled:opacity-60">
            {state === "sending" ? t.sending : isRecovery ? t.recoverySend : t.registerSend}
          </button>
        </form>
      )}
      {error && <p role="alert" className="text-sm text-[#E07A8F]">{error}</p>}
      <Link href="/entrar" className="text-center text-sm font-semibold text-cream/70 underline-offset-4 hover:underline">
        {t.backToSignIn}
      </Link>
    </section>
  );
}
