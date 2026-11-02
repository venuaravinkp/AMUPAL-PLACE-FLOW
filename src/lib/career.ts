import { z } from "zod";

export const resumeSchema = z.object({
  name: z.string().max(150), email: z.string().max(200), phone: z.string().max(50), location: z.string().max(150),
  role: z.string().max(150), summary: z.string().max(2000), education: z.string().max(5000), skills: z.string().max(3000),
  experience: z.string().max(8000), projects: z.string().max(8000), certifications: z.string().max(4000),
  achievements: z.string().max(4000), template: z.enum(["classic", "compact"]),
});
export type Resume = z.infer<typeof resumeSchema>;
export const emptyResume: Resume = { name: "", email: "", phone: "", location: "", role: "", summary: "", education: "", skills: "", experience: "", projects: "", certifications: "", achievements: "", template: "classic" };

export const ROLE_SKILLS: Record<string, string[]> = {
  computing: ["programming", "sql", "git", "testing", "data structures", "apis"],
  electronics: ["circuits", "embedded", "microcontrollers", "sensors", "instrumentation", "simulation"],
  mechanical: ["cad", "manufacturing", "materials", "quality", "maintenance", "safety"],
  civil: ["autocad", "estimation", "surveying", "construction", "quantity", "safety"],
  life_sciences: ["analysis", "mass balance", "quality", "laboratory", "process", "safety"],
  business: ["excel", "analysis", "finance", "research", "communication", "presentation"],
  science_arts: ["research", "analysis", "excel", "communication", "reporting", "presentation"],
};
const STOP = new Set("a an the and or of to in for on with as is are be will this that our your you we us have has at by from not all can must should into about more such their they it job role candidate work working required requirements preferred experience years year ability strong knowledge skills excellent team company responsibilities position qualification qualifications looking using including good based join bachelor's degree bachelor's bachelor".split(" "));
export function jobKeywords(description: string): string[] {
  const terms = description.toLowerCase().match(/[a-z][a-z0-9+#.-]{1,}/g) ?? [];
  const counts = new Map<string, number>();
  for (const word of terms) { const term = word.replace(/[.-]+$/, ""); if (!STOP.has(term) && term.length > 1) counts.set(term, (counts.get(term) ?? 0) + 1); }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([word]) => word);
}
export function containsKeyword(text: string, keyword: string) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(text);
}
export function assessResume(resume: Resume, description: string, department: string) {
  const text = [resume.summary, resume.education, resume.skills, resume.experience, resume.projects, resume.certifications, resume.achievements].join("\n");
  const checks = [
    { label: "Name and contact", passed: !!resume.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.email) },
    { label: "Target role and summary", passed: !!resume.role.trim() && resume.summary.trim().length >= 40 },
    { label: "Education", passed: resume.education.trim().length >= 20 },
    { label: "Skills", passed: resume.skills.split(/[,\n]/).filter((s) => s.trim()).length >= 3 },
    { label: "Project or experience evidence", passed: (resume.projects + resume.experience).trim().length >= 80 },
  ];
  const keywords = description.trim() ? jobKeywords(description) : ROLE_SKILLS[department] ?? ROLE_SKILLS.science_arts;
  const matched = keywords.filter((k) => containsKeyword(text, k));
  const missing = keywords.filter((k) => !matched.includes(k));
  const lines = [resume.experience, resume.projects, resume.achievements].join("\n").split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
  const actionPattern = /^(built|developed|designed|analysed|analyzed|created|implemented|improved|led|managed|tested|automated|reduced|increased|researched|prepared|measured|validated|optimised|optimized|delivered)\b/i;
  const strong = lines.filter((l) => actionPattern.test(l));
  const quantified = lines.filter((l) => /\d/.test(l));
  const points = { completeness: checks.filter((c) => c.passed).length * 8, alignment: keywords.length ? Math.round(matched.length / keywords.length * 30) : 0, evidence: (strong.length ? 10 : 0) + (quantified.length ? 10 : 0), readability: lines.length && lines.every((l) => l.length <= 250) ? 10 : 0 };
  const tips = checks.filter((c) => !c.passed).map((c) => `Complete: ${c.label.toLowerCase()}.`);
  if (missing.length) tips.push(`Only if accurate, add evidence for: ${missing.slice(0, 8).join(", ")}.`);
  if (!strong.length) tips.push("Start achievement bullets with a precise action, such as Designed, Analysed or Implemented.");
  if (!quantified.length) tips.push("Add an honest measurement: dataset size, time saved, accuracy or number of test cases.");
  if (lines.some((l) => l.length > 250)) tips.push("Split long entries into short bullets with one achievement each.");
  return { score: Object.values(points).reduce((a, b) => a + b, 0), checks, matched, missing, tips, points, weakBullets: lines.filter((l) => !actionPattern.test(l)).slice(0, 3) };
}

export const CATEGORIES = ["aptitude", "coding", "communication", "interview", "projects", "resume", "core"] as const;
export const taskSchema = z.object({ id: z.string().uuid().optional(), title: z.string().trim().min(1).max(200), category: z.enum(CATEGORIES), due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(validDate, "Choose a valid date"), minutes: z.number().int().min(5).max(240), completed: z.boolean() });
export function validDate(value: string) { const d = new Date(`${value}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value; }
export function dateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export function daysUntil(target: string, today: string) {
  if (!validDate(target) || !validDate(today)) return null;
  return Math.round((Date.parse(`${target}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
}
export function makeWeek(start: string, minutes: number, department: string, weakTopic?: string) {
  if (!validDate(start) || !Number.isInteger(minutes) || minutes < 15 || minutes > 240) throw new Error("Choose a valid start date and daily budget of 15–240 minutes");
  const focus: [typeof CATEGORIES[number], string][] = [
    ["aptitude", weakTopic ? `Revise ${weakTopic} and solve 5 questions` : "Revise percentages and solve 5 questions"],
    [department === "computing" ? "coding" : "core", department === "computing" ? "Solve an arrays problem and record edge cases" : `Review ${ROLE_SKILLS[department]?.slice(0, 2).join(" and ") ?? "department fundamentals"}`],
    ["communication", "Write and rehearse a 60-second introduction"], ["projects", "Complete the next project milestone"],
    ["interview", "Practise 3 HR and technical interview answers"], ["resume", "Update project achievements and check resume alignment"],
    ["aptitude", "Retake weak-topic questions and review mistakes"],
  ];
  return focus.flatMap(([category, title], index) => {
    const day = new Date(`${start}T00:00:00Z`); day.setUTCDate(day.getUTCDate() + index); const due_date = day.toISOString().slice(0, 10);
    const review = Math.min(15, Math.floor(minutes / 3));
    return [{ title, category, due_date, minutes: minutes - review, completed: false }, { title: "Revise yesterday’s notes and record one improvement", category: "core" as const, due_date, minutes: review, completed: false }];
  });
}
export function weightedCgpa(rows: { credits: number; grade: number }[], scale: number) {
  if (!Number.isFinite(scale) || scale <= 0 || !rows.length || rows.some((r) => !Number.isFinite(r.credits) || r.credits <= 0 || !Number.isFinite(r.grade) || r.grade < 0 || r.grade > scale)) return null;
  return rows.reduce((sum, r) => sum + r.credits * r.grade, 0) / rows.reduce((sum, r) => sum + r.credits, 0);
}
export function cgpaPercentage(cgpa: number, multiplier: number, offset: number) { const result = cgpa * multiplier + offset; return [cgpa, multiplier, offset].every(Number.isFinite) && cgpa >= 0 && multiplier > 0 && result >= 0 && result <= 100 ? result : null; }