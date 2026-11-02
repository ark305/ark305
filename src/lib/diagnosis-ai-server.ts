import { allQuestions, buildSnapshot, FLOWS, nextQuestion, sanitize, type Answers, type Question } from "./diagnosis";
import { parseDiagnosisOutput, validateDiagnosisAnswers, type DiagnosisConversationMessage } from "./diagnosis-ai";

export type DiagnosisTurnInput = {
  message: string;
  answers: Answers;
  conversation: DiagnosisConversationMessage[];
  locale: "es" | "en";
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function parseDiagnosisTurnInput(value: unknown): DiagnosisTurnInput | null {
  if (!isRecord(value) || Object.keys(value).some((key) => !["task", "locale", "message", "answers", "conversation"].includes(key)) ||
      value.task !== "diagnosis" || (value.locale !== "es" && value.locale !== "en") ||
      typeof value.message !== "string" || !value.message.trim() || value.message.length > 2000 ||
      !validateDiagnosisAnswers(value.answers)) return null;

  const conversation = value.conversation ?? [];
  if (!Array.isArray(conversation) || conversation.length > 8) return null;
  let totalLength = value.message.length;
  const normalized: DiagnosisConversationMessage[] = [];
  for (const message of conversation) {
    if (!isRecord(message) || Object.keys(message).some((key) => key !== "role" && key !== "content") ||
        (message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string" ||
        !message.content.trim() || message.content.length > 2000) return null;
    totalLength += message.content.length;
    if (totalLength > 10000) return null;
    normalized.push({ role: message.role, content: message.content });
  }

  return {
    message: value.message.trim(),
    answers: sanitize(value.answers),
    conversation: normalized,
    locale: value.locale,
  };
}

function schemaForQuestion(question: Question) {
  if (question.kind === "text") return { type: "string", minLength: 1, maxLength: 120, pattern: "\\S" };
  if (question.kind === "single") return { type: "string", enum: (question.options ?? []).map(({ id }) => id) };
  return {
    type: "array",
    description: "Choose each option at most once; duplicate entries are invalid.",
    minItems: 1,
    maxItems: 10,
    items: { type: "string", enum: (question.options ?? []).map(({ id }) => id) },
  };
}

export function buildDiagnosisResponseSchema(previous: Answers) {
  const branches = Object.entries(FLOWS).map(([who, questions]) => ({
    type: "object",
    additionalProperties: false,
    // A patch may omit who only when it continues the validated previous flow.
    required: previous.who === who ? [] : ["who"],
    properties: {
      who: { type: "string", enum: [who] },
      ...Object.fromEntries(questions.map((question) => [question.id, schemaForQuestion(question)])),
    },
  }));
  return {
    type: "object",
    additionalProperties: false,
    required: ["reply", "answers"],
    properties: {
      reply: { type: "string", minLength: 1, maxLength: 1600, pattern: "\\S" },
      answers: { anyOf: [
        ...branches,
        // Asking for clarification before selecting a flow must remain possible.
        { type: "object", additionalProperties: false, properties: {} },
      ] },
    },
  };
}

export const diagnosisResponseSchema = buildDiagnosisResponseSchema({});

export function buildDiagnosisMessages(input: DiagnosisTurnInput) {
  const describeQuestion = (question: Question) => ({
    id: question.id,
    ask: question.ask[input.locale],
    kind: question.kind,
    options: question.options?.map((option) => ({ id: option.id, label: option.label[input.locale] })),
  });
  const questions = allQuestions(input.answers)
    .filter((question) => !question.showIf || question.showIf(input.answers))
    .map(describeQuestion);
  const initialFlows = input.answers.who ? null : Object.fromEntries(
    Object.entries(FLOWS).map(([who, flow]) => [who, flow.map(describeQuestion)]),
  );
  const pending = nextQuestion(input.answers);
  const snapshot = pending ? null : buildSnapshot(input.answers);
  const system = [
    input.locale === "en"
      ? "You are ARK, an empathetic ARK305 onboarding guide. Speak clearly and warmly. The user is completing a guided conversation to receive a personalized proposal."
      : "Eres ARK, una guía empática de bienvenida de ARK305. Habla con claridad y calidez. La persona participa en una conversación guiada para recibir una propuesta personalizada.",
    "Return only JSON matching the supplied schema. `answers` is a patch containing only fields supported by the provided question catalog. Use an enum option ID, not its display label. First extract explicit answers from the latest user message into the patch; never infer answers, and omit unknown or unanswered fields. Update an earlier answer only when the latest user message clearly changes it. After applying the patch, choose the next unanswered field from the appropriate known flow and never re-ask a field answered by this turn. Any proposal must be grounded only in known facts from validated answers. Do not invent prices, providers, availability, bookings, business metrics, medical/legal advice, or permissions. The proposal is explanatory text only; actions and metrics are computed by the application.",
    `Locale: ${input.locale}. Current validated answers: ${JSON.stringify(input.answers)}. Known questions and allowed values: ${JSON.stringify(questions)}.`,
    ...(initialFlows ? [`First identify who from the user's explicit intent, then extract all explicitly supplied answers from that flow in the same patch. Do not ask again for details already provided. Available flows: ${JSON.stringify(initialFlows)}.`] : []),
    pending
      ? `After applying the answer patch from this message, ask one clear, conversational question for the next unanswered field in the appropriate known flow. Do not ask for ${pending.id} if the latest message answered it. You may acknowledge the user's message, but do not skip unknown details or fill unanswered fields. If the patch completes all known fields, offer a concise proposal grounded only in the validated answers; do not ask another intake question.`
      : `All known intake fields are answered. Use the deterministic application snapshot as grounding and offer or adjust a concise proposal. Do not claim the proposal is a booking or verified provider match. Current snapshot: ${JSON.stringify(snapshot)}.`,
  ].join("\n\n");
  return { system, messages: [...input.conversation, { role: "user" as const, content: input.message }] };
}

export function parseDiagnosisModelResponse(value: unknown, previous: Answers) {
  return parseDiagnosisOutput(value, previous);
}
