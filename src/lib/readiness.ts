export type Level = "beginner" | "intermediate" | "advanced";
export type Skill = "aptitude" | "coding" | "communication" | "interview";

export const LEVEL_BASELINE: Record<string, number> = { beginner: 20, intermediate: 40, advanced: 60 };
export const SKILL_WEIGHTS: Record<Skill, number> = { aptitude: 0.3, coding: 0.3, communication: 0.2, interview: 0.2 };
/** Attempts needed before performance fully replaces the self-reported baseline. */
export const FULL_CONFIDENCE_ATTEMPTS = 20;

export function skillScore(baseline: number, attempted: number, correct: number): number {
  if (attempted <= 0) return Math.round(baseline);
  const acc = (correct / attempted) * 100;
  const w = Math.min(attempted / FULL_CONFIDENCE_ATTEMPTS, 1);
  return Math.round(baseline + (acc - baseline) * w);
}

export function readinessScore(skills: Record<Skill, number>): number {
  let s = 0;
  for (const k of Object.keys(SKILL_WEIGHTS) as Skill[]) s += (skills[k] ?? 0) * SKILL_WEIGHTS[k];
  return Math.round(Math.max(0, Math.min(100, s)));
}

type ProgressRow = { module: string; topic: string; attempted: number; correct: number };
type ProfileLevels = { aptitude_level: string; coding_level: string; communication_level: string };

export function computeSkills(profile: ProfileLevels, progress: ProgressRow[]): Record<Skill, number> {
  const agg = (m: string) =>
    progress.filter((p) => p.module === m).reduce((a, p) => ({ att: a.att + p.attempted, cor: a.cor + p.correct }), { att: 0, cor: 0 });
  const base = (l: string) => LEVEL_BASELINE[l] ?? 20;
  const ap = agg("aptitude"), co = agg("coding"), cm = agg("communication"), iv = agg("interview");
  return {
    aptitude: skillScore(base(profile.aptitude_level), ap.att, ap.cor),
    coding: skillScore(base(profile.coding_level), co.att, co.cor),
    communication: skillScore(base(profile.communication_level), cm.att, cm.cor),
    interview: skillScore((base(profile.communication_level) + base(profile.coding_level)) / 2, iv.att, iv.cor),
  };
}

/** Topics with at least 2 attempts and accuracy below 60%, weakest first. */
export function weakTopics(progress: ProgressRow[], limit = 4) {
  return progress
    .filter((p) => p.attempted >= 2 && p.correct / p.attempted < 0.6)
    .map((p) => ({ ...p, accuracy: Math.round((p.correct / p.attempted) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}
