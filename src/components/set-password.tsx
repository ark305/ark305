"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { isPasswordAllowed } from "@/lib/auth-flow";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_KEY, SUPABASE_URL, supabaseReady } from "@/lib/supabase/config";

type EndSessionAction = (expectedUserId: string) => Promise<boolean>;

function createIsolatedAuthClient(accessToken: string, refreshToken: string) {
  const values = new Map<string, string>();
  const isolatedStorageKey = `ark-password-update-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const isolated = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => { values.set(key, value); },
        removeItem: (key) => { values.delete(key); },
      },
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: isolatedStorageKey,
    },
  });
  return {
    auth: isolated.auth,
    setSession: () => isolated.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }),
    // The session stays only in this client instance's memory; dispose without a remote sign-out.
    dispose: () => values.clear(),
  };
}

export function SetPassword({ locale, purpose, expectedUserId, endSession }: {
  locale: Locale;
  purpose: "setup" | "recovery";
  expectedUserId: string;
  endSession?: EndSessionAction;
}) {
  const t = dict(locale).auth;
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "invalid">("idle");
  const [error, setError] = useState<string | null>(null);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const inFlight = useRef(false);
  const signOutInFlight = useRef(false);
  const generation = useRef(0);
  const invalidated = useRef(false);
  const passwordUpdatedRef = useRef(false);
  const endingSession = useRef(false);

  const invalidateSession = useCallback(() => {
    if (invalidated.current) return;
    invalidated.current = true;
    generation.current += 1;
    inFlight.current = false;
    setPassword("");
    setConfirmation("");
    setState("invalid");
    setError(t.passwordUpdateError);
  }, [t.passwordUpdateError]);

  function isCurrent(operationGeneration: number) {
    return !invalidated.current && generation.current === operationGeneration;
  }

  useEffect(() => {
    if (!supabaseReady) return;
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (endingSession.current && event === "SIGNED_OUT" && !session) return;
      if (session?.user.id !== expectedUserId) invalidateSession();
    });
    return () => subscription.unsubscribe();
  }, [expectedUserId, invalidateSession]);

  async function finishSignOut(operationGeneration: number) {
    if (signOutInFlight.current || !isCurrent(operationGeneration)) return false;
    signOutInFlight.current = true;
    const supabase = createClient();
    try {
      const { data, error: identityError } = await supabase.auth.getUser();
      if (!isCurrent(operationGeneration)) return false;
      if (identityError || data.user?.id !== expectedUserId) {
        invalidateSession();
        return false;
      }
      endingSession.current = true;
      const signedOut = endSession
        ? await endSession(expectedUserId)
        : !(await supabase.auth.signOut({ scope: "local" })).error;
      if (!isCurrent(operationGeneration)) return false;
      if (!signedOut) {
        setError(t.passwordSignOutError);
        return false;
      }
    } catch {
      if (!isCurrent(operationGeneration)) return false;
      setError(t.passwordSignOutError);
      return false;
    } finally {
      endingSession.current = false;
      signOutInFlight.current = false;
    }
    router.replace("/entrar?password=created");
    router.refresh();
    return true;
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || invalidated.current) return;
    if (!supabaseReady) {
      setError(t.notReady);
      return;
    }
    if (passwordUpdatedRef.current) {
      await finishSignOut(generation.current);
      return;
    }
    if (!isPasswordAllowed(password)) {
      setError(t.passwordPolicyError);
      return;
    }
    if (password !== confirmation) {
      setError(t.passwordMismatch);
      return;
    }

    inFlight.current = true;
    const operationGeneration = generation.current;
    setState("saving");
    setError(null);
    let isolated: ReturnType<typeof createIsolatedAuthClient> | null = null;
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!isCurrent(operationGeneration)) return;
      if (sessionError || !session?.access_token || !session.refresh_token) {
        invalidateSession();
        return;
      }

      // The isolated client uses a per-instance storage key and nonpersistent session state,
      // so its auth events cannot alter the live browser client or revoke another session.
      isolated = createIsolatedAuthClient(session.access_token, session.refresh_token);
      const auth = isolated.auth;
      const { data, error: bindError } = await isolated.setSession();
      if (!isCurrent(operationGeneration)) return;
      if (bindError || data.user?.id !== expectedUserId) {
        invalidateSession();
        return;
      }

      const { data: { user }, error: boundIdentityError } = await auth.getUser();
      if (!isCurrent(operationGeneration)) return;
      if (boundIdentityError || user?.id !== expectedUserId) {
        invalidateSession();
        return;
      }

      // Also verify the live browser session immediately before the write. The isolated client
      // above keeps the actual update bound to the verified account if another tab switches later.
      const { data: { user: currentUser }, error: currentIdentityError } = await supabase.auth.getUser();
      if (!isCurrent(operationGeneration)) return;
      if (currentIdentityError || currentUser?.id !== expectedUserId) {
        invalidateSession();
        return;
      }

      const { error: updateError } = await auth.updateUser({ password });
      if (!isCurrent(operationGeneration)) return;
      if (updateError) {
        setState("idle");
        setError(updateError.status === 429 ? t.tooMany : t.passwordUpdateError);
        return;
      }
      passwordUpdatedRef.current = true;
      setPasswordUpdated(true);
      setPassword("");
      setConfirmation("");
    } catch {
      if (!isCurrent(operationGeneration)) return;
      setState("idle");
      setError(t.passwordUpdateError);
      return;
    } finally {
      if (isolated) await isolated.dispose();
      inFlight.current = false;
    }

    if (!isCurrent(operationGeneration)) return;
    await finishSignOut(operationGeneration);
    if (isCurrent(operationGeneration) && state !== "invalid") setState("idle");
  }

  const title = purpose === "recovery" ? t.recoveryPasswordTitle : t.setupPasswordTitle;
  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-gold/30 bg-gradient-to-br from-[#241e15] via-[#121110] to-ink p-5">
      <div>
        <h1 className="font-display text-[30px] leading-tight font-semibold text-white">{title}</h1>
        <p className="mt-1 text-[15px] text-cream/80">{t.passwordPolicyHint}</p>
      </div>
      <form onSubmit={save} className="flex flex-col gap-2.5">
        <label htmlFor="new-password" className="sr-only">{t.password}</label>
        <input
          id="new-password"
          name="password"
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t.password}
          className="h-[52px] rounded-full border border-white/10 bg-ink/60 px-5 text-base text-cream outline-none placeholder:text-mute focus:border-gold/60"
        />
        <label htmlFor="confirm-password" className="sr-only">{t.confirmPassword}</label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder={t.confirmPassword}
          className="h-[52px] rounded-full border border-white/10 bg-ink/60 px-5 text-base text-cream outline-none placeholder:text-mute focus:border-gold/60"
        />
        <button type="submit" disabled={state !== "idle"} className="gold-grad h-[52px] rounded-full text-base font-bold text-ink disabled:opacity-60">
          {state === "saving" ? t.savingPassword : t.savePassword}
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-[#E07A8F]">{error}</p>}
      {passwordUpdated && error && (
        <button type="button" onClick={() => finishSignOut(generation.current)} className="h-11 rounded-full border border-white/15 text-sm font-semibold text-cream">
          {t.retrySignOut}
        </button>
      )}
    </section>
  );
}
