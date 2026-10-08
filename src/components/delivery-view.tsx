"use client";

import { useEffect, useState } from "react";
import { dict } from "@/lib/dict";
import { cartTotals, getStore, storeCats, stores, TIPS, type Store, type StoreCat } from "@/lib/delivery";
import { deliveryStore, orderStep, STEP_MS, useDelivery } from "@/lib/delivery-store";
import type { Locale } from "@/lib/locale";
import { IconChevron, IconScooter } from "./icons";
import { Sheet } from "./sheet";
import { useToast } from "./toast";

const usd = (n: number) => `$${n.toFixed(2)}`;

// Delivery: locales, carrito con propina y seguimiento del pedido.
export function DeliveryView({ locale }: { locale: Locale }) {
  const t = dict(locale).delivery;
  const { show } = useToast();
  const s = useDelivery();
  const addr = s.addr || t.defaultAddr;

  const [cat, setCat] = useState<StoreCat>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [editAddr, setEditAddr] = useState(false);
  const [draft, setDraft] = useState("");
  const closeStore = () => setOpenId(null);
  const closeCart = () => setCartOpen(false);

  // Reloj para el seguimiento simulado.
  const [now, setNow] = useState(() => Date.now());
  const step = s.order ? orderStep(s.order, now) : 0;
  useEffect(() => {
    if (!s.order || orderStep(s.order, Date.now()) >= 3) return;
    const id = setInterval(() => setNow(Date.now()), STEP_MS / 3);
    return () => clearInterval(id);
  }, [s.order]);

  const cartStore = s.store ? getStore(s.store) : null;
  const count = Object.values(s.qty).reduce((a, b) => a + b, 0);
  const totals = cartStore ? cartTotals(cartStore, s.qty, s.tip) : null;
  const open = openId ? getStore(openId) : null;

  // Pedido en curso.
  if (s.order) {
    const o = s.order;
    return (
      <div className="flex flex-col gap-6 px-4 pt-8">
        <header>
          <h1 className="font-display text-[40px] leading-[1.02] font-semibold text-white">{t.yourOrder}</h1>
          <p className="mt-3 text-base text-mute">
            {o.store} · {usd(o.total)}
          </p>
        </header>
        <section className="flex flex-col gap-4 rounded-[26px] border border-line bg-card p-5">
          <p className="text-sm font-semibold text-mute">{t.orderCode(o.code)}</p>
          <p className="text-2xl font-extrabold text-white" aria-live="polite">
            {t.steps[step]}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full rounded-full bg-teal transition-[width] duration-700" style={{ width: `${((step + 1) / 4) * 100}%` }} />
          </div>
          <ol className="grid grid-cols-4 gap-1 text-[11px] leading-tight font-semibold text-mute">
            {t.steps.map((x, i) => (
              <li key={x} className={`${i <= step ? "text-teal" : ""} ${i === 0 ? "text-left" : i === 3 ? "text-right" : "text-center"}`}>
                {x}
              </li>
            ))}
          </ol>
          <div className="flex items-center gap-3 rounded-[18px] bg-raised/50 p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-deep text-base font-bold text-teal">J</span>
            <p className="text-sm text-cream/85">
              <b className="text-white">Jorge</b> · {t.courier}
              <br />
              {t.courierMsg(step, o.addr)}
            </p>
          </div>
          {step >= 3 && (
            <button type="button" onClick={() => deliveryStore.done()} className="gold-grad h-12 rounded-full text-[15px] font-bold text-ink">
              {t.another}
            </button>
          )}
        </section>
        <p className="text-[12px] text-mute">{t.trackNote}</p>
      </div>
    );
  }

  const shown = stores.filter((x) => cat === "all" || x.cat === cat);

  return (
    <div className="flex flex-col gap-6 px-4 pt-8">
      <header>
        <h1 className="font-display text-[40px] leading-[1.02] font-semibold text-white">{t.title}</h1>
        <p className="mt-3 text-base leading-normal text-mute">{t.sub}</p>
      </header>

      <section className="flex items-center gap-3 rounded-[20px] border border-line bg-card p-3.5">
        <IconScooter size={22} stroke="#7FC2B7" weight={1.9} />
        {editAddr ? (
          <form
            className="flex grow items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) deliveryStore.setAddr(draft.trim());
              setEditAddr(false);
            }}
          >
            <input
              autoFocus
              aria-label={t.addrAsk}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoComplete="street-address"
              className="h-10 min-w-0 grow rounded-[12px] border border-white/10 bg-ink/60 px-3 text-[15px] text-cream outline-none focus:border-teal/60"
            />
            <button type="submit" className="h-10 shrink-0 rounded-full bg-cream px-4 text-sm font-bold text-ink">
              OK
            </button>
          </form>
        ) : (
          <>
            <span className="flex grow flex-col">
              <span className="text-[12px] text-mute">{t.deliverTo}</span>
              <span className="text-[15px] font-bold text-white">{addr}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setDraft(s.addr);
                setEditAddr(true);
              }}
              className="h-9 shrink-0 rounded-full border border-white/15 px-3.5 text-[13px] font-semibold text-cream"
            >
              {t.change}
            </button>
          </>
        )}
      </section>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {storeCats.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={cat === c.id}
            onClick={() => setCat(c.id)}
            className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${cat === c.id ? "bg-cream text-ink" : "border border-white/10 bg-white/[0.04] text-cream"}`}
          >
            {c.name[locale]}
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-2.5">
        {shown.length === 0 && <p className="py-8 text-center text-mute">{t.empty}</p>}
        {shown.map((x) => (
          <button key={x.id} type="button" onClick={() => setOpenId(x.id)} className="flex items-center gap-3.5 rounded-[22px] border border-line bg-card p-3.5 text-left">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[15px] font-display text-2xl font-semibold text-white" style={{ background: x.color }}>
              {x.name[0]}
            </span>
            <span className="flex grow flex-col">
              <span className="text-[16px] font-bold text-white">{x.name}</span>
              <span className="text-[13px] text-mute">{x.desc[locale]}</span>
              <span className="text-[12px] text-cream/70">
                {x.eta} · {t.fee(usd(x.fee))}
              </span>
            </span>
            <IconChevron size={18} stroke="#9A9EA6" weight={2} />
          </button>
        ))}
      </section>

      {cartStore && count > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="gold-grad sticky z-30 flex h-14 items-center justify-between rounded-full px-5 text-[15px] font-bold text-ink shadow-[0_14px_40px_-12px_rgb(0_0_0/0.8)]"
          style={{ bottom: "calc(104px + env(safe-area-inset-bottom))" }}
        >
          <span>{t.viewCart(count)}</span>
          <span>{usd(totals!.sub)}</span>
        </button>
      )}

      {open && (
        <StoreSheet
          key={open.id}
          store={open}
          locale={locale}
          qty={s.store === open.id ? s.qty : {}}
          onClose={closeStore}
          onCheckout={() => {
            setOpenId(null);
            setCartOpen(true);
          }}
          otherStore={!!s.store && s.store !== open.id}
        />
      )}

      {cartOpen && cartStore && totals && (
        <Sheet label={t.cart} closeLabel={t.close} onClose={closeCart}>
          <h2 className="pr-10 text-2xl font-extrabold text-white">{t.cart}</h2>
          <p className="text-sm text-mute">
            {cartStore.name} → {addr}
          </p>
          <ul className="flex flex-col gap-2">
            {cartStore.menu.map((it, i) =>
              s.qty[i] ? (
                <li key={i} className="flex justify-between text-[15px] text-cream">
                  <span>
                    {s.qty[i]} × {it.name[locale]}
                  </span>
                  <span className="font-semibold tabular-nums">{usd(it.price * s.qty[i])}</span>
                </li>
              ) : null,
            )}
          </ul>
          <p className="mt-1 text-sm font-semibold text-white">{t.tip}</p>
          <div className="grid grid-cols-4 gap-2">
            {TIPS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={s.tip === p}
                onClick={() => deliveryStore.setTip(p)}
                className={`h-10 rounded-full text-sm font-semibold ${s.tip === p ? "bg-cream text-ink" : "border border-white/15 text-cream"}`}
              >
                {p === 0 ? t.noTip : `${p * 100}%`}
              </button>
            ))}
          </div>
          <dl className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-raised/40 p-3.5 text-sm text-cream/85">
            {[
              [t.items, totals.sub],
              [t.shipping, totals.fee],
              [t.service, totals.svc],
              [t.tipLine, totals.tip],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between">
                <dt>{k}</dt>
                <dd className="tabular-nums">{usd(v as number)}</dd>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-extrabold text-white">
              <dt>{t.total}</dt>
              <dd className="tabular-nums">{usd(totals.total)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => {
              deliveryStore.place({ store: cartStore.name, total: totals.total, addr });
              setCartOpen(false);
              show(t.sent);
              window.scrollTo({ top: 0 });
            }}
            className="gold-grad flex h-12 items-center justify-between rounded-full px-5 text-[15px] font-bold text-ink"
          >
            <span>{t.order}</span>
            <span>{usd(totals.total)}</span>
          </button>
          <p className="text-[12px] text-mute">{t.note}</p>
        </Sheet>
      )}
    </div>
  );
}

function StoreSheet({
  store,
  locale,
  qty,
  otherStore,
  onClose,
  onCheckout,
}: {
  store: Store;
  locale: Locale;
  qty: Record<number, number>;
  otherStore: boolean;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const t = dict(locale).delivery;
  const sub = store.menu.reduce((a, it, i) => a + it.price * (qty[i] ?? 0), 0);

  function change(i: number, q: number) {
    if (q > 0 && otherStore && Object.keys(qty).length === 0 && !window.confirm(t.otherStore)) return;
    deliveryStore.setQty(store.id, i, q);
  }

  return (
    <Sheet label={store.name} closeLabel={t.close} onClose={onClose}>
      <h2 className="pr-10 text-2xl font-extrabold text-white">{store.name}</h2>
      <p className="text-sm text-mute">
        {store.desc[locale]} · {store.eta} · {t.fee(usd(store.fee))}
      </p>
      <ul className="flex flex-col gap-2">
        {store.menu.map((it, i) => {
          const q = qty[i] ?? 0;
          return (
            <li key={i} className="flex items-center gap-3 rounded-[18px] border border-line bg-raised/40 p-3">
              <span className="flex grow flex-col">
                <span className="text-[15px] font-semibold text-white">{it.name[locale]}</span>
                <span className="text-[13px] text-cream/70">{usd(it.price)}</span>
              </span>
              {q > 0 && (
                <>
                  <button type="button" aria-label={t.removeOne} onClick={() => change(i, q - 1)} className="flex size-9 items-center justify-center rounded-full bg-white/10 text-lg text-cream">
                    −
                  </button>
                  <span className="w-5 text-center font-bold text-white tabular-nums">{q}</span>
                </>
              )}
              <button type="button" aria-label={t.add} onClick={() => change(i, q + 1)} className="flex size-9 items-center justify-center rounded-full bg-cream text-lg font-bold text-ink">
                +
              </button>
            </li>
          );
        })}
      </ul>
      {sub > 0 && (
        <button type="button" onClick={onCheckout} className="gold-grad flex h-12 items-center justify-between rounded-full px-5 text-[15px] font-bold text-ink">
          <span>{t.checkout}</span>
          <span>{usd(sub)}</span>
        </button>
      )}
    </Sheet>
  );
}
