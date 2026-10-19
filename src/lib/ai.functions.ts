import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FEEDBACK_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["clarity", "confidence", "grammar", "structure", "overall", "summary", "improvements"],
  properties: {
    clarity: { type: "number" }, confidence: { type: "number" }, grammar: { type: "number" }, structure: { type: "number" }, overall: { type: "number" },
    summary: { type: "string" }, improvements: { type: "array", items: { type: "string" } },
  },
};
const JUDGE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["compiled", "results", "feedback"],
  properties: {
    compiled: { type: "boolean" }, feedback: { type: "string" },
    results: { type: "array", items: { type: "object", additionalProperties: false, required: ["input", "expected", "actual", "passed"], properties: { input: { type: "string" }, expected: { type: "string" }, actual: { type: "string" }, passed: { type: "boolean" } } } },
  },
};

async function callAI(system: string, user: string, name: string, schema: object) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input: [{ role: "system", content: system }, { role: "user", content: user }],
      reasoning: { effort: "low" },
      store: false,
      stream: true,
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (res.status === 429) throw new Error("Too many requests right now — please try again in a minute.");
  if (res.status === 402) throw new Error("AI credits are exhausted for this workspace.");
  if (!res.ok || !res.body) throw new Error(`AI request failed (${res.status})`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try {
        const ev = JSON.parse(d);
        if (ev.type === "response.output_text.delta") out += ev.delta;
      } catch { /* ignore partial */ }
    }
  }
  return JSON.parse(out || "{}");
}

export type AnswerFeedback = {
  clarity: number; confidence: number; grammar: number; structure: number;
  overall: number; summary: string; improvements: string[];
};

export const evaluateAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { question: string; answer: string; modelAnswer?: string | null; kind: "communication" | "interview" }) => {
    if (!i.answer || i.answer.length > 6000) throw new Error("Answer must be 1–6000 characters");
    return i;
  })
  .handler(async ({ data }): Promise<AnswerFeedback> => {
    const sys = `You are a supportive but honest placement-training coach for Indian college students. Evaluate the student's ${data.kind === "interview" ? "mock-interview" : "communication"} answer. Return JSON: {"clarity":0-10,"confidence":0-10,"grammar":0-10,"structure":0-10,"overall":0-10,"summary":"2-3 sentences","improvements":["3-4 concrete, specific tips"]}. Score fairly: short, off-topic or copied answers score low.`;
    const user = `Question: ${data.question}\n\nReference strong answer (for your calibration only): ${data.modelAnswer ?? "n/a"}\n\nStudent answer:\n${data.answer}`;
    const r = await callAI(sys, user);
    const n = (x: unknown) => Math.max(0, Math.min(10, Math.round(Number(x) || 0)));
    return { clarity: n(r.clarity), confidence: n(r.confidence), grammar: n(r.grammar), structure: n(r.structure), overall: n(r.overall), summary: String(r.summary ?? ""), improvements: Array.isArray(r.improvements) ? r.improvements.map(String).slice(0, 5) : [] };
  });

export type JudgeResult = { results: { input: string; expected: string; actual: string; passed: boolean }[]; compiled: boolean; feedback: string };

export const judgeCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { prompt: string; language: string; code: string; tests: { input: unknown[]; output: unknown }[] }) => {
    if (i.code.length > 20000) throw new Error("Code too long");
    return i;
  })
  .handler(async ({ data }): Promise<JudgeResult> => {
    const sys = `You are a strict code judge. Mentally compile and execute the student's ${data.language} code exactly as written (do not fix bugs) against each test case by calling the required function with the given arguments. If it would not compile, set compiled=false and all passed=false. For SQL, judge whether the query correctly solves the problem; return a single result with input "query" and passed accordingly. Return JSON: {"compiled":bool,"results":[{"input":"...","expected":"...","actual":"...","passed":bool}],"feedback":"1-3 sentences"}.`;
    const user = `Problem:\n${data.prompt}\n\nTest cases (JSON): ${JSON.stringify(data.tests)}\n\nCode:\n${data.code}`;
    const r = await callAI(sys, user);
    return { compiled: !!r.compiled, results: Array.isArray(r.results) ? r.results.map((x: Record<string, unknown>) => ({ input: String(x.input), expected: String(x.expected), actual: String(x.actual), passed: !!x.passed })) : [], feedback: String(r.feedback ?? "") };
  });
