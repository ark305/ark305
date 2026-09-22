"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastApi = { show: (message: string) => void; soonMessage: string };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ soonMessage, children }: { soonMessage: string; children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((m: string) => {
    setMessage(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={{ show, soonMessage }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[108px] z-50 flex justify-center px-4"
      >
        {message && (
          <span className="rounded-full border border-line-2 bg-nav px-4 py-2.5 text-sm font-semibold text-cream shadow-lg">
            {message}
          </span>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}

// Botón para funciones que todavía no existen: avisa "Muy pronto".
export function SoonButton({
  className,
  children,
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type">) {
  const { show, soonMessage } = useToast();
  return (
    <button type="button" className={className} onClick={() => show(soonMessage)} {...rest}>
      {children}
    </button>
  );
}
