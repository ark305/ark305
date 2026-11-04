"use client";

import { useRef, useState } from "react";
import { uploadPhoto } from "@/lib/upload";
import { Photo } from "./photo";

type Labels = { add: string; change: string; remove: string; uploading: string; uploadError: string };

// Elegir y subir una foto. Guarda la dirección en un campo oculto del formulario.
export function PhotoPicker({
  name,
  uid,
  kind,
  initial,
  labels,
  shape = "circle",
  label,
}: {
  name: string;
  uid: string;
  kind: string;
  initial: string | null;
  labels: Labels;
  shape?: "circle" | "wide";
  label: string;
}) {
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(false);
    try {
      setUrl(await uploadPhoto(file, uid, kind));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-mute">{label}</span>
      <div className={`flex gap-3 ${shape === "circle" ? "items-center" : "flex-col"}`}>
        <span className={`relative block shrink-0 overflow-hidden bg-raised ${shape === "circle" ? "size-20 rounded-full" : "h-32 w-full rounded-[20px]"}`}>
          <Photo src={url} name="" sizes={shape === "circle" ? "80px" : "400px"} />
          {busy && <span className="absolute inset-0 flex items-center justify-center bg-ink/70 text-xs text-cream">{labels.uploading}</span>}
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="h-10 rounded-full bg-cream px-4 text-sm font-bold text-ink disabled:opacity-60">
            {url ? labels.change : labels.add}
          </button>
          {url && (
            <button type="button" onClick={() => setUrl(null)} className="h-10 rounded-full border border-white/15 px-4 text-sm text-cream">
              {labels.remove}
            </button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-[#E07A8F]">
          {labels.uploadError}
        </p>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="hidden" />
      <input type="hidden" name={name} value={url ?? ""} />
    </div>
  );
}
