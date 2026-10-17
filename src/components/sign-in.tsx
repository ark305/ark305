"use client";

import Link from "next/link";
import { useState } from "react";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/client";
import { supabaseReady } from "@/lib/supabase/config";

// Entrar con un enlace al correo (sin contraseñas), como en la versión anterior.
export function SignIn({ locale, next = "/perfil", linkError }: { locale: Locale; next?: string; linkError?: boolean }) {
  const t = dict(locale).auth;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(linkError ? t.linkError : null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseReady) return setError(t.notReady);
    setState("sending");
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setState("idle");
      setError(error.status === 429 ? t.tooMany : t.error);
      return;
    }
    setState("sent");
  }

  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-gold/30 bg-gradient-to-br from-[#241e15] via-[#121110] to-ink p-5">
      <div>
        <h2 className="font-display text-[30px] leading-tight font-semibold text-white">{t.title}</h2>
        <p className="mt-1 text-[15px] text-cream/80">{t.sub}</p>
        <p className="mt-2 text-[13px] leading-snug text-mute">{t.why}</p>
      </div>
      {state === "sent" ? (
        <div className="flex flex-col gap-3" role="status">
          <p className="rounded-[18px] bg-teal/10 px-4 py-3 text-[15px] leading-snug text-teal">{t.sent(email.trim())}</p>
          <button type="button" onClick={() => setState("idle")} className="h-11 rounded-full border border-white/15 text-sm font-semibold text-cream">
            {t.again}
          </button>
        </div>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-2.5">
          <label htmlFor="email" className="sr-only">
            {t.email}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.email}
            className="h-[52px] rounded-full border border-white/10 bg-ink/60 px-5 text-base text-cream outline-none placeholder:text-mute focus:border-gold/60"
          />
          <button type="submit" disabled={state === "sending"} className="gold-grad h-[52px] rounded-full text-base font-bold text-ink disabled:opacity-60">
            {state === "sending" ? t.sending : t.send}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-[#E07A8F]">
          {error}
        </p>
      )}
      <Link href="/@lente305" className="text-center text-sm font-semibold text-cream/70 underline-offset-4 hover:underline">
        {t.example}
      </Link>
    </section>
  );
}
