"use client";

import { useEffect, useRef, useState } from 'react';
import { entryPrice, getItem } from '@/lib/catalog';
import type { Locale } from '@/lib/locale';
import type { ServiceRequest } from '@/lib/service-requests';
import { acceptAddon, loadAddons, proposeAddon, type AcceptedAddon } from '@/lib/request-upsell';

const copy = {
  es: { consult: 'Consultar complemento con Meta', accept: 'Aceptar complemento', decline: 'No, gracias', refresh: 'Recargar complementos', loading: 'Consultando…', accepted: 'Complemento aceptado en la solicitud', demo: 'Estimación DEMO; no es una cotización ni disponibilidad real. La solicitud no es una reserva confirmada.', failed: 'No se pudo consultar o guardar. La aceptación no está confirmada; recarga antes de reintentar.', empty: 'No hay otro complemento compatible.', proposed: 'Propuesta de Meta basada en consulta del catálogo DEMO' },
  en: { consult: 'Ask Meta for a complement', accept: 'Accept complement', decline: 'No, thanks', refresh: 'Reload complements', loading: 'Checking…', accepted: 'Complement accepted on the request', demo: 'DEMO estimate; not a quote or live availability. This request is not a confirmed booking.', failed: 'Could not look up or save. Acceptance is not confirmed; reload before retrying.', empty: 'No other compatible complement.', proposed: 'Meta suggestion based on a DEMO catalog lookup' },
};

export function RequestUpsell({ request, token, locale }: { request: ServiceRequest; token: string; locale: Locale }) {
  const t = copy[locale];
  const [accepted, setAccepted] = useState<AcceptedAddon[]>([]);
  const [proposal, setProposal] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [uncertain, setUncertain] = useState(false);
  const [message, setMessage] = useState('');
  const generation = useRef(0);
  const locked = useRef(true);
  const identity = `${token}:${request.id}:${locale}`;
  const [previousIdentity, setPreviousIdentity] = useState(identity);
  if (previousIdentity !== identity) {
    setPreviousIdentity(identity);
    setAccepted([]); setProposal(null); setMessage(''); setUncertain(false); setBusy(true);
  }
  useEffect(() => {
    const lifecycle = generation;
    const current = ++lifecycle.current;
    locked.current = true;
    loadAddons(token, request.id).then(rows => { if (generation.current === current) setAccepted(rows); })
      .catch(() => { if (generation.current === current) { setMessage(copy[locale].failed); setUncertain(true); } })
      .finally(() => { if (generation.current === current) { setBusy(false); locked.current = false; } });
    return () => { lifecycle.current = current + 1; };
  }, [token, request.id, locale]);

  async function act(action: 'consult' | 'accept' | 'reload') {
    if (locked.current) return;
    locked.current = true; setBusy(true); setMessage('');
    const current = generation.current;
    try {
      if (action === 'consult') {
        const id = await proposeAddon(token, request.serviceId, request.guests, locale);
        if (generation.current !== current) return;
        if (id && !accepted.some(row => row.serviceId === id)) setProposal(id);
        else { setProposal(null); setMessage(t.empty); }
      } else if (action === 'accept' && proposal) {
        const row = await acceptAddon(token, request.id, proposal);
        if (generation.current !== current) return;
        setAccepted(rows => [...rows.filter(item => item.serviceId !== row.serviceId), row]); setProposal(null); setUncertain(false);
      } else {
        const rows = await loadAddons(token, request.id);
        if (generation.current !== current) return;
        setAccepted(rows); setUncertain(false);
        if (rows.some(row => row.serviceId === proposal)) setProposal(null);
      }
    } catch { if (generation.current === current) { setMessage(t.failed); if (action !== 'consult') setUncertain(true); } }
    finally { if (generation.current === current) { locked.current = false; setBusy(false); } }
  }
  const money = (amount: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(amount);
  return <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-2">
    {accepted.map(row => <p key={row.id}>{t.accepted}: {getItem(row.serviceId)?.name[locale]} · +{money(row.estimate.amount)} DEMO</p>)}
    <p className="text-xs text-mute">{t.demo}</p>
    {['received', 'in_progress'].includes(request.status) && !proposal && <button type="button" disabled={busy || uncertain} onClick={() => void act('consult')} className="text-left text-teal underline disabled:opacity-50">{t.consult}</button>}
    {proposal && <div className="flex flex-col gap-2"><p>{t.proposed}: {getItem(proposal)?.name[locale]} · +{money(entryPrice({ uid: proposal, id: proposal, time: '12:00', qty: 1, guests: request.guests }))} DEMO</p>
      <button type="button" disabled={busy || uncertain || !['received', 'in_progress'].includes(request.status)} onClick={() => void act('accept')}>{t.accept}</button>
      <button type="button" disabled={busy} onClick={() => setProposal(null)}>{t.decline}</button></div>}
    <button type="button" disabled={busy} onClick={() => void act('reload')} className="text-left text-teal underline disabled:opacity-50">{t.refresh}</button>
    {busy && <p role="status">{t.loading}</p>}{message && <p role="alert">{message}</p>}
  </div>;
}
