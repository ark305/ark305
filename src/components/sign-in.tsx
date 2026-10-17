"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { archie, writeTokenCookie } from "@/lib/archie/browser";
import { archieReady } from "@/lib/archie/config";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";

type Step = "signin" | "signup" | "confirm" | "forgot" | "reset";
type ErrKey = keyof ReturnType<typeof dict>["auth"]["errors"];

// Archie devuelve códigos estables; los traducimos a mensajes claros.
function errorKey(e: unknown): ErrKey {
  const code = (e as { code?: string } | null)?.code ?? "";
  if (code === "AUTH_INVALID_CREDENTIALS") return "credentials";
  if (code === "AUTH_EMAIL_EXISTS") return "exists";
  if (code === "VALIDATION_ERROR") return "weak";
  if (code === "AUTH_INVALID_CODE") return "code";
  if (code === "AUTH_ACCOUNT_LOCKED") return "locked";
  if (code === "RATE_LIMIT_EXCEEDED") return "tooMany";
  return "generic";
}

const input = "h-[52px] rounded-full border border-white/10 bg-ink/60 px-5 text-base text-cream outline-none placeholder:text-mute focus:border-gold/60";

// Entrar con correo y contraseña (Archie Auth).
export function SignIn({ locale, next = "/perfil" }: { locale: Locale; next?: string }) {
  const t = dict(locale).auth;
  const router = useRouter();
  const [step, setStep] = useState<Step>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function go(s: Step) {
    setStep(s);
    setError(null);
    setNote(null);
  }

  // Sesión abierta: la cookie le dice al servidor quién eres y vamos a tu perfil.
  function enter() {
    writeTokenCookie(archie().auth.getSession());
    router.replace(next);
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!archieReady) return setError(t.notReady);
    const auth = archie().auth;
    const mail = email.trim().toLowerCase();
    setBusy(true);
    setError(null);
    const codeOf = (err: unknown) => (err as { code?: string } | null)?.code;
    try {
      if (step === "signin" || step === "signup") {
        // Sin verificación de correo, la cuenta nueva queda lista y entramos de una vez.
        if (step === "signup") await auth.signUp({ email: mail, password, locale });
        try {
          await auth.signIn({ email: mail, password });
        } catch (err) {
          if (codeOf(err) !== "AUTH_EMAIL_NOT_VERIFIED") throw err;
          setNote(t.codeSent(mail));
          return setStep("confirm");
        }
        return enter();
      }
      if (step === "confirm") {
        await auth.confirmSignUp({ email: mail, code: code.trim() });
        return enter();
      }
      if (step === "forgot") {
        await auth.recoverPassword({ email: mail, locale });
        setNote(t.resetSent(mail));
        return setStep("reset");
      }
      if (step === "reset") {
        await auth.resetPassword({ email: mail, code: code.trim(), password });
        setPassword("");
        setCode("");
        setStep("signin");
        return setNote(t.resetDone);
      }
    } catch (err) {
      setError(t.errors[errorKey(err)]);
    } finally {
      setBusy(false);
    }
  }

  const needsPassword = step === "signin" || step === "signup" || step === "reset";
  const needsCode = step === "confirm" || step === "reset";
  const label = { signin: t.signIn, signup: t.signUp, confirm: t.confirm, forgot: t.confirm, reset: t.reset }[step];

  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-gold/30 bg-gradient-to-br from-[#241e15] via-[#121110] to-ink p-5">
      <div>
        <h2 className="font-display text-[30px] leading-tight font-semibold text-white">{t.title}</h2>
        <p className="mt-1 text-[15px] text-cream/80">{step === "signup" ? t.subUp : t.sub}</p>
        <p className="mt-2 text-[13px] leading-snug text-mute">{t.why}</p>
      </div>
      {note && (
        <p role="status" className="rounded-[18px] bg-teal/10 px-4 py-3 text-[15px] leading-snug text-teal">
          {note}
        </p>
      )}
      <form onSubmit={submit} className="flex flex-col gap-2.5">
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
          readOnly={step === "confirm" || step === "reset"}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email}
          className={input}
        />
        {needsCode && (
          <>
            <label htmlFor="code" className="sr-only">
              {t.code}
            </label>
            <input
              id="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder={t.code}
              className={`${input} tracking-[0.3em]`}
            />
          </>
        )}
        {needsPassword && (
          <>
            <label htmlFor="password" className="sr-only">
              {step === "reset" ? t.newPassword : t.password}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={step === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={step === "reset" ? t.newPassword : t.password}
              className={input}
            />
            {step !== "signin" && <p className="px-2 text-[12px] text-mute">{t.passwordHint}</p>}
          </>
        )}
        <button type="submit" disabled={busy} className="gold-grad h-[52px] rounded-full text-base font-bold text-ink disabled:opacity-60">
          {busy ? t.working : label}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-[#E07A8F]">
          {error}
        </p>
      )}
      <div className="flex flex-col items-center gap-2 text-sm font-semibold text-cream/70">
        {step === "signin" && (
          <>
            <button type="button" onClick={() => go("signup")} className="underline-offset-4 hover:underline">
              {t.toSignUp}
            </button>
            <button type="button" onClick={() => go("forgot")} className="text-mute underline-offset-4 hover:underline">
              {t.forgot}
            </button>
          </>
        )}
        {step === "signup" && (
          <button type="button" onClick={() => go("signin")} className="underline-offset-4 hover:underline">
            {t.toSignIn}
          </button>
        )}
        {(step === "confirm" || step === "forgot" || step === "reset") && (
          <button type="button" onClick={() => go("signin")} className="underline-offset-4 hover:underline">
            {t.back}
          </button>
        )}
        <Link href="/@lente305" className="underline-offset-4 hover:underline">
          {t.example}
        </Link>
      </div>
    </section>
  );
}
