export const MODES = [
  { id: "simple", label: "Explain Simply", rule: "Use very plain language, short sentences and an everyday analogy. Avoid jargon." },
  { id: "shortcut", label: "Shortcut Method", rule: "Focus on the fastest valid shortcut or formula used in placement exams, and when it does NOT apply." },
  { id: "steps", label: "Step-by-Step", rule: "Break everything into small numbered steps; each step does exactly one thing." },
  { id: "example", label: "Example-Based", rule: "Teach mainly through 2-3 progressively harder worked examples, deriving the rule from them." },
  { id: "visual", label: "Visual Learning", rule: "Describe mental pictures, tables and simple ASCII diagrams (in the steps) so the student can 'see' the idea." },
  { id: "again", label: "Teach Me Again", rule: "The student did not understand the previous explanation. Explain the SAME concept with a completely different angle, analogy and example. Do not reuse wording or examples from the previous answer." },
  { id: "exam", label: "Exam Preparation", rule: "Target timed aptitude/placement exams: typical question patterns, time-saving tricks, traps examiners set." },
  { id: "interview", label: "Interview Preparation", rule: "Target interviews: how to explain this verbally in 60 seconds, likely follow-up questions, and what interviewers look for." },
] as const;
export type ModeId = (typeof MODES)[number]["id"];

export type TeachLesson = {
  title: string; explanation: string; concepts: string[]; steps: string[]; shortcut: string;
  example: { problem: string; solution: string }; application: string; mistakes: string[];
  practice: { q: string; options: string[]; answer: number; hint: string; explanation: string }[];
  summary: string; videoQuery: string;
};

export function buildTeacherSystem(mode: ModeId, previous?: string | null) {
  const m = MODES.find((x) => x.id === mode) ?? MODES[0];
  let s = `You are the Smart AI Teacher of AMUPAL PLACE FLOW, a placement-training platform for Indian college students. Teaching mode: ${m.label}. ${m.rule}
Return a complete lesson: simple explanation, basic concepts needed, step-by-step solution, a valid shortcut/formula (empty string if none exists — never invent one), an easy worked example, a real-world or industry application, common mistakes, exactly 3 multiple-choice practice questions (4 options, 0-based correct index, a hint that does not give away the answer, and an explanation), a short revision summary, and a short YouTube search query for beginner videos on this topic. Be accurate; if the question is ambiguous, state your assumption in the explanation.`;
  if (mode === "again" && previous) s += `\nPrevious explanation the student did not understand (do NOT repeat it):\n${previous.slice(0, 3000)}`;
  return s;
}

export const LESSON_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["title", "explanation", "concepts", "steps", "shortcut", "example", "application", "mistakes", "practice", "summary", "videoQuery"],
  properties: {
    title: { type: "string" }, explanation: { type: "string" },
    concepts: { type: "array", items: { type: "string" } }, steps: { type: "array", items: { type: "string" } },
    shortcut: { type: "string" },
    example: { type: "object", additionalProperties: false, required: ["problem", "solution"], properties: { problem: { type: "string" }, solution: { type: "string" } } },
    application: { type: "string" }, mistakes: { type: "array", items: { type: "string" } },
    practice: { type: "array", items: { type: "object", additionalProperties: false, required: ["q", "options", "answer", "hint", "explanation"], properties: { q: { type: "string" }, options: { type: "array", items: { type: "string" } }, answer: { type: "integer" }, hint: { type: "string" }, explanation: { type: "string" } } } },
    summary: { type: "string" }, videoQuery: { type: "string" },
  },
};

export function parseIsoDuration(iso: string) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return "";
  const [h, mi, s] = [m[1], m[2], m[3]].map((x) => Number(x ?? 0));
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${String(mi).padStart(2, "0")}:${ss}` : `${mi}:${ss}`;
}
