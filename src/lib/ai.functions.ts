import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MODES, buildTeacherSystem, LESSON_SCHEMA, parseIsoDuration, type ModeId, type TeachLesson } from "@/lib/teacher";

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
    const r = await callAI(sys, user, "feedback", FEEDBACK_SCHEMA);
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
    const r = await callAI(sys, user, "judge", JUDGE_SCHEMA);
    return { compiled: !!r.compiled, results: Array.isArray(r.results) ? r.results.map((x: Record<string, unknown>) => ({ input: String(x.input), expected: String(x.expected), actual: String(x.actual), passed: !!x.passed })) : [], feedback: String(r.feedback ?? "") };
  });

export const teachTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { topic: string; mode: ModeId; followUp?: string | null; previous?: string | null }) => {
    if (!i.topic?.trim() || i.topic.length > 1000) throw new Error("Topic must be 1–1000 characters");
    if (!MODES.some((m) => m.id === i.mode)) throw new Error("Unknown mode");
    if (i.followUp && i.followUp.length > 1000) throw new Error("Follow-up too long");
    return i;
  })
  .handler(async ({ data }): Promise<TeachLesson> => {
    const sys = buildTeacherSystem(data.mode, data.previous);
    const user = data.followUp
      ? `Lesson topic: ${data.topic}\nPrevious lesson summary: ${(data.previous ?? "").slice(0, 2000)}\nStudent follow-up question: ${data.followUp}\nAnswer the follow-up as a full lesson that stays within this topic.`
      : `Teach me: ${data.topic}`;
    const r = (await callAI(sys, user, "lesson", LESSON_SCHEMA)) as TeachLesson;
    r.practice = (r.practice ?? []).filter((p) => Array.isArray(p.options) && p.answer >= 0 && p.answer < p.options.length);
    return r;
  });

export type Video = { id: string; title: string; channel: string; duration: string; description: string; language: string };

export const findVideos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { query: string }) => ({ query: String(i.query ?? "").slice(0, 200) }))
  .handler(async ({ data }): Promise<{ configured: boolean; videos: Video[]; error?: string }> => {
    const key = process.env["YOUTUBE_API_KEY"];
    if (!key) return { configured: false, videos: [] };
    try {
      const q = encodeURIComponent(`${data.query} tutorial for beginners`);
      const s = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&safeSearch=strict&maxResults=6&relevanceLanguage=en&q=${q}&key=${key}`);
      if (!s.ok) return { configured: true, videos: [], error: "Video search is unavailable right now." };
      const sj = await s.json() as { items?: { id: { videoId: string } }[] };
      const ids = (sj.items ?? []).map((x) => x.id.videoId).filter(Boolean);
      if (!ids.length) return { configured: true, videos: [] };
      const d = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${ids.join(",")}&key=${key}`);
      const dj = await d.json() as { items?: { id: string; snippet: { title: string; channelTitle: string; description: string; defaultAudioLanguage?: string }; contentDetails: { duration: string }; status: { embeddable: boolean } }[] };
      return { configured: true, videos: (dj.items ?? []).filter((v) => v.status.embeddable).map((v) => ({
        id: v.id, title: v.snippet.title, channel: v.snippet.channelTitle, duration: parseIsoDuration(v.contentDetails.duration),
        description: v.snippet.description.slice(0, 160), language: v.snippet.defaultAudioLanguage ?? "",
      })) };
    } catch {
      return { configured: true, videos: [], error: "Video search failed." };
    }
  });
