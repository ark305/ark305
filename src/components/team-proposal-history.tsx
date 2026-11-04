"use client";
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { supabaseReady } from '@/lib/supabase/config';
import { listTeamProposals, type TeamProposal } from '@/lib/team-proposals';

export function TeamProposalHistory({es,disabled,onRestore}:{es:boolean;disabled:boolean;onRestore:(value:TeamProposal)=>void}) {
  const [items,setItems]=useState<TeamProposal[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(false);
  const generation=useRef(0),active=useRef(false),user=useRef<string|null>(null);
  useEffect(()=>{
    if(!supabaseReady)return;
    const requestGeneration=generation, requestActive=active;
    const {data}=createClient().auth.onAuthStateChange((event,session)=>{
      const next=session?.user.id??null;
      if(event==='SIGNED_OUT'||next!==user.current){generation.current++;active.current=false;setItems([]);setBusy(false);setError('');setLoaded(false);}
      user.current=next;
    });
    return ()=>{requestGeneration.current++;requestActive.current=false;data.subscription.unsubscribe();};
  },[]);
  async function load(){
    if(active.current||disabled)return;
    active.current=true;const operation=++generation.current;setBusy(true);setError('');setItems([]);setLoaded(false);
    try {
      if(!supabaseReady)throw new Error('auth');
      const {data,error}=await createClient().auth.getSession();
      if(operation!==generation.current)return;
      if(error||!data.session?.access_token)throw new Error('auth');
      user.current=data.session.user.id;
      const rows=await listTeamProposals(data.session.access_token,user.current);
      if(operation===generation.current){setItems(rows);setLoaded(true);}
    } catch(cause){if(operation===generation.current)setError(cause instanceof Error&&cause.message==='auth'?(es?'Inicia sesión para consultar tu historial.':'Sign in to view your history.'):(es?'No se pudo cargar el historial. No se ha llamado a Meta.':'Could not load history. Meta was not called.'));}
    finally{if(operation===generation.current){active.current=false;setBusy(false);}}
  }
  return <section className="flex flex-col gap-3 rounded-[24px] border border-white/10 p-4">
    <h2 className="font-bold text-gold">{es?'Propuestas guardadas':'Saved proposals'}</h2>
    <p className="text-xs text-mute">{es?'Últimas 50 propuestas. Recuperarlas no consume IA.':'Latest 50 proposals. Restoring does not use AI.'}</p>
    <button type="button" disabled={busy||disabled} onClick={()=>void load()} className="rounded-full border border-gold/30 px-4 py-2 text-gold disabled:opacity-50">{busy?(es?'Cargando…':'Loading…'):(es?'Cargar historial':'Load history')}</button>
    {error&&<p role="alert" className="text-red-300">{error}</p>}
    {loaded&&!items.length&&<p className="text-mute">{es?'Todavía no hay propuestas guardadas.':'No saved proposals yet.'}</p>}
    {items.map(item=><button key={item.id} type="button" disabled={disabled||busy} onClick={()=>{if(user.current===item.ownerId)onRestore(item);}} className="rounded-xl border border-white/10 p-3 text-left text-cream disabled:opacity-50">
      <span className="block text-xs text-mute">{new Date(item.createdAt).toLocaleString(es?'es':'en')}</span>{item.prompt}
    </button>)}
  </section>;
}
