"use client";

export function AccountLoadError({ retry }: { retry: () => void }) {
  return (
    <section role="alert" style={{ maxWidth: 430, margin: "0 auto", padding: "48px 24px", color: "#efe6d8", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28 }}>No pudimos cargar esta página</h1>
      <p>El servicio no está disponible en este momento. Esto no significa que tu perfil o tus datos se hayan borrado.</p>
      <button type="button" onClick={retry} style={{ minHeight: 48, padding: "12px 24px", marginTop: 16, border: 0, borderRadius: 24, background: "#7fc2b7", color: "#08090b", cursor: "pointer" }}>
        Reintentar
      </button>
    </section>
  );
}
