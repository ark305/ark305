import { ARCHIE_ANON_KEY, ARCHIE_API_URL, ARCHIE_ENV, ARCHIE_PROJECT_ID } from "./config";

export class ArchieRequestError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

// Una consulta GraphQL a Archie. Con token: como la persona conectada. Sin token: como invitado (llave anon).
export async function gql<T>(query: string, variables?: Record<string, unknown>, token?: string | null): Promise<T> {
  const res = await fetch(`${ARCHIE_API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-project-id": ARCHIE_PROJECT_ID,
      environment: ARCHIE_ENV,
      // El token de la persona lleva "Bearer"; la llave anon ya trae su propio prefijo ("anon …").
      Authorization: token ? `Bearer ${token}` : ARCHIE_ANON_KEY,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as { data?: T; errors?: { message: string; extensions?: { code?: string } }[] } | null;
  if (!res.ok || !body || body.errors?.length) {
    const first = body?.errors?.[0];
    throw new ArchieRequestError(first?.message ?? `archie ${res.status}`, first?.extensions?.code ?? String(res.status));
  }
  return body.data as T;
}
