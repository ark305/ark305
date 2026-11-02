"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { saveDiagnosis } from "@/lib/actions";
import { requestDiagnosisTurn, type DiagnosisConversationMessage, type DiagnosisProvenance } from "@/lib/diagnosis-ai";
import { sanitize, type Answers } from "@/lib/diagnosis";
import { writeDiagnosis } from "@/lib/diagnosis-store";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/client";
import { supabaseReady } from "@/lib/supabase/config";
import { IconArrow, IconMic, IconSparkle } from "./icons";

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  onresult: (event: { results: { 0: { transcript: string } }[] }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

export function DiagnosisChat({ locale, userId, initialAnswers }: {
  locale: Locale;
  userId: string;
  initialAnswers?: Answers | null;
}) {
  const t = dict(locale).diag;
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(() => sanitize(initialAnswers));
  const [messages, setMessages] = useState<DiagnosisConversationMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proposalReady, setProposalReady] = useState(false);
  const [provenance, setProvenance] = useState<DiagnosisProvenance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState(true);
  const [listening, setListening] = useState(false);
  const requestActive = useRef(false);
  const generation = useRef(0);
  const validRef = useRef(true);
  const rec = useRef<SpeechRec | null>(null);
  const end = useRef<HTMLDivElement>(null);

  const invalidateSession = useCallback(() => {
    if (!validRef.current) return;
    validRef.current = false;
    generation.current += 1;
    requestActive.current = false;
    setSessionValid(false);
    setAnswers({});
    setMessages([]);
    setText("");
    setProposalReady(false);
    setProvenance(null);
    setError(t.sessionChanged);
  }, [t.sessionChanged]);

  useEffect(() => {
    if (!supabaseReady) return;
    writeDiagnosis(null);
    const client = createClient();
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (session?.user?.id && session.user.id !== userId)) invalidateSession();
    });
    return () => subscription.unsubscribe();
  }, [invalidateSession, userId]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const speechOk = useSyncExternalStore(
    () => () => {},
    () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    () => false,
  );

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = text.trim();
    if (requestActive.current || !message || !sessionValid) return;
    if (!supabaseReady) {
      setError(t.aiUnavailable);
      return;
    }
    requestActive.current = true;
    const operation = ++generation.current;
    setBusy(true);
    setProposalReady(false);
    setProvenance(null);
    setError(null);
    try {
      const { data, error: sessionError } = await createClient().auth.getSession();
      if (generation.current !== operation || !validRef.current) return;
      if (sessionError || data.session?.user?.id !== userId || !data.session.access_token) {
        invalidateSession();
        return;
      }
      const result = await requestDiagnosisTurn({
        message,
        answers,
        conversation: messages.slice(-8),
        locale,
      }, data.session.access_token);
      if (generation.current !== operation || !validRef.current) return;
      setAnswers(result.answers);
      setMessages((current): DiagnosisConversationMessage[] =>
        [...current, { role: "user" as const, content: message }, { role: "assistant" as const, content: result.reply }].slice(-8));
      setText("");
      setProposalReady(result.complete);
      setProvenance(result.provenance);
    } catch (requestError) {
      if (generation.current !== operation || !validRef.current) return;
      const code = requestError instanceof Error ? requestError.message : "upstream";
      if (code === "auth") invalidateSession();
      else setError(code === "rate_limited" ? t.aiLimit : code === "quota_unavailable" ? t.aiUnavailable : t.aiError);
    } finally {
      if (generation.current === operation) {
        requestActive.current = false;
        setBusy(false);
      }
    }
  }

  async function confirmProposal() {
    if (!proposalReady || saving || !sessionValid) return;
    setSaving(true);
    setError(null);
    const operation = generation.current;
    try {
      const saved = await saveDiagnosis(answers, userId);
      if (generation.current !== operation || !validRef.current) return;
      if (!saved) {
        setError(t.saveError);
        return;
      }
      router.replace("/snapshot");
      router.refresh();
    } catch {
      if (generation.current === operation && validRef.current) setError(t.saveError);
    } finally {
      if (generation.current === operation) setSaving(false);
    }
  }

  function listen() {
    const browser = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) return;
    const recognition = new Constructor();
    recognition.lang = locale === "es" ? "es-US" : "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => setText(event.results[0][0].transcript.slice(0, 2000));
    recognition.onend = () => setListening(false);
    rec.current = recognition;
    setListening(true);
    recognition.start();
  }

  const lastReply = [...messages].reverse().find((message) => message.role === "assistant")?.content;

  return (
    <div className="flex min-h-[calc(100dvh-150px)] flex-col">
      <header className="sticky top-0 z-10 flex flex-col gap-2 bg-ink/90 px-5 pt-6 pb-3 backdrop-blur-xl">
        <span className="flex items-center gap-2 text-[15px] font-bold text-teal">
          <IconSparkle size={18} stroke="#7FC2B7" weight={1.9} /> {t.title}
        </span>
        <p className="text-[13px] leading-snug text-mute">{t.intro}</p>
      </header>

      <div className="flex grow flex-col gap-3 px-5 pt-4 pb-6" aria-live="polite">
        {messages.map((message, index) => (
          <p key={`${index}-${message.role}`} className={`max-w-[88%] whitespace-pre-wrap rounded-[18px] px-3.5 py-2.5 text-[15px] leading-snug ${message.role === "user" ? "self-end rounded-br-[4px] bg-cream text-ink" : "self-start rounded-bl-[4px] border border-teal-line bg-teal-deep text-cream"}`}>
            {message.content}
          </p>
        ))}
        {busy && <p role="status" className="self-start rounded-[18px] border border-teal-line bg-teal-deep px-3.5 py-2.5 text-[14px] text-teal">{t.thinking}</p>}
        {proposalReady && lastReply && (
          <section aria-labelledby="diagnosis-proposal-title" className="flex flex-col gap-3 rounded-[22px] border border-gold/30 bg-gold/[0.06] p-4">
            <h2 id="diagnosis-proposal-title" className="text-base font-bold text-gold">{t.proposalTitle}</h2>
            <p className="whitespace-pre-wrap text-[15px] leading-snug text-cream">{lastReply}</p>
            <p className="text-[12px] text-mute">{t.proposalDisclaimer}</p>
            <button type="button" onClick={confirmProposal} disabled={saving || !sessionValid} className="gold-grad min-h-12 rounded-full px-4 text-sm font-bold text-ink disabled:opacity-60">
              {saving ? t.savingProposal : t.saveProposal}
            </button>
          </section>
        )}
        {provenance && <p className="text-center text-[11px] text-mute">{provenance.provider} · {provenance.model} · {provenance.responseId}</p>}
        {error && <p role="alert" className="rounded-xl bg-[#E07A8F]/10 px-3 py-2 text-sm text-[#E07A8F]">{error}</p>}
        {!sessionValid && <p role="status" className="text-center text-xs text-mute">{t.signInAgain}</p>}
        <div ref={end} />
      </div>

      <form onSubmit={send} className="sticky bottom-[calc(100px+env(safe-area-inset-bottom))] z-10 flex items-end gap-2 border-t border-white/[0.07] bg-ink/95 px-4 pt-3 backdrop-blur-xl" style={{ paddingBottom: "16px" }}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, 2000))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(event as unknown as React.FormEvent<HTMLFormElement>);
            }
          }}
          placeholder={listening ? t.listening : t.typeHere}
          aria-label={t.typeHere}
          maxLength={2000}
          rows={2}
          disabled={busy || saving || !sessionValid}
          className="min-h-12 min-w-0 grow resize-none rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-3 text-base text-cream outline-none placeholder:text-mute focus:border-teal/60 disabled:opacity-60"
        />
        {speechOk && (
          <button type="button" aria-label={t.voice} onClick={listen} disabled={busy || !sessionValid} className={`flex size-12 shrink-0 items-center justify-center rounded-full ${listening ? "bg-teal" : "bg-white/10"}`}>
            <IconMic size={20} stroke={listening ? "#08090B" : "#EFE6D8"} weight={1.9} />
          </button>
        )}
        <button type="submit" aria-label={t.send} disabled={busy || saving || !sessionValid || !text.trim()} className="flex size-12 shrink-0 items-center justify-center rounded-full bg-teal disabled:opacity-50">
          <IconArrow size={20} stroke="#08090B" weight={2.2} />
        </button>
      </form>
    </div>
  );
}
