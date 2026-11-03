"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { INVITE_CODE } from "@/lib/private";
import { savePref } from "@/lib/prefs";
import { useToast } from "./toast";

// Código de invitación a ARK Private (demo): abre el nivel Súper Premium VIP.
export function PrivateGate({ labels }: { labels: { code: string; enter: string; badCode: string; codeHint: string; welcome: string } }) {
  const [code, setCode] = useState("");
  const router = useRouter();
  const { show } = useToast();
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().toUpperCase() !== INVITE_CODE) return show(labels.badCode);
    savePref("nivel", "vip");
    show(labels.welcome);
    start(() => router.refresh());
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor="invite" className="text-sm font-semibold text-mute">
        {labels.code}
      </label>
      <div className="flex gap-2">
        <input
          id="invite"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          className="h-12 min-w-0 grow rounded-full border border-white/10 bg-white/[0.05] px-4 text-base tracking-widest text-cream uppercase outline-none focus:border-gold/60"
        />
        <button type="submit" disabled={pending} className="gold-grad h-12 rounded-full px-5 text-[15px] font-bold text-ink disabled:opacity-60">
          {labels.enter}
        </button>
      </div>
      <p className="text-[11px] text-mute">{labels.codeHint}</p>
    </form>
  );
}
