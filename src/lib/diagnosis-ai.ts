import { FLOWS, WHO, nextQuestion, sanitize, type Answers } from "./diagnosis";

export type DiagnosisConversationMessage = { role: "assistant" | "user"; content: string };
export type DiagnosisProvenance = { provider: "Meta"; model: string; responseId: string };
export type DiagnosisTurnResult = {
  reply: string;
  answers: Answers;
  complete: boolean;
  provenance: DiagnosisProvenance;
};

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function answerQuestion(who: Answers["who"], key: string) {
  if (key === "who") return WHO;
  return who ? FLOWS[who].find((question) => question.id === key) : undefined;
}

function isValidAnswer(question: NonNullable<ReturnType<typeof answerQuestion>>, value: unknown) {
  if (question.kind === "text") return typeof value === "string" && value.length <= 120;
  if (question.kind === "single") return typeof value === "string" && (value === "" || question.options?.some((option) => option.id === value));
  return Array.isArray(value) && value.length <= 10 && new Set(value).size === value.length &&
    value.every((entry) => typeof entry === "string" && question.options?.some((option) => option.id === entry));
}

function isSubstantiveAnswer(question: NonNullable<ReturnType<typeof answerQuestion>>, value: unknown) {
  if (question.kind === "text") return typeof value === "string" && Boolean(value.trim()) && value.length <= 120;
  if (question.kind === "single") return typeof value === "string" && value.length > 0 && question.options?.some((option) => option.id === value);
  return Array.isArray(value) && value.length > 0 && value.length <= 10 && new Set(value).size === value.length &&
    value.every((entry) => typeof entry === "string" && question.options?.some((option) => option.id === entry));
}

export function validateDiagnosisAnswers(value: unknown): value is Answers {
  if (!isRecord(value)) return false;
  const who = value.who;
  if (who !== undefined && who !== "individual" && who !== "earner" && who !== "company" && who !== "enterprise") return false;
  if (who === undefined && Object.keys(value).some((key) => key !== "who")) return false;
  return Object.entries(value).every(([key, answer]) => {
    const question = answerQuestion(who as Answers["who"], key);
    return Boolean(question) && isValidAnswer(question!, answer);
  });
}

export function parseDiagnosisOutput(value: unknown, previous: Answers): Omit<DiagnosisTurnResult, "provenance"> | null {
  if (diagnosisOutputIssue(value, previous) || !isRecord(value)) return null;
  const patch = value.answers as Answers;
  const merged = patch.who && patch.who !== previous.who ? patch : { ...previous, ...patch };
  const answers = sanitize(merged);
  return { reply: (value.reply as string).trim(), answers, complete: nextQuestion(answers) === null };
}

type DiagnosisIssue = {
  field: string;
  code: "invalid_type" | "unknown_field" | "invalid_value" | "missing_who" | "wrong_flow" | "duplicate_items";
};
const knownAnswerFields = new Set([WHO, ...Object.values(FLOWS).flat()].map((question) => question.id));

// Return only trusted field names and fixed codes, never model/user values or keys.
export function diagnosisOutputIssue(value: unknown, previous: Answers): DiagnosisIssue | null {
  if (!isRecord(value)) return { field: "$", code: "invalid_type" };
  if (Object.keys(value).some((key) => key !== "reply" && key !== "answers")) return { field: "$", code: "unknown_field" };
  if (typeof value.reply !== "string" || !value.reply.trim() || value.reply.length > 1600) return { field: "reply", code: "invalid_value" };
  if (!isRecord(value.answers)) return { field: "answers", code: "invalid_type" };
  const patch = value.answers;
  const who = patch.who ?? previous.who;
  if (patch.who !== undefined && patch.who !== "individual" && patch.who !== "earner" && patch.who !== "company" && patch.who !== "enterprise") return { field: "answers.who", code: "invalid_value" };
  if (who === undefined && Object.keys(patch).some((key) => key !== "who")) return { field: "answers.who", code: "missing_who" };
  for (const [key, answer] of Object.entries(patch)) {
    if (!knownAnswerFields.has(key)) return { field: "answers", code: "unknown_field" };
    const field = `answers.${key}`;
    const question = answerQuestion(who as Answers["who"], key);
    if (!question) return { field, code: "wrong_flow" };
    if (Array.isArray(answer) && new Set(answer).size !== answer.length) return { field, code: "duplicate_items" };
    if (!isSubstantiveAnswer(question, answer)) return { field, code: "invalid_value" };
  }
  return null;
}

export async function requestDiagnosisTurn(
  input: { message: string; answers: Answers; conversation: DiagnosisConversationMessage[]; locale: string },
  token: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<DiagnosisTurnResult> {
  if (!token) throw new Error("auth");
  const response = await fetcher("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...input, task: "diagnosis" }),
    signal: AbortSignal.timeout(70000),
  });
  const data = await response.json().catch(() => ({})) as RecordValue;
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "upstream");
  const provenance = data.provenance as RecordValue | undefined;
  if (typeof data.reply !== "string" || !data.reply.trim() || data.reply.length > 1600 ||
      !validateDiagnosisAnswers(data.answers) || typeof data.complete !== "boolean" ||
      data.complete !== (nextQuestion(sanitize(data.answers)) === null) ||
      provenance?.provider !== "Meta" || typeof provenance.model !== "string" || !provenance.model ||
      typeof provenance.responseId !== "string" || !provenance.responseId) throw new Error("invalid_diagnosis");
  return {
    reply: data.reply,
    answers: sanitize(data.answers),
    complete: data.complete,
    provenance: provenance as unknown as DiagnosisProvenance,
  };
}
