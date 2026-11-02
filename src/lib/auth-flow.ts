const LOCAL_AUTH_FALLBACK = "/perfil";
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

export function safeLocalNext(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return LOCAL_AUTH_FALLBACK;
  }

  let decoded = value;
  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
  } catch {
    return LOCAL_AUTH_FALLBACK;
  }

  if (decoded.startsWith("//") || decoded.includes("\\") || /[\u0000-\u001f\u007f]/.test(decoded)) return LOCAL_AUTH_FALLBACK;
  try {
    const url = new URL(value, "https://ark305.invalid");
    if (url.origin !== "https://ark305.invalid" || !url.pathname.startsWith("/") || url.pathname.startsWith("//")) {
      return LOCAL_AUTH_FALLBACK;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return LOCAL_AUTH_FALLBACK;
  }
}

export function isPasswordAllowed(password: unknown): password is string {
  return typeof password === "string" && password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
}

export const passwordPolicy = { minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH } as const;
