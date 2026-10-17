"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { saveDiagnosis, saveSide } from "@/lib/actions";
import { allQuestions, answerLabel, buildSnapshot, nextQuestion, progress, type Answers, type Question } from "@/lib/diagnosis";
import { writeDiagnosis } from "@/lib/diagnosis-store";
import { dict } from "@/lib/dict";
import type { Locale } from "@/lib/locale";
import { IconArrow, IconCheck, IconMic, IconSparkle } from "./icons";
import { useToast } from "./toast";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Si la persona escribe o habla en vez de tocar un botón, buscamos la opción que mencionó.
function matchOptions(q: Question, text: string, locale: Locale): string[] {
  const t = norm(text);
  return (q.options ?? [])
    .filter((o) => {
      const words = norm(o.label[locale]).split(/\s+/).filter((w) => w.length > 3);
      return words.some((w) => t.includes(w)) || t.includes(norm(o.label[locale]));
    })
    .map((o) => o.id);
}

type SpeechRec = { lang: string; interimResults: boolean; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; onend: () => void; start: () => void; stop: () => void };

// Diagnóstico ARK: conversación corta que se adapta a cada respuesta.
export function DiagnosisChat({ locale, initial, onClose }: { locale: Locale; initial?: Answers | null; onClose?: () => void }) {
  const t = dict(locale).diag;
  const router = useRouter();
  const { show } = useToast();
  const [answers, setAnswers] = useState<Answers>(initial ?? {});
  const [multi, setMulti] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [, start] = useTransition();
  const rec = useRef<SpeechRec | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const finished = useRef(false);

  const q = nextQuestion(answers);
  const { done, total } = progress(answers);
  // El micrófono solo se muestra si el navegador lo soporta (se revisa ya en el teléfono).
  const speechOk = useSyncExternalStore(
    () => () => {},
    () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    () => false,
  );

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [answers, q]);

  // Al terminar: guardar, aplicar Personal o Business y mostrar el Snapshot.
  useEffect(() => {
    if (q || !answers.who || finished.current) return;
    finished.current = true;
    writeDiagnosis(answers);
    start(async () => {
      await saveDiagnosis(answers);
      router.push("/snapshot");
      onClose?.();
    });
  }, [q, answers, router, onClose]);

  function answer(value: string | string[]) {
    if (!q) return;
    const next = { ...answers, [q.id]: value } as Answers;
    setAnswers(next);
    writeDiagnosis(next);
    setMulti([]);
    setText("");
  }

  function sendText() {
    if (!q || !text.trim()) return;
    if (q.kind === "text") return answer(text.trim().slice(0, 120));
    const ids = matchOptions(q, text, locale);
    if (!ids.length) return show(locale === "es" ? "No te entendí. Elige una opción." : "I didn't catch that. Pick an option.");
    answer(q.kind === "single" ? ids[0] : ids);
  }

  function listen() {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = locale === "es" ? "es-US" : "en-US";
    r.interimResults = false;
    r.onresult = (e) => setText(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  }

  async function later() {
    writeDiagnosis(answers);
    const snap = buildSnapshot(answers);
    await saveSide(snap?.side ?? (answers.who && answers.who !== "individual" ? "business" : "personal"));
    onClose?.();
    router.refresh();
  }

  const history = allQuestions(answers).filter((x) => answers[x.id] !== undefined);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex flex-col gap-2 bg-ink/90 px-5 pt-6 pb-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[15px] font-bold text-teal">
            <IconSparkle size={18} stroke="#7FC2B7" weight={1.9} /> {t.title}
          </span>
          <button type="button" onClick={later} className="h-9 rounded-full px-3 text-[13px] font-semibold text-mute">
            {t.later}
          </button>
        </div>
        <div className="h-1 rounded-full bg-white/10">
          <div className="h-1 rounded-full bg-teal transition-[width] duration-300" style={{ width: `${Math.min(100, (done / total) * 100)}%` }} />
        </div>
      </header>

      <div className="flex grow flex-col gap-3 px-5 pt-4 pb-6">
        {history.length === 0 && <p className="text-[13px] text-mute">{t.intro}</p>}
        {history.map((h) => (
          <div key={h.id} className="flex flex-col gap-2">
            <p className="max-w-[85%] self-start rounded-[18px_18px_18px_4px] border border-teal-line bg-teal-deep px-3.5 py-2.5 text-[15px] leading-snug text-cream">{h.ask[locale]}</p>
            <p className="max-w-[85%] self-end rounded-[18px_18px_4px_18px] bg-cream px-3.5 py-2.5 text-[15px] leading-snug text-ink">
              {answerLabel(h, answers[h.id], locale) === "—" ? t.skip : answerLabel(h, answers[h.id], locale)}
            </p>
          </div>
        ))}
        {q && <p className="max-w-[85%] self-start rounded-[18px_18px_18px_4px] border border-teal-line bg-teal-deep px-3.5 py-2.5 text-[15px] leading-snug text-cream">{q.ask[locale]}</p>}
        {!q && answers.who && (
          <p className="self-start rounded-[18px_18px_18px_4px] border border-teal-line bg-teal-deep px-3.5 py-2.5 text-[15px] text-teal" role="status">
            {t.thinking}
          </p>
        )}
        <div ref={end} />
      </div>

      {q && (
        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-white/[0.07] bg-ink/95 px-5 pt-3 backdrop-blur-xl" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
          {q.options && (
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => {
                const on = multi.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={q.kind === "multi" ? on : undefined}
                    onClick={() => (q.kind === "single" ? answer(o.id) : setMulti((m) => (on ? m.filter((x) => x !== o.id) : [...m, o.id])))}
                    className={`flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold ${on ? "bg-teal text-ink" : "border border-white/15 bg-white/[0.04] text-cream"}`}
                  >
                    {on && <IconCheck size={14} stroke="#08090B" weight={2.6} />}
                    {o.label[locale]}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder={listening ? t.listening : q.placeholder?.[locale] ?? t.typeHere}
              aria-label={t.typeHere}
              className="h-12 min-w-0 grow rounded-full border border-white/10 bg-white/[0.05] px-4 text-base text-cream outline-none placeholder:text-mute focus:border-teal/60"
            />
            {speechOk && (
              <button type="button" aria-label={t.voice} onClick={listen} className={`flex size-12 shrink-0 items-center justify-center rounded-full ${listening ? "bg-teal" : "bg-white/10"}`}>
                <IconMic size={20} stroke={listening ? "#08090B" : "#EFE6D8"} weight={1.9} />
              </button>
            )}
            {text.trim() ? (
              <button type="button" aria-label={t.send} onClick={sendText} className="flex size-12 shrink-0 items-center justify-center rounded-full bg-teal">
                <IconArrow size={20} stroke="#08090B" weight={2.2} />
              </button>
            ) : q.kind === "multi" && multi.length ? (
              <button type="button" onClick={() => answer(multi)} className="h-12 shrink-0 rounded-full bg-teal px-5 text-[15px] font-bold text-ink">
                {t.done}
              </button>
            ) : (
              <button type="button" onClick={() => answer(q.kind === "multi" ? [] : "")} className="h-12 shrink-0 rounded-full px-3 text-[14px] font-semibold text-mute">
                {t.skip}
              </button>
            )}
          </div>
          <p className="text-center text-[11px] text-mute">{t.privacy}</p>
        </div>
      )}
    </div>
  );
}

// Primera visita: el Diagnóstico a pantalla completa (se puede terminar después).
export function DiagnosisGate({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(true);
  // /video llega por QR desde el evento y /developers se comparte con desarrolladoras: entran directo, sin el diagnóstico.
  const path = usePathname();
  if (!open || path.startsWith("/video") || path.startsWith("/developers")) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] overflow-y-auto bg-ink">
      <div className="mx-auto max-w-[430px]">
        <DiagnosisChat locale={locale} onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}
