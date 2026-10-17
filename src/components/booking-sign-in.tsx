"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function BookingSignIn({ labels: l }: { labels: { signIn: string; email: string; sendLink: string; linkSent: string; error: string } }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/reservar` },
    });
    setState(error ? "error" : "sent");
  }

  if (state === "sent") return <p className="rounded-xl bg-emerald-400/10 px-3 py-2.5 text-[13px] text-emerald-200">{l.linkSent}</p>;
  return (
    <form onSubmit={send} className="flex flex-col gap-2">
      <p className="text-[12px] text-mute">{l.signIn}</p>
      <div className="flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={l.email} autoComplete="email" className="h-11 grow rounded-full border border-white/10 bg-ink/60 px-4 text-[14px] text-white" />
        <button type="submit" disabled={state === "busy"} className="h-11 shrink-0 rounded-full bg-cream px-4 text-[14px] font-bold text-ink disabled:opacity-60">{l.sendLink}</button>
      </div>
      {state === "error" && <p className="text-[12px] text-rose-300">{l.error}</p>}
    </form>
  );
}
