"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/client";
import { supabaseReady } from "@/lib/supabase/config";
import { safeLocalNext } from "@/lib/auth-flow";

export function SignIn({ locale, next = "/diagnostico", linkError, passwordCreated = false }: {
  locale: Locale;
  next?: string;
  linkError?: boolean;
  passwordCreated?: boolean;
}) {
  const t = dict(locale).auth;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "signing-in">("idle");
  const [error, setError] = useState<string | null>(linkError ? t.linkError : null);
  const inFlight = useRef(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    if (!supabaseReady) return setError(t.notReady);
    inFlight.current = true;
    setState("signing-in");
    setError(null);
    let authError: { status?: number } | null = null;
    try {
      const result = await createClient().auth.signInWithPassword({ email: email.trim(), password });
      authError = result.error;
    } catch {
      authError = {};
    }
    if (authError) {
      inFlight.current = false;
      setState("idle");
      setError(authError.status === 429 ? t.tooMany : t.signInError);
      return;
    }
    router.replace(safeLocalNext(next));
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-gold/30 bg-gradient-to-br from-[#241e15] via-[#121110] to-ink p-5">
      <div>
        <h2 className="font-display text-[30px] leading-tight font-semibold text-white">{t.title}</h2>
        <p className="mt-1 text-[15px] text-cream/80">{t.signInSub}</p>
        <p className="mt-2 text-[13px] leading-snug text-mute">{t.why}</p>
      </div>
      {passwordCreated && <p role="status" className="rounded-[18px] bg-teal/10 px-4 py-3 text-[15px] text-teal">{t.passwordCreated}</p>}
      <form onSubmit={signIn} className="flex flex-col gap-2.5">
        <label htmlFor="email" className="sr-only">{t.email}</label>
        <input
          id="email"
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
        <label htmlFor="password" className="sr-only">{t.password}</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t.password}
          className="h-[52px] rounded-full border border-white/10 bg-ink/60 px-5 text-base text-cream outline-none placeholder:text-mute focus:border-gold/60"
        />
        <button type="submit" disabled={state === "signing-in"} className="gold-grad h-[52px] rounded-full text-base font-bold text-ink disabled:opacity-60">
          {state === "signing-in" ? t.signingIn : t.signIn}
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-[#E07A8F]">{error}</p>}
      <nav className="flex flex-col gap-2 text-center text-sm">
        <Link href="/crear-cuenta" className="font-semibold text-cream underline-offset-4 hover:underline">{t.requestAccount}</Link>
        <Link href="/recuperar-contrasena" className="font-semibold text-cream/70 underline-offset-4 hover:underline">{t.forgotPassword}</Link>
      </nav>
      <Link href="/@lente305" className="text-center text-sm font-semibold text-cream/70 underline-offset-4 hover:underline">
        {t.example}
      </Link>
    </section>
  );
}
