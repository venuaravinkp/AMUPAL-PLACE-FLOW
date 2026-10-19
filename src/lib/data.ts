import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeSkills, readinessScore, weakTopics } from "./readiness";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const id = u.user.id;
      const [p, r, s, pr, ac, rank] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("user_roles").select("role").eq("user_id", id),
        supabase.from("streaks").select("*").eq("user_id", id).maybeSingle(),
        supabase.from("progress").select("module,topic,attempted,correct").eq("user_id", id),
        supabase.from("achievements").select("*").eq("user_id", id).order("earned_at", { ascending: false }),
        supabase.rpc("my_rank"),
      ]);
      if (p.error) throw p.error;
      const roles = (r.data ?? []).map((x) => x.role);
      const progress = pr.data ?? [];
      const skills = computeSkills(p.data, progress);
      return {
        user: u.user,
        profile: p.data,
        roles,
        isStaff: roles.includes("admin") || roles.includes("trainer"),
        streak: s.data,
        progress,
        achievements: ac.data ?? [],
        rank: (rank.data as number | null) ?? null,
        skills,
        readiness: readinessScore(skills),
        weak: weakTopics(progress),
      };
    },
  });
}

export const CATEGORY_LABEL: Record<string, string> = {
  quant: "Quantitative Aptitude",
  logical: "Logical Reasoning",
  verbal: "Verbal Ability",
  di: "Data Interpretation",
  grammar: "Grammar & Vocabulary",
  self_intro: "Tell me about yourself",
  gd: "Group Discussion",
  email: "Email Writing",
  confidence: "Confidence Building",
  hr: "HR",
  technical: "Technical",
  company: "Company-specific",
  coding: "Coding",
  sql: "SQL",
};

export function fmtTime(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function startAttempt(args: {
  title: string; module?: string; category?: string; topic?: string; difficulty?: string; company?: string; count?: number; duration?: number; testId?: string;
}) {
  const { data, error } = await supabase.rpc("start_attempt", {
    _title: args.title,
    _module: args.module ?? undefined,
    _category: args.category ?? undefined,
    _topic: args.topic ?? undefined,
    _difficulty: args.difficulty ?? undefined,
    _company: args.company ?? undefined,
    _count: args.count ?? 10,
    _duration_min: args.duration ?? 15,
    _test_id: args.testId ?? undefined,
  });
  if (error) throw error;
  return data as string;
}
