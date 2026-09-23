// Guarda una preferencia (idioma, modo o nivel) en una cookie que el servidor puede leer.
export function savePref(name: "lang" | "mode" | "nivel" | "exp" | "lens", value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}
