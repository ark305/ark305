"use client";

import { useState } from "react";
import { askArk } from "@/lib/ai-client";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import Link from "next/link";
import { formatPrice } from "@/lib/mock-data";
import { IconSparkle } from "./icons";
import { useToast } from "./toast";

type Action = "post" | "reply" | "price";

// ARK IA en modo Ofrecer: escribe con los datos de tu perfil (vista previa; la IA completa llega en la Fase 5).
// Con tone="business" escribe como agencia: propuestas, seguimiento y márgenes.
export function SellerAi({ locale, name, handle, services, tone = "lifestyle" }: { locale: Locale; name: string; handle: string; services: { title: string; price: number }[]; tone?: "lifestyle" | "business" }) {
  const base = dict(locale).panel;
  const biz = dict(locale).biz.panel;
  const t = tone === "business" ? { ...base, aiOutputs: biz.aiOutputs, aiActions: biz.aiActions } : base;
  const { show } = useToast();
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);
  const [live, setLive] = useState(false);
  const [first, second = services[0]] = services;
  const money = (n: number) => formatPrice(n, locale);

  function preview(a: Action) {
    if (a === "post") return t.aiOutputs.post(name, handle, first.title, money(first.price));
    if (a === "reply") return t.aiOutputs.reply(handle, second.title, money(second.price));
    return t.aiOutputs.price(second.title, money(Math.round(second.price * 0.8)), money(Math.round(second.price * 1.6)));
  }

  async function run(a: Action) {
    setBusy(a);
    const r = await askArk<{ text: string }>({ kind: "seller", action: a, tone, locale, name, handle, services: [first, second, ...services.slice(2)] });
    setLive(!!r);
    setOut(r?.text ?? preview(a));
    setBusy(null);
  }

  async function copy() {
    if (!out) return;
    try {
      await navigator.clipboard.writeText(out);
      show(t.copied);
    } catch {
      show(dict(locale).common.copyFailed);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-[26px] border border-teal/25 p-4" style={{ background: "radial-gradient(120% 100% at 0% 0%, #7FC2B72e 0%, #7FC2B70a 55%, #0b0c0f 100%)" }}>
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <IconSparkle size={20} stroke="#7FC2B7" weight={1.9} /> {t.aiTitle}
        </h2>
        <p className="text-[13px] text-mute">{t.aiSub}</p>
      </div>
      {!first ? (
        <Link href="/perfil/editar" className="self-start rounded-full bg-teal px-4 py-2 text-[13px] font-bold text-ink">
          {t.needService}
        </Link>
      ) : (
      <div className="flex flex-wrap gap-2">
        {(Object.keys(t.aiActions) as Action[]).map((a) => (
          <button key={a} type="button" onClick={() => run(a)} disabled={!!busy} className="h-10 disabled:opacity-60 rounded-full border border-teal/30 bg-teal/10 px-3.5 text-[13px] font-semibold text-teal">
            {busy === a ? "…" : t.aiActions[a]}
          </button>
        ))}
      </div>
      )}
      {out && (
        <div className="flex flex-col gap-2 rounded-[18px_18px_18px_4px] border border-teal-line bg-teal-deep px-3.5 py-3" aria-live="polite">
          <p className="text-[15px] leading-normal whitespace-pre-line text-cream">{out}</p>
          <p className="text-[11px] text-mute">{live ? dict(locale).common.aiLive : dict(locale).day.aiPreview}</p>
          <button type="button" onClick={copy} className="self-end rounded-full bg-teal px-3.5 py-1.5 text-[13px] font-bold text-ink">
            {t.copy}
          </button>
        </div>
      )}
    </section>
  );
}
